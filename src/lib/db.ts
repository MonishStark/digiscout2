import "./env";
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
	host: process.env.DB_HOST || "127.0.0.1",
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "digitalscout",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

console.error(`[DB] Pool initialized. User: ${process.env.DB_USER || "root (default)"}, Host: ${process.env.DB_HOST || "127.0.0.1"}`);

export async function initializeDatabase() {
	try {
		// Create provisioning_jobs table
		await pool.query(`
			CREATE TABLE IF NOT EXISTS provisioning_jobs (
				id VARCHAR(255) PRIMARY KEY,
				project_id VARCHAR(255) NOT NULL,
				business_name VARCHAR(255) NULL,
				website_schema JSON NULL,
				status ENUM('pending', 'creating_subdomain', 'creating_database', 'installing_wordpress', 'configuring_wordpress', 'deploying_content', 'validating', 'completed', 'failed') DEFAULT 'pending',
				subdomain VARCHAR(255) NULL,
				db_name VARCHAR(255) NULL,
				db_user VARCHAR(255) NULL,
				db_pass_encrypted TEXT NULL,
				wp_admin_user VARCHAR(255) NULL,
				wp_admin_pass_encrypted TEXT NULL,
				retry_count INT DEFAULT 0,
				locked_at DATETIME NULL,
				logs JSON NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				trace_id VARCHAR(255) NULL,
				is_preview BOOLEAN DEFAULT FALSE,
				preview_expires_at DATETIME NULL,
				generation_metrics JSON NULL,
				gutenberg_trace LONGTEXT NULL,
				raw_ai_trace JSON NULL,
				INDEX idx_status (status),
				INDEX idx_project (project_id),
				INDEX idx_trace (trace_id),
				INDEX idx_preview_expiry (preview_expires_at)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);

		// Create generation_audit_logs table
		await pool.query(`
			CREATE TABLE IF NOT EXISTS generation_audit_logs (
				id INT AUTO_INCREMENT PRIMARY KEY,
				trace_id VARCHAR(255) NOT NULL,
				step VARCHAR(100) NOT NULL,
				message TEXT NOT NULL,
				data JSON NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				INDEX idx_trace (trace_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);

		// Migrations
		try {
			await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN website_schema JSON NULL AFTER business_name`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN db_pass_encrypted TEXT NULL AFTER db_user`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN business_name VARCHAR(255) NULL AFTER project_id`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN trace_id VARCHAR(255) NULL AFTER updated_at`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN is_preview BOOLEAN DEFAULT FALSE AFTER trace_id`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN preview_expires_at DATETIME NULL AFTER is_preview`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN generation_metrics JSON NULL AFTER preview_expires_at`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN gutenberg_trace LONGTEXT NULL AFTER generation_metrics`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN raw_ai_trace JSON NULL AFTER gutenberg_trace`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE provisioning_jobs ADD INDEX idx_trace (trace_id)`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE provisioning_jobs ADD INDEX idx_preview_expiry (preview_expires_at)`);
		} catch (e) {}

		// Create isolated_deployments table
		await pool.query(`
			CREATE TABLE IF NOT EXISTS isolated_deployments (
				id VARCHAR(255) PRIMARY KEY,
				project_id VARCHAR(255) NOT NULL,
				subdomain_url VARCHAR(255) NOT NULL,
				wp_admin_url VARCHAR(255) NOT NULL,
				admin_username VARCHAR(255) NOT NULL,
				encrypted_admin_password TEXT NOT NULL,
				website_schema JSON NULL,
				ssl_status ENUM('pending', 'valid') DEFAULT 'pending',
				last_ssl_check DATETIME NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				UNIQUE KEY uk_project (project_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);

		try {
			await pool.query(`ALTER TABLE isolated_deployments ADD COLUMN website_schema JSON NULL AFTER encrypted_admin_password`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE isolated_deployments ADD COLUMN ssl_status ENUM('pending', 'valid') DEFAULT 'pending' AFTER website_schema`);
		} catch (e) {}
		try {
			await pool.query(`ALTER TABLE isolated_deployments ADD COLUMN last_ssl_check DATETIME NULL AFTER ssl_status`);
		} catch (e) {}

		console.log("[DB] Provisioning schema initialized successfully.");
	} catch (error) {
		console.error("[DB] Failed to initialize schema:", error);
		// Don't throw to prevent crashing if user hasn't setup DB yet. 
		// Worker will just fail cleanly when it tries to query.
	}
}
