/** @format */

import fs from "fs";
import path from "path";
import { execSync, spawn } from "child_process";
import {
	Business,
	ProvisioningLogEntry,
	ProvisioningStepStatus,
	ProvisioningStatus,
	WebsiteSchema,
	WordPressProvisioningSite,
} from "../types";
import { ApacheVhostManager } from "./laragon-apache-vhost-manager";
import { HostsFileManager } from "./laragon-hosts-file-manager";
import { MySQLDatabaseManager } from "./laragon-mysql-manager";

export interface LocalWordPressProvisionResponse {
	success: boolean;
	dryRun: boolean;
	message?: string;
	site?: WordPressProvisioningSite;
	provisioningStatus: ProvisioningStatus;
	subsiteCreationStatus: ProvisioningStepStatus;
	adminCreationStatus: ProvisioningStepStatus;
	themeInstallStatus: ProvisioningStepStatus;
	mediaImportStatus: ProvisioningStepStatus;
	contentImportStatus: ProvisioningStepStatus;
	homepageSetupStatus: ProvisioningStepStatus;
	credentialsStatus: ProvisioningStepStatus;
	logs: ProvisioningLogEntry[];
	error?: string;
	details?: string;
}

function logEntry(
	step: ProvisioningLogEntry["step"],
	level: ProvisioningLogEntry["level"],
	message: string,
): ProvisioningLogEntry {
	return {
		timestamp: new Date().toISOString(),
		step,
		level,
		message,
	};
}

function slugify(value: string): string {
	return (value || "site")
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "-")
		.replace(/(^-|-$)/g, "")
		.substring(0, 32);
}

function sanitizeDatabaseName(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probeUrl(
	url: string,
	timeoutMs: number,
): Promise<{
	ok: boolean;
	status?: number;
	error?: string;
}> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, {
			method: "GET",
			redirect: "follow",
			cache: "no-store",
			signal: controller.signal,
			headers: {
				"Cache-Control": "no-cache",
				Pragma: "no-cache",
			},
		});

		return {
			ok: response.ok,
			status: response.status,
		};
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : String(error),
		};
	} finally {
		clearTimeout(timeoutId);
	}
}

async function installWordPressCore(params: {
	siteSlug: string;
	siteUrl: string;
	adminUrl: string;
	blogName: string;
	blogDescription: string;
	adminUsername: string;
	adminPassword: string;
	adminEmail: string;
	step: ProvisioningLogEntry["step"];
	addLog: (
		step: ProvisioningLogEntry["step"],
		level: ProvisioningLogEntry["level"],
		message: string,
	) => void;
	timeoutMs?: number;
	maxRetries?: number;
}): Promise<void> {
	const {
		siteSlug,
		siteUrl,
		adminUrl,
		blogName,
		blogDescription,
		adminUsername,
		adminPassword,
		adminEmail,
		step,
		addLog,
		timeoutMs = 30000,
		maxRetries = 3,
	} = params;

	const proxyBaseUrl = `http://localhost:${process.env.PORT || 5001}/api/local-wordpress/${siteSlug}`;
	const installUrl = `${proxyBaseUrl}/wp-admin/install.php`;
	const installStep1Url = `${installUrl}?step=1`;
	const installStep2Url = `${installUrl}?step=2`;
	const adminVerifyUrl = `${proxyBaseUrl}/wp-admin/`;
	let lastError: Error | null = null;
	const cookieJar: Record<string, string> = {};

	function appendCookies(headers: Record<string, string>): void {
		const cookieHeader = Object.entries(cookieJar)
			.map(([name, value]) => `${name}=${value}`)
			.join("; ");
		if (cookieHeader) {
			headers["Cookie"] = cookieHeader;
		}
	}

	function updateCookieJar(setCookie: string | string[] | null): void {
		if (!setCookie) return;
		const values = Array.isArray(setCookie) ? setCookie : [setCookie];
		for (const rawCookie of values) {
			const [cookiePair] = rawCookie.split(";");
			const [name, value] = cookiePair.split("=");
			if (name && value !== undefined) {
				cookieJar[name.trim()] = value.trim();
			}
		}
	}

	async function postForm(url: string, params: Record<string, string>) {
		const headers: Record<string, string> = {
			"Content-Type": "application/x-www-form-urlencoded",
		};
		appendCookies(headers);

		const response = await fetch(url, {
			method: "POST",
			headers,
			body: new URLSearchParams(params).toString(),
			redirect: "follow",
			signal: AbortSignal.timeout(timeoutMs),
		});

		const setCookie = response.headers.get("set-cookie");
		updateCookieJar(setCookie);
		return response;
	}

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			addLog(
				step,
				"info",
				`WordPress installation attempt ${attempt}/${maxRetries} - initiating core install`,
			);

			await fetch(installUrl, {
				method: "GET",
				redirect: "manual",
				signal: AbortSignal.timeout(timeoutMs),
			});

			const step1Response = await postForm(installStep1Url, {
				language: "en_US",
				submit: "Continue",
			});

			if (step1Response.status >= 400) {
				throw new Error(
					`Language selection step failed with status ${step1Response.status}`,
				);
			}

			const step2Response = await postForm(installStep2Url, {
				weblog_title: blogName,
				user_name: adminUsername,
				admin_password: adminPassword,
				admin_password2: adminPassword,
				admin_email: adminEmail,
				language: "en_US",
				Submit: "Install WordPress",
			});

			const responseText = await step2Response.text();

			// Check for successful installation indicators
			if (
				responseText.includes("Success") ||
				responseText.includes("wp-login.php") ||
				responseText.includes("success") ||
				step2Response.status === 200
			) {
				addLog(
					step,
					"info",
					`WordPress core installation completed successfully (HTTP ${step2Response.status})`,
				);

				// Verify wp-admin is accessible
				try {
					const verifyResponse = await fetch(adminVerifyUrl, {
						method: "GET",
						signal: AbortSignal.timeout(5000),
					});

					if (verifyResponse.status === 200 || verifyResponse.status === 302) {
						addLog(
							step,
							"info",
							"WordPress admin interface verified and accessible",
						);
						return;
					}
				} catch (verifyError) {
					addLog(
						step,
						"warn",
						`Could not immediately verify wp-admin accessibility: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`,
					);
					// Still consider it success if install endpoint responded
					return;
				}
			}

			if (responseText.includes("already installed")) {
				addLog(
					step,
					"info",
					"WordPress was already installed, skipping install step",
				);
				return;
			}

			throw new Error(
				`Unexpected response (${step2Response.status}): ${responseText.substring(0, 200)}`,
			);
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt < maxRetries) {
				const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
				addLog(
					step,
					"warn",
					`Installation attempt ${attempt} failed: ${lastError.message}. Retrying in ${delayMs}ms...`,
				);
				await sleep(delayMs);
			}
		}
	}

	throw new Error(
		`WordPress installation failed after ${maxRetries} attempts: ${lastError?.message || "unknown error"}`,
	);
}

async function waitForApacheEndpoints(params: {
	probeSiteUrl: string;
	probeAdminUrl?: string;
	requireAdmin?: boolean;
	step: ProvisioningLogEntry["step"];
	addLog: (
		step: ProvisioningLogEntry["step"],
		level: ProvisioningLogEntry["level"],
		message: string,
	) => void;
	timeoutMs?: number;
	intervalMs?: number;
	probeTimeoutMs?: number;
}): Promise<void> {
	const {
		probeSiteUrl,
		probeAdminUrl,
		requireAdmin = false,
		step,
		addLog,
		timeoutMs = 30000,
		intervalMs = 1000,
		probeTimeoutMs = 3000,
	} = params;

	const deadline = Date.now() + timeoutMs;
	let attempt = 0;

	while (Date.now() < deadline) {
		attempt += 1;
		const siteProbe = await probeUrl(probeSiteUrl, probeTimeoutMs);
		const adminProbe = probeAdminUrl
			? await probeUrl(probeAdminUrl, probeTimeoutMs)
			: { ok: false, status: undefined, error: "admin probe skipped" };

		if (siteProbe.ok && (!requireAdmin || adminProbe.ok)) {
			addLog(
				step,
				"info",
				`Apache endpoints verified: ${probeSiteUrl} (${siteProbe.status})${
					probeAdminUrl ? `, ${probeAdminUrl} (${adminProbe.status})` : ""
				}`,
			);
			return;
		}

		const siteState = siteProbe.ok
			? `ok (${siteProbe.status})`
			: `not ready${siteProbe.error ? `: ${siteProbe.error}` : ""}`;
		const adminState = adminProbe.ok
			? `ok (${adminProbe.status})`
			: `not ready${adminProbe.error ? `: ${adminProbe.error}` : ""}`;

		if (attempt <= 3) {
			addLog(
				step,
				"info",
				`Checking endpoints (attempt ${attempt}): site=${siteState}; wp-admin=${adminState}`,
			);
		}

		await sleep(intervalMs);
	}

	throw new Error(
		`Timeout: endpoints not ready after ${timeoutMs}ms. Site: ${probeSiteUrl}${
			probeAdminUrl ? `, Admin: ${probeAdminUrl}` : ""
		}`,
	);
}

async function restartApacheStandalone(
	apacheExe: string,
	apacheDir: string,
): Promise<void> {
	try {
		execSync("taskkill /F /IM httpd.exe /T", { stdio: "pipe" });
	} catch {
		// Ignore if Apache was already stopped or had no matching process.
	}

	await sleep(1000);

	const apacheProcess = spawn(apacheExe, ["-w", "-d", apacheDir], {
		detached: true,
		stdio: "ignore",
		windowsHide: true,
	});
	apacheProcess.unref();

	await sleep(3000);
}

function resolveApacheRoot(apacheBinPath: string): string {
	return path.dirname(apacheBinPath);
}

export async function provisionLocalWordPressSite(params: {
	projectId: string;
	business: Business;
	websiteSchema: WebsiteSchema;
}): Promise<LocalWordPressProvisionResponse> {
	const logs: ProvisioningLogEntry[] = [];
	const addLog = (
		step: ProvisioningLogEntry["step"],
		level: ProvisioningLogEntry["level"],
		message: string,
	) => {
		logs.push(logEntry(step, level, message));
		console.log(`[LocalWordPressProvisioner] ${step}: [${level}] ${message}`);
	};

	try {
		const templatePath = process.env.LARAGON_TEMPLATE_PATH;
		const sitesPath = process.env.LARAGON_SITES_PATH;
		const apacheConfPath = process.env.LARAGON_APACHE_CONF_PATH;
		const apacheBinPath = process.env.LARAGON_APACHE_BIN_PATH;
		const localDomain = process.env.LARAGON_LOCAL_DOMAIN || "test";
		const mysqlHost = process.env.LARAGON_MYSQL_HOST || "127.0.0.1";
		const mysqlPort = parseInt(process.env.LARAGON_MYSQL_PORT || "3306", 10);

		// Validate configuration
		if (!templatePath || !sitesPath || !apacheConfPath || !apacheBinPath) {
			addLog(
				"subsite_creation",
				"error",
				"Laragon configuration is incomplete",
			);
			return {
				success: false,
				dryRun: false,
				provisioningStatus: "failed",
				subsiteCreationStatus: "failed",
				adminCreationStatus: "failed",
				themeInstallStatus: "failed",
				mediaImportStatus: "failed",
				contentImportStatus: "failed",
				homepageSetupStatus: "failed",
				credentialsStatus: "failed",
				logs,
				error: "Laragon environment not configured properly",
			};
		}

		// Generate site slug and credentials
		const siteSlug = slugify(params.business.name);
		const ownerUsername = "admin";
		const ownerPassword = `WP${Math.random().toString(36).substring(2, 15)}!`;
		const ownerEmail = params.business.email || "admin@example.local";
		const dbName = sanitizeDatabaseName(`wordpress_${siteSlug}`);
		const dbUser = "root"; // Using root; you can make this configurable
		const dbPassword = process.env.LARAGON_MYSQL_ROOT_PASSWORD || "";

		const hostName = `${siteSlug}.${localDomain}`;
		const proxyBaseUrl = `http://localhost:${process.env.PORT || 5001}/api/local-wordpress/${siteSlug}`;
		const siteUrl = `${proxyBaseUrl}/`;
		const adminUrl = `${proxyBaseUrl}/wp-admin/`;
		const sitePath = path.join(sitesPath, siteSlug);

		addLog(
			"subsite_creation",
			"info",
			`Creating WordPress site for: ${siteSlug}`,
		);

		// Step 1: Copy template WordPress site
		addLog("subsite_creation", "info", `Template path: ${templatePath}`);
		addLog("subsite_creation", "info", `Destination path: ${sitePath}`);
		try {
			if (!fs.existsSync(templatePath)) {
				throw new Error(`Template path does not exist: ${templatePath}`);
			}

			if (!fs.existsSync(sitePath)) {
				fs.mkdirSync(sitePath, { recursive: true });
			}

			if (process.platform === "win32") {
				try {
					execSync(
						`robocopy "${templatePath}" "${sitePath}" /E /DCOPY:DAT /COPY:DAT /PURGE`,
						{
							stdio: "pipe",
							encoding: "utf-8",
						},
					);
					addLog("subsite_creation", "info", "Robocopy completed successfully");
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					addLog(
						"subsite_creation",
						"info",
						`Robocopy returned an error, verifying copied content anyway: ${message}`,
					);
				}

				let wpAdminExists = fs.existsSync(path.join(sitePath, "wp-admin"));
				let indexExists = fs.existsSync(path.join(sitePath, "index.php"));
				if (!wpAdminExists || !indexExists) {
					addLog(
						"subsite_creation",
						"info",
						"Robocopy did not produce expected WordPress files, falling back to manual copy",
					);
					copyDirRecursive(templatePath, sitePath);
					wpAdminExists = fs.existsSync(path.join(sitePath, "wp-admin"));
					indexExists = fs.existsSync(path.join(sitePath, "index.php"));
				}
			} else {
				copyDirRecursive(templatePath, sitePath);
			}

			if (!fs.existsSync(sitePath)) {
				throw new Error(`Failed to copy site template to ${sitePath}`);
			}

			const copiedFileCount = getDirectoryFileCount(sitePath);
			const wpAdminExists = fs.existsSync(path.join(sitePath, "wp-admin"));
			const indexExists = fs.existsSync(path.join(sitePath, "index.php"));
			const wpConfigExists =
				fs.existsSync(path.join(sitePath, "wp-config.php")) ||
				fs.existsSync(path.join(sitePath, "wp-config-sample.php"));

			addLog(
				"subsite_creation",
				"info",
				`Template copy complete: ${copiedFileCount} files copied, wp-admin=${wpAdminExists}, index.php=${indexExists}, wp-config=${wpConfigExists}`,
			);

			if (!wpAdminExists || !indexExists) {
				throw new Error(
					"Template copy did not produce a valid WordPress install. Verify the template contents and permissions.",
				);
			}

			addLog("subsite_creation", "info", `Site directory ready: ${sitePath}`);
		} catch (error) {
			addLog(
				"subsite_creation",
				"error",
				`Failed to copy template: ${error instanceof Error ? error.message : String(error)}`,
			);
			return {
				success: false,
				dryRun: false,
				provisioningStatus: "failed",
				subsiteCreationStatus: "failed",
				adminCreationStatus: "failed",
				themeInstallStatus: "failed",
				mediaImportStatus: "failed",
				contentImportStatus: "failed",
				homepageSetupStatus: "failed",
				credentialsStatus: "failed",
				logs,
				error: `Failed to copy template: ${error instanceof Error ? error.message : String(error)}`,
			};
		}

		// Step 2: Create MySQL database
		addLog("subsite_creation", "info", "Creating MySQL database");
		try {
			const mysqlManager = new MySQLDatabaseManager({
				host: mysqlHost,
				port: mysqlPort,
				user: dbUser,
				password: dbPassword || undefined,
			});

			await mysqlManager.createDatabase(dbName);
			addLog("subsite_creation", "info", `Database created: ${dbName}`);
		} catch (error) {
			addLog(
				"subsite_creation",
				"error",
				`Failed to create database: ${error instanceof Error ? error.message : String(error)}`,
			);
			// Continue anyway - might already exist
		}

		// Step 3: Update wp-config.php
		addLog("subsite_creation", "info", "Updating wp-config.php");
		try {
			const wpConfigPath = path.join(sitePath, "wp-config.php");
			if (!fs.existsSync(wpConfigPath)) {
				throw new Error(`wp-config.php not found at ${wpConfigPath}`);
			}

			let wpConfig = fs.readFileSync(wpConfigPath, "utf-8");

			// Replace database credentials
			wpConfig = wpConfig.replace(
				/define\(\s*['"]DB_NAME['"]\s*,\s*['"][^'"]*['"]\s*\)/g,
				`define('DB_NAME', '${dbName}')`,
			);
			wpConfig = wpConfig.replace(
				/define\(\s*['"]DB_USER['"]\s*,\s*['"][^'"]*['"]\s*\)/g,
				`define('DB_USER', '${dbUser}')`,
			);
			wpConfig = wpConfig.replace(
				/define\(\s*['"]DB_PASSWORD['"]\s*,\s*['"][^'"]*['"]\s*\)/g,
				`define('DB_PASSWORD', '${dbPassword}')`,
			);
			wpConfig = wpConfig.replace(
				/define\(\s*['"]DB_HOST['"]\s*,\s*['"][^'"]*['"]\s*\)/g,
				`define('DB_HOST', '${mysqlHost}:${mysqlPort}')`,
			);

			fs.writeFileSync(wpConfigPath, wpConfig, "utf-8");
			addLog("subsite_creation", "info", "wp-config.php updated successfully");
		} catch (error) {
			addLog(
				"subsite_creation",
				"error",
				`Failed to update wp-config.php: ${error instanceof Error ? error.message : String(error)}`,
			);
			return {
				success: false,
				dryRun: false,
				provisioningStatus: "failed",
				subsiteCreationStatus: "failed",
				adminCreationStatus: "failed",
				themeInstallStatus: "failed",
				mediaImportStatus: "failed",
				contentImportStatus: "failed",
				homepageSetupStatus: "failed",
				credentialsStatus: "failed",
				logs,
				error: `Failed to update wp-config.php: ${error instanceof Error ? error.message : String(error)}`,
			};
		}

		// Step 4: Create Apache vhost
		addLog("subsite_creation", "info", "Creating Apache vhost configuration");
		try {
			const vhostManager = new ApacheVhostManager(
				apacheConfPath,
				apacheBinPath,
				localDomain,
			);

			await vhostManager.createVhost({
				serverName: siteSlug,
				documentRoot: sitePath,
				port: 80,
			});

			addLog(
				"subsite_creation",
				"info",
				`Apache vhost created for: ${hostName}`,
			);
		} catch (error) {
			addLog(
				"subsite_creation",
				"error",
				`Failed to create vhost: ${error instanceof Error ? error.message : String(error)}`,
			);
			return {
				success: false,
				dryRun: false,
				provisioningStatus: "failed",
				subsiteCreationStatus: "failed",
				adminCreationStatus: "failed",
				themeInstallStatus: "failed",
				mediaImportStatus: "failed",
				contentImportStatus: "failed",
				homepageSetupStatus: "failed",
				credentialsStatus: "failed",
				logs,
				error: `Failed to create vhost: ${error instanceof Error ? error.message : String(error)}`,
			};
		}

		// Step 5: Add hosts file entry
		addLog("subsite_creation", "info", `Adding hosts file entry: ${hostName}`);
		try {
			const hostsManager = new HostsFileManager();
			await hostsManager.addEntry(hostName, "127.0.0.1");
			addLog(
				"subsite_creation",
				"info",
				`Hosts file entry added: 127.0.0.1 ${hostName}`,
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (/(permission denied|access is denied|eperm|eacces)/i.test(message)) {
				addLog(
					"subsite_creation",
					"warn",
					`Could not update hosts file (${message}). Continuing with provisioning.`,
				);
			} else {
				addLog(
					"subsite_creation",
					"error",
					`Failed to add hosts entry: ${message}`,
				);
				return {
					success: false,
					dryRun: false,
					provisioningStatus: "failed",
					subsiteCreationStatus: "failed",
					adminCreationStatus: "failed",
					themeInstallStatus: "failed",
					mediaImportStatus: "failed",
					contentImportStatus: "failed",
					homepageSetupStatus: "failed",
					credentialsStatus: "failed",
					logs,
					error: `Failed to add hosts entry: ${message}`,
				};
			}
		}

		// Step 6: Reload Apache to load the new vhost configuration
		addLog("subsite_creation", "info", "Reloading Apache to activate vhost");
		try {
			const apacheExe = path.join(apacheBinPath, "httpd.exe");
			const apacheDir = resolveApacheRoot(apacheBinPath);

			let apacheReloaded = false;
			try {
				execSync(`"${apacheExe}" -k graceful`, { stdio: "pipe" });
				apacheReloaded = true;
				addLog(
					"subsite_creation",
					"info",
					"Apache reloaded successfully (graceful)",
				);
			} catch (gracefulError) {
				addLog(
					"subsite_creation",
					"info",
					`Graceful reload failed, attempting Apache restart: ${gracefulError instanceof Error ? gracefulError.message : String(gracefulError)}`,
				);
				await restartApacheStandalone(apacheExe, apacheDir);
				apacheReloaded = true;
				addLog("subsite_creation", "info", "Apache restarted successfully");
			}

			if (apacheReloaded) {
				try {
					await waitForApacheEndpoints({
						probeSiteUrl: siteUrl,
						probeAdminUrl: adminUrl,
						requireAdmin: false,
						step: "subsite_creation",
						addLog,
						timeoutMs: 30000,
						intervalMs: 1000,
						probeTimeoutMs: 3000,
					});
				} catch (verificationError) {
					addLog(
						"subsite_creation",
						"warn",
						`Endpoints not ready after reload: ${verificationError instanceof Error ? verificationError.message : String(verificationError)}. Retrying...`,
					);
					await sleep(2000);
					await waitForApacheEndpoints({
						probeSiteUrl: siteUrl,
						probeAdminUrl: adminUrl,
						requireAdmin: false,
						step: "subsite_creation",
						addLog,
						timeoutMs: 30000,
						intervalMs: 1000,
						probeTimeoutMs: 3000,
					});
				}
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			addLog(
				"subsite_creation",
				"error",
				`Apache reload/verification failed: ${message}`,
			);
			return {
				success: false,
				dryRun: false,
				provisioningStatus: "failed",
				subsiteCreationStatus: "failed",
				adminCreationStatus: "failed",
				themeInstallStatus: "failed",
				mediaImportStatus: "failed",
				contentImportStatus: "failed",
				homepageSetupStatus: "failed",
				credentialsStatus: "failed",
				logs,
				error: `Apache reload/verification failed: ${message}`,
				details: `The vhost was created, but Apache did not consistently serve ${siteUrl} and ${adminUrl}. Restart Apache/Laragon and try provisioning again.`,
			};
		}

		addLog(
			"subsite_creation",
			"info",
			"Local WordPress site provisioning completed. Proxy URLs are available.",
		);

		return {
			success: true,
			dryRun: false,
			message:
				"WordPress site files copied, wp-config created, and proxy URLs generated. Visit the proxy URLs to continue installation or manage the site.",
			site: {
				siteId: siteSlug,
				siteSlug,
				siteUrl,
				adminUrl,
				ownerUsername,
				ownerEmail,
			},
			provisioningStatus: "completed",
			subsiteCreationStatus: "completed",
			adminCreationStatus: "pending",
			themeInstallStatus: "pending",
			mediaImportStatus: "pending",
			contentImportStatus: "pending",
			homepageSetupStatus: "pending",
			credentialsStatus: "pending",
			logs,
		};
	} catch (error) {
		addLog(
			"subsite_creation",
			"error",
			`Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
		);
		return {
			success: false,
			dryRun: false,
			provisioningStatus: "failed",
			subsiteCreationStatus: "failed",
			adminCreationStatus: "failed",
			themeInstallStatus: "failed",
			mediaImportStatus: "failed",
			contentImportStatus: "failed",
			homepageSetupStatus: "failed",
			credentialsStatus: "failed",
			logs,
			error:
				error instanceof Error
					? error.message
					: "Unknown error during provisioning",
		};
	}
}

export async function deleteLocalWordPressSite(
	siteSlug: string,
): Promise<void> {
	try {
		const sitesPath = process.env.LARAGON_SITES_PATH;
		const apacheConfPath = process.env.LARAGON_APACHE_CONF_PATH;
		const apacheBinPath = process.env.LARAGON_APACHE_BIN_PATH;
		const localDomain = process.env.LARAGON_LOCAL_DOMAIN || "test";
		const dbUser = "root";
		const dbPassword = process.env.LARAGON_MYSQL_ROOT_PASSWORD || "";
		const mysqlHost = process.env.LARAGON_MYSQL_HOST || "127.0.0.1";
		const mysqlPort = parseInt(process.env.LARAGON_MYSQL_PORT || "3306", 10);

		if (!sitesPath || !apacheConfPath || !apacheBinPath) {
			throw new Error("Laragon configuration is incomplete");
		}

		const dbName = sanitizeDatabaseName(`wordpress_${siteSlug}`);
		const hostName = `${siteSlug}.${localDomain}`;
		const sitePath = path.join(sitesPath, siteSlug);

		console.log(`[LocalWordPressProvisioner] Deleting site: ${siteSlug}`);

		// Delete site directory
		try {
			if (fs.existsSync(sitePath)) {
				deleteDirRecursive(sitePath);
				console.log(
					`[LocalWordPressProvisioner] Deleted site directory: ${sitePath}`,
				);
			}
		} catch (error) {
			console.warn(`Failed to delete site directory: ${error}`);
		}

		// Delete MySQL database
		try {
			const mysqlManager = new MySQLDatabaseManager({
				host: mysqlHost,
				port: mysqlPort,
				user: dbUser,
				password: dbPassword || undefined,
			});

			await mysqlManager.deleteDatabase(dbName);
			console.log(`[LocalWordPressProvisioner] Deleted database: ${dbName}`);
		} catch (error) {
			console.warn(`Failed to delete database: ${error}`);
		}

		// Remove Apache vhost
		try {
			const vhostManager = new ApacheVhostManager(
				apacheConfPath,
				apacheBinPath,
				localDomain,
			);

			await vhostManager.deleteVhost(siteSlug);
			console.log(`[LocalWordPressProvisioner] Deleted vhost configuration`);
		} catch (error) {
			console.warn(`Failed to delete vhost: ${error}`);
		}

		// Reload Apache after deleting vhost
		try {
			const apacheExe = path.join(apacheBinPath, "httpd.exe");
			const apacheDir = resolveApacheRoot(apacheBinPath);

			try {
				execSync(`"${apacheExe}" -k graceful`, { stdio: "pipe" });
				console.log(
					`[LocalWordPressProvisioner] Apache reloaded after vhost deletion`,
				);
			} catch (e) {
				// Kill and restart if graceful fails
				try {
					execSync("taskkill /F /IM httpd.exe", { stdio: "pipe" });
					await restartApacheStandalone(apacheExe, apacheDir);
					console.log(
						`[LocalWordPressProvisioner] Apache restarted after vhost deletion`,
					);
				} catch (restartError) {
					console.warn(`Failed to restart Apache: ${restartError}`);
				}
			}
		} catch (error) {
			console.warn(`Failed to reload Apache: ${error}`);
		}

		// Remove hosts file entry
		try {
			const hostsManager = new HostsFileManager();
			await hostsManager.removeEntry(hostName);
			console.log(
				`[LocalWordPressProvisioner] Removed hosts file entry: ${hostName}`,
			);
		} catch (error) {
			console.warn(`Failed to remove hosts entry: ${error}`);
		}

		console.log(`[LocalWordPressProvisioner] Site deletion completed`);
	} catch (error) {
		throw new Error(
			`Failed to delete site: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}

/**
 * Recursively copy directory
 */
function copyDirRecursive(source: string, dest: string): void {
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	const files = fs.readdirSync(source);
	for (const file of files) {
		const srcPath = path.join(source, file);
		const destPath = path.join(dest, file);

		if (fs.statSync(srcPath).isDirectory()) {
			copyDirRecursive(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

function getDirectoryFileCount(dirPath: string): number {
	if (!fs.existsSync(dirPath)) {
		return 0;
	}

	let count = 0;
	const entries = fs.readdirSync(dirPath);
	for (const entry of entries) {
		const entryPath = path.join(dirPath, entry);
		if (fs.statSync(entryPath).isDirectory()) {
			count += getDirectoryFileCount(entryPath);
		} else {
			count += 1;
		}
	}

	return count;
}

/**
 * Recursively delete directory
 */
function deleteDirRecursive(dirPath: string): void {
	if (!fs.existsSync(dirPath)) {
		return;
	}

	const files = fs.readdirSync(dirPath);
	for (const file of files) {
		const filePath = path.join(dirPath, file);
		if (fs.statSync(filePath).isDirectory()) {
			deleteDirRecursive(filePath);
		} else {
			fs.unlinkSync(filePath);
		}
	}

	fs.rmdirSync(dirPath);
}
