import { pool } from "../src/lib/db";
import dotenv from "dotenv";
import path from "path";

// Load .env.production
dotenv.config({ path: path.join(process.cwd(), ".env.production") });

async function run() {
	console.log("Connecting to database...");
	const [rows]: any = await pool.query(
		"SELECT id, project_id, business_name, status, logs FROM provisioning_jobs ORDER BY created_at DESC LIMIT 1"
	);

	if (rows.length === 0) {
		console.log("No jobs found in provisioning_jobs.");
		process.exit(0);
	}

	const job = rows[0];
	console.log(`Latest Job:`);
	console.log(`ID: ${job.id}`);
	console.log(`Project ID: ${job.project_id}`);
	console.log(`Business Name: ${job.business_name}`);
	console.log(`Status: ${job.status}`);
	console.log(`Logs:`);

	let logs: string[] = [];
	if (typeof job.logs === "string") {
		logs = JSON.parse(job.logs);
	} else if (Array.isArray(job.logs)) {
		logs = job.logs;
	}

	logs.forEach((logLine: string) => {
		console.log(logLine);
	});

	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
