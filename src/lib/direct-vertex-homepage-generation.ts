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
import sharp from "sharp";
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

async function analyzeProjectImage(
	url: string,
	fallbackTitle: string,
	log: (msg: string) => void,
	options?: {
		throttleGemini?: () => Promise<void>;
		debugSession?: any;
	}
): Promise<string> {
	log(`[ImageAnalyzer] Downloading and analyzing Google Maps project image: ${url}`);
	const imgObj = await downloadImageAsBase64(url);
	if (!imgObj) {
		log(`[ImageAnalyzer] Failed to download or convert image: ${url}. Using fallback title: ${fallbackTitle}`);
		return fallbackTitle;
	}
	
	try {
		log(`[ImageAnalyzer] Running Gemini Vision analysis on image...`);
		const prompt = `This photo was uploaded to Google Maps for a cabinetry/woodworking business. Identify the specific cabinetry, furniture, or woodwork item shown in this photo (e.g., kitchen cabinets, closet shelving, wooden dining table, bathroom vanity, TV console, bookshelf, etc.). Respond with a short, professional, human-sounding project title (2 to 4 words maximum, capitalized) describing what the photo shows. Do not use generic words like 'Recent Project' or 'Woodworking'. Return ONLY the title itself, with no explanation or punctuation.`;
		
		const responseText = await generateWithFallback(
			[
				{
					role: "user",
					parts: [
						{ inlineData: { mimeType: imgObj.mimeType, data: imgObj.data } },
						{ text: prompt }
					]
				}
			],
			{
				temperature: 0.2,
			},
			{
				logStderr: log,
				debugSession: options?.debugSession,
				throttleGemini: options?.throttleGemini || (async () => {}),
				contextLabel: "project-image-caption"
			}
		);
		
		const title = responseText?.trim();
		if (title && title.length > 2 && title.length < 50) {
			log(`[ImageAnalyzer] Successfully analyzed image. Title: "${title}"`);
			return title;
		}
		
		log(`[ImageAnalyzer] Gemini response was empty or invalid. Response: "${responseText}". Using fallback: ${fallbackTitle}`);
		return fallbackTitle;
	} catch (e: any) {
		log(`[ImageAnalyzer] Error analyzing image: ${e.message || e}. Using fallback: ${fallbackTitle}`);
		return fallbackTitle;
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

	const globalStyle = "Scandinavian luxury editorial photography, Japandi-inspired interiors, soft natural daylight, matte walnut/oak textures, calm minimal compositions, realistic architectural photography, muted neutral palette, clean negative space, airy atmosphere, shallow depth of field, premium interior magazine aesthetic, avoid clutter, avoid construction-site feeling, avoid glossy CGI look, avoid oversaturated wood, avoid harsh lighting, avoid busy backgrounds, fully rendered scene showing the complete cabinetry, no blank vertical columns, no plain blocking walls, cinematic but understated, emotionally calm visual tone, consistent warm-beige color grading, charcoal shadows instead of pure black, matte surfaces only, soft contrast, minimal props, same lighting direction across sections, avoid visual density spikes, maintain editorial pacing between sections";

	return {
		hero_image: {
			action: "generate",
			generation_prompt: `A single minimalistic custom kitchen cabinet photograph, single continuous view, no grid, no collage, no multiple frames, no split screen, ${globalStyle}. Scandinavian editorial aesthetic, soft morning daylight, clean architectural composition, minimal decor styling, warm beige and walnut tones, realistic interior photography, calm premium atmosphere, matte finishes, luxury cabinetry integrated naturally into the environment. Wide cinematic framing, single visual focal point.`
		},
		masked_image: {
			action: "generate",
			generation_prompt: `A different single professional architectural photograph of a luxury modern cabinet corner or elegant storage sideboard cupboard, single continuous view, no grid, no collage, no multiple angles, no split screen, ${globalStyle}. Soft morning daylight, clean Scandinavian editorial aesthetic, realistic photo, Japandi interior styling, clean neutral background, matte textures, elegant cabinet proportions.`
		},
		about_image: {
			action: "generate",
			generation_prompt: `A premium professional studio flat lay photograph of luxury cabinet design details, samples and hardware on a solid, completely plain, blank pure white background. On the far left, a vertical arrangement of cabinetry sample boards (walnut wood panel with a gold/brass handle, smaller neutral tile), and on the far right, a vertical arrangement of cabinetry sample boards (light oak panel with a black knob handle, linen cloth folded), arranged solely on the left and right sides. Crucially, the wooden sample boards and all items on the left and right must be vertically compressed and centered, leaving a very large and generous empty white margin/padding (at least 20% to 25% of the image height) at both the top and bottom of the image frame. The wooden samples must be short and self-contained, completely surrounded by pure white empty space, and must never touch or run off the top or bottom edges of the image. The entire center 60% of the image must be a completely empty, solid, plain pure white negative space with no shadows, objects, or text. Soft natural daylight, clean Japandi/Scandinavian design aesthetic, matte finishes only.`
		},
		services_image: {
			action: "generate",
			generation_prompt: `Luxury built-in walnut shelving wall in modern living room, ${globalStyle}. Soft ambient lighting, Scandinavian interior design aesthetic, calm cinematic atmosphere, minimal furniture styling, realistic architectural photography, elegant minimal composition with empty space on one side.`
		},
		testimonials_slideshow: [
			{
				action: "generate",
				generation_prompt: `Luxury minimalist custom walk-in closet drawers with matte walnut paneling and brushed bronze pull handles, ${globalStyle}. Muted earth tones, spacious design layout.`
			},
			{
				action: "generate",
				generation_prompt: `Modern minimal bathroom vanity cabinet detail, matte oak panels with natural stone basin, ${globalStyle}. Clean lines, directional morning light.`
			},
			{
				action: "generate",
				generation_prompt: `Bespoke walnut kitchen island detail featuring integrated cabinet doors, ${globalStyle}. Clean joints, editorial cabinetry details.`
			}
		],
		project_posts: [
			{
				action: "generate",
				post_title: "Custom Kitchen Cabinetry",
				generation_prompt: `Luxury modern walnut kitchen cabinets detail shot, ${globalStyle}. Muted neutral palette, matte wood finishes.`
			},
			{
				action: "generate",
				post_title: "Minimalist Oak TV Console",
				generation_prompt: `Modern sleek floating oak console detail, ${globalStyle}. Clean scandinavian aesthetic, simple geometric lines.`
			},
			{
				action: "generate",
				post_title: "Luxury Walk-In Closet",
				generation_prompt: `Bespoke walk-in wardrobe storage setup with natural oak details, ${globalStyle}. Airy atmosphere, minimal clutter.`
			},
			{
				action: "generate",
				post_title: "Bespoke Home Office Shelving",
				generation_prompt: `Handcrafted built-in home office shelving system in matte walnut finish, ${globalStyle}. Spacious styling, calm atmosphere.`
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
	const name = business.name || "Business";
	log(`[LogoDetector] Generating minimalist stacked logo for: ${name}`);
	// Always generate a clean stacked logo — symbol on top, business name centered below
	const logoPrompt = `Premium minimalist stacked logo design for a business called "${name}". 
Layout: Vertical stacked layout. Place ONE beautiful, clean, prominent geometric icon or symbol mark on top (centered), and place the business name "${name}" centered directly below the symbol.
The business name "${name}" must use a clean, refined premium sans-serif or elegant serif typeface in dark charcoal or black.
The symbol on top should be larger, clean, and highly visible — for example: a refined craft tool silhouette, a geometric emblem, or a simple abstract outline.
Solid pure white background. No gradients. No drop shadows. No decorative frames or borders around the whole logo. No taglines.
The result must look like a real professional brand identity — clean, timeless, and suitable for a premium local business header logo.
Output: flat vector illustration style, black/dark ink on white, high contrast, high fidelity.`;
	return { action: "generate", generation_prompt: logoPrompt };
}

async function downloadImageToBuffer(url: string): Promise<Buffer> {
	const res = await crossFetch(url);
	if (!res.ok) {
		throw new Error(`Failed to download image from ${url}: ${res.statusText}`);
	}
	const arrayBuffer = await res.arrayBuffer();
	return Buffer.from(arrayBuffer);
}

async function generateFaviconFromLogo(
	logo: { path?: string; buffer?: Buffer },
	log: (msg: string) => void,
	businessName: string,
	generateFaviconSetFallback: () => Promise<string>
): Promise<string> {
	log(`[FaviconFromLogo] Starting extraction for "${businessName}"...`);
	let logoBuffer: Buffer;
	if (logo.buffer) {
		logoBuffer = logo.buffer;
	} else if (logo.path) {
		logoBuffer = fs.readFileSync(logo.path);
	} else {
		throw new Error("No logo path or buffer provided");
	}

	let extractedIconBuffer: Buffer | null = null;

	// 1. Try Vertex extraction
	const googleCloudApiKey = process.env.GOOGLE_CLOUD_API_KEY;
	if (googleCloudApiKey) {
		try {
			log(`[FaviconFromLogo] Sending logo to Vertex for icon extraction...`);
			const base64Logo = logoBuffer.toString("base64");
			const prompt = "Extract ONLY the symbol/icon part from this logo image (located on the left side). Generate a clean, high-resolution version containing only that symbol/icon, centered on a solid white background. Absolutely NO text, NO wordmark, and NO letters.";
			const base64Result = await generateCustomImage(prompt, {
				aspectRatio: "1:1",
				logStderr: log,
				inputImageBase64: base64Logo,
				inputImageMimeType: "image/png"
			});

			extractedIconBuffer = Buffer.from(base64Result, "base64");
			log(`[FaviconFromLogo] Vertex successfully extracted icon.`);
		} catch (err: any) {
			log(`[FaviconFromLogo] Vertex extraction failed: ${err.message || err}. Falling back to programmatic crop.`);
		}
	} else {
		log(`[FaviconFromLogo] No GOOGLE_CLOUD_API_KEY available. Using programmatic crop directly.`);
	}

	// 2. Programmatic Crop Fallback
	if (!extractedIconBuffer) {
		try {
			log(`[FaviconFromLogo] Performing programmatic crop of the logo's top-center section...`);
			const metadata = await sharp(logoBuffer).metadata();
			const width = metadata.width || 1024;
			const height = metadata.height || 576;

			// Crop a top-centered square (since the logo layout is stacked: symbol on top, text below)
			const cropSize = Math.min(width, height);
			const left = Math.max(0, Math.floor((width - cropSize) / 2));
			const top = 0;

			const topCenterCropBuffer = await sharp(logoBuffer)
				.extract({
					left,
					top,
					width: cropSize,
					height: cropSize
				})
				.toBuffer();

			extractedIconBuffer = topCenterCropBuffer;
			log(`[FaviconFromLogo] Programmatic crop successful (region: ${left},${top} size: ${cropSize}x${cropSize}).`);
		} catch (err: any) {
			log(`[FaviconFromLogo] Programmatic crop failed: ${err.message || err}`);
			throw err;
		}
	}

	// 3. Post-process the extracted icon buffer: Trim white space and center on a 512x512 transparent canvas
	try {
		log(`[FaviconFromLogo] Trimming white background from extracted icon...`);
		const trimmedBuffer = await sharp(extractedIconBuffer)
			.trim()
			.toBuffer();

		// Convert solid white background pixels to transparent
		const { data: rawData, info: rawInfo } = await sharp(trimmedBuffer)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });

		// Iterate over the RGBA channels and set alpha to 0 for white/near-white pixels
		for (let i = 0; i < rawData.length; i += 4) {
			const r = rawData[i];
			const g = rawData[i + 1];
			const b = rawData[i + 2];
			if (r > 240 && g > 240 && b > 240) {
				rawData[i + 3] = 0; // set alpha channel to 0
			}
		}

		// Recreate the transparent icon image buffer
		const transparentIconBuffer = await sharp(rawData, {
			raw: {
				width: rawInfo.width,
				height: rawInfo.height,
				channels: 4
			}
		})
		.png()
		.toBuffer();

		const canvasSize = 512;
		const padding = 46;
		const maxIconSize = canvasSize - (padding * 2);

		const masterFaviconBuffer = await sharp({
			create: {
				width: canvasSize,
				height: canvasSize,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: 0 }
			}
		})
		.composite([
			{
				input: await sharp(transparentIconBuffer)
					.resize(maxIconSize, maxIconSize, {
						fit: "inside",
						withoutEnlargement: true
					})
					.toBuffer(),
				gravity: "center"
			}
		])
		.png()
		.toBuffer();

		const publicDir = path.join(process.cwd(), "public");
		const imagesDir = path.join(publicDir, "generated-images");
		const faviconDir = path.join(imagesDir, "favicons");
		if (!fs.existsSync(faviconDir)) fs.mkdirSync(faviconDir, { recursive: true });

		const uid = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const baseUrl = process.env.API_URL || "https://api.digiscout.online";

		const sizes = [16, 32, 48, 180, 192, 512];
		for (const size of sizes) {
			const filename = `favicon-${size}x${size}-${uid}.png`;
			const filePath = path.join(faviconDir, filename);

			await sharp(masterFaviconBuffer)
				.resize(size, size)
				.png()
				.toFile(filePath);

			log(`[FaviconFromLogo] Saved ${size}x${size} favicon: ${filename}`);

			// Also save an inverted/light version for dark browser tabs
			const lightFilename = `favicon-${size}x${size}-light-${uid}.png`;
			const lightFilePath = path.join(faviconDir, lightFilename);
			await sharp(masterFaviconBuffer)
				.resize(size, size)
				.negate({ alpha: false })
				.png()
				.toFile(lightFilePath);

			log(`[FaviconFromLogo] Saved ${size}x${size} light favicon: ${lightFilename}`);
		}

		const favicon512Url = `${baseUrl}/public/generated-images/favicons/favicon-512x512-${uid}.png`;
		log(`[FaviconFromLogo] Complete favicon set generated from logo. Primary: ${favicon512Url}`);
		return favicon512Url;

	} catch (err: any) {
		log(`[FaviconFromLogo] Post-processing or saving failed: ${err.message || err}`);
		throw err;
	}
}

export async function resolveSectionImages(
	analysis: ImageAnalysisResult,
	log: (msg: string) => void,
	logoAnalysis?: { action: "use_existing" | "generate"; url?: string; generation_prompt?: string },
	business?: any,
	options?: {
		throttleGemini?: () => Promise<void>;
		debugSession?: any;
	}
): Promise<{
	hero_image: string;
	masked_image: string;
	about_image: string;
	services_image: string;
	testimonials_slideshow: string[];
	project_posts: Array<{ title: string; url: string }>;
	logo_image: string;
	favicon_image: string;
}> {
	const resultUrls: any = {
		hero_image: "",
		masked_image: "",
		about_image: "",
		services_image: "",
		testimonials_slideshow: [],
		project_posts: [],
		logo_image: "",
		favicon_image: "",
	};

	const getFallbackPlaceholder = (role: string): string => {
		// For the recent project section (project_ posts), do not use the local default folder.
		// Instead, fall back to our high-quality cabinetry/woodworking URLs.
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

		// 1. Try to look for local default images on the server under /public/default/ or copy from root/default/
		try {
			const rootDefaultDir = path.join(process.cwd(), "default");
			const publicDefaultDir = path.join(process.cwd(), "public", "default");
			if (!fs.existsSync(publicDefaultDir)) {
				fs.mkdirSync(publicDefaultDir, { recursive: true });
			}
			if (fs.existsSync(rootDefaultDir)) {
				const files = fs.readdirSync(rootDefaultDir).filter(f => 
					f.toLowerCase().endsWith(".png") || 
					f.toLowerCase().endsWith(".jpg") || 
					f.toLowerCase().endsWith(".jpeg")
				);
				for (const file of files) {
					const srcPath = path.join(rootDefaultDir, file);
					const destPath = path.join(publicDefaultDir, file);
					if (!fs.existsSync(destPath)) {
						fs.copyFileSync(srcPath, destPath);
					}
				}
			}

			if (fs.existsSync(publicDefaultDir)) {
				const files = fs.readdirSync(publicDefaultDir).filter(f => 
					f.toLowerCase().endsWith(".png") || 
					f.toLowerCase().endsWith(".jpg") || 
					f.toLowerCase().endsWith(".jpeg")
				);
				
				if (files.length > 0) {
					// Try to find a file containing the role name (e.g. hero, about, services, masked, logo)
					let selectedFile = files[0];
					if (role.toLowerCase().includes("hero")) {
						selectedFile = files[0 % files.length];
					} else if (role.toLowerCase().includes("about")) {
						selectedFile = files[1 % files.length];
					} else if (role.toLowerCase().includes("service")) {
						selectedFile = files[2 % files.length];
					} else if (role.toLowerCase().includes("masked")) {
						selectedFile = files[3 % files.length];
					} else {
						// Deterministic hash based on role name
						let hash = 0;
						for (let i = 0; i < role.length; i++) {
							hash = role.charCodeAt(i) + ((hash << 5) - hash);
						}
						const index = Math.abs(hash) % files.length;
						selectedFile = files[index];
					}

					const baseUrl = process.env.API_URL || "https://api.digiscout.online";
					const localUrl = `${baseUrl}/public/default/${selectedFile}`;
					log(`[ImageGenerator] Found local default fallback image for ${role}: ${localUrl}`);
					return localUrl;
				}
			}
		} catch (err: any) {
			log(`[ImageGenerator] Error scanning public/default directory: ${err.message}`);
		}

		// 2. Otherwise, fall back to our premium Unsplash cabinetry/woodworking URLs
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

		return fallbacks[role] || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80";
	};

	const generateAndSave = async (prompt: string, role: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "16:9"): Promise<string> => {
		try {
			let finalPrompt = prompt;
			if (role !== "logo") {
				finalPrompt = `${prompt} Crucially, the image must be a pure, clean photograph with absolutely NO text, NO logos, NO labels, NO buttons, NO overlays, NO icons, and NO watermarks.`;
			}
			const base64Bytes = await generateCustomImage(finalPrompt, { aspectRatio, logStderr: log });
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

	// 1. Hero Image (square aspect ratio matches the desktop split container half)
	if (analysis.hero_image.action === "use_existing" && analysis.hero_image.url) {
		resultUrls.hero_image = analysis.hero_image.url;
	} else {
		taskList.push({
			run: async () => {
				resultUrls.hero_image = await generateAndSave(analysis.hero_image.generation_prompt || "wooden chair chair modern", "hero", "1:1");
			}
		});
	}

	// 2. Masked Image (square detail shot matching hero aspect ratio)
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
			const analyzedTitle = await analyzeProjectImage(uniqueProjectPhotos[i], title, log, options);
			resultUrls.project_posts[i] = {
				title: analyzedTitle,
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

	// 7. Logo & Favicon Task
	const generateFaviconSet = async (): Promise<string> => {
		try {
			const businessName = business?.name || "Business";
			const words = businessName.trim().split(/\s+/);
			const initial = words.length >= 2
				? (words[0][0] + words[1][0]).toUpperCase()
				: businessName[0].toUpperCase();

			const publicDir = path.join(process.cwd(), "public");
			const imagesDir = path.join(publicDir, "generated-images");
			const faviconDir = path.join(imagesDir, "favicons");
			if (!fs.existsSync(faviconDir)) fs.mkdirSync(faviconDir, { recursive: true });

			const uid = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
			const baseUrl = process.env.API_URL || "https://api.digiscout.online";

			const masterSize = 512;
			const fontSize = Math.round(masterSize * 0.52);
			const svgTemplate = `<svg width="${masterSize}" height="${masterSize}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${masterSize}" height="${masterSize}" rx="${Math.round(masterSize * 0.18)}" fill="#1a1a1a"/>
  <text
    x="50%" y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="#ffffff"
    letter-spacing="-4"
  >${initial}</text>
</svg>`;

			const masterBuffer = await sharp(Buffer.from(svgTemplate))
				.png()
				.toBuffer();

			const sizes = [16, 32, 48, 180, 192, 512];
			for (const size of sizes) {
				const filename = `favicon-${size}x${size}-${uid}.png`;
				const filePath = path.join(faviconDir, filename);
				const lightFilename = `favicon-${size}x${size}-light-${uid}.png`;
				const lightFilePath = path.join(faviconDir, lightFilename);

				if (size <= 48) {
					const smallFontSize = Math.round(size * 0.62);
					const smallSvg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1a1a1a"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="Georgia, serif" font-size="${smallFontSize}" font-weight="bold" fill="#ffffff">${initial}</text>
</svg>`;
					await sharp(Buffer.from(smallSvg)).png().toFile(filePath);
					await sharp(Buffer.from(smallSvg)).negate({ alpha: false }).png().toFile(lightFilePath);
				} else {
					await sharp(masterBuffer).resize(size, size).png().toFile(filePath);
					await sharp(masterBuffer).resize(size, size).negate({ alpha: false }).png().toFile(lightFilePath);
				}
				log(`[FaviconGen] Saved ${size}x${size} favicon (initial: "${initial}"): ${filename}`);
				log(`[FaviconGen] Saved ${size}x${size} light favicon (initial: "${initial}"): ${lightFilename}`);
			}

			const favicon512Url = `${baseUrl}/public/generated-images/favicons/favicon-512x512-${uid}.png`;
			log(`[FaviconGen] Complete favicon set generated for "${businessName}" (initial: "${initial}"). Primary: ${favicon512Url}`);
			return favicon512Url;
		} catch (err: any) {
			log(`[FaviconGen] Favicon generation failed: ${err.message || err}. Skipping.`);
			return "";
		}
	};

	taskList.push({
		run: async () => {
			log(`[LogoFaviconTask] Starting logo and favicon generation...`);
			let logoPathOrBuffer: { path?: string; buffer?: Buffer } | null = null;

			// 1. Resolve or generate logo
			if (logoAnalysis && logoAnalysis.action === "use_existing" && logoAnalysis.url) {
				resultUrls.logo_image = logoAnalysis.url;
				log(`[LogoFaviconTask] Using existing logo URL: ${logoAnalysis.url}`);
				try {
					if (logoAnalysis.url.startsWith("http")) {
						log(`[LogoFaviconTask] Downloading existing logo for favicon extraction...`);
						const buffer = await downloadImageToBuffer(logoAnalysis.url);
						logoPathOrBuffer = { buffer };
					} else {
						const relativePath = logoAnalysis.url.replace(/^https?:\/\/[^\/]+/, "");
						const localPath = path.join(process.cwd(), relativePath);
						if (fs.existsSync(localPath)) {
							logoPathOrBuffer = { path: localPath };
						}
					}
				} catch (err: any) {
					log(`[LogoFaviconTask] Failed to fetch existing logo: ${err.message || err}`);
				}
			} else if (logoAnalysis && logoAnalysis.generation_prompt) {
				log(`[LogoFaviconTask] Generating new logo via AI...`);
				try {
					let prompt = logoAnalysis.generation_prompt;
					const base64Bytes = await generateCustomImage(prompt, { aspectRatio: "16:9", logStderr: log });
					const filename = `gen_logo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
					const publicDir = path.join(process.cwd(), "public");
					const imagesDir = path.join(publicDir, "generated-images");
					if (!fs.existsSync(imagesDir)) {
						fs.mkdirSync(imagesDir, { recursive: true });
					}
					const filePath = path.join(imagesDir, filename);
					const buffer = Buffer.from(base64Bytes, "base64");
					fs.writeFileSync(filePath, buffer);

					const baseUrl = process.env.API_URL || "https://api.digiscout.online";
					resultUrls.logo_image = `${baseUrl}/public/generated-images/${filename}`;
					logoPathOrBuffer = { path: filePath, buffer };
					log(`[LogoFaviconTask] Generated and saved logo to: ${resultUrls.logo_image}`);
				} catch (err: any) {
					log(`[LogoFaviconTask] Error generating logo: ${err.message || err}. Falling back to default.`);
					resultUrls.logo_image = getFallbackPlaceholder("logo");
				}
			} else {
				log(`[LogoFaviconTask] No logo configuration, using fallback logo.`);
				resultUrls.logo_image = getFallbackPlaceholder("logo");
			}

			// 2. Generate favicon from logo if logoPathOrBuffer is available
			if (logoPathOrBuffer) {
				try {
					resultUrls.favicon_image = await generateFaviconFromLogo(logoPathOrBuffer, log, business?.name || "Business", generateFaviconSet);
				} catch (err: any) {
					log(`[LogoFaviconTask] Favicon extraction from logo failed: ${err.message || err}. Falling back to letter-mark.`);
					resultUrls.favicon_image = await generateFaviconSet();
				}
			} else {
				log(`[LogoFaviconTask] No logo image available, using letter-mark favicon fallback.`);
				resultUrls.favicon_image = await generateFaviconSet();
			}
		}
	});

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

		const resolvedImages = await resolveSectionImages(imageAnalysis, log, logoAnalysis, business, {
			throttleGemini: options?.throttleGemini,
			debugSession: options?.debugSession
		});
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
			// Add favicon image
			(response.elementorContent as any).favicon_image = resolvedImages.favicon_image;
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
				favicon: resolvedImages.favicon_image || "",
				hours: business.hours || business.businessHours || "",
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
