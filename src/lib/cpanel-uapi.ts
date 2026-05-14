import fetch from "node-fetch";

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
		baseUrl: `https://${host}:2083/execute`,
		authHeader: `cpanel ${user}:${token}`,
	};
}

async function callUapi(
	module: string,
	func: string,
	params: Record<string, string>,
): Promise<any> {
	const { baseUrl, authHeader } = getCpanelConfig();

	const url = new URL(`${baseUrl}/${module}/${func}`);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.append(key, value);
	}

	const response = await fetch(url.toString(), {
		method: "GET", // UAPI generally accepts GET for execute unless strictly required
		headers: {
			Authorization: authHeader,
		},
	});

	if (!response.ok) {
		throw new Error(`cPanel API HTTP Error: ${response.status} ${response.statusText}`);
	}

	const json = (await response.json()) as UAPIResponse;

	if (json.errors && json.errors.length > 0) {
		throw new Error(`cPanel UAPI Error (${module}::${func}): ${json.errors.join(", ")}`);
	}
	
	if (json.status === 0) {
	    // Sometimes cPanel returns status 0 with an error in metadata
	    throw new Error(`cPanel UAPI Error (${module}::${func}): ${json.errors?.join(", ") || "Unknown failure"}`);
	}

	return json.data;
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
	return callUapi("SubDomain", "delete_subdomain", {
		domain: subdomain,
		rootdomain: rootDomain,
	});
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
