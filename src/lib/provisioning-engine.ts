/** @format */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import crossFetch from "cross-fetch";
import { pool } from "./db";
import {
	addSubdomain,
	deleteSubdomain,
	createDatabase,
	createDatabaseUser,
	setDatabasePrivileges,
	deleteDatabase,
	deleteDatabaseUser,
	checkSubdomainExists,
	remoteDirectoryExists,
} from "./cpanel-uapi";
import {
	checkWpCliAvailable,
	downloadWordPressCore,
	createWpConfig,
	installWordPress,
	configurePermalinks,
	runWpCommand,
	runRemoteShellCommand,
	copyFileToRemote,
} from "./wp-cli";
import { mergeElementorTemplate } from "./elementor-merger";
import { generateWithFallback } from "./gemini";

// NOTE: No local `fs` import — all filesystem operations are remote via SSH.

const MAX_RETRIES = 3;
const DEBUG_ROOT_DIR = path.join(process.cwd(), ".debug-generation");

// ---------------------------------------------------------------------------
// Subdomain Generation
// ---------------------------------------------------------------------------

/** DNS-safe maximum length for a single subdomain label */
const MAX_SUBDOMAIN_LENGTH = 45;

/** Semantic fallback suffixes tried before random characters */
const SUBDOMAIN_SEMANTIC_VARIANTS = [
	"-shop",
	"-store",
	"-official",
	"-co",
	"-pro",
];

/**
 * Sanitizes a business name into a DNS-safe subdomain base.
 * Strips accents, replaces non-alphanumeric with hyphens, collapses/trims hyphens.
 */
function sanitizeSubdomainBase(name: string): string {
	return (name || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // strip accent marks
		.replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → hyphen
		.replace(/-+/g, "-") // collapse repeated hyphens
		.replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
		.substring(0, 40) // leave room for any suffix
		.replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens again after truncation
}

/**
 * Helper to ensure a subdomain candidate is DNS-safe by collapsing and trimming hyphens.
 */
function cleanSubdomain(sub: string): string {
	return sub.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Checks whether a subdomain is already in use by an active provisioning job.
 * Uses our own DB as the source of truth — fast, no external API call.
 */
async function isSubdomainTaken(subdomain: string): Promise<boolean> {
	const [rows]: any = await pool.query(
		`SELECT id FROM provisioning_jobs
		 WHERE subdomain = ? AND status NOT IN ('failed', 'cleaned')
		 LIMIT 1`,
		[subdomain],
	);
	return rows && rows.length > 0;
}

/**
 * Generates the cleanest available subdomain for a business name.
 *
 * Priority order:
 *  1. Plain sanitized name          → "don-rafa-s-cyclery"
 *  2. Numeric variants 1–5          → "don-rafa-s-cyclery-1"
 *  3. Semantic variants             → "don-rafa-s-cyclery-shop"
 *  4. Short random suffix (x4 hex)  → "don-rafa-s-cyclery-a3f1"
 */
async function generateUniqueSubdomain(businessName: string): Promise<string> {
	const base = sanitizeSubdomainBase(businessName);

	if (!base) {
		// Edge case: empty business name
		return `site-${crypto.randomBytes(3).toString("hex")}`;
	}

	// Priority 1: clean subdomain
	if (!(await isSubdomainTaken(base))) {
		return base;
	}

	// Priority 2: numeric variants
	for (let i = 1; i <= 5; i++) {
		const candidate = cleanSubdomain(`${base}-${i}`.substring(0, MAX_SUBDOMAIN_LENGTH));
		if (!(await isSubdomainTaken(candidate))) {
			return candidate;
		}
	}

	// Priority 3: semantic variants
	for (const suffix of SUBDOMAIN_SEMANTIC_VARIANTS) {
		const candidate = cleanSubdomain(`${base}${suffix}`.substring(0, MAX_SUBDOMAIN_LENGTH));
		if (!(await isSubdomainTaken(candidate))) {
			return candidate;
		}
	}

	// Priority 4: short random hex suffix (last resort)
	for (let attempt = 0; attempt < 10; attempt++) {
		const suffix = crypto.randomBytes(2).toString("hex"); // 4 chars e.g. "a3f1"
		const candidate = cleanSubdomain(`${base}-${suffix}`.substring(0, MAX_SUBDOMAIN_LENGTH));
		if (!(await isSubdomainTaken(candidate))) {
			return candidate;
		}
	}

	// Absolute last resort (collision-safe)
	return cleanSubdomain(`${base}-${crypto.randomBytes(4).toString("hex")}`.substring(
		0,
		MAX_SUBDOMAIN_LENGTH,
	));
}

/**
 * Calls Vertex/Gemini to suggest a professional and semantic alternative subdomain name
 * when the primary candidate is already taken on cPanel.
 */
async function suggestAlternativeSubdomainViaVertex(
	businessName: string,
	existingSubdomain: string,
	attemptNumber: number,
	log: (msg: string) => void,
): Promise<string> {
	try {
		log(`[cPanel-Subdomain] Querying Vertex for an alternative subdomain for "${businessName}" because "${existingSubdomain}" is taken.`);
		const prompt = `You are a professional local business web hosting setup assistant.
The business name is "${businessName}".
The primary subdomain candidate "${existingSubdomain}" is already taken on our server.
Please suggest one alternative, professional, clean, DNS-safe subdomain name that is highly relevant to this business.
Follow these rules strictly:
1. ONLY lowercase letters, numbers, and hyphens are allowed. No other characters.
2. Max 45 characters long.
3. It must be different from "${existingSubdomain}".
4. It must NOT contain suffixes like "-1" or random numbers. Make it semantic and professional (e.g., adding words like "cabinetry", "woodwork", "shop", "builders", or local keywords if relevant).
5. Attempt number: ${attemptNumber}. If attempt is greater than 1, make it more unique.
6. Return ONLY the alternative subdomain name string itself, with no explanation, no formatting, no markdown, and no punctuation.`;

		const responseText = await generateWithFallback(
			prompt,
			{ temperature: 0.7 },
			{
				logStderr: log,
				throttleGemini: async () => {},
				contextLabel: "alternative-subdomain-generation"
			}
		);

		const result = responseText?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
		if (result && result.length > 2 && result !== existingSubdomain) {
			log(`[cPanel-Subdomain] Vertex suggested alternative subdomain: "${result}"`);
			return result;
		}
	} catch (e: any) {
		log(`[cPanel-Subdomain] Vertex error suggesting subdomain: ${e.message || e}`);
	}

	// Fallback to simple random suffix if Vertex fails
	const suffix = crypto.randomBytes(3).toString("hex");
	return cleanSubdomain(`${sanitizeSubdomainBase(businessName)}-${suffix}`.substring(0, MAX_SUBDOMAIN_LENGTH));
}

function generateSecurePassword() {
	return crypto.randomBytes(16).toString("hex") + "!aA1";
}

function encrypt(text: string) {
	const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
	let encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(encryptedValue: string): string {
	const [ivHex, encHex] = encryptedValue.split(":");
	const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
	const decipher = crypto.createDecipheriv(
		"aes-256-cbc",
		Buffer.from(key),
		Buffer.from(ivHex, "hex"),
	);
	let decrypted = decipher.update(Buffer.from(encHex, "hex"));
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
}

async function appendLog(jobId: string, message: string) {
	const timestamp = new Date().toISOString();
	const logEntry = `[${timestamp}] ${message}`;
	console.log(`[Job ${jobId}] ${message}`);
	fs.writeSync(2, `[Job ${jobId}] ${message}\n`);

	await pool.query(
		`UPDATE provisioning_jobs SET logs = JSON_ARRAY_APPEND(COALESCE(logs, JSON_ARRAY()), '$', ?) WHERE id = ?`,
		[logEntry, jobId],
	);
}

export async function processJob(jobId: string) {
	const [rows]: any = await pool.query(
		`SELECT * FROM provisioning_jobs WHERE id = ?`,
		[jobId],
	);
	if (!rows || rows.length === 0) return;

	const job = rows[0];
	if (job.status === "completed" || job.status === "failed") return;

	try {
		await executeStateMachine(job);
	} catch (error: any) {
		await appendLog(job.id, `ERROR: ${error.message}`);

		if (job.retry_count < MAX_RETRIES) {
			await appendLog(
				job.id,
				`Retrying later (Attempt ${job.retry_count + 1}/${MAX_RETRIES})`,
			);
			await pool.query(
				`UPDATE provisioning_jobs SET retry_count = retry_count + 1, locked_at = NULL WHERE id = ?`,
				[job.id],
			);
		} else {
			await appendLog(job.id, `Max retries reached. Initiating rollback.`);
			await rollbackJob(job);
			await pool.query(
				`UPDATE provisioning_jobs SET status = 'failed', locked_at = NULL WHERE id = ?`,
				[job.id],
			);
		}
	}
}

async function executeStateMachine(job: any) {
	const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscoutwp.online";
	const docRootBase =
		process.env.WP_DOCROOT_BASE || "/home/digigesf/public_html/sites";

	let subdomain = job.subdomain;
	let dbName = job.db_name;
	let dbUser = job.db_user;
	let wpAdminUser = job.wp_admin_user || "admin";
	let wpAdminPass = job.wp_admin_pass_encrypted;

	// ── STEP 1: Creating Subdomain ──────────────────────────────────────────
	if (job.status === "pending" || job.status === "creating_subdomain") {
		await pool.query(
			`UPDATE provisioning_jobs SET status = 'creating_subdomain' WHERE id = ?`,
			[job.id],
		);
		await appendLog(job.id, "Starting subdomain creation on remote WP server");

		if (!subdomain) {
			const name = job.business_name || job.project_id;
			subdomain = await generateUniqueSubdomain(name);
			await appendLog(job.id, `Generated subdomain: "${subdomain}"`);
			await pool.query(
				`UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`,
				[subdomain, job.id],
			);
		}

		let subdomainOk = false;
		let attempts = 0;
		const maxSubdomainAttempts = 3;

		while (!subdomainOk && attempts < maxSubdomainAttempts) {
			attempts++;
			const fullDocRoot = `${docRootBase}/${subdomain}`;
			await appendLog(job.id, `Remote doc root will be: ${fullDocRoot}`);

			// Pre-check: Check if the subdomain already exists in cPanel or if the remote directory exists
			let existsOnServer = false;
			try {
				const subExists = await checkSubdomainExists(subdomain, rootDomain);
				const dirExists = await remoteDirectoryExists(fullDocRoot);
				if (subExists || dirExists) {
					existsOnServer = true;
					await appendLog(
						job.id,
						`Subdomain "${subdomain}.${rootDomain}" or remote directory "${fullDocRoot}" already exists on Namecheap/cPanel server.`,
					);
				}
			} catch (chkErr: any) {
				await appendLog(
					job.id,
					`Warning during subdomain existence pre-check: ${chkErr.message || chkErr}`,
				);
			}

			if (existsOnServer) {
				if (attempts < maxSubdomainAttempts) {
					const prevSubdomain = subdomain;
					subdomain = await suggestAlternativeSubdomainViaVertex(
						job.business_name || job.project_id,
						prevSubdomain,
						attempts,
						(msg) => appendLog(job.id, msg),
					);
					await appendLog(job.id, `Retrying subdomain check with Vertex suggested alternative: "${subdomain}"`);
					await pool.query(
						`UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`,
						[subdomain, job.id],
					);
					continue; // Try again in the loop with the new subdomain
				} else {
					throw new Error(`Failed to find a unique subdomain after ${maxSubdomainAttempts} attempts. Last tried: "${subdomain}"`);
				}
			}

			// Create subdomain via cPanel UAPI on the remote WP server
			try {
				await addSubdomain(subdomain, rootDomain, fullDocRoot);
				await appendLog(
					job.id,
					`Created subdomain: ${subdomain}.${rootDomain} → ${fullDocRoot}`,
				);
				subdomainOk = true;
			} catch (subErr: any) {
				const errMsg = subErr.message || String(subErr);
				if (errMsg.includes("already exists") || errMsg.includes("exists") || errMsg.includes("closed by remote host")) {
					await appendLog(
						job.id,
						`Subdomain "${subdomain}.${rootDomain}" collision or connection closure detected: "${errMsg}"`,
					);
					if (attempts < maxSubdomainAttempts) {
						const prevSubdomain = subdomain;
						subdomain = await suggestAlternativeSubdomainViaVertex(
							job.business_name || job.project_id,
							prevSubdomain,
							attempts,
							(msg) => appendLog(job.id, msg),
						);
						await appendLog(job.id, `Retrying subdomain creation with Vertex suggested alternative: "${subdomain}"`);
						await pool.query(
							`UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`,
							[subdomain, job.id],
						);
					} else {
						throw new Error(`Failed to create a unique subdomain after ${maxSubdomainAttempts} attempts. Last tried: "${subdomain}"`);
					}
				} else {
					throw subErr;
				}
			}
		}

		job.status = "creating_database";
	}

	// ── STEP 2: Creating Database ───────────────────────────────────────────
	if (job.status === "creating_database") {
		await pool.query(
			`UPDATE provisioning_jobs SET status = 'creating_database' WHERE id = ?`,
			[job.id],
		);
		await appendLog(job.id, "Creating database on remote WP server cPanel");

		const dbPrefix = process.env.CPANEL_USERNAME
			? `${process.env.CPANEL_USERNAME}_`
			: "db_";

		if (!dbName) {
			const suffix = crypto.randomBytes(4).toString("hex");
			dbName = `${dbPrefix}${suffix}`.substring(0, 64);
			dbUser = `${dbPrefix}u${suffix}`.substring(0, 32);
			await pool.query(
				`UPDATE provisioning_jobs SET db_name = ?, db_user = ? WHERE id = ?`,
				[dbName, dbUser, job.id],
			);
		}

		const dbPassword = generateSecurePassword();
		await createDatabase(dbName);
		await createDatabaseUser(dbUser, dbPassword);
		await setDatabasePrivileges(dbUser, dbName);

		await pool.query(
			`UPDATE provisioning_jobs SET db_pass_encrypted = ? WHERE id = ?`,
			[encrypt(dbPassword), job.id],
		);
		(job as any)._tempDbPass = dbPassword;
		await appendLog(
			job.id,
			`Created remote database: ${dbName} and user: ${dbUser}`,
		);

		job.status = "installing_wordpress";
	}

	// ── STEP 3: Installing WordPress ────────────────────────────────────────
	if (job.status === "installing_wordpress") {
		await pool.query(
			`UPDATE provisioning_jobs SET status = 'installing_wordpress' WHERE id = ?`,
			[job.id],
		);
		await appendLog(
			job.id,
			"Starting remote WordPress installation via SSH/WP-CLI",
		);

		// Decrypt db password if coming from a retry
		let dbPassword = (job as any)._tempDbPass;
		if (!dbPassword && job.db_pass_encrypted) {
			try {
				dbPassword = decrypt(job.db_pass_encrypted);
			} catch (e: any) {
				throw new Error(`Failed to decrypt DB password: ${e.message}`);
			}
		}

		if (!dbPassword) {
			throw new Error("Database password missing. Cannot install WordPress.");
		}

		// Verify WP-CLI is reachable on remote server
		const wpCliStatus = await checkWpCliAvailable();
		if (!wpCliStatus.available) {
			throw new Error(
				`WP-CLI not reachable on remote server: ${wpCliStatus.error}`,
			);
		}
		await appendLog(job.id, `WP-CLI available: ${wpCliStatus.version}`);

		const fullDocRoot = `${docRootBase}/${subdomain}`;

		// Create the remote directory explicitly before WP download
		await appendLog(job.id, `Creating remote directory: ${fullDocRoot}`);
		await runRemoteShellCommand(`mkdir -p "${fullDocRoot}"`, (log) =>
			appendLog(job.id, log),
		);

		// Download WordPress core to remote server
		await downloadWordPressCore(fullDocRoot, (log) => appendLog(job.id, log));

		// Generate WP admin password
		if (!wpAdminPass) {
			const rawPass = generateSecurePassword();
			wpAdminPass = encrypt(rawPass);
			(job as any)._tempAdminPass = rawPass;
			await pool.query(
				`UPDATE provisioning_jobs SET wp_admin_user = ?, wp_admin_pass_encrypted = ? WHERE id = ?`,
				[wpAdminUser, wpAdminPass, job.id],
			);
		}

		// Create wp-config.php — DB host is localhost on the remote WP server
		await createWpConfig(
			fullDocRoot,
			dbName,
			dbUser,
			dbPassword,
			"localhost",
			(log) => appendLog(job.id, log),
		);

		// Install WordPress
		const rawAdminPass = (job as any)._tempAdminPass || decrypt(wpAdminPass);
		const siteUrl = `http://${subdomain}.${rootDomain}`;
		await installWordPress(
			fullDocRoot,
			siteUrl,
			`${job.business_name || "Generated Site"} — ${job.project_id}`,
			wpAdminUser,
			rawAdminPass,
			"admin@digitalscout.online",
			(log) => appendLog(job.id, log),
		);

		await appendLog(job.id, `WordPress installed at ${siteUrl}`);
		job.status = "configuring_wordpress";
	}

	// ── STEP 4: Configuring WordPress ───────────────────────────────────────
	if (job.status === "configuring_wordpress") {
		await pool.query(
			`UPDATE provisioning_jobs SET status = 'configuring_wordpress' WHERE id = ?`,
			[job.id],
		);
		const fullDocRoot = `${docRootBase}/${subdomain}`;

		await configurePermalinks(fullDocRoot, "/%postname%/", (log) =>
			appendLog(job.id, log),
		);
		await appendLog(job.id, "Configured remote permalinks");

		// Hello Elementor = truly blank canvas, zero opinionated defaults
		await appendLog(job.id, "Installing Hello Elementor theme...");
		try {
			await runWpCommand(
				`theme install hello-elementor --activate`,
				fullDocRoot,
				(log) => appendLog(job.id, log),
			);
			await appendLog(job.id, "Hello Elementor theme activated");
		} catch (e: any) {
			await appendLog(
				job.id,
				`Warning: Theme install failed (${e.message}), using default`,
			);
		}

		try {
			await runWpCommand(
				`theme delete twentytwentyfive twentytwentyfour twentytwentythree astra`,
				fullDocRoot,
				(log) => appendLog(job.id, log),
			);
		} catch (e) {
			/* non-fatal */
		}

		await appendLog(job.id, "Installing and activating Elementor plugin...");
		try {
			await runWpCommand(
				`plugin install elementor --activate`,
				fullDocRoot,
				(log) => appendLog(job.id, log),
			);
			await appendLog(job.id, "Elementor plugin installed and activated");
		} catch (e: any) {
			await appendLog(
				job.id,
				`Warning: Elementor plugin install failed (${e.message})`,
			);
		}

		// Install and activate Elementor Pro if zip file is present in the workspace
		const localProZipPath = path.join(process.cwd(), "elementor-pro-4.0.4.zip");
		if (fs.existsSync(localProZipPath)) {
			await appendLog(job.id, "Found Elementor Pro zip file. Uploading to remote server...");
			const remoteProZipPath = `/tmp/elementor-pro-4.0.4.zip`;
			try {
				await copyFileToRemote(localProZipPath, remoteProZipPath, (log) => appendLog(job.id, log));
				await appendLog(job.id, "Elementor Pro zip uploaded. Installing and activating...");
				await runWpCommand(
					`plugin install "${remoteProZipPath}" --activate`,
					fullDocRoot,
					(log) => appendLog(job.id, log),
				);
				await appendLog(job.id, "Elementor Pro plugin installed and activated successfully.");
			} catch (err: any) {
				await appendLog(
					job.id,
					`Warning: Elementor Pro plugin install failed (${err.message})`,
				);
			} finally {
				await runRemoteShellCommand(`rm -f "${remoteProZipPath}"`, (log) => appendLog(job.id, log)).catch(() => {});
			}
		} else {
			await appendLog(job.id, "Warning: elementor-pro-4.0.4.zip not found in workspace root. Skipping Elementor Pro installation.");
		}

		await runWpCommand(
			`option update default_comment_status closed`,
			fullDocRoot,
			(log) => appendLog(job.id, log),
		).catch(() => {});
		await runWpCommand(`option update blogdescription ""`, fullDocRoot, (log) =>
			appendLog(job.id, log),
		).catch(() => {});

		job.status = "deploying_content";
	}

	// ── STEP 5: Deploying Content ───────────────────────────────────────────
	if (job.status === "deploying_content") {
		await pool.query(
			`UPDATE provisioning_jobs SET status = 'deploying_content' WHERE id = ?`,
			[job.id],
		);
		await appendLog(
			job.id,
			"Deploying content to remote WordPress...",
		);

		const fullDocRoot = `${docRootBase}/${subdomain}`;
		const schema =
			typeof job.website_schema === "string"
				? JSON.parse(job.website_schema)
				: job.website_schema;

		if (schema) {
			const isElementor = schema.elementorContent !== undefined;
			let homepageBlocks = "";
			if (!isElementor) {
				const { schemaToGutenbergBlocks } = await import("./wordpress");
				homepageBlocks = schemaToGutenbergBlocks(schema);
			}

			// Store Gutenberg/Elementor trace for audit/replay
			await pool.query(
				`UPDATE provisioning_jobs SET gutenberg_trace = ?, status = 'deploying_content' WHERE id = ?`,
				[isElementor ? JSON.stringify(schema.elementorContent) : homepageBlocks, job.id],
			);

			const contentMeta = await injectWebsiteContent(
				fullDocRoot,
				schema,
				homepageBlocks,
				wpAdminUser,
				(log) => appendLog(job.id, log),
			);
			await appendLog(
				job.id,
				`CONTENT_APPLIED source=${contentMeta.renderSource} length=${contentMeta.length} sha1=${contentMeta.sha1}`,
			);
			await appendLog(job.id, "Content injected successfully on remote server");
		} else {
			await appendLog(job.id, "WARNING: No website schema found to inject.");
		}

		job.status = "completed";
	}

	// ── STEP 6: Completed ───────────────────────────────────────────────────
	if (job.status === "completed") {
		await pool.query(
			`UPDATE provisioning_jobs SET status = 'completed', locked_at = NULL WHERE id = ?`,
			[job.id],
		);

		// Always start with http — SSL polling worker will upgrade to https
		const httpUrl = `http://${subdomain}.${rootDomain}`;

		await pool.query(
			`
			INSERT IGNORE INTO isolated_deployments
				(id, project_id, subdomain_url, wp_admin_url, admin_username, encrypted_admin_password, website_schema, ssl_status)
			VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
		`,
			[
				crypto.randomUUID(),
				job.project_id,
				httpUrl,
				`${httpUrl}/wp-admin`,
				wpAdminUser,
				wpAdminPass,
				typeof job.website_schema === "string"
					? job.website_schema
					: JSON.stringify(job.website_schema),
			],
		);

		// Write to audit log
		if (job.trace_id) {
			try {
				await pool.query(
					`INSERT INTO generation_audit_logs (trace_id, step, message, data) VALUES (?, ?, ?, ?)`,
					[
						job.trace_id,
						"provisioning_completed",
						`Remote WordPress site provisioned at ${httpUrl}`,
						JSON.stringify({
							url: httpUrl,
							jobId: job.id,
							remoteHost: process.env.WP_SSH_HOST,
						}),
					],
				);
			} catch (e) {
				/* non-fatal */
			}
		}

		await appendLog(
			job.id,
			`Job completed! Remote WP site live at ${httpUrl} (SSL polling started)`,
		);
	}
}

// ---------------------------------------------------------------------------
// Content Injection — runs all WP-CLI commands on the remote server
// ---------------------------------------------------------------------------

function fallbackImageForCategory(category: string) {
	const normalized = (category || "").toLowerCase();
	if (normalized.includes("restaurant") || normalized.includes("cafe")) {
		return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80";
	}
	if (normalized.includes("gym") || normalized.includes("fitness")) {
		return "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=80";
	}
	if (normalized.includes("salon") || normalized.includes("spa")) {
		return "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1800&q=80";
	}
	return "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80";
}

function esc(str: string) {
	return (str || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function ensureWordPressHtmlBlock(html: string) {
	const trimmed = (html || "").trim();
	if (!trimmed) return "";
	if (trimmed.includes("<!-- wp:html -->")) {
		return trimmed;
	}
	return `<!-- wp:html -->\n${trimmed}\n<!-- /wp:html -->`;
}

export function updateElementorKitSettings(kitJson: any, schema: any): any {
	const primary = schema.theme?.primaryColor || schema.theme?.palette?.primary || "#0066cc";
	const accent = schema.theme?.accentColor || schema.theme?.palette?.accent || "#ff6600";
	const neutral = schema.theme?.neutralColor || schema.theme?.palette?.background || "#f5f5f5";
	const text = schema.theme?.palette?.text || "#0f172a";
	const headingFont = schema.theme?.typography?.heading || "Inter";
	const bodyFont = schema.theme?.typography?.body || "Inter";

	const settings = kitJson.settings || {};

	// 1. Update system colors
	if (Array.isArray(settings.system_colors)) {
		settings.system_colors.forEach((col: any) => {
			if (col._id === "primary") col.color = primary;
			if (col._id === "secondary") col.color = primary;
			if (col._id === "accent") col.color = accent;
			if (col._id === "text") col.color = text;
		});
	}

	// 2. Update custom colors
	if (Array.isArray(settings.custom_colors)) {
		settings.custom_colors.forEach((col: any) => {
			if (col._id === "afc2c62") {
				col.color = neutral;
			}
		});
	}

	// 3. Update fonts recursively
	const replaceFonts = (obj: any) => {
		if (!obj || typeof obj !== "object") return;
		
		if (obj.typography_font_family === "Spartan") {
			const title = String(obj.title || "").toLowerCase();
			if (title.includes("text") || title.includes("copyright") || title.includes("body")) {
				obj.typography_font_family = bodyFont;
			} else {
				obj.typography_font_family = headingFont;
			}
		}

		for (const key of Object.keys(obj)) {
			if (obj[key] && typeof obj[key] === "object") {
				replaceFonts(obj[key]);
			}
		}
	};

	replaceFonts(settings);

	return kitJson;
}

async function injectWebsiteContent(
	docRoot: string,
	schema: any,
	_homepageBlocks: string,
	adminUser: string,
	logCallback: (log: string) => void,
) {
	try {
		await logCallback("Cleaning up default WordPress content...");
		try {
			// Get IDs first and only delete if not empty to avoid "usage" errors
			const deleteCmd = `/usr/local/sbin/wp post list --post_type=post,page --format=ids --path="${docRoot}" --allow-root | xargs -r /usr/local/sbin/wp post delete --force --allow-root --path="${docRoot}"`;
			await runRemoteShellCommand(deleteCmd, logCallback);
		} catch (e) {
			/* non-fatal */
		}

		const isElementor = schema.elementorContent !== undefined;

		if (isElementor) {
			await logCallback("Deploying Elementor template-based layout...");

			// Create mu-plugins directory and write allow-svg.php to allow SVGs
			await logCallback("Creating mu-plugins to allow SVG uploads...");
			await runRemoteShellCommand(`mkdir -p "${docRoot}/wp-content/mu-plugins"`, logCallback);
			const allowSvgPhp = `<?php
// Allow SVG uploads in WordPress
add_filter('upload_mimes', function($mimes) {
    $mimes['svg'] = 'image/svg+xml';
    $mimes['svgz'] = 'image/svg+xml';
    return $mimes;
});
add_filter('wp_check_filetype_and_ext', function($data, $file, $filename, $mimes) {
    $filetype = wp_check_filetype($filename, $mimes);
    if ($filetype['ext'] === 'svg') {
        $data['ext'] = 'svg';
        $data['type'] = 'image/svg+xml';
    }
    return $data;
}, 10, 4);
`;
			const base64AllowSvg = Buffer.from(allowSvgPhp).toString("base64");
			await runRemoteShellCommand(
				`echo "${base64AllowSvg}" | base64 -d > "${docRoot}/wp-content/mu-plugins/allow-svg.php"`,
				logCallback
			);

			const mediaMap: Record<string, { id: number; url: string }> = {};
			const imageSet = new Set<string>();
			const aiContent = schema.elementorContent;

			if (aiContent.hero?.hero_image) imageSet.add(aiContent.hero.hero_image);
			if (aiContent.hero?.masked_image) imageSet.add(aiContent.hero.masked_image);
			if (aiContent.about?.image) imageSet.add(aiContent.about.image);
			if (aiContent.services?.image) imageSet.add(aiContent.services.image);
			if (Array.isArray(aiContent.testimonials?.slideshow)) {
				aiContent.testimonials.slideshow.forEach((url: string) => {
					if (url) imageSet.add(url);
				});
			}

			// Add projects posts images to the imageSet so they are uploaded to WordPress
			if (Array.isArray(aiContent.projects?.posts)) {
				aiContent.projects.posts.forEach((p: any) => {
					if (p.url) imageSet.add(p.url);
				});
			}

			if (schema.brand?.logo) {
				imageSet.add(schema.brand.logo);
			}

			// Scan template JSON files for library.elementor.com URLs to download/import
			const templateDir = path.join(process.cwd(), "elementor-kit-2");
			const templateFiles = [
				path.join(templateDir, "content", "page", "2.json"),
				path.join(templateDir, "templates", "49.json"),
				path.join(templateDir, "templates", "156.json"),
			];

			for (const file of templateFiles) {
				if (fs.existsSync(file)) {
					try {
						// Strip backslashes from the raw template file content before matching, 
						// to ensure standard regex can capture escaped library.elementor.com URLs.
						const content = fs.readFileSync(file, "utf8").replace(/\\/g, "");
						const matches = content.match(/https?:\/\/library\.elementor\.com\/[^\s"'}]+/g);
						if (matches) {
							for (const match of matches) {
								imageSet.add(match);
							}
						}
					} catch (e) {
						await logCallback(`Error reading template file ${file}: ${e}`);
					}
				}
			}

			// Import images
			for (const imgUrl of imageSet) {
				await logCallback(`Importing image: ${imgUrl}`);
				try {
					let mediaId = "";
					let imported = false;

					// 1. Try local generated image transfer first
					if (imgUrl.includes("/public/generated-images/") || imgUrl.includes("/public/default/")) {
						const isDefault = imgUrl.includes("/public/default/");
						const marker = isDefault ? "/public/default/" : "/public/generated-images/";
						const parts = imgUrl.split(marker);
						const filename = decodeURIComponent(parts[parts.length - 1]);
						const localPath = path.join(process.cwd(), "public", isDefault ? "default" : "generated-images", filename);
						if (fs.existsSync(localPath)) {
							await logCallback(`Detected local image: ${filename}. Copying to remote server...`);
							const ext = filename.toLowerCase().endsWith(".png") ? "png" : "jpg";
							const remoteTmpMedia = `/tmp/ds_local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
							try {
								await copyFileToRemote(localPath, remoteTmpMedia, logCallback);
								const mediaOut = await runWpCommand(
									`media import "${remoteTmpMedia}" --porcelain`,
									docRoot,
									logCallback,
								);
								mediaId = mediaOut.stdout.trim();
								if (/^\d+$/.test(mediaId)) {
									imported = true;
								}
							} catch (uploadErr: any) {
								await logCallback(`Failed to copy/import local file ${filename}: ${uploadErr.message}. Trying direct fallback...`);
							} finally {
								await runRemoteShellCommand(`rm -f "${remoteTmpMedia}"`, logCallback).catch(() => {});
							}
						} else {
							await logCallback(`Local file not found at ${localPath} for generated image URL: ${imgUrl}. Trying direct fallback...`);
						}
					}

					// 2. Try downloading locally to the Node server first and copy over SSH
					if (!imported && imgUrl.startsWith("http")) {
						try {
							await logCallback(`Downloading image locally on Node server first: ${imgUrl}`);
							const ext = imgUrl.toLowerCase().includes(".png") ? "png" : "jpg";
							const tempLocalDir = path.join(process.cwd(), "scratch", "downloads");
							if (!fs.existsSync(tempLocalDir)) {
								fs.mkdirSync(tempLocalDir, { recursive: true });
							}
							const tempLocalPath = path.join(tempLocalDir, `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`);
							
							const response = await crossFetch(imgUrl, {
								headers: {
									"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
								}
							});
							if (response.ok) {
								const arrayBuffer = await response.arrayBuffer();
								fs.writeFileSync(tempLocalPath, Buffer.from(arrayBuffer));
								
								await logCallback(`Copying downloaded file to remote server via SSH: ${tempLocalPath}`);
								const remoteTmpMedia = `/tmp/ds_dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
								try {
									await copyFileToRemote(tempLocalPath, remoteTmpMedia, logCallback);
									const mediaOut = await runWpCommand(
										`media import "${remoteTmpMedia}" --porcelain`,
										docRoot,
										logCallback,
									);
									mediaId = mediaOut.stdout.trim();
									if (/^\d+$/.test(mediaId)) {
										imported = true;
									}
								} finally {
									await runRemoteShellCommand(`rm -f "${remoteTmpMedia}"`, logCallback).catch(() => {});
									if (fs.existsSync(tempLocalPath)) {
										fs.unlinkSync(tempLocalPath);
									}
								}
							} else {
								await logCallback(`Local download failed: HTTP status ${response.status}`);
							}
						} catch (downloadErr: any) {
							await logCallback(`Failed local download/transfer pipeline: ${downloadErr.message}. Trying direct fallback...`);
						}
					}

					// 3. Fallback to standard direct remote import or remote curl
					if (!imported) {
						try {
							const mediaOut = await runWpCommand(
								`media import "${imgUrl}" --porcelain`,
								docRoot,
								logCallback,
							);
							mediaId = mediaOut.stdout.trim();
						} catch (e: any) {
							await logCallback(`Direct import failed for ${imgUrl}. Trying with curl on remote server...`);
							const ext = imgUrl.toLowerCase().includes(".png") ? "png" : "jpg";
							const remoteTmpMedia = `/tmp/ds_media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
							await runRemoteShellCommand(
								`curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${imgUrl}" -o "${remoteTmpMedia}"`,
								logCallback,
							);
							const mediaOut = await runWpCommand(
								`media import "${remoteTmpMedia}" --porcelain`,
								docRoot,
								logCallback,
							);
							mediaId = mediaOut.stdout.trim();
							await runRemoteShellCommand(`rm -f "${remoteTmpMedia}"`, logCallback).catch(() => {});
						}
					}

					if (/^\d+$/.test(mediaId)) {
						const urlOut = await runWpCommand(
							`eval "echo wp_get_attachment_url(${mediaId});"`,
							docRoot,
							logCallback,
						);
						const localUrl = urlOut.stdout.trim();
						mediaMap[imgUrl] = { id: parseInt(mediaId, 10), url: localUrl };
						await logCallback(`Successfully imported: ${imgUrl} -> ID: ${mediaId}, URL: ${localUrl}`);

						if (imgUrl === schema.brand?.logo && !schema.brand?.favicon) {
							await logCallback(`Setting site icon to logo (no dedicated favicon): ${mediaId}`);
							await runWpCommand(
								`option update site_icon ${mediaId}`,
								docRoot,
								logCallback,
							).catch(() => {});
						}
					}
				} catch (err: any) {
					await logCallback(`Failed to import media ${imgUrl}: ${err.message}`);
				}
			}

			// Create Project Posts in WordPress
			if (Array.isArray(aiContent.projects?.posts) && aiContent.projects.posts.length > 0) {
				await logCallback(`Creating ${aiContent.projects.posts.length} project posts in WordPress...`);
				for (const post of aiContent.projects.posts) {
					try {
						const localMedia = mediaMap[post.url];

						await logCallback(`Creating post: "${post.title}" with thumbnail ID: ${localMedia?.id || "none"}`);
						
						const safeTitle = post.title.replace(/'/g, `'\\''`);
						// NOTE: --thumbnail_id is NOT a valid flag for wp post create.
						// The featured image (thumbnail) MUST be set via a separate wp post meta set command.
						const postCreateOut = await runWpCommand(
							`post create --post_type=post --post_title='${safeTitle}' --post_status=publish --porcelain`,
							docRoot,
							logCallback
						);
						const newPostId = postCreateOut.stdout.trim();
						await logCallback(`Created project post ID: ${newPostId}`);

						// Set the featured image (thumbnail) via post meta — this is the correct method
						if (newPostId && /^\d+$/.test(newPostId) && localMedia?.id) {
							try {
								await runWpCommand(
									`post meta set ${newPostId} _thumbnail_id ${localMedia.id}`,
									docRoot,
									logCallback
								);
								await logCallback(`Set thumbnail (featured image) ID ${localMedia.id} for post ${newPostId}`);
							} catch (thumbErr: any) {
								await logCallback(`Warning: Failed to set thumbnail for post ${newPostId}: ${thumbErr.message}`);
							}
						} else if (newPostId && /^\d+$/.test(newPostId) && !localMedia?.id) {
							await logCallback(`Warning: No media found in mediaMap for project URL: ${post.url}. Post created without thumbnail.`);
						}
					} catch (postErr: any) {
						await logCallback(`Warning: Failed to create project post: ${postErr.message}`);
					}
				}
			}

			// Create navigation menu
			let menuId = "";
			let footerMenuId = "";
			let custServiceMenuId = "";

			try {
				await logCallback("Creating Main Menu...");
				const menuCreateOut = await runWpCommand(
					`menu create "Main Menu" --porcelain`,
					docRoot,
					logCallback,
				);
				menuId = menuCreateOut.stdout.trim();
				await logCallback(`Main Menu ID: ${menuId}`);

				if (menuId) {
					await runWpCommand(
						`menu location assign "Main Menu" menu-1`,
						docRoot,
						logCallback,
					);
					// Clear existing items in Main Menu to prevent accumulation on re-runs
					try {
						const itemsOut = await runWpCommand(
							`menu item list "${menuId}" --format=ids`,
							docRoot,
							logCallback,
						);
						const itemIds = itemsOut.stdout.trim().replace(/\s+/g, " ");
						if (itemIds) {
							await runWpCommand(
								`menu item delete ${itemIds}`,
								docRoot,
								logCallback,
							);
						}
					} catch (clearErr) {
						// no items or delete failed
					}

					await runWpCommand(
						`menu item add-custom "${menuId}" "Home" "#"`,
						docRoot,
						logCallback,
					);
					await runWpCommand(
						`menu item add-custom "${menuId}" "Services" "#services"`,
						docRoot,
						logCallback,
					);
					await runWpCommand(
						`menu item add-custom "${menuId}" "Reviews" "#reviews"`,
						docRoot,
						logCallback,
					);
					await runWpCommand(
						`menu item add-custom "${menuId}" "Contact" "#contact"`,
						docRoot,
						logCallback,
					);
				}
			} catch (menuErr: any) {
				await logCallback(`Warning during menu creation: ${menuErr.message}`);
			}

			// Create Footer Menu (Legal & Privacy)
			try {
				await logCallback("Creating Footer Menu (Legal & Privacy)...");
				const fmCreateOut = await runWpCommand(
					`menu create "Footer Menu" --porcelain`,
					docRoot,
					logCallback,
				);
				footerMenuId = fmCreateOut.stdout.trim();
				if (footerMenuId) {
					// Clear existing items
					try {
						const itemsOut = await runWpCommand(
							`menu item list "${footerMenuId}" --format=ids`,
							docRoot,
							logCallback,
						);
						const itemIds = itemsOut.stdout.trim().replace(/\s+/g, " ");
						if (itemIds) {
							await runWpCommand(`menu item delete ${itemIds}`, docRoot, logCallback);
						}
					} catch (clearErr) {}

					await runWpCommand(`menu item add-custom "${footerMenuId}" "Terms of Use" "#"`, docRoot, logCallback);
					await runWpCommand(`menu item add-custom "${footerMenuId}" "Privacy & Cookies" "#"`, docRoot, logCallback);
				}
			} catch (fmErr: any) {
				await logCallback(`Warning during footer menu creation: ${fmErr.message}`);
			}

			// Create Customer Service Menu
			try {
				await logCallback("Creating Customer Service Menu...");
				const csCreateOut = await runWpCommand(
					`menu create "Customer Service" --porcelain`,
					docRoot,
					logCallback,
				);
				custServiceMenuId = csCreateOut.stdout.trim();
				if (custServiceMenuId) {
					// Clear existing items
					try {
						const itemsOut = await runWpCommand(
							`menu item list "${custServiceMenuId}" --format=ids`,
							docRoot,
							logCallback,
						);
						const itemIds = itemsOut.stdout.trim().replace(/\s+/g, " ");
						if (itemIds) {
							await runWpCommand(`menu item delete ${itemIds}`, docRoot, logCallback);
						}
					} catch (clearErr) {}

					await runWpCommand(`menu item add-custom "${custServiceMenuId}" "Home" "#"`, docRoot, logCallback);
					await runWpCommand(`menu item add-custom "${custServiceMenuId}" "Services" "#services"`, docRoot, logCallback);
					await runWpCommand(`menu item add-custom "${custServiceMenuId}" "Contact" "#contact"`, docRoot, logCallback);
				}
			} catch (csErr: any) {
				await logCallback(`Warning during customer service menu creation: ${csErr.message}`);
			}

			// Call mergeElementorTemplate
			const businessInfo = {
				name: schema.brand?.businessName || "Business",
				address: schema.brand?.address || "",
				phone: schema.brand?.phone || "",
				email: schema.brand?.email || "",
				hours: schema.brand?.hours || "",
			};

			await logCallback("Merging Elementor template layouts...");
			const mergedJson = mergeElementorTemplate(
				templateDir,
				aiContent,
				mediaMap,
				businessInfo,
				menuId,
				footerMenuId,
				custServiceMenuId,
			);

			// Create Home page
			await logCallback("Creating Home page post in WordPress for Elementor...");
			const homePageIdOut = await runWpCommand(
				`post create --post_type=page --post_title="Home" --post_content="" --post_status=publish --format=ids --user="${adminUser}"`,
				docRoot,
				logCallback,
			);
			const homePageId = homePageIdOut.stdout.replace(/[^0-9]/g, "").trim();
			if (!homePageId || homePageId === "0") {
				throw new Error("Home page creation failed — invalid ID returned");
			}

			await logCallback(`Home page created with ID: ${homePageId}. Setting as front page...`);
			await runWpCommand(`option update show_on_front page`, docRoot, logCallback);
			await runWpCommand(`option update page_on_front ${homePageId}`, docRoot, logCallback);

			if (schema.brand?.businessName) {
				await runWpCommand(
					`option update blogname "${esc(schema.brand.businessName)}"`,
					docRoot,
					logCallback,
				);
			}

			await runWpCommand(`rewrite structure "/%postname%/"`, docRoot, logCallback);
			await runWpCommand(`rewrite flush`, docRoot, logCallback);

			// Retrieve active Elementor kit ID and customize kit settings
			let activeKitId = "";
			let updatedKitSettingsJson = "";
			try {
				await logCallback("Retrieving active Elementor kit...");
				const kitOut = await runWpCommand(
					`option get elementor_active_kit`,
					docRoot,
					logCallback,
				);
				activeKitId = kitOut.stdout.trim();
				await logCallback(`Active Elementor kit ID: ${activeKitId}`);

				if (activeKitId) {
					const kitSettingsPath = path.join(process.cwd(), "elementor-kit-2", "site-settings.json");
					if (fs.existsSync(kitSettingsPath)) {
						const rawKitSettings = JSON.parse(fs.readFileSync(kitSettingsPath, "utf8"));
						const updatedKit = updateElementorKitSettings(rawKitSettings, schema);
						updatedKitSettingsJson = JSON.stringify(updatedKit.settings || {});
					} else {
						await logCallback(`Warning: site-settings.json not found at ${kitSettingsPath}`);
					}
				}
			} catch (e: any) {
				await logCallback(`Warning: failed to customize Elementor kit settings: ${e.message}`);
			}

			// Save to remote temp files and run eval script
			const homepageJsonTmp = `/tmp/ds_el_data_${Date.now()}.json`;
			const kitJsonTmp = `/tmp/ds_el_kit_${Date.now()}.json`;
			const phpScriptTmp = `/tmp/ds_el_script_${Date.now()}.php`;

			await logCallback("Uploading Elementor payloads to remote server...");
			
			const homepageB64 = Buffer.from(mergedJson).toString("base64");
			await runRemoteShellCommand(
				`echo "${homepageB64}" | base64 -d > '${homepageJsonTmp}'`,
				logCallback,
			);

			if (updatedKitSettingsJson) {
				const kitB64 = Buffer.from(updatedKitSettingsJson).toString("base64");
				await runRemoteShellCommand(
					`echo "${kitB64}" | base64 -d > '${kitJsonTmp}'`,
					logCallback,
				);
			}

			const logoUrl = schema.brand?.logo || "";
			const logoAttachmentId = logoUrl ? (mediaMap[logoUrl]?.id || "") : "";

			const phpCode = `<?php
$homepage_id = intval($args[0]);
$homepage_json_file = $args[1];
$kit_id = intval($args[2]);
$kit_settings_json_file = $args[3];
$logo_attachment_id = intval($args[4]);

if ($homepage_id && file_exists($homepage_json_file)) {
    $json_content = file_get_contents($homepage_json_file);
    $data = json_decode($json_content, true);
    if ($data) {
        update_post_meta($homepage_id, '_elementor_data', wp_slash($json_content));
        update_post_meta($homepage_id, '_elementor_edit_mode', 'builder');
        update_post_meta($homepage_id, '_wp_page_template', 'elementor_canvas');
        echo "HOMEPAGE_META_UPDATED\\n";
    } else {
        echo "ERROR: Invalid homepage JSON\\n";
    }
}

if ($kit_id && file_exists($kit_settings_json_file)) {
    $kit_content = file_get_contents($kit_settings_json_file);
    $settings = json_decode($kit_content, true);
    if ($settings) {
        update_post_meta($kit_id, '_elementor_page_settings', wp_slash($settings));
        echo "KIT_SETTINGS_UPDATED\\n";
    } else {
        echo "ERROR: Invalid kit settings JSON\\n";
    }
}

if ($logo_attachment_id) {
    set_theme_mod('custom_logo', $logo_attachment_id);
    echo "CUSTOM_LOGO_SET\\n";
}

// Inject global CSS to fix horizontal scroll and ensure circle images render correctly.
// This runs inside WP context so no shell-escaping issues.
$global_css = 'html, body { overflow-x: hidden !important; max-width: 100vw !important; } .elementor-section, .e-container, .elementor-column { max-width: 100% !important; } ' .
	'.elementor-widget-theme-site-logo img { mix-blend-mode: multiply !important; height: auto !important; max-height: 85px !important; width: auto !important; } ' .
	'.elementor-element-1b226200, .elementor-element-1b226200 .elementor-widget-text-editor, .elementor-element-1b226200 .elementor-widget-text-editor p { color: #E9E8E6 !important; } ' .
	'.elementor-element-1b226200 .elementor-widget-text-editor strong { color: #FFFFFF !important; } ' .
	'.elementor-element-51305b21 .elementor-background-overlay { background-color: rgba(12, 40, 53, 0.6) !important; opacity: 1 !important; } ' .
	'.elementor-element-51305b21::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(12, 40, 53, 0.6) !important; z-index: 0; pointer-events: none; } ' .
	'.elementor-element-51305b21 > * { position: relative; z-index: 1; } ' .
	'.elementor-element-39f1fa01 .elementor-background-overlay { background-color: rgba(12, 40, 53, 0.45) !important; opacity: 1 !important; } ' .
	'.elementor-element-39f1fa01::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(12, 40, 53, 0.45) !important; z-index: 0; pointer-events: none; } ' .
	'.elementor-element-39f1fa01 > * { position: relative; z-index: 1; } ' .
	'[data-elementor-type="footer"] *, .elementor-element-29c6e791 *, footer *, .site-footer *, .elementor-location-footer * { color: #ffffff !important; } ' .
	'[data-elementor-type="footer"] svg, [data-elementor-type="footer"] path, .elementor-element-29c6e791 svg, .elementor-element-29c6e791 path, footer svg, footer path, .site-footer svg, .site-footer path { fill: #ffffff !important; } ' .
	'[data-elementor-type="footer"] a:hover, [data-elementor-type="footer"] a:hover *, .elementor-element-29c6e791 a:hover, .elementor-element-29c6e791 a:hover *, footer a:hover, footer a:hover *, .site-footer a:hover, .site-footer a:hover * { color: #ffffff !important; opacity: 0.8 !important; } ' .
	'[data-elementor-type="footer"] ::placeholder, .elementor-element-29c6e791 ::placeholder, footer ::placeholder, .site-footer ::placeholder { color: rgba(255, 255, 255, 0.6) !important; } ' .
	'.elementor-widget-call-to-action .elementor-cta__content { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; text-align: center !important; } ' .
	'.elementor-widget-call-to-action .elementor-cta__title, .elementor-widget-call-to-action .elementor-cta__description, .elementor-widget-call-to-action .elementor-cta__content * { text-align: center !important; } ' .
	'.elementor-widget-call-to-action .elementor-cta__button-wrapper { display: flex !important; justify-content: center !important; width: 100% !important; } ' .
	'.elementor-widget-call-to-action .elementor-cta__button { margin: 0 auto !important; display: inline-block !important; } ' .
	'.elementor-element-3b58bec7, .elementor-element-69be47e, .elementor-element-5a62107a, .elementor-element-44b1aa0b, .elementor-element-3b58bec7 .elementor-widget-container, .elementor-element-69be47e .elementor-widget-container, .elementor-element-5a62107a .elementor-widget-container, .elementor-element-44b1aa0b .elementor-widget-container { background-color: transparent !important; background: transparent !important; } ' .
	'.elementor-element-3b58bec7 img, .elementor-element-69be47e img, .elementor-widget-theme-site-logo img, .elementor-widget-image img[src*="gen_logo"], header img[src*="gen_logo"], .site-header img[src*="gen_logo"] { mix-blend-mode: multiply !important; background-color: transparent !important; } ' .
	'.elementor-element-5a62107a img, .elementor-element-44b1aa0b img, [data-elementor-type="footer"] img[src*="gen_logo"], footer img[src*="gen_logo"], .site-footer img[src*="gen_logo"] { filter: invert(1) !important; mix-blend-mode: screen !important; background-color: transparent !important; } ' .
	'/* KIT 1 Hero overrides */ ' .
	'@media (min-width: 768px) { ' .
	'  .elementor-element-40a06f6 { height: auto !important; min-height: auto !important; } ' .
	'  .elementor-element-580cc436 { min-height: calc(100vh - 120px) !important; display: flex !important; flex-direction: column !important; justify-content: center !important; padding-top: 8% !important; padding-bottom: 5% !important; } ' .
	'  .elementor-element-4fc28b13 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; max-height: calc(100vh - 120px) !important; } ' .
	'} ' .
	'@media (max-width: 767px) { ' .
	'  .elementor-element-40a06f6 { height: auto !important; min-height: auto !important; } ' .
	'  .elementor-element-580cc436 { padding: 50px 20px 30px 20px !important; height: auto !important; min-height: auto !important; } ' .
	'  .elementor-element-4fc28b13 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; width: 100% !important; } ' .
	'  .elementor-element-1bc75a32 { display: none !important; } ' .
	'} ' .
	'.elementor-element-41484f27 { object-fit: cover !important; border-radius: 50% !important; } ' .
	'@media (min-width: 768px) { .elementor-element-41484f27 { left: -15% !important; } } ' .
	'/* KIT 1 About & Services overrides */ ' .
	'.elementor-element-6f812967 img { aspect-ratio: 4 / 3 !important; width: 100% !important; height: auto !important; min-height: auto !important; object-fit: cover !important; } ' .
	'.elementor-element-6f812967 { height: auto !important; min-height: auto !important; } ' .
	'@media (max-width: 767px) { .elementor-element-6f812967 { margin-top: 0 !important; margin-bottom: 20px !important; } } ' .
	'@media (min-width: 768px) { ' .
	'  .elementor-element-59b6e6d5 { height: auto !important; min-height: auto !important; } ' .
	'  .elementor-element-42abf8aa { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; } ' .
	'} ' .
	'@media (max-width: 767px) { ' .
	'  .elementor-element-42abf8aa { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; width: 100% !important; } ' .
	'  .elementor-element-63950d29 { display: none !important; } ' .
	'} ' .
	'/* KIT 1 Testimonials Stretch */ ' .
	'@media (min-width: 768px) { ' .
	'  .elementor-element-331d0ffb { display: flex !important; align-items: stretch !important; } ' .
	'  .elementor-element-6e5c11f9, .elementor-element-75ba3d29 { height: auto !important; align-self: stretch !important; display: flex !important; flex-direction: column !important; } ' .
	'  .elementor-element-6e5c11f9 .elementor-widget-wrap, .elementor-element-75ba3d29 .elementor-widget-wrap { height: 100% !important; display: flex !important; flex-direction: column !important; justify-content: center !important; } ' .
	'} ' .
	'/* KIT 2 Hero overrides */ ' .
	'@media (min-width: 768px) { ' .
	'  .elementor-element-49f8bd39 { height: auto !important; min-height: auto !important; } ' .
	'  .elementor-element-35a4f6fb, .elementor-element-39f1fa01 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; max-height: calc(100vh - 120px) !important; } ' .
	'} ' .
	'@media (max-width: 767px) { ' .
	'  .elementor-element-49f8bd39 { height: auto !important; min-height: auto !important; flex-direction: column !important; } ' .
	'  .elementor-element-35a4f6fb { display: none !important; } ' .
	'  .elementor-element-39f1fa01 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; width: 100% !important; } ' .
	'} ' .
	'/* KIT 2 About & Services */ ' .
	'.elementor-element-4d1645d0 { aspect-ratio: 4 / 3 !important; height: auto !important; min-height: auto !important; } ' .
	'@media (max-width: 767px) { .elementor-element-4d1645d0 { aspect-ratio: auto !important; min-height: 380px !important; padding-top: 40px !important; padding-bottom: 40px !important; } } ' .
	'.elementor-element-51305b21 { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; } ' .
	'@media (max-width: 767px) { .elementor-element-51305b21 { aspect-ratio: auto !important; min-height: 380px !important; padding-top: 40px !important; padding-bottom: 40px !important; } } ' .
	'/* KIT 2 CTA Stretch */ ' .
	'@media (min-width: 1100px) { ' .
	'  .elementor-element-1b226200 { display: flex !important; flex-direction: row !important; justify-content: flex-end !important; align-items: stretch !important; padding-top: 0 !important; padding-bottom: 0 !important; aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; } ' .
	'  .elementor-element-56a3deab, .elementor-element-56a3deab .elementor-widget-wrap { height: 100% !important; min-height: 100% !important; align-self: stretch !important; display: flex !important; flex-direction: column !important; justify-content: center !important; margin-top: 0 !important; margin-bottom: 0 !important; } ' .
	'} ' .
	'@media (min-width: 768px) and (max-width: 1099px) { ' .
	'  .elementor-element-1b226200 { display: flex !important; flex-direction: row !important; justify-content: flex-end !important; align-items: stretch !important; padding-top: 40px !important; padding-bottom: 40px !important; aspect-ratio: auto !important; height: auto !important; min-height: 600px !important; } ' .
	'  .elementor-element-56a3deab, .elementor-element-56a3deab .elementor-widget-wrap { height: 100% !important; min-height: 100% !important; align-self: stretch !important; display: flex !important; flex-direction: column !important; justify-content: center !important; margin-top: 0 !important; margin-bottom: 0 !important; } ' .
	'} ' .
	'@media (max-width: 767px) { ' .
	'  .elementor-element-1b226200 { flex-direction: column !important; aspect-ratio: auto !important; min-height: 450px !important; } ' .
	'  .elementor-element-56a3deab { height: auto !important; min-height: auto !important; margin-top: 0 !important; margin-bottom: 0 !important; } ' .
	'} ' .
	'/* KIT 2 Products (Recent Projects) Stack & Clear floats/absolute positioning on mobile/tablet */ ' .
	'@media (max-width: 1024px) { ' .
	'  .elementor-element-3c27eca4 .elementor-posts-container { display: flex !important; flex-direction: column !important; float: none !important; clear: both !important; height: auto !important; min-height: 1px !important; } ' .
	'  .elementor-element-3c27eca4 article.elementor-post { position: relative !important; top: auto !important; left: auto !important; float: none !important; width: 100% !important; max-width: 100% !important; margin-bottom: 30px !important; display: block !important; clear: both !important; } ' .
	'  .elementor-element-7c6a7a2 { position: relative !important; margin: 30px auto 0 auto !important; left: auto !important; transform: none !important; display: block !important; clear: both !important; } ' .
	'}';
update_option('elementor_custom_css', $global_css);
update_option('elementor_css_print_method', 'internal');
echo "GLOBAL_CSS_SET\n";

// Create Must-Use plugin to inject styles dynamically
$mu_dir = WP_CONTENT_DIR . '/mu-plugins';
if (!is_dir($mu_dir)) {
    mkdir($mu_dir, 0755, true);
}
$mu_plugin_code = '<?php
/*
Plugin Name: DigitalScout Custom Layout Fixes
Description: Dynamic layout fixes for Elementor and custom logos.
Version: 1.1
*/
add_action("wp_head", function() {
    ?>
    <style>
    /* Injected layout fixes */
    html, body { overflow-x: hidden !important; max-width: 100vw !important; }
    .elementor-section, .e-container, .elementor-column { max-width: 100% !important; }
    .elementor-widget-theme-site-logo img { mix-blend-mode: multiply !important; height: auto !important; max-height: 85px !important; width: auto !important; }
    .elementor-element-1b226200, .elementor-element-1b226200 .elementor-widget-text-editor, .elementor-element-1b226200 .elementor-widget-text-editor p { color: #E9E8E6 !important; }
    .elementor-element-1b226200 .elementor-widget-text-editor strong { color: #FFFFFF !important; }
    .elementor-element-51305b21 .elementor-background-overlay { background-color: rgba(12, 40, 53, 0.6) !important; opacity: 1 !important; }
    .elementor-element-51305b21::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(12, 40, 53, 0.6) !important; z-index: 0; pointer-events: none; }
    .elementor-element-51305b21 > * { position: relative; z-index: 1; }
    .elementor-element-39f1fa01 .elementor-background-overlay { background-color: rgba(12, 40, 53, 0.45) !important; opacity: 1 !important; }
    .elementor-element-39f1fa01::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(12, 40, 53, 0.45) !important; z-index: 0; pointer-events: none; }
    .elementor-element-39f1fa01 > * { position: relative; z-index: 1; }
    [data-elementor-type="footer"] *, .elementor-element-29c6e791 *, footer *, .site-footer *, .elementor-location-footer * { color: #ffffff !important; }
    [data-elementor-type="footer"] svg, [data-elementor-type="footer"] path, .elementor-element-29c6e791 svg, .elementor-element-29c6e791 path, footer svg, footer path, .site-footer svg, .site-footer path { fill: #ffffff !important; }
    [data-elementor-type="footer"] a:hover, [data-elementor-type="footer"] a:hover *, .elementor-element-29c6e791 a:hover, .elementor-element-29c6e791 a:hover *, footer a:hover, footer a:hover *, .site-footer a:hover, .site-footer a:hover * { color: #ffffff !important; opacity: 0.8 !important; }
    [data-elementor-type="footer"] ::placeholder, .elementor-element-29c6e791 ::placeholder, footer ::placeholder, .site-footer ::placeholder { color: rgba(255, 255, 255, 0.6) !important; }
    
    /* Call to Action Centering & Desktop/Tablet Breakout overrides */
    .elementor-widget-call-to-action .elementor-cta__content { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; text-align: center !important; }
    .elementor-widget-call-to-action .elementor-cta__title, .elementor-widget-call-to-action .elementor-cta__description, .elementor-widget-call-to-action .elementor-cta__content * { text-align: center !important; }
    .elementor-widget-call-to-action .elementor-cta__button-wrapper { display: flex !important; justify-content: center !important; width: 100% !important; }
    .elementor-widget-call-to-action .elementor-cta__button { margin: 0 auto !important; display: inline-block !important; }
    
    @media (min-width: 768px) {
        .elementor-widget-call-to-action {
            width: 100vw !important;
            max-width: 100vw !important;
            position: relative !important;
            left: -50vw !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
        }
    }
    
    /* Logo Background Transparency */
    .elementor-element-3b58bec7, .elementor-element-69be47e, .elementor-element-5a62107a, .elementor-element-44b1aa0b, .elementor-element-3b58bec7 .elementor-widget-container, .elementor-element-69be47e .elementor-widget-container, .elementor-element-5a62107a .elementor-widget-container, .elementor-element-44b1aa0b .elementor-widget-container { background-color: transparent !important; background: transparent !important; }
    .elementor-element-3b58bec7 img, .elementor-element-69be47e img, .elementor-widget-theme-site-logo img, .elementor-widget-image img[src*="gen_logo"], header img[src*="gen_logo"], .site-header img[src*="gen_logo"] { mix-blend-mode: multiply !important; background-color: transparent !important; }
    .elementor-element-5a62107a img, .elementor-element-44b1aa0b img, [data-elementor-type="footer"] img[src*="gen_logo"], footer img[src*="gen_logo"], .site-footer img[src*="gen_logo"] { filter: invert(1) !important; mix-blend-mode: screen !important; background-color: transparent !important; }
    
    /* KIT 1 Hero overrides */
    @media (min-width: 768px) {
        .elementor-element-40a06f6 { height: auto !important; min-height: auto !important; }
        .elementor-element-580cc436 { min-height: calc(100vh - 120px) !important; display: flex !important; flex-direction: column !important; justify-content: center !important; padding-top: 8% !important; padding-bottom: 5% !important; }
        .elementor-element-4fc28b13 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; max-height: calc(100vh - 120px) !important; }
    }
    @media (max-width: 767px) {
        .elementor-element-40a06f6 { height: auto !important; min-height: auto !important; }
        .elementor-element-580cc436 { padding: 50px 20px 30px 20px !important; height: auto !important; min-height: auto !important; }
        .elementor-element-4fc28b13 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; width: 100% !important; }
        .elementor-element-1bc75a32 { display: none !important; }
    }
    .elementor-element-41484f27 { object-fit: cover !important; border-radius: 50% !important; }
    @media (min-width: 768px) { .elementor-element-41484f27 { left: -15% !important; } }
    
    /* KIT 1 About & Services overrides */
    .elementor-element-6f812967 img { aspect-ratio: 4 / 3 !important; width: 100% !important; height: auto !important; min-height: auto !important; object-fit: cover !important; }
    .elementor-element-6f812967 { height: auto !important; min-height: auto !important; }
    @media (max-width: 767px) { .elementor-element-6f812967 { margin-top: 0 !important; margin-bottom: 20px !important; } }
    @media (min-width: 768px) {
        .elementor-element-59b6e6d5 { height: auto !important; min-height: auto !important; }
        .elementor-element-42abf8aa { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; }
    }
    @media (max-width: 767px) {
        .elementor-element-42abf8aa { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; width: 100% !important; }
        .elementor-element-63950d29 { display: none !important; }
    }
    
    /* KIT 1 Testimonials Stretch */
    @media (min-width: 768px) {
        .elementor-element-331d0ffb { display: flex !important; align-items: stretch !important; }
        .elementor-element-6e5c11f9, .elementor-element-75ba3d29 { height: auto !important; align-self: stretch !important; display: flex !important; flex-direction: column !important; }
        .elementor-element-6e5c11f9 .elementor-widget-wrap, .elementor-element-75ba3d29 .elementor-widget-wrap { height: 100% !important; display: flex !important; flex-direction: column !important; justify-content: center !important; }
    }
    
    /* KIT 2 Viewport & Aspect overrides */
    @media (min-width: 768px) {
        .elementor-element-49f8bd39 { height: auto !important; min-height: auto !important; }
        .elementor-element-35a4f6fb, .elementor-element-39f1fa01 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; max-height: calc(100vh - 120px) !important; }
    }
    @media (max-width: 767px) {
        .elementor-element-49f8bd39 { height: auto !important; min-height: auto !important; flex-direction: column !important; }
        .elementor-element-35a4f6fb { display: none !important; }
        .elementor-element-39f1fa01 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; width: 100% !important; }
    }
    .elementor-element-4d1645d0 { aspect-ratio: 4 / 3 !important; height: auto !important; min-height: auto !important; }
    @media (max-width: 767px) { .elementor-element-4d1645d0 { aspect-ratio: auto !important; min-height: 380px !important; padding-top: 40px !important; padding-bottom: 40px !important; } }
    
    .elementor-element-51305b21 { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; }
    @media (max-width: 767px) { .elementor-element-51305b21 { aspect-ratio: auto !important; min-height: 380px !important; padding-top: 40px !important; padding-bottom: 40px !important; } }
    
    /* KIT 2 CTA Card Stretch */
    @media (min-width: 1100px) {
        .elementor-element-1b226200 { display: flex !important; flex-direction: row !important; justify-content: flex-end !important; align-items: stretch !important; padding-top: 0 !important; padding-bottom: 0 !important; aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; }
        .elementor-element-56a3deab, .elementor-element-56a3deab .elementor-widget-wrap { height: 100% !important; min-height: 100% !important; align-self: stretch !important; display: flex !important; flex-direction: column !important; justify-content: center !important; margin-top: 0 !important; margin-bottom: 0 !important; }
    }
    @media (min-width: 768px) and (max-width: 1099px) {
        .elementor-element-1b226200 { display: flex !important; flex-direction: row !important; justify-content: flex-end !important; align-items: stretch !important; padding-top: 40px !important; padding-bottom: 40px !important; aspect-ratio: auto !important; height: auto !important; min-height: 600px !important; }
        .elementor-element-56a3deab, .elementor-element-56a3deab .elementor-widget-wrap { height: 100% !important; min-height: 100% !important; align-self: stretch !important; display: flex !important; flex-direction: column !important; justify-content: center !important; margin-top: 0 !important; margin-bottom: 0 !important; }
    }
    @media (max-width: 767px) {
        .elementor-element-1b226200 { flex-direction: column !important; aspect-ratio: auto !important; min-height: 450px !important; }
        .elementor-element-56a3deab { height: auto !important; min-height: auto !important; margin-top: 0 !important; margin-bottom: 0 !important; }
    }
    
    /* KIT 2 Products (Recent Projects) Stack & Clear floats/absolute positioning on mobile/tablet */
    @media (max-width: 1024px) {
        .elementor-element-3c27eca4 .elementor-posts-container { display: flex !important; flex-direction: column !important; float: none !important; clear: both !important; height: auto !important; min-height: 1px !important; }
        .elementor-element-3c27eca4 article.elementor-post { position: relative !important; top: auto !important; left: auto !important; float: none !important; width: 100% !important; max-width: 100% !important; margin-bottom: 30px !important; display: block !important; clear: both !important; }
        .elementor-element-7c6a7a2 { position: relative !important; margin: 30px auto 0 auto !important; left: auto !important; transform: none !important; display: block !important; clear: both !important; }
    }
    </style>
    <?php
});';
file_put_contents($mu_dir . '/ds-custom-styles.php', $mu_plugin_code);
echo "MU_PLUGIN_CREATED\n";
`;
			const phpB64 = Buffer.from(phpCode).toString("base64");
			await runRemoteShellCommand(
				`echo "${phpB64}" | base64 -d > '${phpScriptTmp}'`,
				logCallback,
			);

			await logCallback("Executing remote PHP metadata script...");
			const evalOut = await runWpCommand(
				`eval-file '${phpScriptTmp}' "${homePageId}" "${homepageJsonTmp}" "${activeKitId}" "${kitJsonTmp}" "${logoAttachmentId}"`,
				docRoot,
				logCallback,
			);
			await logCallback(`PHP script output: ${evalOut.stdout}`);

			// Force Elementor to regenerate its static CSS files so colors/fonts apply
			try {
				await logCallback("Regenerating Elementor CSS files...");
				await runWpCommand(`elementor force-regenerate-css`, docRoot, logCallback);
			} catch (cssErr: any) {
				await logCallback(`Warning: Failed to regenerate Elementor CSS: ${cssErr.message}`);
			}



			// Cleanup
			await runRemoteShellCommand(`rm -f '${homepageJsonTmp}' '${kitJsonTmp}' '${phpScriptTmp}'`, logCallback).catch(() => {});

			await logCallback("Elementor site injection complete ✓");

			const contentHash = crypto.createHash("sha1").update(mergedJson).digest("hex");
			return {
				renderSource: "elementor-template",
				length: mergedJson.length,
				sha1: contentHash,
			};
		}

		let content = "";
		const requireOpenRouterHtml =
			(process.env.REQUIRE_OPENROUTER_HTML || "").toLowerCase() === "true";
		const renderSource =
			schema?._renderSource ||
			(schema?._wordpressHtml ? "openrouter-html" : "local-builder");
		if (
			typeof schema?._wordpressHtml === "string" &&
			schema._wordpressHtml.trim()
		) {
			await logCallback(
				"Using OpenRouter-generated WordPress homepage HTML...",
			);
			content = ensureWordPressHtmlBlock(schema._wordpressHtml);
		} else {
			if (requireOpenRouterHtml) {
				throw new Error(
					"OpenRouter HTML is required but was not generated. Check OpenRouter config/quota.",
				);
			}
			await logCallback(
				"OpenRouter HTML unavailable. Building homepage with local premium-site-builder...",
			);
			const { buildPremiumPageContent } =
				await import("./premium-site-builder");
			content = buildPremiumPageContent(schema);
		}
		const contentHash = crypto.createHash("sha1").update(content).digest("hex");
		await logCallback(
			`Content source=${renderSource} length=${content.length} sha1=${contentHash}`,
		);
		await logCallback(
			`[Provisioning] WordPress Homepage HTML Content:\n${content}\n`,
		);
		const traceId = schema?.meta?.traceId || schema?._validation?.traceId;
		if (traceId) {
			try {
				const traceDir = path.join(DEBUG_ROOT_DIR, traceId);
				fs.mkdirSync(traceDir, { recursive: true });
				fs.writeFileSync(
					path.join(traceDir, "11-wp-injected.html"),
					content,
					"utf8",
				);
				fs.writeFileSync(
					path.join(traceDir, "11-wp-injected-meta.json"),
					JSON.stringify(
						{
							renderSource,
							length: content.length,
							sha1: contentHash,
							injectedAt: new Date().toISOString(),
						},
						null,
						2,
					),
					"utf8",
				);
			} catch (e) {
				await logCallback(
					`Warning: failed to write debug injection artifacts: ${e instanceof Error ? e.message : String(e)}`,
				);
			}
		}

		// Write content to temp file on remote server (avoids shell escaping limits)
		const tmpFile = `/tmp/ds_home_${Date.now()}.html`;
		await logCallback(`Writing to remote temp file: ${tmpFile}`);

		// Use a more robust way to write large content to remote file
		// We use base64 to avoid shell escaping issues with complex HTML
		const base64Content = Buffer.from(content).toString("base64");
		await runRemoteShellCommand(
			`echo "${base64Content}" | base64 -d > '${tmpFile}'`,
			logCallback,
		);

		await logCallback("Creating Home page in WordPress...");
		const homePageIdOut = await runWpCommand(
			`post create --post_type=page --post_title="Home" --post_content="$(cat '${tmpFile}')" --post_status=publish --format=ids --user="${adminUser}"`,
			docRoot,
			logCallback,
		);
		const homePageId = homePageIdOut.stdout.replace(/[^0-9]/g, "").trim();
		await runRemoteShellCommand(`rm -f '${tmpFile}'`, logCallback).catch(
			() => {},
		);

		if (!homePageId || homePageId === "0") {
			throw new Error("Home page creation failed — invalid ID returned");
		}

		await logCallback(
			`Home page created with ID: ${homePageId}. Setting as front page...`,
		);
		await runWpCommand(
			`option update show_on_front page`,
			docRoot,
			logCallback,
		);
		await runWpCommand(
			`option update page_on_front ${homePageId}`,
			docRoot,
			logCallback,
		);

		if (schema.brand?.businessName) {
			await runWpCommand(
				`option update blogname "${esc(schema.brand.businessName)}"`,
				docRoot,
				logCallback,
			);
		}

		await runWpCommand(
			`rewrite structure "/%postname%/"`,
			docRoot,
			logCallback,
		);
		await runWpCommand(`rewrite flush`, docRoot, logCallback);

		// Robust Media Import for Logo
		if (schema.brand?.logo) {
			try {
				await logCallback(`Attempting to import logo: ${schema.brand.logo}`);

				let mediaId = "";
				let imported = false;

				// 1. Try local generated logo transfer first
				if (schema.brand.logo.includes("/public/generated-images/")) {
					const parts = schema.brand.logo.split("/public/generated-images/");
					const filename = parts[parts.length - 1];
					const localPath = path.join(process.cwd(), "public", "generated-images", filename);
					if (fs.existsSync(localPath)) {
						await logCallback(`Detected local generated logo: ${filename}. Copying to remote server...`);
						const ext = filename.toLowerCase().endsWith(".png") ? "png" : "jpg";
						const remoteTmpMedia = `/tmp/ds_logo_${Date.now()}.${ext}`;
						try {
							await copyFileToRemote(localPath, remoteTmpMedia, logCallback);
							const mediaOut = await runWpCommand(
								`media import "${remoteTmpMedia}" --porcelain`,
								docRoot,
								logCallback,
							);
							mediaId = mediaOut.stdout.trim();
							if (/^\d+$/.test(mediaId)) {
								imported = true;
							}
						} catch (uploadErr: any) {
							await logCallback(`Failed to copy/import local logo ${filename}: ${uploadErr.message}. Trying direct fallback...`);
						} finally {
							await runRemoteShellCommand(`rm -f "${remoteTmpMedia}"`, logCallback).catch(() => {});
						}
					}
				}

				// 2. Try direct import/curl fallback
				if (!imported) {
					try {
						const mediaOut = await runWpCommand(
							`media import "${schema.brand.logo}" --porcelain`,
							docRoot,
							logCallback,
						);
						mediaId = mediaOut.stdout.trim();
					} catch (e) {
						// If direct import fails (likely due to missing extension), download to temp file first
						await logCallback(
							"Direct import failed. Retrying with local temp file...",
						);
						const ext = schema.brand.logo.toLowerCase().includes(".png")
							? "png"
							: "jpg";
						const remoteTmpMedia = `/tmp/ds_logo_${Date.now()}.${ext}`;
						await runRemoteShellCommand(
							`curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${schema.brand.logo}" -o "${remoteTmpMedia}"`,
							logCallback,
						);
						const mediaOut = await runWpCommand(
							`media import "${remoteTmpMedia}" --porcelain`,
							docRoot,
							logCallback,
						);
						mediaId = mediaOut.stdout.trim();
						if (imgUrl === schema.brand?.logo && !schema.brand?.favicon) {
							await logCallback(`Setting site icon to logo (no dedicated favicon): ${mediaId}`);
							await runWpCommand(
								`option update site_icon ${mediaId}`,
								docRoot,
								logCallback,
							).catch(() => {});
						}
						await runRemoteShellCommand(
							`rm -f "${remoteTmpMedia}"`,
							logCallback,
						).catch(() => {});
					}
				}

				if (/^\d+$/.test(mediaId)) {
					await logCallback(
						`Logo imported successfully (ID: ${mediaId}). Setting as custom logo (theme mod).`,
					);
					// Note: custom_logo is already set via the PHP eval script above.
					// Here we set site_icon ONLY if no dedicated favicon was generated.
					if (!schema.brand?.favicon) {
						await runWpCommand(
							`option update site_icon ${mediaId}`,
							docRoot,
							logCallback,
						);
					}
				}
			} catch (e: any) {
				await logCallback(`Warning: logo import failed: ${e.message}`);
			}
		}

		// Robust Media Import for Favicon (site_icon) — uses dedicated generated favicon if available
		if (schema.brand?.favicon) {
			try {
				await logCallback(`Attempting to import favicon: ${schema.brand.favicon}`);
				let faviconMediaId = "";

				// 1. Try local generated favicon transfer first
				// Favicon URL format: {API_URL}/public/generated-images/favicons/favicon-512x512-{uid}.png
				if (schema.brand.favicon.includes("/public/generated-images/")) {
					const relPath = schema.brand.favicon.split("/public/generated-images/")[1]; // e.g. "favicons/favicon-512x512-xxx.png"
					const localPath = path.join(process.cwd(), "public", "generated-images", relPath);
					if (fs.existsSync(localPath)) {
						await logCallback(`Detected local generated favicon: ${relPath}. Copying to remote server...`);
						const remoteTmpFavicon = `/tmp/ds_favicon_${Date.now()}.png`;
						try {
							await copyFileToRemote(localPath, remoteTmpFavicon, logCallback);
							const mediaOut = await runWpCommand(
								`media import "${remoteTmpFavicon}" --title="Site Favicon" --porcelain`,
								docRoot,
								logCallback,
							);
							faviconMediaId = mediaOut.stdout.trim();
						} catch (uploadErr: any) {
							await logCallback(`Failed to copy/import local favicon: ${uploadErr.message}. Trying direct import...`);
						} finally {
							await runRemoteShellCommand(`rm -f "${remoteTmpFavicon}"`, logCallback).catch(() => {});
						}
					} else {
						await logCallback(`Local favicon not found at ${localPath}, trying direct URL import...`);
					}
				}

				// 2. Direct URL import fallback
				if (!faviconMediaId) {
					try {
						const remoteTmpFavicon = `/tmp/ds_favicon_${Date.now()}.png`;
						await runRemoteShellCommand(
							`curl -sL -A "Mozilla/5.0" "${schema.brand.favicon}" -o "${remoteTmpFavicon}"`,
							logCallback,
						);
						const mediaOut = await runWpCommand(
							`media import "${remoteTmpFavicon}" --title="Site Favicon" --porcelain`,
							docRoot,
							logCallback,
						);
						faviconMediaId = mediaOut.stdout.trim();
						await runRemoteShellCommand(`rm -f "${remoteTmpFavicon}"`, logCallback).catch(() => {});
					} catch (e2: any) {
						await logCallback(`Favicon direct import failed: ${e2.message}`);
					}
				}

				if (/^\d+$/.test(faviconMediaId)) {
					await logCallback(`Favicon imported successfully (ID: ${faviconMediaId}). Setting as site icon.`);
					await runWpCommand(`option update site_icon ${faviconMediaId}`, docRoot, logCallback);
				} else {
					await logCallback(`Favicon import did not return a valid media ID (got: "${faviconMediaId}"). Site icon not set.`);
				}
			} catch (e: any) {
				await logCallback(`Warning: favicon import failed: ${e.message}`);
			}
		}

		await logCallback("Premium WordPress site injection complete ✓");
		// Attempt to fetch final rendered DOM for forensic trace
		try {
			const subdomain = path.basename(docRoot);
			const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscoutwp.online";
			const siteUrl = `http://${subdomain}.${rootDomain}`;
			if (siteUrl) {
				await logCallback(
					`Fetching final rendered site at ${siteUrl} for debug capture...`,
				);
				const resp = await crossFetch(siteUrl);
				const finalDom = await resp.text().catch(() => "");
				const traceId = schema?.meta?.traceId || schema?._validation?.traceId;
				if (traceId && finalDom) {
					const traceDir = path.join(DEBUG_ROOT_DIR, traceId);
					fs.mkdirSync(traceDir, { recursive: true });
					fs.writeFileSync(
						path.join(traceDir, "12-wp-final-dom.html"),
						finalDom,
						"utf8",
					);
					// create a stripped version without scripts/styles for quick inspection
					const stripped = finalDom
						.replace(/<script[\s\S]*?<\/script>/gi, "")
						.replace(/\sstyle="[^"]*"/gi, "");
					fs.writeFileSync(
						path.join(traceDir, "12-wp-final-dom-stripped.html"),
						stripped,
						"utf8",
					);
					const wpMutations = {
						contains_elementor: /elementor/i.test(finalDom),
						contains_wp_blocks: /wp-block/i.test(finalDom),
						theme_injection_detected: /theme|header|footer|site-title/i.test(
							finalDom,
						),
						length: finalDom.length,
					};
					fs.writeFileSync(
						path.join(traceDir, "12-wp-final-mutations.json"),
						JSON.stringify(wpMutations, null, 2),
						"utf8",
					);
				}
			}
		} catch (e) {
			await logCallback(
				`Warning: failed to fetch/persist final WP DOM: ${e instanceof Error ? e.message : String(e)}`,
			);
		}
		return { renderSource, length: content.length, sha1: contentHash };
	} catch (error: any) {
		await logCallback(
			`CRITICAL ERROR during content injection: ${error.message}`,
		);
		throw error;
	}
}

async function rollbackJob(job: any) {
	await appendLog(job.id, "[ROLLBACK] Starting remote cleanup...");
	const docRootBase =
		process.env.WP_DOCROOT_BASE || "/home/digigesf/public_html/sites";

	if (job.subdomain) {
		try {
			const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscoutwp.online";
			await deleteSubdomain(job.subdomain, rootDomain);
			await appendLog(
				job.id,
				`[ROLLBACK] Deleted subdomain ${job.subdomain}.${rootDomain}`,
			);
		} catch (e: any) {
			await appendLog(
				job.id,
				`[ROLLBACK] Failed to delete subdomain: ${e.message}`,
			);
			await appendLog(
				job.id,
				"[ROLLBACK] Tip: configure CPANEL_DELETE_SUBDOMAIN_CMD if UAPI delete is unavailable.",
			);
		}

		// Delete remote directory via SSH
		const fullDocRoot = `${docRootBase}/${job.subdomain}`;
		try {
			await runRemoteShellCommand(`rm -rf "${fullDocRoot}"`, (log) =>
				appendLog(job.id, log),
			);
			await appendLog(
				job.id,
				`[ROLLBACK] Deleted remote directory: ${fullDocRoot}`,
			);
		} catch (e: any) {
			await appendLog(
				job.id,
				`[ROLLBACK] Failed to delete remote directory: ${e.message}`,
			);
		}
	}

	if (job.db_name) {
		try {
			await deleteDatabase(job.db_name);
			await appendLog(
				job.id,
				`[ROLLBACK] Deleted remote database: ${job.db_name}`,
			);
		} catch (e: any) {
			await appendLog(
				job.id,
				`[ROLLBACK] Failed to delete database: ${e.message}`,
			);
		}
	}

	if (job.db_user) {
		try {
			await deleteDatabaseUser(job.db_user);
			await appendLog(
				job.id,
				`[ROLLBACK] Deleted remote DB user: ${job.db_user}`,
			);
		} catch (e: any) {
			await appendLog(
				job.id,
				`[ROLLBACK] Failed to delete DB user: ${e.message}`,
			);
		}
	}

	await appendLog(job.id, "[ROLLBACK] Remote cleanup finished.");
}

// ---------------------------------------------------------------------------
// Public cleanup function
// ---------------------------------------------------------------------------

function extractSubdomainFromUrl(subdomainUrl: string): string | null {
	if (!subdomainUrl) return null;
	try {
		let hostname = subdomainUrl;
		if (hostname.includes("://")) {
			hostname = hostname.split("://")[1];
		}
		hostname = hostname.split("/")[0];
		const parts = hostname.split(".");
		if (parts.length >= 3) {
			return parts[0];
		}
		return null;
	} catch (e) {
		return null;
	}
}

export async function deleteProvisionedWordPressSite(projectId: string) {
	console.log(
		`[Cleanup] Starting comprehensive remote deletion for project ${projectId}`,
	);

	// Fetch related deployment to check if we can get a subdomain from it
	let subdomainFromDeployment: string | null = null;
	try {
		const [deployments]: any = await pool.query(
			`SELECT subdomain_url FROM isolated_deployments WHERE project_id = ?`,
			[projectId],
		);
		if (deployments && deployments.length > 0 && deployments[0].subdomain_url) {
			subdomainFromDeployment = extractSubdomainFromUrl(deployments[0].subdomain_url);
		}
	} catch (err: any) {
		console.error(`[Cleanup] Error querying isolated_deployments: ${err.message}`);
	}

	// 1. Fetch all related jobs to ensure we have the subdomain and DB names
	const [rows]: any = await pool.query(
		`SELECT * FROM provisioning_jobs WHERE project_id = ?`,
		[projectId],
	);

	if (!rows || rows.length === 0) {
		console.warn(
			`[Cleanup] No provisioning job found in DB for project ${projectId}. Attempting database-only purge.`,
		);
		// If we found a subdomain from the deployment, let's still try to clean up remote files!
		if (subdomainFromDeployment) {
			console.log(`[Cleanup] Found subdomain "${subdomainFromDeployment}" from deployment. Attempting file rollback without job record.`);
			try {
				await rollbackJob({ subdomain: subdomainFromDeployment });
			} catch (e: any) {
				console.error(`[Cleanup] Remote directory cleanup failed: ${e.message}`);
			}
		}

		await pool.query(`DELETE FROM isolated_deployments WHERE project_id = ?`, [projectId]);
		await pool.query(`DELETE FROM provisioning_jobs WHERE project_id = ?`, [projectId]);
		await pool.query(`DELETE FROM lead_ai_messages WHERE lead_id = ?`, [projectId]);
		return;
	}

	// 2. Perform remote cleanup for each job found
	for (const job of rows) {
		try {
			// Populate subdomain from deployment if job subdomain is missing
			if (!job.subdomain && subdomainFromDeployment) {
				job.subdomain = subdomainFromDeployment;
			}
			
			// Delete related audit logs
			if (job.trace_id) {
				await pool.query(`DELETE FROM generation_audit_logs WHERE trace_id = ?`, [
					job.trace_id,
				]).catch(() => {});
			}

			await rollbackJob(job);
		} catch (e: any) {
			console.error(
				`[Cleanup] Rollback failed for job ${job.id}: ${e.message}`,
			);
		}
	}

	// 3. Purge from local database tables
	try {
		await pool.query(
			`DELETE FROM isolated_deployments WHERE project_id = ?`,
			[projectId],
		);
		await pool.query(
			`DELETE FROM provisioning_jobs WHERE project_id = ?`,
			[projectId],
		);
		await pool.query(
			`DELETE FROM lead_ai_messages WHERE lead_id = ?`,
			[projectId],
		);

		console.log(`[Cleanup] Project ${projectId} and associated rows purged from local DB.`);
	} catch (e: any) {
		console.error(
			`[Cleanup] Failed to purge project ${projectId} from local DB: ${e.message}`,
		);
		throw e;
	}

	console.log(
		`[Cleanup] Project ${projectId} remote resources and local records fully processed.`,
	);
}
