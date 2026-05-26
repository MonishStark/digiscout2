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
import crossFetch from "cross-fetch";

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
		const res = await crossFetch(lowResUrl);
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
	log(`[ImageAnalyzer] Cabinetry focus: Returning custom cabinetry generation prompts for: ${business.name}`);

	const city = business.city || "Houston";
	const name = business.name || "Cabinetree";

	return {
		hero_image: {
			action: "generate",
			generation_prompt: `A high-end professional commercial architectural photograph of custom kitchen cabinetry built by ${name} in ${city}, premium finished walnut and oak cabinets, modern kitchen design, warm soft lighting, clean composition, 8k, detailed wood grain texture.`
		},
		masked_image: {
			action: "generate",
			generation_prompt: `A detailed close-up shot of a perfect dovetail joint in custom woodwork cabinetry by ${name}, premium craftsmanship, soft depth of field, warm lighting.`
		},
		about_image: {
			action: "generate",
			generation_prompt: `A professional photograph of a clean, modern woodworking workshop of ${name}, cabinetmaker craftsman building custom cabinets, sawdust in warm sunlight, high-end tools.`
		},
		services_image: {
			action: "generate",
			generation_prompt: `A beautiful custom built-in entertainment center bookcase cabinet installation in a luxurious living room, premium finished wood, clean modern architecture.`
		},
		testimonials_slideshow: [
			{
				action: "generate",
				generation_prompt: `Elegant modern custom bathroom vanity cabinet with marble top, gold fixtures, clean design.`
			},
			{
				action: "generate",
				generation_prompt: `Custom walk-in closet shelving system, premium white finish, organized drawers and hangers.`
			},
			{
				action: "generate",
				generation_prompt: `A custom handcrafted oak dining table detail shot, smooth finish, luxury dining room setting.`
			}
		],
		project_posts: [
			{
				action: "generate",
				post_title: "Custom Kitchen Cabinetry",
				generation_prompt: `A high-end professional commercial photograph of custom walnut kitchen cabinets, modern design, premium hardware.`
			},
			{
				action: "generate",
				post_title: "Minimalist Oak TV Console",
				generation_prompt: `A sleek modern minimalist oak TV console cabinet, clean lines, floating design.`
			},
			{
				action: "generate",
				post_title: "Luxury Walk-In Closet",
				generation_prompt: `A premium custom walk-in closet organization system, white wood finish, warm LED shelf lighting.`
			},
			{
				action: "generate",
				post_title: "Bespoke Home Office Shelving",
				generation_prompt: `A professional home office setup with bespoke built-in shelves and executive desk, dark oak finish.`
			}
		]
	};
}

export async function detectOrGenerateLogo(
	business: any,
	log: (msg: string) => void,
	options?: {
		throttleGemini?: () => Promise<void>;
		debugSession?: any;
	}
): Promise<{ action: "use_existing" | "generate"; url?: string; generation_prompt?: string }> {
	log(`[LogoDetector] Cabinetry focus: Returning custom cabinetry logo generation prompt for: ${business.name}`);
	const defaultPrompt = `A premium minimalist text-based typography logo featuring the business name "${business.name}" with a elegant modern wood chisel or fine tree icon, clean modern flat design, solid white background, sharp vector lines, high-end lettermark`;
	return { action: "generate", generation_prompt: defaultPrompt };
}

export async function resolveSectionImages(
	analysis: ImageAnalysisResult,
	log: (msg: string) => void,
	logoAnalysis?: { action: "use_existing" | "generate"; url?: string; generation_prompt?: string },
	business?: any
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

	const getFallbackPlaceholder = (role: string): string => {
		const fallbacks: Record<string, string> = {
			hero: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80", // Premium kitchen cabinetry
			masked: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80", // Wood grain texture
			about: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80", // Woodworking workshop
			services: "https://images.unsplash.com/photo-1539922980492-38f6673af8dd?w=1200&q=80", // Finished cabinetry
			logo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80" // Fallback logo emblem
		};

		if (role.startsWith("testimonial_")) {
			return "https://images.unsplash.com/photo-1558882224-cca166733360?w=800&q=80"; // Custom built-in closets
		}
		if (role.startsWith("project_")) {
			const projectPics = [
				"https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80",
				"https://images.unsplash.com/photo-1539922980492-38f6673af8dd?w=800&q=80",
				"https://images.unsplash.com/photo-1558882224-cca166733360?w=800&q=80",
				"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80"
			];
			const idx = parseInt(role.split("_")[1], 10) - 1 || 0;
			return projectPics[idx % projectPics.length] || projectPics[0];
		}

		return fallbacks[role] || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80";
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
			log(`[ImageGenerator] Error generating image for ${role}: ${err.message || err}. Falling back to default cabinetry placeholder.`);
			return getFallbackPlaceholder(role);
		}
	};

	const taskList: { run: () => Promise<void> }[] = [];

	// 1. Hero Image (taller aspect ratio like 3:4 is great for this carpenter layout)
	if (analysis.hero_image.action === "use_existing" && analysis.hero_image.url) {
		resultUrls.hero_image = analysis.hero_image.url;
	} else {
		taskList.push({
			run: async () => {
				resultUrls.hero_image = await generateAndSave(analysis.hero_image.generation_prompt || "wooden chair chair modern", "hero", "3:4");
			}
		});
	}

	// 2. Masked Image (square detail shot)
	if (analysis.masked_image.action === "use_existing" && analysis.masked_image.url) {
		resultUrls.masked_image = analysis.masked_image.url;
	} else {
		taskList.push({
			run: async () => {
				resultUrls.masked_image = await generateAndSave(analysis.masked_image.generation_prompt || "wood grain pattern detail close-up", "masked", "1:1");
			}
		});
	}

	// 3. About Image (landscape or square)
	if (analysis.about_image.action === "use_existing" && analysis.about_image.url) {
		resultUrls.about_image = analysis.about_image.url;
	} else {
		taskList.push({
			run: async () => {
				resultUrls.about_image = await generateAndSave(analysis.about_image.generation_prompt || "woodworking craftsman work", "about", "4:3");
			}
		});
	}

	// 4. Services Image (landscape)
	if (analysis.services_image.action === "use_existing" && analysis.services_image.url) {
		resultUrls.services_image = analysis.services_image.url;
	} else {
		taskList.push({
			run: async () => {
				resultUrls.services_image = await generateAndSave(analysis.services_image.generation_prompt || "carpentry workshop background", "services", "16:9");
			}
		});
	}

	// 5. Testimonials Slideshow (use direct high-quality Unsplash cabinet placeholders to save time and API limits)
	for (let i = 0; i < 3; i++) {
		resultUrls.testimonials_slideshow[i] = getFallbackPlaceholder(`testimonial_${i + 1}`);
	}

	// Extract actual Google Maps project photos (excluding logo if possible)
	const projectPhotos: string[] = [];
	if (business) {
		if (Array.isArray(business.photos)) {
			projectPhotos.push(...business.photos.map((url: any) => optimizeGooglePhotoUrl(url, 1600)));
		}
		if (Array.isArray(business.imageSuggestions)) {
			projectPhotos.push(...business.imageSuggestions.map((url: any) => optimizeGooglePhotoUrl(url, 1600)));
		}
		if (Array.isArray(business.reviews)) {
			business.reviews.forEach((r: any) => {
				if (Array.isArray(r.photos)) {
					projectPhotos.push(...r.photos.map((url: any) => typeof url === "string" ? optimizeGooglePhotoUrl(url, 1600) : ""));
				} else if (Array.isArray(r.images)) {
					projectPhotos.push(...r.images.map((url: any) => typeof url === "string" ? optimizeGooglePhotoUrl(url, 1600) : ""));
				}
			});
		}
	}
	const uniqueProjectPhotos = [...new Set(projectPhotos.filter(Boolean))];

	// 6. Project Posts (use direct actual Google Maps business photos first, then high-quality cabinet placeholders)
	const projectsList = analysis.project_posts || [];
	for (let i = 0; i < Math.min(4, projectsList.length); i++) {
		const item = projectsList[i];
		const title = item.post_title || `Project ${i + 1}`;
		
		if (uniqueProjectPhotos[i]) {
			log(`[ImageGenerator] Project "${title}": Using actual Google Maps photo: ${uniqueProjectPhotos[i]}`);
			resultUrls.project_posts[i] = {
				title,
				url: uniqueProjectPhotos[i]
			};
		} else {
			log(`[ImageGenerator] Project "${title}": No Google Maps photo found, using cabinet fallback`);
			resultUrls.project_posts[i] = {
				title,
				url: getFallbackPlaceholder(`project_${i + 1}`)
			};
		}
	}

	// 7. Logo
	if (logoAnalysis && logoAnalysis.action === "use_existing" && logoAnalysis.url) {
		resultUrls.logo_image = logoAnalysis.url;
	} else if (logoAnalysis && logoAnalysis.generation_prompt) {
		taskList.push({
			run: async () => {
				resultUrls.logo_image = await generateAndSave(logoAnalysis.generation_prompt, "logo", "16:9");
			}
		});
	} else {
		resultUrls.logo_image = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80"; // fallback
	}

	// Run remaining 5 image tasks with a concurrency limit of 2 to keep speed high and stay safe from rate limits
	if (taskList.length > 0) {
		log(`[ImageGenerator] Queueing ${taskList.length} AI image generation tasks with concurrency limit of 2...`);
		let nextIndex = 0;
		const worker = async () => {
			while (nextIndex < taskList.length) {
				const index = nextIndex++;
				try {
					await taskList[index].run();
				} catch (err: any) {
					log(`[ImageGenerator] Worker task error: ${err.message || err}`);
				}
			}
		};
		const limit = 2;
		const workers = Array.from({ length: Math.min(limit, taskList.length) }, worker);
		await Promise.all(workers);
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

		const resolvedImages = await resolveSectionImages(imageAnalysis, log, logoAnalysis, business);
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
