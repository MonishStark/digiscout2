/**
 * cpanel-uapi.ts
 *
 * Executes cPanel UAPI commands via SSH on the remote WP server.
 * This avoids the ECONNREFUSED issue where cPanel port 2083 is firewalled
 * from external IPs on Namecheap shared hosting.
 *
 * Instead of: HTTPS → server166.web-hosting.com:2083
 * We now use:  SSH  → digigesf@digiscoutwp.online "uapi Mysql create_database ..."
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// SSH config (same as wp-cli.ts)
// ---------------------------------------------------------------------------

function getSshPrefix(): string {
	const host = process.env.WP_SSH_HOST;
	const port = process.env.WP_SSH_PORT || "22";
	const user = process.env.WP_SSH_USER;
	const keyPath = process.env.WP_SSH_KEY_PATH || "";

	if (!host || !user) {
		throw new Error(
			"WP_SSH_HOST and WP_SSH_USER must be set to run cPanel UAPI commands remotely.",
		);
	}

	const keyFlag = keyPath ? `-i "${keyPath}"` : "";
	return [
		"ssh",
		"-p", port,
		keyFlag,
		"-o StrictHostKeyChecking=no",
		"-o ConnectTimeout=30",
		"-o BatchMode=yes",
		`${user}@${host}`,
	].filter(Boolean).join(" ");
}

/**
 * Runs a cPanel UAPI command on the remote WP server via SSH.
 * Equivalent to: ssh wpserver "uapi --user=USERNAME Module function key=val ..."
 */
async function callUapiRemote(
	module: string,
	func: string,
	params: Record<string, string>,
): Promise<any> {
	const paramStr = Object.entries(params)
		.map(([k, v]) => `${k}=${v.replace(/'/g, "\\'")}`)
		.join(" ");

	const uapiCmd = `uapi --output=json ${module} ${func} ${paramStr}`;
	const sshPrefix = getSshPrefix();
	const fullCmd = `${sshPrefix} '${uapiCmd}'`;

	process.stderr.write(`[cPanel-SSH] ${module}::${func} ${paramStr}\n`);

	try {
		const { stdout, stderr } = await execAsync(fullCmd, { timeout: 60000 });

		if (stderr.trim()) {
			process.stderr.write(`[cPanel-SSH] STDERR: ${stderr.trim()}\n`);
		}

		let parsed: any;
		try {
			parsed = JSON.parse(stdout);
		} catch (e) {
			throw new Error(`cPanel UAPI returned invalid JSON: ${stdout.substring(0, 300)}`);
		}

		// cPanel UAPI response envelope: { result: { status: 1, data: ..., errors: [] } }
		const result = parsed?.result;
		if (!result) {
			throw new Error(`Unexpected cPanel UAPI response shape: ${JSON.stringify(parsed).substring(0, 300)}`);
		}

		if (result.status === 0 || (result.errors && result.errors.length > 0)) {
			const errMsg = Array.isArray(result.errors) ? result.errors.join(", ") : "Unknown cPanel error";
			throw new Error(`cPanel UAPI Error (${module}::${func}): ${errMsg}`);
		}

		process.stderr.write(`[cPanel-SSH] ${module}::${func} → OK\n`);
		return result.data;
	} catch (error: any) {
		// Re-throw with better context if it's not already a formatted error
		if (error.message?.includes("cPanel UAPI")) throw error;
		throw new Error(`cPanel SSH command failed (${module}::${func}): ${error.message}`);
	}
}

// ---------------------------------------------------------------------------
// Public API — mirrors the original cpanel-uapi.ts surface
// ---------------------------------------------------------------------------

export async function addSubdomain(
	subdomain: string,
	rootDomain: string,
	documentRoot: string,
) {
	// documentRoot relative to home dir for cPanel (strip /home/user/ prefix)
	const cpanelUser = process.env.CPANEL_USERNAME || "";
	const homePrefix = `/home/${cpanelUser}/`;
	const relativeDir = documentRoot.startsWith(homePrefix)
		? documentRoot.slice(homePrefix.length)
		: documentRoot;

	return callUapiRemote("SubDomain", "addsubdomain", {
		domain: subdomain,
		rootdomain: rootDomain,
		dir: relativeDir,
	});
}

export async function deleteSubdomain(subdomain: string, rootDomain: string) {
	const fullDomain = `${subdomain}.${rootDomain}`;
	try {
		return await callUapiRemote("Domains", "remove_domain", {
			domain: fullDomain,
		});
	} catch (e: any) {
		console.warn(`[cPanel-SSH] Domains::remove_domain failed: ${e.message}. Trying legacy fallback...`);
		return await callUapiRemote("SubDomain", "delsubdomain", {
			domain: subdomain,
			rootdomain: rootDomain,
		});
	}
}

export async function createDatabase(dbName: string) {
	return callUapiRemote("Mysql", "create_database", { name: dbName });
}

export async function deleteDatabase(dbName: string) {
	return callUapiRemote("Mysql", "delete_database", { name: dbName });
}

export async function createDatabaseUser(dbUser: string, password: string) {
	return callUapiRemote("Mysql", "create_user", {
		name: dbUser,
		password: password,
	});
}

export async function deleteDatabaseUser(dbUser: string) {
	return callUapiRemote("Mysql", "delete_user", { name: dbUser });
}

export async function setDatabasePrivileges(
	dbUser: string,
	dbName: string,
	privileges: string = "ALL PRIVILEGES",
) {
	return callUapiRemote("Mysql", "set_privileges_on_database", {
		user: dbUser,
		database: dbName,
		privileges: privileges,
	});
}
