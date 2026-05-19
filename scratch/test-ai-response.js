/** @format */



async function testAiResponse() {
	console.log("🚀 Testing AI Content Generation Pipeline...");
	
	const payload = {
		id: "test-castro-cleaners",
		name: "Castro Cleaners",
		category: "dry cleaning",
		address: "San Francisco, CA",
		photos: [
			"https://images.unsplash.com/photo-1584411469571-2e1258cf3c61?auto=format&fit=crop&w=800&q=80"
		],
		specialties: ["stain removal", "delicate fabrics"],
		neighborhood: "Castro District",
		tone: "trustworthy, professional",
		reviews: [
			{
				rating: 5,
				text: "Fast and professional service. My delicate silk blouses always come back perfect."
			}
		],
		qualificationNotes: "Established local business with strong reputation",
		imageSuggestions: []
	};

	try {
		console.log("Sending POST request to http://localhost:5001/api/generate...");
		const response = await fetch("http://localhost:5001/api/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		});

		console.log(`HTTP Status: ${response.status} ${response.statusText}`);
		
		const data = await response.json();
		if (!response.ok) {
			console.error("❌ Error response from server:", JSON.stringify(data, null, 2));
			process.exit(1);
		}

		console.log("\n✅ Generation Succeeded!");
		console.log(`Site Slug: ${data.meta?.slug}`);
		console.log(`Theme Primary Color: ${data.theme?.palette?.primary}`);
		console.log(`Theme Accent Color: ${data.theme?.palette?.accent}`);
		console.log(`Generated Sections: ${data.sections?.length || 0}`);
		
		data.sections?.forEach((section, i) => {
			console.log(`  [Section ${i + 1}] Type: ${section.type}, ID: ${section.id}, Layout: ${section.layout}`);
		});

		if (data._wordpressHtml) {
			console.log(`\n✅ WordPress HTML Generated successfully (${data._wordpressHtml.length} characters)`);
			console.log("Preview of HTML:");
			console.log(data._wordpressHtml.substring(0, 500) + "\n...\n");
		} else {
			console.warn("\n⚠️ WordPress HTML was not generated (_wordpressHtml field is missing or empty)");
		}

		process.exit(0);
	} catch (error) {
		console.error("❌ Fatal test error:", error);
		process.exit(1);
	}
}

testAiResponse();
