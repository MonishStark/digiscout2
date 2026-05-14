import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

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

/**
 * Validates that WP-CLI is installed and accessible.
 */
export async function checkWpCliAvailable(): Promise<{
	available: boolean;
	version?: string;
	path?: string;
	error?: string;
}> {
	try {
		// Try 'wp --version' directly
		const { stdout: versionOut } = await execAsync("wp --version");
		const { stdout: pathOut } = await execAsync("which wp").catch(() => ({ stdout: "unknown" }));

		return {
			available: true,
			version: versionOut.trim(),
			path: pathOut.trim(),
		};
	} catch (error: any) {
		return {
			available: false,
			error: error.message || "WP-CLI not found or executable",
		};
	}
}

/**
 * Safely executes a WP-CLI command in a specific directory.
 */
export async function runWpCommand(
	command: string,
	documentRoot: string,
	logCallback?: (log: string) => void,
): Promise<WpCliResult> {
	if (!fs.existsSync(documentRoot)) {
		throw new Error(`Document root does not exist: ${documentRoot}`);
	}

	const cmd = `wp ${command} --path=${documentRoot}`;
	if (logCallback) {
		logCallback(`[WP-CLI] Executing: ${cmd.replace(/--dbpass=[^\s]+/, "--dbpass=***")}`);
	}
	fs.writeSync(2, `[WP-CLI] RUNNING: ${cmd.replace(/--dbpass=[^\s]+/, "--dbpass=***")}\n`);

	try {
		const { stdout, stderr } = await execAsync(cmd, {
			cwd: documentRoot,
			// Add safe memory limits for shared hosting WP-CLI
			env: { ...process.env, WP_CLI_PHP_ARGS: "-d memory_limit=256M" },
		});
		
		if (stdout.trim()) fs.writeSync(2, `[WP-CLI] STDOUT: ${stdout.trim().substring(0, 500)}\n`);
		if (stderr.trim()) fs.writeSync(2, `[WP-CLI] STDERR: ${stderr.trim()}\n`);

		if (logCallback && stdout.trim()) logCallback(`[WP-CLI] STDOUT: ${stdout.trim()}`);
		if (logCallback && stderr.trim()) logCallback(`[WP-CLI] STDERR: ${stderr.trim()}`);

		return { stdout, stderr };
	} catch (error: any) {
		const stdout = error.stdout || "";
		const stderr = error.stderr || "";
		
		fs.writeSync(2, `[WP-CLI] FAILED: ${error.message}\n`);
		if (stderr) fs.writeSync(2, `[WP-CLI] STDERR_OUT: ${stderr}\n`);

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

export async function downloadWordPressCore(documentRoot: string, logCallback?: (log: string) => void) {
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
		`config create --dbname="${dbName}" --dbuser="${dbUser}" --dbpass="${dbPass}" --dbhost="${dbHost}" --extra-php="define('WP_DEBUG', false); define('WP_DEBUG_LOG', false);"`,
		documentRoot,
		logCallback
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
	return runWpCommand(
		`core install --url="${url}" --title="${title}" --admin_user="${adminUser}" --admin_password="${adminPassword}" --admin_email="${adminEmail}" --skip-email`,
		documentRoot,
		logCallback
	);
}

export async function configurePermalinks(documentRoot: string, structure: string = "/%postname%/", logCallback?: (log: string) => void) {
	return runWpCommand(`rewrite structure "${structure}"`, documentRoot, logCallback);
}

export async function installTheme(documentRoot: string, themePathOrSlug: string, activate = true, logCallback?: (log: string) => void) {
	return runWpCommand(`theme install "${themePathOrSlug}" ${activate ? '--activate' : ''}`, documentRoot, logCallback);
}

export async function installPlugin(documentRoot: string, pluginSlug: string, activate = true, logCallback?: (log: string) => void) {
	return runWpCommand(`plugin install "${pluginSlug}" ${activate ? '--activate' : ''}`, documentRoot, logCallback);
}
