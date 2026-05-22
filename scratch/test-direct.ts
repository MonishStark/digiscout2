import dotenv from "dotenv";
import path from "path";
import { generateHomepageViaDirectVertexPrompt } from "../src/lib/direct-vertex-homepage-generation";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.production") });

console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
console.log("GOOGLE_CLOUD_API_KEY:", process.env.GOOGLE_CLOUD_API_KEY ? "EXISTS" : "MISSING");

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
			image_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
		},
		{
			title: "Cosmetic Dentistry",
			description: "Teeth whitening, veneers, and smile makeovers",
			image_url: "https://images.unsplash.com/photo-1606811841689-23db3d821364?w=800",
		},
		{
			title: "Implants",
			description: "State-of-the-art dental implant procedures",
			image_url: "https://images.unsplash.com/photo-1532096122144-03b913f3e25f?w=800",
		},
		{
			title: "Orthodontics",
			description: "Modern braces and Invisalign treatments",
			image_url: "https://images.unsplash.com/photo-1606811841689-23db3d821364?w=800",
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

async function test() {
	try {
		console.log("Running generateHomepageViaDirectVertexPrompt...");
		const schema = await generateHomepageViaDirectVertexPrompt(sampleBusiness, {
			debugLog: (msg) => console.log("[DEBUG]", msg),
			persistFile: (name, content) => {
				console.log("[PERSIST]", name);
				if (name === "02-vertex-response.json" || name.includes("response")) {
					console.log("RESPONSE_CONTENT:", JSON.stringify(content, null, 2));
				}
			},
		});
		console.log("SUCCESS! Schema keys:", Object.keys(schema));
		if (schema.elementorContent) {
			console.log("elementorContent keys:", Object.keys(schema.elementorContent));
		}
	} catch (error) {
		console.error("FAILED:", error);
	}
}

test();
