/** @format */
import crypto from "crypto";
import fs from "fs";
import { pool } from "./db";
import { addSubdomain, deleteSubdomain, createDatabase, createDatabaseUser, setDatabasePrivileges, deleteDatabase, deleteDatabaseUser, checkSubdomainExists, remoteDirectoryExists, } from "./cpanel-uapi";
import { checkWpCliAvailable, downloadWordPressCore, createWpConfig, installWordPress, configurePermalinks, runWpCommand, runRemoteShellCommand, } from "./wp-cli";
import { generateWithFallback } from "./gemini";
// NOTE: No local `fs` import — all filesystem operations are remote via SSH.
const MAX_RETRIES = 3;
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
function sanitizeSubdomainBase(name) {
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
async function isSubdomainTaken(subdomain) {
    const [rows] = await pool.query(`SELECT id FROM provisioning_jobs
		 WHERE subdomain = ? AND status NOT IN ('failed', 'cleaned')
		 LIMIT 1`, [subdomain]);
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
async function generateUniqueSubdomain(businessName) {
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
async function suggestAlternativeSubdomainViaVertex(businessName, existingSubdomain, attemptNumber, log) {
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
        const responseText = await generateWithFallback(prompt, { temperature: 0.7 }, {
            logStderr: log,
            throttleGemini: async () => { },
            contextLabel: "alternative-subdomain-generation"
        });
        const result = responseText?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
        if (result && result.length > 2 && result !== existingSubdomain) {
            log(`[cPanel-Subdomain] Vertex suggested alternative subdomain: "${result}"`);
            return result;
        }
    }
    catch (e) {
        log(`[cPanel-Subdomain] Vertex error suggesting subdomain: ${e.message || e}`);
    }
    // Fallback to simple random suffix if Vertex fails
    const suffix = crypto.randomBytes(3).toString("hex");
    return `${sanitizeSubdomainBase(businessName)}-${suffix}`.substring(0, MAX_SUBDOMAIN_LENGTH);
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
function decrypt(encryptedValue) {
    const [ivHex, encHex] = encryptedValue.split(":");
    const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), Buffer.from(ivHex, "hex"));
    let decrypted = decipher.update(Buffer.from(encHex, "hex"));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
async function appendLog(jobId, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(`[Job ${jobId}] ${message}`);
    fs.writeSync(2, `[Job ${jobId}] ${message}\n`);
    await pool.query(`UPDATE provisioning_jobs SET logs = JSON_ARRAY_APPEND(COALESCE(logs, JSON_ARRAY()), '$', ?) WHERE id = ?`, [logEntry, jobId]);
}
export async function processJob(jobId) {
    const [rows] = await pool.query(`SELECT * FROM provisioning_jobs WHERE id = ?`, [jobId]);
    if (!rows || rows.length === 0)
        return;
    const job = rows[0];
    if (job.status === "completed" || job.status === "failed")
        return;
    try {
        await executeStateMachine(job);
    }
    catch (error) {
        await appendLog(job.id, `ERROR: ${error.message}`);
        if (job.retry_count < MAX_RETRIES) {
            await appendLog(job.id, `Retrying later (Attempt ${job.retry_count + 1}/${MAX_RETRIES})`);
            await pool.query(`UPDATE provisioning_jobs SET retry_count = retry_count + 1, locked_at = NULL WHERE id = ?`, [job.id]);
        }
        else {
            await appendLog(job.id, `Max retries reached. Initiating rollback.`);
            await rollbackJob(job);
            await pool.query(`UPDATE provisioning_jobs SET status = 'failed', locked_at = NULL WHERE id = ?`, [job.id]);
        }
    }
}
async function executeStateMachine(job) {
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
                    await appendLog(job.id, `Subdomain "${subdomain}.${rootDomain}" or remote directory "${fullDocRoot}" already exists on Namecheap/cPanel server.`);
                }
            }
            catch (chkErr) {
                await appendLog(job.id, `Warning during subdomain existence pre-check: ${chkErr.message || chkErr}`);
            }
            if (existsOnServer) {
                if (attempts < maxSubdomainAttempts) {
                    const prevSubdomain = subdomain;
                    subdomain = await suggestAlternativeSubdomainViaVertex(job.business_name || job.project_id, prevSubdomain, attempts, (msg) => appendLog(job.id, msg));
                    await appendLog(job.id, `Retrying subdomain check with Vertex suggested alternative: "${subdomain}"`);
                    await pool.query(`UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`, [subdomain, job.id]);
                    continue; // Try again in the loop with the new subdomain
                }
                else {
                    throw new Error(`Failed to find a unique subdomain after ${maxSubdomainAttempts} attempts. Last tried: "${subdomain}"`);
                }
            }
            // Create subdomain via cPanel UAPI on the remote WP server
            try {
                await addSubdomain(subdomain, rootDomain, fullDocRoot);
                await appendLog(job.id, `Created subdomain: ${subdomain}.${rootDomain} → ${fullDocRoot}`);
                subdomainOk = true;
            }
            catch (subErr) {
                const errMsg = subErr.message || String(subErr);
                if (errMsg.includes("already exists") || errMsg.includes("exists") || errMsg.includes("closed by remote host")) {
                    await appendLog(job.id, `Subdomain "${subdomain}.${rootDomain}" collision or connection closure detected: "${errMsg}"`);
                    if (attempts < maxSubdomainAttempts) {
                        const prevSubdomain = subdomain;
                        subdomain = await suggestAlternativeSubdomainViaVertex(job.business_name || job.project_id, prevSubdomain, attempts, (msg) => appendLog(job.id, msg));
                        await appendLog(job.id, `Retrying subdomain creation with Vertex suggested alternative: "${subdomain}"`);
                        await pool.query(`UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`, [subdomain, job.id]);
                    }
                    else {
                        throw new Error(`Failed to create a unique subdomain after ${maxSubdomainAttempts} attempts. Last tried: "${subdomain}"`);
                    }
                }
                else {
                    throw subErr;
                }
            }
        }
        job.status = "creating_database";
    }
    // ── STEP 2: Creating Database ───────────────────────────────────────────
    if (job.status === "creating_database") {
        await pool.query(`UPDATE provisioning_jobs SET status = 'creating_database' WHERE id = ?`, [job.id]);
        await appendLog(job.id, "Creating database on remote WP server cPanel");
        const dbPrefix = process.env.CPANEL_USERNAME
            ? `${process.env.CPANEL_USERNAME}_`
            : "db_";
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
        job._tempDbPass = dbPassword;
        await appendLog(job.id, `Created remote database: ${dbName} and user: ${dbUser}`);
        job.status = "installing_wordpress";
    }
    // ── STEP 3: Installing WordPress ────────────────────────────────────────
    if (job.status === "installing_wordpress") {
        await pool.query(`UPDATE provisioning_jobs SET status = 'installing_wordpress' WHERE id = ?`, [job.id]);
        await appendLog(job.id, "Starting remote WordPress installation via SSH/WP-CLI");
        // Decrypt db password if coming from a retry
        let dbPassword = job._tempDbPass;
        if (!dbPassword && job.db_pass_encrypted) {
            try {
                dbPassword = decrypt(job.db_pass_encrypted);
            }
            catch (e) {
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
            job._tempAdminPass = rawPass;
            await pool.query(`UPDATE provisioning_jobs SET wp_admin_user = ?, wp_admin_pass_encrypted = ? WHERE id = ?`, [wpAdminUser, wpAdminPass, job.id]);
        }
        // Create wp-config.php — DB host is localhost on the remote WP server
        await createWpConfig(fullDocRoot, dbName, dbUser, dbPassword, "localhost", (log) => appendLog(job.id, log));
        // Install WordPress
        const rawAdminPass = job._tempAdminPass || decrypt(wpAdminPass);
        const siteUrl = `http://${subdomain}.${rootDomain}`;
        await installWordPress(fullDocRoot, siteUrl, `${job.business_name || "Generated Site"} — ${job.project_id}`, wpAdminUser, rawAdminPass, "admin@digitalscout.online", (log) => appendLog(job.id, log));
        await appendLog(job.id, `WordPress installed at ${siteUrl}`);
        job.status = "configuring_wordpress";
    }
    // ── STEP 4: Configuring WordPress ───────────────────────────────────────
    if (job.status === "configuring_wordpress") {
        await pool.query(`UPDATE provisioning_jobs SET status = 'configuring_wordpress' WHERE id = ?`, [job.id]);
        const fullDocRoot = `${docRootBase}/${subdomain}`;
        await configurePermalinks(fullDocRoot, "/%postname%/", (log) => appendLog(job.id, log));
        await appendLog(job.id, "Configured remote permalinks");
        // Hello Elementor = truly blank canvas, zero opinionated defaults
        await appendLog(job.id, "Installing Hello Elementor theme...");
        try {
            await runWpCommand(`theme install hello-elementor --activate`, fullDocRoot, (log) => appendLog(job.id, log));
            await appendLog(job.id, "Hello Elementor theme activated");
        }
        catch (e) {
            await appendLog(job.id, `Warning: Theme install failed (${e.message}), using default`);
        }
        try {
            await runWpCommand(`theme delete twentytwentyfive twentytwentyfour twentytwentythree astra`, fullDocRoot, (log) => appendLog(job.id, log));
        }
        catch (e) {
            /* non-fatal */
        }
        await runWpCommand(`option update default_comment_status closed`, fullDocRoot, (log) => appendLog(job.id, log)).catch(() => { });
        await runWpCommand(`option update blogdescription ""`, fullDocRoot, (log) => appendLog(job.id, log)).catch(() => { });
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
            await pool.query(`UPDATE provisioning_jobs SET gutenberg_trace = ?, status = 'deploying_content' WHERE id = ?`, [homepageBlocks, job.id]);
            const contentMeta = await injectWebsiteContent(fullDocRoot, schema, homepageBlocks, wpAdminUser, (log) => appendLog(job.id, log));
            await appendLog(job.id, `CONTENT_APPLIED source=${contentMeta.renderSource} length=${contentMeta.length} sha1=${contentMeta.sha1}`);
            await appendLog(job.id, "Content injected successfully on remote server");
        }
        else {
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
            typeof job.website_schema === "string"
                ? job.website_schema
                : JSON.stringify(job.website_schema),
        ]);
        // Write to audit log
        if (job.trace_id) {
            try {
                await pool.query(`INSERT INTO generation_audit_logs (trace_id, step, message, data) VALUES (?, ?, ?, ?)`, [
                    job.trace_id,
                    "provisioning_completed",
                    `Remote WordPress site provisioned at ${httpUrl}`,
                    JSON.stringify({
                        url: httpUrl,
                        jobId: job.id,
                        remoteHost: process.env.WP_SSH_HOST,
                    }),
                ]);
            }
            catch (e) {
                /* non-fatal */
            }
        }
        await appendLog(job.id, `Job completed! Remote WP site live at ${httpUrl} (SSL polling started)`);
    }
}
// ---------------------------------------------------------------------------
// Content Injection — runs all WP-CLI commands on the remote server
// ---------------------------------------------------------------------------
function fallbackImageForCategory(category) {
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
function esc(str) {
    return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
function ensureWordPressHtmlBlock(html) {
    const trimmed = (html || "").trim();
    if (!trimmed)
        return "";
    if (trimmed.includes("<!-- wp:html -->")) {
        return trimmed;
    }
    return `<!-- wp:html -->\n${trimmed}\n<!-- /wp:html -->`;
}
async function injectWebsiteContent(docRoot, schema, _homepageBlocks, adminUser, logCallback) {
    try {
        await logCallback("Cleaning up default WordPress content...");
        try {
            // Get IDs first and only delete if not empty to avoid "usage" errors
            const deleteCmd = `/usr/local/sbin/wp post list --post_type=post,page --format=ids --path="${docRoot}" --allow-root | xargs -r /usr/local/sbin/wp post delete --force --allow-root --path="${docRoot}"`;
            await runRemoteShellCommand(deleteCmd, logCallback);
        }
        catch (e) {
            /* non-fatal */
        }
        let content = "";
        const requireOpenRouterHtml = (process.env.REQUIRE_OPENROUTER_HTML || "").toLowerCase() === "true";
        const renderSource = schema?._renderSource ||
            (schema?._wordpressHtml ? "openrouter-html" : "local-builder");
        if (typeof schema?._wordpressHtml === "string" &&
            schema._wordpressHtml.trim()) {
            await logCallback("Using OpenRouter-generated WordPress homepage HTML...");
            content = ensureWordPressHtmlBlock(schema._wordpressHtml);
        }
        else {
            if (requireOpenRouterHtml) {
                throw new Error("OpenRouter HTML is required but was not generated. Check OpenRouter config/quota.");
            }
            await logCallback("OpenRouter HTML unavailable. Building homepage with local premium-site-builder...");
            const { buildPremiumPageContent } = await import("./premium-site-builder");
            content = buildPremiumPageContent(schema);
        }
        const contentHash = crypto.createHash("sha1").update(content).digest("hex");
        await logCallback(`Content source=${renderSource} length=${content.length} sha1=${contentHash}`);
        // Write content to temp file on remote server (avoids shell escaping limits)
        const tmpFile = `/tmp/ds_home_${Date.now()}.html`;
        await logCallback(`Writing to remote temp file: ${tmpFile}`);
        // Use a more robust way to write large content to remote file
        // We use base64 to avoid shell escaping issues with complex HTML
        const base64Content = Buffer.from(content).toString("base64");
        await runRemoteShellCommand(`echo "${base64Content}" | base64 -d > '${tmpFile}'`, logCallback);
        await logCallback("Creating Home page in WordPress...");
        const homePageIdOut = await runWpCommand(`post create --post_type=page --post_title="Home" --post_content="$(cat '${tmpFile}')" --post_status=publish --format=ids --user="${adminUser}"`, docRoot, logCallback);
        const homePageId = homePageIdOut.stdout.replace(/[^0-9]/g, "").trim();
        await runRemoteShellCommand(`rm -f '${tmpFile}'`, logCallback).catch(() => { });
        if (!homePageId || homePageId === "0") {
            throw new Error("Home page creation failed — invalid ID returned");
        }
        await logCallback(`Home page created with ID: ${homePageId}. Setting as front page...`);
        await runWpCommand(`option update show_on_front page`, docRoot, logCallback);
        await runWpCommand(`option update page_on_front ${homePageId}`, docRoot, logCallback);
        if (schema.brand?.businessName) {
            await runWpCommand(`option update blogname "${esc(schema.brand.businessName)}"`, docRoot, logCallback);
        }
        await runWpCommand(`rewrite structure "/%postname%/"`, docRoot, logCallback);
        await runWpCommand(`rewrite flush`, docRoot, logCallback);
        // Robust Media Import for Logo
        if (schema.brand?.logo) {
            try {
                await logCallback(`Attempting to import logo: ${schema.brand.logo}`);
                // Try to import directly first
                let mediaId = "";
                try {
                    const mediaOut = await runWpCommand(`media import "${schema.brand.logo}" --porcelain`, docRoot, logCallback);
                    mediaId = mediaOut.stdout.trim();
                }
                catch (e) {
                    // If direct import fails (likely due to missing extension), download to temp file first
                    await logCallback("Direct import failed. Retrying with local temp file...");
                    const ext = schema.brand.logo.toLowerCase().includes(".png")
                        ? "png"
                        : "jpg";
                    const remoteTmpMedia = `/tmp/ds_logo_${Date.now()}.${ext}`;
                    await runRemoteShellCommand(`curl -sL "${schema.brand.logo}" -o "${remoteTmpMedia}"`, logCallback);
                    const mediaOut = await runWpCommand(`media import "${remoteTmpMedia}" --porcelain`, docRoot, logCallback);
                    mediaId = mediaOut.stdout.trim();
                    await runRemoteShellCommand(`rm -f "${remoteTmpMedia}"`, logCallback).catch(() => { });
                }
                if (/^\d+$/.test(mediaId)) {
                    await logCallback(`Logo imported successfully (ID: ${mediaId}). Setting as site icon.`);
                    await runWpCommand(`option update site_icon ${mediaId}`, docRoot, logCallback);
                }
            }
            catch (e) {
                await logCallback(`Warning: logo import failed: ${e.message}`);
            }
        }
        await logCallback("Premium WordPress site injection complete ✓");
        return { renderSource, length: content.length, sha1: contentHash };
    }
    catch (error) {
        await logCallback(`CRITICAL ERROR during content injection: ${error.message}`);
        throw error;
    }
}
async function rollbackJob(job) {
    await appendLog(job.id, "[ROLLBACK] Starting remote cleanup...");
    const docRootBase = process.env.WP_DOCROOT_BASE || "/home/digigesf/public_html/sites";
    if (job.subdomain) {
        try {
            const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscoutwp.online";
            await deleteSubdomain(job.subdomain, rootDomain);
            await appendLog(job.id, `[ROLLBACK] Deleted subdomain ${job.subdomain}.${rootDomain}`);
        }
        catch (e) {
            await appendLog(job.id, `[ROLLBACK] Failed to delete subdomain: ${e.message}`);
            await appendLog(job.id, "[ROLLBACK] Tip: configure CPANEL_DELETE_SUBDOMAIN_CMD if UAPI delete is unavailable.");
        }
        // Delete remote directory via SSH
        const fullDocRoot = `${docRootBase}/${job.subdomain}`;
        try {
            await runRemoteShellCommand(`rm -rf "${fullDocRoot}"`, (log) => appendLog(job.id, log));
            await appendLog(job.id, `[ROLLBACK] Deleted remote directory: ${fullDocRoot}`);
        }
        catch (e) {
            await appendLog(job.id, `[ROLLBACK] Failed to delete remote directory: ${e.message}`);
        }
    }
    if (job.db_name) {
        try {
            await deleteDatabase(job.db_name);
            await appendLog(job.id, `[ROLLBACK] Deleted remote database: ${job.db_name}`);
        }
        catch (e) {
            await appendLog(job.id, `[ROLLBACK] Failed to delete database: ${e.message}`);
        }
    }
    if (job.db_user) {
        try {
            await deleteDatabaseUser(job.db_user);
            await appendLog(job.id, `[ROLLBACK] Deleted remote DB user: ${job.db_user}`);
        }
        catch (e) {
            await appendLog(job.id, `[ROLLBACK] Failed to delete DB user: ${e.message}`);
        }
    }
    await appendLog(job.id, "[ROLLBACK] Remote cleanup finished.");
}
// ---------------------------------------------------------------------------
// Public cleanup function
// ---------------------------------------------------------------------------
export async function deleteProvisionedWordPressSite(projectId) {
    console.log(`[Cleanup] Starting comprehensive remote deletion for project ${projectId}`);
    // 1. Fetch all related jobs to ensure we have the subdomain and DB names
    const [rows] = await pool.query(`SELECT * FROM provisioning_jobs WHERE project_id = ?`, [projectId]);
    if (!rows || rows.length === 0) {
        console.warn(`[Cleanup] No provisioning job found in DB for project ${projectId}. Attempting database-only purge.`);
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
        }
        catch (e) {
            console.error(`[Cleanup] Rollback failed for job ${job.id}: ${e.message}`);
            // Continue to next job or purge — we don't want to block the DB deletion
        }
    }
    // 3. Purge from local database tables
    try {
        const [del1] = await pool.query(`DELETE FROM isolated_deployments WHERE project_id = ?`, [projectId]);
        const [del2] = await pool.query(`DELETE FROM provisioning_jobs WHERE project_id = ?`, [projectId]);
        console.log(`[Cleanup] Project ${projectId} purged from local DB. Jobs removed: ${del2.affectedRows}`);
    }
    catch (e) {
        console.error(`[Cleanup] Failed to purge project ${projectId} from local DB: ${e.message}`);
        throw e;
    }
    console.log(`[Cleanup] Project ${projectId} remote resources and local records fully processed.`);
}
