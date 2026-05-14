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
	configurePermalinks,
} from "./wp-cli";

const MAX_RETRIES = 3;

function sanitizeSubdomain(name: string) {
	return name.toLowerCase().replace(/[^a-z0-9-]/g, "").substring(0, 30);
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
			subdomain = sanitizeSubdomain(`site-${job.project_id}`);
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
		
		// We securely store the DB password in memory only for the installation phase
		(job as any)._tempDbPass = dbPassword;
		await appendLog(job.id, `Created database: ${dbName} and user: ${dbUser}`);

		job.status = "installing_wordpress";
	}

	// 3. Installing WordPress
	if (job.status === "installing_wordpress") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'installing_wordpress' WHERE id = ?`, [job.id]);
		await appendLog(job.id, "Starting WordPress installation");

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

		const dbPassword = (job as any)._tempDbPass;
		if (!dbPassword) {
			throw new Error("Temporary DB password lost across retries. Manual intervention or rollback required.");
		}

		await createWpConfig(fullDocRoot, dbName, dbUser, dbPassword, "localhost", (log) => appendLog(job.id, log));
		
		const rawAdminPass = (job as any)._tempAdminPass;
		const fullUrl = `https://${subdomain}.${rootDomain}`;
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
		// Content injection logic goes here (via WP REST API or WP-CLI)
		job.status = "completed";
	}

	// 7. Completed
	if (job.status === "completed") {
		await pool.query(`UPDATE provisioning_jobs SET status = 'completed', locked_at = NULL WHERE id = ?`, [job.id]);
		
		// Insert into deployments
		await pool.query(`
			INSERT IGNORE INTO isolated_deployments (id, project_id, subdomain_url, wp_admin_url, admin_username, encrypted_admin_password)
			VALUES (?, ?, ?, ?, ?, ?)
		`, [
			crypto.randomUUID(), 
			job.project_id, 
			`https://${subdomain}.${rootDomain}`, 
			`https://${subdomain}.${rootDomain}/wp-admin`, 
			wpAdminUser, 
			wpAdminPass
		]);
		
		await appendLog(job.id, "Job completed successfully!");
	}
}

async function rollbackJob(job: any) {
	await appendLog(job.id, "[ROLLBACK] Starting cleanup...");
	
	if (job.subdomain) {
		try {
			await deleteSubdomain(job.subdomain);
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
