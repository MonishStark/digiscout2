/** @format */

import fs from "fs";
import path from "path";

interface VhostConfig {
	serverName: string;
	documentRoot: string;
	port?: number;
}

export class ApacheVhostManager {
	private confPath: string;
	private apacheBinPath: string;
	private localDomain: string;

	constructor(confPath: string, apacheBinPath: string, localDomain: string) {
		this.confPath = this.resolveApacheConfigDirectory(confPath);
		this.apacheBinPath = apacheBinPath;
		this.localDomain = localDomain;
	}

	private resolveApacheConfigDirectory(confPath: string): string {
		try {
			if (fs.existsSync(confPath)) {
				const stats = fs.statSync(confPath);
				if (stats.isDirectory()) {
					return confPath;
				}
				const parentPath = path.dirname(confPath);
				const sitesEnabledPath = path.join(parentPath, "sites-enabled");
				if (
					fs.existsSync(sitesEnabledPath) &&
					fs.statSync(sitesEnabledPath).isDirectory()
				) {
					console.log(
						`[ApacheVhost] Apache config path ${confPath} is a file; using sites-enabled directory: ${sitesEnabledPath}`,
					);
					return sitesEnabledPath;
				}
				console.log(
					`[ApacheVhost] Apache config path ${confPath} is a file; using parent directory: ${parentPath}`,
				);
				return parentPath;
			}

			// If the path does not exist yet, assume it is meant to be a directory.
			const candidate =
				path.extname(confPath).toLowerCase() === ".conf"
					? path.dirname(confPath)
					: confPath;
			return candidate;
		} catch (error) {
			console.warn(
				`[ApacheVhost] Warning resolving Apache config directory from ${confPath}: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
			return confPath;
		}
	}

	private generateVhostConfig(config: VhostConfig): string {
		const port = config.port || 80;
		const docRoot = config.documentRoot.replace(/\\/g, "/");

		return `<VirtualHost *:${port}>
    ServerName ${config.serverName}.${this.localDomain}
    ServerAlias www.${config.serverName}.${this.localDomain}
    
    DocumentRoot "${docRoot}"
    
    <Directory "${docRoot}">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    <FilesMatch \\.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>
    
    ErrorLog "${docRoot}/error.log"
    CustomLog "${docRoot}/access.log" combined
</VirtualHost>`;
	}

	async createVhost(config: VhostConfig): Promise<void> {
		try {
			const confFileName = `${config.serverName}.conf`;
			const confFilePath = path.join(this.confPath, confFileName);

			// Ensure the Apache config directory exists before writing the vhost file
			if (!fs.existsSync(this.confPath)) {
				fs.mkdirSync(this.confPath, { recursive: true });
				console.log(
					`[ApacheVhost] Created missing Apache config directory: ${this.confPath}`,
				);
			}

			// Create vhost config file
			const vhostConfig = this.generateVhostConfig(config);
			fs.writeFileSync(confFilePath, vhostConfig, "utf-8");

			console.log(`[ApacheVhost] Created vhost config: ${confFilePath}`);
		} catch (error) {
			throw new Error(
				`Failed to create vhost: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	async deleteVhost(serverName: string): Promise<void> {
		try {
			const confFileName = `${serverName}.conf`;
			const confFilePath = path.join(this.confPath, confFileName);

			// Delete vhost config file if it exists
			if (fs.existsSync(confFilePath)) {
				fs.unlinkSync(confFilePath);
				console.log(`[ApacheVhost] Deleted vhost config: ${confFilePath}`);
			}
		} catch (error) {
			throw new Error(
				`Failed to delete vhost: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	vhostExists(serverName: string): boolean {
		const confFileName = `${serverName}.conf`;
		const confFilePath = path.join(this.confPath, confFileName);
		return fs.existsSync(confFilePath);
	}
}
