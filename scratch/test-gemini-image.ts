import dotenv from "dotenv";
dotenv.config({ path: ".env.production" });

async function testGeminiImage(modelName: string) {
	const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
	if (!apiKey) {
		console.error("Missing API key");
		process.exit(1);
	}

	const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
	const payload = {
		contents: [
			{
				role: "user",
				parts: [
					{
						text: "Generate a beautiful, clean, professional photograph of a handmade wooden dining table in a modern dining room."
					}
				]
			}
		],
		generationConfig: {
			responseModalities: ["IMAGE"]
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
		
		const parts = data.candidates?.[0]?.content?.parts || [];
		console.log(`Parts count: ${parts.length}`);
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			console.log(`Part ${i} keys:`, Object.keys(part));
			if (part.inlineData) {
				console.log(`Part ${i} inlineData mimeType:`, part.inlineData.mimeType);
				console.log(`Part ${i} inlineData data length:`, part.inlineData.data?.length);
				return true;
			}
			if (part.text) {
				console.log(`Part ${i} text snippet:`, part.text.substring(0, 100));
			}
		}
		console.log("No inlineData found in response");
		return false;
	} catch (err) {
		console.error("Request failed:", err);
		return false;
	}
}

async function run() {
	console.log("Trying gemini-3.1-flash-image-preview...");
	let success = await testGeminiImage("gemini-3.1-flash-image-preview");
	
	if (!success) {
		console.log("\nTrying gemini-3-pro-image-preview...");
		success = await testGeminiImage("gemini-3-pro-image-preview");
	}

	if (!success) {
		console.log("\nTrying gemini-2.5-flash-image...");
		success = await testGeminiImage("gemini-2.5-flash-image");
	}
}

run();
