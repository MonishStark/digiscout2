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

// ---------------------------------------------------------------------------
// Subdomain Generation
// ---------------------------------------------------------------------------

/** DNS-safe maximum length for a single subdomain label */
const MAX_SUBDOMAIN_LENGTH = 45;

/** Semantic fallback suffixes tried before random characters */
const SUBDOMAIN_SEMANTIC_VARIANTS = ["-shop", "-store", "-official", "-co", "-pro"];

/**
 * Sanitizes a business name into a DNS-safe subdomain base.
 * Strips accents, replaces non-alphanumeric with hyphens, collapses/trims hyphens.
 */
function sanitizeSubdomainBase(name: string): string {
	return (name || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")   // strip accent marks
		.replace(/[^a-z0-9]+/g, "-")        // non-alphanumeric → hyphen
		.replace(/-+/g, "-")                // collapse repeated hyphens
		.replace(/^-+|-+$/g, "")            // trim leading/trailing hyphens
		.substring(0, 40);                   // leave room for any suffix
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
	return `${base}-${crypto.randomBytes(4).toString("hex")}`.substring(0, MAX_SUBDOMAIN_LENGTH);
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
			subdomain = await generateUniqueSubdomain(name);
			await appendLog(job.id, `Generated subdomain: "${subdomain}"`);
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

		// Install and activate Astra — minimal block-compatible theme with no opinionated defaults
		await appendLog(job.id, "Installing Astra theme...");
		try {
			await runWpCommand(`theme install astra --activate`, fullDocRoot, (log) => appendLog(job.id, log));
			await appendLog(job.id, "Astra theme activated");
		} catch (e: any) {
			await appendLog(job.id, `Warning: Theme install failed (${e.message}), using default theme`);
		}

		// Clean up unused default themes to save space
		try {
			await runWpCommand(`theme delete twentytwentyfive twentytwentyfour twentytwentythree`, fullDocRoot, (log) => appendLog(job.id, log));
		} catch (e) { /* non-fatal */ }

		// Disable comments site-wide
		await runWpCommand(`option update default_comment_status closed`, fullDocRoot, (log) => appendLog(job.id, log)).catch(() => {});
		await runWpCommand(`option update comment_status closed`, fullDocRoot, (log) => appendLog(job.id, log)).catch(() => {});
		await runWpCommand(`option update blogdescription ""`, fullDocRoot, (log) => appendLog(job.id, log)).catch(() => {});

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

function esc(str: string) {
	return (str || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

async function injectWebsiteContent(
	docRoot: string,
	schema: any,
	_homepageBlocks: string,
	logCallback: (log: string) => void,
) {
	try {
		await logCallback("Cleaning up default WordPress content...");
		try {
			await runWpCommand(
				"post delete $(wp post list --post_type=post,page --format=ids --allow-root) --force --allow-root",
				docRoot, logCallback,
			);
		} catch (e) { /* non-fatal */ }

		const palette = schema.theme?.palette || {
			background: "#07070a", surface: "#111114",
			primary: "#7c3aed", text: "#f4f4f5", muted: "#a1a1aa",
		};

		const businessName = schema.brand?.businessName || "Welcome";
		const sections = schema.sections || [];
		const hero = sections.find((s: any) => s.type === "hero") || sections[0] || {};
		const features = sections.find((s: any) => s.type === "features" || s.type === "services");
		const gallery = sections.find((s: any) => s.type === "gallery");
		const testimonials = sections.find((s: any) => s.type === "testimonials");
		const cta = sections.find((s: any) => s.type === "cta");

		const heroImg = hero?.media?.src || hero?.media?.url || fallbackImageForCategory(schema.brand?.category);
		const heroTitle = hero?.headline || businessName;
		const heroSub = hero?.subheadline || `${businessName} — professional, trusted, and ready to serve you.`;
		const ctaLabel = hero?.primaryCta?.label || hero?.ctaPrimary?.label || "Get Started";
		const email = schema.brand?.email || "";
		const phone = schema.brand?.phone || "";
		const address = schema.brand?.address || "";

		await logCallback("Building premium Gutenberg content...");

		const css = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
html,body{background:${palette.background}!important;color:${palette.text}!important;font-family:'Inter',sans-serif!important;margin:0!important;padding:0!important;}
/* Hide Astra/theme chrome */
.ast-site-header-wrap,.site-header,#masthead,.ast-breadcrumbs-wrapper,.entry-title,.wp-block-post-title,.posted-on,.byline,.ast-blog-single-element,.site-footer,#colophon,.ast-footer-widget-area{display:none!important;}
/* Remove content padding added by Astra */
.ast-separate-container .site-content,.ast-plain-container .site-content,.entry-content,.ast-container{padding:0!important;max-width:100%!important;width:100%!important;}
.wp-site-blocks,.is-layout-flow,.wp-block-post-content{padding:0!important;margin:0!important;}
/* Hero */
.wp-block-cover.ds-hero{min-height:100vh!important;}
.wp-block-cover.ds-hero h1{font-size:clamp(2.2rem,5.5vw,5rem)!important;line-height:1.1!important;font-weight:800!important;color:#fff!important;margin-bottom:1.5rem!important;letter-spacing:-0.02em!important;}
.wp-block-cover.ds-hero p{font-size:clamp(1rem,1.8vw,1.3rem)!important;color:rgba(255,255,255,.85)!important;max-width:600px!important;margin:0 auto 2.5rem!important;line-height:1.65!important;}
/* Sections */
.ds-section{padding:100px 40px!important;width:100%!important;box-sizing:border-box!important;}
.ds-section-dark{background:${palette.surface}!important;}
.ds-section-light{background:${palette.background}!important;}
.ds-section h2{font-size:clamp(1.8rem,3.5vw,3rem)!important;font-weight:800!important;color:${palette.text}!important;text-align:center!important;margin:0 auto 3rem!important;letter-spacing:-0.02em!important;max-width:700px!important;}
.ds-inner{max-width:1100px!important;margin:0 auto!important;}
/* Cards */
.ds-card{background:rgba(255,255,255,.04)!important;border:1px solid rgba(255,255,255,.07)!important;border-radius:20px!important;padding:36px 28px!important;transition:transform .3s ease,box-shadow .3s ease!important;}
.ds-card:hover{transform:translateY(-6px)!important;box-shadow:0 24px 60px rgba(0,0,0,.3)!important;}
.ds-card h3{font-size:1.2rem!important;font-weight:700!important;color:${palette.text}!important;margin:0 0 .75rem!important;}
.ds-card p{color:${palette.muted}!important;line-height:1.7!important;font-size:.95rem!important;margin:0!important;}
.ds-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(270px,1fr))!important;gap:24px!important;margin-top:48px!important;}
/* Testimonials */
.ds-testimonial{background:rgba(255,255,255,.04)!important;border-left:3px solid ${palette.primary}!important;border-radius:12px!important;padding:28px!important;}
.ds-testimonial blockquote{font-style:italic!important;color:${palette.text}!important;margin:0 0 1rem!important;line-height:1.7!important;font-size:1rem!important;}
.ds-testimonial .ds-author{font-weight:600!important;color:${palette.primary}!important;font-size:.9rem!important;}
/* CTA */
.ds-cta-section{padding:100px 40px!important;text-align:center!important;background:linear-gradient(135deg,${palette.primary},${palette.surface})!important;}
.ds-cta-section h2{color:#fff!important;margin-bottom:1.5rem!important;}
.ds-cta-section p{color:rgba(255,255,255,.85)!important;font-size:1.1rem!important;margin:0 auto 2.5rem!important;max-width:580px!important;}
.ds-cta-section a{background:#fff!important;color:${palette.primary}!important;padding:16px 40px!important;border-radius:50px!important;font-weight:700!important;text-decoration:none!important;display:inline-block!important;transition:transform .2s!important;font-size:1rem!important;}
.ds-cta-section a:hover{transform:scale(1.04)!important;}
/* Buttons */
.wp-block-button__link{background:${palette.primary}!important;color:#fff!important;border:none!important;border-radius:50px!important;padding:14px 36px!important;font-weight:700!important;transition:transform .2s,box-shadow .2s!important;font-size:1rem!important;letter-spacing:.01em!important;}
.wp-block-button__link:hover{transform:scale(1.04)!important;box-shadow:0 8px 30px rgba(0,0,0,.25)!important;color:#fff!important;}
/* Gallery */
.ds-gallery-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))!important;gap:16px!important;margin-top:48px!important;}
.ds-gallery-grid figure{margin:0!important;overflow:hidden!important;border-radius:12px!important;aspect-ratio:4/3!important;}
.ds-gallery-grid img{width:100%!important;height:100%!important;object-fit:cover!important;transition:transform .4s ease!important;}
.ds-gallery-grid figure:hover img{transform:scale(1.06)!important;}
/* Contact */
.ds-contact-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))!important;gap:32px!important;margin-top:48px!important;}
.ds-contact-item h3{font-size:1rem!important;font-weight:700!important;color:${palette.primary}!important;margin:0 0 .5rem!important;}
.ds-contact-item p,.ds-contact-item a{color:${palette.muted}!important;line-height:1.6!important;font-size:.95rem!important;text-decoration:none!important;}
@media(max-width:768px){.ds-section{padding:64px 20px!important;}.ds-cta-section{padding:64px 20px!important;}}
</style>`;

		// ── HERO (native wp:cover block) ──────────────────────────────────────
		let content = `<!-- wp:html -->\n${css}\n<!-- /wp:html -->\n\n`;

		content += `<!-- wp:cover {"url":"${esc(heroImg)}","dimRatio":55,"overlayColor":"black","minHeight":100,"minHeightUnit":"vh","align":"full","className":"ds-hero","style":{"spacing":{"padding":{"top":"160px","bottom":"120px"}}}} -->
<div class="wp-block-cover alignfull ds-hero" style="padding-top:160px;padding-bottom:120px;min-height:100vh"><span aria-hidden="true" class="wp-block-cover__background has-black-background-color has-background-dim-55 has-background-dim"></span><img class="wp-block-cover__image-background" alt="${esc(businessName)}" src="${esc(heroImg)}" data-object-fit="cover"/><div class="wp-block-cover__inner-container">
<!-- wp:heading {"textAlign":"center","level":1} -->
<h1 class="wp-block-heading has-text-align-center">${esc(heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textAlign":"center","fontSize":"large"} -->
<p class="has-text-align-center has-large-font-size">${esc(heroSub)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"40px"}}}} -->
<div class="wp-block-buttons" style="margin-top:40px"><!-- wp:button {"style":{"border":{"radius":"50px"}}} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" style="border-radius:50px">${esc(ctaLabel)}</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->
</div></div>
<!-- /wp:cover -->\n\n`;

		// ── FEATURES ─────────────────────────────────────────────────────────
		if (features?.items?.length) {
			const items = features.items.slice(0, 6);
			const cards = items.map((item: any) =>
				`<div class="ds-card"><h3>${esc(item.title || item.name || "")}</h3><p>${esc(item.description || item.body || "")}</p></div>`
			).join("\n");
			content += `<!-- wp:html -->\n<section class="ds-section ds-section-dark" id="services"><div class="ds-inner"><h2>${esc(features.headline || features.title || "Our Services")}</h2><div class="ds-grid">${cards}</div></div></section>\n<!-- /wp:html -->\n\n`;
		}

		// ── GALLERY ──────────────────────────────────────────────────────────
		if (gallery?.items?.length) {
			const imgs = gallery.items.slice(0, 6).map((item: any) =>
				`<figure><img src="${esc(item.src || item.url || "")}" alt="${esc(item.alt || businessName)}" loading="lazy"></figure>`
			).join("\n");
			content += `<!-- wp:html -->\n<section class="ds-section ds-section-light" id="gallery"><div class="ds-inner"><h2>${esc(gallery.headline || gallery.title || "Gallery")}</h2><div class="ds-gallery-grid">${imgs}</div></div></section>\n<!-- /wp:html -->\n\n`;
		}

		// ── TESTIMONIALS ─────────────────────────────────────────────────────
		if (testimonials?.items?.length) {
			const cards = testimonials.items.slice(0, 4).map((item: any) =>
				`<div class="ds-testimonial"><blockquote>"${esc(item.quote || "")}"</blockquote><div class="ds-author">— ${esc(item.author || "")}${item.role ? `, ${esc(item.role)}` : ""}</div></div>`
			).join("\n");
			content += `<!-- wp:html -->\n<section class="ds-section ds-section-dark" id="reviews"><div class="ds-inner"><h2>${esc(testimonials.headline || "What Our Clients Say")}</h2><div class="ds-grid">${cards}</div></div></section>\n<!-- /wp:html -->\n\n`;
		}

		// ── CTA BANNER ───────────────────────────────────────────────────────
		if (cta) {
			const ctaT = cta.headline || cta.title || `Ready to experience ${businessName}?`;
			const ctaB = cta.body || "";
			const ctaBtnLabel = cta.buttonLabel || cta.primaryCta?.label || "Book Now";
			const ctaBtnHref = cta.buttonHref || cta.primaryCta?.href || "#contact";
			content += `<!-- wp:html -->\n<section class="ds-cta-section"><h2>${esc(ctaT)}</h2>${ctaB ? `<p>${esc(ctaB)}</p>` : ""}<a href="${esc(ctaBtnHref)}">${esc(ctaBtnLabel)}</a></section>\n<!-- /wp:html -->\n\n`;
		}

		// ── CONTACT ──────────────────────────────────────────────────────────
		let contactItems = "";
		if (address) contactItems += `<div class="ds-contact-item"><h3>Address</h3><p>${esc(address)}</p></div>`;
		if (phone) contactItems += `<div class="ds-contact-item"><h3>Phone</h3><p><a href="tel:${esc(phone)}">${esc(phone)}</a></p></div>`;
		if (email) contactItems += `<div class="ds-contact-item"><h3>Email</h3><p><a href="mailto:${esc(email)}">${esc(email)}</a></p></div>`;
		if (contactItems) {
			content += `<!-- wp:html -->\n<section class="ds-section ds-section-dark" id="contact"><div class="ds-inner"><h2>Get In Touch</h2><div class="ds-contact-grid">${contactItems}</div></div></section>\n<!-- /wp:html -->\n\n`;
		}

		// Write content to temp file on remote server (avoids shell escaping limits)
		const tmpFile = `/tmp/ds_home_${Date.now()}.html`;
		await logCallback(`Writing to remote temp file: ${tmpFile}`);
		await runRemoteShellCommand(
			`cat > '${tmpFile}' << 'DS_MARKER'\n${content}\nDS_MARKER`,
			logCallback,
		);

		await logCallback("Creating Home page in WordPress...");
		const homePageIdOut = await runWpCommand(
			`post create --post_type=page --post_title="Home" --post_content="$(cat '${tmpFile}')" --post_status=publish --format=ids`,
			docRoot, logCallback,
		);
		const homePageId = homePageIdOut.stdout.replace(/[^0-9]/g, "").trim();
		await runRemoteShellCommand(`rm -f '${tmpFile}'`, logCallback).catch(() => {});

		if (!homePageId) throw new Error("Home page creation failed — no ID returned");

		await runWpCommand(`option update show_on_front page`, docRoot, logCallback);
		await runWpCommand(`option update page_on_front ${homePageId}`, docRoot, logCallback);
		if (schema.brand?.businessName) {
			await runWpCommand(`option update blogname "${esc(schema.brand.businessName)}"`, docRoot, logCallback);
		}
		await runWpCommand(`rewrite structure "/%postname%/"`, docRoot, logCallback);
		await runWpCommand(`rewrite flush`, docRoot, logCallback);

		if (schema.brand?.logo) {
			try {
				const mediaOut = await runWpCommand(`media import "${schema.brand.logo}" --porcelain`, docRoot, logCallback);
				const mediaId = mediaOut.stdout.trim();
				if (/^\d+$/.test(mediaId)) {
					await runWpCommand(`option update site_icon ${mediaId}`, docRoot, logCallback);
				}
			} catch (e: any) { await logCallback(`Warning: logo import failed: ${e.message}`); }
		}

		await logCallback("Premium WordPress site injection complete ✓");
	} catch (error: any) {
		await logCallback(`CRITICAL ERROR during content injection: ${error.message}`);
		throw error;
	}
}


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
