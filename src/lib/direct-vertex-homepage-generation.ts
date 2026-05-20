/**
 * Direct Vertex/Gemini Homepage Generation
 *
 * Simplifies the generation pipeline:
 * Business Context → Vertex Prompt → Final HTML/CSS → WebsiteSchema for WP rendering
 *
 * Uses deterministic settings (temperature 0.1) for consistent, reproducible output.
 *
 * @format
 */

import fs from "fs";
import {
	VERTEX_HOMEPAGE_GENERATION_PROMPT,
	HomepageGenerationRequest,
	HomepageGenerationResponse,
} from "./vertex-homepage-generation-prompt";
import { WebsiteSchema } from "../types";

const GENAI_KEY = process.env.GEMINI_API_KEY || process.env.GENAI_KEY;

/**
 * Collect business images from multiple sources
 */
function collectBusinessImages(business: any): string[] {
	const sources: string[] = [];

	// Google Maps photos
	if (Array.isArray(business.photos)) {
		sources.push(...business.photos);
	}

	// Image suggestions
	if (Array.isArray(business.imageSuggestions)) {
		sources.push(...business.imageSuggestions);
	}

	// Direct logo
	if (business.logo) {
		sources.push(business.logo);
	}

	return sources;
}

/**
 * Build a HomepageGenerationRequest from business data
 */
export function buildHomepageGenerationRequest(
	business: any,
): HomepageGenerationRequest {
	const images = collectBusinessImages(business);
	const [hero, service1, service2, ...gallery] = images;

	return {
		business_name: business.name || "Untitled Business",
		business_category:
			business.category || business.businessType || "Local Service",
		short_tagline:
			business.tagline ||
			business.shortTagline ||
			`${business.category || "Service"} in ${business.neighborhood || business.city || "Your Area"}`,
		one_sentence_summary:
			business.summary ||
			business.oneSentenceSummary ||
			`Trusted ${business.category || "service provider"} serving the ${business.neighborhood || business.city || "local"} community.`,
		primary_cta_text: business.cta_primary_text || "Get Started Today",
		primary_cta_url:
			business.cta_primary_url || business.websiteUri || "#contact",
		secondary_cta_text: business.cta_secondary_text || "Learn More",
		secondary_cta_url:
			business.cta_secondary_url || business.websiteUri || "#services",
		phone: business.phoneNumber || business.phone || "Contact for availability",
		address: business.address || business.location || "See directions on map",
		maps_url:
			business.mapsUrl ||
			`https://maps.google.com/?q=${encodeURIComponent(business.name || "location")}`,
		hours:
			business.hours || business.businessHours || "Call for hours of operation",
		services:
			business.services && Array.isArray(business.services)
				? business.services.slice(0, 5).map((s: any) => ({
						title: typeof s === "string" ? s : s.title || s.name || "Service",
						short_description:
							typeof s === "string"
								? `Professional ${s} service`
								: s.description ||
									s.short_description ||
									`Professional ${s.title} service`,
						image_url: s.image_url || s.photo || service1,
					}))
				: [],
		categories: business.categories || [business.category] || [],
		reviews:
			business.reviews && Array.isArray(business.reviews)
				? business.reviews.slice(0, 6).map((r: any) => ({
						author: r.author || r.author_name || r.authorName || r.reviewerName || "Customer",
						rating: r.rating || r.stars || 5,
						text:
							r.text ||
							r.review ||
							r.comment ||
							"Excellent service and highly recommended",
						date: r.date || r.reviewDate || r.relative_time_description || (r.time ? new Date(r.time * 1000).toLocaleDateString() : undefined),
					}))
				: [],
		images: {
			hero,
			service1,
			service2,
			gallery: gallery || [],
		},
		colors: {
			primary:
				business.brandColor ||
				business.primaryColor ||
				business.color ||
				"#0066cc",
			accent: business.accentColor || business.highlightColor || "#ff6600",
			neutral: business.neutralColor || "#f5f5f5",
		},
		logo_url: business.logo,
		local_context: `${business.neighborhood || business.area || business.city || "Local area"}, serving the ${business.city || "community"}`,
		competitors: business.competitors,
		trust_logos: business.trustLogos,
	};
}

/**
 * Call Vertex/Gemini with deterministic settings for homepage generation
 */
async function callVertexHomepageGeneration(
	prompt: string,
	request: HomepageGenerationRequest,
	debugLog?: (msg: string) => void,
	options?: {
		debugSession?: any;
		throttleGemini?: () => Promise<void>;
		persistFile?: (filename: string, content: any) => void;
	},
): Promise<HomepageGenerationResponse> {
	const log = debugLog || ((msg: string) => console.error(msg));

	log(`[Vertex] Calling unified homepage generation via generateWithFallback...`);
	log(`[Vertex] Business: ${request.business_name}`);
	log(`[Vertex] Category: ${request.business_category}`);

	try {
		const { generateWithFallback } = await import("./gemini");
		const responseText = await generateWithFallback(
			[
				{
					role: "user",
					parts: [
						{ text: prompt },
						{ text: `\n\nBusiness Context (JSON):\n${JSON.stringify(request, null, 2)}` },
					],
				},
			],
			{
				temperature: 0.1,
				responseMimeType: "application/json",
			},
			{
				logStderr: log,
				debugSession: options?.debugSession,
				throttleGemini: options?.throttleGemini || (async () => {}),
				persistGenerationDebugFile: options?.persistFile
					? (session, filename, content) => options.persistFile!(filename, content)
					: undefined,
				contextLabel: "direct-vertex-prompt",
			},
		);

		if (!responseText) {
			throw new Error("Vertex returned empty response");
		}

		log(`[Vertex] Response received (${responseText.length} characters)`);

		// Extract JSON from response (may be wrapped in markdown)
		let jsonString = responseText.trim();
		if (jsonString.startsWith("```")) {
			jsonString = jsonString
				.replace(/^```[a-zA-Z]*\n/, "")
				.replace(/\n```$/, "");
		}

		const parsed = JSON.parse(jsonString) as HomepageGenerationResponse;

		// Validate response structure
		if (!parsed.html || !parsed.css || !Array.isArray(parsed.assets)) {
			throw new Error(
				"Invalid response structure: missing html, css, or assets",
			);
		}

		log(`[Vertex] Parsed response successfully`);
		log(
			`[Vertex] Generated HTML (${parsed.html.length} chars), CSS (${parsed.css.length} chars)`,
		);

		return parsed;
	} catch (error) {
		log(
			`[Vertex] Generation failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
}

/**
 * Wrap the generated HTML and CSS into Gutenberg-safe blocks
 */
function wrapForWordPress(homepageResult: HomepageGenerationResponse): string {
	// Wrap CSS in wp:html block
	const cssBlock = `<!-- wp:html -->\n<style>\n${homepageResult.css}\n</style>\n<!-- /wp:html -->`;

	// Wrap HTML in wp:group block for better Gutenberg compatibility
	const htmlBlock = `<!-- wp:group {"align":"full","layout":{"type":"constrained"}} -->\n<div class="wp-block-group alignfull">\n${homepageResult.html}\n</div>\n<!-- /wp:group -->`;

	return `${cssBlock}\n\n${htmlBlock}`;
}

/**
 * Generate homepage using the direct Vertex prompt
 * Returns a WebsiteSchema compatible with existing WP rendering pipeline
 */
export async function generateHomepageViaDirectVertexPrompt(
	business: any,
	options?: {
		debugLog?: (msg: string) => void;
		debugSession?: any;
		persistFile?: (filename: string, content: any) => void;
		throttleGemini?: () => Promise<void>;
	},
): Promise<WebsiteSchema> {
	const log = options?.debugLog || ((msg: string) => console.error(msg));
	const persist =
		options?.persistFile || ((filename: string, content: any) => {});

	try {
		// Build the request
		const request = buildHomepageGenerationRequest(business);
		persist("01-homepage-generation-request.json", request);

		log(`[DirectVertex] Starting deterministic homepage generation...`);

		// Call Vertex with deterministic prompt
		const response = await callVertexHomepageGeneration(
			VERTEX_HOMEPAGE_GENERATION_PROMPT,
			request,
			log,
			options,
		);
		persist("02-vertex-response.json", response);

		// Wrap for WordPress
		const wpSafeHtml = wrapForWordPress(response);
		persist("03-wordpress-wrapped.html", wpSafeHtml);

		// Build a minimal WebsiteSchema compatible with existing pipeline
		// This allows the rest of the system to use the generated content
		const schema: any = {
			id: business.id || `homepage-${Date.now()}`,
			businessId: business.id,
			businessName: business.name || "Untitled",
			theme: {
				primaryColor: request.colors?.primary || "#0066cc",
				accentColor: request.colors?.accent || "#ff6600",
				neutralColor: request.colors?.neutral || "#f5f5f5",
				name: "modern-agency",
				mode: "light",
			},
			sections: [],
			createdAt: new Date().toISOString(),
			// Store the generated HTML/CSS for WordPress rendering
			_wordpressHtml: wpSafeHtml,
			_renderSource: "direct-vertex-prompt",
			_generatedHomepage: response,
		};

		persist("04-minimal-schema.json", schema);
		log(`[DirectVertex] Homepage generation complete`);

		return schema;
	} catch (error) {
		log(
			`[DirectVertex] Failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
}

/**
 * Export for use in server.ts or other backend services
 */
export default {
	generateHomepageViaDirectVertexPrompt,
	buildHomepageGenerationRequest,
	callVertexHomepageGeneration,
	wrapForWordPress,
};
