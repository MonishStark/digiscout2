/**
 * cpanel-uapi.ts
 *
 * Executes cPanel UAPI commands via SSH on the remote WP server.
 * This avoids the ECONNREFUSED issue where cPanel port 2083 is firewalled
 * from external IPs on Namecheap shared hosting.
 *
 * Instead of: HTTPS → server166.web-hosting.com:2083
 * We now use:  SSH  → digigesf@digiscoutwp.online "uapi Mysql create_database ..."
 *
 * @format
 */
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
// ---------------------------------------------------------------------------
// SSH config (same as wp-cli.ts)
// ---------------------------------------------------------------------------
function getSshPrefix() {
    const host = process.env.WP_SSH_HOST;
    const port = process.env.WP_SSH_PORT || "22";
    const user = process.env.WP_SSH_USER;
    const keyPath = process.env.WP_SSH_KEY_PATH || "";
    if (!host || !user) {
        throw new Error("WP_SSH_HOST and WP_SSH_USER must be set to run cPanel UAPI commands remotely.");
    }
    const keyFlag = keyPath ? `-i "${keyPath}"` : "";
    return [
        "ssh",
        "-p",
        port,
        keyFlag,
        "-o StrictHostKeyChecking=no",
        "-o ConnectTimeout=30",
        "-o BatchMode=yes",
        `${user}@${host}`,
    ]
        .filter(Boolean)
        .join(" ");
}
/**
 * Runs a cPanel UAPI command on the remote WP server via SSH.
 * Equivalent to: ssh wpserver "uapi --user=USERNAME Module function key=val ..."
 */
async function callUapiRemote(module, func, params) {
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
        let parsed;
        try {
            parsed = JSON.parse(stdout);
        }
        catch (e) {
            throw new Error(`cPanel UAPI returned invalid JSON: ${stdout.substring(0, 300)}`);
        }
        // cPanel UAPI response envelope: { result: { status: 1, data: ..., errors: [] } }
        const result = parsed?.result;
        if (!result) {
            throw new Error(`Unexpected cPanel UAPI response shape: ${JSON.stringify(parsed).substring(0, 300)}`);
        }
        if (result.status === 0 || (result.errors && result.errors.length > 0)) {
            const errMsg = Array.isArray(result.errors)
                ? result.errors.join(", ")
                : "Unknown cPanel error";
            throw new Error(`cPanel UAPI Error (${module}::${func}): ${errMsg}`);
        }
        process.stderr.write(`[cPanel-SSH] ${module}::${func} → OK\n`);
        return result.data;
    }
    catch (error) {
        // Re-throw with better context if it's not already a formatted error
        if (error.message?.includes("cPanel UAPI"))
            throw error;
        throw new Error(`cPanel SSH command failed (${module}::${func}): ${error.message}`);
    }
}
// ---------------------------------------------------------------------------
// Public API — mirrors the original cpanel-uapi.ts surface
// ---------------------------------------------------------------------------
export async function addSubdomain(subdomain, rootDomain, documentRoot) {
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
export async function deleteSubdomain(subdomain, rootDomain) {
    const fullDomain = `${subdomain}.${rootDomain}`;
    process.stderr.write(`[cPanel-SSH] Attempting to delete domain/subdomain: ${fullDomain}\n`);
    // 1. Try modern Domains::remove_domain first (best for newer cPanel)
    try {
        await callUapiRemote("Domains", "remove_domain", {
            domain: fullDomain,
        });
        return true;
    }
    catch (e) {
        console.warn(`[cPanel-SSH] Domains::remove_domain failed: ${e.message}. Trying legacy fallback...`);
    }
    // 2. Try legacy SubDomain::delsubdomain (standard fallback)
    try {
        await callUapiRemote("SubDomain", "delsubdomain", {
            domain: subdomain,
            rootdomain: rootDomain,
        });
        return true;
    }
    catch (e) {
        console.warn(`[cPanel-SSH] SubDomain::delsubdomain (sub part) failed: ${e.message}. Trying full domain variant...`);
    }
    // 3. Try legacy SubDomain::delsubdomain with the FULL domain (needed by some cPanel configs)
    try {
        await callUapiRemote("SubDomain", "delsubdomain", {
            domain: fullDomain,
            rootdomain: rootDomain,
        });
        return true;
    }
    catch (e) {
        console.warn(`[cPanel-SSH] SubDomain::delsubdomain (full part) failed: ${e.message}.`);
    }
    // 4. Try legacy SubDomain::delete_subdomain (another common variant)
    try {
        await callUapiRemote("SubDomain", "delete_subdomain", {
            domain: subdomain,
            rootdomain: rootDomain,
        });
        return true;
    }
    catch (e) {
        console.warn(`[cPanel-SSH] SubDomain::delete_subdomain failed: ${e.message}.`);
    }
    // 5. Try legacy cpapi2 fallback (for older/custom cPanel environments)
    try {
        const sshPrefix = getSshPrefix();
        const cpapi2Cmd = `cpapi2 --output=json SubDomain delsubdomain domain=${subdomain} rootdomain=${rootDomain}`;
        const fullCmd = `${sshPrefix} '${cpapi2Cmd}'`;
        process.stderr.write(`[cPanel-SSH] Attempting cpapi2 fallback for delsubdomain...\n`);
        await execAsync(fullCmd, { timeout: 60000 });
        return true;
    }
    catch (e) {
        console.warn(`[cPanel-SSH] cpapi2 SubDomain::delsubdomain failed: ${e.message}`);
    }
    // 6. Try DomainInfo::delete_domain (last resort)
    try {
        await callUapiRemote("DomainInfo", "delete_domain", {
            domain: fullDomain,
        });
        return true;
    }
    catch (e) {
        console.error(`[cPanel-SSH] All UAPI subdomain deletion methods failed for ${fullDomain}. Final error: ${e.message}`);
    }
    // 7. Optional custom fallback command for hosts without UAPI delete support
    const customCmd = process.env.CPANEL_DELETE_SUBDOMAIN_CMD;
    if (customCmd) {
        try {
            const sshPrefix = getSshPrefix();
            const resolved = customCmd
                .replace(/\{\{subdomain\}\}/g, subdomain)
                .replace(/\{\{rootDomain\}\}/g, rootDomain)
                .replace(/\{\{fullDomain\}\}/g, fullDomain);
            const fullCmd = `${sshPrefix} '${resolved}'`;
            process.stderr.write(`[cPanel-SSH] Attempting custom subdomain delete command for ${fullDomain}\n`);
            await execAsync(fullCmd, { timeout: 60000 });
            return true;
        }
        catch (e) {
            console.error(`[cPanel-SSH] Custom subdomain delete command failed for ${fullDomain}: ${e.message}`);
        }
    }
    throw new Error(`Subdomain deletion failed for ${fullDomain}. UAPI modules unavailable and no custom delete command succeeded.`);
}
export async function createDatabase(dbName) {
    return callUapiRemote("Mysql", "create_database", { name: dbName });
}
export async function deleteDatabase(dbName) {
    return callUapiRemote("Mysql", "delete_database", { name: dbName });
}
export async function createDatabaseUser(dbUser, password) {
    return callUapiRemote("Mysql", "create_user", {
        name: dbUser,
        password: password,
    });
}
export async function deleteDatabaseUser(dbUser) {
    return callUapiRemote("Mysql", "delete_user", { name: dbUser });
}
export async function setDatabasePrivileges(dbUser, dbName, privileges = "ALL PRIVILEGES") {
    return callUapiRemote("Mysql", "set_privileges_on_database", {
        user: dbUser,
        database: dbName,
        privileges: privileges,
    });
}
