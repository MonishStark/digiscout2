import dotenv from "dotenv";
dotenv.config({ path: ".env.production" });

async function testVertexImagen(apiEndpoint: string, modelName: string) {
	const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
	if (!apiKey) {
		console.error("Missing GOOGLE_CLOUD_API_KEY");
		return false;
	}

	const url = `https://${apiEndpoint}/v1/publishers/google/models/${modelName}:predict?key=${apiKey}`;
	const payload = {
		instances: [
			{
				prompt: "A beautiful, detailed wooden chair on a white background, studio lighting"
			}
		],
		parameters: {
			sampleCount: 1,
			aspectRatio: "1:1",
			outputMimeType: "image/png"
		}
	};

	console.log(`Sending request to ${modelName} at ${url}...`);
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		});

		console.log(`Status: ${res.status} ${res.statusText}`);
		if (!res.ok) {
			const text = await res.text();
			console.error(`Error details: ${text}`);
			return false;
		}

		const data = await res.json() as any;
		console.log("Response keys:", Object.keys(data));
		if (data.predictions && data.predictions[0]) {
			const b64 = data.predictions[0].bytesBase64Encoded;
			if (b64) {
				console.log(`Success! Base64 image length: ${b64.length}`);
				return true;
			}
		}
		console.log("No base64 image found in response:", JSON.stringify(data).substring(0, 500));
		return false;
	} catch (err) {
		console.error("Request failed:", err);
		return false;
	}
}

async function run() {
	const endpoints = [
		"aiplatform.googleapis.com",
		"us-central1-aiplatform.googleapis.com"
	];
	const models = [
		"imagen-3.0-generate-002",
		"imagen-4.0-generate-001"
	];

	for (const endpoint of endpoints) {
		for (const model of models) {
			console.log(`\nTesting ${endpoint} with ${model}...`);
			const success = await testVertexImagen(endpoint, model);
			if (success) {
				console.log("SUCCESS WITH:", endpoint, model);
				return;
			}
		}
	}
}

run();
