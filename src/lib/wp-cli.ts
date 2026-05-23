import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";



const execAsync = promisify(exec);

export interface WpCliResult {
	stdout: string;
	stderr: string;
}

export class WpCliError extends Error {
	stdout: string;
	stderr: string;
	code?: number | null;

	constructor(message: string, stdout: string, stderr: string, code?: number | null) {
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
async function executeRemoteCommand(
	remoteCommand: string,
	logCallback?: (log: string) => void,
): Promise<WpCliResult> {
	const { host, port, user, keyPath, wpCliPath: _wpCliPath } = getSshConfig();

	let cmd: string;

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
	} else {
		// Dev fallback: run locally if SSH not configured
		cmd = remoteCommand;
		if (logCallback) logCallback(`[LOCAL] ${cmd}`);
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
			if (logCallback) logCallback(`[WP-CLI] STDOUT: ${stdout.trim()}`);
		}
		if (stderr.trim()) {
			process.stderr.write(`[SSH] STDERR: ${stderr.trim()}\n`);
			if (logCallback) logCallback(`[WP-CLI] STDERR: ${stderr.trim()}`);
		}

		return { stdout, stderr };
	} catch (error: any) {
		const stdout = error.stdout || "";
		const stderr = error.stderr || "";

		process.stderr.write(`[SSH] FAILED: ${error.message}\n`);
		if (stderr) process.stderr.write(`[SSH] STDERR_OUT: ${stderr}\n`);

		if (logCallback) {
			logCallback(`[WP-CLI] FAILED: ${error.message}`);
			if (stdout) logCallback(`[WP-CLI] STDOUT: ${stdout}`);
			if (stderr) logCallback(`[WP-CLI] STDERR: ${stderr}`);
		}

		throw new WpCliError(
			`WP-CLI remote command failed: ${remoteCommand.substring(0, 120)}`,
			stdout,
			stderr,
			error.code,
		);
	}
}

// ---------------------------------------------------------------------------
// WP-CLI Public API — all commands run remotely via SSH
// ---------------------------------------------------------------------------

/**
 * Checks WP-CLI is reachable on the remote server.
 */
export async function checkWpCliAvailable(): Promise<{
	available: boolean;
	version?: string;
	path?: string;
	error?: string;
}> {
	const { wpCliPath } = getSshConfig();
	try {
		const { stdout } = await executeRemoteCommand(`${wpCliPath} --version --allow-root`);
		return {
			available: true,
			version: stdout.trim(),
			path: wpCliPath,
		};
	} catch (e: any) {
		return {
			available: false,
			error: `WP-CLI not reachable on remote server: ${e.message}`,
		};
	}
}

/**
 * Core WP-CLI runner — executes wp COMMAND --path=REMOTE_PATH remotely.
 */
export async function runWpCommand(
	command: string,
	documentRoot: string,
	logCallback?: (log: string) => void,
): Promise<WpCliResult> {
	const { wpCliPath } = getSshConfig();
	// Build the full wp command with allow-root for shared hosting environments
	const fullCommand = `${wpCliPath} ${command} --path="${documentRoot}" --allow-root`;
	return executeRemoteCommand(fullCommand, logCallback);
}

// ---------------------------------------------------------------------------
// Higher-level WP-CLI helpers
// ---------------------------------------------------------------------------

export async function downloadWordPressCore(documentRoot: string, logCallback?: (log: string) => void) {
	// Ensure the directory exists on the remote server first
	await executeRemoteCommand(`mkdir -p "${documentRoot}"`, logCallback);
	return runWpCommand("core download", documentRoot, logCallback);
}

export async function createWpConfig(
	documentRoot: string,
	dbName: string,
	dbUser: string,
	dbPass: string,
	dbHost: string = "localhost",
	logCallback?: (log: string) => void,
) {
	return runWpCommand(
		`config create --dbname="${dbName}" --dbuser="${dbUser}" --dbpass="${dbPass}" --dbhost="${dbHost}" --extra-php="define('WP_DEBUG', false); define('WP_DEBUG_LOG', false);" --force`,
		documentRoot,
		logCallback,
	);
}

export async function installWordPress(
	documentRoot: string,
	url: string,
	title: string,
	adminUser: string,
	adminPassword: string,
	adminEmail: string,
	logCallback?: (log: string) => void,
) {
	// Title and password need special quoting for SSH — use printf to avoid shell escaping issues
	const safeTitle = title.replace(/'/g, `'\\''`);
	return runWpCommand(
		`core install --url="${url}" --title='${safeTitle}' --admin_user="${adminUser}" --admin_password="${adminPassword}" --admin_email="${adminEmail}" --skip-email`,
		documentRoot,
		logCallback,
	);
}

export async function configurePermalinks(
	documentRoot: string,
	structure: string = "/%postname%/",
	logCallback?: (log: string) => void,
) {
	return runWpCommand(`rewrite structure "${structure}"`, documentRoot, logCallback);
}

export async function installTheme(
	documentRoot: string,
	themePathOrSlug: string,
	activate = true,
	logCallback?: (log: string) => void,
) {
	return runWpCommand(
		`theme install "${themePathOrSlug}" ${activate ? "--activate" : ""}`,
		documentRoot,
		logCallback,
	);
}

export async function installPlugin(
	documentRoot: string,
	pluginSlug: string,
	activate = true,
	logCallback?: (log: string) => void,
) {
	return runWpCommand(
		`plugin install "${pluginSlug}" ${activate ? "--activate" : ""}`,
		documentRoot,
		logCallback,
	);
}

/**
 * Run an arbitrary shell command on the remote WP server (not WP-CLI).
 * Used for mkdir, rm -rf, file operations, etc.
 */
export async function runRemoteShellCommand(
	command: string,
	logCallback?: (log: string) => void,
): Promise<WpCliResult> {
	return executeRemoteCommand(command, logCallback);
}

/**
 * Copies a local file to a remote path via SSH standard input redirection.
 * Falls back to local filesystem copy if SSH is not configured.
 */
export async function copyFileToRemote(
	localPath: string,
	remotePath: string,
	logCallback?: (log: string) => void,
): Promise<void> {
	const { host, port, user, keyPath } = getSshConfig();

	if (!host || !user) {
		// Local mode - copy file locally
		if (logCallback) logCallback(`[LOCAL COPY] ${localPath} -> ${remotePath}`);
		fs.copyFileSync(localPath, remotePath);
		return;
	}

	const keyFlag = keyPath ? `-i "${keyPath}"` : "";
	// Escape remotePath for safety in remote command
	const escapedRemotePath = remotePath.replace(/'/g, `'\\''`);
	
	const sshCmd = [
		"ssh",
		"-p", port,
		keyFlag,
		"-o StrictHostKeyChecking=no",
		"-o ConnectTimeout=30",
		"-o ServerAliveInterval=60",
		"-o BatchMode=yes",
		`${user}@${host}`,
		`'cat > "${escapedRemotePath}"'`,
	].filter(Boolean).join(" ");

	if (logCallback) {
		logCallback(`[SSH COPY] ${localPath} -> ${user}@${host}:${remotePath}`);
	}

	return new Promise<void>((resolve, reject) => {
		const child = exec(sshCmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
			if (error) {
				if (logCallback) {
					logCallback(`[SSH COPY FAILED] error: ${error.message}`);
					if (stderr) logCallback(`[SSH COPY FAILED stderr] ${stderr}`);
				}
				reject(new Error(`SSH copy failed: ${error.message} (stderr: ${stderr})`));
			} else {
				resolve();
			}
		});

		const readStream = fs.createReadStream(localPath);
		readStream.on("error", (err) => {
			child.kill();
			reject(err);
		});
		readStream.pipe(child.stdin!);
	});
}

