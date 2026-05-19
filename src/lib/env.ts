import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get paths to check
const cwd = process.cwd();

// Since we bundle to build/server.js, the project root is one level up from the file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bundleRoot = path.resolve(__dirname, "../");

const searchPaths = [cwd, bundleRoot];
const envFiles = [".env.production", ".env.local", ".env"];

console.error(`[Env] Searching in: ${searchPaths.join(", ")}`);

// Debug: List files in CWD
try {
	const files = fs.readdirSync(cwd);
	console.error(`[Env] Files found in ${cwd}: ${files.join(", ")}`);
} catch (e: any) {
	console.error(`[Env] Could not list files in ${cwd}: ${e.message}`);
}

for (const root of searchPaths) {
	for (const file of envFiles) {
		const fullPath = path.join(root, file);
		if (fs.existsSync(fullPath)) {
			console.error(`[Env] Found environment file: ${fullPath}`);
			const result = dotenv.config({ 
				path: fullPath, 
				override: file === ".env.production"
			});
			if (result.error) {
				console.error(`[Env] Error parsing ${fullPath}: ${result.error.message}`);
			} else {
				console.error(`[Env] Successfully loaded ${fullPath} (override: ${file === ".env.production"})`);
			}
		}
	}
}

if (!process.env.DB_USER) {
	console.error("[Env] WARNING: DB_USER is not set after loading environment files.");
} else {
	console.error(`[Env] DB_USER is set to: ${process.env.DB_USER}`);
}

export default process.env;
