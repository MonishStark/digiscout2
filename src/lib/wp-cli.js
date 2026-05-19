import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
export class WpCliError extends Error {
    constructor(message, stdout, stderr, code) {
        super(message);
        this.name = "WpCliError";
        this.stdout = stdout;
        this.stderr = stderr;
        this.code = code;
    }
}
// ---------------------------------------------------------------------------
// SSH Remote Execution
// ---------------------------------------------------------------------------
function getSshConfig() {
    const host = process.env.WP_SSH_HOST;
    const port = process.env.WP_SSH_PORT || "22";
    const user = process.env.WP_SSH_USER;
    const keyPath = process.env.WP_SSH_KEY_PATH || "";
    const wpCliPath = process.env.WP_CLI_PATH || "wp";
    return { host, port, user, keyPath, wpCliPath };
}
/**
 * Wraps a remote shell command in an SSH call.
 * If WP_SSH_HOST is not set, falls back to running locally (dev mode).
 */
async function executeRemoteCommand(remoteCommand, logCallback) {
    const { host, port, user, keyPath, wpCliPath: _wpCliPath } = getSshConfig();
    let cmd;
    if (host && user) {
        // Escape single quotes inside the remote command for safe shell wrapping
        const escapedCmd = remoteCommand.replace(/'/g, `'\\''`);
        const keyFlag = keyPath ? `-i "${keyPath}"` : "";
        cmd = [
            "ssh",
            "-p", port,
            keyFlag,
            "-o StrictHostKeyChecking=no",
            "-o ConnectTimeout=30",
            "-o ServerAliveInterval=60",
            "-o BatchMode=yes",
            `${user}@${host}`,
            `'${escapedCmd}'`,
        ].filter(Boolean).join(" ");
        if (logCallback) {
            logCallback(`[SSH→${host}] ${remoteCommand.replace(/--dbpass=[^\s'"]+/g, "--dbpass=***").replace(/--admin_password=[^\s'"]+/g, "--admin_password=***")}`);
        }
        process.stderr.write(`[SSH] RUNNING: ${cmd.replace(/--dbpass=[^\s'"]+/g, "--dbpass=***").replace(/--admin_password=[^\s'"]+/g, "--admin_password=***")}\n`);
    }
    else {
        // Dev fallback: run locally if SSH not configured
        cmd = remoteCommand;
        if (logCallback)
            logCallback(`[LOCAL] ${cmd}`);
        process.stderr.write(`[LOCAL] RUNNING: ${cmd}\n`);
    }
    try {
        const { stdout, stderr } = await execAsync(cmd, {
            timeout: 180000, // 3 min max per command
            maxBuffer: 10 * 1024 * 1024, // 10MB
            env: { ...process.env },
        });
        if (stdout.trim()) {
            process.stderr.write(`[SSH] STDOUT: ${stdout.trim().substring(0, 1000)}\n`);
            if (logCallback)
                logCallback(`[WP-CLI] STDOUT: ${stdout.trim()}`);
        }
        if (stderr.trim()) {
            process.stderr.write(`[SSH] STDERR: ${stderr.trim()}\n`);
            if (logCallback)
                logCallback(`[WP-CLI] STDERR: ${stderr.trim()}`);
        }
        return { stdout, stderr };
    }
    catch (error) {
        const stdout = error.stdout || "";
        const stderr = error.stderr || "";
        process.stderr.write(`[SSH] FAILED: ${error.message}\n`);
        if (stderr)
            process.stderr.write(`[SSH] STDERR_OUT: ${stderr}\n`);
        if (logCallback) {
            logCallback(`[WP-CLI] FAILED: ${error.message}`);
            if (stdout)
                logCallback(`[WP-CLI] STDOUT: ${stdout}`);
            if (stderr)
                logCallback(`[WP-CLI] STDERR: ${stderr}`);
        }
        throw new WpCliError(`WP-CLI remote command failed: ${remoteCommand.substring(0, 120)}`, stdout, stderr, error.code);
    }
}
// ---------------------------------------------------------------------------
// WP-CLI Public API — all commands run remotely via SSH
// ---------------------------------------------------------------------------
/**
 * Checks WP-CLI is reachable on the remote server.
 */
export async function checkWpCliAvailable() {
    const { wpCliPath } = getSshConfig();
    try {
        const { stdout } = await executeRemoteCommand(`${wpCliPath} --version --allow-root`);
        return {
            available: true,
            version: stdout.trim(),
            path: wpCliPath,
        };
    }
    catch (e) {
        return {
            available: false,
            error: `WP-CLI not reachable on remote server: ${e.message}`,
        };
    }
}
/**
 * Core WP-CLI runner — executes wp COMMAND --path=REMOTE_PATH remotely.
 */
export async function runWpCommand(command, documentRoot, logCallback) {
    const { wpCliPath } = getSshConfig();
    // Build the full wp command with allow-root for shared hosting environments
    const fullCommand = `${wpCliPath} ${command} --path="${documentRoot}" --allow-root`;
    return executeRemoteCommand(fullCommand, logCallback);
}
// ---------------------------------------------------------------------------
// Higher-level WP-CLI helpers
// ---------------------------------------------------------------------------
export async function downloadWordPressCore(documentRoot, logCallback) {
    // Ensure the directory exists on the remote server first
    await executeRemoteCommand(`mkdir -p "${documentRoot}"`, logCallback);
    return runWpCommand("core download", documentRoot, logCallback);
}
export async function createWpConfig(documentRoot, dbName, dbUser, dbPass, dbHost = "localhost", logCallback) {
    return runWpCommand(`config create --dbname="${dbName}" --dbuser="${dbUser}" --dbpass="${dbPass}" --dbhost="${dbHost}" --extra-php="define('WP_DEBUG', false); define('WP_DEBUG_LOG', false);" --force`, documentRoot, logCallback);
}
export async function installWordPress(documentRoot, url, title, adminUser, adminPassword, adminEmail, logCallback) {
    // Title and password need special quoting for SSH — use printf to avoid shell escaping issues
    const safeTitle = title.replace(/'/g, `'\\''`);
    return runWpCommand(`core install --url="${url}" --title='${safeTitle}' --admin_user="${adminUser}" --admin_password="${adminPassword}" --admin_email="${adminEmail}" --skip-email`, documentRoot, logCallback);
}
export async function configurePermalinks(documentRoot, structure = "/%postname%/", logCallback) {
    return runWpCommand(`rewrite structure "${structure}"`, documentRoot, logCallback);
}
export async function installTheme(documentRoot, themePathOrSlug, activate = true, logCallback) {
    return runWpCommand(`theme install "${themePathOrSlug}" ${activate ? "--activate" : ""}`, documentRoot, logCallback);
}
export async function installPlugin(documentRoot, pluginSlug, activate = true, logCallback) {
    return runWpCommand(`plugin install "${pluginSlug}" ${activate ? "--activate" : ""}`, documentRoot, logCallback);
}
/**
 * Run an arbitrary shell command on the remote WP server (not WP-CLI).
 * Used for mkdir, rm -rf, file operations, etc.
 */
export async function runRemoteShellCommand(command, logCallback) {
    return executeRemoteCommand(command, logCallback);
}
