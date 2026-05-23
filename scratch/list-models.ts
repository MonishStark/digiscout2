import dotenv from "dotenv";
dotenv.config({ path: ".env.production" });

async function listModels() {
	const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
	if (!apiKey) {
		console.error("Missing API key");
		process.exit(1);
	}

	const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
	try {
		const res = await fetch(url);
		console.log(`Status: ${res.status} ${res.statusText}`);
		if (!res.ok) {
			const text = await res.text();
			console.error(`Error: ${text}`);
			return;
		}

		const data = await res.json() as any;
		console.log("Supported Models:");
		for (const model of data.models || []) {
			if (model.name.includes("image") || model.name.includes("imagen") || model.supportedGenerationMethods.some((m: string) => m.toLowerCase().includes("image"))) {
				console.log(`- Name: ${model.name}`);
				console.log(`  Display Name: ${model.displayName}`);
				console.log(`  Description: ${model.description}`);
				console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(", ")}`);
			}
		}
	} catch (err) {
		console.error("Request failed:", err);
	}
}

listModels();
