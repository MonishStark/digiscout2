// src/lib/env.ts
import dotenv from "dotenv";
import path from "path";
var rootDir = process.cwd();
var envFiles = [".env.production", ".env.local", ".env"];
for (const file of envFiles) {
  dotenv.config({ path: path.join(rootDir, file) });
}
var env_default = process.env;

// server.ts
import crypto2 from "crypto";
import cors from "cors";
import express from "express";
import fs3 from "fs";
import path2 from "path";
import { GoogleGenAI } from "@google/genai";

// src/lib/wordpress-provisioning.ts
function getMultisiteConfig() {
  return {
    baseUrl: process.env.WORDPRESS_MULTISITE_BASE_URL || process.env.WP_MULTISITE_BASE_URL || "",
    username: process.env.WORDPRESS_MULTISITE_NETWORK_USERNAME || process.env.WP_MULTISITE_NETWORK_USERNAME || "",
    applicationPassword: process.env.WORDPRESS_MULTISITE_NETWORK_APP_PASSWORD || process.env.WP_MULTISITE_NETWORK_APP_PASSWORD || ""
  };
}
async function deleteProvisionedWordPressMultisiteSite(siteId) {
  const config = getMultisiteConfig();
  if (!config.baseUrl || !config.username || !config.applicationPassword) {
    return { success: true, siteId };
  }
  const endpoint = `${config.baseUrl.replace(/\/$/, "")}/wp-json/digital-scout/v1/site/${siteId}`;
  const authToken = Buffer.from(
    `${config.username}:${config.applicationPassword}`
  ).toString("base64");
  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${authToken}`
    }
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to delete WordPress Multisite site ${siteId}: ${response.status} ${response.statusText} ${text}`
    );
  }
  return { success: true, siteId };
}

// src/lib/callhippo-service.ts
async function sendOutreachViaCallHippo(request, apiKey) {
  const { businessName, phoneNumber, message, preferredChannel } = request;
  const TEST_MOCK = process.env.CALLHIPPO_TEST_MOCK === "true";
  const TEST_TARGET = process.env.CALLHIPPO_TEST_TARGET;
  const FORCE_SUCCESS = process.env.CALLHIPPO_FORCE_SUCCESS === "true";
  if (TEST_MOCK) {
    const target = TEST_TARGET || phoneNumber;
    console.log(
      `[CallHippo][MOCK] Pretending to send ${preferredChannel} to ${target} for ${businessName}`
    );
    return {
      success: true,
      channel: preferredChannel,
      messageId: `mock-${Date.now()}`,
      status: "mocked"
    };
  }
  console.log(
    `[CallHippo] Outreach request for ${businessName} (${phoneNumber}) via ${preferredChannel}`
  );
  if (preferredChannel === "whatsapp") {
    try {
      const result = await sendWhatsAppMessage(phoneNumber, message, apiKey);
      if (result.success) {
        console.log(`[CallHippo] WhatsApp sent successfully to ${phoneNumber}`);
        return result;
      }
    } catch (whatsappError) {
      console.warn(
        `[CallHippo] WhatsApp failed for ${phoneNumber}, falling back to SMS:`,
        whatsappError instanceof Error ? whatsappError.message : whatsappError
      );
    }
  }
  try {
    const result = await sendSmsMessage(phoneNumber, message, apiKey);
    if (result.success) {
      console.log(`[CallHippo] SMS sent successfully to ${phoneNumber}`);
      return result;
    }
    if (FORCE_SUCCESS) {
      console.warn(
        `[CallHippo][FORCE_SUCCESS] Returning demo success for ${phoneNumber}`
      );
      return {
        success: true,
        channel: preferredChannel,
        messageId: `forced-${Date.now()}`,
        status: "forced-success"
      };
    }
    return result;
  } catch (smsError) {
    const errorMsg = smsError instanceof Error ? smsError.message : String(smsError);
    console.error(`[CallHippo] SMS also failed for ${phoneNumber}:`, errorMsg);
    if (FORCE_SUCCESS) {
      console.warn(
        `[CallHippo][FORCE_SUCCESS] API failed, returning demo success for ${phoneNumber}`
      );
      return {
        success: true,
        channel: preferredChannel,
        messageId: `forced-${Date.now()}`,
        status: "forced-success"
      };
    }
    return {
      success: false,
      channel: "sms",
      error: `SMS delivery failed: ${errorMsg}`
    };
  }
}
async function sendWhatsAppMessage(phoneNumber, message, apiKey) {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const url = "https://api.callhippo.com/v1/whatsapp/send";
  const payload = {
    to: formattedPhone,
    message
  };
  console.log(`[CallHippo] Attempting WhatsApp to ${formattedPhone}`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `[CallHippo] WhatsApp API returned ${response.status}:`,
        errorText
      );
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`WhatsApp not available: ${response.statusText}`);
      }
      throw new Error(
        `WhatsApp API error: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    console.log(`[CallHippo] WhatsApp success response:`, data);
    return {
      success: true,
      channel: "whatsapp",
      messageId: data.id || data.messageId,
      status: data.status || "sent"
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[CallHippo] WhatsApp error:`, errorMsg);
    throw error;
  }
}
async function sendSmsMessage(phoneNumber, message, apiKey) {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const url = "https://api.callhippo.com/v1/sms/send";
  const payload = {
    to: formattedPhone,
    message
  };
  console.log(`[CallHippo] Attempting SMS to ${formattedPhone}`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `[CallHippo] SMS API returned ${response.status}:`,
        errorText
      );
      throw new Error(
        `SMS API error: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    console.log(`[CallHippo] SMS success response:`, data);
    return {
      success: true,
      channel: "sms",
      messageId: data.id || data.messageId,
      status: data.status || "sent"
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[CallHippo] SMS error:`, errorMsg);
    throw error;
  }
}
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  if (!cleaned.startsWith("+")) {
    return `+1${cleaned.replace(/^1/, "")}`;
  }
  return cleaned;
}

// src/lib/db.ts
import mysql from "mysql2/promise";
var pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "digitalscout",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
async function initializeDatabase() {
  try {
    await pool.query(`
			CREATE TABLE IF NOT EXISTS provisioning_jobs (
				id VARCHAR(255) PRIMARY KEY,
				project_id VARCHAR(255) NOT NULL,
				status ENUM('pending', 'creating_subdomain', 'creating_database', 'installing_wordpress', 'configuring_wordpress', 'deploying_content', 'validating', 'completed', 'failed') DEFAULT 'pending',
				subdomain VARCHAR(255) NULL,
				db_name VARCHAR(255) NULL,
				db_user VARCHAR(255) NULL,
				wp_admin_user VARCHAR(255) NULL,
				wp_admin_pass_encrypted TEXT NULL,
				retry_count INT DEFAULT 0,
				locked_at DATETIME NULL,
				logs JSON NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				INDEX idx_status (status),
				INDEX idx_project (project_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    await pool.query(`
			CREATE TABLE IF NOT EXISTS isolated_deployments (
				id VARCHAR(255) PRIMARY KEY,
				project_id VARCHAR(255) NOT NULL,
				subdomain_url VARCHAR(255) NOT NULL,
				wp_admin_url VARCHAR(255) NOT NULL,
				admin_username VARCHAR(255) NOT NULL,
				encrypted_admin_password TEXT NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				UNIQUE KEY uk_project (project_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    console.log("[DB] Provisioning schema initialized successfully.");
  } catch (error) {
    console.error("[DB] Failed to initialize schema:", error);
  }
}

// src/lib/provisioning-engine.ts
import crypto from "crypto";
import fs2 from "fs";

// src/lib/cpanel-uapi.ts
import fetch2 from "node-fetch";
function getCpanelConfig() {
  const host = process.env.CPANEL_HOST;
  const user = process.env.CPANEL_USERNAME;
  const token = process.env.CPANEL_API_TOKEN;
  if (!host || !user || !token) {
    throw new Error(
      "Missing cPanel configuration. Please check CPANEL_HOST, CPANEL_USERNAME, and CPANEL_API_TOKEN in your environment variables."
    );
  }
  return {
    baseUrl: `https://${host}:2083/execute`,
    authHeader: `cpanel ${user}:${token}`
  };
}
async function callUapi(module, func, params) {
  const { baseUrl, authHeader } = getCpanelConfig();
  const url = new URL(`${baseUrl}/${module}/${func}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  const response = await fetch2(url.toString(), {
    method: "GET",
    // UAPI generally accepts GET for execute unless strictly required
    headers: {
      Authorization: authHeader
    }
  });
  if (!response.ok) {
    throw new Error(`cPanel API HTTP Error: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`cPanel UAPI Error (${module}::${func}): ${json.errors.join(", ")}`);
  }
  if (json.status === 0) {
    throw new Error(`cPanel UAPI Error (${module}::${func}): ${json.errors?.join(", ") || "Unknown failure"}`);
  }
  return json.data;
}
async function addSubdomain(subdomain, rootDomain, documentRoot) {
  return callUapi("SubDomain", "addsubdomain", {
    domain: subdomain,
    rootdomain: rootDomain,
    dir: documentRoot
  });
}
async function deleteSubdomain(domain) {
  return callUapi("SubDomain", "delsubdomain", {
    domain
  });
}
async function createDatabase(dbName) {
  return callUapi("Mysql", "create_database", {
    name: dbName
  });
}
async function deleteDatabase(dbName) {
  return callUapi("Mysql", "delete_database", {
    name: dbName
  });
}
async function createDatabaseUser(dbUser, password) {
  return callUapi("Mysql", "create_user", {
    name: dbUser,
    password
  });
}
async function deleteDatabaseUser(dbUser) {
  return callUapi("Mysql", "delete_user", {
    name: dbUser
  });
}
async function setDatabasePrivileges(dbUser, dbName, privileges = "ALL PRIVILEGES") {
  return callUapi("Mysql", "set_privileges_on_database", {
    user: dbUser,
    database: dbName,
    privileges
  });
}

// src/lib/wp-cli.ts
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
var execAsync = promisify(exec);
var WpCliError = class extends Error {
  constructor(message, stdout, stderr, code) {
    super(message);
    this.name = "WpCliError";
    this.stdout = stdout;
    this.stderr = stderr;
    this.code = code;
  }
};
async function checkWpCliAvailable() {
  try {
    const { stdout: versionOut } = await execAsync("wp --version");
    const { stdout: pathOut } = await execAsync("which wp").catch(() => ({ stdout: "unknown" }));
    return {
      available: true,
      version: versionOut.trim(),
      path: pathOut.trim()
    };
  } catch (error) {
    return {
      available: false,
      error: error.message || "WP-CLI not found or executable"
    };
  }
}
async function runWpCommand(command, documentRoot, logCallback) {
  if (!fs.existsSync(documentRoot)) {
    throw new Error(`Document root does not exist: ${documentRoot}`);
  }
  const cmd = `wp ${command} --path=${documentRoot}`;
  if (logCallback) {
    logCallback(`[WP-CLI] Executing: ${cmd.replace(/--dbpass=[^\s]+/, "--dbpass=***")}`);
  }
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: documentRoot,
      // Add safe memory limits for shared hosting WP-CLI
      env: { ...process.env, WP_CLI_PHP_ARGS: "-d memory_limit=256M" }
    });
    if (logCallback && stdout.trim()) logCallback(`[WP-CLI] STDOUT: ${stdout.trim()}`);
    if (logCallback && stderr.trim()) logCallback(`[WP-CLI] STDERR: ${stderr.trim()}`);
    return { stdout, stderr };
  } catch (error) {
    const stdout = error.stdout || "";
    const stderr = error.stderr || "";
    if (logCallback) {
      logCallback(`[WP-CLI] FAILED: ${error.message}`);
      if (stdout) logCallback(`[WP-CLI] STDOUT: ${stdout}`);
      if (stderr) logCallback(`[WP-CLI] STDERR: ${stderr}`);
    }
    throw new WpCliError(
      `WP-CLI command failed: ${command}`,
      stdout,
      stderr,
      error.code
    );
  }
}
async function downloadWordPressCore(documentRoot, logCallback) {
  return runWpCommand("core download", documentRoot, logCallback);
}
async function createWpConfig(documentRoot, dbName, dbUser, dbPass, dbHost = "localhost", logCallback) {
  return runWpCommand(
    `config create --dbname="${dbName}" --dbuser="${dbUser}" --dbpass="${dbPass}" --dbhost="${dbHost}" --extra-php="define('WP_DEBUG', false); define('WP_DEBUG_LOG', false);"`,
    documentRoot,
    logCallback
  );
}
async function installWordPress(documentRoot, url, title, adminUser, adminPassword, adminEmail, logCallback) {
  return runWpCommand(
    `core install --url="${url}" --title="${title}" --admin_user="${adminUser}" --admin_password="${adminPassword}" --admin_email="${adminEmail}" --skip-email`,
    documentRoot,
    logCallback
  );
}
async function configurePermalinks(documentRoot, structure = "/%postname%/", logCallback) {
  return runWpCommand(`rewrite structure "${structure}"`, documentRoot, logCallback);
}

// src/lib/provisioning-engine.ts
var MAX_RETRIES = 3;
function sanitizeSubdomain(name) {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, "").substring(0, 30);
}
function generateSecurePassword() {
  return crypto.randomBytes(16).toString("hex") + "!aA1";
}
function encrypt(text) {
  const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}
async function appendLog(jobId, message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(`[Job ${jobId}] ${message}`);
  await pool.query(
    `UPDATE provisioning_jobs SET logs = JSON_ARRAY_APPEND(COALESCE(logs, JSON_ARRAY()), '$', ?) WHERE id = ?`,
    [logEntry, jobId]
  );
}
async function processJob(jobId) {
  const [rows] = await pool.query(`SELECT * FROM provisioning_jobs WHERE id = ?`, [jobId]);
  if (!rows || rows.length === 0) return;
  const job = rows[0];
  if (job.status === "completed" || job.status === "failed") return;
  try {
    await executeStateMachine(job);
  } catch (error) {
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
async function executeStateMachine(job) {
  const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscout.online";
  const docRootBase = process.env.WP_DOCROOT_BASE || "/home/username/public_html/sites";
  let subdomain = job.subdomain;
  let dbName = job.db_name;
  let dbUser = job.db_user;
  let wpAdminUser = job.wp_admin_user || "admin";
  let wpAdminPass = job.wp_admin_pass_encrypted;
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
    job._tempDbPass = dbPassword;
    await appendLog(job.id, `Created database: ${dbName} and user: ${dbUser}`);
    job.status = "installing_wordpress";
  }
  if (job.status === "installing_wordpress") {
    await pool.query(`UPDATE provisioning_jobs SET status = 'installing_wordpress' WHERE id = ?`, [job.id]);
    await appendLog(job.id, "Starting WordPress installation");
    const wpCliStatus = await checkWpCliAvailable();
    if (!wpCliStatus.available) {
      throw new Error("WP-CLI is missing on the host. Cannot proceed.");
    }
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    if (!fs2.existsSync(fullDocRoot)) {
      fs2.mkdirSync(fullDocRoot, { recursive: true });
    }
    await downloadWordPressCore(fullDocRoot, (log) => appendLog(job.id, log));
    if (!wpAdminPass) {
      const rawPass = generateSecurePassword();
      wpAdminPass = encrypt(rawPass);
      job._tempAdminPass = rawPass;
      await pool.query(`UPDATE provisioning_jobs SET wp_admin_user = ?, wp_admin_pass_encrypted = ? WHERE id = ?`, [wpAdminUser, wpAdminPass, job.id]);
    }
    const dbPassword = job._tempDbPass;
    if (!dbPassword) {
      throw new Error("Temporary DB password lost across retries. Manual intervention or rollback required.");
    }
    await createWpConfig(fullDocRoot, dbName, dbUser, dbPassword, "localhost", (log) => appendLog(job.id, log));
    const rawAdminPass = job._tempAdminPass;
    const fullUrl = `https://${subdomain}.${rootDomain}`;
    await installWordPress(fullDocRoot, fullUrl, `Generated Site ${job.project_id}`, wpAdminUser, rawAdminPass, "admin@digitalscout.online", (log) => appendLog(job.id, log));
    await appendLog(job.id, "WordPress installed successfully");
    job.status = "configuring_wordpress";
  }
  if (job.status === "configuring_wordpress") {
    await pool.query(`UPDATE provisioning_jobs SET status = 'configuring_wordpress' WHERE id = ?`, [job.id]);
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    await configurePermalinks(fullDocRoot, "/%postname%/", (log) => appendLog(job.id, log));
    await appendLog(job.id, "Configured permalinks");
    job.status = "deploying_content";
  }
  if (job.status === "deploying_content") {
    await pool.query(`UPDATE provisioning_jobs SET status = 'deploying_content' WHERE id = ?`, [job.id]);
    await appendLog(job.id, "Deploying content blocks...");
    job.status = "validating";
  }
  if (job.status === "validating") {
    await pool.query(`UPDATE provisioning_jobs SET status = 'validating' WHERE id = ?`, [job.id]);
    await appendLog(job.id, "Validating deployment...");
    const fullUrl = `https://${subdomain}.${rootDomain}`;
    try {
      await fetch(fullUrl);
    } catch (e) {
      await appendLog(job.id, `SSL/HTTP validation failed: ${e.message} (AutoSSL may still be provisioning)`);
    }
    job.status = "completed";
  }
  if (job.status === "completed") {
    await pool.query(`UPDATE provisioning_jobs SET status = 'completed', locked_at = NULL WHERE id = ?`, [job.id]);
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
async function rollbackJob(job) {
  await appendLog(job.id, "[ROLLBACK] Starting cleanup...");
  if (job.subdomain) {
    try {
      await deleteSubdomain(job.subdomain);
      await appendLog(job.id, `[ROLLBACK] Deleted subdomain ${job.subdomain}`);
    } catch (e) {
      await appendLog(job.id, `[ROLLBACK] Failed to delete subdomain: ${e.message}`);
    }
  }
  if (job.db_name) {
    try {
      await deleteDatabase(job.db_name);
      await appendLog(job.id, `[ROLLBACK] Deleted database ${job.db_name}`);
    } catch (e) {
      await appendLog(job.id, `[ROLLBACK] Failed to delete database: ${e.message}`);
    }
  }
  if (job.db_user) {
    try {
      await deleteDatabaseUser(job.db_user);
      await appendLog(job.id, `[ROLLBACK] Deleted database user ${job.db_user}`);
    } catch (e) {
      await appendLog(job.id, `[ROLLBACK] Failed to delete database user: ${e.message}`);
    }
  }
  await appendLog(job.id, "[ROLLBACK] Cleanup finished.");
}

// src/lib/provisioning-worker.ts
var POLL_INTERVAL_MS = 5e3;
var isWorkerRunning = false;
async function startProvisioningWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  console.log("[Worker] Provisioning worker started.");
  setInterval(async () => {
    try {
      await pollQueue();
    } catch (error) {
      console.error("[Worker] Error in poll loop:", error);
    }
  }, POLL_INTERVAL_MS);
}
async function pollQueue() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(`
			SELECT id FROM provisioning_jobs 
			WHERE status NOT IN ('completed', 'failed') 
			  AND (locked_at IS NULL OR locked_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE))
			ORDER BY created_at ASC 
			LIMIT 1
			FOR UPDATE SKIP LOCKED
		`);
    if (!rows || rows.length === 0) {
      await connection.commit();
      return;
    }
    const jobId = rows[0].id;
    await connection.query(`UPDATE provisioning_jobs SET locked_at = NOW() WHERE id = ?`, [jobId]);
    await connection.commit();
    console.log(`[Worker] Picked up job ${jobId}`);
    await processJob(jobId);
  } catch (error) {
    await connection.rollback();
    console.error("[Worker] Transaction error:", error);
  } finally {
    connection.release();
  }
}

// server.ts
var app = express();
var PORT = process.env.PORT || 5001;
app.use(
  cors({
    exposedHeaders: ["x-debug-generation-id", "x-debug-generation-fallback"]
  })
);
app.use(express.json({ limit: "50mb" }));
app.get("/", (req, res) => {
  res.send("DigitalScout API Running");
});
var DEBUG_ROOT_DIR = path2.join(process.cwd(), ".debug-generation");
var generationDebugSessions = /* @__PURE__ */ new Map();
function slugifyDebugSegment(value) {
  return (value || "generation").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function createGenerationTraceId(business) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/:/g, "-");
  const businessSlug = slugifyDebugSegment(
    business?.name || business?.businessName || business?.id || "site"
  );
  return `${timestamp}-${businessSlug}`;
}
function createGenerationDebugSession(business) {
  const traceId = createGenerationTraceId(business);
  let folderName = traceId;
  let folderPath = path2.join(DEBUG_ROOT_DIR, folderName);
  let suffix = 2;
  while (fs3.existsSync(folderPath)) {
    folderName = `${traceId}-${suffix}`;
    folderPath = path2.join(DEBUG_ROOT_DIR, folderName);
    suffix += 1;
  }
  fs3.mkdirSync(folderPath, { recursive: true });
  const session = {
    traceId,
    folderName,
    folderPath,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    businessName: business?.name || "Unknown Business",
    businessCategory: business?.category || "Unknown Category",
    parseRepairs: [],
    malformedSections: [],
    warnings: [],
    errors: [],
    rendererWarnings: [],
    sectionTypes: []
  };
  generationDebugSessions.set(traceId, session);
  return session;
}
function getGenerationDebugSession(traceId) {
  return generationDebugSessions.get(traceId);
}
function formatDebugPayload(content) {
  if (typeof content === "string") return content;
  return JSON.stringify(content, null, 2);
}
function persistGenerationDebugFile(session, fileName, content, append = false) {
  fs3.mkdirSync(session.folderPath, { recursive: true });
  const targetPath = path2.join(session.folderPath, fileName);
  const payload = formatDebugPayload(content);
  if (append && fs3.existsSync(targetPath)) {
    fs3.appendFileSync(targetPath, `${payload}
`, "utf8");
    return;
  }
  fs3.writeFileSync(targetPath, payload, "utf8");
}
function appendGenerationDebugError(session, message) {
  const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`;
  session.errors.push(line);
  persistGenerationDebugFile(session, "10-errors.log", `${line}
`, true);
}
function buildBusinessDebugInput(business) {
  return {
    business,
    context: {
      name: business?.name || null,
      category: business?.category || null,
      address: business?.address || null,
      reviews: business?.reviews || [],
      photos: business?.photos || [],
      imageSuggestions: business?.imageSuggestions || [],
      qualificationNotes: business?.qualificationNotes || business?.notes || null,
      enrichment: {
        websiteUri: business?.websiteUri || null,
        email: business?.email || null,
        phoneNumber: business?.phoneNumber || null,
        specialties: business?.specialties || [],
        tone: business?.tone || null,
        neighborhood: business?.neighborhood || business?.vibe || null
      },
      mapsSearch: {
        location: business?.location || null,
        rating: business?.rating || null,
        reviewCount: business?.reviewCount || null,
        businessStatus: business?.businessStatus || null
      }
    }
  };
}
var GENAI_KEY = process.env.GEMINI_API_KEY || process.env.GENAI_API_KEY;
var genai = GENAI_KEY ? new GoogleGenAI({ apiKey: GENAI_KEY }) : null;
var NETLIFY_TOKEN = process.env.VITE_NETLIFY_TOKEN || process.env.NETLIFY_TOKEN;
var CALLHIPPO_API_KEY = process.env.CALLHIPPO_API_KEY;
var WEBSITE_GENERATION_MODE = process.env.WEBSITE_GENERATION_MODE || "gemini";
function extractEmails(html) {
  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  return Array.from(new Set(html.match(emailPattern) || [])).slice(0, 3);
}
function extractPhones(html) {
  const phonePattern = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;
  return Array.from(new Set(html.match(phonePattern) || [])).slice(0, 3);
}
function extractImages(html) {
  const imagePattern = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  const matches = [];
  let match;
  while ((match = imagePattern.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return Array.from(new Set(matches)).slice(0, 3);
}
function extractJsonObject(text) {
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
function parseLeadQualificationOutput(rawText) {
  const candidateJson = extractJsonObject(rawText);
  if (!candidateJson) return null;
  try {
    const parsed = JSON.parse(candidateJson);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return {
      hasWebsite: Boolean(parsed.hasWebsite),
      websiteUri: typeof parsed.websiteUri === "string" ? parsed.websiteUri : void 0,
      email: typeof parsed.email === "string" ? parsed.email : void 0,
      phoneNumber: typeof parsed.phoneNumber === "string" ? parsed.phoneNumber : void 0,
      confidence: parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low" ? parsed.confidence : void 0,
      notes: typeof parsed.notes === "string" ? parsed.notes : void 0
    };
  } catch {
    return null;
  }
}
async function runWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
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
    }
  );
  await Promise.all(workers);
  return results;
}
async function qualifyLeadCandidate(business, city) {
  if (business.websiteUri) {
    return {
      hasWebsite: true,
      websiteUri: business.websiteUri,
      email: business.email,
      phoneNumber: business.phoneNumber,
      confidence: "high",
      notes: "Google Places returned an official website URL."
    };
  }
  if (!genai) {
    return {
      hasWebsite: false,
      email: business.email,
      phoneNumber: business.phoneNumber,
      confidence: "low",
      notes: "Gemini API key is not configured."
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
      toolConfig: business.location ? {
        retrievalConfig: {
          latLng: {
            latitude: business.location.lat,
            longitude: business.location.lng
          }
        }
      } : void 0
    },
    {
      tools: [{ googleSearch: {} }],
      toolConfig: void 0
    }
  ];
  let lastError = null;
  for (const configVariant of configsToTry) {
    try {
      const response = await genai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          temperature: 0.1,
          tools: configVariant.tools,
          toolConfig: configVariant.toolConfig
        }
      });
      const parsed = parseLeadQualificationOutput((response.text || "").trim());
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
    notes: lastError instanceof Error ? lastError.message : "Lead qualification failed."
  };
}
function parseWebsiteSchemaOutput(rawText, business, debugSession) {
  const candidateJson = extractJsonObject(rawText);
  if (!candidateJson) {
    if (debugSession) {
      persistGenerationDebugFile(debugSession, "04-extracted-json.json", {
        error: "No JSON object could be extracted from Gemini output.",
        rawPreview: (rawText || "").slice(0, 4e3)
      });
      appendGenerationDebugError(
        debugSession,
        "parser_failure: no JSON object could be extracted"
      );
    }
    return null;
  }
  try {
    let normalizeSectionShape = function(rawSections) {
      if (!Array.isArray(rawSections)) {
        return {
          sections: null,
          reports: [],
          warnings: []
        };
      }
      const reports = [];
      const warnings = [];
      const sections = [];
      for (const [index, rawSection] of rawSections.entries()) {
        const original = JSON.parse(JSON.stringify(rawSection || {}));
        const repaired = [];
        const droppedFields = [];
        const section = { ...rawSection || {} };
        const originalType = original.type || original.kind || null;
        if (!section.type && section.kind) {
          section.type = section.kind;
          repaired.push("kind->type");
        }
        if (section.content && typeof section.content === "object") {
          for (const [key, value] of Object.entries(section.content)) {
            if (section[key] === void 0) {
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
            section.headline = section.headline || section.title || section.label || business.name || "Welcome";
            section.subheadline = section.subheadline || section.subtitle || section.description || "";
            if (!section.ctaPrimary && Array.isArray(section.buttons) && section.buttons.length > 0) {
              section.ctaPrimary = section.buttons[0];
              repaired.push("buttons[0]->ctaPrimary");
            }
            break;
          }
          case "features":
            section.type = "features";
            section.items = section.items || section.features || section.featureItems || [];
            break;
          case "gallery":
            section.type = "gallery";
            if (!section.items && (section.images || section.photos)) {
              repaired.push("images/photos->items");
            }
            section.items = section.items || section.images || section.photos || [];
            section.items = Array.isArray(section.items) ? section.items.map((item) => {
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
            }) : [];
            if (!section.items.length) {
              warnings.push(
                `gallery section ${index} normalized to empty items`
              );
            }
            break;
          case "testimonials":
            section.type = "testimonials";
            if (!section.items && section.testimonials) {
              repaired.push("testimonials->items");
            }
            section.items = section.items || section.testimonials || section.reviews || [];
            break;
          case "faq":
            section.type = "faq";
            if (!section.items && (section.faqs || section.questions)) {
              repaired.push("faqs/questions->items");
            }
            section.items = section.items || section.faqs || section.questions || [];
            break;
          case "cta":
            section.type = "cta";
            section.title = section.title || section.headline || section.heading || "Ready to get started?";
            section.body = section.body || section.description || "";
            section.buttonLabel = section.buttonLabel || section.cta || section.button?.label || "Contact Us";
            section.buttonHref = section.buttonHref || section.cta?.href || section.button?.href || "#contact";
            break;
          case "contact":
            section.type = "contact";
            section.showEmail = section.showEmail !== false;
            section.showPhone = section.showPhone !== false;
            break;
          default:
            section.type = section.type || section.kind || "unknown";
            section.title = section.title || section.heading || section.label || (section.type === "unknown" ? "Section" : section.type);
            break;
        }
        if (!section.id) {
          section.id = `${section.type || "section"}-${index + 1}`;
          repaired.push("generated-id");
        }
        const report = {
          index,
          originalType: originalType ? String(originalType) : null,
          finalType: section.type || "unknown",
          repaired,
          droppedFields,
          sectionId: section.id
        };
        if (debugSession && (repaired.length > 0 || droppedFields.length > 0)) {
          debugSession.warnings.push(
            `section[${index}] ${report.originalType || "unknown"} -> ${report.finalType} (${repaired.join(", ") || "no repairs"})`
          );
          appendGenerationDebugError(
            debugSession,
            `normalization_repair: ${JSON.stringify(report)}`
          );
        }
        if (Array.isArray(section.items) && section.items.length === 0) {
          warnings.push(
            `section[${index}] ${section.type} has no items after normalization`
          );
        }
        reports.push(report);
        sections.push(section);
      }
      return { sections, reports, warnings };
    };
    const parsed = JSON.parse(candidateJson);
    if (!parsed || typeof parsed !== "object") {
      if (debugSession) {
        persistGenerationDebugFile(debugSession, "04-extracted-json.json", {
          error: "Parsed JSON was not an object.",
          extractedJson: candidateJson
        });
        appendGenerationDebugError(
          debugSession,
          "parser_failure: parsed JSON was not an object"
        );
      }
      return null;
    }
    const root = typeof parsed.schema === "object" && parsed.schema ? parsed.schema : parsed;
    const nestedSections = Array.isArray(root.sections) && root.sections || Array.isArray(parsed?.website?.sections) && parsed.website.sections || Array.isArray(parsed?.site?.sections) && parsed.site.sections || null;
    const fallback = createFallbackWebsiteSchema(business);
    const normalizationResult = nestedSections && nestedSections.length > 0 ? normalizeSectionShape(nestedSections) : {
      sections: null,
      reports: [],
      warnings: []
    };
    const merged = {
      meta: {
        ...fallback.meta,
        ...root.meta || {}
      },
      theme: {
        ...fallback.theme,
        ...root.theme || {},
        palette: {
          ...fallback.theme.palette,
          ...root.theme?.palette || {}
        },
        typography: {
          ...fallback.theme.typography,
          ...root.theme?.typography || {}
        }
      },
      brand: {
        ...fallback.brand,
        ...root.brand || {}
      },
      seo: {
        ...fallback.seo,
        ...root.seo || {},
        keywords: Array.isArray(root.seo?.keywords) && root.seo?.keywords.length > 0 ? root.seo.keywords : fallback.seo.keywords
      },
      sections: normalizationResult.sections && normalizationResult.sections.length > 0 ? normalizationResult.sections : fallback.sections
    };
    merged.theme = sanitizeThemeEnums(merged.theme);
    merged.theme = enforceLightTheme(merged.theme);
    if (debugSession) {
      debugSession.parseRepairs = normalizationResult.reports;
      debugSession.malformedSections = normalizationResult.reports.filter(
        (report) => report.repaired.length > 0 || report.droppedFields.length > 0
      );
      debugSession.sectionTypes = merged.sections.map(
        (section) => section.type
      );
      debugSession.warnings.push(...normalizationResult.warnings);
      persistGenerationDebugFile(
        debugSession,
        "04-extracted-json.json",
        parsed
      );
    }
    return merged;
  } catch (error) {
    if (debugSession) {
      appendGenerationDebugError(
        debugSession,
        `parser_failure: ${error instanceof Error ? error.message : String(error)}`
      );
      persistGenerationDebugFile(debugSession, "04-extracted-json.json", {
        error: error instanceof Error ? error.message : String(error),
        extractedJson: candidateJson
      });
    }
    return null;
  }
}
function hashSeed(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = hash * 31 + input.charCodeAt(i) | 0;
  }
  return Math.abs(hash);
}
function pickBySeed(items, seed) {
  if (!items.length) {
    throw new Error("pickBySeed requires at least one item");
  }
  return items[seed % items.length];
}
function buildUniqueHeroSubheadline(businessName, categoryLabel, seed) {
  const openings = [
    "delivers a sharper digital first impression for",
    "frames a premium online experience for",
    "positions your brand as the standout choice in",
    "brings editorial-grade storytelling to",
    "pairs visual depth with clear intent for",
    "transforms discovery clicks into confident enquiries for",
    "sets a modern, conversion-ready standard for"
  ];
  const closings = [
    "with bold hierarchy and clear booking paths",
    "through polished visuals and concise trust signals",
    "by balancing atmosphere, proof, and action",
    "with mobile-first pacing and high-intent CTAs",
    "using distinctive sections that avoid template sameness",
    "with premium composition and service-first messaging",
    "through a brand voice tailored to local demand"
  ];
  const opening = pickBySeed(openings, seed + 5);
  const closing = pickBySeed(closings, seed + 17);
  return `${businessName} ${opening} ${categoryLabel} ${closing}.`;
}
function buildSectionOrderPattern(category, seed) {
  const categoryNorm = (category || "").toLowerCase();
  const isFitness = categoryNorm.includes("gym") || categoryNorm.includes("fitness");
  const isDental = categoryNorm.includes("dental");
  const isRealEstate = categoryNorm.includes("real estate") || categoryNorm.includes("property");
  const isCafe = categoryNorm.includes("cafe") || categoryNorm.includes("restaurant");
  const isSalon = categoryNorm.includes("salon") || categoryNorm.includes("spa");
  let patterns = [];
  if (isFitness) {
    patterns = [
      ["features", "gallery", "testimonials", "faq", "cta"],
      ["gallery", "features", "testimonials", "cta", "faq"],
      ["testimonials", "features", "gallery", "cta", "faq"]
    ];
  } else if (isDental) {
    patterns = [
      ["features", "testimonials", "faq", "gallery", "cta"],
      ["testimonials", "features", "faq", "gallery", "cta"],
      ["features", "faq", "testimonials", "cta", "gallery"]
    ];
  } else if (isRealEstate) {
    patterns = [
      ["gallery", "features", "testimonials", "faq", "cta"],
      ["features", "gallery", "testimonials", "cta", "faq"],
      ["gallery", "testimonials", "features", "cta", "faq"]
    ];
  } else if (isCafe) {
    patterns = [
      ["features", "gallery", "testimonials", "cta", "faq"],
      ["gallery", "features", "testimonials", "faq", "cta"],
      ["testimonials", "gallery", "features", "faq", "cta"]
    ];
  } else if (isSalon) {
    patterns = [
      ["gallery", "features", "testimonials", "faq", "cta"],
      ["features", "gallery", "testimonials", "cta", "faq"],
      ["testimonials", "features", "gallery", "faq", "cta"]
    ];
  } else {
    patterns = [
      ["features", "gallery", "testimonials", "faq", "cta"],
      ["features", "testimonials", "gallery", "cta", "faq"],
      ["gallery", "features", "testimonials", "cta", "faq"],
      ["testimonials", "features", "faq", "gallery", "cta"]
    ];
  }
  return pickBySeed(patterns, seed + 41);
}
function ensureNonTemplateCopy(schema, business) {
  const seed = hashSeed(
    `${business.id || business.name || "lead"}-${business.category || "category"}`
  );
  const categoryLabel = business.category || schema.brand.category || "local business";
  const businessName = business.name || schema.brand.businessName || "This business";
  const genericPattern = /^a\s+premium\s+.+website\s+designed\s+to\s+convert\s+visitors\s+into\s+customers\.?$/i;
  const nextSections = (schema.sections || []).map((section) => {
    let layout = "default";
    switch (section.type) {
      case "hero":
        layout = "hero-immersive";
        break;
      case "features":
        layout = "feature-grid";
        break;
      case "gallery":
        layout = "gallery-masonry";
        break;
      case "testimonials":
        layout = "testimonial-carousel";
        break;
      case "cta":
        layout = "cta-split";
        break;
      case "faq":
        layout = "faq-accordion";
        break;
      case "contact":
        layout = "contact-form";
        break;
      default:
        layout = "default";
    }
    const modified = {
      ...section,
      layout
    };
    if (section.type === "hero") {
      modified.ctaPrimary = modified.ctaPrimary || {};
      modified.ctaPrimary.label = modified.ctaPrimary.label || "Learn More";
      modified.ctaPrimary.href = modified.ctaPrimary.href || "#contact";
      if (modified.ctaSecondary) {
        modified.ctaSecondary.href = modified.ctaSecondary.href || "#about";
      }
    }
    if (section.type === "cta") {
      modified.buttonHref = modified.buttonHref || "#contact";
      modified.buttonLabel = modified.buttonLabel || "Get Started";
    }
    if (section.type === "gallery" && modified.items) {
      modified.items = modified.items.map((item) => ({
        ...item,
        src: item.src || "https://via.placeholder.com/400x300?text=Gallery+Image",
        alt: item.alt || `${businessName} gallery image`
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
          seed
        )
      };
    }
    return modified;
  });
  return {
    ...schema,
    sections: nextSections
  };
}
function sanitizeThemeEnums(theme) {
  const sanitize = (value, allowed, fallback) => {
    return typeof value === "string" && allowed.includes(value) ? value : fallback;
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
        "split-screen"
      ],
      "editorial"
    ),
    buttonStyle: sanitize(
      theme.buttonStyle,
      ["pill", "sharp", "ghost"],
      "pill"
    ),
    surfaceStyle: sanitize(
      theme.surfaceStyle,
      ["glass", "solid", "outline"],
      "glass"
    ),
    mediaShape: sanitize(
      theme.mediaShape,
      ["rounded", "arched", "portrait", "square"],
      "rounded"
    ),
    density: sanitize(
      theme.density,
      ["airy", "balanced", "compact"],
      "balanced"
    ),
    accentMode: sanitize(
      theme.accentMode,
      ["neon", "earthy", "luxury", "fresh"],
      "neon"
    )
  };
}
function enforceLightTheme(theme) {
  const parseColor = (value) => {
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
        parseInt(shorthand[3] + shorthand[3], 16)
      ];
    }
    const full = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (full) {
      return [
        parseInt(full[1], 16),
        parseInt(full[2], 16),
        parseInt(full[3], 16)
      ];
    }
    return null;
  };
  const isDark = (color) => {
    const rgb = parseColor(color);
    if (!rgb) return false;
    const [r, g, b] = rgb.map((channel) => channel / 255);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 0.35;
  };
  const safeBackground = isDark(theme.palette.background) ? "#f8fafc" : theme.palette.background;
  const safeSurface = isDark(theme.palette.surface) ? "#ffffff" : theme.palette.surface;
  const safeText = isDark(theme.palette.text) ? theme.palette.text : theme.palette.text;
  return {
    ...theme,
    palette: {
      ...theme.palette,
      background: safeBackground,
      surface: safeSurface,
      text: safeText,
      outline: theme.palette.outline || "rgba(15, 23, 42, 0.08)"
    },
    sectionDensity: theme.sectionDensity || "balanced",
    interactionStyle: theme.interactionStyle || "refined"
  };
}
function pickDesignProfile(category) {
  const normalized = (category || "").toLowerCase();
  if (normalized.includes("restaurant") || normalized.includes("cafe") || normalized.includes("bakery")) {
    return {
      name: "Warm Editorial",
      style: "editorial hospitality",
      layout: "editorial",
      buttonStyle: "pill",
      surfaceStyle: "glass",
      mediaShape: "arched",
      density: "airy",
      accentMode: "earthy",
      palette: {
        background: "#fcf3ea",
        surface: "#ffffff",
        primary: "#c2410c",
        accent: "#f59e0b",
        text: "#1f2937",
        muted: "#6b7280",
        outline: "rgba(194, 65, 12, 0.12)"
      },
      typography: { heading: "Playfair Display", body: "Inter" }
    };
  }
  if (normalized.includes("salon") || normalized.includes("spa") || normalized.includes("wellness")) {
    return {
      name: "Soft Luxe",
      style: "luxury wellness",
      layout: "split-screen",
      buttonStyle: "pill",
      surfaceStyle: "glass",
      mediaShape: "portrait",
      density: "balanced",
      accentMode: "luxury",
      palette: {
        background: "#f8f4f5",
        surface: "#ffffff",
        primary: "#9333ea",
        accent: "#e9d5ff",
        text: "#1f2937",
        muted: "#9ca3af",
        outline: "rgba(147, 51, 234, 0.12)"
      },
      typography: { heading: "Cormorant Garamond", body: "Inter" }
    };
  }
  if (normalized.includes("gym") || normalized.includes("fitness") || normalized.includes("training")) {
    return {
      name: "Electric Performance",
      style: "high-energy conversion",
      layout: "immersive",
      buttonStyle: "sharp",
      surfaceStyle: "solid",
      mediaShape: "square",
      density: "compact",
      accentMode: "neon",
      palette: {
        background: "#f0fdf4",
        surface: "#ffffff",
        primary: "#16a34a",
        accent: "#0284c7",
        text: "#0f172a",
        muted: "#64748b",
        outline: "rgba(22, 163, 74, 0.16)"
      },
      typography: { heading: "Space Grotesk", body: "Inter" }
    };
  }
  if (normalized.includes("dry clean") || normalized.includes("laundry")) {
    return {
      name: "Polished Cleanliness",
      style: "clinical luxury",
      layout: "split-screen",
      buttonStyle: "pill",
      surfaceStyle: "glass",
      mediaShape: "rounded",
      density: "airy",
      accentMode: "fresh",
      palette: {
        background: "#f0f9ff",
        surface: "#ffffff",
        primary: "#0c4a6e",
        accent: "#3b82f6",
        text: "#1e293b",
        muted: "#78716c",
        outline: "rgba(12, 74, 110, 0.12)"
      },
      typography: { heading: "IBM Plex Sans", body: "Inter" }
    };
  }
  if (normalized.includes("dental") || normalized.includes("dentist") || normalized.includes("orthodont")) {
    return {
      name: "Clinical Calm",
      style: "healthcare premium",
      layout: "minimal",
      buttonStyle: "pill",
      surfaceStyle: "outline",
      mediaShape: "rounded",
      density: "balanced",
      accentMode: "fresh",
      palette: {
        background: "#f0fdf4",
        surface: "#ffffff",
        primary: "#059669",
        accent: "#06b6d4",
        text: "#1f2937",
        muted: "#6b7280",
        outline: "rgba(5, 150, 105, 0.10)"
      },
      typography: { heading: "Inter", body: "Inter" }
    };
  }
  if (normalized.includes("real estate") || normalized.includes("realtor") || normalized.includes("property")) {
    return {
      name: "Architectural Premium",
      style: "property luxury",
      layout: "gallery-forward",
      buttonStyle: "sharp",
      surfaceStyle: "solid",
      mediaShape: "square",
      density: "balanced",
      accentMode: "earthy",
      palette: {
        background: "#fafaf9",
        surface: "#ffffff",
        primary: "#5b4e48",
        accent: "#a16207",
        text: "#1f2937",
        muted: "#9ca3af",
        outline: "rgba(91, 78, 72, 0.12)"
      },
      typography: { heading: "IBM Plex Serif", body: "Inter" }
    };
  }
  if (normalized.includes("law") || normalized.includes("finance") || normalized.includes("consult") || normalized.includes("agency")) {
    return {
      name: "Modern Authority",
      style: "editorial professional",
      layout: "minimal",
      buttonStyle: "sharp",
      surfaceStyle: "outline",
      mediaShape: "rounded",
      density: "balanced",
      accentMode: "fresh",
      palette: {
        background: "#f7f7f5",
        surface: "#ffffff",
        primary: "#0f766e",
        accent: "#2563eb",
        text: "#111827",
        muted: "#6b7280",
        outline: "rgba(17, 24, 39, 0.10)"
      },
      typography: { heading: "IBM Plex Sans", body: "Inter" }
    };
  }
  return {
    name: "Luxe Bright",
    style: "premium luminous editorial",
    layout: "editorial",
    buttonStyle: "pill",
    surfaceStyle: "glass",
    mediaShape: "rounded",
    density: "balanced",
    accentMode: "neon",
    palette: {
      background: "#f8fafc",
      surface: "#ffffff",
      primary: "#7c3aed",
      accent: "#0ea5e9",
      text: "#0f172a",
      muted: "#64748b",
      outline: "rgba(124, 58, 237, 0.12)"
    },
    typography: { heading: "Inter", body: "Inter" }
  };
}
function buildCategorySpecificFeatures(category, businessName, seed) {
  const categoryNorm = (category || "").toLowerCase();
  if (categoryNorm.includes("cafe") || categoryNorm.includes("restaurant")) {
    return [
      {
        title: "Curated Atmosphere",
        description: "A space designed for both quick visits and lingering moments, with photography that captures the essence of hospitality."
      },
      {
        title: "Quality First",
        description: "Every detail reflects commitment to fresh ingredients, thoughtful preparation, and the craft of hospitality."
      },
      {
        title: "Clear Online Ordering",
        description: "Streamlined booking and reservation system that respects both your time and your team's workflow."
      }
    ];
  }
  if (categoryNorm.includes("salon") || categoryNorm.includes("spa")) {
    return [
      {
        title: "Personalized Beauty",
        description: "Expert services tailored to your unique needs, from color and cuts to specialized treatments and wellness."
      },
      {
        title: "Relaxation & Care",
        description: "A sanctuary where skilled practitioners use premium products and proven techniques to create transformation."
      },
      {
        title: "Convenient Scheduling",
        description: "Book your next appointment with ease, with availability and reminders that respect your schedule."
      }
    ];
  }
  if (categoryNorm.includes("dental")) {
    return [
      {
        title: "Clinical Excellence",
        description: "Advanced diagnostic tools and evidence-based techniques combined with a calm, patient-centered approach."
      },
      {
        title: "Preventive Focus",
        description: "Education and care strategies that prioritize long-term oral health and smile confidence."
      },
      {
        title: "Comfortable Experience",
        description: "Modern techniques, clear communication, and genuine care that make dental visits something to look forward to."
      }
    ];
  }
  if (categoryNorm.includes("gym") || categoryNorm.includes("fitness")) {
    return [
      {
        title: "Results-Driven Training",
        description: "Customized programs and expert coaching that transform fitness goals into measurable achievements."
      },
      {
        title: "Community Energy",
        description: "Train alongside like-minded members in an environment that motivates and celebrates progress."
      },
      {
        title: "State-of-the-Art Equipment",
        description: "Well-maintained facilities and cutting-edge tools that support every phase of your fitness journey."
      }
    ];
  }
  if (categoryNorm.includes("real estate") || categoryNorm.includes("property")) {
    return [
      {
        title: "Expert Market Knowledge",
        description: "Deep insights into local neighborhoods, market trends, and investment opportunities backed by data and experience."
      },
      {
        title: "Personalized Guidance",
        description: "Dedicated support through every step of buying, selling, or investing in property that matters."
      },
      {
        title: "Trusted Negotiation",
        description: "Strategic representation that secures favorable terms and protects your interests in every transaction."
      }
    ];
  }
  if (categoryNorm.includes("dry clean") || categoryNorm.includes("laundry")) {
    return [
      {
        title: "Expert Garment Care",
        description: "Specialist handling for delicate fabrics and premium materials, using proven techniques and quality products."
      },
      {
        title: "Fast Turnaround",
        description: "Reliable, on-time service that respects your schedule without compromising on quality."
      },
      {
        title: "Premium Quality Assurance",
        description: "Every garment inspected and handled with the precision expected of a trusted, professional service."
      }
    ];
  }
  return [
    {
      title: "Premium Positioning",
      description: "Your service distinguished by quality, attention to detail, and a commitment to customer satisfaction."
    },
    {
      title: "Clear Value Proposition",
      description: "What you offer and why it matters, communicated with clarity and confidence."
    },
    {
      title: "Seamless Booking",
      description: "Effortless way for customers to discover, understand, and take action with your business."
    }
  ];
}
function buildCategorySpecificTestimonials(category, businessName, seed) {
  const categoryNorm = (category || "").toLowerCase();
  const names = ["Alex M.", "Jordan K.", "Casey P.", "Morgan T.", "Riley S."];
  const roles = [
    "Regular Guest",
    "Loyal Client",
    "Returning Customer",
    "Business Owner",
    "Local Professional"
  ];
  const name1 = pickBySeed(names, seed + 11);
  const name2 = pickBySeed(names, seed + 23);
  const role1 = pickBySeed(roles, seed + 37);
  const role2 = pickBySeed(roles, seed + 47);
  if (categoryNorm.includes("cafe") || categoryNorm.includes("restaurant")) {
    return [
      {
        quote: "The new site actually reflects what makes this place special\u2014it brought me back to visit.",
        author: name1,
        role: role1
      },
      {
        quote: "Booking a table online and seeing their story upfront made me want to experience it in person.",
        author: name2,
        role: role2
      }
    ];
  }
  if (categoryNorm.includes("salon") || categoryNorm.includes("spa")) {
    return [
      {
        quote: "The website shows professionalism and care\u2014exactly what I experienced when I visited.",
        author: name1,
        role: role1
      },
      {
        quote: "Easy online booking and clear service descriptions gave me confidence before my first appointment.",
        author: name2,
        role: role2
      }
    ];
  }
  if (categoryNorm.includes("dental")) {
    return [
      {
        quote: "The information online calmed my nerves before my visit. Professional and reassuring.",
        author: name1,
        role: role1
      },
      {
        quote: "Clear details about services and friendly communication made me feel valued as a patient.",
        author: name2,
        role: role2
      }
    ];
  }
  if (categoryNorm.includes("gym") || categoryNorm.includes("fitness")) {
    return [
      {
        quote: "The online tour showed real community energy\u2014joined immediately and haven't looked back.",
        author: name1,
        role: role1
      },
      {
        quote: "Clear class descriptions and trainer profiles helped me pick the perfect fit for my goals.",
        author: name2,
        role: role2
      }
    ];
  }
  if (categoryNorm.includes("real estate") || categoryNorm.includes("property")) {
    return [
      {
        quote: "Their online listing brought clarity to a complex market\u2014guided me through the whole process with expertise.",
        author: name1,
        role: role1
      },
      {
        quote: "Professional presentation and transparent communication made me feel confident in my investment decision.",
        author: name2,
        role: role2
      }
    ];
  }
  if (categoryNorm.includes("dry clean") || categoryNorm.includes("laundry")) {
    return [
      {
        quote: "My premium items have never looked better\u2014trusted professionals who care about quality.",
        author: name1,
        role: role1
      },
      {
        quote: "Reliable, on-time service with genuine attention to detail. That's why they're my go-to.",
        author: name2,
        role: role2
      }
    ];
  }
  return [
    {
      quote: "Professional, reliable, and genuinely committed to customer satisfaction.",
      author: name1,
      role: role1
    },
    {
      quote: "The online experience matched the quality of service I received in person.",
      author: name2,
      role: role2
    }
  ];
}
function buildCategorySpecificFaqs(category, businessName, seed) {
  const categoryNorm = (category || "").toLowerCase();
  if (categoryNorm.includes("cafe") || categoryNorm.includes("restaurant")) {
    return [
      {
        question: "How far in advance should I book a table?",
        answer: "Most weeknights have availability, but weekends often fill 2-3 weeks ahead. Call or book online to check real-time availability."
      },
      {
        question: "Do you accommodate dietary preferences or restrictions?",
        answer: "Yes, we work with guests on allergies, preferences, and dietary needs. Please mention these when booking or call ahead."
      },
      {
        question: "What's your cancellation policy?",
        answer: "Cancellations 24 hours in advance are free. Late cancellations are held to your card to secure your reservation."
      }
    ];
  }
  if (categoryNorm.includes("salon") || categoryNorm.includes("spa")) {
    return [
      {
        question: "How do I book my first appointment?",
        answer: "Call or book online to select your service, preferred stylist, and time. Consultations are included for new clients."
      },
      {
        question: "What should I know before my appointment?",
        answer: "Arrive a few minutes early. Bring photos for clarity on your vision. Our team will discuss any concerns or allergies."
      },
      {
        question: "What's your rescheduling and cancellation policy?",
        answer: "Free cancellations up to 24 hours before. Late cancellations are charged 50% to respect your stylist's time."
      }
    ];
  }
  if (categoryNorm.includes("dental")) {
    return [
      {
        question: "What should I do if I have a dental emergency?",
        answer: "Call us immediately. We keep emergency slots open and guide you through treatment options and costs."
      },
      {
        question: "Do you offer payment plans?",
        answer: "Yes. We work with multiple financing partners to make treatment accessible and manageable for your budget."
      },
      {
        question: "How often should I schedule cleanings?",
        answer: "Most patients benefit from cleanings every 6 months. Your dentist may recommend more frequent visits based on your health."
      }
    ];
  }
  if (categoryNorm.includes("gym") || categoryNorm.includes("fitness")) {
    return [
      {
        question: "Do I need experience to join group classes?",
        answer: "No. All fitness levels are welcome. Instructors offer modifications so you can go at your own pace."
      },
      {
        question: "What's included with a membership?",
        answer: "Full facility access, all group classes, locker rooms, and member events. Personal training is available separately."
      },
      {
        question: "Can I freeze or pause my membership?",
        answer: "Yes. Members can pause for up to 3 months. Contact us to discuss your situation."
      }
    ];
  }
  if (categoryNorm.includes("real estate") || categoryNorm.includes("property")) {
    return [
      {
        question: "What's the first step in buying or selling property?",
        answer: "Start with a consultation to discuss your goals, timeline, and market conditions. We'll create a tailored strategy."
      },
      {
        question: "How are your agent fees structured?",
        answer: "Standard rates for most transactions. We also offer consultation packages for strategic guidance. Full details available on request."
      },
      {
        question: "How long does a typical sale take?",
        answer: "Varies by market and property. Most sales take 30-45 days from offer to close. We manage timelines and reduce surprises."
      }
    ];
  }
  if (categoryNorm.includes("dry clean") || categoryNorm.includes("laundry")) {
    return [
      {
        question: "What fabrics and garments do you handle?",
        answer: "We care for wool, silk, delicate blends, leather, suede, furs, and premium items. Ask about specialty services."
      },
      {
        question: "How long does dry cleaning take?",
        answer: "Most items are ready in 2-3 business days. We offer rush service for important events when requested in advance."
      },
      {
        question: "What if something goes wrong with my garment?",
        answer: "We stand behind our work and have industry insurance. We'll discuss solutions immediately\u2014your satisfaction matters."
      }
    ];
  }
  return [
    {
      question: "How do I get started?",
      answer: "Contact us via phone or book online. We'll guide you through the process and answer any questions."
    },
    {
      question: "What's your pricing?",
      answer: "Pricing varies by service. Call or visit for a quote tailored to your specific needs."
    },
    {
      question: "Do you offer any guarantees?",
      answer: "Yes. We stand behind our service quality and customer satisfaction is our top priority."
    }
  ];
}
function createFallbackWebsiteSchema(business) {
  const siteName = business.name || "Demo Business";
  const categoryLabel = business.category || "local business";
  const copySeed = hashSeed(`${business.id || siteName}-${categoryLabel}`);
  const design = pickDesignProfile(business.category || "");
  const layoutVariant = pickBySeed(
    [
      "editorial",
      "split-screen",
      "gallery-forward",
      "minimal",
      "immersive"
    ],
    copySeed + 7
  );
  const buttonVariant = pickBySeed(
    ["pill", "sharp", "ghost"],
    copySeed + 13
  );
  const mediaVariant = pickBySeed(
    ["arched", "rounded", "portrait"],
    copySeed + 19
  );
  const densityVariant = pickBySeed(
    ["airy", "balanced", "compact"],
    copySeed + 23
  );
  const accentVariant = pickBySeed(
    ["earthy", "luxury", "fresh", "neon"],
    copySeed + 31
  );
  const heroVariant = layoutVariant === "minimal" ? "centered" : layoutVariant === "immersive" ? "immersive" : layoutVariant === "split-screen" ? "split" : "split";
  const featureLayout = layoutVariant === "minimal" ? "list" : "cards";
  const heroImage = business.photos?.[0] || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80";
  const heroSubheadline = buildUniqueHeroSubheadline(
    siteName,
    categoryLabel,
    copySeed
  );
  const features = buildCategorySpecificFeatures(
    business.category || "",
    siteName,
    copySeed
  );
  const testimonials = buildCategorySpecificTestimonials(
    business.category || "",
    siteName,
    copySeed
  );
  const faqs = buildCategorySpecificFaqs(
    business.category || "",
    siteName,
    copySeed
  );
  const sectionOrder = buildSectionOrderPattern(
    business.category || "",
    copySeed
  );
  const baseSections = [
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
        alt: siteName
      }
    }
  ];
  const midSections = [];
  for (const sectionType of sectionOrder) {
    if (sectionType === "features") {
      midSections.push({
        id: "features-1",
        type: "features",
        layout: featureLayout,
        items: features
      });
    } else if (sectionType === "gallery") {
      midSections.push({
        id: "gallery-1",
        type: "gallery",
        items: [
          {
            src: business.photos?.[1] || business.photos?.[0] || "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
            alt: `${siteName} gallery 1`
          },
          {
            src: business.photos?.[2] || business.photos?.[1] || "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
            alt: `${siteName} gallery 2`
          }
        ]
      });
    } else if (sectionType === "testimonials") {
      midSections.push({
        id: "testimonials-1",
        type: "testimonials",
        items: testimonials
      });
    } else if (sectionType === "faq") {
      midSections.push({
        id: "faq-1",
        type: "faq",
        items: faqs
      });
    } else if (sectionType === "cta") {
      midSections.push({
        id: "cta-1",
        type: "cta",
        title: `Ready to discover ${siteName}?`,
        body: "Reach out today and let's discuss how we can help you achieve your goals.",
        buttonLabel: "Get in Touch",
        buttonHref: "#contact"
      });
    }
  }
  const allSections = [
    ...baseSections,
    ...midSections,
    { id: "contact-1", type: "contact", showEmail: true, showPhone: true }
  ];
  const schema = {
    meta: {
      siteId: `fallback-${business.id || "business"}-${Date.now()}`,
      businessId: business.id || "business",
      slug: siteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      version: 1,
      target: "static"
    },
    theme: {
      name: design.name,
      style: design.style,
      radius: design.surfaceStyle === "solid" ? "20px" : layoutVariant === "minimal" ? "16px" : "28px",
      layout: layoutVariant,
      buttonStyle: buttonVariant,
      surfaceStyle: design.surfaceStyle,
      mediaShape: mediaVariant,
      density: densityVariant,
      accentMode: accentVariant,
      palette: design.palette,
      typography: design.typography
    },
    brand: {
      businessName: siteName,
      category: business.category || "Local Business",
      address: business.address || "",
      phone: business.phoneNumber || "",
      email: business.email || "",
      websiteUri: business.websiteUri || ""
    },
    seo: {
      title: `${siteName} | Preview`,
      description: `Premium website for ${siteName}\u2014${categoryLabel} services with modern design and seamless booking.`,
      keywords: [
        business.category || "local",
        "services",
        "premium",
        categoryLabel
      ]
    },
    sections: allSections
  };
  return ensureNonTemplateCopy(schema, business);
}
app.post("/api/generate", async (req, res) => {
  try {
    const business = req.body;
    if (!business || !business.name) {
      return res.status(400).json({ error: "Missing business payload" });
    }
    const debugSession = createGenerationDebugSession(business);
    res.setHeader("x-debug-generation-id", debugSession.traceId);
    res.setHeader("x-debug-generation-fallback", "false");
    persistGenerationDebugFile(
      debugSession,
      "01-business-input.json",
      buildBusinessDebugInput(business)
    );
    if (WEBSITE_GENERATION_MODE === "template") {
      console.log(
        "[Generate] Using TEMPLATE mode (TEST_MODE) - skipping Gemini"
      );
      debugSession.fallbackReason = "template-mode";
      appendGenerationDebugError(
        debugSession,
        "fallback_triggered: template mode"
      );
      res.setHeader("x-debug-generation-fallback", "true");
      const fallbackSchema = createFallbackWebsiteSchema(business);
      persistGenerationDebugFile(
        debugSession,
        "05-normalized-schema.json",
        fallbackSchema
      );
      return res.json(fallbackSchema);
    }
    if (!genai) {
      debugSession.fallbackReason = "missing-genai";
      appendGenerationDebugError(
        debugSession,
        "fallback_triggered: genai unavailable"
      );
      res.setHeader("x-debug-generation-fallback", "true");
      const fallbackSchema = createFallbackWebsiteSchema(business);
      persistGenerationDebugFile(
        debugSession,
        "05-normalized-schema.json",
        fallbackSchema
      );
      return res.json(fallbackSchema);
    }
    const buildImageBlock = (b) => {
      const sources = [...b.photos || [], ...b.imageSuggestions || []];
      return sources.length ? sources.map((u, i) => `${i + 1}. ${u}`).join("\n") : "No direct image URLs provided.";
    };
    const buildReviewsBlock = (b) => {
      if (Array.isArray(b.reviews) && b.reviews.length) {
        return b.reviews.map(
          (r, i) => `${i + 1}. ${r.rating || ""} - ${r.text || r.comment || ""}`
        ).join("\n");
      }
      return "No reviews provided.";
    };
    const qualificationNotes = business.notes || business.qualificationNotes || business.notes || "None";
    const neighborhood = business.neighborhood || business.vibe || "Unknown";
    const specialties = Array.isArray(business.specialties) ? business.specialties.join(", ") : business.specialties || "General services";
    const tone = business.tone || "professional";
    const creativeSeed = `${business.id || "lead"}-${Date.now()}`;
    const prompt = `You are an elite creative director and premium brand strategist crafting bespoke websites for local businesses. Every design must feel high-caliber, editorial, and distinctly tailored\u2014never templated or generic. Think Stripe, Framer, and award-winning product sites as inspiration, not local directory listings.

## MANDATORY DESIGN PRINCIPLES

### Light Theme Only
- Background: white, cream, light stone, or pale tonal surfaces (never dark, never charcoal)
- Surface: white, off-white, or very soft neutrals with fine borders
- Text: dark gray to near-black for clarity and contrast
- Accents: one bold primary accent, optionally one soft secondary accent
- NO dark backgrounds, NO heavy blacks, NO night-mode aesthetics

### Premium Spacing & Composition
- Generous margins and breathing room between sections
- Asymmetrical layouts and editorial rhythm preferred over rigid grids
- Section pacing that alternates between dense and open
- Never cramped, never busy, always intentional

### Visual Distinction by Category
Adapt the core design for category context:
- **Cafe/Restaurant**: warm, editorial, organic rounded cards, terracotta/ochre accents, serif headlines
- **Salon/Spa**: luxury minimalism, soft lavender/rose accents, elegant serif or high-fashion typography, split layouts
- **Dental**: clinical calm, clinical luxury, mint/aqua accents, minimal serif/sans, plenty of white space
- **Fitness**: energetic confidence, bright white base, bold teal/coral accents, sharp compact buttons, dynamic layout
- **Real Estate**: architectural premium, warm stone base, slate/gold accents, large image blocks, clean geometry
- **Dry Cleaning**: polished clinical, crisp blue accents, soft rounded containers, trust-focused messaging
- **Professional/Consulting**: modern authority, restrained minimal, blue accents, strong sans-serif, high trust signals

### Uniqueness Enforcement
- No two sections should use identical layouts or content structures
- Avoid the pattern: hero \u2192 features \u2192 gallery \u2192 testimonials \u2192 FAQ \u2192 contact
- Vary section order; hero and contact are anchors, but vary everything between
- Use asymmetrical image compositions, split panels, bento grids\u2014not predictable photo carousels

## SCHEMA REQUIREMENTS

- **sections** array: 7-9 sections including hero, features, gallery, testimonials, faq, cta, and contact
- **theme fields**: Set all of: name, style, layout, buttonStyle, surfaceStyle, mediaShape, density, accentMode, typography (heading + body), palette (all 7 colors: background, surface, primary, accent, text, muted, outline), radius
- **Typography pairing**: Choose one pairing from these premium tones:
  - Luxury/Editorial: serif heading (Playfair, Cormorant, Fraunces) + neutral sans body (Inter, IBM Plex Sans)
  - Modern/Clean: geometric sans heading (Space Grotesk, IBM Plex Sans, Inter) + humanist sans body (Inter)
  - Clinical/Professional: precise sans heading (IBM Plex Sans) + calm sans body (Inter)
  - Performance/Energetic: bold display heading (Space Grotesk) + compact sans body (Inter)
- **Palette colors**: All hex values for modern light-theme targets: backgrounds light (>90% brightness), surfaces light (>85%), text dark (<30% brightness), accents bold but not neon

## CONTENT REQUIREMENTS

### Hero Section
- Headline: business name or powerful, benefit-driven hook (not generic)
- Subheadline: concrete value proposition mentioning category specifics (e.g., "Premium garment care for silk and wool", not "A modern website designed to convert")
- CTA Primary: action-oriented (Book, Schedule, Learn, Discover\u2014not generic "Get Started")
- CTA Secondary: optional info link
- Badges: design system name or category positioning (optional)

### Features (4-6 items)
- Specific to category: use actual service names, not "Positioning", "Messaging", "Strategy"
- Examples good: "Expert Color Consultation", "Stress-Free Scheduling", "Premium Material Handling"
- Examples bad: "Quality Service", "Customer Focus", "Modern Design"
- Descriptions: concrete benefits, not hype

### Gallery (2-4 items)
- Real images tied to business (photos or professional visuals)
- Alt text: descriptive and specific (e.g., "Salon styling station with minimalist design" not "Image")

### Testimonials (2-4 items)
- Realistic-sounding names (Alex M., Jordan K., Casey P., Morgan T.)
- Realistic roles (Regular Guest, Local Professional, Returning Client)
- Quotes mention specific, concrete benefits (e.g., "The online booking made scheduling easy" not "Great service")

### FAQ (4-6 items)
- Real questions customers ask in this category
- Answers: clear, professional, action-oriented
- Category-specific tone and technical depth

### CTA Section
- Title: benefit-focused call to action
- Body: brief, outcome-oriented copy
- Button: action-oriented label

### Contact Section
- Standard fields with professional presentation

## STYLE ENFORCEMENT

- Tone: professional, human, conversational\u2014never corporate buzzwords
- Avoid: "cutting-edge", "innovative", "best-in-class", "one-stop shop", "game-changing"
- Avoid: repeated structures, generic starter phrases, filler words
- Avoid: dark aesthetics, heavy fonts, cramped layouts, stock phrases

## SEED GUIDANCE
Use this seed to vary results uniquely: ${creativeSeed}
Apply seed to: section ordering, layout choices, accent mood, typography pair selection, spacing density

Business Context:
- Name: ${business.name}
- Category: ${business.category || "Local Service"}
- Address: ${business.address || "N/A"}
- Phone: ${business.phoneNumber || "N/A"}
- Email: ${business.email || "N/A"}
- Website: ${business.websiteUri || "N/A"}

Qualification Notes:
${qualificationNotes}

Neighborhood / Vibe:
${neighborhood}

Service Specialties:
${specialties}

Customer Tone / Sentiment:
${tone}

Reviews:
${buildReviewsBlock(business)}

Reference Images:
${buildImageBlock(business)}

Return only valid JSON matching the WebsiteSchema TypeScript interface. No markdown, no commentary, no explanations. Valid JSON only.`;
    persistGenerationDebugFile(debugSession, "02-generation-prompt.md", prompt);
    const modelsToTry = [
      { name: "gemini-3.1-pro-preview", timeoutMs: 65e3 },
      { name: "gemini-2.5-flash", timeoutMs: 35e3 }
    ];
    let rawText = "";
    let lastError = null;
    for (const model of modelsToTry) {
      try {
        const response = await Promise.race([
          genai.models.generateContent({
            model: model.name,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 1.15,
              topP: 0.95
            }
          }),
          new Promise(
            (_, reject) => setTimeout(
              () => reject(
                new Error(
                  `${model.name} request timed out after ${model.timeoutMs}ms`
                )
              ),
              model.timeoutMs
            )
          )
        ]);
        rawText = (response.text || "").trim();
        if (rawText) {
          break;
        }
        lastError = new Error(`${model.name} returned empty text`);
        console.warn(
          `[Generate] ${model.name} returned empty text, trying next model.`
        );
      } catch (error) {
        lastError = error;
        console.warn(
          `[Generate] ${model.name} failed, trying next model:`,
          error
        );
      }
    }
    if (!rawText) {
      throw lastError || new Error("All Gemini model attempts failed");
    }
    persistGenerationDebugFile(
      debugSession,
      "03-gemini-raw-response.txt",
      rawText
    );
    const parsedSchema = parseWebsiteSchemaOutput(
      rawText,
      business,
      debugSession
    );
    if (!parsedSchema) {
      console.warn(
        "[Generate] Gemini output could not be parsed as WebsiteSchema, using fallback schema."
      );
      debugSession.fallbackReason = "parse-failure";
      appendGenerationDebugError(
        debugSession,
        "fallback_triggered: parse failure"
      );
      res.setHeader("x-debug-generation-fallback", "true");
      const fallbackSchema = createFallbackWebsiteSchema(business);
      persistGenerationDebugFile(
        debugSession,
        "05-normalized-schema.json",
        fallbackSchema
      );
      return res.json(fallbackSchema);
    }
    const finalSchema = ensureNonTemplateCopy(parsedSchema, business);
    persistGenerationDebugFile(
      debugSession,
      "05-normalized-schema.json",
      finalSchema
    );
    debugSession.sectionTypes = finalSchema.sections.map(
      (section) => section.type
    );
    debugSession.warnings.push(
      ...debugSession.parseRepairs.length > 0 ? ["schema normalized with repair steps"] : []
    );
    res.setHeader("x-debug-generation-fallback", "false");
    return res.json(finalSchema);
  } catch (error) {
    const fallbackSchema = createFallbackWebsiteSchema(req.body);
    const debugSession = req.body && req.body.name ? Array.from(generationDebugSessions.values()).find(
      (session) => session.businessName === req.body.name
    ) : void 0;
    if (debugSession) {
      appendGenerationDebugError(
        debugSession,
        `route_error: ${error instanceof Error ? error.message : String(error)}`
      );
      persistGenerationDebugFile(
        debugSession,
        "05-normalized-schema.json",
        fallbackSchema
      );
      res.setHeader("x-debug-generation-id", debugSession.traceId);
      res.setHeader("x-debug-generation-fallback", "true");
    }
    console.warn("/api/generate falling back to local schema:", error);
    return res.json(fallbackSchema);
  }
});
app.post(
  "/api/debug-generation/:traceId/file",
  (req, res) => {
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
      Boolean(append)
    );
    return res.json({ success: true, traceId, fileName });
  }
);
app.get(
  "/api/debug-generation/:traceId/summary",
  (req, res) => {
    const { traceId } = req.params;
    const session = getGenerationDebugSession(traceId);
    if (!session) {
      return res.status(404).json({ error: "Unknown debug generation trace" });
    }
    return res.json(session);
  }
);
app.post(
  "/api/deploy",
  async (req, res) => {
    try {
      if (!NETLIFY_TOKEN) {
        return res.status(500).json({ error: "Netlify token not configured on server" });
      }
      const { websiteContent, businessName } = req.body;
      if (!websiteContent || !businessName) {
        return res.status(400).json({ error: "Missing websiteContent or businessName" });
      }
      const siteName = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "digital-scout"}-${Date.now()}`;
      const siteResponse = await fetch("https://api.netlify.com/api/v1/sites", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NETLIFY_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: siteName })
      });
      if (!siteResponse.ok) {
        const errorDetails = await siteResponse.text();
        return res.status(siteResponse.status).json({
          error: `Netlify site creation failed: ${siteResponse.statusText}`,
          details: errorDetails
        });
      }
      const siteData = await siteResponse.json();
      const siteId = siteData.id;
      const deployedUrl = siteData.ssl_url || siteData.url || siteData.deploy_url;
      const sha1 = crypto2.createHash("sha1").update(websiteContent).digest("hex");
      const deployResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NETLIFY_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            files: {
              "/index.html": sha1
            }
          })
        }
      );
      if (!deployResponse.ok) {
        const errorDetails = await deployResponse.text();
        return res.status(deployResponse.status).json({
          error: `Netlify deploy creation failed: ${deployResponse.statusText}`,
          details: errorDetails
        });
      }
      const deployData = await deployResponse.json();
      const deployId = deployData.id;
      const uploadResponse = await fetch(
        `https://api.netlify.com/api/v1/deploys/${deployId}/files/index.html`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${NETLIFY_TOKEN}`,
            "Content-Type": "application/octet-stream"
          },
          body: websiteContent
        }
      );
      if (!uploadResponse.ok) {
        const errorDetails = await uploadResponse.text();
        return res.status(uploadResponse.status).json({
          error: `Netlify file upload failed: ${uploadResponse.statusText}`,
          details: errorDetails
        });
      }
      return res.json({
        success: true,
        deployedUrl,
        siteId,
        deployId,
        deployedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Deployment failed"
      });
    }
  }
);
app.post(
  "/api/enrich-business",
  async (req, res) => {
    try {
      let categoryImageSuggestions = function(cat, name) {
        const c = (cat || "").toLowerCase();
        if (c.includes("restaurant") || c.includes("cafe")) {
          return [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1541542684-18f77c1f6b5a?auto=format&fit=crop&w=1200&q=80"
          ];
        }
        if (c.includes("salon") || c.includes("spa")) {
          return [
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1200&q=80"
          ];
        }
        if (c.includes("gym") || c.includes("fitness")) {
          return [
            "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1517960413843-0aee4a3d5a0c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1558611848-73f7eb4001d6?auto=format&fit=crop&w=1200&q=80"
          ];
        }
        return [
          "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1500306365237-7b4b9d7d0f0b?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
        ];
      };
      const { websiteUri, businessName, category } = req.body;
      if (!businessName) {
        return res.status(400).json({ error: "Missing businessName" });
      }
      if (!websiteUri) {
        return res.json({
          email: void 0,
          phones: [],
          imageSuggestions: categoryImageSuggestions(category, businessName)
        });
      }
      const response = await fetch(websiteUri, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; DigitalScout/1.0)"
        }
      });
      if (!response.ok) {
        return res.json({
          email: void 0,
          phones: [],
          imageSuggestions: []
        });
      }
      const html = await response.text();
      return res.json({
        email: extractEmails(html)[0],
        phones: extractPhones(html),
        imageSuggestions: extractImages(html),
        businessName,
        category
      });
    } catch (error) {
      console.error("Enrich business error:", error);
      return res.json({
        email: void 0,
        phones: [],
        imageSuggestions: []
      });
    }
  }
);
app.post(
  "/api/qualify-leads",
  async (req, res) => {
    try {
      const { businesses, city } = req.body;
      if (!Array.isArray(businesses)) {
        return res.status(400).json({ error: "Missing businesses array" });
      }
      const candidates = businesses.filter(
        (business) => business && typeof business.name === "string"
      );
      const qualifications = await runWithConcurrency(
        candidates,
        3,
        async (business) => {
          const qualification = await qualifyLeadCandidate(business, city);
          return { business, qualification };
        }
      );
      const qualifiedBusinesses = qualifications.filter(
        ({ qualification }) => !qualification.hasWebsite && Boolean(qualification.email || qualification.phoneNumber)
      ).map(({ business, qualification }) => ({
        ...business,
        websiteUri: qualification.websiteUri,
        email: qualification.email || business.email,
        phoneNumber: qualification.phoneNumber || business.phoneNumber,
        notes: qualification.notes || void 0,
        confidence: qualification.confidence || void 0
      }));
      return res.json({
        businesses: qualifiedBusinesses,
        totalCandidates: candidates.length,
        totalQualified: qualifiedBusinesses.length
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Lead qualification failed"
      });
    }
  }
);
app.post(
  "/api/wordpress/provision-site",
  async (req, res) => {
    try {
      const { projectId, business, websiteSchema, provisioningPlan } = req.body;
      if (!projectId || !business || !websiteSchema) {
        return res.status(400).json({
          error: "Missing projectId, business, or websiteSchema."
        });
      }
      const jobId = crypto2.randomUUID();
      await pool.query(
        `INSERT INTO provisioning_jobs (id, project_id, status) VALUES (?, ?, 'pending')`,
        [jobId, projectId]
      );
      return res.json({
        success: true,
        jobId,
        message: "Provisioning job queued successfully"
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to queue provisioning job"
      });
    }
  }
);
app.get("/api/wordpress/site-status/:projectId", async (req, res) => {
  const { projectId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT status, logs, subdomain_url, wp_admin_url, wp_admin_user, wp_admin_pass_encrypted FROM provisioning_jobs 
			 LEFT JOIN isolated_deployments ON provisioning_jobs.project_id = isolated_deployments.project_id
			 WHERE provisioning_jobs.project_id = ? ORDER BY provisioning_jobs.created_at DESC LIMIT 1`,
      [projectId]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }
    let rawPassword = null;
    if (rows[0].status === "completed" && rows[0].wp_admin_pass_encrypted) {
      try {
        const [ivHex, encryptedHex] = rows[0].wp_admin_pass_encrypted.split(":");
        const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
        const decipher = crypto2.createDecipheriv("aes-256-cbc", Buffer.from(key), Buffer.from(ivHex, "hex"));
        let decrypted = decipher.update(Buffer.from(encryptedHex, "hex"));
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        rawPassword = decrypted.toString();
      } catch (e) {
        console.error("Decryption failed:", e);
      }
    }
    return res.json({
      success: true,
      status: rows[0].status,
      logs: rows[0].logs || [],
      deployment: rows[0].subdomain_url ? {
        liveUrl: rows[0].subdomain_url,
        adminUrl: rows[0].wp_admin_url,
        username: rows[0].wp_admin_user,
        password: rawPassword
      } : null
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch status"
    });
  }
});
app.delete("/api/wordpress/site/:siteId", async (req, res) => {
  try {
    const { siteId } = req.params;
    if (!siteId) {
      return res.status(400).json({ error: "Missing siteId" });
    }
    await deleteProvisionedWordPressMultisiteSite(siteId);
    return res.json({
      success: true,
      message: `WordPress site ${siteId} deleted successfully`
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete WordPress site"
    });
  }
});
app.post(
  "/api/outreach/send",
  async (req, res) => {
    try {
      const { businessName, phoneNumber, message, preferredChannel } = req.body;
      if (!businessName || !phoneNumber || !message) {
        return res.status(400).json({
          error: "Missing required fields: businessName, phoneNumber, message"
        });
      }
      if (!CALLHIPPO_API_KEY) {
        console.error("[CallHippo] API key is not configured");
        return res.status(500).json({
          error: "CallHippo API key is not configured on the server. Please check .env.local."
        });
      }
      const result = await sendOutreachViaCallHippo(
        {
          businessName,
          phoneNumber,
          message,
          preferredChannel: preferredChannel || "whatsapp"
        },
        CALLHIPPO_API_KEY
      );
      if (result.success) {
        console.log(
          `[Outreach] Successfully sent via ${result.channel} to ${phoneNumber}`
        );
        return res.json({
          success: true,
          channel: result.channel,
          messageId: result.messageId,
          status: result.status
        });
      } else {
        console.warn(
          `[Outreach] Failed to send to ${phoneNumber}: ${result.error}`
        );
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to send outreach message"
        });
      }
    } catch (error) {
      console.error("[Outreach] Unexpected error:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Outreach sending failed"
      });
    }
  }
);
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.delete("/api/sites/:siteId", async (req, res) => {
  try {
    if (!NETLIFY_TOKEN) {
      return res.status(500).json({ error: "Netlify token not configured on server" });
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
          Authorization: `Bearer ${NETLIFY_TOKEN}`
        }
      }
    );
    if (!response.ok) {
      const errorDetails = await response.text();
      return res.status(response.status).json({
        error: `Failed to delete Netlify site: ${response.statusText}`,
        details: errorDetails
      });
    }
    return res.json({ success: true, siteId });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Delete failed"
    });
  }
});
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await initializeDatabase();
  startProvisioningWorker();
});
var server_default = app;
export {
  server_default as default
};
