/**
 * Test script for Direct Vertex Homepage Generation
 *
 * Run with: npx tsx test-direct-vertex-generation.ts
 *
 * Tests the simplified /api/generate-v2 endpoint with sample business data
 *
 * @format
 */

import fs from "fs";
import path from "path";

// Sample local business data for testing
const sampleBusiness = {
	id: "test-business-001",
	name: "Sunrise Dental Care",
	category: "Dentistry",
	businessType: "Dental Practice",
	address: "123 Oak Street, Brooklyn, NY 11217",
	city: "Brooklyn",
	neighborhood: "Williamsburg",
	phoneNumber: "+1 (718) 555-0123",
	email: "info@sunrisedental.com",
	websiteUri: "https://sunrisedental.com",
	tagline: "Modern dental care in Brooklyn",
	tone: "professional, warm, trustworthy",
	specialties: [
		"General Dentistry",
		"Cosmetic Dentistry",
		"Implants",
		"Orthodontics",
	],
	reviews: [
		{
			author: "Sarah M.",
			rating: 5,
			text: "Dr. Chen is incredibly gentle and professional. The office is clean and modern. Highly recommend!",
			date: "2024-03-15",
		},
		{
			author: "James K.",
			rating: 5,
			text: "Best dental experience I've had. The team explained everything and made me comfortable throughout.",
			date: "2024-02-28",
		},
		{
			author: "Lisa R.",
			rating: 5,
			text: "Love the new office! They're very friendly and the wait time is minimal.",
			date: "2024-02-10",
		},
	],
	services: [
		{
			title: "General Dentistry",
			description: "Comprehensive cleanings, exams, and preventative care",
			image_url:
				"https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
		},
		{
			title: "Cosmetic Dentistry",
			description: "Teeth whitening, veneers, and smile makeovers",
			image_url:
				"https://images.unsplash.com/photo-1606811841689-23db3d821364?w=800",
		},
		{
			title: "Implants",
			description: "State-of-the-art dental implant procedures",
			image_url:
				"https://images.unsplash.com/photo-1532096122144-03b913f3e25f?w=800",
		},
		{
			title: "Orthodontics",
			description: "Modern braces and Invisalign treatments",
			image_url:
				"https://images.unsplash.com/photo-1606811841689-23db3d821364?w=800",
		},
	],
	hours: "Monday-Friday: 9am-6pm, Saturday: 10am-4pm, Sunday: Closed",
	photos: [
		"https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600",
		"https://images.unsplash.com/photo-1606811841689-23db3d821364?w=800&h=600",
		"https://images.unsplash.com/photo-1532096122144-03b913f3e25f?w=800&h=600",
		"https://images.unsplash.com/photo-1576091160550-112173f7f869?w=800&h=600",
	],
	brandColor: "#0066cc",
	accentColor: "#00a651",
	rating: 4.9,
	reviewCount: 127,
	cta_primary_text: "Schedule an Appointment",
	cta_primary_url: "https://sunrisedental.com/book",
	cta_secondary_text: "Learn More",
	cta_secondary_url: "https://sunrisedental.com/services",
};

async function testDirectVertexGeneration() {
	console.log(`
╔════════════════════════════════════════════════════════════╗
║   Direct Vertex Homepage Generation - Test Run            ║
╚════════════════════════════════════════════════════════════╝
`);

	console.log(`Testing business: ${sampleBusiness.name}`);
	console.log(`Category: ${sampleBusiness.category}`);
	console.log(
		`Location: ${sampleBusiness.neighborhood}, ${sampleBusiness.city}`,
	);
	console.log("");

	try {
		// Check if server is running
		const healthCheck = await fetch("http://localhost:5001", {
			method: "GET",
		}).catch(() => null);

		if (!healthCheck) {
			console.error(
				"❌ Server not running. Start the server with: npm run dev:server",
			);
			process.exit(1);
		}

		console.log("✓ Server is running");
		console.log("");

		// Call the new /api/generate-v2 endpoint
		console.log("📡 Calling /api/generate-v2 with sample business data...");
		console.log("");

		const startTime = Date.now();
		const response = await fetch("http://localhost:5001/api/generate-v2", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(sampleBusiness),
		});

		const elapsedTime = Date.now() - startTime;

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error(`❌ Generation failed with status ${response.status}:`);
			console.error(errorData);
			process.exit(1);
		}

		const result = await response.json();
		console.log(`✓ Generation successful (${elapsedTime}ms)`);
		console.log("");

		// Extract debug trace ID
		const traceId = response.headers.get("x-debug-generation-id");
		if (traceId) {
			console.log(`📋 Debug Trace ID: ${traceId}`);
			console.log(`   Debug files saved to: .debug-generation/${traceId}/`);
			console.log("");
		}

		// Analyze results
		console.log("📊 Generation Results:");
		console.log(`   Schema ID: ${result.id}`);
		console.log(`   Business: ${result.businessName}`);
		console.log(`   Theme: ${result.theme?.name}`);
		console.log(`   Render Source: ${result._renderSource}`);
		console.log("");

		// Check for WordPress HTML
		if (result._wordpressHtml) {
			const htmlSize = result._wordpressHtml.length;
			console.log(`✓ WordPress HTML generated: ${htmlSize} characters`);

			// Analyze HTML structure
			const hasWpGroup = result._wordpressHtml.includes("wp:group");
			const hasWpHtml = result._wordpressHtml.includes("wp:html");
			const hasStyle = result._wordpressHtml.includes("<style");
			const dsHomepage = result._wordpressHtml.includes("ds-homepage");

			console.log(`   - Has wp:group block: ${hasWpGroup ? "✓" : "✗"}`);
			console.log(`   - Has wp:html block: ${hasWpHtml ? "✓" : "✗"}`);
			console.log(`   - Has <style> tag: ${hasStyle ? "✓" : "✗"}`);
			console.log(`   - Has ds-homepage class: ${dsHomepage ? "✓" : "✗"}`);
			console.log("");

			// Save generated HTML to file for manual inspection
			const outputDir = path.join(process.cwd(), ".test-generation-output");
			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, { recursive: true });
			}

			const htmlFile = path.join(outputDir, "generated-homepage.html");
			fs.writeFileSync(htmlFile, result._wordpressHtml, "utf8");
			console.log(`💾 HTML saved to: ${htmlFile}`);

			// Save generated response for analysis
			const jsonFile = path.join(outputDir, "generation-response.json");
			fs.writeFileSync(jsonFile, JSON.stringify(result, null, 2), "utf8");
			console.log(`💾 Response saved to: ${jsonFile}`);
		} else {
			console.warn("⚠️  No WordPress HTML in response");
		}

		// Check for generated homepage data
		if (result._generatedHomepage) {
			console.log("");
			console.log("📝 Generated Homepage Content:");
			const generated = result._generatedHomepage;
			console.log(
				`   - HTML: ${generated.html ? `${generated.html.length} chars` : "missing"}`,
			);
			console.log(
				`   - CSS: ${generated.css ? `${generated.css.length} chars` : "missing"}`,
			);
			console.log(
				`   - Assets: ${generated.assets ? generated.assets.length + " items" : "none"}`,
			);

			if (generated.assets) {
				console.log("   - Asset types:");
				const roleCount = generated.assets.reduce((acc: any, asset: any) => {
					acc[asset.role] = (acc[asset.role] || 0) + 1;
					return acc;
				}, {});
				Object.entries(roleCount).forEach(([role, count]) => {
					console.log(`     • ${role}: ${count}`);
				});
			}
		}

		console.log("");
		console.log("════════════════════════════════════════════════════════════");
		console.log("✓ Test completed successfully!");
		console.log("════════════════════════════════════════════════════════════");
		console.log("");
		console.log("Next steps:");
		console.log("1. Check the generated HTML in .test-generation-output/");
		console.log("2. Review debug files in .debug-generation/");
		console.log("3. Deploy to WordPress and capture screenshot");
		console.log("");
	} catch (error) {
		console.error(
			"❌ Test failed:",
			error instanceof Error ? error.message : String(error),
		);
		process.exit(1);
	}
}

// Run the test
testDirectVertexGeneration();
