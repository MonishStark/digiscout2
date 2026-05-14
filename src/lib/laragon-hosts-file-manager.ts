/** @format */

import fs from "fs";
import os from "os";

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class HostsFileManager {
	private hostsFilePath: string;

	constructor() {
		const isWindows = process.platform === "win32";
		if (isWindows) {
			this.hostsFilePath = "C:\\Windows\\System32\\drivers\\etc\\hosts";
		} else {
			this.hostsFilePath = "/etc/hosts";
		}
		console.log(`[HostsFile] Using hosts file path: ${this.hostsFilePath}`);
	}

	private readHostsFile(): string {
		if (!fs.existsSync(this.hostsFilePath)) {
			return "";
		}

		try {
			fs.accessSync(this.hostsFilePath, fs.constants.R_OK);
			return fs.readFileSync(this.hostsFilePath, "utf-8");
		} catch (error) {
			const err = error as NodeJS.ErrnoException;
			throw new Error(
				`Unable to read hosts file ${this.hostsFilePath}: ${
					err instanceof Error ? err.message : String(err)
				}`,
			);
		}
	}

	private writeHostsFile(content: string): void {
		try {
			fs.writeFileSync(this.hostsFilePath, content, "utf-8");
		} catch (error) {
			const err = error as NodeJS.ErrnoException;
			if (err && (err.code === "EACCES" || err.code === "EPERM")) {
				throw new Error(
					`Permission denied while writing hosts file ${this.hostsFilePath}. ` +
						"Please run the backend with administrator privileges.",
				);
			}
			throw new Error(
				`Failed to write hosts file ${this.hostsFilePath}: ${
					err instanceof Error ? err.message : String(err)
				}`,
			);
		}
	}

	private ensureWritable(): void {
		try {
			fs.accessSync(this.hostsFilePath, fs.constants.R_OK | fs.constants.W_OK);
		} catch (error) {
			const err = error as NodeJS.ErrnoException;
			if (err && (err.code === "EACCES" || err.code === "EPERM")) {
				throw new Error(
					`Permission denied accessing hosts file ${this.hostsFilePath}. ` +
						"Please run the backend with administrator privileges.",
				);
			}
			throw new Error(
				`Unable to access hosts file ${this.hostsFilePath}: ${
					err instanceof Error ? err.message : String(err)
				}`,
			);
		}
	}

	async addEntry(hostname: string, ip: string = "127.0.0.1"): Promise<void> {
		console.log(`[HostsFile] Preparing to add hosts entry: ${ip} ${hostname}`);

		const currentContent = this.readHostsFile();
		console.log(
			`[HostsFile] Hosts file read successfully (${currentContent.length} bytes)`,
		);
		console.log(`[HostsFile] Current hosts file contents:\n${currentContent}`);

		const lines = currentContent.split(/\r?\n/);
		const exactPattern = new RegExp(
			`^\\s*${escapeRegex(ip)}\\s+${escapeRegex(hostname)}\\s*$`,
			"i",
		);
		const hostPattern = new RegExp(
			`^\\s*\\d+\\.\\d+\\.\\d+\\.\\d+\\s+${escapeRegex(hostname)}(\\s+.*)?$`,
			"i",
		);

		if (lines.some((line) => exactPattern.test(line))) {
			console.log(
				`[HostsFile] Entry already exists, nothing to append: ${ip} ${hostname}`,
			);
			console.log(`[HostsFile] Final hosts file contents:\n${currentContent}`);
			return;
		}

		const filteredLines = lines.filter((line) => !hostPattern.test(line));
		if (filteredLines.length !== lines.length) {
			console.log(
				`[HostsFile] Removed stale or duplicate entries for hostname: ${hostname}`,
			);
		}

		const updatedLines = [...filteredLines];
		if (
			updatedLines.length > 0 &&
			updatedLines[updatedLines.length - 1].trim() !== ""
		) {
			updatedLines.push("");
		}
		updatedLines.push(`${ip} ${hostname}`);

		const updatedContent =
			updatedLines.join(os.EOL).replace(/(?:\r?\n){2,}/g, os.EOL) + os.EOL;

		console.log(
			`[HostsFile] Writing hosts file with new entry: ${ip} ${hostname}`,
		);
		this.ensureWritable();
		this.writeHostsFile(updatedContent);
		console.log("[HostsFile] Hosts file write complete");

		const finalContent = this.readHostsFile();
		console.log(
			`[HostsFile] Final hosts file contents after write:\n${finalContent}`,
		);
	}

	async removeEntry(hostname: string): Promise<void> {
		console.log(`[HostsFile] Preparing to remove hosts entry: ${hostname}`);
		const content = this.readHostsFile();
		const lines = content.split(/\r?\n/);
		const targetPattern = new RegExp(
			`^\\s*\\d+\\.\\d+\\.\\d+\\.\\d+\\s+${escapeRegex(hostname)}(\\s+.*)?$`,
			"i",
		);
		const filtered = lines.filter((line) => !targetPattern.test(line));
		const newContent = filtered.join(os.EOL).replace(/(?:\r?\n){2,}/g, os.EOL);
		this.ensureWritable();
		this.writeHostsFile(newContent);
		console.log(`[HostsFile] Removed entry: ${hostname}`);
	}

	entryExists(hostname: string): boolean {
		try {
			const content = this.readHostsFile();
			return content.split(/\r?\n/).some((line) => {
				const parts = line.trim().split(/\s+/);
				return parts.length >= 2 && parts[1] === hostname;
			});
		} catch (error) {
			console.warn(
				`[HostsFile] Unable to determine if entry exists: ${error instanceof Error ? error.message : String(error)}`,
			);
			return false;
		}
	}
}
