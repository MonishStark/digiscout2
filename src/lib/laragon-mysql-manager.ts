/** @format */

import mysql from "mysql2/promise";

export interface MySQLConfig {
	host: string;
	port: number;
	user: string;
	password?: string;
}

export class MySQLDatabaseManager {
	private config: MySQLConfig;

	constructor(config: MySQLConfig) {
		this.config = config;
	}

	async createDatabase(dbName: string): Promise<void> {
		let connection: mysql.Connection | null = null;
		try {
			// Sanitize database name (alphanumeric and underscore only)
			const sanitizedName = dbName.toLowerCase().replace(/[^a-z0-9_]/g, "_");

			connection = await mysql.createConnection(this.config);
			await connection.execute(
				`CREATE DATABASE IF NOT EXISTS \`${sanitizedName}\``,
			);
			console.log(`[MySQL] Database created: ${sanitizedName}`);
		} catch (error) {
			throw new Error(
				`Failed to create database: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		} finally {
			if (connection) {
				await connection.end();
			}
		}
	}

	async deleteDatabase(dbName: string): Promise<void> {
		let connection: mysql.Connection | null = null;
		try {
			// Sanitize database name
			const sanitizedName = dbName.toLowerCase().replace(/[^a-z0-9_]/g, "_");

			connection = await mysql.createConnection(this.config);
			await connection.execute(`DROP DATABASE IF EXISTS \`${sanitizedName}\``);
			console.log(`[MySQL] Database deleted: ${sanitizedName}`);
		} catch (error) {
			throw new Error(
				`Failed to delete database: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		} finally {
			if (connection) {
				await connection.end();
			}
		}
	}

	async databaseExists(dbName: string): Promise<boolean> {
		let connection: mysql.Connection | null = null;
		try {
			const sanitizedName = dbName.toLowerCase().replace(/[^a-z0-9_]/g, "_");

			connection = await mysql.createConnection(this.config);
			const [rows] = await connection.execute("SHOW DATABASES LIKE ?", [
				sanitizedName,
			]);
			return Array.isArray(rows) && rows.length > 0;
		} catch (error) {
			console.warn(`Failed to check if database exists: ${error}`);
			return false;
		} finally {
			if (connection) {
				await connection.end();
			}
		}
	}
}
