import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

async function main() {
	try {
		console.log("Loading .env.local manually...");
		const envPath = path.join(process.cwd(), ".env.local");
		const envConfig = dotenv.parse(fs.readFileSync(envPath));
		
		const pool = mysql.createPool({
			host: envConfig.DB_HOST || "127.0.0.1",
			user: envConfig.DB_USER,
			password: envConfig.DB_PASSWORD,
			database: envConfig.DB_NAME,
		});

		console.log(`Connecting to local DB: ${envConfig.DB_NAME}...`);
		const [rows]: any = await pool.query(
			`SELECT id, business_name, subdomain, status, website_schema, logs FROM provisioning_jobs ORDER BY created_at DESC LIMIT 3`
		);

		if (!rows || rows.length === 0) {
			console.log("No jobs found in provisioning_jobs.");
			process.exit(0);
		}

		for (const row of rows) {
			console.log("=========================================");
			console.log(`ID: ${row.id}`);
			console.log(`Business Name: ${row.business_name}`);
			console.log(`Subdomain: ${row.subdomain}`);
			console.log(`Status: ${row.status}`);
			console.log("-----------------------------------------");
			
			if (row.website_schema) {
				const schema = typeof row.website_schema === "string" ? JSON.parse(row.website_schema) : row.website_schema;
				console.log("BRAND LOGO:", schema.brand?.logo);
				if (schema.elementorContent) {
					console.log("HERO IMAGE:", schema.elementorContent.hero?.hero_image);
					console.log("MASKED IMAGE:", schema.elementorContent.hero?.masked_image);
					console.log("ABOUT IMAGE:", schema.elementorContent.about?.image);
					console.log("SERVICES IMAGE:", schema.elementorContent.services?.image);
					console.log("TESTIMONIALS SLIDESHOW:", schema.elementorContent.testimonials?.slideshow);
					if (schema.elementorContent.projects?.posts) {
						console.log("PROJECT POSTS:", schema.elementorContent.projects.posts.map((p: any) => ({ title: p.title, url: p.url })));
					}
					console.log("LOGO IMAGE:", schema.elementorContent.logo_image);
				} else {
					console.log("No elementorContent in schema.");
				}
			} else {
				console.log("No website_schema available.");
			}
		}
		process.exit(0);
	} catch (e) {
		console.error("Error:", e);
		process.exit(1);
	}
}

main();
