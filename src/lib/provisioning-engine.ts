import crypto from "crypto";
import fs from "fs";
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
	installWordPress,
	configurePermalinks,
	runWpCommand,
} from "./wp-cli";

const MAX_RETRIES = 3;

function sanitizeSubdomain(name: string) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "-") // Replace everything non-alphanumeric with hyphen
		.replace(/-+/g, "-")        // Replace multiple hyphens with single hyphen
		.replace(/^-+|-+$/g, "")    // Remove leading/trailing hyphens
		.substring(0, 25);          // Keep it short to leave room for suffix
}

function generateSecurePassword() {
	return crypto.randomBytes(16).toString("hex") + "!aA1";
}

function encrypt(text: string) {
	const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef"; // Ensure 32 bytes in prod
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
	let encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return iv.toString("hex") + ":" + encrypted.toString("hex");
}

async function appendLog(jobId: string, message: string) {
	const timestamp = new Date().toISOString();
	const logEntry = `[${timestamp}] ${message}`;
	console.log(`[Job ${jobId}] ${message}`);

	await pool.query(
		`UPDATE provisioning_jobs SET logs = JSON_ARRAY_APPEND(COALESCE(logs, JSON_ARRAY()), '$', ?) WHERE id = ?`,
		[logEntry, jobId]
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
	const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscout.online";
	const docRootBase = process.env.WP_DOCROOT_BASE || "/home/username/public_html/sites";
	
	let subdomain = job.subdomain;
	let dbName = job.db_name;
	let dbUser = job.db_user;
	let wpAdminUser = job.wp_admin_user || "admin";
	let wpAdminPass = job.wp_admin_pass_encrypted;

	// 1. Creating Subdomain
	if (job.status === "pending" || job.status === "creating_subdomain") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'creating_subdomain' WHERE id = ?`, [job.id]);
		await appendLog(job.id, "Starting subdomain creation");
		
		if (!subdomain) {
			const name = job.business_name || job.project_id;
			const base = sanitizeSubdomain(name);
			const suffix = crypto.randomBytes(2).toString("hex");
			subdomain = `${base}-${suffix}`.substring(0, 32);
			await pool.query(`UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`, [subdomain, job.id]);
		}

		const fullDocRoot = `${docRootBase}/${subdomain}`;
		await addSubdomain(subdomain, rootDomain, fullDocRoot);
		await appendLog(job.id, `Created subdomain: ${subdomain}.${rootDomain}`);
		
		job.status = "creating_database";
	}

	// 2. Creating Database
	if (job.status === "creating_database") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'creating_database' WHERE id = ?`, [job.id]);
		await appendLog(job.id, "Starting database creation");

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
		await appendLog(job.id, `Created database: ${dbName} and user: ${dbUser}`);

		job.status = "installing_wordpress";
	}

	// 3. Installing WordPress
	if (job.status === "installing_wordpress") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'installing_wordpress' WHERE id = ?`, [job.id]);
		await appendLog(job.id, "Starting WordPress installation");

		let dbPassword = (job as any)._tempDbPass;
		if (!dbPassword && job.db_pass_encrypted) {
			const parts = job.db_pass_encrypted.split(":");
			const iv = Buffer.from(parts[0], "hex");
			const encrypted = Buffer.from(parts[1], "hex");
			const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
			const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
			let decrypted = decipher.update(encrypted);
			decrypted = Buffer.concat([decrypted, decipher.final()]);
			dbPassword = decrypted.toString();
		}

		if (!dbPassword) {
			throw new Error("Database password missing. Manual intervention required.");
		}

		const wpCliStatus = await checkWpCliAvailable();
		if (!wpCliStatus.available) {
			throw new Error("WP-CLI is missing on the host. Cannot proceed.");
		}

		const fullDocRoot = `${docRootBase}/${subdomain}`;
		
		if (!fs.existsSync(fullDocRoot)) {
			fs.mkdirSync(fullDocRoot, { recursive: true });
		}

		await downloadWordPressCore(fullDocRoot, (log) => appendLog(job.id, log));
		
		if (!wpAdminPass) {
			const rawPass = generateSecurePassword();
			wpAdminPass = encrypt(rawPass);
			(job as any)._tempAdminPass = rawPass;
			await pool.query(`UPDATE provisioning_jobs SET wp_admin_user = ?, wp_admin_pass_encrypted = ? WHERE id = ?`, [wpAdminUser, wpAdminPass, job.id]);
		}

		await createWpConfig(fullDocRoot, dbName, dbUser, dbPassword, "localhost", (log) => appendLog(job.id, log));
		
		const rawAdminPass = (job as any)._tempAdminPass;
		const fullUrl = `http://${subdomain}.${rootDomain}`;
		await installWordPress(fullDocRoot, fullUrl, `Generated Site ${job.project_id}`, wpAdminUser, rawAdminPass, "admin@digitalscout.online", (log) => appendLog(job.id, log));

		await appendLog(job.id, "WordPress installed successfully");
		job.status = "configuring_wordpress";
	}

	// 4. Configuring WordPress
	if (job.status === "configuring_wordpress") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'configuring_wordpress' WHERE id = ?`, [job.id]);
		const fullDocRoot = `${docRootBase}/${subdomain}`;
		
		await configurePermalinks(fullDocRoot, "/%postname%/", (log) => appendLog(job.id, log));
		await appendLog(job.id, "Configured permalinks");

		job.status = "deploying_content";
	}

	// 5. Deploying Content
	if (job.status === "deploying_content") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'deploying_content' WHERE id = ?`, [job.id]);
		await appendLog(job.id, "Deploying content blocks...");
		
		const fullDocRoot = `${docRootBase}/${subdomain}`;
		const schema = typeof job.website_schema === 'string' ? JSON.parse(job.website_schema) : job.website_schema;
		
		if (schema) {
			await injectWebsiteContent(fullDocRoot, schema, (log) => appendLog(job.id, log));
			await appendLog(job.id, "Content injected successfully");
		} else {
			await appendLog(job.id, "WARNING: No website schema found to inject.");
		}
		
		job.status = "completed";
	}

	// 7. Completed
	if (job.status === "completed") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'completed', locked_at = NULL WHERE id = ?`, [job.id]);
		
		// Insert into deployments - ALWAYS start with http
		const httpUrl = `http://${subdomain}.${rootDomain}`;
		await pool.query(`
			INSERT IGNORE INTO isolated_deployments (id, project_id, subdomain_url, wp_admin_url, admin_username, encrypted_admin_password, website_schema, ssl_status)
			VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
		`, [
			crypto.randomUUID(), 
			job.project_id, 
			httpUrl, 
			`${httpUrl}/wp-admin`, 
			wpAdminUser, 
			wpAdminPass,
			typeof job.website_schema === 'string' ? job.website_schema : JSON.stringify(job.website_schema)
		]);
		
		await appendLog(job.id, "Job completed successfully! URL set to HTTP (SSL polling started)");
	}
}

async function injectWebsiteContent(docRoot: string, schema: any, logCallback: (log: string) => void) {
	try {
		await logCallback("Cleaning up existing content...");
		try {
			await runWpCommand("post delete $(wp post list --post_type=post,page --format=ids) --force", docRoot, logCallback);
		} catch (e) {}
		
		const theme = schema.theme || {};
		const palette = theme.palette || {
			background: "#07070a",
			surface: "#111114",
			primary: "#7c3aed",
			text: "#f4f4f5",
			muted: "#a1a1aa"
		};

		await logCallback("Generating premium WordPress theme overrides...");
		
		// 1. Generate Global CSS to match the Preview
		const globalStyles = `
<style>
	:root {
		--wp--preset--color--vivid-purple: ${palette.primary};
		--wp--preset--color--black: ${palette.background};
		--wp--preset--color--white: ${palette.text};
	}
	body { 
		background-color: ${palette.background} !important; 
		color: ${palette.text} !important;
		font-family: 'Inter', sans-serif !important;
	}
	.wp-block-group, .wp-block-columns, .wp-block-column {
		color: ${palette.text} !important;
	}
	h1, h2, h3, h4 { color: ${palette.text} !important; font-weight: 700 !important; }
	.has-background { padding: 40px; border-radius: 24px; }
	.premium-card {
		background: rgba(255, 255, 255, 0.03) !important;
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.1) !important;
		border-radius: 28px !important;
	}
	.wp-block-button__link {
		background-color: ${palette.primary} !important;
		border-radius: 50px !important;
		padding: 12px 32px !important;
		font-weight: 600 !important;
		transition: transform 0.2s ease !important;
	}
	.wp-block-button__link:hover { transform: scale(1.05); }
</style>
`;

		let homeContent = `<!-- wp:html -->\n${globalStyles}\n<!-- /wp:html -->\n`;
		
		// 2. Hero Section (using Cover block for that immersive look)
		const hero = schema.sections?.find((s: any) => s.type === 'hero') || schema.sections?.[0];
		const heroImg = hero?.media?.src || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80";
		
		homeContent += `
<!-- wp:cover {"url":"${heroImg}","dimRatio":70,"overlayColor":"black","minHeight":600,"minHeightUnit":"px","align":"full","style":{"spacing":{"padding":{"top":"80px","bottom":"80px"}}}} -->
<div class="wp-block-cover alignfull" style="padding-top:80px;padding-bottom:80px;min-height:600px"><span aria-hidden="true" class="wp-block-cover__background has-black-background-color has-background-dim-70 has-background-dim"></span><img class="wp-block-cover__image-background" alt="" src="${heroImg}" data-object-fit="cover"/><div class="wp-block-cover__inner-container">
	<!-- wp:heading {"textAlign":"center","level":1,"style":{"typography":{"fontSize":"4.5rem","lineHeight":"1.1"}}} -->
	<h1 class="wp-block-heading has-text-align-center" style="font-size:4.5rem;line-height:1.1">${hero?.headline || schema.brand?.businessName}</h1>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"textAlign":"center","style":{"typography":{"fontSize":"1.4rem"}}} -->
	<p class="has-text-align-center" style="font-size:1.4rem">${hero?.subheadline || ""}</p>
	<!-- /wp:paragraph -->

	<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
	<div class="wp-block-buttons">
		<!-- wp:button {"style":{"border":{"radius":"40px"}}} -->
		<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" style="border-radius:40px">Get Started Today</a></div>
		<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->
</div></div>
<!-- /wp:cover -->`;

		// 3. Services / Features
		const services = schema.sections?.filter((s: any) => s.type === 'services' || s.type === 'features') || [];
		for (const section of services) {
			homeContent += `
<!-- wp:group {"align":"wide","style":{"spacing":{"margin":{"top":"100px","bottom":"100px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide" style="margin-top:100px;margin-bottom:100px">
	<!-- wp:heading {"textAlign":"center","style":{"typography":{"fontSize":"3rem"}}} -->
	<h2 class="wp-block-heading has-text-align-center" style="font-size:3rem">${section.headline || section.title || "Our Services"}</h2>
	<!-- /wp:heading -->
	
	<!-- wp:columns {"style":{"spacing":{"blockGap":{"top":"24px","left":"24px"}}}} -->
	<div class="wp-block-columns">
		${(section.items || []).map((item: any) => `
		<!-- wp:column {"className":"premium-card","style":{"spacing":{"padding":{"top":"32px","bottom":"32px","left":"32px","right":"32px"}}}} -->
		<div class="wp-block-column premium-card" style="padding-top:32px;padding-right:32px;padding-bottom:32px;padding-left:32px">
			<!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"1.5rem"}}} -->
			<h3 class="wp-block-heading" style="font-size:1.5rem">${item.title || item.name}</h3>
			<!-- /wp:heading -->
			<!-- wp:paragraph {"style":{"typography":{"lineHeight":"1.6"}},"textColor":"muted"} -->
			<p class="has-muted-color has-text-color" style="line-height:1.6">${item.description || item.body || ""}</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->`).join('\n')}
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->`;
		}

		await logCallback("Creating Home page in WordPress...");
		const homePageIdOut = await runWpCommand(`post create --post_type=page --post_title="Home" --post_content='${homeContent.replace(/'/g, "'\\''")}' --post_status=publish --format=ids`, docRoot, logCallback);
		const homePageId = homePageIdOut.stdout.replace(/[^0-9]/g, "").trim();
		
		if (!homePageId) throw new Error("ID extraction failed");

		await logCallback("Applying site options and front-page settings...");
		await runWpCommand(`option update show_on_front page`, docRoot, logCallback);
		await runWpCommand(`option update page_on_front ${homePageId}`, docRoot, logCallback);
		
		if (schema.brand?.businessName) {
			await runWpCommand(`option update blogname "${schema.brand.businessName.replace(/"/g, '\\"')}"`, docRoot, logCallback);
		}
		
		// 5. Cleanup
		await runWpCommand(`rewrite structure "/%postname%/"`, docRoot, logCallback);
		await runWpCommand(`rewrite flush`, docRoot, logCallback);

		await logCallback("WordPress design sync complete.");

	} catch (error: any) {
		await logCallback(`CRITICAL ERROR during design sync: ${error.message}`);
	}
}

async function rollbackJob(job: any) {
	await appendLog(job.id, "[ROLLBACK] Starting cleanup...");
	
	if (job.subdomain) {
		try {
			const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscout.online";
			await deleteSubdomain(job.subdomain, rootDomain);
			await appendLog(job.id, `[ROLLBACK] Deleted subdomain ${job.subdomain}`);
		} catch (e: any) {
			await appendLog(job.id, `[ROLLBACK] Failed to delete subdomain: ${e.message}`);
		}
	}

	if (job.db_name) {
		try {
			await deleteDatabase(job.db_name);
			await appendLog(job.id, `[ROLLBACK] Deleted database ${job.db_name}`);
		} catch (e: any) {
			await appendLog(job.id, `[ROLLBACK] Failed to delete database: ${e.message}`);
		}
	}

	if (job.db_user) {
		try {
			await deleteDatabaseUser(job.db_user);
			await appendLog(job.id, `[ROLLBACK] Deleted database user ${job.db_user}`);
		} catch (e: any) {
			await appendLog(job.id, `[ROLLBACK] Failed to delete database user: ${e.message}`);
		}
	}
	
	await appendLog(job.id, "[ROLLBACK] Cleanup finished.");
}
