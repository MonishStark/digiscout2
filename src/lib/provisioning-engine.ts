/** @format */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { pool } from "./db";
import {
	addSubdomain,
	deleteSubdomain,
	createDatabase,
	createDatabaseUser,
	setDatabasePrivileges,
	deleteDatabase,
	deleteDatabaseUser,
} from "./cpanel-uapi";
import {
	checkWpCliAvailable,
	downloadWordPressCore,
	createWpConfig,
	installWordPress,
	configurePermalinks,
	runWpCommand,
	runRemoteShellCommand,
} from "./wp-cli";
import { mergeElementorTemplate } from "./elementor-merger";

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
		.substring(0, 40); // leave room for any suffix
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
		const candidate = `${base}-${i}`.substring(0, MAX_SUBDOMAIN_LENGTH);
		if (!(await isSubdomainTaken(candidate))) {
			return candidate;
		}
	}

	// Priority 3: semantic variants
	for (const suffix of SUBDOMAIN_SEMANTIC_VARIANTS) {
		const candidate = `${base}${suffix}`.substring(0, MAX_SUBDOMAIN_LENGTH);
		if (!(await isSubdomainTaken(candidate))) {
			return candidate;
		}
	}

	// Priority 4: short random hex suffix (last resort)
	for (let attempt = 0; attempt < 10; attempt++) {
		const suffix = crypto.randomBytes(2).toString("hex"); // 4 chars e.g. "a3f1"
		const candidate = `${base}-${suffix}`.substring(0, MAX_SUBDOMAIN_LENGTH);
		if (!(await isSubdomainTaken(candidate))) {
			return candidate;
		}
	}

	// Absolute last resort (collision-safe)
	return `${base}-${crypto.randomBytes(4).toString("hex")}`.substring(
		0,
		MAX_SUBDOMAIN_LENGTH,
	);
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

		const fullDocRoot = `${docRootBase}/${subdomain}`;
		await appendLog(job.id, `Remote doc root will be: ${fullDocRoot}`);

		// Create subdomain via cPanel UAPI on the remote WP server
		await addSubdomain(subdomain, rootDomain, fullDocRoot);
		await appendLog(
			job.id,
			`Created subdomain: ${subdomain}.${rootDomain} → ${fullDocRoot}`,
		);

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

			if (schema.brand?.logo) {
				imageSet.add(schema.brand.logo);
			}

			// Scan template JSON files for library.elementor.com URLs to download/import
			const templateDir = path.join(process.cwd(), "elementor-kit");
			const templateFiles = [
				path.join(templateDir, "content", "page", "2.json"),
				path.join(templateDir, "templates", "15.json"),
				path.join(templateDir, "templates", "244.json"),
			];

			for (const file of templateFiles) {
				if (fs.existsSync(file)) {
					try {
						const content = fs.readFileSync(file, "utf8");
						const matches = content.match(/https?:\/\/library\.elementor\.com\/[^\s"'}]+/g);
						if (matches) {
							for (const match of matches) {
								const url = match.replace(/\\/g, "");
								imageSet.add(url);
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
					try {
						const mediaOut = await runWpCommand(
							`media import "${imgUrl}" --porcelain`,
							docRoot,
							logCallback,
						);
						mediaId = mediaOut.stdout.trim();
					} catch (e: any) {
						await logCallback(`Direct import failed for ${imgUrl}. Trying with curl...`);
						const ext = imgUrl.toLowerCase().includes(".png") ? "png" : "jpg";
						const remoteTmpMedia = `/tmp/ds_media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
						await runRemoteShellCommand(
							`curl -sL "${imgUrl}" -o "${remoteTmpMedia}"`,
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

					if (/^\d+$/.test(mediaId)) {
						const urlOut = await runWpCommand(
							`eval "echo wp_get_attachment_url(${mediaId});"`,
							docRoot,
							logCallback,
						);
						const localUrl = urlOut.stdout.trim();
						mediaMap[imgUrl] = { id: parseInt(mediaId, 10), url: localUrl };
						await logCallback(`Successfully imported: ${imgUrl} -> ID: ${mediaId}, URL: ${localUrl}`);

						if (imgUrl === schema.brand?.logo) {
							await logCallback(`Setting site icon to: ${mediaId}`);
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

			// Create navigation menu
			let menuId = "";
			try {
				await logCallback("Creating Main Menu...");
				const menuCreateOut = await runWpCommand(
					`menu create "Main Menu" --porcelain`,
					docRoot,
					logCallback,
				).catch(async () => {
					const out = await runWpCommand(
						`menu list --fields=term_id,name --format=json`,
						docRoot,
						logCallback,
					);
					const menus = JSON.parse(out.stdout.trim() || "[]");
					const found = menus.find((m: any) => m.name === "Main Menu");
					return { stdout: found ? String(found.term_id) : "" };
				});
				menuId = menuCreateOut.stdout.trim();
				await logCallback(`Main Menu ID: ${menuId}`);

				if (menuId) {
					await runWpCommand(
						`menu location assign "Main Menu" menu-1`,
						docRoot,
						logCallback,
					).catch(() => {});

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
					} catch (e) {
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
			// Call mergeElementorTemplate
			const businessInfo = {
				name: schema.brand?.businessName || "Business",
				address: schema.brand?.address || "",
				phone: schema.brand?.phone || "",
				email: schema.brand?.email || "",
			};

			await logCallback("Merging Elementor template layouts...");
			const mergedJson = mergeElementorTemplate(
				templateDir,
				aiContent,
				mediaMap,
				businessInfo,
				menuId,
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
					const kitSettingsPath = path.join(process.cwd(), "elementor-kit", "site-settings.json");
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

			const phpCode = `<?php
$homepage_id = intval($args[0]);
$homepage_json_file = $args[1];
$kit_id = intval($args[2]);
$kit_settings_json_file = $args[3];

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
`;
			const phpB64 = Buffer.from(phpCode).toString("base64");
			await runRemoteShellCommand(
				`echo "${phpB64}" | base64 -d > '${phpScriptTmp}'`,
				logCallback,
			);

			await logCallback("Executing remote PHP metadata script...");
			const evalOut = await runWpCommand(
				`eval-file '${phpScriptTmp}' "${homePageId}" "${homepageJsonTmp}" "${activeKitId}" "${kitJsonTmp}"`,
				docRoot,
				logCallback,
			);
			await logCallback(`PHP script output: ${evalOut.stdout}`);

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

				// Try to import directly first
				let mediaId = "";
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
						`curl -sL "${schema.brand.logo}" -o "${remoteTmpMedia}"`,
						logCallback,
					);
					const mediaOut = await runWpCommand(
						`media import "${remoteTmpMedia}" --porcelain`,
						docRoot,
						logCallback,
					);
					mediaId = mediaOut.stdout.trim();
					await runRemoteShellCommand(
						`rm -f "${remoteTmpMedia}"`,
						logCallback,
					).catch(() => {});
				}

				if (/^\d+$/.test(mediaId)) {
					await logCallback(
						`Logo imported successfully (ID: ${mediaId}). Setting as site icon.`,
					);
					await runWpCommand(
						`option update site_icon ${mediaId}`,
						docRoot,
						logCallback,
					);
				}
			} catch (e: any) {
				await logCallback(`Warning: logo import failed: ${e.message}`);
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
				const resp = await fetch(siteUrl);
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

export async function deleteProvisionedWordPressSite(projectId: string) {
	console.log(
		`[Cleanup] Starting comprehensive remote deletion for project ${projectId}`,
	);

	// 1. Fetch all related jobs to ensure we have the subdomain and DB names
	const [rows]: any = await pool.query(
		`SELECT * FROM provisioning_jobs WHERE project_id = ?`,
		[projectId],
	);

	if (!rows || rows.length === 0) {
		console.warn(
			`[Cleanup] No provisioning job found in DB for project ${projectId}. Attempting database-only purge.`,
		);
		await pool.query(`DELETE FROM isolated_deployments WHERE project_id = ?`, [
			projectId,
		]);
		await pool.query(`DELETE FROM provisioning_jobs WHERE project_id = ?`, [
			projectId,
		]);
		return;
	}

	// 2. Perform remote cleanup for each job found (usually just one, but let's be thorough)
	for (const job of rows) {
		try {
			await rollbackJob(job);
		} catch (e: any) {
			console.error(
				`[Cleanup] Rollback failed for job ${job.id}: ${e.message}`,
			);
			// Continue to next job or purge — we don't want to block the DB deletion
		}
	}

	// 3. Purge from local database tables
	try {
		const [del1] = await pool.query(
			`DELETE FROM isolated_deployments WHERE project_id = ?`,
			[projectId],
		);
		const [del2] = await pool.query(
			`DELETE FROM provisioning_jobs WHERE project_id = ?`,
			[projectId],
		);

		console.log(
			`[Cleanup] Project ${projectId} purged from local DB. Jobs removed: ${(del2 as any).affectedRows}`,
		);
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
