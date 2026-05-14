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

console.log(`[Env] Searching in: ${searchPaths.join(", ")}`);

for (const root of searchPaths) {
	for (const file of envFiles) {
		const fullPath = path.join(root, file);
		if (fs.existsSync(fullPath)) {
			console.log(`[Env] Found environment file: ${fullPath}`);
			dotenv.config({ path: fullPath });
		}
	}
}

export default process.env;
