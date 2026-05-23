import { checkWpCliAvailable, runRemoteShellCommand } from "../src/lib/wp-cli";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.join(process.cwd(), ".env.production") });

async function run() {
	console.log("Checking SSH connection and WP-CLI status...");
	console.log("WP_SSH_HOST:", process.env.WP_SSH_HOST);
	console.log("WP_SSH_PORT:", process.env.WP_SSH_PORT);
	console.log("WP_SSH_USER:", process.env.WP_SSH_USER);

	try {
		const status = await checkWpCliAvailable();
		console.log("WP-CLI availability status:", status);

		console.log("Running remote 'ls -la /home/digigesf/public_html/sites'...");
		const lsRes = await runRemoteShellCommand("ls -la /home/digigesf/public_html/sites");
		console.log("Remote sites directory listing:", lsRes.stdout);
	} catch (e: any) {
		console.error("SSH command failed:", e);
	}

	process.exit(0);
}

run();
