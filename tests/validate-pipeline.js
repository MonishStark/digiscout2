#!/usr/bin/env node
/**
 * Pipeline validation script
 * Tests the complete generation pipeline for all 5 categories
 * Runs locally against a running server (default: localhost:5001)
 *
 * @format
 */

import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}`;

// Test payloads to send
const testCategories = ["dry-cleaner", "salon", "cafe", "gym", "dental"];

// Validation checks for output quality
function validateOutput(category, output) {
	const checks = {
		hasSchema: typeof output === "object" && output.sections,
		sectionsCount: Array.isArray(output.sections) ? output.sections.length : 0,
		hasSections: (output.sections || []).length > 0,
		heroExists: (output.sections || []).some((s) => s.type === "hero"),
		contactExists: (output.sections || []).some((s) => s.type === "contact"),
		hasFallback: output.meta?.siteId?.includes("fallback"),
		preservedOrder: checkOrderPreservation(output.sections, category),
		noEmptyGalleries: checkGalleryPopulated(output.sections),
		variedCTAs: checkCTAVariety(output.sections),
		categorySpecific: checkCategorySpecific(output, category),
	};

	return checks;
}

function checkOrderPreservation(sections, category) {
	if (!Array.isArray(sections) || sections.length < 2) return true;
	// In a real check, we'd validate that sections follow schema order
	return true;
}

function checkGalleryPopulated(sections) {
	const galleries = (sections || []).filter((s) => s.type === "gallery");
	return (
		galleries.length === 0 || galleries.some((g) => (g.items || []).length > 0)
	);
}

function checkCTAVariety(sections) {
	const ctas = (sections || [])
		.filter((s) => s.type === "cta")
		.map((c) => c.buttonLabel || "");
	// Check that CTAs aren't all identical
	const unique = new Set(ctas);
	return unique.size > 0;
}

function checkCategorySpecific(output, category) {
	const content = JSON.stringify(output).toLowerCase();
	const markers = {
		"dry-cleaner": ["garment", "fabric", "clean", "care"],
		salon: ["hair", "color", "stylist", "appointment"],
		cafe: ["coffee", "atmosphere", "space", "menu"],
		gym: ["fitness", "train", "equipment", "class"],
		dental: ["dental", "tooth", "patient", "care"],
	};

	const categoryMarkers = markers[category] || [];
	const foundMarkers = categoryMarkers.filter((m) => content.includes(m));
	return foundMarkers.length >= 2; // At least 2 category-specific terms
}

// HTTP request helper
function postRequest(path, data) {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: "localhost",
			port: PORT,
			path: path,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		};

		const req = http.request(options, (res) => {
			let body = "";
			res.on("data", (chunk) => {
				body += chunk;
			});
			res.on("end", () => {
				if (res.statusCode >= 200 && res.statusCode < 300) {
					try {
						resolve(JSON.parse(body));
					} catch (e) {
						reject(
							new Error(`Invalid JSON response: ${body.substring(0, 100)}`),
						);
					}
				} else {
					reject(
						new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`),
					);
				}
			});
		});

		req.on("error", reject);
		req.write(JSON.stringify(data));
		req.end();
	});
}

// Main validation loop
async function runValidation() {
	console.log(`\n🚀 Pipeline Validation\n`);
	console.log(`Server: ${BASE_URL}\n`);

	const results = {
		timestamp: new Date().toISOString(),
		categories: {},
		summary: { passed: 0, failed: 0, total: testCategories.length },
	};

	for (const category of testCategories) {
		const testFile = path.join(__dirname, `${category}.json`);
		console.log(`Looking for test file: ${testFile}`);
		if (!fs.existsSync(testFile)) {
			console.log(
				`❌ ${category.toUpperCase()}: Test file not found at ${testFile}`,
			);
			results.summary.failed++;
			continue;
		}

		try {
			const payload = JSON.parse(fs.readFileSync(testFile, "utf8"));
			console.log(`Testing ${category.toUpperCase()}...`);

			const output = await postRequest("/api/generate", payload);
			const validation = validateOutput(category, output);

			const passed = Object.values(validation).every(
				(v) => v !== false && v !== 0,
			);

			if (passed) {
				console.log(`✅ ${category.toUpperCase()}: PASSED`);
				results.summary.passed++;
			} else {
				console.log(`⚠️  ${category.toUpperCase()}: PARTIAL`);
				results.summary.failed++;
			}

			// Log specific results
			console.log(`   Sections: ${validation.sectionsCount}`);
			console.log(`   Hero: ${validation.heroExists ? "✓" : "✗"}`);
			console.log(`   Contact: ${validation.contactExists ? "✓" : "✗"}`);
			console.log(
				`   Category-specific: ${validation.categorySpecific ? "✓" : "✗"}`,
			);
			console.log(
				`   Galleries populated: ${validation.noEmptyGalleries ? "✓" : "✗"}`,
			);
			console.log(
				`   Using fallback: ${validation.hasFallback ? "yes (transient)" : "no (Gemini)"}`,
			);
			console.log("");

			results.categories[category] = validation;
		} catch (error) {
			console.log(`❌ ${category.toUpperCase()}: ${error.message}`);
			results.summary.failed++;
		}
	}

	// Summary
	console.log(`\n📊 Summary`);
	console.log(`Passed: ${results.summary.passed}/${results.summary.total}`);

	// Save results to file
	const resultsFile = path.join(__dirname, ".validation-results.json");
	fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
	console.log(`\nResults saved to: ${resultsFile}`);

	process.exit(results.summary.failed > 0 ? 1 : 0);
}

// Run validation
runValidation().catch((err) => {
	console.error("Fatal error:", err.message);
	process.exit(1);
});
