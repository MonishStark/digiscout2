import https from "https";

interface UAPIResponse {
	status: number;
	errors: string[] | null;
	messages: string[] | null;
	data: any;
	metadata?: any;
}

function getCpanelConfig() {
	const host = process.env.CPANEL_HOST;
	const user = process.env.CPANEL_USERNAME;
	const token = process.env.CPANEL_API_TOKEN;

	if (!host || !user || !token) {
		throw new Error(
			"Missing cPanel configuration. Please check CPANEL_HOST, CPANEL_USERNAME, and CPANEL_API_TOKEN in your environment variables.",
		);
	}

	return {
		host,
		user,
		token,
		baseUrl: `https://${host}:2083/execute`,
		authHeader: `cpanel ${user}:${token}`,
	};
}

async function callUapi(
	module: string,
	func: string,
	params: Record<string, string>,
): Promise<any> {
	const { host, authHeader } = getCpanelConfig();

	const path = `/execute/${module}/${func}`;
	const query = new URLSearchParams(params).toString();
	const fullPath = query ? `${path}?${query}` : path;

	return new Promise((resolve, reject) => {
		const req = https.get({
			hostname: host,
			port: 2083,
			path: fullPath,
			headers: {
				Authorization: authHeader,
			},
			timeout: 30000
		}, (res) => {
			let data = "";
			res.on("data", (chunk) => data += chunk);
			res.on("end", () => {
				if (res.statusCode && res.statusCode >= 400) {
					return reject(new Error(`cPanel API HTTP Error: ${res.statusCode} ${data}`));
				}
				try {
					const json = JSON.parse(data) as UAPIResponse;
					if (json.errors && json.errors.length > 0) {
						reject(new Error(`cPanel UAPI Error (${module}::${func}): ${json.errors.join(", ")}`));
					} else if (json.status === 0) {
						reject(new Error(`cPanel UAPI Error (${module}::${func}): ${json.errors?.join(", ") || "Unknown failure"}`));
					} else {
						resolve(json.data);
					}
				} catch (e) {
					reject(new Error(`Failed to parse cPanel response: ${data}`));
				}
			});
		});

		req.on("error", (e) => reject(e));
		req.on("timeout", () => {
			req.destroy();
			reject(new Error("cPanel API Timeout"));
		});
	});
}

export async function addSubdomain(
	subdomain: string,
	rootDomain: string,
	documentRoot: string,
) {
	return callUapi("SubDomain", "addsubdomain", {
		domain: subdomain,
		rootdomain: rootDomain,
		dir: documentRoot,
	});
}

export async function deleteSubdomain(subdomain: string, rootDomain: string) {
	const fullDomain = `${subdomain}.${rootDomain}`;
	try {
		// Try the modern Domains::remove_domain first
		return await callUapi("Domains", "remove_domain", {
			domain: fullDomain,
		});
	} catch (e: any) {
		console.warn(`[cPanel] Domains::remove_domain failed, trying fallback: ${e.message}`);
		try {
			// Try the legacy SubDomain::delsubdomain
			return await callUapi("SubDomain", "delsubdomain", {
				domain: subdomain,
				rootdomain: rootDomain,
			});
		} catch (e2: any) {
			console.warn(`[cPanel] SubDomain::delsubdomain failed: ${e2.message}`);
			throw e; // Throw original error
		}
	}
}

export async function createDatabase(dbName: string) {
	return callUapi("Mysql", "create_database", {
		name: dbName,
	});
}

export async function deleteDatabase(dbName: string) {
	return callUapi("Mysql", "delete_database", {
		name: dbName,
	});
}

export async function createDatabaseUser(dbUser: string, password: string) {
	return callUapi("Mysql", "create_user", {
		name: dbUser,
		password: password,
	});
}

export async function deleteDatabaseUser(dbUser: string) {
	return callUapi("Mysql", "delete_user", {
		name: dbUser,
	});
}

export async function setDatabasePrivileges(
	dbUser: string,
	dbName: string,
	privileges: string = "ALL PRIVILEGES",
) {
	return callUapi("Mysql", "set_privileges_on_database", {
		user: dbUser,
		database: dbName,
		privileges: privileges,
	});
}
