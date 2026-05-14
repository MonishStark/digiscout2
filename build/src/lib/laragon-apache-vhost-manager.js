"use strict";
/** @format */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApacheVhostManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ApacheVhostManager {
    constructor(confPath, apacheBinPath, localDomain) {
        this.confPath = this.resolveApacheConfigDirectory(confPath);
        this.apacheBinPath = apacheBinPath;
        this.localDomain = localDomain;
    }
    resolveApacheConfigDirectory(confPath) {
        try {
            if (fs_1.default.existsSync(confPath)) {
                const stats = fs_1.default.statSync(confPath);
                if (stats.isDirectory()) {
                    return confPath;
                }
                const parentPath = path_1.default.dirname(confPath);
                const sitesEnabledPath = path_1.default.join(parentPath, "sites-enabled");
                if (fs_1.default.existsSync(sitesEnabledPath) &&
                    fs_1.default.statSync(sitesEnabledPath).isDirectory()) {
                    console.log(`[ApacheVhost] Apache config path ${confPath} is a file; using sites-enabled directory: ${sitesEnabledPath}`);
                    return sitesEnabledPath;
                }
                console.log(`[ApacheVhost] Apache config path ${confPath} is a file; using parent directory: ${parentPath}`);
                return parentPath;
            }
            // If the path does not exist yet, assume it is meant to be a directory.
            const candidate = path_1.default.extname(confPath).toLowerCase() === ".conf"
                ? path_1.default.dirname(confPath)
                : confPath;
            return candidate;
        }
        catch (error) {
            console.warn(`[ApacheVhost] Warning resolving Apache config directory from ${confPath}: ${error instanceof Error ? error.message : String(error)}`);
            return confPath;
        }
    }
    generateVhostConfig(config) {
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
    async createVhost(config) {
        try {
            const confFileName = `${config.serverName}.conf`;
            const confFilePath = path_1.default.join(this.confPath, confFileName);
            // Ensure the Apache config directory exists before writing the vhost file
            if (!fs_1.default.existsSync(this.confPath)) {
                fs_1.default.mkdirSync(this.confPath, { recursive: true });
                console.log(`[ApacheVhost] Created missing Apache config directory: ${this.confPath}`);
            }
            // Create vhost config file
            const vhostConfig = this.generateVhostConfig(config);
            fs_1.default.writeFileSync(confFilePath, vhostConfig, "utf-8");
            console.log(`[ApacheVhost] Created vhost config: ${confFilePath}`);
        }
        catch (error) {
            throw new Error(`Failed to create vhost: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async deleteVhost(serverName) {
        try {
            const confFileName = `${serverName}.conf`;
            const confFilePath = path_1.default.join(this.confPath, confFileName);
            // Delete vhost config file if it exists
            if (fs_1.default.existsSync(confFilePath)) {
                fs_1.default.unlinkSync(confFilePath);
                console.log(`[ApacheVhost] Deleted vhost config: ${confFilePath}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to delete vhost: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    vhostExists(serverName) {
        const confFileName = `${serverName}.conf`;
        const confFilePath = path_1.default.join(this.confPath, confFileName);
        return fs_1.default.existsSync(confFilePath);
    }
}
exports.ApacheVhostManager = ApacheVhostManager;
