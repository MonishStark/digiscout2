import dotenv from "dotenv";
// Load .env.production first to ensure GEMINI_API_KEY / GOOGLE_CLOUD_API_KEY is available
dotenv.config({ path: ".env.production" });

import fs from "fs";
import path from "path";
import { generateHomepageViaDirectVertexPrompt } from "../src/lib/direct-vertex-homepage-generation";

// Sample local business data for testing (Woodworking Shop to match aspect ratios and category)
const sampleBusiness = {
	id: "test-carpentry-001",
	name: "Apex Bespoke Woodworks",
	category: "Woodworking",
	businessType: "Carpentry & Custom Furniture",
	address: "456 Craftsmith Way, Brooklyn, NY 11217",
	city: "Brooklyn",
	neighborhood: "Williamsburg",
	phoneNumber: "+1 (718) 555-9876",
	email: "info@apexwoodworks.com",
	websiteUri: "https://apexwoodworks.com",
	tagline: "Handcrafted Luxury Furniture",
	tone: "premium, professional, artistic",
	specialties: [
		"Bespoke Tables",
		"Handcrafted Chairs",
		"Custom Shelving",
		"Showroom Furniture",
	],
	reviews: [
		{
			author: "David L.",
			rating: 5,
			text: "The walnut dining table Apex built is an absolute masterpiece. The grain matches perfectly and the finish is silky smooth.",
			date: "2024-04-10",
		},
		{
			author: "Elena R.",
			rating: 5,
			text: "Professional craftsmen! They helped us design custom retail display shelving for our store. Remarkable attention to detail.",
			date: "2024-03-22",
		},
	],
	services: [
		{
			title: "Bespoke Tables",
			description: "Custom hardwood dining tables and desks tailored to your space",
			image_url: "", // Force fallback generation
		},
		{
			title: "Handcrafted Chairs",
			description: "Ergonomic, modern, and traditional wooden seating",
			image_url: "", // Force fallback generation
		},
	],
	hours: "Monday-Friday: 8am-5pm, Saturday: 9am-2pm, Sunday: Closed",
	photos: [
		// Let's provide some real unsplash photos as our "Google Maps photos" to test visual pre-filtering
		"https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&h=800", // wood details
		"https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600", // office/workspace
	],
	brandColor: "#5c4033",
	accentColor: "#d2b48c",
	rating: 5.0,
	reviewCount: 34,
	cta_primary_text: "Request a Consultation",
	cta_primary_url: "https://apexwoodworks.com/consult",
	cta_secondary_text: "View Portfolio",
	cta_secondary_url: "https://apexwoodworks.com/portfolio",
};

async function testEndToEnd() {
	console.log("=== End-to-End Visual Pre-filtering & Generation Test ===");
	console.log(`Business: ${sampleBusiness.name}`);
	console.log(`Checking API Key presence...`);
	const apiKey = process.env.GEMINI_API_KEY || process.env.GENAI_KEY;
	if (!apiKey) {
		console.error("❌ Error: GEMINI_API_KEY or GENAI_KEY is not defined in .env.production!");
		process.exit(1);
	}
	console.log("✓ API Key is present.");

	const debugSession = {
		traceId: `test-trace-${Date.now()}`,
	};

	try {
		console.log("Starting generateHomepageViaDirectVertexPrompt...");
		const schema = await generateHomepageViaDirectVertexPrompt(sampleBusiness, {
			debugLog: (msg: string) => console.log(msg),
			debugSession,
			persistFile: (filename: string, content: any) => {
				console.log(`[Persist File] ${filename}`);
			},
		});

		console.log("\n=== Generation Results Summary ===");
		console.log(`Site Slug: ${schema.meta?.slug}`);
		console.log(`Hero Heading: "${schema.elementorContent?.hero?.heading}"`);
		console.log(`Hero Image: ${schema.elementorContent?.hero?.hero_image}`);
		console.log(`Masked Image: ${schema.elementorContent?.hero?.masked_image}`);
		console.log(`About Image: ${schema.elementorContent?.about?.image}`);
		console.log(`Services Image: ${schema.elementorContent?.services?.image}`);
		console.log(`Testimonials Slideshow Gallery:`);
		schema.elementorContent?.testimonials?.slideshow?.forEach((url: string, i: number) => {
			console.log(`  [${i + 1}] ${url}`);
		});

		// Basic Assertions
		if (!schema.elementorContent?.hero?.hero_image) {
			throw new Error("Missing hero_image URL!");
		}
		if (!schema.elementorContent?.hero?.masked_image) {
			throw new Error("Missing masked_image URL!");
		}
		if (!schema.elementorContent?.about?.image) {
			throw new Error("Missing about.image URL!");
		}
		if (!schema.elementorContent?.services?.image) {
			throw new Error("Missing services.image URL!");
		}
		if (schema.elementorContent?.testimonials?.slideshow?.length !== 3) {
			throw new Error("Testimonials slideshow must contain exactly 3 image URLs!");
		}

		console.log("\n🎉 ALL PIPELINE ASSERTIONS PASSED!");
	} catch (error) {
		console.error("❌ Direct Vertex Generation Failed:", error);
		process.exit(1);
	}
}

testEndToEnd();
