import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { generateHomepageViaDirectVertexPrompt } from "../src/lib/direct-vertex-homepage-generation";

const sampleBusiness = {
	id: "test-business-001",
	name: "MSJ Wood Custom kitchen Cabinets",
	category: "cabinet maker",
	businessType: "Cabinet Maker",
	address: "8324 Graham Ave G, Los Angeles, CA 90001, USA",
	city: "Los Angeles",
	neighborhood: "Los Angeles",
	phoneNumber: "+1 (323) 239-0120",
	email: "info@msjwood.com",
	websiteUri: "https://msjwood.com",
	tagline: "Custom woodworking and high-quality cabinets",
	tone: "professional, warm, trustworthy",
	specialties: [
		"Custom Cabinets",
		"Kitchen Cabinets",
		"Woodworking",
	],
	reviews: [],
	services: [],
	hours: "Monday-Friday: 9am-6pm",
	photos: [],
	brandColor: "#6B4E3D",
	accentColor: "#D2B48C",
	rating: 5.0,
	reviewCount: 21,
};

async function run() {
	console.log("Starting test vertex generation directly...");
	try {
		const result = await generateHomepageViaDirectVertexPrompt(sampleBusiness, {
			debugLog: (msg: string) => console.log(msg),
			persistFile: (filename: string, content: any) => {
				console.log(`[Persist] ${filename}`);
			},
			throttleGemini: async () => {},
		});
		console.log("SUCCESS!", JSON.stringify(result, null, 2).substring(0, 1000));
	} catch (error) {
		console.error("FAILED WITH ERROR:", error);
	}
}

run();
