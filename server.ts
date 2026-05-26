/** @format */

import "./src/lib/env";
import fetch from "cross-fetch";
(global as any).fetch = fetch;
(globalThis as any).fetch = fetch;
import fs from "fs";
// Low-level write to stderr to bypass console redirection
fs.writeSync(
	2,
	`[BOOT] Server process starting at ${new Date().toISOString()}\n`,
);
fs.writeSync(2, `[BOOT] CWD: ${process.cwd()}\n`);
fs.writeSync(2, `[BOOT] DB_USER: ${process.env.DB_USER || "NOT SET"}\n`);

import crypto from "crypto";
import http from "http";
import cors from "cors";
import express, { Request, Response } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic import for GoogleGenAI to prevent startup failure if package missing
let GoogleGenAIInstance: any = null;
let GoogleGenerativeAI: any = null;

import {
	deleteProvisionedWordPressMultisiteSite,
	provisionWordPressMultisiteSite,
	ProvisionWordPressSiteRequest,
} from "./src/lib/wordpress-provisioning";

import { WebsiteSchema } from "./src/types";
import {
	sendOutreachViaCallHippo,
	OutreachRequest,
	OutreachResponse,
} from "./src/lib/callhippo-service";
import { pool, initializeDatabase } from "./src/lib/db";
import { startProvisioningWorker } from "./src/lib/provisioning-worker";
import { deleteProvisionedWordPressSite } from "./src/lib/provisioning-engine";
import { buildPremiumPageContent } from "./src/lib/premium-site-builder";
import { generateHomepageViaDirectVertexPrompt } from "./src/lib/direct-vertex-homepage-generation";
import { generateSearchKeywords } from "./src/lib/search-keyword-expander";
import { sendOTPEmail, sendResetPasswordEmail } from "./src/lib/mailer";

const app = express();
const PORT = process.env.PORT || 5001;

const logStderr = (message: string) => {
	fs.writeSync(2, `${message}\n`);
};

let lastGeminiCallTime = 0;
let geminiQueueChain = Promise.resolve();

async function throttleGemini() {
	const currentQueue = geminiQueueChain;
	let resolveLock: () => void;
	const lockPromise = new Promise<void>((resolve) => {
		resolveLock = resolve;
	});
	geminiQueueChain = lockPromise;

	await currentQueue;
	const now = Date.now();
	const elapsed = now - lastGeminiCallTime;
	if (elapsed < 1000) {
		const waitTime = 1000 - elapsed;
		logStderr(
			`[Gemini Throttle] Queue waiting ${waitTime}ms to maintain 1s gap...`,
		);
		await new Promise((resolve) => setTimeout(resolve, waitTime));
	}
	lastGeminiCallTime = Date.now();
	resolveLock!();
}

app.use(
	cors({
		origin: true, // reflect request origin — allows any origin with credentials
		credentials: true,
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"x-debug-generation-id",
			"x-debug-generation-fallback",
		],
		exposedHeaders: ["x-debug-generation-id", "x-debug-generation-fallback"],
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	}),
);
app.use(express.json({ limit: "50mb" }));

// Create public directories if they do not exist
const publicDir = path.join(process.cwd(), "public");
const imagesDir = path.join(publicDir, "generated-images");
if (!fs.existsSync(publicDir)) {
	fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
	fs.mkdirSync(imagesDir, { recursive: true });
}
app.use("/public", express.static(publicDir));

const JWT_SECRET = process.env.ENCRYPTION_KEY || "default-secret-key-12345";

function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16).toString("hex");
	const hash = crypto.scryptSync(password, salt, 64).toString("hex");
	return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
	try {
		const [salt, hash] = storedHash.split(":");
		if (!salt || !hash) return false;
		const verifyHash = crypto.scryptSync(password, salt, 64).toString("hex");
		return crypto.timingSafeEqual(
			Buffer.from(hash, "hex"),
			Buffer.from(verifyHash, "hex"),
		);
	} catch {
		return false;
	}
}

function generateToken(payload: { userId: string }): string {
	const header = Buffer.from(
		JSON.stringify({ alg: "HS256", typ: "JWT" }),
	).toString("base64url");
	const body = Buffer.from(
		JSON.stringify({
			...payload,
			exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
		}),
	).toString("base64url");
	const signature = crypto
		.createHmac("sha256", JWT_SECRET)
		.update(`${header}.${body}`)
		.digest("base64url");
	return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { userId: string } | null {
	try {
		const [header, body, signature] = token.split(".");
		if (!header || !body || !signature) return null;
		const expectedSignature = crypto
			.createHmac("sha256", JWT_SECRET)
			.update(`${header}.${body}`)
			.digest("base64url");
		if (signature !== expectedSignature) return null;
		const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
		if (payload.exp && Date.now() / 1000 > payload.exp) return null;
		return payload;
	} catch {
		return null;
	}
}

interface AuthenticatedRequest extends Request {
	user?: {
		id: string;
		email: string;
		name: string;
	};
}

async function authenticateToken(req: Request, res: Response, next: any) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Access token required" });
	}

	const decoded = verifyToken(token);
	if (!decoded) {
		return res.status(403).json({ error: "Invalid or expired token" });
	}

	try {
		const [users]: any = await pool.query(
			"SELECT id, name, email, is_verified FROM users WHERE id = ? LIMIT 1",
			[decoded.userId],
		);

		if (!users || users.length === 0) {
			return res.status(403).json({ error: "User not found" });
		}

		if (!users[0].is_verified) {
			return res.status(403).json({ error: "User email not verified" });
		}

		(req as any).user = {
			id: users[0].id,
			name: users[0].name,
			email: users[0].email,
		};
		next();
	} catch (error) {
		return res.status(500).json({ error: "Authentication failed" });
	}
}

app.get("/", (req, res) => {
	res.send("DigitalScout API Running");
});

app.get("/api/debug-logs", async (req, res) => {
	try {
		const results: Record<string, any> = {};
		const pathsToTry = [
			path.join(process.cwd(), "stderr.log"),
			path.join(process.cwd(), "passenger.log"),
			path.join(process.cwd(), "error.log"),
			path.join(process.cwd(), "..", "stderr.log"),
			path.join(process.cwd(), "..", "passenger.log"),
			"/home/digimvyc/public_html/stderr.log",
			"/home/digimvyc/stderr.log",
			"/home/digimvyc/api.digiscout.online/stderr.log",
			"/home/digigesf/public_html/stderr.log",
			"/home/digigesf/stderr.log",
		];

		try {
			results.cwd = process.cwd();
			results.files = fs.readdirSync(process.cwd());
			const parent = path.join(process.cwd(), "..");
			results.parent = parent;
			results.parentFiles = fs.readdirSync(parent);
		} catch (dirErr: any) {
			results.dirError = dirErr.message;
		}

		for (const p of pathsToTry) {
			if (fs.existsSync(p)) {
				try {
					const content = fs.readFileSync(p, "utf8");
					results[p] = content.substring(Math.max(0, content.length - 15000));
				} catch (fileErr: any) {
					results[p] = `Error reading: ${fileErr.message}`;
				}
			} else {
				results[p] = "Not found";
			}
		}

		return res.json(results);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
});

// Authentication Routes
app.post("/api/auth/register", async (req, res) => {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) {
			return res
				.status(400)
				.json({ error: "Missing required fields: name, email, password" });
		}

		// Check if user already exists
		const [existing]: any = await pool.query(
			"SELECT id, is_verified FROM users WHERE email = ? LIMIT 1",
			[email],
		);

		let userId = crypto.randomUUID();
		const passwordHash = hashPassword(password);

		if (existing && existing.length > 0) {
			if (existing[0].is_verified) {
				return res.status(400).json({ error: "Email already registered" });
			}
			// Overwrite unverified account details
			userId = existing[0].id;
			await pool.query(
				"UPDATE users SET name = ?, password_hash = ? WHERE id = ?",
				[name, passwordHash, userId],
			);
		} else {
			await pool.query(
				"INSERT INTO users (id, name, email, password_hash, is_verified) VALUES (?, ?, ?, ?, 0)",
				[userId, name, email, passwordHash],
			);
		}

		// Generate a 6-digit OTP code
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

		// Clear previous OTPs for this email
		await pool.query("DELETE FROM otp_verifications WHERE email = ?", [email]);

		// Insert new OTP
		await pool.query(
			"INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)",
			[email, otp, expiresAt],
		);

		// Send email
		await sendOTPEmail(email, otp);

		return res.json({ success: true, message: "OTP sent to email" });
	} catch (error) {
		console.error("[Register] Error:", error);
		return res.status(500).json({ error: "Failed to register user" });
	}
});

app.post("/api/auth/verify-otp", async (req, res) => {
	try {
		const { email, otp } = req.body;
		if (!email || !otp) {
			return res.status(400).json({ error: "Missing email or otp" });
		}

		// Find OTP verification record
		const [verifications]: any = await pool.query(
			"SELECT id FROM otp_verifications WHERE email = ? AND otp_code = ? AND expires_at > NOW() LIMIT 1",
			[email, otp],
		);

		if (!verifications || verifications.length === 0) {
			return res
				.status(400)
				.json({ error: "Invalid or expired verification code" });
		}

		// Mark user as verified
		await pool.query("UPDATE users SET is_verified = 1 WHERE email = ?", [
			email,
		]);

		// Clean up OTP verifications
		await pool.query("DELETE FROM otp_verifications WHERE email = ?", [email]);

		// Find verified user details
		const [users]: any = await pool.query(
			"SELECT id, name, email FROM users WHERE email = ? LIMIT 1",
			[email],
		);

		const user = users[0];
		const token = generateToken({ userId: user.id });

		return res.json({
			success: true,
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
		});
	} catch (error) {
		console.error("[Verify OTP] Error:", error);
		return res.status(500).json({ error: "Failed to verify code" });
	}
});

app.post("/api/auth/resend-otp", async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ error: "Missing email" });
		}

		const [users]: any = await pool.query(
			"SELECT id, is_verified FROM users WHERE email = ? LIMIT 1",
			[email],
		);

		if (!users || users.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		if (users[0].is_verified) {
			return res.status(400).json({ error: "Email is already verified" });
		}

		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

		await pool.query("DELETE FROM otp_verifications WHERE email = ?", [email]);
		await pool.query(
			"INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)",
			[email, otp, expiresAt],
		);

		await sendOTPEmail(email, otp);

		return res.json({ success: true, message: "OTP resent successfully" });
	} catch (error) {
		console.error("[Resend OTP] Error:", error);
		return res.status(500).json({ error: "Failed to resend code" });
	}
});

app.post("/api/auth/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ error: "Missing email or password" });
		}

		const [users]: any = await pool.query(
			"SELECT id, name, email, password_hash, is_verified FROM users WHERE email = ? LIMIT 1",
			[email],
		);

		if (!users || users.length === 0) {
			return res.status(400).json({ error: "Invalid email or password" });
		}

		const user = users[0];

		// If user exists but is not verified, require OTP verification first
		if (!user.is_verified) {
			return res.status(403).json({
				status: "unverified",
				error: "Please verify your email address to log in.",
				email: user.email,
			});
		}

		const isMatch = verifyPassword(password, user.password_hash);
		if (!isMatch) {
			return res.status(400).json({ error: "Invalid email or password" });
		}

		const token = generateToken({ userId: user.id });

		return res.json({
			success: true,
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
		});
	} catch (error) {
		console.error("[Login] Error:", error);
		return res.status(500).json({ error: "Failed to log in" });
	}
});

app.post("/api/auth/forgot-password", async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ error: "Missing email" });
		}

		const [users]: any = await pool.query(
			"SELECT id, name FROM users WHERE email = ? LIMIT 1",
			[email],
		);

		// Always return success even if user not found to prevent user enumeration
		if (!users || users.length === 0) {
			return res.json({
				success: true,
				message:
					"If this email is registered, a password reset link has been sent",
			});
		}

		const token = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		await pool.query("DELETE FROM password_resets WHERE email = ?", [email]);
		await pool.query(
			"INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)",
			[email, token, expiresAt],
		);

		// Construct reset link using origin header
		const origin = req.headers.origin || "http://localhost:3000";
		const resetLink = `${origin}/?reset_token=${token}`;

		await sendResetPasswordEmail(email, resetLink);

		return res.json({
			success: true,
			message:
				"If this email is registered, a password reset link has been sent",
		});
	} catch (error) {
		console.error("[Forgot Password] Error:", error);
		return res
			.status(500)
			.json({ error: "Failed to generate password reset request" });
	}
});

app.post("/api/auth/reset-password", async (req, res) => {
	try {
		const { token, password } = req.body;
		if (!token || !password) {
			return res.status(400).json({ error: "Missing token or password" });
		}

		// Find token
		const [resets]: any = await pool.query(
			"SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW() LIMIT 1",
			[token],
		);

		if (!resets || resets.length === 0) {
			return res
				.status(400)
				.json({ error: "Invalid or expired password reset token" });
		}

		const email = resets[0].email;
		const passwordHash = hashPassword(password);

		// Update password
		await pool.query("UPDATE users SET password_hash = ? WHERE email = ?", [
			passwordHash,
			email,
		]);

		// Clean up reset token
		await pool.query("DELETE FROM password_resets WHERE token = ?", [token]);

		return res.json({
			success: true,
			message: "Password updated successfully",
		});
	} catch (error) {
		console.error("[Reset Password] Error:", error);
		return res.status(500).json({ error: "Failed to reset password" });
	}
});

app.get("/api/auth/me", async (req, res) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Access token required" });
	}

	const decoded = verifyToken(token);
	if (!decoded) {
		return res.status(403).json({ error: "Invalid or expired token" });
	}

	try {
		const [users]: any = await pool.query(
			"SELECT id, name, email, is_verified FROM users WHERE id = ? LIMIT 1",
			[decoded.userId],
		);

		if (!users || users.length === 0 || !users[0].is_verified) {
			return res.status(403).json({ error: "User not found or unverified" });
		}

		return res.json({
			success: true,
			user: {
				id: users[0].id,
				name: users[0].name,
				email: users[0].email,
			},
		});
	} catch (error) {
		return res.status(500).json({ error: "Database query failed" });
	}
});

type DebugStageName =
	| "business-input"
	| "generation-prompt"
	| "gemini-raw-response"
	| "extracted-json"
	| "normalized-schema"
	| "renderer-input"
	| "rendered-html"
	| "wordpress-blocks"
	| "final-preview-summary"
	| "errors";

type SectionNormalizationReport = {
	index: number;
	originalType: string | null;
	finalType: string;
	repaired: string[];
	droppedFields: string[];
	sectionId?: string;
};

type GenerationDebugSession = {
	traceId: string;
	folderName: string;
	folderPath: string;
	createdAt: string;
	businessName: string;
	businessCategory: string;
	fallbackReason?: string;
	parseRepairs: SectionNormalizationReport[];
	malformedSections: SectionNormalizationReport[];
	warnings: string[];
	errors: string[];
	rendererWarnings: string[];
	sectionTypes: string[];
};

const DEBUG_ROOT_DIR = path.join(process.cwd(), ".debug-generation");
const generationDebugSessions = new Map<string, GenerationDebugSession>();

function slugifyDebugSegment(value: string) {
	return (value || "generation")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function createGenerationTraceId(business: any) {
	const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
	const businessSlug = slugifyDebugSegment(
		business?.name || business?.businessName || business?.id || "site",
	);
	return `${timestamp}-${businessSlug}`;
}

function createGenerationDebugSession(business: any): GenerationDebugSession {
	const traceId = createGenerationTraceId(business);
	let folderName = traceId;
	let folderPath = path.join(DEBUG_ROOT_DIR, folderName);
	let suffix = 2;
	while (fs.existsSync(folderPath)) {
		folderName = `${traceId}-${suffix}`;
		folderPath = path.join(DEBUG_ROOT_DIR, folderName);
		suffix += 1;
	}
	fs.mkdirSync(folderPath, { recursive: true });
	const session: GenerationDebugSession = {
		traceId,
		folderName,
		folderPath,
		createdAt: new Date().toISOString(),
		businessName: business?.name || "Unknown Business",
		businessCategory: business?.category || "Unknown Category",
		parseRepairs: [],
		malformedSections: [],
		warnings: [],
		errors: [],
		rendererWarnings: [],
		sectionTypes: [],
	};
	generationDebugSessions.set(traceId, session);
	return session;
}

function getGenerationDebugSession(traceId: string) {
	return generationDebugSessions.get(traceId);
}

function formatDebugPayload(content: unknown) {
	if (typeof content === "string") return content;
	return JSON.stringify(content, null, 2);
}

function persistGenerationDebugFile(
	session: GenerationDebugSession,
	fileName: string,
	content: unknown,
	append = false,
) {
	fs.mkdirSync(session.folderPath, { recursive: true });
	const targetPath = path.join(session.folderPath, fileName);
	const payload = formatDebugPayload(content);
	if (append && fs.existsSync(targetPath)) {
		fs.appendFileSync(targetPath, `${payload}\n`, "utf8");
		return;
	}
	fs.writeFileSync(targetPath, payload, "utf8");
}

function appendGenerationDebugError(
	session: GenerationDebugSession,
	message: string,
) {
	const line = `[${new Date().toISOString()}] ${message}`;
	session.errors.push(line);
	persistGenerationDebugFile(session, "10-errors.log", `${line}\n`, true);
}

function buildBusinessDebugInput(business: any) {
	return {
		business,
		context: {
			name: business?.name || null,
			category: business?.category || null,
			address: business?.address || null,
			reviews: business?.reviews || [],
			photos: business?.photos || [],
			imageSuggestions: business?.imageSuggestions || [],
			qualificationNotes:
				business?.qualificationNotes || business?.notes || null,
			enrichment: {
				websiteUri: business?.websiteUri || null,
				email: business?.email || null,
				phoneNumber: business?.phoneNumber || null,
				specialties: business?.specialties || [],
				tone: business?.tone || null,
				neighborhood: business?.neighborhood || business?.vibe || null,
			},
			mapsSearch: {
				location: business?.location || null,
				rating: business?.rating || null,
				reviewCount: business?.reviewCount || null,
				businessStatus: business?.businessStatus || null,
			},
		},
	};
}

function buildDebugSummaryMarkdown(args: {
	traceId: string;
	sectionTypes: string[];
	galleryCount: number;
	testimonialCount: number;
	fallbackUsed: boolean;
	parseRepairs: SectionNormalizationReport[];
	missingSections: string[];
	rendererWarnings: string[];
	errors: string[];
}) {
	const lines = [
		"# Final Preview Summary",
		"",
		`- Trace ID: ${args.traceId}`,
		`- Section order: ${args.sectionTypes.length ? args.sectionTypes.join(" -> ") : "none"}`,
		`- Rendered section count: ${args.sectionTypes.length}`,
		`- Gallery count: ${args.galleryCount}`,
		`- Testimonial count: ${args.testimonialCount}`,
		`- Fallback usage: ${args.fallbackUsed ? "yes" : "no"}`,
		`- Parse repairs: ${args.parseRepairs.length}`,
		`- Missing sections: ${args.missingSections.length ? args.missingSections.join(", ") : "none"}`,
		`- Renderer warnings: ${args.rendererWarnings.length ? args.rendererWarnings.join(" | ") : "none"}`,
		`- Errors logged: ${args.errors.length}`,
	];
	return lines.join("\n");
}

async function readRequestBody(req: Request): Promise<Buffer> {
	const chunks: Buffer[] = [];
	for await (const chunk of req) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}
	return Buffer.concat(chunks);
}

function getLatestApiKeyFromDisk(keyName = "GEMINI_API_KEY"): string {
	const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
	if (!key) {
		throw new Error(
			`Missing Gemini API Key. Please provide GEMINI_API_KEY or GOOGLE_CLOUD_API_KEY in your environment.`,
		);
	}
	return key;
}

async function getSDKGenAI() {
	const key = getLatestApiKeyFromDisk();
	console.log(
		`[AI Chat] getSDKGenAI runtime lookup key:`,
		key ? `${key.substring(0, 10)}...` : "NOT FOUND",
	);
	if (!key) return null;
	if (!GoogleGenerativeAI) {
		try {
			const mod = await import("@google/generative-ai");
			GoogleGenerativeAI = mod.GoogleGenerativeAI;
		} catch (e) {
			console.error("[Gemini] SDK package @google/generative-ai not found.");
			return null;
		}
	}
	return new GoogleGenerativeAI(key);
}

const GENAI_KEY = process.env.GEMINI_API_KEY || process.env.GENAI_KEY;

async function generateCreativeDirection(
	business: any,
	debugSession: any,
): Promise<any> {
	const modelsToTry = [
		{ name: "gemini-flash-latest", timeoutMs: 45000 },
		{ name: "gemini-flash-latest", timeoutMs: 45000 },
	] as const;

	const buildImageBlock = (b: any) => {
		const sources =
			typeof collectBusinessImages === "function"
				? collectBusinessImages(b)
				: b.photos || [];
		return sources.length
			? sources
					.slice(0, 10)
					.map((u: string, i: number) => `${i + 1}. ${u}`)
					.join("\n")
			: "None";
	};

	const buildReviewsBlock = (b: any) => {
		if (Array.isArray(b.reviews) && b.reviews.length) {
			return b.reviews
				.slice(0, 5)
				.map(
					(r: any, i: number) =>
						`${i + 1}. ${r.rating || ""} - ${r.text || r.comment || ""}`,
				)
				.join("\n");
		}
		return "None";
	};

	const prompt = `You are a premium Senior Staff Brand Director and Art Director.
Your task is to analyze the local business data below and establish a highly custom, unique, and premium Creative Direction Brief.

This brief will dictate the brand personality, visual identity, storytelling flow, composition style, and spacing pacing for their website. Avoid generic and repetitive templates at all costs.

Business Context:
- Name: ${business.name}
- Category: ${business.category || "Local Service"}
- Address: ${business.address || "N/A"}
- Phone: ${business.phoneNumber || "N/A"}
- Email: ${business.email || "N/A"}
- Neighborhood / Vibe: ${business.neighborhood || business.vibe || "Unknown"}
- Specialties: ${Array.isArray(business.specialties) ? business.specialties.join(", ") : business.specialties || "General"}
- Tone: ${business.tone || "professional"}
- Reviews:
${buildReviewsBlock(business)}
- Reference Images:
${buildImageBlock(business)}

INSTRUCTIONS:
1. Infer the Business Personality along these six spectrums (score 0 to 100):
   - luxuryVsApproachable (0 = extremely friendly/budget, 100 = high-end premium luxury)
   - technicalVsEmotional (0 = emotional/sensory, 100 = precise/clinical/technical)
   - modernVsHeritage (0 = timeless/heritage/vintage, 100 = bleeding-edge modern)
   - industrialVsEditorial (0 = raw/structural/industrial, 100 = high-fashion editorial layout)
   - minimalistVsLayered (0 = high-density sensory layered, 100 = clean ultra-minimalist)
   - premiumVsEnergetic (0 = high-intensity energetic/playful, 100 = premium/restrained)

CATEGORY-SPECIFIC DESIGN MANDATES (Enforce specifically if the business matches these industries):
- Supermarkets / Groceries / Bakeries:
  * luxuryVsApproachable: 30 to 50 (warm, welcoming, community-first marketplace).
  * technicalVsEmotional: 10 to 30 (highly sensory, abundance-focused, fresh food imagery).
  * minimalistVsLayered: 20 to 45 (layered product showcases, textured natural grids, denser sensory layout).
  * themeMode: "textured-neutral" or "light" (warm eggshell, linen, soft cream).
  * headingFontFamily / bodyFontFamily: Soft approachable typography (e.g. Plus Jakarta Sans / Inter).
  * spacingRhythm: "compact" or "balanced" (tighter margin-top/bottom scales to reduce excess whitespace).
- Damage Restoration / Cleanup / Emergency Contractors:
  * luxuryVsApproachable: 50 to 65 (authoritative, trustworthy, highly-professional).
  * technicalVsEmotional: 80 to 95 (technical precision, dramatic safety confidence).
  * minimalistVsLayered: 60 to 80 (structural layouts, atmospheric contrast).
  * themeMode: "light" or "textured-neutral" (warm eggshell, clean white, or light slate backgrounds. Do NOT use dark backgrounds under any circumstances).
  * headingFontFamily / bodyFontFamily: Strong uppercase impact (e.g. Outfit / Space Grotesk).
  * spacingRhythm: "balanced" or "compact" (rugged precision).
- Roofing Companies / Roofers / Structural Contractors:
  * luxuryVsApproachable: 35 to 50 (bold contractor, powerful, action-focused).
  * technicalVsEmotional: 65 to 80 (precise durable roofing engineering).
  * minimalistVsLayered: 50 to 70 (high-energy bold highlights).
  * themeMode: "light" or "textured-neutral" (eggshell or clean white background, accented with bright safety-orange or durable blue details. Do NOT use dark backgrounds under any circumstances).
  * headingFontFamily / bodyFontFamily: Heavy geometric headings (e.g. Syne / Inter).
  * spacingRhythm: "compact" (highly energetic, high readability, compact text columns).


2. Determine the Visual Theme Mode. FORCE "light" or "textured-neutral" themes ONLY. Do NOT generate "dark" or "charcoal" themes under any circumstances. All designs must feel bright, airy, clean, professional, and accessible.
   - "light": Warm-white, clean, high visibility. Best for medical, local cleaners, organic day-spas.
   - "textured-neutral": Warm linen, eggshell, textured beige, soft taupe. Best for fine-dining restaurants, boutique hotels, artisan pottery.

3. GOOGLE MAPS PHOTO MANDATE:
   - Always prioritize using the provided Google Maps photos from the "Reference Images" list inside the media layouts. Do not recommend placeholder designs or external stock illustrations when custom business imagery is available.

3. Establish the Brand Concept and Art Direction Brief:
   - emotionalTone (e.g. "Warm, slow-paced luxury" or "Raw, high-octane energetic speed")
   - brandPersonalityDescription
   - typographyMood (e.g. Serif headings + clean sans-serif body, or stark monospaced typography)
   - headingFontFamily and bodyFontFamily pairings
   - spacingRhythm: Choose "airy" (generous negative space, editorial spacing), "balanced" (standard premium spacing), or "compact" (dense, clean, high information density)
   - layoutPacing (narrative flow pacing and section rhythm description)
   - compositionPhilosophy (e.g., asymmetrical grids, layered overlapping elements, cinematic full-bleed sections, or centered balanced grids)
   - mediaTreatment (how photos should be styled: round corners, arched frames, moody luxury shadow overlays)
   - motionPersonality (interaction transition details)
   - premiumReferences (specific real-world high-end design inspirations)
   - atmosphericDirectionDescription

4. Construct a Design Token Engine output specifically fitted for the category's visual design language:
   - Spacing Scale: Choose responsive vertical intervals using relative sizing (e.g., clamp for section padding, and custom variables for element spacing matching spacing density).
   - Typography Scale: Responsive header scales using fluid clamp() declarations.
   - Radius System: Values from soft rounded shapes to sharp geometric cuts.
   - Shadow System: Advanced layered box-shadow styles utilizing smooth transparency ramps.
   - Texture System: Choose "grain", "noise", "backdrop-glass", or "none" with a CSS styleString descriptor.
   - Animation Timing System: Choose premium custom cubic-bezier easing curves.
   - Layering Depth System: Specify CSS z-index hierarchies.
   - Gradient System: Inferred ambient background glows and brand highlights.

Return ONLY a valid JSON object matching the following structure (no markdown, no backticks, no other text):
{
  "emotionalTone": "...",
  "brandPersonality": {
    "luxuryVsApproachable": 50,
    "technicalVsEmotional": 50,
    "modernVsHeritage": 50,
    "industrialVsEditorial": 50,
    "minimalistVsLayered": 50,
    "premiumVsEnergetic": 50
  },
  "visualIdentity": {
    "themeMode": "light",
    "colorPalettePhilosophy": "...",
    "primaryColorIntent": "...",
    "accentColorIntent": "...",
    "backgroundColorIntent": "...",
    "surfaceColorIntent": "..."
  },
  "compositionPhilosophy": {
    "alignment": "asymmetrical",
    "layoutCadence": "...",
    "spacingRhythm": "balanced",
    "sectionTransitions": "..."
  },
  "typographyMood": {
    "headingFontFamily": "...",
    "bodyFontFamily": "...",
    "moodDescriptor": "..."
  },
  "mediaTreatment": {
    "style": "...",
    "shapes": ["..."]
  },
  "motionAndInteractions": {
    "personality": "subtle",
    "feel": "..."
  },
  "premiumReferences": ["..."],
  "atmosphericDirectionDescription": "...",
  "designTokens": {
    "spacingScale": {
      "xs": "...",
      "sm": "...",
      "md": "...",
      "lg": "...",
      "xl": "...",
      "xxl": "..."
    },
    "typographyScale": {
      "heroHeadline": "clamp(...)",
      "sectionHeadline": "clamp(...)",
      "bodyText": "clamp(...)",
      "headingFont": "...",
      "bodyFont": "..."
    },
    "radiusSystem": {
      "sm": "...",
      "md": "...",
      "lg": "...",
      "full": "..."
    },
    "shadowSystem": {
      "soft": "...",
      "premium": "...",
      "intense": "..."
    },
    "textureSystem": {
      "mode": "grain",
      "styleString": "..."
    },
    "animationTimingSystem": {
      "easingCurve": "...",
      "revealDuration": "..."
    },
    "layeringDepthSystem": {
      "zBack": "...",
      "zBase": "...",
      "zOverlay": "..."
    },
    "colorRamp": {
      "background": "...",
      "surface": "...",
      "primary": "...",
      "accent": "...",
      "text": "...",
      "muted": "...",
      "outline": "..."
    },
    "gradientSystem": {
      "ambientLighting": "...",
      "brandGradient": "..."
    }
  }
}`;

	let responseText = "";
	let lastError: any = null;

	for (const model of modelsToTry) {
		try {
			const restUrl =
				process.env.GEMINI_REST_URL ||
				"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";
			const key =
				getLatestApiKeyFromDisk() ||
				process.env.GEMINI_API_KEY ||
				process.env.GENAI_KEY ||
				GENAI_KEY;
			if (!key) {
				throw new Error("Gemini API key is not configured.");
			}
			const modelRestUrl = restUrl.includes("{model}")
				? restUrl.replace("{model}", model.name)
				: restUrl;
			const url = `${modelRestUrl}${modelRestUrl.includes("?") ? "&" : "?"}key=${key}`;
			await throttleGemini();
			const fetchResponse = await Promise.race([
				fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						contents: [{ parts: [{ text: prompt }] }],
						generationConfig: {
							temperature: 0.85,
							maxOutputTokens: 2048,
						},
					}),
				}),
				new Promise<Response>((_, reject) =>
					setTimeout(
						() =>
							reject(
								new Error(
									`Creative Direction timeout after ${model.timeoutMs}ms`,
								),
							),
						model.timeoutMs,
					),
				),
			]);

			if (!fetchResponse.ok) {
				throw new Error(
					`REST failed (${fetchResponse.status}): ${await fetchResponse.text()}`,
				);
			}
			const data = (await fetchResponse.json()) as any;
			responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

			if (responseText) {
				break;
			}
		} catch (err) {
			lastError = err;
			console.error(
				`[Creative Direction] attempt failed for ${model.name}:`,
				err,
			);
		}
	}

	if (!responseText) {
		throw lastError || new Error("Failed to generate creative direction");
	}

	try {
		const cleaned = responseText
			.replace(/```json\s*/i, "")
			.replace(/```\s*$/i, "")
			.trim();
		return JSON.parse(cleaned);
	} catch (e) {
		console.error(
			"[Creative Direction] JSON parse failed, returning fallback art brief",
			e,
		);
		return {
			emotionalTone: "Warm, professional, trust-first",
			brandPersonality: {
				luxuryVsApproachable: 40,
				technicalVsEmotional: 30,
				modernVsHeritage: 50,
				industrialVsEditorial: 30,
				minimalistVsLayered: 40,
				premiumVsEnergetic: 60,
			},
			visualIdentity: {
				themeMode: "light",
				colorPalettePhilosophy: "Earthy modern elegance",
				primaryColorIntent: "#1e3a8a",
				accentColorIntent: "#3b82f6",
				backgroundColorIntent: "#fafafa",
				surfaceColorIntent: "#ffffff",
			},
			compositionPhilosophy: {
				alignment: "balanced",
				layoutCadence: "Clear vertical hierarchy, balanced visual weights",
				spacingRhythm: "balanced",
				sectionTransitions: "Clean margins with subtle boundaries",
			},
			typographyMood: {
				headingFontFamily: "Outfit",
				bodyFontFamily: "Inter",
				moodDescriptor: "Clean and modern professional",
			},
			mediaTreatment: {
				style: "bright-clean",
				shapes: ["rounded"],
			},
			motionAndInteractions: {
				personality: "subtle",
				feel: "Fade transitions and quiet slide overlays",
			},
			premiumReferences: ["Apple", "Stripe Layouts"],
			atmosphericDirectionDescription:
				"Clean, inviting, highly structured page layout",
		};
	}
}

const CALLHIPPO_API_KEY = process.env.CALLHIPPO_API_KEY;
const NETLIFY_TOKEN =
	process.env.VITE_NETLIFY_TOKEN || process.env.NETLIFY_TOKEN;
const WEBSITE_GENERATION_MODE = process.env.WEBSITE_GENERATION_MODE || "gemini";

interface DeployRequest {
	websiteContent: string;
	businessName: string;
}

interface EnrichBusinessRequest {
	websiteUri?: string;
	businessName: string;
	category?: string;
}

interface LeadCandidate {
	id: string;
	name: string;
	category?: string;
	address?: string;
	websiteUri?: string;
	email?: string;
	phoneNumber?: string;
	photos?: string[];
	imageSuggestions?: string[];
	location?: {
		lat: number;
		lng: number;
	};
}

interface QualifyLeadsRequest {
	businesses: LeadCandidate[];
	city?: string;
	category?: string;
}

interface LeadQualification {
	hasWebsite: boolean;
	websiteUri?: string;
	email?: string;
	phoneNumber?: string;
	confidence?: "high" | "medium" | "low";
	notes?: string;
}

function extractEmails(html: string): string[] {
	const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
	return Array.from(new Set(html.match(emailPattern) || [])).slice(0, 3);
}

function extractPhones(html: string): string[] {
	const phonePattern =
		/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;
	return Array.from(new Set(html.match(phonePattern) || [])).slice(0, 3);
}

function extractImages(html: string): string[] {
	const imagePattern =
		/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
	const matches: string[] = [];
	let match;
	while ((match = imagePattern.exec(html)) !== null) {
		matches.push(match[1]);
	}
	return Array.from(new Set(matches)).slice(0, 3);
}

function extractJsonObject(text: string): string | null {
	if (!text) return null;
	const trimmed = text.trim();

	if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
		return trimmed;
	}

	const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (fencedMatch?.[1]) {
		const candidate = fencedMatch[1].trim();
		if (candidate.startsWith("{") && candidate.endsWith("}")) {
			return candidate;
		}
	}

	const firstBrace = trimmed.indexOf("{");
	const lastBrace = trimmed.lastIndexOf("}");
	if (firstBrace >= 0 && lastBrace > firstBrace) {
		return trimmed.slice(firstBrace, lastBrace + 1);
	}

	return null;
}

function extractHtmlDocument(text: string): string | null {
	if (!text) return null;
	const trimmed = text.trim();

	const fencedMatch = trimmed.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
	if (fencedMatch?.[1]) {
		const candidate = fencedMatch[1].trim();
		if (candidate.includes("<")) return candidate;
	}

	if (
		trimmed.includes("<!-- wp:html -->") ||
		trimmed.includes("<section") ||
		trimmed.includes("<style")
	) {
		return trimmed;
	}

	const firstTag = trimmed.indexOf("<");
	if (firstTag >= 0) {
		return trimmed.slice(firstTag);
	}

	return null;
}

function parseLeadQualificationOutput(
	rawText: string,
): LeadQualification | null {
	const candidateJson = extractJsonObject(rawText);
	if (!candidateJson) return null;

	try {
		const parsed = JSON.parse(candidateJson) as Partial<LeadQualification>;
		if (!parsed || typeof parsed !== "object") {
			return null;
		}

		return {
			hasWebsite: Boolean(parsed.hasWebsite),
			websiteUri:
				typeof parsed.websiteUri === "string" ? parsed.websiteUri : undefined,
			email: typeof parsed.email === "string" ? parsed.email : undefined,
			phoneNumber:
				typeof parsed.phoneNumber === "string" ? parsed.phoneNumber : undefined,
			confidence:
				parsed.confidence === "high" ||
				parsed.confidence === "medium" ||
				parsed.confidence === "low"
					? parsed.confidence
					: undefined,
			notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
		};
	} catch {
		return null;
	}
}

async function runWithConcurrency<T, R>(
	items: T[],
	limit: number,
	task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let cursor = 0;

	const workers = Array.from(
		{ length: Math.min(limit, items.length) },
		async () => {
			while (true) {
				const index = cursor++;
				if (index >= items.length) {
					return;
				}
				results[index] = await task(items[index], index);
			}
		},
	);

	await Promise.all(workers);
	return results;
}

async function qualifyLeadCandidate(
	business: LeadCandidate,
	city?: string,
): Promise<LeadQualification> {
	if (business.websiteUri) {
		return {
			hasWebsite: true,
			websiteUri: business.websiteUri,
			email: business.email,
			phoneNumber: business.phoneNumber,
			confidence: "high",
			notes: "Google Places returned an official website URL.",
		};
	}

	const genAI = await getSDKGenAI();
	if (!genAI) {
		return {
			hasWebsite: false,
			email: business.email,
			phoneNumber: business.phoneNumber,
			confidence: "low",
			notes: "Gemini API key is not configured or SDK missing.",
		};
	}

	const prompt = `You are qualifying a local business lead using live grounded data.

Business:
- Name: ${business.name}
- Category: ${business.category || "Unknown"}
- Address: ${business.address || "Unknown"}
- City/Area: ${city || "Unknown"}
- Existing website from app: ${business.websiteUri || "None found"}
- Existing phone from app: ${business.phoneNumber || "Unknown"}

Task:
1. Determine whether this business appears to have an official website right now.
2. Find the best public contact email for the business, if one exists.
3. Find the best public phone number for the business, if one exists.

Rules:
- Use grounded live sources only.
- If an official business website exists, set hasWebsite to true.
- Only return an email if it is a business contact email that is publicly available.
- Do not guess.
- Prefer high confidence only; otherwise leave fields blank.

Return only valid JSON in this exact shape:
{
  "hasWebsite": true,
  "websiteUri": "https://example.com",
  "email": "info@example.com",
  "phoneNumber": "(555) 555-5555",
  "confidence": "high",
  "notes": "short explanation"
}`;

	const configsToTry = [
		{
			tools: [{ googleMaps: {} }, { googleSearch: {} }],
			toolConfig: business.location
				? {
						retrievalConfig: {
							latLng: {
								latitude: business.location.lat,
								longitude: business.location.lng,
							},
						},
					}
				: undefined,
		},
		{
			tools: [{ googleSearch: {} }],
			toolConfig: undefined,
		},
	] as const;

	let lastError: unknown = null;

	for (const configVariant of configsToTry) {
		try {
			await throttleGemini();
			const modelInstance = genAI.getGenerativeModel({
				model: "gemini-1.5-pro",
				tools: configVariant.tools as any,
				toolConfig: configVariant.toolConfig as any,
			} as any);

			const result = await modelInstance.generateContent({
				contents: [{ role: "user", parts: [{ text: prompt }] }],
				generationConfig: { temperature: 0.1 },
			});

			const response = await result.response;
			const parsed = parseLeadQualificationOutput(
				(response.text() || "").trim(),
			);
			if (parsed) {
				return parsed;
			}
		} catch (error) {
			lastError = error;
		}
	}

	return {
		hasWebsite: false,
		email: business.email,
		phoneNumber: business.phoneNumber,
		confidence: "low",
		notes:
			lastError instanceof Error
				? lastError.message
				: "Lead qualification failed.",
	};
}

function parseWebsiteSchemaOutput(
	rawText: string,
	business: any,
	debugSession?: GenerationDebugSession,
): WebsiteSchema | null {
	const candidateJson = extractJsonObject(rawText);
	if (!candidateJson) {
		if (debugSession) {
			persistGenerationDebugFile(debugSession, "04-extracted-json.json", {
				error: "No JSON object could be extracted from Gemini output.",
				rawPreview: (rawText || "").slice(0, 4000),
			});
			appendGenerationDebugError(
				debugSession,
				"parser_failure: no JSON object could be extracted",
			);
		}
		return null;
	}

	try {
		const parsed = JSON.parse(candidateJson) as Partial<WebsiteSchema>;
		if (!parsed || typeof parsed !== "object") {
			if (debugSession) {
				persistGenerationDebugFile(debugSession, "04-extracted-json.json", {
					error: "Parsed JSON was not an object.",
					extractedJson: candidateJson,
				});
				appendGenerationDebugError(
					debugSession,
					"parser_failure: parsed JSON was not an object",
				);
			}
			return null;
		}

		const root =
			typeof (parsed as any).schema === "object" && (parsed as any).schema
				? ((parsed as any).schema as Partial<WebsiteSchema>)
				: parsed;
		const nestedSections =
			(Array.isArray((root as any).sections) && (root as any).sections) ||
			(Array.isArray((parsed as any)?.website?.sections) &&
				(parsed as any).website.sections) ||
			(Array.isArray((parsed as any)?.site?.sections) &&
				(parsed as any).site.sections) ||
			null;
		const inferSectionType = (value: unknown): string | null => {
			if (typeof value !== "string") return null;
			const normalized = value.trim().toLowerCase();
			if (!normalized) return null;
			if (normalized.startsWith("hero")) return "hero";
			if (normalized.startsWith("feature") || normalized.startsWith("service"))
				return "features";
			if (normalized.startsWith("gallery")) return "gallery";
			if (
				normalized.startsWith("testimonial") ||
				normalized.startsWith("review")
			)
				return "testimonials";
			if (normalized.startsWith("faq") || normalized.startsWith("question"))
				return "faq";
			if (
				normalized.startsWith("cta") ||
				normalized.startsWith("call-to-action")
			)
				return "cta";
			if (normalized.startsWith("contact")) return "contact";
			return null;
		};

		function normalizeSectionShape(rawSections: any[] | null) {
			if (!Array.isArray(rawSections)) {
				return {
					sections: null,
					reports: [] as SectionNormalizationReport[],
					warnings: [] as string[],
				};
			}

			const reports: SectionNormalizationReport[] = [];
			const warnings: string[] = [];
			const sections: any[] = [];

			for (const [index, rawSection] of rawSections.entries()) {
				const original = JSON.parse(JSON.stringify(rawSection || {}));
				const repaired: string[] = [];
				const droppedFields: string[] = [];
				const section: any = { ...(rawSection || {}) };
				const originalType = original.type || original.kind || null;

				if (!section.type && section.kind) {
					section.type = section.kind;
					repaired.push("kind->type");
				}
				if (!section.type) {
					const inferredType =
						inferSectionType(section.id) ||
						inferSectionType(section.section) ||
						inferSectionType(section.name) ||
						inferSectionType(section.variant);
					if (inferredType) {
						section.type = inferredType;
						repaired.push("id/name->type");
					}
				}

				if (section.content && typeof section.content === "object") {
					for (const [key, value] of Object.entries(section.content)) {
						if (section[key] === undefined) {
							section[key] = value;
							repaired.push(`content.${key}->${key}`);
						} else {
							droppedFields.push(`content.${key}`);
						}
					}
					delete section.content;
				}

				switch ((section.type || "").toLowerCase()) {
					case "hero": {
						section.type = "hero";
						section.headline =
							section.headline ||
							section.title ||
							section.label ||
							business.name ||
							"Welcome";
						section.subheadline =
							section.subheadline ||
							section.subtitle ||
							section.description ||
							"";
						if (
							!section.ctaPrimary &&
							Array.isArray(section.buttons) &&
							section.buttons.length > 0
						) {
							section.ctaPrimary = section.buttons[0];
							repaired.push("buttons[0]->ctaPrimary");
						}
						break;
					}
					case "features":
						section.type = "features";
						section.items =
							section.items || section.features || section.featureItems || [];
						break;
					case "gallery":
						section.type = "gallery";
						if (!section.items && (section.images || section.photos)) {
							repaired.push("images/photos->items");
						}
						section.items =
							section.items || section.images || section.photos || [];
						section.items = Array.isArray(section.items)
							? section.items.map((item: any) => {
									if (typeof item === "string") {
										return { src: item, alt: business.name || "" };
									}
									if (item?.url && !item.src) {
										item.src = item.url;
										repaired.push("gallery.url->src");
									}
									if (item?.src && !item.alt) {
										item.alt = business.name || "";
									}
									return item;
								})
							: [];
						if (!section.items.length) {
							warnings.push(
								`gallery section ${index} normalized to empty items`,
							);
						}
						break;
					case "testimonials":
						section.type = "testimonials";
						if (!section.items && section.testimonials) {
							repaired.push("testimonials->items");
						}
						section.items =
							section.items || section.testimonials || section.reviews || [];
						break;
					case "faq":
						section.type = "faq";
						if (!section.items && (section.faqs || section.questions)) {
							repaired.push("faqs/questions->items");
						}
						section.items =
							section.items || section.faqs || section.questions || [];
						break;
					case "cta":
						section.type = "cta";
						section.title =
							section.title ||
							section.headline ||
							section.heading ||
							"Ready to get started?";
						section.body = section.body || section.description || "";
						section.buttonLabel =
							section.buttonLabel ||
							section.cta ||
							section.button?.label ||
							"Contact Us";
						section.buttonHref =
							section.buttonHref ||
							section.cta?.href ||
							section.button?.href ||
							"#contact";
						break;
					case "contact":
						section.type = "contact";
						section.showEmail = section.showEmail !== false;
						section.showPhone = section.showPhone !== false;
						break;
					default:
						section.type = section.type || section.kind || "unknown";
						section.title =
							section.title ||
							section.heading ||
							section.label ||
							(section.type === "unknown" ? "Section" : section.type);
						break;
				}

				if (!section.id) {
					section.id = `${section.type || "section"}-${index + 1}`;
					repaired.push("generated-id");
				}

				const report: SectionNormalizationReport = {
					index,
					originalType: originalType ? String(originalType) : null,
					finalType: section.type || "unknown",
					repaired,
					droppedFields,
					sectionId: section.id,
				};

				if (debugSession && (repaired.length > 0 || droppedFields.length > 0)) {
					debugSession.warnings.push(
						`section[${index}] ${report.originalType || "unknown"} -> ${report.finalType} (${repaired.join(", ") || "no repairs"})`,
					);
					appendGenerationDebugError(
						debugSession,
						`normalization_repair: ${JSON.stringify(report)}`,
					);
				}

				if (Array.isArray(section.items) && section.items.length === 0) {
					warnings.push(
						`section[${index}] ${section.type} has no items after normalization`,
					);
				}

				reports.push(report);
				sections.push(section);
			}

			return { sections, reports, warnings };
		}

		const fallback = createFallbackWebsiteSchema(business);
		const normalizationResult =
			nestedSections && nestedSections.length > 0
				? normalizeSectionShape(nestedSections)
				: {
						sections: null,
						reports: [] as SectionNormalizationReport[],
						warnings: [] as string[],
					};

		const merged: WebsiteSchema = {
			meta: {
				...fallback.meta,
				...(root.meta || {}),
			},
			theme: {
				...fallback.theme,
				...(root.theme || {}),
				palette: {
					...fallback.theme.palette,
					...((root.theme as any)?.palette || {}),
					...((root.theme as any)?.colors || {}),
					primary:
						(root.theme as any)?.palette?.primary ||
						(root.theme as any)?.colors?.primary ||
						(root.theme as any)?.primaryColor ||
						fallback.theme.palette.primary,
					surface:
						(root.theme as any)?.palette?.surface ||
						(root.theme as any)?.colors?.surface ||
						(root.theme as any)?.secondaryColor ||
						fallback.theme.palette.surface,
					background:
						(root.theme as any)?.palette?.background ||
						(root.theme as any)?.colors?.background ||
						(root.theme as any)?.secondaryColor ||
						fallback.theme.palette.background,
					accent:
						(root.theme as any)?.palette?.accent ||
						(root.theme as any)?.colors?.accent ||
						(root.theme as any)?.accentColor ||
						(root.theme as any)?.primaryColor ||
						fallback.theme.palette.accent,
				},
				typography: {
					...fallback.theme.typography,
					...((root.theme as any)?.typography || {}),
					heading:
						(root.theme as any)?.typography?.heading ||
						(root.theme as any)?.typography?.headingFont ||
						(root.theme as any)?.fontHeading ||
						fallback.theme.typography.heading,
					body:
						(root.theme as any)?.typography?.body ||
						(root.theme as any)?.typography?.bodyFont ||
						(root.theme as any)?.fontBody ||
						fallback.theme.typography.body,
				},
				customCss:
					(root.theme as any)?.customCss ||
					(root as any)?.customCss ||
					(fallback.theme as any)?.customCss ||
					"",
			},
			brand: {
				...fallback.brand,
				...(root.brand || {}),
				businessName:
					(root.brand as any)?.businessName ||
					(root as any)?.businessName ||
					fallback.brand.businessName,
				category:
					(root.brand as any)?.category ||
					(root as any)?.category ||
					fallback.brand.category,
			},
			seo: {
				...fallback.seo,
				...(root.seo || {}),
				keywords:
					Array.isArray(root.seo?.keywords) && root.seo?.keywords.length > 0
						? root.seo.keywords
						: fallback.seo.keywords,
			},
			sections:
				normalizationResult.sections && normalizationResult.sections.length > 0
					? normalizationResult.sections
					: fallback.sections,
		};

		merged.theme = sanitizeThemeEnums(merged.theme);
		merged.theme = enforceLightTheme(merged.theme);

		if (debugSession) {
			debugSession.parseRepairs = normalizationResult.reports;
			debugSession.malformedSections = normalizationResult.reports.filter(
				(report) =>
					report.repaired.length > 0 || report.droppedFields.length > 0,
			);
			debugSession.sectionTypes = merged.sections.map(
				(section) => section.type,
			);
			debugSession.warnings.push(...normalizationResult.warnings);

			persistGenerationDebugFile(
				debugSession,
				"04-extracted-json.json",
				parsed,
			);
		}

		return merged;
	} catch (error) {
		if (debugSession) {
			appendGenerationDebugError(
				debugSession,
				`parser_failure: ${error instanceof Error ? error.message : String(error)}`,
			);
			persistGenerationDebugFile(debugSession, "04-extracted-json.json", {
				error: error instanceof Error ? error.message : String(error),
				extractedJson: candidateJson,
			});
		}
		return null;
	}
}

function hashSeed(input: string): number {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = (hash * 31 + input.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

function pickBySeed<T>(items: T[], seed: number): T {
	if (!items.length) {
		throw new Error("pickBySeed requires at least one item");
	}
	return items[seed % items.length];
}

function buildUniqueHeroSubheadline(
	businessName: string,
	categoryLabel: string,
	seed: number,
) {
	const openings = [
		"delivers a sharper digital first impression for",
		"frames a premium online experience for",
		"positions your brand as the standout choice in",
		"brings editorial-grade storytelling to",
		"pairs visual depth with clear intent for",
		"transforms discovery clicks into confident enquiries for",
		"sets a modern, conversion-ready standard for",
	];
	const closings = [
		"with bold hierarchy and clear booking paths",
		"through polished visuals and concise trust signals",
		"by balancing atmosphere, proof, and action",
		"with mobile-first pacing and high-intent CTAs",
		"using distinctive sections that avoid template sameness",
		"with premium composition and service-first messaging",
		"through a brand voice tailored to local demand",
	];

	const opening = pickBySeed(openings, seed + 5);
	const closing = pickBySeed(closings, seed + 17);
	return `${businessName} ${opening} ${categoryLabel} ${closing}.`;
}

function buildSectionOrderPattern(
	category: string,
	seed: number,
): ("features" | "gallery" | "testimonials" | "faq" | "cta")[] {
	const categoryNorm = (category || "").toLowerCase();
	const isFitness =
		categoryNorm.includes("gym") || categoryNorm.includes("fitness");
	const isDental = categoryNorm.includes("dental");
	const isRealEstate =
		categoryNorm.includes("real estate") || categoryNorm.includes("property");
	const isCafe =
		categoryNorm.includes("cafe") || categoryNorm.includes("restaurant");
	const isSalon =
		categoryNorm.includes("salon") || categoryNorm.includes("spa");

	let patterns: ("features" | "gallery" | "testimonials" | "faq" | "cta")[][] =
		[];

	if (isFitness) {
		patterns = [
			["features", "gallery", "testimonials", "faq", "cta"],
			["gallery", "features", "testimonials", "cta", "faq"],
			["testimonials", "features", "gallery", "cta", "faq"],
		];
	} else if (isDental) {
		patterns = [
			["features", "testimonials", "faq", "gallery", "cta"],
			["testimonials", "features", "faq", "gallery", "cta"],
			["features", "faq", "testimonials", "cta", "gallery"],
		];
	} else if (isRealEstate) {
		patterns = [
			["gallery", "features", "testimonials", "faq", "cta"],
			["features", "gallery", "testimonials", "cta", "faq"],
			["gallery", "testimonials", "features", "cta", "faq"],
		];
	} else if (isCafe) {
		patterns = [
			["features", "gallery", "testimonials", "cta", "faq"],
			["gallery", "features", "testimonials", "faq", "cta"],
			["testimonials", "gallery", "features", "faq", "cta"],
		];
	} else if (isSalon) {
		patterns = [
			["gallery", "features", "testimonials", "faq", "cta"],
			["features", "gallery", "testimonials", "cta", "faq"],
			["testimonials", "features", "gallery", "faq", "cta"],
		];
	} else {
		patterns = [
			["features", "gallery", "testimonials", "faq", "cta"],
			["features", "testimonials", "gallery", "cta", "faq"],
			["gallery", "features", "testimonials", "cta", "faq"],
			["testimonials", "features", "faq", "gallery", "cta"],
		];
	}

	return pickBySeed(patterns, seed + 41);
}

function ensureNonTemplateCopy(
	schema: WebsiteSchema,
	business: any,
): WebsiteSchema {
	const seed = hashSeed(
		`${business.id || business.name || "lead"}-${business.category || "category"}`,
	);
	const categoryLabel =
		business.category || schema.brand.category || "local business";
	const businessName =
		business.name || schema.brand.businessName || "This business";
	const genericPattern =
		/^a\s+premium\s+.+website\s+designed\s+to\s+convert\s+visitors\s+into\s+customers\.?$/i;

	const categoryNorm = (categoryLabel || "").toLowerCase();
	const pickVariant = (
		sectionType: WebsiteSchema["sections"][number]["type"],
	) => {
		if (sectionType === "hero") {
			if (
				categoryNorm.includes("salon") ||
				categoryNorm.includes("spa") ||
				categoryNorm.includes("wellness")
			) {
				return pickBySeed(
					["editorial-split", "magazine", "centered", "minimal", "split"],
					seed + 3,
				);
			}
			if (
				categoryNorm.includes("gym") ||
				categoryNorm.includes("fitness") ||
				categoryNorm.includes("training")
			) {
				return pickBySeed(["immersive", "split", "cinematic"], seed + 5);
			}
			if (
				categoryNorm.includes("dental") ||
				categoryNorm.includes("law") ||
				categoryNorm.includes("finance") ||
				categoryNorm.includes("consult")
			) {
				return pickBySeed(["centered", "editorial", "minimal"], seed + 7);
			}
			return pickBySeed(["editorial", "split", "immersive"], seed + 11);
		}

		if (sectionType === "features") {
			if (
				categoryNorm.includes("dental") ||
				categoryNorm.includes("law") ||
				categoryNorm.includes("finance") ||
				categoryNorm.includes("consult")
			) {
				return pickBySeed(
					["editorial-list", "editorial-cards", "bento"],
					seed + 13,
				);
			}
			if (
				categoryNorm.includes("salon") ||
				categoryNorm.includes("spa") ||
				categoryNorm.includes("wellness")
			) {
				return pickBySeed(
					["alternating-stack", "bento", "editorial-cards", "editorial-list"],
					seed + 15,
				);
			}
			return pickBySeed(
				["bento", "editorial-cards", "editorial-list"],
				seed + 17,
			);
		}

		if (sectionType === "gallery") {
			if (
				categoryNorm.includes("salon") ||
				categoryNorm.includes("spa") ||
				categoryNorm.includes("wellness")
			) {
				return pickBySeed(
					["stacked-collage", "editorial-mosaic", "collage"],
					seed + 19,
				);
			}
			return pickBySeed(["editorial-mosaic", "stacked-collage"], seed + 19);
		}

		if (sectionType === "testimonials") {
			return pickBySeed(
				["floating-cards", "editorial-quotes", "spotlight"],
				seed + 23,
			);
		}

		if (sectionType === "faq") {
			return pickBySeed(["cards", "split-columns", "grid"], seed + 29);
		}

		if (sectionType === "cta") {
			return pickBySeed(
				["gradient-band", "split-card", "side-by-side"],
				seed + 31,
			);
		}

		if (sectionType === "contact") {
			return pickBySeed(
				["split-card", "minimal-centered", "centered"],
				seed + 37,
			);
		}

		return "default";
	};

	const nextSections = (schema.sections || []).map((section) => {
		const layout = pickVariant(section.type);
		const modified = {
			...section,
			layout,
			variant: (section as any).variant || layout,
		};
		if (section.type === "hero") {
			modified.ctaPrimary = modified.ctaPrimary || {};
			modified.ctaPrimary.label = modified.ctaPrimary.label || "Book Now";
			modified.ctaPrimary.href = modified.ctaPrimary.href || "#contact";
			if (modified.ctaSecondary) {
				modified.ctaSecondary.href = modified.ctaSecondary.href || "#services";
			}
			modified.media = modified.media || {
				src:
					business.photos?.[0] ||
					business.imageSuggestions?.[0] ||
					"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
				alt: `${businessName} hero image`,
			};
		}
		if (section.type === "cta") {
			modified.buttonHref = modified.buttonHref || "#contact";
			modified.buttonLabel = modified.buttonLabel || "Start Your Enquiry";
		}
		if (section.type === "gallery" && modified.items) {
			modified.items = modified.items.map((item) => ({
				...item,
				src:
					item.src || "https://via.placeholder.com/400x300?text=Gallery+Image",
				alt: item.alt || `${businessName} gallery image`,
			}));
		}
		if (section.type !== "hero") return modified;
		const current = (section.subheadline || "").trim();
		if (!current || genericPattern.test(current)) {
			return {
				...modified,
				subheadline: buildUniqueHeroSubheadline(
					businessName,
					categoryLabel,
					seed,
				),
			};
		}
		return modified;
	});

	return {
		...schema,
		sections: nextSections,
	};
}

function sanitizeThemeEnums(
	theme: WebsiteSchema["theme"],
): WebsiteSchema["theme"] {
	const sanitize = <T extends string>(
		value: unknown,
		allowed: readonly T[],
		fallback: T,
	): T => {
		return typeof value === "string" &&
			(allowed as readonly string[]).includes(value)
			? (value as T)
			: fallback;
	};

	return {
		...theme,
		layout: sanitize(
			theme.layout,
			[
				"editorial",
				"immersive",
				"minimal",
				"gallery-forward",
				"split-screen",
			] as const,
			"editorial",
		),
		buttonStyle: sanitize(
			theme.buttonStyle,
			["pill", "sharp", "ghost"] as const,
			"pill",
		),
		surfaceStyle: sanitize(
			theme.surfaceStyle,
			["glass", "solid", "outline"] as const,
			"glass",
		),
		mediaShape: sanitize(
			theme.mediaShape,
			["rounded", "arched", "portrait", "square"] as const,
			"rounded",
		),
		density: sanitize(
			theme.density,
			["airy", "balanced", "compact"] as const,
			"balanced",
		),
		accentMode: sanitize(
			theme.accentMode,
			["neon", "earthy", "luxury", "fresh"] as const,
			"neon",
		),
	};
}

function enforceLightTheme(
	theme: WebsiteSchema["theme"],
): WebsiteSchema["theme"] {
	const parseColor = (value: string) => {
		const hex = value.trim().toLowerCase();
		const rgbaMatch = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
		if (rgbaMatch) {
			return [Number(rgbaMatch[1]), Number(rgbaMatch[2]), Number(rgbaMatch[3])];
		}

		const shorthand = hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
		if (shorthand) {
			return [
				parseInt(shorthand[1] + shorthand[1], 16),
				parseInt(shorthand[2] + shorthand[2], 16),
				parseInt(shorthand[3] + shorthand[3], 16),
			];
		}

		const full = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
		if (full) {
			return [
				parseInt(full[1], 16),
				parseInt(full[2], 16),
				parseInt(full[3], 16),
			];
		}

		return null;
	};

	const isDark = (color: string) => {
		const rgb = parseColor(color);
		if (!rgb) return false;
		const [r, g, b] = rgb.map((channel) => channel / 255);
		const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		return luminance < 0.35;
	};

	const safeBackground = isDark(theme.palette.background)
		? "#f8fafc"
		: theme.palette.background;
	const safeSurface = isDark(theme.palette.surface)
		? "#ffffff"
		: theme.palette.surface;
	const safeText = isDark(theme.palette.text)
		? theme.palette.text
		: theme.palette.text;

	return {
		...theme,
		palette: {
			...theme.palette,
			background: safeBackground,
			surface: safeSurface,
			text: safeText,
			outline: theme.palette.outline || "rgba(15, 23, 42, 0.08)",
		},
		sectionDensity: theme.sectionDensity || "balanced",
		interactionStyle: theme.interactionStyle || "refined",
	};
}

function optimizeGooglePhotoUrl(url: string, size = 1600): string {
	if (!url || typeof url !== "string") return url;
	if (url.includes("googleusercontent.com/places/") || url.includes("googleusercontent.com/p/")) {
		const baseUrl = url.split("=")[0];
		return `${baseUrl}=s${size}`;
	}
	return url;
}

function collectBusinessImages(business: any): string[] {
	return Array.from(
		new Set(
			[
				...(business?.photos || []),
				...(business?.imageSuggestions || []),
			].filter(
				(value): value is string =>
					typeof value === "string" && value.trim().length > 0,
			).map(url => optimizeGooglePhotoUrl(url, 1600)),
		),
	);
}

function pickDesignProfile(category: string, seed = 0) {
	const normalized = (category || "").toLowerCase();

	if (
		normalized.includes("cabinet") ||
		normalized.includes("wood") ||
		normalized.includes("carpenter") ||
		normalized.includes("furniture")
	) {
		return {
			name: "Bespoke Woodworking",
			style: "editorial artisan",
			layout: "editorial" as const,
			buttonStyle: "sharp" as const,
			surfaceStyle: "solid" as const,
			mediaShape: "rounded" as const,
			density: "airy" as const,
			accentMode: "earthy" as const,
			palette: {
				background: "#E8E6DF",
				surface: "#ffffff",
				primary: "#141111",
				accent: "#80311B",
				text: "#141111",
				muted: "#6B6661",
				outline: "rgba(20, 17, 17, 0.12)",
			},
			typography: { heading: "Spartan", body: "Inter" },
		};
	}

	if (
		normalized.includes("restaurant") ||
		normalized.includes("cafe") ||
		normalized.includes("bakery")
	) {
		return pickBySeed(
			[
				{
					name: "Warm Editorial",
					style: "editorial hospitality",
					layout: "editorial" as const,
					buttonStyle: "pill" as const,
					surfaceStyle: "glass" as const,
					mediaShape: "arched" as const,
					density: "airy" as const,
					accentMode: "earthy" as const,
					palette: {
						background: "#fcf3ea",
						surface: "#ffffff",
						primary: "#c2410c",
						accent: "#f59e0b",
						text: "#1f2937",
						muted: "#6b7280",
						outline: "rgba(194, 65, 12, 0.12)",
					},
					typography: { heading: "Playfair Display", body: "Inter" },
				},
				{
					name: "Layered Bistro",
					style: "sensory hospitality",
					layout: "gallery-forward" as const,
					buttonStyle: "sharp" as const,
					surfaceStyle: "solid" as const,
					mediaShape: "rounded" as const,
					density: "balanced" as const,
					accentMode: "earthy" as const,
					palette: {
						background: "#f8f1ea",
						surface: "#fffdf9",
						primary: "#9a3412",
						accent: "#d97706",
						text: "#292524",
						muted: "#78716c",
						outline: "rgba(154, 52, 18, 0.12)",
					},
					typography: { heading: "Cormorant Garamond", body: "Inter" },
				},
			],
			seed + 101,
		);
	}

	if (
		normalized.includes("salon") ||
		normalized.includes("spa") ||
		normalized.includes("wellness")
	) {
		return pickBySeed(
			[
				{
					name: "Soft Luxe",
					style: "luxury wellness",
					layout: "split-screen" as const,
					buttonStyle: "pill" as const,
					surfaceStyle: "glass" as const,
					mediaShape: "portrait" as const,
					density: "balanced" as const,
					accentMode: "luxury" as const,
					palette: {
						background: "#f8f4f5",
						surface: "#ffffff",
						primary: "#9333ea",
						accent: "#e9d5ff",
						text: "#1f2937",
						muted: "#9ca3af",
						outline: "rgba(147, 51, 234, 0.12)",
					},
					typography: { heading: "Cormorant Garamond", body: "Inter" },
				},
				{
					name: "Editorial Blush",
					style: "airy salon editorial",
					layout: "editorial" as const,
					buttonStyle: "ghost" as const,
					surfaceStyle: "outline" as const,
					mediaShape: "arched" as const,
					density: "airy" as const,
					accentMode: "luxury" as const,
					palette: {
						background: "#fbf6f3",
						surface: "#fffdfb",
						primary: "#b45363",
						accent: "#f4c2d7",
						text: "#2d1f24",
						muted: "#7f6a72",
						outline: "rgba(180, 83, 99, 0.12)",
					},
					typography: {
						heading: "Playfair Display",
						body: "Plus Jakarta Sans",
					},
				},
				{
					name: "Champagne Studio",
					style: "polished beauty studio",
					layout: "gallery-forward" as const,
					buttonStyle: "sharp" as const,
					surfaceStyle: "solid" as const,
					mediaShape: "rounded" as const,
					density: "balanced" as const,
					accentMode: "earthy" as const,
					palette: {
						background: "#faf7f1",
						surface: "#fffdfa",
						primary: "#8b6b3f",
						accent: "#d4b483",
						text: "#2b2117",
						muted: "#8b8177",
						outline: "rgba(139, 107, 63, 0.12)",
					},
					typography: { heading: "Cormorant Garamond", body: "Outfit" },
				},
				{
					name: "Modern Atelier",
					style: "clean creative salon",
					layout: "minimal" as const,
					buttonStyle: "pill" as const,
					surfaceStyle: "glass" as const,
					mediaShape: "square" as const,
					density: "compact" as const,
					accentMode: "fresh" as const,
					palette: {
						background: "#f5f4f8",
						surface: "#ffffff",
						primary: "#4f46e5",
						accent: "#c7d2fe",
						text: "#1f2937",
						muted: "#6b7280",
						outline: "rgba(79, 70, 229, 0.10)",
					},
					typography: { heading: "Space Grotesk", body: "Inter" },
				},
			],
			seed + 131,
		);
	}

	if (
		normalized.includes("gym") ||
		normalized.includes("fitness") ||
		normalized.includes("training")
	) {
		return {
			name: "Electric Performance",
			style: "high-energy conversion",
			layout: "immersive" as const,
			buttonStyle: "sharp" as const,
			surfaceStyle: "solid" as const,
			mediaShape: "square" as const,
			density: "compact" as const,
			accentMode: "neon" as const,
			palette: {
				background: "#f0fdf4",
				surface: "#ffffff",
				primary: "#16a34a",
				accent: "#0284c7",
				text: "#0f172a",
				muted: "#64748b",
				outline: "rgba(22, 163, 74, 0.16)",
			},
			typography: { heading: "Space Grotesk", body: "Inter" },
		};
	}

	if (normalized.includes("dry clean") || normalized.includes("laundry")) {
		return {
			name: "Polished Cleanliness",
			style: "clinical luxury",
			layout: "split-screen" as const,
			buttonStyle: "pill" as const,
			surfaceStyle: "glass" as const,
			mediaShape: "rounded" as const,
			density: "airy" as const,
			accentMode: "fresh" as const,
			palette: {
				background: "#f0f9ff",
				surface: "#ffffff",
				primary: "#0c4a6e",
				accent: "#3b82f6",
				text: "#1e293b",
				muted: "#78716c",
				outline: "rgba(12, 74, 110, 0.12)",
			},
			typography: { heading: "IBM Plex Sans", body: "Inter" },
		};
	}

	if (
		normalized.includes("dental") ||
		normalized.includes("dentist") ||
		normalized.includes("orthodont")
	) {
		return {
			name: "Clinical Calm",
			style: "healthcare premium",
			layout: "minimal" as const,
			buttonStyle: "pill" as const,
			surfaceStyle: "outline" as const,
			mediaShape: "rounded" as const,
			density: "balanced" as const,
			accentMode: "fresh" as const,
			palette: {
				background: "#f0fdf4",
				surface: "#ffffff",
				primary: "#059669",
				accent: "#06b6d4",
				text: "#1f2937",
				muted: "#6b7280",
				outline: "rgba(5, 150, 105, 0.10)",
			},
			typography: { heading: "Inter", body: "Inter" },
		};
	}

	if (
		normalized.includes("real estate") ||
		normalized.includes("realtor") ||
		normalized.includes("property")
	) {
		return {
			name: "Architectural Premium",
			style: "property luxury",
			layout: "gallery-forward" as const,
			buttonStyle: "sharp" as const,
			surfaceStyle: "solid" as const,
			mediaShape: "square" as const,
			density: "balanced" as const,
			accentMode: "earthy" as const,
			palette: {
				background: "#fafaf9",
				surface: "#ffffff",
				primary: "#5b4e48",
				accent: "#a16207",
				text: "#1f2937",
				muted: "#9ca3af",
				outline: "rgba(91, 78, 72, 0.12)",
			},
			typography: { heading: "IBM Plex Serif", body: "Inter" },
		};
	}

	if (
		normalized.includes("law") ||
		normalized.includes("finance") ||
		normalized.includes("consult") ||
		normalized.includes("agency")
	) {
		return {
			name: "Modern Authority",
			style: "editorial professional",
			layout: "minimal" as const,
			buttonStyle: "sharp" as const,
			surfaceStyle: "outline" as const,
			mediaShape: "rounded" as const,
			density: "balanced" as const,
			accentMode: "fresh" as const,
			palette: {
				background: "#f7f7f5",
				surface: "#ffffff",
				primary: "#0f766e",
				accent: "#2563eb",
				text: "#111827",
				muted: "#6b7280",
				outline: "rgba(17, 24, 39, 0.10)",
			},
			typography: { heading: "IBM Plex Sans", body: "Inter" },
		};
	}

	return pickBySeed(
		[
			{
				name: "Luxe Bright",
				style: "premium luminous editorial",
				layout: "editorial" as const,
				buttonStyle: "pill" as const,
				surfaceStyle: "glass" as const,
				mediaShape: "rounded" as const,
				density: "balanced" as const,
				accentMode: "neon" as const,
				palette: {
					background: "#f8fafc",
					surface: "#ffffff",
					primary: "#7c3aed",
					accent: "#0ea5e9",
					text: "#0f172a",
					muted: "#64748b",
					outline: "rgba(124, 58, 237, 0.12)",
				},
				typography: { heading: "Inter", body: "Inter" },
			},
			{
				name: "Studio Neutral",
				style: "minimal luminous studio",
				layout: "minimal" as const,
				buttonStyle: "sharp" as const,
				surfaceStyle: "outline" as const,
				mediaShape: "arched" as const,
				density: "airy" as const,
				accentMode: "fresh" as const,
				palette: {
					background: "#f8f7f4",
					surface: "#fffefd",
					primary: "#1d4ed8",
					accent: "#14b8a6",
					text: "#1f2937",
					muted: "#6b7280",
					outline: "rgba(29, 78, 216, 0.10)",
				},
				typography: { heading: "IBM Plex Serif", body: "Inter" },
			},
		],
		seed + 199,
	);
}

function buildCategorySpecificFeatures(
	category: string,
	businessName: string,
	seed: number,
): Array<{ title: string; description: string; icon?: string }> {
	const categoryNorm = (category || "").toLowerCase();

	if (categoryNorm.includes("cafe") || categoryNorm.includes("restaurant")) {
		return [
			{
				title: "Curated Atmosphere",
				description:
					"A space designed for both quick visits and lingering moments, with photography that captures the essence of hospitality.",
			},
			{
				title: "Quality First",
				description:
					"Every detail reflects commitment to fresh ingredients, thoughtful preparation, and the craft of hospitality.",
			},
			{
				title: "Clear Online Ordering",
				description:
					"Streamlined booking and reservation system that respects both your time and your team's workflow.",
			},
		];
	}

	if (categoryNorm.includes("salon") || categoryNorm.includes("spa")) {
		return [
			{
				title: "Personalized Beauty",
				description:
					"Expert services tailored to your unique needs, from color and cuts to specialized treatments and wellness.",
			},
			{
				title: "Relaxation & Care",
				description:
					"A sanctuary where skilled practitioners use premium products and proven techniques to create transformation.",
			},
			{
				title: "Convenient Scheduling",
				description:
					"Book your next appointment with ease, with availability and reminders that respect your schedule.",
			},
		];
	}

	if (categoryNorm.includes("dental")) {
		return [
			{
				title: "Clinical Excellence",
				description:
					"Advanced diagnostic tools and evidence-based techniques combined with a calm, patient-centered approach.",
			},
			{
				title: "Preventive Focus",
				description:
					"Education and care strategies that prioritize long-term oral health and smile confidence.",
			},
			{
				title: "Comfortable Experience",
				description:
					"Modern techniques, clear communication, and genuine care that make dental visits something to look forward to.",
			},
		];
	}

	if (categoryNorm.includes("gym") || categoryNorm.includes("fitness")) {
		return [
			{
				title: "Results-Driven Training",
				description:
					"Customized programs and expert coaching that transform fitness goals into measurable achievements.",
			},
			{
				title: "Community Energy",
				description:
					"Train alongside like-minded members in an environment that motivates and celebrates progress.",
			},
			{
				title: "State-of-the-Art Equipment",
				description:
					"Well-maintained facilities and cutting-edge tools that support every phase of your fitness journey.",
			},
		];
	}

	if (
		categoryNorm.includes("real estate") ||
		categoryNorm.includes("property")
	) {
		return [
			{
				title: "Expert Market Knowledge",
				description:
					"Deep insights into local neighborhoods, market trends, and investment opportunities backed by data and experience.",
			},
			{
				title: "Personalized Guidance",
				description:
					"Dedicated support through every step of buying, selling, or investing in property that matters.",
			},
			{
				title: "Trusted Negotiation",
				description:
					"Strategic representation that secures favorable terms and protects your interests in every transaction.",
			},
		];
	}

	if (categoryNorm.includes("dry clean") || categoryNorm.includes("laundry")) {
		return [
			{
				title: "Expert Garment Care",
				description:
					"Specialist handling for delicate fabrics and premium materials, using proven techniques and quality products.",
			},
			{
				title: "Fast Turnaround",
				description:
					"Reliable, on-time service that respects your schedule without compromising on quality.",
			},
			{
				title: "Premium Quality Assurance",
				description:
					"Every garment inspected and handled with the precision expected of a trusted, professional service.",
			},
		];
	}

	return [
		{
			title: "Premium Positioning",
			description:
				"Your service distinguished by quality, attention to detail, and a commitment to customer satisfaction.",
		},
		{
			title: "Clear Value Proposition",
			description:
				"What you offer and why it matters, communicated with clarity and confidence.",
		},
		{
			title: "Seamless Booking",
			description:
				"Effortless way for customers to discover, understand, and take action with your business.",
		},
	];
}

function buildCategorySpecificTestimonials(
	category: string,
	businessName: string,
	seed: number,
): Array<{ quote: string; author: string; role?: string }> {
	const categoryNorm = (category || "").toLowerCase();
	const names = ["Alex M.", "Jordan K.", "Casey P.", "Morgan T.", "Riley S."];
	const roles = [
		"Regular Guest",
		"Loyal Client",
		"Returning Customer",
		"Business Owner",
		"Local Professional",
	];

	const name1 = pickBySeed(names, seed + 11);
	const name2 = pickBySeed(names, seed + 23);
	const role1 = pickBySeed(roles, seed + 37);
	const role2 = pickBySeed(roles, seed + 47);

	if (categoryNorm.includes("cafe") || categoryNorm.includes("restaurant")) {
		return [
			{
				quote:
					"The new site actually reflects what makes this place specialΓÇöit brought me back to visit.",
				author: name1,
				role: role1,
			},
			{
				quote:
					"Booking a table online and seeing their story upfront made me want to experience it in person.",
				author: name2,
				role: role2,
			},
		];
	}

	if (categoryNorm.includes("salon") || categoryNorm.includes("spa")) {
		return [
			{
				quote:
					"The website shows professionalism and careΓÇöexactly what I experienced when I visited.",
				author: name1,
				role: role1,
			},
			{
				quote:
					"Easy online booking and clear service descriptions gave me confidence before my first appointment.",
				author: name2,
				role: role2,
			},
		];
	}

	if (categoryNorm.includes("dental")) {
		return [
			{
				quote:
					"The information online calmed my nerves before my visit. Professional and reassuring.",
				author: name1,
				role: role1,
			},
			{
				quote:
					"Clear details about services and friendly communication made me feel valued as a patient.",
				author: name2,
				role: role2,
			},
		];
	}

	if (categoryNorm.includes("gym") || categoryNorm.includes("fitness")) {
		return [
			{
				quote:
					"The online tour showed real community energyΓÇöjoined immediately and haven't looked back.",
				author: name1,
				role: role1,
			},
			{
				quote:
					"Clear class descriptions and trainer profiles helped me pick the perfect fit for my goals.",
				author: name2,
				role: role2,
			},
		];
	}

	if (
		categoryNorm.includes("real estate") ||
		categoryNorm.includes("property")
	) {
		return [
			{
				quote:
					"Their online listing brought clarity to a complex marketΓÇöguided me through the whole process with expertise.",
				author: name1,
				role: role1,
			},
			{
				quote:
					"Professional presentation and transparent communication made me feel confident in my investment decision.",
				author: name2,
				role: role2,
			},
		];
	}

	if (categoryNorm.includes("dry clean") || categoryNorm.includes("laundry")) {
		return [
			{
				quote:
					"My premium items have never looked betterΓÇötrusted professionals who care about quality.",
				author: name1,
				role: role1,
			},
			{
				quote:
					"Reliable, on-time service with genuine attention to detail. That's why they're my go-to.",
				author: name2,
				role: role2,
			},
		];
	}

	return [
		{
			quote:
				"Professional, reliable, and genuinely committed to customer satisfaction.",
			author: name1,
			role: role1,
		},
		{
			quote:
				"The online experience matched the quality of service I received in person.",
			author: name2,
			role: role2,
		},
	];
}

function buildCategorySpecificFaqs(
	category: string,
	businessName: string,
	seed: number,
): Array<{ question: string; answer: string }> {
	const categoryNorm = (category || "").toLowerCase();

	if (categoryNorm.includes("cafe") || categoryNorm.includes("restaurant")) {
		return [
			{
				question: "How far in advance should I book a table?",
				answer:
					"Most weeknights have availability, but weekends often fill 2-3 weeks ahead. Call or book online to check real-time availability.",
			},
			{
				question: "Do you accommodate dietary preferences or restrictions?",
				answer:
					"Yes, we work with guests on allergies, preferences, and dietary needs. Please mention these when booking or call ahead.",
			},
			{
				question: "What's your cancellation policy?",
				answer:
					"Cancellations 24 hours in advance are free. Late cancellations are held to your card to secure your reservation.",
			},
		];
	}

	if (categoryNorm.includes("salon") || categoryNorm.includes("spa")) {
		return [
			{
				question: "How do I book my first appointment?",
				answer:
					"Call or book online to select your service, preferred stylist, and time. Consultations are included for new clients.",
			},
			{
				question: "What should I know before my appointment?",
				answer:
					"Arrive a few minutes early. Bring photos for clarity on your vision. Our team will discuss any concerns or allergies.",
			},
			{
				question: "What's your rescheduling and cancellation policy?",
				answer:
					"Free cancellations up to 24 hours before. Late cancellations are charged 50% to respect your stylist's time.",
			},
		];
	}

	if (categoryNorm.includes("dental")) {
		return [
			{
				question: "What should I do if I have a dental emergency?",
				answer:
					"Call us immediately. We keep emergency slots open and guide you through treatment options and costs.",
			},
			{
				question: "Do you offer payment plans?",
				answer:
					"Yes. We work with multiple financing partners to make treatment accessible and manageable for your budget.",
			},
			{
				question: "How often should I schedule cleanings?",
				answer:
					"Most patients benefit from cleanings every 6 months. Your dentist may recommend more frequent visits based on your health.",
			},
		];
	}

	if (categoryNorm.includes("gym") || categoryNorm.includes("fitness")) {
		return [
			{
				question: "Do I need experience to join group classes?",
				answer:
					"No. All fitness levels are welcome. Instructors offer modifications so you can go at your own pace.",
			},
			{
				question: "What's included with a membership?",
				answer:
					"Full facility access, all group classes, locker rooms, and member events. Personal training is available separately.",
			},
			{
				question: "Can I freeze or pause my membership?",
				answer:
					"Yes. Members can pause for up to 3 months. Contact us to discuss your situation.",
			},
		];
	}

	if (
		categoryNorm.includes("real estate") ||
		categoryNorm.includes("property")
	) {
		return [
			{
				question: "What's the first step in buying or selling property?",
				answer:
					"Start with a consultation to discuss your goals, timeline, and market conditions. We'll create a tailored strategy.",
			},
			{
				question: "How are your agent fees structured?",
				answer:
					"Standard rates for most transactions. We also offer consultation packages for strategic guidance. Full details available on request.",
			},
			{
				question: "How long does a typical sale take?",
				answer:
					"Varies by market and property. Most sales take 30-45 days from offer to close. We manage timelines and reduce surprises.",
			},
		];
	}

	if (categoryNorm.includes("dry clean") || categoryNorm.includes("laundry")) {
		return [
			{
				question: "What fabrics and garments do you handle?",
				answer:
					"We care for wool, silk, delicate blends, leather, suede, furs, and premium items. Ask about specialty services.",
			},
			{
				question: "How long does dry cleaning take?",
				answer:
					"Most items are ready in 2-3 business days. We offer rush service for important events when requested in advance.",
			},
			{
				question: "What if something goes wrong with my garment?",
				answer:
					"We stand behind our work and have industry insurance. We'll discuss solutions immediatelyΓÇöyour satisfaction matters.",
			},
		];
	}

	return [
		{
			question: "How do I get started?",
			answer:
				"Contact us via phone or book online. We'll guide you through the process and answer any questions.",
		},
		{
			question: "What's your pricing?",
			answer:
				"Pricing varies by service. Call or visit for a quote tailored to your specific needs.",
		},
		{
			question: "Do you offer any guarantees?",
			answer:
				"Yes. We stand behind our service quality and customer satisfaction is our top priority.",
		},
	];
}

function createFallbackWebsiteSchema(business: any): WebsiteSchema {
	const siteName = business.name || "Demo Business";
	const categoryLabel = business.category || "local business";
	const copySeed = hashSeed(`${business.id || siteName}-${categoryLabel}`);
	const design = pickDesignProfile(business.category || "", copySeed);
	const imagePool = collectBusinessImages(business);
	const layoutVariant = pickBySeed(
		[
			"editorial",
			"split-screen",
			"gallery-forward",
			"minimal",
			"immersive",
		] as const,
		copySeed + 7,
	);
	const buttonVariant = pickBySeed(
		["pill", "sharp", "ghost"] as const,
		copySeed + 13,
	);
	const mediaVariant = pickBySeed(
		["arched", "rounded", "portrait"] as const,
		copySeed + 19,
	);
	const densityVariant = pickBySeed(
		["airy", "balanced", "compact"] as const,
		copySeed + 23,
	);
	const accentVariant = pickBySeed(
		["earthy", "luxury", "fresh", "neon"] as const,
		copySeed + 31,
	);
	const categoryNorm = (business.category || "").toLowerCase();
	const heroVariant =
		categoryNorm.includes("salon") || categoryNorm.includes("spa")
			? pickBySeed(
					["magazine", "editorial-split", "centered", "minimal", "split"],
					copySeed + 5,
				)
			: layoutVariant === "minimal"
				? "centered"
				: layoutVariant === "immersive"
					? "immersive"
					: layoutVariant === "split-screen"
						? "split"
						: "split";
	const featureLayout =
		categoryNorm.includes("salon") || categoryNorm.includes("spa")
			? pickBySeed(
					["bento", "alternating-stack", "editorial-cards"],
					copySeed + 9,
				)
			: layoutVariant === "minimal"
				? "list"
				: "cards";
	const heroImage =
		imagePool[0] ||
		"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80";
	const heroSubheadline = buildUniqueHeroSubheadline(
		siteName,
		categoryLabel,
		copySeed,
	);

	// Build category-specific features, testimonials, and faqs
	const features = buildCategorySpecificFeatures(
		business.category || "",
		siteName,
		copySeed,
	);
	const testimonials = buildCategorySpecificTestimonials(
		business.category || "",
		siteName,
		copySeed,
	);
	const faqs = buildCategorySpecificFaqs(
		business.category || "",
		siteName,
		copySeed,
	);

	// Get section ordering variant
	const sectionOrder = buildSectionOrderPattern(
		business.category || "",
		copySeed,
	);

	// Build base sections (hero always first)
	const baseSections: WebsiteSchema["sections"] = [
		{
			id: "hero-1",
			type: "hero",
			variant: heroVariant,
			headline: siteName,
			subheadline: heroSubheadline,
			ctaPrimary: { label: "Get Started", href: "#contact" },
			ctaSecondary: { label: "Learn More", href: "#features" },
			badges: [design.name],
			media: {
				type: "image",
				src: heroImage,
				alt: siteName,
			},
		},
	];

	// Add sections in varied order
	const midSections: WebsiteSchema["sections"] = [];
	for (const sectionType of sectionOrder) {
		if (sectionType === "features") {
			midSections.push({
				id: "features-1",
				type: "features",
				layout: featureLayout,
				items: features,
			});
		} else if (sectionType === "gallery") {
			midSections.push({
				id: "gallery-1",
				type: "gallery",
				items: [
					{
						src:
							imagePool[1] ||
							imagePool[0] ||
							"https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
						alt: `${siteName} gallery 1`,
					},
					{
						src:
							imagePool[2] ||
							imagePool[1] ||
							imagePool[0] ||
							"https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
						alt: `${siteName} gallery 2`,
					},
					{
						src:
							imagePool[3] ||
							imagePool[2] ||
							imagePool[1] ||
							"https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
						alt: `${siteName} gallery 3`,
					},
				],
			});
		} else if (sectionType === "testimonials") {
			midSections.push({
				id: "testimonials-1",
				type: "testimonials",
				items: testimonials,
			});
		} else if (sectionType === "faq") {
			midSections.push({
				id: "faq-1",
				type: "faq",
				items: faqs,
			});
		} else if (sectionType === "cta") {
			midSections.push({
				id: "cta-1",
				type: "cta",
				title: `Ready to discover ${siteName}?`,
				body: "Reach out today and let's discuss how we can help you achieve your goals.",
				buttonLabel: "Get in Touch",
				buttonHref: "#contact",
			});
		}
	}

	// Contact section always at end
	const allSections = [
		...baseSections,
		...midSections,
		{ id: "contact-1", type: "contact", showEmail: true, showPhone: true },
	];

	const schema: WebsiteSchema = {
		meta: {
			siteId: `fallback-${business.id || "business"}-${Date.now()}`,
			businessId: business.id || "business",
			slug: siteName
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/(^-|-$)/g, ""),
			version: 1,
			target: "static",
		},
		theme: {
			name: design.name,
			style: design.style,
			radius:
				design.surfaceStyle === "solid"
					? "20px"
					: layoutVariant === "minimal"
						? "16px"
						: "28px",
			layout: layoutVariant,
			buttonStyle: buttonVariant,
			surfaceStyle: design.surfaceStyle,
			mediaShape: mediaVariant,
			density: densityVariant,
			accentMode: accentVariant,
			palette: design.palette,
			typography: design.typography,
		},
		brand: {
			businessName: siteName,
			category: business.category || "Local Business",
			address: business.address || "",
			phone: business.phoneNumber || "",
			email: business.email || "",
			websiteUri: business.websiteUri || "",
			logo: business.logo || imagePool[0] || "",
		},
		seo: {
			title: `${siteName} | Preview`,
			description: `Premium website for ${siteName}ΓÇö${categoryLabel} services with modern design and seamless booking.`,
			keywords: [
				business.category || "local",
				"services",
				"premium",
				categoryLabel,
			],
		},
		sections: allSections,
		_validation: {
			repairs: [],
			validatedAt: new Date().toISOString(),
			photos: business.photos || [],
			imageSuggestions: business.imageSuggestions || [],
			logo: business.logo || "",
		} as any,
	};

	return ensureNonTemplateCopy(schema, business);
}

function ensureSchemaMetadata(
	schema: any,
	business: any,
	traceId?: string,
): WebsiteSchema {
	const now = Date.now();
	const safeSchema = schema || {};
	if (!safeSchema.schemaVersion) {
		safeSchema.schemaVersion = "1.0";
	}
	if (!safeSchema.meta) {
		safeSchema.meta = {};
	}
	if (!safeSchema.meta.businessId) {
		safeSchema.meta.businessId =
			business?.id || business?.placeId || `biz-${now}`;
	}
	if (!safeSchema.meta.siteId) {
		safeSchema.meta.siteId = `site-${safeSchema.meta.businessId}-${now}`;
	}
	if (!safeSchema.meta.slug) {
		safeSchema.meta.slug = (business?.name || "site")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");
	}
	if (!safeSchema.meta.version) {
		safeSchema.meta.version = 1;
	}
	if (!safeSchema.meta.target) {
		safeSchema.meta.target = "wordpress";
	}
	if (traceId) {
		safeSchema.meta.traceId = traceId;
	}
	if (!safeSchema.brand) {
		safeSchema.brand = {};
	}
	safeSchema.brand.businessName =
		safeSchema.brand.businessName || business?.name || "Business";
	safeSchema.brand.category =
		safeSchema.brand.category || business?.category || "Local Business";
	safeSchema.brand.address =
		safeSchema.brand.address || business?.address || "";
	safeSchema.brand.phone =
		safeSchema.brand.phone || business?.phoneNumber || "";
	safeSchema.brand.email = safeSchema.brand.email || business?.email || "";
	safeSchema.brand.websiteUri =
		safeSchema.brand.websiteUri || business?.websiteUri || "";
	safeSchema.brand.logo = safeSchema.brand.logo || business?.logo || "";

	if (!safeSchema.seo) {
		safeSchema.seo = {};
	}
	safeSchema.seo.title =
		safeSchema.seo.title || business?.name || "Website Preview";
	safeSchema.seo.description =
		safeSchema.seo.description ||
		business?.description ||
		`Bespoke web presentation for ${business?.name || "our client"}.`;
	safeSchema.seo.keywords = safeSchema.seo.keywords || [
		business?.name || "Business",
		business?.category || "Local Business",
	];

	if (!safeSchema.theme) {
		safeSchema.theme = {
			name: "default",
			style: "modern",
			radius: "8px",
			layout: "balanced",
			buttonStyle: "rounded",
			surfaceStyle: "solid",
			mediaShape: "rounded",
			density: "balanced",
			accentMode: "fresh",
			palette: {
				primary: "#2563eb",
				surface: "#ffffff",
				background: "#f8fafc",
				accent: "#f59e0b",
				text: "#0f172a",
				muted: "#64748b",
				outline: "#e2e8f0",
			},
			typography: {
				heading: "Inter",
				body: "Inter",
			},
			brandDNA: {
				spacingPersonality: "balanced",
				compositionAggression: 50,
				hierarchyIntensity: 50,
				motionEnergy: 50,
				visualDensity: 50,
				asymmetryLevel: 50,
				atmosphereIntensity: 50,
				typographyDominance: "balanced",
				imageWeight: 50,
				luxuryScore: 50,
				cinematicScore: 50,
				brutalismScore: 50,
				editorialScore: 50,
				softnessScore: 50,
				visualAtmosphere: "soft-editorial-warmth",
			},
		};
	} else {
		safeSchema.theme.brandDNA = safeSchema.theme.brandDNA || {
			spacingPersonality: "balanced",
			compositionAggression: 50,
			hierarchyIntensity: 50,
			motionEnergy: 50,
			visualDensity: 50,
			asymmetryLevel: 50,
			atmosphereIntensity: 50,
			typographyDominance: "balanced",
			imageWeight: 50,
			luxuryScore: 50,
			cinematicScore: 50,
			brutalismScore: 50,
			editorialScore: 50,
			softnessScore: 50,
			visualAtmosphere: "soft-editorial-warmth",
		};
	}
	if (!safeSchema._validation) {
		safeSchema._validation = {
			repairs: [],
			validatedAt: new Date().toISOString(),
			traceId,
			photos: business?.photos || [],
			imageSuggestions: business?.imageSuggestions || [],
			logo: business?.logo || "",
		};
	} else if (traceId) {
		safeSchema._validation.traceId = traceId;
	}
	return safeSchema as WebsiteSchema;
}

app.post(
	"/api/generate",
	authenticateToken,
	async (req: any, res: Response) => {
		try {
			const business = req.body;
			if (!business || !business.name) {
				return res.status(400).json({ error: "Missing business payload" });
			}

			const debugSession = createGenerationDebugSession(business);
			logStderr(
				`[Generate] start traceId=${debugSession.traceId} business=${business.name}`,
			);
			res.setHeader("x-debug-generation-id", debugSession.traceId);
			res.setHeader("x-debug-generation-fallback", "false");

			// Check if TEST MODE is enabled
			if (WEBSITE_GENERATION_MODE === "template") {
				logStderr(`[Generate] Template mode enabled - skipping generation`);
				return res.status(422).json({
					error: "Website creation failed: template mode is enabled.",
				});
			}

			// Validate Gemini configuration
			if (!GENAI_KEY && !process.env.GEMINI_REST_URL) {
				logStderr(`[Generate] Missing Gemini API configuration`);
				return res.status(422).json({
					error: "Website creation failed: AI configuration missing.",
				});
			}

			// Generate homepage using direct Vertex prompt
			const schema = await generateHomepageViaDirectVertexPrompt(business, {
				debugLog: (msg: string) => logStderr(msg),
				debugSession,
				persistFile: (filename: string, content: any) => {
					persistGenerationDebugFile(debugSession, filename, content);
				},
				throttleGemini: () => throttleGemini(),
			});

			logStderr(
				`[Generate] complete traceId=${debugSession.traceId} renderSource=direct-vertex-prompt`,
			);

			// Return the schema for compatibility with existing pipeline
			return res.json(schema);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			logStderr(`[Generate] Error: ${errorMsg}`);

			return res.status(500).json({
				error: `Website generation failed: ${errorMsg}`,
			});
		}
	},
);

app.post(
	"/api/generate-search-keywords",
	async (
		req: Request<{}, {}, { category?: string; city?: string }>,
		res: Response,
	) => {
		try {
			const category = String(req.body?.category || "").trim();
			const city = String(req.body?.city || "").trim();

			if (!category || !city) {
				return res.status(400).json({ error: "Missing category or city" });
			}

			const { keywords, rawKeywords, rawText } = await generateSearchKeywords(
				category,
				city,
			);
			return res.json({ keywords, rawKeywords, rawText });
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			return res
				.status(500)
				.json({ error: `Keyword expansion failed: ${errorMsg}` });
		}
	},
);

app.post(
	"/api/debug-generation/:traceId/file",
	(req: Request<{ traceId: string }>, res: Response) => {
		const { traceId } = req.params;
		const session = getGenerationDebugSession(traceId);
		if (!session) {
			return res.status(404).json({ error: "Unknown debug generation trace" });
		}

		const { fileName, content, append } = req.body || {};
		if (!fileName) {
			return res.status(400).json({ error: "Missing fileName" });
		}

		persistGenerationDebugFile(
			session,
			fileName,
			content ?? "",
			Boolean(append),
		);
		return res.json({ success: true, traceId, fileName });
	},
);

app.get(
	"/api/debug-generation/:traceId/summary",
	(req: Request<{ traceId: string }>, res: Response) => {
		const { traceId } = req.params;
		const session = getGenerationDebugSession(traceId);
		if (!session) {
			return res.status(404).json({ error: "Unknown debug generation trace" });
		}

		return res.json(session);
	},
);

/**
 * Simplified deterministic homepage generation using direct Vertex prompt
 * Uses: Business Context → Single Vertex Prompt → Final HTML/CSS → WordPress rendering
 */
app.post(
	"/api/generate-v2",
	authenticateToken,
	async (req: any, res: Response) => {
		try {
			const business = req.body;
			if (!business || !business.name) {
				return res.status(400).json({ error: "Missing business payload" });
			}

			const debugSession = createGenerationDebugSession(business);
			logStderr(
				`[GenerateV2] start traceId=${debugSession.traceId} business=${business.name}`,
			);
			res.setHeader("x-debug-generation-id", debugSession.traceId);
			res.setHeader("x-debug-generation-fallback", "false");

			// Check if TEST MODE is enabled
			if (WEBSITE_GENERATION_MODE === "template") {
				logStderr(`[GenerateV2] Template mode enabled - skipping generation`);
				return res.status(422).json({
					error: "Website creation failed: template mode is enabled.",
				});
			}

			// Validate Gemini configuration
			if (!GENAI_KEY && !process.env.GEMINI_REST_URL) {
				logStderr(`[GenerateV2] Missing Gemini API configuration`);
				return res.status(422).json({
					error: "Website creation failed: AI configuration missing.",
				});
			}

			// Generate homepage using direct Vertex prompt
			const schema = await generateHomepageViaDirectVertexPrompt(business, {
				debugLog: (msg: string) => logStderr(msg),
				debugSession,
				persistFile: (filename: string, content: any) => {
					persistGenerationDebugFile(debugSession, filename, content);
				},
				throttleGemini: () => throttleGemini(),
			});

			logStderr(
				`[GenerateV2] complete traceId=${debugSession.traceId} renderSource=direct-vertex-prompt`,
			);

			// Return the schema for compatibility with existing pipeline
			return res.json(schema);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			logStderr(`[GenerateV2] Error: ${errorMsg}`);

			return res.status(500).json({
				error: `Website generation failed: ${errorMsg}`,
			});
		}
	},
);

app.post(
	"/api/deploy",
	async (req: Request<{}, {}, DeployRequest>, res: Response) => {
		try {
			if (!NETLIFY_TOKEN) {
				return res
					.status(500)
					.json({ error: "Netlify token not configured on server" });
			}

			const { websiteContent, businessName } = req.body;
			if (!websiteContent || !businessName) {
				return res
					.status(400)
					.json({ error: "Missing websiteContent or businessName" });
			}

			const siteName = `${
				businessName
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/^-+|-+$/g, "") || "digital-scout"
			}-${Date.now()}`;

			const siteResponse = await fetch("https://api.netlify.com/api/v1/sites", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${NETLIFY_TOKEN}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name: siteName }),
			});

			if (!siteResponse.ok) {
				const errorDetails = await siteResponse.text();
				return res.status(siteResponse.status).json({
					error: `Netlify site creation failed: ${siteResponse.statusText}`,
					details: errorDetails,
				});
			}

			const siteData = (await siteResponse.json()) as any;
			const siteId = siteData.id;
			const deployedUrl =
				siteData.ssl_url || siteData.url || siteData.deploy_url;

			const sha1 = crypto
				.createHash("sha1")
				.update(websiteContent)
				.digest("hex");

			const deployResponse = await fetch(
				`https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${NETLIFY_TOKEN}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						files: {
							"/index.html": sha1,
						},
					}),
				},
			);

			if (!deployResponse.ok) {
				const errorDetails = await deployResponse.text();
				return res.status(deployResponse.status).json({
					error: `Netlify deploy creation failed: ${deployResponse.statusText}`,
					details: errorDetails,
				});
			}

			const deployData = (await deployResponse.json()) as any;
			const deployId = deployData.id;

			const uploadResponse = await fetch(
				`https://api.netlify.com/api/v1/deploys/${deployId}/files/index.html`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${NETLIFY_TOKEN}`,
						"Content-Type": "application/octet-stream",
					},
					body: websiteContent,
				},
			);

			if (!uploadResponse.ok) {
				const errorDetails = await uploadResponse.text();
				return res.status(uploadResponse.status).json({
					error: `Netlify file upload failed: ${uploadResponse.statusText}`,
					details: errorDetails,
				});
			}

			return res.json({
				success: true,
				deployedUrl,
				siteId,
				deployId,
				deployedAt: new Date().toISOString(),
			});
		} catch (error) {
			return res.status(500).json({
				error: error instanceof Error ? error.message : "Deployment failed",
			});
		}
	},
);

app.post(
	"/api/enrich-business",
	async (
		req: Request<{}, {}, EnrichBusinessRequest & { photos?: string[] }>,
		res: Response,
	) => {
		try {
			const { websiteUri, businessName, category, photos } = req.body;
			if (!businessName) {
				return res.status(400).json({ error: "Missing businessName" });
			}

			// First choice: Google Maps photos (already collected by frontend)
			let detectedLogo = photos && photos.length > 0 ? photos[0] : undefined;
			if (detectedLogo && detectedLogo.includes("googleusercontent.com")) {
				// Optimize for logo use (square crop, reasonable size)
				detectedLogo = detectedLogo.split("=")[0] + "=s400-c";
			}

			function categoryImageSuggestions(cat: string, name?: string) {
				const c = (cat || "").toLowerCase();
				if (c.includes("restaurant") || c.includes("cafe")) {
					return [
						"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
						"https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80",
						"https://images.unsplash.com/photo-1541542684-18f77c1f6b5a?auto=format&fit=crop&w=1200&q=80",
					];
				}
				if (c.includes("salon") || c.includes("spa")) {
					return [
						"https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
						"https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
						"https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1200&q=80",
					];
				}
				if (c.includes("gym") || c.includes("fitness")) {
					return [
						"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
						"https://images.unsplash.com/photo-1517960413843-0aee4a3d5a0c?auto=format&fit=crop&w=1200&q=80",
						"https://images.unsplash.com/photo-1558611848-73f7eb4001d6?auto=format&fit=crop&w=1200&q=80",
					];
				}
				// generic
				return [
					"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
					"https://images.unsplash.com/photo-1500306365237-7b4b9d7d0f0b?auto=format&fit=crop&w=1200&q=80",
					"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
				];
			}

			if (!websiteUri) {
				return res.json({
					email: undefined,
					phones: [],
					imageSuggestions: categoryImageSuggestions(category, businessName),
				});
			}

			const response = await fetch(websiteUri, {
				headers: {
					"User-Agent": "Mozilla/5.0 (compatible; DigitalScout/1.0)",
				},
			});

			if (!response.ok) {
				return res.json({
					email: undefined,
					phones: [],
					imageSuggestions: [],
				});
			}

			const html = await response.text();
			const email = extractEmails(html)[0];
			const phones = extractPhones(html);
			const imageSuggestions = extractImages(html);

			// Second choice: Website logo detection
			const websiteLogo = extractLogo(html, websiteUri);
			if (websiteLogo) {
				detectedLogo = websiteLogo;
			}

			return res.json({
				email,
				phones,
				imageSuggestions,
				logo: detectedLogo,
				businessName,
				category,
			});
		} catch (error) {
			console.error("Enrich business error:", error);
			return res.json({
				email: undefined,
				phones: [],
				imageSuggestions: [],
				logo: req.body.photos?.[0],
			});
		}
	},
);

function extractLogo(html: string, baseUrl: string): string | undefined {
	try {
		// 1. Try manifest/icons or link rel shortcuts
		const iconRegex =
			/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i;
		const appleIconRegex =
			/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i;
		const ogImageRegex =
			/<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i;
		const schemaLogoRegex = /["']logo["']\s*:\s*["']([^"']+)["']/i;

		const match =
			html.match(ogImageRegex) ||
			html.match(appleIconRegex) ||
			html.match(iconRegex) ||
			html.match(schemaLogoRegex);

		if (match && match[1]) {
			let logoUrl = match[1];
			if (logoUrl.startsWith("//")) {
				logoUrl = "https:" + logoUrl;
			} else if (logoUrl.startsWith("/")) {
				const origin = new URL(baseUrl).origin;
				logoUrl = origin + logoUrl;
			} else if (!logoUrl.startsWith("http")) {
				const origin = new URL(baseUrl).origin;
				logoUrl = origin + "/" + logoUrl;
			}
			return logoUrl;
		}

		// 3. Fallback to favicon.ico
		try {
			const origin = new URL(baseUrl).origin;
			return `${origin}/favicon.ico`;
		} catch {
			return undefined;
		}
	} catch {
		return undefined;
	}
}

app.post(
	"/api/qualify-leads",
	async (req: Request<{}, {}, QualifyLeadsRequest>, res: Response) => {
		try {
			const { businesses, city } = req.body;
			if (!Array.isArray(businesses)) {
				return res.status(400).json({ error: "Missing businesses array" });
			}

			const candidates = businesses.filter(
				(business) => business && typeof business.name === "string",
			);

			const qualifications = await runWithConcurrency(
				candidates,
				3,
				async (business) => {
					const qualification = await qualifyLeadCandidate(business, city);
					return { business, qualification };
				},
			);

			const qualifiedBusinesses = qualifications
				.filter(
					({ qualification }) =>
						!qualification.hasWebsite &&
						Boolean(qualification.email || qualification.phoneNumber),
				)
				.map(({ business, qualification }) => ({
					...business,
					websiteUri: qualification.websiteUri,
					email: qualification.email || business.email,
					phoneNumber: qualification.phoneNumber || business.phoneNumber,
					notes: qualification.notes || undefined,
					confidence: qualification.confidence || undefined,
				}));

			return res.json({
				businesses: qualifiedBusinesses,
				totalCandidates: candidates.length,
				totalQualified: qualifiedBusinesses.length,
			});
		} catch (error) {
			return res.status(500).json({
				error:
					error instanceof Error ? error.message : "Lead qualification failed",
			});
		}
	},
);

app.post(
	"/api/wordpress/provision-site",
	authenticateToken,
	async (req: any, res: Response) => {
		try {
			const { projectId, business, websiteSchema, provisioningPlan, status } =
				req.body;
			if (!projectId || !business || !websiteSchema) {
				return res.status(400).json({
					error: "Missing projectId, business, or websiteSchema.",
				});
			}

			const renderSource = (websiteSchema as any)._renderSource || "unknown";
			const wpHtml = (websiteSchema as any)._wordpressHtml as
				| string
				| undefined;
			logStderr(
				`[Provisioning] queue request projectId=${projectId} business=${business.name} traceId=${websiteSchema.meta?.traceId || "n/a"} renderSource=${renderSource} wpHtml=${wpHtml ? `yes(${wpHtml.length})` : "no"}`,
			);

			const jobId = crypto.randomUUID();
			const traceId =
				websiteSchema.meta?.traceId ||
				websiteSchema._validation?.traceId ||
				null;
			const isPreview = String(projectId).includes("preview-");
			const previewExpiresAt = isPreview
				? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
				: null;

			const [existing]: any = await pool.query(
				`SELECT id FROM provisioning_jobs WHERE project_id = ? LIMIT 1`,
				[projectId],
			);

			const targetStatus = status || "pending";
			let activeJobId = jobId;

			if (existing && existing.length > 0) {
				activeJobId = existing[0].id;
				await pool.query(
					`UPDATE provisioning_jobs SET website_schema = ?, status = ?, trace_id = ?, updated_at = NOW(), user_id = ? WHERE project_id = ?`,
					[
						JSON.stringify(websiteSchema),
						targetStatus,
						traceId,
						req.user.id,
						projectId,
					],
				);
			} else {
				await pool.query(
					`INSERT INTO provisioning_jobs (id, project_id, business_name, website_schema, status, trace_id, is_preview, preview_expires_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					[
						jobId,
						projectId,
						business.name,
						JSON.stringify(websiteSchema),
						targetStatus,
						traceId,
						isPreview,
						previewExpiresAt,
						req.user.id,
					],
				);
			}

			return res.json({
				success: true,
				jobId: activeJobId,
				message: isPreview
					? "Preview provisioning queued"
					: "Provisioning job queued successfully",
				previewExpiresAt,
			});
		} catch (error) {
			return res.status(500).json({
				error:
					error instanceof Error
						? error.message
						: "Failed to queue provisioning job",
			});
		}
	},
);

app.get(
	"/api/wordpress/site-status/:projectId",
	authenticateToken,
	async (req: any, res) => {
		const { projectId } = req.params;
		try {
			const [rows]: any = await pool.query(
				`SELECT status, logs, subdomain, subdomain_url, wp_admin_url, ssl_status, wp_admin_user, wp_admin_pass_encrypted 
			 FROM provisioning_jobs 
			 LEFT JOIN isolated_deployments ON provisioning_jobs.project_id = isolated_deployments.project_id
			 WHERE provisioning_jobs.project_id = ? AND provisioning_jobs.user_id = ? ORDER BY provisioning_jobs.created_at DESC LIMIT 1`,
				[projectId, req.user.id],
			);

			if (!rows || rows.length === 0) {
				return res.status(404).json({ error: "Job not found" });
			}

			const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscout.online";
			const liveUrl = rows[0].subdomain_url || null;
			const adminUrl = rows[0].wp_admin_url || null;
			const effectiveStatus = rows[0].status;
			let rawPassword = null;
			if (effectiveStatus === "completed" && rows[0].wp_admin_pass_encrypted) {
				try {
					const [ivHex, encryptedHex] =
						rows[0].wp_admin_pass_encrypted.split(":");
					const key =
						process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
					const decipher = crypto.createDecipheriv(
						"aes-256-cbc",
						Buffer.from(key),
						Buffer.from(ivHex, "hex"),
					);
					let decrypted = decipher.update(Buffer.from(encryptedHex, "hex"));
					decrypted = Buffer.concat([decrypted, decipher.final()]);
					rawPassword = decrypted.toString();
				} catch (e) {
					console.error("Decryption failed:", e);
				}
			}

			return res.json({
				success: true,
				status: effectiveStatus,
				logs: rows[0].logs || [],
				deployment: liveUrl
					? {
							liveUrl,
							adminUrl,
							username: rows[0].wp_admin_user || "admin",
							password: rawPassword,
							sslStatus: rows[0].ssl_status || "pending",
						}
					: null,
			});
		} catch (error) {
			return res.status(500).json({
				error:
					error instanceof Error ? error.message : "Failed to fetch status",
			});
		}
	},
);

app.get("/api/generate/replay/:traceId", async (req, res) => {
	const { traceId } = req.params;
	try {
		const inputPath = path.join(
			DEBUG_ROOT_DIR,
			traceId,
			"06-renderer-input.json",
		);
		if (!fs.existsSync(inputPath)) {
			return res
				.status(404)
				.json({ error: "Trace not found or missing renderer input" });
		}

		const schemaContent = fs.readFileSync(inputPath, "utf-8");
		const rawSchema = JSON.parse(schemaContent);

		const { validateWebsiteSchema } =
			await import("./src/lib/website-schema-validator");
		const { schemaToGutenbergBlocks } = await import("./src/lib/wordpress");

		const validatedSchema = validateWebsiteSchema(rawSchema);
		const blocks = schemaToGutenbergBlocks(validatedSchema);

		return res.json({
			success: true,
			schema: validatedSchema,
			blocks,
		});
	} catch (error) {
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Failed to replay trace",
		});
	}
});

app.delete(
	"/api/wordpress/site/:projectId",
	authenticateToken,
	async (req: any, res) => {
		try {
			const { projectId } = req.params;
			if (!projectId) {
				return res.status(400).json({ error: "Missing projectId" });
			}

			// Verify project belongs to user or is unowned
			const [rows]: any = await pool.query(
				`SELECT id, user_id FROM provisioning_jobs WHERE project_id = ? LIMIT 1`,
				[projectId],
			);
			if (!rows || rows.length === 0) {
				return res
					.status(404)
					.json({ error: "Project not found" });
			}
			if (rows[0].user_id && rows[0].user_id !== req.user.id) {
				return res
					.status(403)
					.json({ error: "Unauthorized to delete this project" });
			}

			await deleteProvisionedWordPressSite(projectId);
			return res.json({
				success: true,
				message: `WordPress site for project ${projectId} deleted successfully`,
			});
		} catch (error) {
			return res.status(500).json({
				error:
					error instanceof Error
						? error.message
						: "Failed to delete WordPress site",
			});
		}
	},
);

app.get("/api/leads", authenticateToken, async (req: any, res) => {
	try {
		const [rows]: any = await pool.query(
			`SELECT 
				pj.project_id as id,
				pj.business_name as businessName,
				pj.website_schema as websiteSchema,
				pj.status as provisioningStatus,
				pj.created_at as lastProvisionedAt,
				pj.wp_admin_user as wordpressOwnerUsername,
				pj.wp_admin_pass_encrypted,
				idp.subdomain_url as wordpressSiteUrl,
				idp.wp_admin_url as wordpressAdminUrl,
				idp.ssl_status as sslStatus
			 FROM provisioning_jobs pj
			 LEFT JOIN isolated_deployments idp ON pj.project_id = idp.project_id
			 WHERE pj.user_id = ?
			 ORDER BY pj.created_at DESC`,
			[req.user.id],
		);

		const leads = rows.map((row: any) => {
			let rawPassword = null;
			if (row.wp_admin_pass_encrypted) {
				try {
					const [ivHex, encryptedHex] = row.wp_admin_pass_encrypted.split(":");
					const key =
						process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
					const decipher = crypto.createDecipheriv(
						"aes-256-cbc",
						Buffer.from(key),
						Buffer.from(ivHex, "hex"),
					);
					let decrypted = decipher.update(Buffer.from(encryptedHex, "hex"));
					decrypted = Buffer.concat([decrypted, decipher.final()]);
					rawPassword = decrypted.toString();
				} catch (e) {}
			}

			let schema: any = {};
			try {
				schema =
					typeof row.websiteSchema === "string"
						? JSON.parse(row.websiteSchema)
						: row.websiteSchema || {};
			} catch {
				schema = {};
			}
			return {
				...row,
				businessId: schema.meta?.businessId || row.id,
				businessAddress: schema.brand?.address || "",
				businessCategory: schema.brand?.category || "General",
				rating: schema._validation?.rating || 0,
				reviewCount: schema._validation?.reviewCount || 0,
				email: schema.brand?.email || "",
				phoneNumber: schema.brand?.phone || "",
				logo: schema.brand?.logo || schema._validation?.logo || "",
				photos: schema._validation?.photos || [],
				imageSuggestions: schema._validation?.imageSuggestions || [],
				wordpressPassword: rawPassword,
				websiteContent: "",
				isDeployed: row.provisioningStatus === "completed" || row.provisioningStatus === "ready" || !!row.wordpressSiteUrl,
			};
		});

		return res.json(leads);
	} catch (error) {
		console.error("[Leads] Failed to fetch leads:", error);
		return res.status(500).json({ error: "Failed to fetch leads history" });
	}
});

app.post(
	"/api/outreach/send",
	async (req: Request<{}, {}, OutreachRequest>, res: Response) => {
		try {
			const { businessName, phoneNumber, message, preferredChannel } = req.body;

			// Validate inputs
			if (!businessName || !phoneNumber || !message) {
				return res.status(400).json({
					error: "Missing required fields: businessName, phoneNumber, message",
				});
			}

			// Check if CallHippo API key is configured
			if (!CALLHIPPO_API_KEY) {
				console.error("[CallHippo] API key is not configured");
				return res.status(500).json({
					error:
						"CallHippo API key is not configured on the server. Please check .env.local.",
				});
			}

			// Send outreach via CallHippo
			const result: OutreachResponse = await sendOutreachViaCallHippo(
				{
					businessName,
					phoneNumber,
					message,
					preferredChannel: preferredChannel || "whatsapp",
				},
				CALLHIPPO_API_KEY,
			);

			if (result.success) {
				console.log(
					`[Outreach] Successfully sent via ${result.channel} to ${phoneNumber}`,
				);
				return res.json({
					success: true,
					channel: result.channel,
					messageId: result.messageId,
					status: result.status,
				});
			} else {
				console.warn(
					`[Outreach] Failed to send to ${phoneNumber}: ${result.error}`,
				);
				return res.status(500).json({
					success: false,
					error: result.error || "Failed to send outreach message",
				});
			}
		} catch (error) {
			console.error("[Outreach] Unexpected error:", error);
			return res.status(500).json({
				error:
					error instanceof Error ? error.message : "Outreach sending failed",
			});
		}
	},
);

app.get(
	"/api/business-ai-chat/:leadId",
	async (req: Request, res: Response) => {
		try {
			const { leadId } = req.params;
			if (!leadId) {
				return res.status(400).json({ error: "Missing leadId" });
			}
			const [messages]: any = await pool.query(
				"SELECT role, content, created_at FROM lead_ai_messages WHERE lead_id = ? ORDER BY id ASC",
				[leadId],
			);
			return res.json({ messages: messages || [] });
		} catch (error) {
			console.error("[AI Chat] Failed to fetch chat history:", error);
			return res.status(500).json({ error: "Failed to fetch chat history" });
		}
	},
);

app.post("/api/business-ai-chat", async (req: Request, res: Response) => {
	try {
		const { leadId, businessContext, messages, conversationId } = req.body;

		if (!leadId || !businessContext || !Array.isArray(messages)) {
			return res.status(400).json({
				error: "Missing required fields: leadId, businessContext, messages",
			});
		}

		// 1. Save user's latest message if it's the last one in the array
		const latestMessage = messages[messages.length - 1];
		let chatContents: any[] = [];
		try {
			if (latestMessage && latestMessage.role === "user") {
				await pool.query(
					"INSERT INTO lead_ai_messages (lead_id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
					[leadId, conversationId || leadId, "user", latestMessage.content],
				);
			}

			// 2. Fetch full history for local conversational memory
			const [dbHistory]: any = await pool.query(
				"SELECT role, content FROM lead_ai_messages WHERE lead_id = ? ORDER BY id ASC",
				[leadId],
			);

			chatContents = dbHistory.map((m: any) => ({
				role: m.role === "user" ? "user" : "model",
				parts: [{ text: m.content }],
			}));
		} catch (dbError) {
			console.warn(
				"[AI Chat] Database offline. Using stateless array fallback:",
				dbError,
			);
			chatContents = messages.map((m: any) => ({
				role: m.role === "user" ? "user" : "model",
				parts: [{ text: m.content }],
			}));
		}

		if (chatContents.length === 0) {
			chatContents.push({
				role: "user",
				parts: [{ text: latestMessage?.content || "Hello" }],
			});
		}

		// 3. Resolve REST API Url and Key
		const restUrl =
			process.env.GEMINI_REST_URL ||
			"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
		const key =
			getLatestApiKeyFromDisk() ||
			process.env.GEMINI_API_KEY ||
			process.env.GENAI_KEY ||
			GENAI_KEY;
		if (!key) {
			return res.status(500).json({
				error:
					"Gemini API key is not configured on the server. Please check your .env.production.",
			});
		}

		// 4. Construct strategic, contextual system prompt
		const businessName = businessContext.name || "Local Business";
		const businessCategory = businessContext.category || "Local Service";
		const businessAddress = businessContext.address || "N/A";
		const rating = businessContext.rating || "N/A";
		const reviewCount = businessContext.reviewCount || 0;

		const reviewsText =
			Array.isArray(businessContext.reviews) && businessContext.reviews.length
				? businessContext.reviews
						.map(
							(r: any, i: number) =>
								`${i + 1}. [Rating: ${r.rating || "N/A"}] "${r.text || r.comment || ""}"`,
						)
						.join("\n")
				: "No reviews or rating insights available.";

		let websiteText = "";
		if (businessContext.websiteSchema) {
			const ws = businessContext.websiteSchema;
			websiteText = `
Generated Website Details:
- Theme: ${ws.theme?.name || "N/A"} (Style: ${ws.theme?.style || "N/A"})
- Palette Background: ${ws.theme?.palette?.background || "N/A"}, Primary: ${ws.theme?.palette?.primary || "N/A"}, Accent: ${ws.theme?.palette?.accent || "N/A"}
- Typography: Heading: ${ws.theme?.typography?.heading || "N/A"}, Body: ${ws.theme?.typography?.body || "N/A"}
- SEO Title: ${ws.seo?.title || "N/A"}
- SEO Description: ${ws.seo?.description || "N/A"}
- Sections Configured: ${Array.isArray(ws.sections) ? ws.sections.map((s: any) => `${s.type} (${s.layout || "default"})`).join(", ") : "None"}
`;
		}

		const systemPrompt = `You are an elite, production-grade AI Business Intelligence Assistant, local market analyst, SEO consultant, and branding strategist.
You are deeply grounded in the following business context for ${businessName}:
- Name: ${businessName}
- Category: ${businessCategory}
- Address: ${businessAddress}
- Rating: ${rating} (${reviewCount} reviews)

Reviews & Sentiment:
${reviewsText}
${websiteText}

Rules for your responses:
1. Act as a high-value growth strategist and consultant, NOT a generic chatbot. Provide action items, local SEO opportunities, conversion enhancements, and competitor analysis.
2. Utilize native Google Search grounding to query real-world competitors, neighboring prices, local SEO rankings, and local citations for this exact neighborhood and business type.
3. Be highly structured and readable. Format your answers in professional Markdown with bullet points, bold opportunities, and clean comparison tables. Keep paragraphs strategic and concise.`;

		// 6. Set headers for standard HTTP text response
		res.writeHead(200, {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		});

		// 7. Generate content from Gemini (try Vertex AI first, then SDK, then REST fallback)
		let fullResponseText = "";
		let fallbackUsed = false;

		const googleCloudApiKey = process.env.GOOGLE_CLOUD_API_KEY;
		if (googleCloudApiKey) {
			try {
				console.log("[AI Chat] Attempting primary Vertex AI generation...");
				const apiEndpoint =
					process.env.VERTEX_API_ENDPOINT || "aiplatform.googleapis.com";
				const modelId = "gemini-3.1-pro-preview";
				const generateContentApi = "generateContent";
				const vertexUrl = `https://${apiEndpoint}/v1/publishers/google/models/${modelId}:${generateContentApi}?key=${googleCloudApiKey}`;

				await throttleGemini();
				const vertexPayload = {
					contents: chatContents,
					systemInstruction: {
						parts: [{ text: systemPrompt }],
					},
					generationConfig: {
						temperature: 0.2,
					},
					tools: [{ googleSearch: {} }],
				};

				const res = await fetch(vertexUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(vertexPayload),
				});

				if (res.ok) {
					const data = (await res.json()) as any;
					const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
					if (text) {
						fullResponseText = text;
						console.log("[AI Chat] Vertex AI generation succeeded!");
					} else {
						throw new Error("Vertex response contents parts were empty");
					}
				} else {
					const errText = await res.text().catch(() => "");
					throw new Error(
						`Vertex REST failed with status ${res.status}: ${errText}`,
					);
				}
			} catch (vertexError) {
				console.warn(
					"[AI Chat] Vertex AI generation failed, falling back to Public Gemini SDK:",
					vertexError,
				);
				fallbackUsed = true;
			}
		} else {
			fallbackUsed = true;
		}

		if (fallbackUsed || !fullResponseText) {
			const genAI = await getSDKGenAI();
			if (genAI) {
				try {
					console.log(
						"[AI Chat] Attempting SDK generation with gemini-3.1-pro-preview...",
					);
					await throttleGemini();
					const result = await genAI.models.generateContent({
						model: "gemini-3.1-pro-preview",
						contents: chatContents,
						config: {
							systemInstruction: systemPrompt,
							tools: [{ googleSearch: {} }] as any,
						},
					});

					fullResponseText = result.text || "";
				} catch (sdkError) {
					console.warn(
						"[AI Chat] SDK generation failed, falling back to REST:",
						sdkError,
					);
					fallbackUsed = true;
				}
			} else {
				console.log("[AI Chat] SDK not available, falling back to REST");
				fallbackUsed = true;
			}
		}

		if (!fullResponseText) {
			console.log(
				"[AI Chat] Attempting REST generation with gemini-flash-latest...",
			);
			const modelRestUrl = restUrl.includes("{model}")
				? restUrl.replace("{model}", "gemini-flash-latest")
				: restUrl;
			const url = `${modelRestUrl}${modelRestUrl.includes("?") ? "&" : "?"}key=${key}`;

			const requestBody = {
				contents: chatContents,
				systemInstruction: {
					parts: [{ text: systemPrompt }],
				},
				tools: [{ googleSearch: {} }],
			};

			await throttleGemini();
			const fetchResponse = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			});

			if (!fetchResponse.ok) {
				const errorText = await fetchResponse.text().catch(() => "");
				throw new Error(
					`Gemini REST API returned status ${fetchResponse.status}: ${errorText}`,
				);
			}

			const responseJson = (await fetchResponse.json()) as any;
			fullResponseText =
				responseJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
		}

		res.write(fullResponseText);

		// 8. Store response in the database for continuity
		if (fullResponseText.trim()) {
			try {
				await pool.query(
					"INSERT INTO lead_ai_messages (lead_id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
					[leadId, conversationId || leadId, "model", fullResponseText],
				);
			} catch (dbError) {
				console.warn(
					"[AI Chat] Failed to save AI response text to database:",
					dbError,
				);
			}
		}

		res.end();
	} catch (error) {
		console.error("[AI Chat] Error during chat session:", error);
		if (!res.headersSent) {
			return res.status(500).json({
				error:
					error instanceof Error
						? error.message
						: "Chat session generation failed",
			});
		} else {
			const errMessage = error instanceof Error ? error.message : String(error);
			res.write(
				`\n\n*Error: Connection to Gemini failed. Details: ${errMessage}*`,
			);
			res.end();
		}
	}
});

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.delete("/api/sites/:siteId", async (req: Request, res: Response) => {
	try {
		if (!NETLIFY_TOKEN) {
			return res
				.status(500)
				.json({ error: "Netlify token not configured on server" });
		}

		const { siteId } = req.params;
		if (!siteId) {
			return res.status(400).json({ error: "Missing siteId" });
		}

		const response = await fetch(
			`https://api.netlify.com/api/v1/sites/${siteId}`,
			{
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${NETLIFY_TOKEN}`,
				},
			},
		);

		if (!response.ok) {
			const errorDetails = await response.text();
			return res.status(response.status).json({
				error: `Failed to delete Netlify site: ${response.statusText}`,
				details: errorDetails,
			});
		}

		return res.json({ success: true, siteId });
	} catch (error) {
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Delete failed",
		});
	}
});

// --- SSL Polling Worker ---
async function pollSslStatus() {
	try {
		const [deployments]: any = await pool.query(
			`SELECT * FROM isolated_deployments 
			 WHERE ssl_status = 'pending' 
			 ORDER BY last_ssl_check IS NULL DESC, last_ssl_check ASC 
			 LIMIT 5`,
		);

		for (const dep of deployments) {
			const httpsUrl = dep.subdomain_url.replace("http://", "https://");
			const host = httpsUrl.replace("https://", "").split("/")[0];

			console.log(`[SSL Worker] Checking SSL for ${host}`);

			try {
				const https = await import("https");
				await new Promise((resolve, reject) => {
					const req = https.get(
						{
							hostname: host,
							port: 443,
							path: "/",
							timeout: 5000,
							rejectUnauthorized: true, // We want to know if the cert is valid
						},
						(res) => {
							resolve(true);
						},
					);

					req.on("error", (e) => reject(e));
					req.on("timeout", () => {
						req.destroy();
						reject(new Error("Timeout"));
					});
				});

				console.log(`[SSL Worker] SSL is VALID for ${httpsUrl}. Upgrading...`);
				await pool.query(
					`UPDATE isolated_deployments SET ssl_status = 'valid', subdomain_url = ?, wp_admin_url = ? WHERE id = ?`,
					[httpsUrl, `${httpsUrl}/wp-admin`, dep.id],
				);
			} catch (error) {
				// SSL not ready yet
				console.log(`[SSL Worker] SSL not ready for ${host}`);
				await pool.query(
					`UPDATE isolated_deployments SET last_ssl_check = NOW() WHERE id = ?`,
					[dep.id],
				).catch(() => {});
			}
		}
	} catch (error) {
		console.error("[SSL Worker] Error:", error);
	}
}

// --- Preview Site Cleanup Worker ---
async function pollCleanupPreviewSites() {
	try {
		const [deployments]: any = await pool.query(
			`SELECT project_id, preview_expires_at, status FROM provisioning_jobs WHERE preview_expires_at < NOW() AND status != 'cleaned' LIMIT 10`,
		);

		for (const dep of deployments) {
			console.log(
				`[Cleanup Worker] Cleaning up expired preview for project ${dep.project_id}`,
			);
			try {
				await deleteProvisionedWordPressSite(dep.project_id);
				await pool.query(
					`UPDATE provisioning_jobs SET status = 'cleaned' WHERE project_id = ?`,
					[dep.project_id],
				);
				console.log(
					`[Cleanup Worker] Cleanup successful for project ${dep.project_id}`,
				);
			} catch (error) {
				console.error(
					`[Cleanup Worker] Failed to clean up ${dep.project_id}:`,
					error,
				);
			}
		}
	} catch (error) {
		console.error("[Cleanup Worker] Error:", error);
	}
}

setInterval(pollSslStatus, 120000);
setInterval(pollCleanupPreviewSites, 300000); // 5 minutes

app.listen(PORT, async () => {
	console.log(`Server is running on http://localhost:${PORT}`);
	await initializeDatabase();
	startProvisioningWorker();
});

export default app;
