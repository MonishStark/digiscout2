import crypto from "crypto";
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

// NOTE: No local `fs` import — all filesystem operations are remote via SSH.

const MAX_RETRIES = 3;

function sanitizeSubdomain(name: string) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
		.substring(0, 25);
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
	const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), Buffer.from(ivHex, "hex"));
	let decrypted = decipher.update(Buffer.from(encHex, "hex"));
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
}

async function appendLog(jobId: string, message: string) {
	const timestamp = new Date().toISOString();
	const logEntry = `[${timestamp}] ${message}`;
	console.log(`[Job ${jobId}] ${message}`);

	await pool.query(
		`UPDATE provisioning_jobs SET logs = JSON_ARRAY_APPEND(COALESCE(logs, JSON_ARRAY()), '$', ?) WHERE id = ?`,
		[logEntry, jobId],
	);
}

export async function processJob(jobId: string) {
	const [rows]: any = await pool.query(`SELECT * FROM provisioning_jobs WHERE id = ?`, [jobId]);
	if (!rows || rows.length === 0) return;

	const job = rows[0];
	if (job.status === "completed" || job.status === "failed") return;

	try {
		await executeStateMachine(job);
	} catch (error: any) {
		await appendLog(job.id, `ERROR: ${error.message}`);

		if (job.retry_count < MAX_RETRIES) {
			await appendLog(job.id, `Retrying later (Attempt ${job.retry_count + 1}/${MAX_RETRIES})`);
			await pool.query(`UPDATE provisioning_jobs SET retry_count = retry_count + 1, locked_at = NULL WHERE id = ?`, [job.id]);
		} else {
			await appendLog(job.id, `Max retries reached. Initiating rollback.`);
			await rollbackJob(job);
			await pool.query(`UPDATE provisioning_jobs SET status = 'failed', locked_at = NULL WHERE id = ?`, [job.id]);
		}
	}
}

async function executeStateMachine(job: any) {
	const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscoutwp.online";
	const docRootBase = process.env.WP_DOCROOT_BASE || "/home/digigesf/public_html/sites";

	let subdomain = job.subdomain;
	let dbName = job.db_name;
	let dbUser = job.db_user;
	let wpAdminUser = job.wp_admin_user || "admin";
	let wpAdminPass = job.wp_admin_pass_encrypted;

	// ── STEP 1: Creating Subdomain ──────────────────────────────────────────
	if (job.status === "pending" || job.status === "creating_subdomain") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'creating_subdomain' WHERE id = ?`, [job.id]);
		await appendLog(job.id, "Starting subdomain creation on remote WP server");

		if (!subdomain) {
			const name = job.business_name || job.project_id;
			const base = sanitizeSubdomain(name);
			const suffix = crypto.randomBytes(2).toString("hex");
			subdomain = `${base}-${suffix}`.substring(0, 32);
			await pool.query(`UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`, [subdomain, job.id]);
		}

		const fullDocRoot = `${docRootBase}/${subdomain}`;
		await appendLog(job.id, `Remote doc root will be: ${fullDocRoot}`);

		// Create subdomain via cPanel UAPI on the remote WP server
		await addSubdomain(subdomain, rootDomain, fullDocRoot);
		await appendLog(job.id, `Created subdomain: ${subdomain}.${rootDomain} → ${fullDocRoot}`);

		job.status = "creating_database";
	}

	// ── STEP 2: Creating Database ───────────────────────────────────────────
	if (job.status === "creating_database") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'creating_database' WHERE id = ?`, [job.id]);
		await appendLog(job.id, "Creating database on remote WP server cPanel");

		const dbPrefix = process.env.CPANEL_USERNAME ? `${process.env.CPANEL_USERNAME}_` : "db_";

		if (!dbName) {
			const suffix = crypto.randomBytes(4).toString("hex");
			dbName = `${dbPrefix}${suffix}`.substring(0, 64);
			dbUser = `${dbPrefix}u${suffix}`.substring(0, 32);
			await pool.query(`UPDATE provisioning_jobs SET db_name = ?, db_user = ? WHERE id = ?`, [dbName, dbUser, job.id]);
		}

		const dbPassword = generateSecurePassword();
		await createDatabase(dbName);
		await createDatabaseUser(dbUser, dbPassword);
		await setDatabasePrivileges(dbUser, dbName);

		await pool.query(`UPDATE provisioning_jobs SET db_pass_encrypted = ? WHERE id = ?`, [encrypt(dbPassword), job.id]);
		(job as any)._tempDbPass = dbPassword;
		await appendLog(job.id, `Created remote database: ${dbName} and user: ${dbUser}`);

		job.status = "installing_wordpress";
	}

	// ── STEP 3: Installing WordPress ────────────────────────────────────────
	if (job.status === "installing_wordpress") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'installing_wordpress' WHERE id = ?`, [job.id]);
		await appendLog(job.id, "Starting remote WordPress installation via SSH/WP-CLI");

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
			throw new Error(`WP-CLI not reachable on remote server: ${wpCliStatus.error}`);
		}
		await appendLog(job.id, `WP-CLI available: ${wpCliStatus.version}`);

		const fullDocRoot = `${docRootBase}/${subdomain}`;

		// Create the remote directory explicitly before WP download
		await appendLog(job.id, `Creating remote directory: ${fullDocRoot}`);
		await runRemoteShellCommand(`mkdir -p "${fullDocRoot}"`, (log) => appendLog(job.id, log));

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
		await createWpConfig(fullDocRoot, dbName, dbUser, dbPassword, "localhost", (log) => appendLog(job.id, log));

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
		await pool.query(`UPDATE provisioning_jobs SET status = 'configuring_wordpress' WHERE id = ?`, [job.id]);
		const fullDocRoot = `${docRootBase}/${subdomain}`;

		await configurePermalinks(fullDocRoot, "/%postname%/", (log) => appendLog(job.id, log));
		await appendLog(job.id, "Configured remote permalinks");

		job.status = "deploying_content";
	}

	// ── STEP 5: Deploying Gutenberg Content ─────────────────────────────────
	if (job.status === "deploying_content") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'deploying_content' WHERE id = ?`, [job.id]);
		await appendLog(job.id, "Deploying Gutenberg content blocks to remote WordPress...");

		const fullDocRoot = `${docRootBase}/${subdomain}`;
		const schema = typeof job.website_schema === "string"
			? JSON.parse(job.website_schema)
			: job.website_schema;

		if (schema) {
			const { schemaToGutenbergBlocks } = await import("./wordpress");
			const homepageBlocks = schemaToGutenbergBlocks(schema);

			// Store Gutenberg trace for audit/replay
			await pool.query(
				`UPDATE provisioning_jobs SET gutenberg_trace = ?, status = 'deploying_content' WHERE id = ?`,
				[homepageBlocks, job.id],
			);

			await injectWebsiteContent(fullDocRoot, schema, homepageBlocks, (log) => appendLog(job.id, log));
			await appendLog(job.id, "Content injected successfully on remote server");
		} else {
			await appendLog(job.id, "WARNING: No website schema found to inject.");
		}

		job.status = "completed";
	}

	// ── STEP 6: Completed ───────────────────────────────────────────────────
	if (job.status === "completed") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'completed', locked_at = NULL WHERE id = ?`, [job.id]);

		// Always start with http — SSL polling worker will upgrade to https
		const httpUrl = `http://${subdomain}.${rootDomain}`;

		await pool.query(`
			INSERT IGNORE INTO isolated_deployments
				(id, project_id, subdomain_url, wp_admin_url, admin_username, encrypted_admin_password, website_schema, ssl_status)
			VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
		`, [
			crypto.randomUUID(),
			job.project_id,
			httpUrl,
			`${httpUrl}/wp-admin`,
			wpAdminUser,
			wpAdminPass,
			typeof job.website_schema === "string" ? job.website_schema : JSON.stringify(job.website_schema),
		]);

		// Write to audit log
		if (job.trace_id) {
			try {
				await pool.query(
					`INSERT INTO generation_audit_logs (trace_id, step, message, data) VALUES (?, ?, ?, ?)`,
					[
						job.trace_id,
						"provisioning_completed",
						`Remote WordPress site provisioned at ${httpUrl}`,
						JSON.stringify({ url: httpUrl, jobId: job.id, remoteHost: process.env.WP_SSH_HOST }),
					],
				);
			} catch (e) { /* non-fatal */ }
		}

		await appendLog(job.id, `Job completed! Remote WP site live at ${httpUrl} (SSL polling started)`);
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

async function injectWebsiteContent(
	docRoot: string,
	schema: any,
	homepageBlocks: string,
	logCallback: (log: string) => void,
) {
	try {
		// Clear default WordPress content
		await logCallback("Cleaning up default WordPress content...");
		try {
			await runWpCommand(
				"post delete $(wp post list --post_type=post,page --format=ids --allow-root) --force --allow-root",
				docRoot,
				logCallback,
			);
		} catch (e) {
			// Non-fatal — may fail if no posts exist
		}

		const theme = schema.theme || {};
		const palette = theme.palette || {
			background: "#07070a",
			surface: "#111114",
			primary: "#7c3aed",
			text: "#f4f4f5",
			muted: "#a1a1aa",
		};

		await logCallback("Generating premium CSS theme overrides...");

		const globalStyles = `
<style>
	:root {
		--wp--preset--color--primary: ${palette.primary};
		--wp--preset--color--background: ${palette.background};
		--wp--preset--color--foreground: ${palette.text};
		--wp--preset--color--muted: ${palette.muted || "#a1a1aa"};
	}
	body {
		background-color: ${palette.background} !important;
		color: ${palette.text} !important;
		font-family: 'Inter', sans-serif !important;
		margin: 0;
	}
	.entry-title, .wp-block-post-title { display: none !important; }
	.wp-block-group, .wp-block-columns, .wp-block-column {
		color: ${palette.text} !important;
	}
	h1, h2, h3, h4 { color: ${palette.text} !important; font-weight: 700 !important; }
	.has-background { padding: 40px; border-radius: 24px; }
	.premium-card {
		background: rgba(255,255,255,0.03) !important;
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255,255,255,0.1) !important;
		border-radius: 28px !important;
	}
	.wp-block-button__link {
		background-color: ${palette.primary} !important;
		border-radius: 50px !important;
		padding: 16px 40px !important;
		font-weight: 600 !important;
		transition: transform 0.2s ease !important;
		border: none !important;
	}
	.wp-block-button__link:hover { transform: scale(1.05); }
</style>`;

		const homeContent = `<!-- wp:html -->\n${globalStyles}\n<!-- /wp:html -->\n${homepageBlocks}`;

		// WP-CLI post create with single-quoted content to handle embedded double quotes
		// We write the content to a temp file on the remote server and then use `< file` redirect
		// to avoid shell escaping issues with very long Gutenberg blocks.
		const tmpFile = `/tmp/ds_home_${Date.now()}.html`;
		await logCallback(`Writing home page content to remote temp file: ${tmpFile}`);

		// Write the content file via SSH heredoc
		const escapedContent = homeContent.replace(/\\/g, "\\\\").replace(/'/g, `'\\''`);
		await runRemoteShellCommand(
			`cat > '${tmpFile}' << 'DS_EOF_MARKER'\n${homeContent}\nDS_EOF_MARKER`,
			logCallback,
		);

		await logCallback("Creating Home page in remote WordPress...");
		const homePageIdOut = await runWpCommand(
			`post create --post_type=page --post_title="Home" --post_content="$(cat '${tmpFile}')" --post_status=publish --format=ids`,
			docRoot,
			logCallback,
		);
		const homePageId = homePageIdOut.stdout.replace(/[^0-9]/g, "").trim();

		// Clean up the temp file
		await runRemoteShellCommand(`rm -f '${tmpFile}'`, logCallback).catch(() => {});

		if (!homePageId) {
			throw new Error("Failed to create Home page — no ID returned from WP-CLI");
		}

		await logCallback(`Home page created with ID: ${homePageId}`);

		// Set the homepage as the front page
		await runWpCommand(`option update show_on_front page`, docRoot, logCallback);
		await runWpCommand(`option update page_on_front ${homePageId}`, docRoot, logCallback);

		if (schema.brand?.businessName) {
			const safeName = schema.brand.businessName.replace(/"/g, '\\"');
			await runWpCommand(`option update blogname "${safeName}"`, docRoot, logCallback);
		}

		await runWpCommand(`rewrite structure "/%postname%/"`, docRoot, logCallback);
		await runWpCommand(`rewrite flush`, docRoot, logCallback);

		// Import brand logo / media if available
		if (schema.brand?.logo) {
			await logCallback(`Importing brand logo from: ${schema.brand.logo}`);
			try {
				const mediaIdOut = await runWpCommand(
					`media import "${schema.brand.logo}" --porcelain`,
					docRoot,
					logCallback,
				);
				const mediaId = mediaIdOut.stdout.trim();
				if (mediaId && /^\d+$/.test(mediaId)) {
					await runWpCommand(`option update site_icon ${mediaId}`, docRoot, logCallback);
					await logCallback(`Logo imported (Media ID: ${mediaId}) and set as site icon`);
				}
			} catch (err: any) {
				await logCallback(`Warning: Logo import failed: ${err.message}`);
			}
		}

		await logCallback("Remote WordPress content injection complete.");
	} catch (error: any) {
		await logCallback(`CRITICAL ERROR during remote content injection: ${error.message}`);
		throw error;
	}
}

// ---------------------------------------------------------------------------
// Rollback — cleans up the remote WP server
// ---------------------------------------------------------------------------

async function rollbackJob(job: any) {
	await appendLog(job.id, "[ROLLBACK] Starting remote cleanup...");
	const docRootBase = process.env.WP_DOCROOT_BASE || "/home/digigesf/public_html/sites";

	if (job.subdomain) {
		try {
			const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscoutwp.online";
			await deleteSubdomain(job.subdomain, rootDomain);
			await appendLog(job.id, `[ROLLBACK] Deleted subdomain ${job.subdomain}.${rootDomain}`);
		} catch (e: any) {
			await appendLog(job.id, `[ROLLBACK] Failed to delete subdomain: ${e.message}`);
		}

		// Delete remote directory via SSH
		const fullDocRoot = `${docRootBase}/${job.subdomain}`;
		try {
			await runRemoteShellCommand(`rm -rf "${fullDocRoot}"`, (log) => appendLog(job.id, log));
			await appendLog(job.id, `[ROLLBACK] Deleted remote directory: ${fullDocRoot}`);
		} catch (e: any) {
			await appendLog(job.id, `[ROLLBACK] Failed to delete remote directory: ${e.message}`);
		}
	}

	if (job.db_name) {
		try {
			await deleteDatabase(job.db_name);
			await appendLog(job.id, `[ROLLBACK] Deleted remote database: ${job.db_name}`);
		} catch (e: any) {
			await appendLog(job.id, `[ROLLBACK] Failed to delete database: ${e.message}`);
		}
	}

	if (job.db_user) {
		try {
			await deleteDatabaseUser(job.db_user);
			await appendLog(job.id, `[ROLLBACK] Deleted remote DB user: ${job.db_user}`);
		} catch (e: any) {
			await appendLog(job.id, `[ROLLBACK] Failed to delete DB user: ${e.message}`);
		}
	}

	await appendLog(job.id, "[ROLLBACK] Remote cleanup finished.");
}

// ---------------------------------------------------------------------------
// Public cleanup function
// ---------------------------------------------------------------------------

export async function deleteProvisionedWordPressSite(projectId: string) {
	console.log(`[Cleanup] Starting remote deletion for project ${projectId}`);

	const [rows]: any = await pool.query(
		`SELECT * FROM provisioning_jobs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1`,
		[projectId],
	);

	if (!rows || rows.length === 0) {
		console.warn(`[Cleanup] No provisioning job found for project ${projectId}`);
		return;
	}

	const job = rows[0];
	await rollbackJob(job);

	await pool.query(`DELETE FROM isolated_deployments WHERE project_id = ?`, [projectId]);
	await pool.query(`DELETE FROM provisioning_jobs WHERE project_id = ?`, [projectId]);

	console.log(`[Cleanup] Project ${projectId} fully purged from remote server.`);
}
