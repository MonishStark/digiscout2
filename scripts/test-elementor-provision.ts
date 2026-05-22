/**
 * Test script for Elementor Template Merging and Kit settings customization.
 *
 * Run with: npx tsx scripts/test-elementor-provision.ts
 */

import fs from "fs";
import path from "path";
import { mergeElementorTemplate } from "../src/lib/elementor-merger";
import { updateElementorKitSettings } from "../src/lib/provisioning-engine";

const mockSchema = {
	brand: {
		businessName: "Super Smile Dental",
		category: "Dental Clinic",
		address: "123 Dentistry Lane, Smile City",
		phone: "+1 (555) 764-5319",
		email: "hello@supersmiledental.com",
		websiteUri: "https://supersmiledental.com",
		logo: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200",
	},
	theme: {
		primaryColor: "#2A9D8F",
		accentColor: "#E76F51",
		neutralColor: "#F4F1DE",
		palette: {
			primary: "#2A9D8F",
			accent: "#E76F51",
			background: "#F4F1DE",
			text: "#264653",
		},
		typography: {
			heading: "Outfit",
			body: "Open Sans",
		},
	},
	elementorContent: {
		hero: {
			heading: "Bespoke Dental Care for the Whole Family",
			button_text: "Book Appointment",
			hero_image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200",
			masked_image: "https://images.unsplash.com/photo-1606811841689-23db3d821364?w=600",
		},
		about: {
			heading: "Our Philosophy & Patient First Commitment",
			description: "We provide comprehensive dental care in a warm, welcoming environment. From cleanings to advanced cosmetic procedures, we treat patients of all ages.",
			image: "https://images.unsplash.com/photo-1532096122144-03b913f3e25f?w=800",
			button_text: "Meet the Doctors",
		},
		services: {
			heading: "State-of-the-Art Dental Procedures",
			description: "Providing a complete range of dental solutions tailored to your unique healthcare needs.",
			image: "https://images.unsplash.com/photo-1576091160550-112173f7f869?w=800",
			list: [
				"Family Dentistry",
				"Teeth Whitening",
				"Invisalign Aligners",
				"Dental Implants",
				"Root Canal Therapy",
				"Porcelain Veneers",
				"Emergency Dentistry",
				"Periodontal Care",
			],
		},
		features: {
			heading: "Why Patient's Choose Super Smile",
			items: [
				{ title: "Cutting-Edge Tech", description: "3D imaging and painless laser dentistry methods." },
				{ title: "Empathetic Team", description: "Our friendly staff prioritizes your comfort." },
				{ title: "Flexible Scheduling", description: "Evening and weekend availability." },
			],
		},
		process: {
			heading: "Your Dental Health Journey",
			steps: [
				{ title: "Initial Consult", description: "Comprehensive examination and digital X-rays." },
				{ title: "Custom Plan", description: "Clear pricing and priority-based options." },
				{ title: "Gentle Treatment", description: "State-of-the-art procedures with sedation options." },
				{ title: "Maintenance", description: "Routine cleaning schedules to ensure long-term health." },
			],
		},
		testimonials: {
			heading: "What Our Patient's Say",
			items: [
				{ name: "John Doe", content: "Super Smile has changed how I feel about dentist visits. Completely painless!" },
				{ name: "Jane Smith", content: "The staff is incredibly sweet and they did an amazing job with my Invisalign." },
				{ name: "Bob Johnson", content: "Beautiful clinic, friendly staff, and very transparent billing. 5 stars!" },
			],
			slideshow: [
				"https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
				"https://images.unsplash.com/photo-1606811841689-23db3d821364?w=800",
				"https://images.unsplash.com/photo-1532096122144-03b913f3e25f?w=800",
			],
		},
	},
};

const mockMediaMap = {
	"https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200": { id: 101, url: "http://testsite.local/wp-content/uploads/hero.jpg" },
	"https://images.unsplash.com/photo-1606811841689-23db3d821364?w=600": { id: 102, url: "http://testsite.local/wp-content/uploads/masked.jpg" },
	"https://images.unsplash.com/photo-1532096122144-03b913f3e25f?w=800": { id: 103, url: "http://testsite.local/wp-content/uploads/about.jpg" },
	"https://images.unsplash.com/photo-1576091160550-112173f7f869?w=800": { id: 104, url: "http://testsite.local/wp-content/uploads/services.jpg" },
	"https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800": { id: 101, url: "http://testsite.local/wp-content/uploads/hero.jpg" },
	"https://images.unsplash.com/photo-1606811841689-23db3d821364?w=800": { id: 102, url: "http://testsite.local/wp-content/uploads/masked.jpg" },
	"https://images.unsplash.com/photo-1532096122144-03b913f3e25f?w=800": { id: 103, url: "http://testsite.local/wp-content/uploads/about.jpg" },
};

async function runTest() {
	console.log("Starting Elementor Merging & Kit customization test...");

	const templateDir = path.join(process.cwd(), "elementor-kit");
	const outputDir = path.join(process.cwd(), ".test-generation-output");
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// 1. Test updateElementorKitSettings
	console.log("1. Testing updateElementorKitSettings...");
	const kitSettingsPath = path.join(templateDir, "site-settings.json");
	if (!fs.existsSync(kitSettingsPath)) {
		console.error(`Error: site-settings.json not found at ${kitSettingsPath}`);
		process.exit(1);
	}
	const rawKitSettings = JSON.parse(fs.readFileSync(kitSettingsPath, "utf8"));
	const updatedKit = updateElementorKitSettings(rawKitSettings, mockSchema);
	const updatedSettings = updatedKit.settings;

	// Verify colors
	const primaryCol = updatedSettings.system_colors.find((c: any) => c._id === "primary")?.color;
	const accentCol = updatedSettings.system_colors.find((c: any) => c._id === "accent")?.color;
	const bgCol = updatedSettings.custom_colors.find((c: any) => c._id === "afc2c62")?.color;

	console.log(`- Primary Color: ${primaryCol} (Expected: ${mockSchema.theme.primaryColor})`);
	console.log(`- Accent Color: ${accentCol} (Expected: ${mockSchema.theme.accentColor})`);
	console.log(`- Background Color: ${bgCol} (Expected: ${mockSchema.theme.neutralColor})`);

	// Verify font replacement
	let hasSpartan = false;
	const checkSpartan = (obj: any) => {
		if (!obj || typeof obj !== "object") return;
		for (const key of Object.keys(obj)) {
			if (key === "typography_font_family" && obj[key] === "Spartan") {
				hasSpartan = true;
			}
			checkSpartan(obj[key]);
		}
	};
	checkSpartan(updatedSettings);
	console.log(`- Has 'Spartan' font anywhere: ${hasSpartan ? "YES (FAILED)" : "NO (PASSED)"}`);

	const hasOutfit = JSON.stringify(updatedSettings).includes("Outfit");
	console.log(`- Font family 'Outfit' is mapped: ${hasOutfit ? "YES (PASSED)" : "NO (FAILED)"}`);

	fs.writeFileSync(
		path.join(outputDir, "test-updated-kit-settings.json"),
		JSON.stringify(updatedSettings, null, 2),
		"utf8",
	);

	// 2. Test mergeElementorTemplate
	console.log("\n2. Testing mergeElementorTemplate...");
	const menuId = 42;
	const mergedLayoutJson = mergeElementorTemplate(
		templateDir,
		mockSchema.elementorContent,
		mockMediaMap,
		{
			name: mockSchema.brand.businessName,
			address: mockSchema.brand.address,
			phone: mockSchema.brand.phone,
			email: mockSchema.brand.email,
		},
		menuId,
	);

	const mergedLayout = JSON.parse(mergedLayoutJson);
	console.log(`- Total combined sections: ${mergedLayout.length}`);

	// Save output layout
	const layoutFile = path.join(outputDir, "test-merged-layout.json");
	fs.writeFileSync(layoutFile, JSON.stringify(mergedLayout, null, 2), "utf8");
	console.log(`- Merged layout saved to: ${layoutFile}`);

	// Check if title or content contains dental clinic details
	const strLayout = JSON.stringify(mergedLayout);
	const hasHeroHeading = strLayout.includes("Bespoke Dental Care for the Whole Family");
	const hasAboutHeading = strLayout.includes("Our Philosophy & Patient First Commitment");
	const hasPhone = strLayout.includes("+1 (555) 764-5319");
	const hasMenuId = strLayout.includes('"menu":"42"');
	const hasLocalHeroImg = strLayout.includes("http://testsite.local/wp-content/uploads/hero.jpg");

	console.log(`- Contains hero heading: ${hasHeroHeading ? "YES (PASSED)" : "NO (FAILED)"}`);
	console.log(`- Contains about heading: ${hasAboutHeading ? "YES (PASSED)" : "NO (FAILED)"}`);
	console.log(`- Contains business phone: ${hasPhone ? "YES (PASSED)" : "NO (FAILED)"}`);
	console.log(`- Contains menu ID '42': ${hasMenuId ? "YES (PASSED)" : "NO (FAILED)"}`);
	console.log(`- Contains local hero image: ${hasLocalHeroImg ? "YES (PASSED)" : "NO (FAILED)"}`);

	console.log("\nElementor Merging & Kit settings customization tests finished!");
}

runTest().catch((err) => {
	console.error("Test execution failed:", err);
	process.exit(1);
});
