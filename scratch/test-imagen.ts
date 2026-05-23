import dotenv from "dotenv";
dotenv.config({ path: ".env.production" });

async function testImagen() {
	const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
	if (!apiKey) {
		console.error("Missing API key");
		process.exit(1);
	}

	const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
	const payload = {
		instances: [
			{
				prompt: "A beautiful, detailed wooden chair on a white background, studio lighting"
			}
		],
		parameters: {
			sampleCount: 1,
			aspectRatio: "1:1"
		}
	};

	console.log(`Sending request to ${url}...`);
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
			return;
		}

		const data = await res.json() as any;
		console.log("Response structure keys:", Object.keys(data));
		if (data.predictions && data.predictions[0]) {
			const keys = Object.keys(data.predictions[0]);
			console.log("Prediction keys:", keys);
			const b64 = data.predictions[0].bytesBase64Encoded;
			if (b64) {
				console.log(`Success! Base64 image length: ${b64.length}`);
			} else {
				console.error("No bytesBase64Encoded in prediction:", data.predictions[0]);
			}
		} else {
			console.error("No predictions returned:", data);
		}
	} catch (err) {
		console.error("Request failed:", err);
	}
}

testImagen();
