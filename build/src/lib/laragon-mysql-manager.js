"use strict";
/** @format */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLDatabaseManager = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
class MySQLDatabaseManager {
    constructor(config) {
        this.config = config;
    }
    async createDatabase(dbName) {
        let connection = null;
        try {
            // Sanitize database name (alphanumeric and underscore only)
            const sanitizedName = dbName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
            connection = await promise_1.default.createConnection(this.config);
            await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${sanitizedName}\``);
            console.log(`[MySQL] Database created: ${sanitizedName}`);
        }
        catch (error) {
            throw new Error(`Failed to create database: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    async deleteDatabase(dbName) {
        let connection = null;
        try {
            // Sanitize database name
            const sanitizedName = dbName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
            connection = await promise_1.default.createConnection(this.config);
            await connection.execute(`DROP DATABASE IF EXISTS \`${sanitizedName}\``);
            console.log(`[MySQL] Database deleted: ${sanitizedName}`);
        }
        catch (error) {
            throw new Error(`Failed to delete database: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    async databaseExists(dbName) {
        let connection = null;
        try {
            const sanitizedName = dbName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
            connection = await promise_1.default.createConnection(this.config);
            const [rows] = await connection.execute("SHOW DATABASES LIKE ?", [
                sanitizedName,
            ]);
            return Array.isArray(rows) && rows.length > 0;
        }
        catch (error) {
            console.warn(`Failed to check if database exists: ${error}`);
            return false;
        }
        finally {
            if (connection) {
                await connection.end();
            }
        }
    }
}
exports.MySQLDatabaseManager = MySQLDatabaseManager;
