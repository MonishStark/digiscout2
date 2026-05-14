import dotenv from "dotenv";
import path from "path";

// Load .env files in priority order from the current working directory
const rootDir = process.cwd();
const envFiles = [".env.production", ".env.local", ".env"];

for (const file of envFiles) {
	dotenv.config({ path: path.join(rootDir, file) });
}

export default process.env;
