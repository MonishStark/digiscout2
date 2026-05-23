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
import path from "path";
import {
	VERTEX_HOMEPAGE_GENERATION_PROMPT,
	HomepageGenerationRequest,
	HomepageGenerationResponse,
} from "./vertex-homepage-generation-prompt";
import { WebsiteSchema } from "../types";
import { generateCustomImage, generateWithFallback } from "./gemini";

const GENAI_KEY = process.env.GEMINI_API_KEY || process.env.GENAI_KEY;

/**
 * Collect business images from multiple sources
 */
function optimizeGooglePhotoUrl(url: string, size = 1600): string {
	if (!url || typeof url !== "string") return url;
	if (url.includes("googleusercontent.com/places/") || url.includes("googleusercontent.com/p/")) {
		const baseUrl = url.split("=")[0];
		return `${baseUrl}=s${size}`;
	}
	return url;
}

function collectBusinessImages(business: any): string[] {
	const sources: string[] = [];

	// Google Maps photos
	if (Array.isArray(business.photos)) {
		sources.push(...business.photos.map(url => optimizeGooglePhotoUrl(url, 1600)));
	}

	// Image suggestions
	if (Array.isArray(business.imageSuggestions)) {
		sources.push(...business.imageSuggestions.map(url => optimizeGooglePhotoUrl(url, 1600)));
	}

	// Direct logo
	if (business.logo) {
		sources.push(optimizeGooglePhotoUrl(business.logo, 400));
	}

	// Review photos (if any)
	if (Array.isArray(business.reviews)) {
		business.reviews.forEach((r: any) => {
			if (Array.isArray(r.photos)) {
				sources.push(...r.photos.map((url: any) => typeof url === "string" ? optimizeGooglePhotoUrl(url, 1600) : ""));
			} else if (Array.isArray(r.images)) {
				sources.push(...r.images.map((url: any) => typeof url === "string" ? optimizeGooglePhotoUrl(url, 1600) : ""));
			}
		});
	}

	return [...new Set(sources.filter(Boolean))];
}

async function downloadImageAsBase64(url: string): Promise<{ mimeType: string; data: string } | null> {
	try {
		// Use s400 for analysis to save tokens and speed up
		const lowResUrl = optimizeGooglePhotoUrl(url, 400);
		const res = await fetch(lowResUrl);
		if (!res.ok) return null;
		const buffer = await res.arrayBuffer();
		const base64Data = Buffer.from(buffer).toString("base64");
		
		// Guess mime type from headers or url, fallback to image/jpeg
		let mimeType = res.headers.get("content-type") || "image/jpeg";
		if (mimeType.includes(";")) {
			mimeType = mimeType.split(";")[0];
		}
		
		return { mimeType, data: base64Data };
	} catch (e) {
		return null;
	}
}

interface ImageAnalysisMapping {
	action: "use_existing" | "generate";
	image_index?: number;
	generation_prompt?: string;
	url?: string;
}

interface ImageAnalysisResult {
	hero_image: ImageAnalysisMapping;
	masked_image: ImageAnalysisMapping;
	about_image: ImageAnalysisMapping;
	services_image: ImageAnalysisMapping;
	testimonials_slideshow: ImageAnalysisMapping[];
	project_posts: Array<{
		action: "use_existing" | "generate";
		image_index?: number;
		post_title: string;
		generation_prompt?: string;
		url?: string;
	}>;
}

export async function analyzeAndFilterImages(
	business: any,
	log: (msg: string) => void,
	options?: {
		throttleGemini?: () => Promise<void>;
		debugSession?: any;
	}
): Promise<ImageAnalysisResult> {
	log(`[ImageAnalyzer] Running image pre-filtering & analysis for: ${business.name}`);

	const images = collectBusinessImages(business);
	const numImages = Math.min(images.length, 12);
	const base64Parts: any[] = [];

	log(`[ImageAnalyzer] Found ${images.length} business photos. Downloading top ${numImages} for Gemini analysis...`);

	for (let i = 0; i < numImages; i++) {
		const part = await downloadImageAsBase64(images[i]);
		if (part) {
			base64Parts.push({
				inlineData: {
					mimeType: part.mimeType,
					data: part.data,
				}
			});
			log(`[ImageAnalyzer] Downloaded photo ${i}: ${images[i].substring(0, 80)}...`);
		}
	}

	const hasImages = base64Parts.length > 0;

	const promptText = `You are a staff brand art director.
Evaluate these ${base64Parts.length} images from Google Maps/Reviews for the business "${business.name}" (Category: "${business.category || business.businessType}").
Determine which images are highly relevant, high quality, and suitable for the following website layout sections:
1. "hero_image": The main hero background. Needs to be a high-quality, clean, atmospheric representation of the business (e.g. for woodworking, a premium finished product or beautiful showroom).
2. "masked_image": A detailed/masked circular photo (e.g. detail of a wood joint, wood texture close-up).
3. "about_image": Photo showing the craftsmanship process, team, or workspace.
4. "services_image": Background image for services section showing a service in action.
5. "testimonials_slideshow": A list of up to 3 gallery/reviews images.
6. "project_posts": A list of up to 4 project images representing completed works/projects (e.g., finished custom cabinets, closets, shelves, tables). For each selected image, provide a descriptive, professional "post_title" (e.g., "Custom Oak Kitchen Cabinetry", "Modern Built-in Wardrobe").

CRITICAL RULES FOR IMAGE SELECTION:
- HIGH RESOLUTION & CLARITY ONLY: Only select an image if it is sharp, clear, and high-definition. If a photo is blurry, low-resolution, poorly lit, amateur, or contains watermarks/logos/text/flyers, reject it and mark "action": "generate" instead.
- NO REPETITIVE IMAGES (UNIQUENESS): You MUST ensure that every selected image_index is completely unique across all layout sections (hero_image, masked_image, about_image, services_image, testimonials_slideshow, project_posts). No single image_index should be reused.
- RELEVANCY: Ensure all selected images showcase premium, finished work of the business (e.g., finished custom cabinets, custom kitchens/bathrooms, dining tables). Avoid raw material piles, tools on floor, trucks, or office maps.
- HIGH-QUALITY GENERATION PROMPTS: When "action" is "generate", write a highly detailed, professional photography prompt specifying lighting, composition, texture, and style (e.g., "A high-end professional architectural photograph of custom built-in cabinets...").

If any of the Google Maps/Reviews photos are suitable, map them to the corresponding section by setting "action": "use_existing" and providing the "image_index" (0-based index matching the order of the images provided).
If none of the provided photos are suitable or relevant, or if no images were provided, mark "action": "generate" and write a highly descriptive, detailed image generation prompt ("generation_prompt") tailored to the business category and location context for the model "gemini-3-pro-image-preview". The prompt should describe a premium, high-quality photograph, setting, lighting, and detail.

Return ONLY a JSON response in the following format:
{
  "hero_image": { "action": "use_existing" or "generate", "image_index": 0, "generation_prompt": "..." },
  "masked_image": { "action": "use_existing" or "generate", "image_index": 1, "generation_prompt": "..." },
  "about_image": { "action": "use_existing" or "generate", "image_index": 2, "generation_prompt": "..." },
  "services_image": { "action": "use_existing" or "generate", "image_index": 3, "generation_prompt": "..." },
  "testimonials_slideshow": [
    { "action": "use_existing" or "generate", "image_index": 4, "generation_prompt": "..." },
    { "action": "use_existing" or "generate", "image_index": 5, "generation_prompt": "..." },
    { "action": "use_existing" or "generate", "image_index": 6, "generation_prompt": "..." }
  ],
  "project_posts": [
    { "action": "use_existing" or "generate", "image_index": 7, "post_title": "Custom Walnut Kitchen Cabinets", "generation_prompt": "..." },
    { "action": "use_existing" or "generate", "image_index": 8, "post_title": "Minimalist Oak TV Console", "generation_prompt": "..." }
  ]
}`;

	const parts: any[] = [{ text: promptText }];
	if (hasImages) {
		parts.push(...base64Parts);
	}

	try {
		log(`[ImageAnalyzer] Calling Gemini to analyze images...`);
		const responseText = await generateWithFallback(
			[{ role: "user", parts }],
			{ temperature: 0.1, responseMimeType: "application/json" },
			{
				logStderr: log,
				debugSession: options?.debugSession,
				throttleGemini: options?.throttleGemini || (async () => {}),
				contextLabel: "image-analysis",
			}
		);

		let jsonString = responseText.trim();
		if (jsonString.startsWith("```")) {
			jsonString = jsonString
				.replace(/^```[a-zA-Z]*\n/, "")
				.replace(/\n```$/, "");
		}

		log(`[ImageAnalyzer] Parse result: ${jsonString}`);
		const result = JSON.parse(jsonString) as ImageAnalysisResult;

		// Map image_index to original URLs
		const mapIndexToUrl = (mapping: ImageAnalysisMapping): ImageAnalysisMapping => {
			if (mapping.action === "use_existing" && typeof mapping.image_index === "number" && images[mapping.image_index]) {
				return { ...mapping, url: images[mapping.image_index] };
			}
			return { ...mapping, action: "generate" }; // Fallback to generate if index is invalid
		};

		return {
			hero_image: mapIndexToUrl(result.hero_image),
			masked_image: mapIndexToUrl(result.masked_image),
			about_image: mapIndexToUrl(result.about_image),
			services_image: mapIndexToUrl(result.services_image),
			testimonials_slideshow: (result.testimonials_slideshow || []).map(mapIndexToUrl),
			project_posts: (result.project_posts || []).map((p: any) => ({
				...mapIndexToUrl(p),
				post_title: p.post_title || "Custom Project",
			})),
		};
	} catch (error) {
		log(`[ImageAnalyzer] Analysis failed: ${error instanceof Error ? error.message : String(error)}. Falling back to full generation prompts.`);
		// If analysis fails or there are no images, construct default fallback prompts programmatically
		const getFallbackPrompt = (role: string) => {
			return `A high-end professional commercial photograph of a ${business.category || "local business"} related to ${business.name}, representing ${role}, clean composition, dramatic soft warm lighting, depth of field, 8k, detailed texture.`;
		};

		return {
			hero_image: { action: "generate", generation_prompt: getFallbackPrompt("hero background showcase") },
			masked_image: { action: "generate", generation_prompt: getFallbackPrompt("close up detail shot") },
			about_image: { action: "generate", generation_prompt: getFallbackPrompt("workspace environment or team action") },
			services_image: { action: "generate", generation_prompt: getFallbackPrompt("services in action") },
			testimonials_slideshow: [
				{ action: "generate", generation_prompt: getFallbackPrompt("project outcome detail 1") },
				{ action: "generate", generation_prompt: getFallbackPrompt("project outcome detail 2") },
				{ action: "generate", generation_prompt: getFallbackPrompt("project outcome detail 3") },
			],
			project_posts: [
				{ action: "generate", post_title: "Custom Kitchen Cabinetry", generation_prompt: getFallbackPrompt("custom kitchen cabinetry installation") },
				{ action: "generate", post_title: "Bespoke Built-in Wardrobe", generation_prompt: getFallbackPrompt("bespoke built-in wardrobe detail") },
				{ action: "generate", post_title: "Handcrafted Dining Table", generation_prompt: getFallbackPrompt("handcrafted solid wood dining table") },
				{ action: "generate", post_title: "Modern Wooden TV Console", generation_prompt: getFallbackPrompt("modern minimalist wooden tv console") },
			],
		};
	}
}

export async function detectOrGenerateLogo(
	business: any,
	log: (msg: string) => void,
	options?: {
		throttleGemini?: () => Promise<void>;
		debugSession?: any;
	}
): Promise<{ action: "use_existing" | "generate"; url?: string; generation_prompt?: string }> {
	log(`[LogoDetector] Analyzing Google Photos to find an existing business logo...`);
	const images = collectBusinessImages(business);
	const numImages = Math.min(images.length, 12);
	const base64Parts: any[] = [];

	for (let i = 0; i < numImages; i++) {
		const part = await downloadImageAsBase64(images[i]);
		if (part) {
			base64Parts.push({
				inlineData: {
					mimeType: part.mimeType,
					data: part.data,
				}
			});
		}
	}

	const promptText = `You are a branding designer.
Analyze these ${base64Parts.length} photos from Google Maps/Reviews for the business "${business.name}" (Category: "${business.category || business.businessType}").
Determine if any of these photos is the official business logo, emblem, or clean storefront signage containing the logo.
If you find one, return a JSON response with:
{ "action": "use_existing", "logo_index": <0-based index of the photo> }

If no clear logo exists in the photos, return:
{ "action": "generate", "generation_prompt": "A premium professional minimalist vector logo for ${business.name}, representing custom cabinetry/woodworking, clean flat design, solid white background, sharp vector shapes" }

Return ONLY valid JSON:`;

	const parts: any[] = [{ text: promptText }];
	if (base64Parts.length > 0) {
		parts.push(...base64Parts);
	}

	try {
		const responseText = await generateWithFallback(
			[{ role: "user", parts }],
			{ temperature: 0.1, responseMimeType: "application/json" },
			{
				logStderr: log,
				debugSession: options?.debugSession,
				throttleGemini: options?.throttleGemini || (async () => {}),
				contextLabel: "logo-detection",
			}
		);

		let jsonString = responseText.trim();
		if (jsonString.startsWith("```")) {
			jsonString = jsonString.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
		}

		const parsed = JSON.parse(jsonString);
		if (parsed.action === "use_existing" && typeof parsed.logo_index === "number" && images[parsed.logo_index]) {
			log(`[LogoDetector] Found logo in Google photos at index ${parsed.logo_index}`);
			return { action: "use_existing", url: images[parsed.logo_index] };
		}
	} catch (e) {
		log(`[LogoDetector] Logo detection failed or no logo found: ${e}`);
	}

	log(`[LogoDetector] No logo found in Google photos. Generating a custom one.`);
	const defaultPrompt = `A premium professional minimalist vector logo for ${business.name}, representing custom cabinetry and high-end woodworking, clean flat design, solid white background, sharp vector lines`;
	return { action: "generate", generation_prompt: defaultPrompt };
}

export async function resolveSectionImages(
	analysis: ImageAnalysisResult,
	log: (msg: string) => void,
	logoAnalysis?: { action: "use_existing" | "generate"; url?: string; generation_prompt?: string }
): Promise<{
	hero_image: string;
	masked_image: string;
	about_image: string;
	services_image: string;
	testimonials_slideshow: string[];
	project_posts: Array<{ title: string; url: string }>;
	logo_image: string;
}> {
	const resultUrls: any = {
		hero_image: "",
		masked_image: "",
		about_image: "",
		services_image: "",
		testimonials_slideshow: [],
		project_posts: [],
		logo_image: "",
	};

	const generateAndSave = async (prompt: string, role: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "16:9"): Promise<string> => {
		try {
			const base64Bytes = await generateCustomImage(prompt, { aspectRatio, logStderr: log });
			const filename = `gen_${role}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
			const publicDir = path.join(process.cwd(), "public");
			const imagesDir = path.join(publicDir, "generated-images");
			if (!fs.existsSync(imagesDir)) {
				fs.mkdirSync(imagesDir, { recursive: true });
			}
			const filePath = path.join(imagesDir, filename);
			fs.writeFileSync(filePath, Buffer.from(base64Bytes, "base64"));
			
			const baseUrl = process.env.API_URL || "https://api.digiscout.online";
			const fileUrl = `${baseUrl}/public/generated-images/${filename}`;
			log(`[ImageGenerator] Saved generated image for ${role} to ${fileUrl}`);
			return fileUrl;
		} catch (err: any) {
			log(`[ImageGenerator] Error generating image for ${role}: ${err.message || err}. Falling back to default placeholder.`);
			// fallback placeholder
			return "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800";
		}
	};

	// 1. Hero Image (taller aspect ratio like 3:4 is great for this carpenter layout)
	if (analysis.hero_image.action === "use_existing" && analysis.hero_image.url) {
		resultUrls.hero_image = analysis.hero_image.url;
	} else {
		resultUrls.hero_image = await generateAndSave(analysis.hero_image.generation_prompt || "wooden chair chair modern", "hero", "3:4");
	}

	// 2. Masked Image (square detail shot)
	if (analysis.masked_image.action === "use_existing" && analysis.masked_image.url) {
		resultUrls.masked_image = analysis.masked_image.url;
	} else {
		resultUrls.masked_image = await generateAndSave(analysis.masked_image.generation_prompt || "wood grain pattern detail close-up", "masked", "1:1");
	}

	// 3. About Image (landscape or square)
	if (analysis.about_image.action === "use_existing" && analysis.about_image.url) {
		resultUrls.about_image = analysis.about_image.url;
	} else {
		resultUrls.about_image = await generateAndSave(analysis.about_image.generation_prompt || "woodworking craftsman work", "about", "4:3");
	}

	// 4. Services Image (landscape)
	if (analysis.services_image.action === "use_existing" && analysis.services_image.url) {
		resultUrls.services_image = analysis.services_image.url;
	} else {
		resultUrls.services_image = await generateAndSave(analysis.services_image.generation_prompt || "carpentry workshop background", "services", "16:9");
	}

	// 5. Testimonials Slideshow
	const slideshowUrls: string[] = [];
	for (let i = 0; i < 3; i++) {
		const item = analysis.testimonials_slideshow?.[i];
		if (item && item.action === "use_existing" && item.url) {
			slideshowUrls.push(item.url);
		} else {
			const prompt = item?.generation_prompt || `wood projects showcase detail shot ${i + 1}`;
			const url = await generateAndSave(prompt, `testimonial_${i + 1}`, "4:3");
			slideshowUrls.push(url);
		}
	}
	resultUrls.testimonials_slideshow = slideshowUrls;

	// 6. Project Posts
	const resolvedProjects: Array<{ title: string; url: string }> = [];
	const projectsList = analysis.project_posts || [];
	for (let i = 0; i < Math.min(4, projectsList.length); i++) {
		const item = projectsList[i];
		const title = item.post_title || `Project ${i + 1}`;
		if (item.action === "use_existing" && item.url) {
			resolvedProjects.push({ title, url: item.url });
		} else {
			const prompt = item.generation_prompt || `premium custom cabinet project showcase ${i + 1}`;
			const url = await generateAndSave(prompt, `project_${i + 1}`, "4:3");
			resolvedProjects.push({ title, url });
		}
	}
	resultUrls.project_posts = resolvedProjects;

	// 7. Logo
	if (logoAnalysis && logoAnalysis.action === "use_existing" && logoAnalysis.url) {
		resultUrls.logo_image = logoAnalysis.url;
	} else if (logoAnalysis && logoAnalysis.generation_prompt) {
		resultUrls.logo_image = await generateAndSave(logoAnalysis.generation_prompt, "logo", "1:1");
	} else {
		resultUrls.logo_image = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800"; // fallback
	}

	return resultUrls;
}

/**
 * Curate specific colors and typography based on the business category
 */
function pickDesignProfile(category: string) {
	// Enforce the premium "Bespoke Woodworking" editorial theme profile (beige/charcoal/rust)
	// to match the visual assets (hardcoded SVGs/icons) in the Elementor kit templates.
	return {
		name: "Bespoke Woodworking",
		palette: {
			background: "#E8E6DF",
			surface: "#ffffff",
			primary: "#141111",
			accent: "#80311B",
			text: "#141111",
			muted: "#6B6661",
			outline: "rgba(20, 17, 17, 0.12)",
		},
		typography: { heading: "Spartan", body: "Inter" },
	};
}

/**
 * Build a HomepageGenerationRequest from business data
 */
export function buildHomepageGenerationRequest(
	business: any,
): HomepageGenerationRequest {
	const images = collectBusinessImages(business);
	const [hero, service1, service2, ...gallery] = images;
	const design = pickDesignProfile(business.category || business.businessType || "");

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
			primary: design.palette.primary,
			accent: design.palette.accent,
			neutral: design.palette.background,
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

		log(`[RAW VERTEX RESPONSE]: ${jsonString}`);

		let parsed = JSON.parse(jsonString) as any;

		// Handle flat structure where sections are at root level (matching the prompt schema)
		if (parsed && parsed.hero && parsed.about && parsed.services && !parsed.elementorContent) {
			log("[Vertex] Detected direct root sections; wrapping under elementorContent");
			parsed = {
				elementorContent: {
					hero: parsed.hero,
					about: parsed.about,
					services: parsed.services,
					features: parsed.features,
					projects: parsed.projects,
					process: parsed.process,
					testimonials: parsed.testimonials,
				},
				notes: parsed.notes || "Auto-wrapped from direct root sections",
			};
		}

		// Validate response structure
		if (!parsed || !parsed.elementorContent || !parsed.elementorContent.hero || !parsed.elementorContent.about || !parsed.elementorContent.services) {
			throw new Error(
				"Invalid response structure: missing elementorContent or required sections (hero, about, services)",
			);
		}

		log(`[Vertex] Parsed response successfully`);
		log(
			`[Vertex] Generated Hero Heading: "${parsed.elementorContent.hero.heading}"`,
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
		// Run image visual pre-filtering and resolution
		log(`[DirectVertex] Starting image pre-filtering and resolution...`);
		const imageAnalysis = await analyzeAndFilterImages(business, log, {
			throttleGemini: options?.throttleGemini,
			debugSession: options?.debugSession
		});
		persist("01a-image-analysis.json", imageAnalysis);

		// Run dedicated logo analysis
		const logoAnalysis = await detectOrGenerateLogo(business, log, {
			throttleGemini: options?.throttleGemini,
			debugSession: options?.debugSession
		});
		persist("01logo-analysis.json", logoAnalysis);

		const resolvedImages = await resolveSectionImages(imageAnalysis, log, logoAnalysis);
		persist("01b-resolved-images.json", resolvedImages);

		// Build the request
		const request = buildHomepageGenerationRequest(business);
		
		// Overwrite standard images in request context with resolved/generated ones
		request.images = {
			hero: resolvedImages.hero_image,
			service1: resolvedImages.services_image,
			service2: resolvedImages.about_image,
			gallery: [resolvedImages.masked_image, ...resolvedImages.testimonials_slideshow],
		};
		persist("01-homepage-generation-request.json", request);

		log(`[DirectVertex] Starting deterministic homepage generation...`);

		// Call Vertex with deterministic prompt
		const response = await callVertexHomepageGeneration(
			VERTEX_HOMEPAGE_GENERATION_PROMPT,
			request,
			log,
			options,
		);

		// Ensure the final returned elementorContent image properties match the resolved images exactly
		if (response.elementorContent) {
			if (!response.elementorContent.hero) response.elementorContent.hero = {} as any;
			response.elementorContent.hero.hero_image = resolvedImages.hero_image;
			response.elementorContent.hero.masked_image = resolvedImages.masked_image;

			if (!response.elementorContent.about) response.elementorContent.about = {} as any;
			response.elementorContent.about.image = resolvedImages.about_image;

			if (!response.elementorContent.services) response.elementorContent.services = {} as any;
			response.elementorContent.services.image = resolvedImages.services_image;

			if (!response.elementorContent.testimonials) response.elementorContent.testimonials = {} as any;
			response.elementorContent.testimonials.slideshow = resolvedImages.testimonials_slideshow;

			// Add projects mapping
			if (!response.elementorContent.projects) response.elementorContent.projects = {} as any;
			(response.elementorContent.projects as any).posts = resolvedImages.project_posts;

			// Add logo image
			response.elementorContent.logo_image = resolvedImages.logo_image;
		}

		persist("02-vertex-response.json", response);

		// Build a minimal WebsiteSchema compatible with existing pipeline
		// This allows the rest of the system to use the generated content
		const schema: any = {
			id: business.id || `homepage-${Date.now()}`,
			businessId: business.id,
			businessName: business.name || "Untitled",
			schemaVersion: "1.0",
			meta: {
				businessId: business.id || `biz-${Date.now()}`,
				siteId: `site-${business.id || "business"}-${Date.now()}`,
				slug: (business.name || "site")
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/(^-|-$)/g, ""),
				version: 1,
				target: "wordpress",
				traceId: options?.debugSession?.traceId,
			},
			brand: {
				businessName: business.name || "Business",
				category: business.category || "Local Business",
				address: business.address || "",
				phone: business.phoneNumber || "",
				email: business.email || "",
				websiteUri: business.websiteUri || "",
				logo: resolvedImages.logo_image || business.logo || "",
			},
			seo: {
				title: `${business.name || "Business"} | Preview`,
				description: business.tagline || `Bespoke web presentation for ${business.name || "our client"}.`,
				keywords: [business.category || "Local Business"],
			},
			theme: (() => {
				const design = pickDesignProfile(business.category || business.businessType || "");
				const primary = request.colors?.primary || design.palette.primary;
				const accent = request.colors?.accent || design.palette.accent;
				const neutral = request.colors?.neutral || design.palette.background;
				return {
					primaryColor: primary,
					accentColor: accent,
					neutralColor: neutral,
					name: "modern-agency",
					mode: "light",
					palette: {
						primary: primary,
						surface: design.palette.surface,
						background: neutral,
						accent: accent,
						text: design.palette.text,
						muted: design.palette.muted,
						outline: design.palette.outline,
					},
					typography: {
						heading: design.typography.heading,
						body: design.typography.body,
					},
				};
			})(),
			sections: [],
			createdAt: new Date().toISOString(),
			_wordpressHtml: "",
			_renderSource: "direct-vertex-prompt",
			_generatedHomepage: response,
			elementorContent: response.elementorContent,
			notes: response.notes,
			_validation: {
				rating: business.rating || 0,
				reviewCount: business.reviewCount || 0,
				repairs: [],
				validatedAt: new Date().toISOString(),
				traceId: options?.debugSession?.traceId,
				photos: business.photos || [],
				imageSuggestions: business.imageSuggestions || [],
				logo: business.logo || "",
			},
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
