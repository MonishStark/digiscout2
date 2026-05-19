/** @format */

import { Business, WebsiteSchema } from "../types";

const API_URL =
	((import.meta as any).env?.VITE_API_URL as string | undefined) ||
	"http://localhost:5001";

export interface GeneratedWebsiteResult {
	schema: WebsiteSchema;
	debugTraceId?: string;
	debugFallbackUsed?: boolean;
}

export async function generateWebsite(
	business: Business,
): Promise<GeneratedWebsiteResult> {
	try {
		const resp = await fetch(`${API_URL}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(business),
		});

		if (!resp.ok) {
			let errorMsg = "";
			try {
				const errorJson = await resp.json();
				errorMsg =
					errorJson.error ||
					errorJson.message ||
					`${resp.status} ${resp.statusText}`;
			} catch {
				const text = await resp.text().catch(() => "");
				errorMsg = text || `${resp.status} ${resp.statusText}`;
			}
			const errorObj = new Error(errorMsg);
			(errorObj as any).status = resp.status;
			throw errorObj;
		}

		const payload = (await resp.json()) as WebsiteSchema;
		return {
			schema: payload,
			debugTraceId: resp.headers.get("x-debug-generation-id") || undefined,
			debugFallbackUsed:
				(
					resp.headers.get("x-debug-generation-fallback") || ""
				).toLowerCase() === "true",
		};
	} catch (err) {
		throw err;
	}
}

export async function generateOutreachEmail(
	business: Business,
	websiteUrl: string,
) {
	// Placeholder: outreach generation should be proxied to the server for safety.
	return `Subject: Modern website for ${business.name}\n\nHi ${business.name},\n\nWe created a prototype website at ${websiteUrl}.`;
}

export interface AIChatMessage {
	role: "user" | "model";
	content: string;
	created_at?: string;
}

export async function fetchLeadAIChatHistory(
	leadId: string,
): Promise<AIChatMessage[]> {
	try {
		const resp = await fetch(
			`${API_URL}/api/business-ai-chat/${encodeURIComponent(leadId)}`,
		);
		if (!resp.ok) {
			throw new Error("Failed to fetch chat history");
		}
		const data = await resp.json();
		return data.messages || [];
	} catch (error) {
		console.error("Failed to fetch chat history:", error);
		return [];
	}
}

export async function askBusinessAIChatStream(
	leadId: string,
	businessContext: any,
	messages: AIChatMessage[],
	onChunk: (chunk: string) => void,
	signal?: AbortSignal,
): Promise<void> {
	const resp = await fetch(`${API_URL}/api/business-ai-chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ leadId, businessContext, messages }),
		signal,
	});

	if (!resp.ok) {
		const text = await resp.text().catch(() => "");
		throw new Error(
			`Chat request failed: ${resp.status} ${resp.statusText} ${text}`,
		);
	}

	const reader = resp.body?.getReader();
	if (!reader) {
		const text = await resp.text().catch(() => "");
		onChunk(text);
		return;
	}

	const decoder = new TextDecoder("utf-8");
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		const chunk = decoder.decode(value, { stream: true });
		onChunk(chunk);
	}
}

export async function generateWithFallback(
	promptOrContents: string | any[],
	config: { temperature?: number; responseMimeType?: string } = {},
	options: {
		logStderr: (msg: string) => void;
		appendGenerationDebugError?: (session: any, errorMsg: string) => void;
		debugSession?: any;
		throttleGemini: () => Promise<void>;
		persistGenerationDebugFile?: (
			session: any,
			fileName: string,
			content: any,
			append?: boolean,
		) => void;
		contextLabel?: string;
	},
): Promise<string> {
	const googleCloudApiKey = process.env.GOOGLE_CLOUD_API_KEY;
	const geminiApiKey = process.env.GEMINI_API_KEY;
	const geminiRestUrl =
		process.env.GEMINI_REST_URL ||
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

	const contents =
		typeof promptOrContents === "string"
			? [{ role: "user", parts: [{ text: promptOrContents }] }]
			: promptOrContents;
	const contextLabel = options.contextLabel || "unknown-stage";
	const logProvider = (payload: {
		provider: string;
		model: string;
		status: "success" | "failure";
		outputChars?: number;
		error?: string;
	}) => {
		if (!options.debugSession || !options.persistGenerationDebugFile) return;
		const line = `[${new Date().toISOString()}] stage=${contextLabel} provider=${payload.provider} model=${payload.model} status=${payload.status}${payload.outputChars !== undefined ? ` outputChars=${payload.outputChars}` : ""}${payload.error ? ` error=${payload.error}` : ""}`;
		options.persistGenerationDebugFile(
			options.debugSession,
			"00-provider.log",
			line,
			true,
		);
	};

	// 1. Primary Path: Vertex AI
	if (googleCloudApiKey) {
		const apiEndpoint =
			process.env.VERTEX_API_ENDPOINT || "aiplatform.googleapis.com";
		const modelId = "gemini-3.1-pro-preview";
		const generateContentApi = "streamGenerateContent";
		const vertexUrl = `https://${apiEndpoint}/v1/publishers/google/models/${modelId}:${generateContentApi}?key=${googleCloudApiKey}`;
		try {
			options.logStderr(`[AI] Primary Vertex Attempt (${apiEndpoint})...`);
			await options.throttleGemini();

			const payload: any = {
				contents,
				generationConfig: {
					temperature: config.temperature ?? 1.0,
					thinkingConfig: {
						thinkingLevel: "HIGH",
					},
				},
				safetySettings: [
					{ category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
					{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
					{ category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
					{ category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
				],
				tools: [{ googleSearch: {} }],
			};

			if (config.responseMimeType) {
				payload.generationConfig.responseMimeType = config.responseMimeType;
			}

			const res = await fetch(vertexUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				const data = (await res.json()) as any;
				let text = "";
				if (Array.isArray(data)) {
					for (const chunk of data) {
						const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
						if (chunkText) text += chunkText;
					}
				} else {
					text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
				}
				if (text) {
					options.logStderr(`[AI] Vertex Success!`);
					logProvider({
						provider: "vertex",
						model: modelId,
						status: "success",
						outputChars: text.length,
					});
					return text;
				}
				throw new Error("Vertex response contents parts were empty");
			}
			const errText = await res.text().catch(() => "");
			throw new Error(
				`Vertex REST failed with status ${res.status}: ${errText}`,
			);
		} catch (err: any) {
			options.logStderr(
				`[AI] Vertex Failed, Switching to Gemini Flash... Error: ${err.message || err}`,
			);
			logProvider({
				provider: "vertex",
				model: modelId,
				status: "failure",
				error: err?.message || String(err),
			});
			if (options.debugSession && options.appendGenerationDebugError) {
				options.appendGenerationDebugError(
					options.debugSession,
					`vertex_failed: ${err.message || err}`,
				);
			}
		}
	} else {
		options.logStderr(
			`[AI] GOOGLE_CLOUD_API_KEY not found. Skipping Vertex, trying Public Gemini...`,
		);
	}

	// 2. Secondary Path: Public Gemini API (Fallback Path)
	if (geminiApiKey) {
		const fallbackUrl = `${geminiRestUrl}${geminiRestUrl.includes("?") ? "&" : "?"}key=${geminiApiKey}`;
		try {
			options.logStderr(`[AI] Fallback Public Gemini Attempt...`);
			await options.throttleGemini();

			const payload: any = {
				contents,
				generationConfig: {
					temperature: config.temperature ?? 1.0,
				},
			};

			if (config.responseMimeType) {
				payload.generationConfig.responseMimeType = config.responseMimeType;
			}

			const res = await fetch(fallbackUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				const data = (await res.json()) as any;
				const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
				if (text) {
					options.logStderr(`[AI] Public Gemini Success!`);
					logProvider({
						provider: "public-gemini",
						model: geminiRestUrl,
						status: "success",
						outputChars: text.length,
					});
					return text;
				}
				throw new Error("Public Gemini response contents parts were empty");
			}
			const errText = await res.text().catch(() => "");
			throw new Error(
				`Public Gemini REST failed with status ${res.status}: ${errText}`,
			);
		} catch (err: any) {
			options.logStderr(
				`[AI] Public Gemini Failed. Error: ${err.message || err}`,
			);
			logProvider({
				provider: "public-gemini",
				model: geminiRestUrl,
				status: "failure",
				error: err?.message || String(err),
			});
			if (options.debugSession && options.appendGenerationDebugError) {
				options.appendGenerationDebugError(
					options.debugSession,
					`public_gemini_failed: ${err.message || err}`,
				);
			}
		}
	} else {
		options.logStderr(`[AI] GEMINI_API_KEY not found.`);
	}

	options.logStderr(`[AI] Both attempts failed. Triggering UI Alert.`);
	throw new Error("AI_CRITICAL_FAILURE");
}

export async function generateWebsiteContentLegacy(
	business: Business,
	options: {
		fallback: () => Promise<WebsiteSchema>;
		debugSession?: any;
		logStderr: (msg: string) => void;
		persistGenerationDebugFile: (
			session: any,
			fileName: string,
			content: any,
			append?: boolean,
		) => void;
		appendGenerationDebugError: (session: any, errorMsg: string) => void;
		throttleGemini: () => Promise<void>;
		parseWebsiteSchemaOutput?: (
			rawText: string,
			business: any,
			debugSession?: any,
		) => WebsiteSchema | null;
	},
): Promise<WebsiteSchema> {
	if (typeof window !== "undefined") {
		throw new Error(
			"generateWebsiteContent can only be run on the server-side",
		);
	}

	try {
		const buildImageBlock = (b: any) => {
			const sources = b.photos || [];
			return sources.length
				? sources
						.slice(0, 10)
						.map((u: string, i: number) => `${i + 1}. ${u}`)
						.join("\n")
				: "None";
		};

		const buildReviewsBlock = (b: any) => {
			if (Array.isArray(b.reviews) && b.reviews.length) {
				return b.reviews
					.slice(0, 5)
					.map(
						(r: any, i: number) =>
							`${i + 1}. ${r.rating || ""} - ${r.text || r.comment || ""}`,
					)
					.join("\n");
			}
			return "None";
		};

		const stage0Prompt = `You are a premium Senior Staff Brand Director and Art Director.
Establish a custom brand Creative Direction Brief based on:
Business Name: ${business.name}
Category: ${business.category || "Local Service"}
Address: ${business.address || "N/A"}
Phone: ${business.phoneNumber || "N/A"}
Reviews:
${buildReviewsBlock(business)}
Reference Images:
${buildImageBlock(business)}

Return ONLY a valid JSON object matching this structure:
{
  "emotionalTone": "...",
  "brandPersonality": { "luxuryVsApproachable": 50, "technicalVsEmotional": 50, "modernVsHeritage": 50, "industrialVsEditorial": 50, "minimalistVsLayered": 50, "premiumVsEnergetic": 50 },
  "visualIdentity": { "themeMode": "light", "colorPalettePhilosophy": "...", "primaryColorIntent": "...", "accentColorIntent": "...", "backgroundColorIntent": "...", "surfaceColorIntent": "..." },
  "compositionPhilosophy": { "alignment": "asymmetrical", "layoutCadence": "...", "spacingRhythm": "balanced", "sectionTransitions": "..." },
  "typographyMood": { "headingFontFamily": "...", "bodyFontFamily": "...", "moodDescriptor": "..." },
  "mediaTreatment": { "style": "...", "shapes": ["..."] },
  "motionAndInteractions": { "personality": "subtle", "feel": "..." },
  "premiumReferences": ["..."],
  "atmosphericDirectionDescription": "...",
  "designTokens": {
    "spacingScale": { "xs": "...", "sm": "...", "md": "...", "lg": "...", "xl": "...", "xxl": "..." },
    "typographyScale": { "heroHeadline": "clamp(...)", "sectionHeadline": "clamp(...)", "bodyText": "clamp(...)", "headingFont": "...", "bodyFont": "..." },
    "radiusSystem": { "sm": "...", "md": "...", "lg": "...", "full": "..." },
    "shadowSystem": { "soft": "...", "premium": "...", "intense": "..." },
    "textureSystem": { "mode": "grain", "styleString": "..." },
    "animationTimingSystem": { "easingCurve": "...", "revealDuration": "..." },
    "layeringDepthSystem": { "zBack": "...", "zBase": "...", "zOverlay": "..." },
    "colorRamp": { "background": "...", "surface": "...", "primary": "...", "accent": "...", "text": "...", "muted": "...", "outline": "..." },
    "gradientSystem": { "ambientLighting": "...", "brandGradient": "..." }
  }
}`;

		// Stage 0: Creative Direction
		options.logStderr(
			"[Gemini Generation] Stage 0: Generating Creative Direction...",
		);
		const stage0Text = await generateWithFallback(
			stage0Prompt,
			{ temperature: 0.2, responseMimeType: "application/json" },
			options,
		);
		options.logStderr(
			`[Gemini Generation] Stage 0 Output (Creative Direction): ${stage0Text}`,
		);
		const creativeDirection = JSON.parse(stage0Text.trim());
		if (options.debugSession) {
			options.persistGenerationDebugFile(
				options.debugSession,
				"01a-creative-direction.json",
				creativeDirection,
			);
		}

		// Build Stage 1 prompt
		const qualificationNotes =
			business.notes || (business as any).qualificationNotes || "None";
		const neighborhood = business.neighborhood || business.vibe || "Unknown";
		const specialties = Array.isArray(business.specialties)
			? business.specialties.join(", ")
			: business.specialties || "General services";
		const tone = business.tone || "professional";

		const stage1Prompt = `You are a premium Senior Front-end Architect.
Generate a structured website schema matching the exact design decisions in the Creative Direction Brief.
Your design decisions must respect:
${JSON.stringify(creativeDirection, null, 2)}

Modern layout rules (MUST ENFORCE):
- Avoid excessive, empty whitespace that causes the site to feel "underdeveloped" or generic startup-like. Maintain tight, high-impact padding variables to ensure a cohesive, robust visual experience.
- Break free from templates. Create a unique pacing, visual flow, and section rhythm specifically suited for this business, prioritizing fewer, more high-impact sections over many repetitive ones.
- Enforce the brand's visual identity (theme mode, color palette, custom gradients, typography pairing) with absolute consistency. Avoid excessive mutations or contrast mismatch.

COPYWRITING INSTRUCTIONS (CRITICAL):
- TONE: Journalistic, confident, and highly specific. Write like an editor for Monocle or GQ.
- RULE 1: NO AI SPEAK. Permanently ban words like: "Unlock, Discover, Unleash, Elevate, Premier, Top-Notch, Cutting-Edge, Tailored, Seamless." 
- RULE 2: Show, Don't Tell. Instead of "We offer the best plumbing services," write "Emergency leak repair and pipe routing in under 45 minutes."
- RULE 3: Use hyper-local anchors. Reference the actual neighborhood, street, or city vibe provided in the context to make it feel grounded.
- RULE 4: Hero Subheadlines must state exactly what the business does, who it is for, and where it is located in plain, striking English.

DYNAMIC SECTIONS & COMPOSITION ORCHESTRATION:
- Do NOT use a standard, repetitive section structure.
- You have full creative control over which sections exist, their sequence, and their hierarchy to optimize the brand's narrative.
- You do NOT write raw HTML. Instead, you are the Creative Director and Orchestrator.
- For EVERY section in the "sections" array, you MUST generate a highly custom "composition" object instructing our premium rendering engine how to build that section.

COMPOSITION DICTIONARY OPTIONS (Choose appropriate properties matching business category tone):
"composition": {
  "sectionType": Choose from [
    "cinematicHero", "editorialHero", "splitNarrativeHero", 
    "asymmetricalFeatures", "glassFeatureCards", "processNarrative", 
    "immersiveGallery", "floatingImageStack", 
    "floatingTestimonialWall", 
    "layeredCTA", 
    "luxuryMetricsStrip", "storytellingTimeline", "transformationShowcase", 
    "premiumContactPanel", "accordionClean"
  ],
  "layoutBehavior": Choose from [
    "offset-right", "offset-left", "grid-stagger", "asymmetrical", "side-by-side", "split-grid", "centered-dramatic", "horizontal-carousel", "diagonal-split"
  ],
  "visualDepth": Choose from [
    "layered-atmospheric", "glassmorphic", "frosted-glow", "dramatic-depth", "flat-minimalist"
  ],
  "motionStyle": Choose from [
    "premiumFade", "cinematicReveal", "staggerLift", "softFloat", "atmosphericParallax", "editorialSlide", "luxuryGlow"
  ],
  "imageTreatment": Choose from [
    "layeredGlass", "editorialCrop", "cinematicBleed", "atmosphericOverlay", "luxuryFrame", "brutalistSharp", "floatingDepth", "diagonalWedge"
  ],
  "spacingMode": Choose from [
    "luxury-editorial", "balanced", "compact", "airy"
  ],
  "themeIntensity": Choose from [
    "dramatic", "soft", "balanced", "high-contrast"
  ],
  "hierarchyWeight": Choose from [
    "dominant", "supporting", "breathing", "cinematicPause", "transitionary"
  ]
}

THEME DESIGN SYSTEM:
- Choose the theme mode determined in the Creative Direction Brief: "${creativeDirection.visualIdentity.themeMode}".
- Derive all palette colors (background, surface, primary, accent, text, muted, outline) directly from the visualIdentity and brand personality intents.
- Generative Design DNA: You MUST generate a "designDNA" object under "theme" this DNA system drives the adaptive visual rendering and mutation rules:
  "designDNA": {
    "spacingPersonality": Choose from ["compressed", "balanced", "airy", "luxury-editorial", "brutalist-dense"],
    "compositionAggression": Number (0 to 100 representing layout mutation/offset levels),
    "hierarchyIntensity": Number (0 to 100 representing font size scales & weight variance),
    "motionEnergy": Number (0 to 100 representing stagger/speed timings),
    "visualDensity": Number (0 to 100 representing complexity/content density),
    "asymmetryLevel": Number (0 to 100 representing vertical alignment shifts and margins offsets),
    "atmosphereIntensity": Number (0 to 100 representing ambient radial glow levels & noise opacity),
    "typographyDominance": Choose from ["restrained", "balanced", "dominant-serif", "brutalist-impact", "cinematic-oversized", "layered-typography-walls", "vertical-accents"],
    "imageWeight": Number (0 to 100 representing image coverage vs text layout),
    "luxuryScore": Number (0 to 100 representing rounded smooth cards, high-end serif styling),
    "cinematicScore": Number (0 to 100 representing dark themes, immersive split and bleed panels),
    "brutalismScore": Number (0 to 100 representing blocky outlines, sharp text, raw structural elements),
    "editorialScore": Number (0 to 100 representing warm neutral tones, spacious asymmetric structures),
    "softnessScore": Number (0 to 100 representing rounded curves, fluid overlays, low-contrast shadows),
    "visualAtmosphere": Choose from ["industrial-grit", "luxury-glow", "soft-editorial-warmth", "cinematic-darkness", "energetic-neon", "architectural-minimalism"]
  }

Business Context:
- Name: ${business.name}
- Category: ${business.category || "Local Service"}
- Address: ${business.address || "N/A"}
- Phone: ${business.phoneNumber || "N/A"}
- Email: ${business.email || "NONE PROVIDED"}
- Website: ${business.websiteUri || "N/A"}
- Logo: ${business.logo || "None"}

Qualification Notes:
${qualificationNotes}

Neighborhood / Vibe:
${neighborhood}

Service Specialties:
${specialties}

Customer Tone / Sentiment:
${tone}

Reviews:
${buildReviewsBlock(business)}

Reference Images:
${buildImageBlock(business)}

Return only valid JSON matching the WebsiteSchema interface. Include the "designDNA" object under "theme" exactly as specified. Do not enclose in markdown code fences.`;

		// Stage 1: Website Schema JSON Layout
		options.logStderr(
			"[Gemini Generation] Stage 1: Generating Layout Schema...",
		);
		if (options.debugSession) {
			options.persistGenerationDebugFile(
				options.debugSession,
				"02-stage1-prompt.md",
				stage1Prompt,
			);
		}
		const schemaText = await generateWithFallback(
			stage1Prompt,
			{ temperature: 0.9, responseMimeType: "application/json" },
			{ ...options, contextLabel: "stage1-schema" },
		);
		options.logStderr(
			`[Gemini Generation] Stage 1 Output (Raw Schema): ${schemaText}`,
		);
		if (options.debugSession) {
			options.persistGenerationDebugFile(
				options.debugSession,
				"03-gemini-raw-response.txt",
				schemaText,
			);
		}

		// Parse the JSON schema
		let parsedSchema: WebsiteSchema;
		try {
			let cleanedJson = schemaText.trim();
			if (cleanedJson.startsWith("```")) {
				cleanedJson = cleanedJson
					.replace(/^```[a-zA-Z]*\n/, "")
					.replace(/\n```$/, "");
			}
			if (options.parseWebsiteSchemaOutput) {
				const result = options.parseWebsiteSchemaOutput(
					cleanedJson,
					business,
					options.debugSession,
				);
				if (!result) {
					throw new Error("parseWebsiteSchemaOutput returned null/failed");
				}
				parsedSchema = result;
			} else {
				parsedSchema = JSON.parse(cleanedJson.trim()) as WebsiteSchema;
			}
			options.logStderr(
				`[Gemini Generation] Stage 1 Parsed & Normalized Schema: ${JSON.stringify(parsedSchema, null, 2)}`,
			);
		} catch (parseError) {
			throw new Error(
				`Failed to parse Stage 1 generated schema JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
			);
		}

		// Stage 2: WordPress HTML generation in same simulated chat session
		options.logStderr(
			"[Gemini Generation] Stage 2: Generating WordPress HTML...",
		);
		const stage2Prompt = `You are turning the approved website schema you just generated into the FINAL WordPress homepage HTML.

Return ONLY homepage HTML suitable for WordPress post_content.
Do not return JSON.
Do not explain anything.
Do not wrap the response in markdown unless it is a plain \`\`\`html fenced block.
Do not output JavaScript.
Use one initial <style> block if needed, then the homepage markup.
Render the sections in the schema order exactly as provided.
Use the exact business copy and exact media URLs from the schema.
Do not collapse the page into a common in-house template.
Make the composition, spacing, typography treatment, and hierarchy feel bespoke to this business.
Light theme only.
No site header chrome, no WordPress admin text, no fake badges like "crafted for premium presentation".
No generic placeholder copy.

MODERN UI & STYLING CONSTRAINTS (Apply via inline styles):
- SPACING: Stop using hard pixel values for padding. Use fluid clamp spacing: padding: clamp(4rem, 8vw, 8rem) 5%;
- BORDERS & SURFACES: For cards (bento grids, features, testimonials), use modern soft UI. Apply: background: #ffffff; border: 1px solid rgba(0,0,0,0.05); border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.03);
- TYPOGRAPHY HIERARCHY: Make h1 massive and tight: font-size: clamp(3.5rem, 8vw, 6rem); line-height: 1.05; tracking: -0.02em; Make paragraph text readable: font-size: 1.125rem; line-height: 1.6; color: rgba(0,0,0,0.7);
- IMAGES: Never use raw sharp corners. All images must have border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); unless they are explicitly arched.
- BENTO GRID REFINEMENT: Ensure gap spacing is modern. display: grid; gap: 24px;.`;

		if (options.debugSession) {
			options.persistGenerationDebugFile(
				options.debugSession,
				"05a-wordpress-html-prompt.md",
				stage2Prompt,
			);
		}

		const stage2Contents = [
			{ role: "user", parts: [{ text: stage1Prompt }] },
			{ role: "model", parts: [{ text: JSON.stringify(parsedSchema, null, 2) }] },
			{ role: "user", parts: [{ text: stage2Prompt }] },
		];

		const htmlText = await generateWithFallback(
			stage2Contents,
			{ temperature: 0.75 },
			{ ...options, contextLabel: "stage2-wordpress-html" },
		);
		options.logStderr(
			`[Gemini Generation] Stage 2 Output (Raw HTML): ${htmlText}`,
		);
		if (options.debugSession) {
			options.persistGenerationDebugFile(
				options.debugSession,
				"05b-wordpress-html-raw.txt",
				htmlText,
			);
		}

		let cleanedHtml = htmlText.trim();
		if (cleanedHtml.startsWith("```")) {
			cleanedHtml = cleanedHtml
				.replace(/^```[a-zA-Z]*\n/, "")
				.replace(/\n```$/, "");
		}
		options.logStderr(
			`[Gemini Generation] Stage 2 Cleaned HTML: ${cleanedHtml}`,
		);

		if (!cleanedHtml) {
			throw new Error("Generated WordPress HTML was empty");
		}
		if (options.debugSession) {
			options.persistGenerationDebugFile(
				options.debugSession,
				"05c-wordpress-html-final.html",
				cleanedHtml,
			);
		}

		parsedSchema._wordpressHtml = cleanedHtml;
		parsedSchema._renderSource = "gemini-html";

		options.logStderr(
			"[Gemini Generation] Primary website generation succeeded!",
		);
		return parsedSchema;
	} catch (error) {
		options.logStderr(
			`[Gemini Generation] Generation pipeline failed. Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		if (options.debugSession) {
			options.appendGenerationDebugError(
				options.debugSession,
				`generation_failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		throw error;
	}
}

export async function generateWebsiteContent(
	business: Business,
	options: {
		fallback: () => Promise<WebsiteSchema>;
		debugSession?: any;
		logStderr: (msg: string) => void;
		persistGenerationDebugFile: (
			session: any,
			fileName: string,
			content: any,
			append?: boolean,
		) => void;
		appendGenerationDebugError: (session: any, errorMsg: string) => void;
		throttleGemini: () => Promise<void>;
		parseWebsiteSchemaOutput?: (
			rawText: string,
			business: any,
			debugSession?: any,
		) => WebsiteSchema | null;
	},
): Promise<WebsiteSchema> {
	if (typeof window !== "undefined") {
		throw new Error(
			"generateWebsiteContent can only be run on the server-side",
		);
	}

	try {
		options.logStderr(
			"[Visual Pipeline] Starting multi-stage visual intelligence generation...",
		);
		const { generateWebsiteWithVisualIntelligence } = await import(
			/* @vite-ignore */ "./visual-intelligence-pipeline"
		);
		const schema = await generateWebsiteWithVisualIntelligence(business, {
			debugSession: options.debugSession,
			logStderr: options.logStderr,
			persistGenerationDebugFile: options.persistGenerationDebugFile,
			appendGenerationDebugError: options.appendGenerationDebugError,
			llmJson: async (promptOrContents: string | any[], contextLabel: string) => {
				return generateWithFallback(
					promptOrContents,
					{ temperature: 0.65, responseMimeType: "application/json" },
					{ ...options, contextLabel },
				);
			},
		});

		options.logStderr(
			"[Visual Pipeline] Success. Using composition-first render output.",
		);
		return schema;
	} catch (visualPipelineError) {
		options.logStderr(
			`[Visual Pipeline] Failed. Falling back to legacy pipeline. Error: ${visualPipelineError instanceof Error ? visualPipelineError.message : String(visualPipelineError)}`,
		);

		if (options.debugSession) {
			options.appendGenerationDebugError(
				options.debugSession,
				`visual_pipeline_failed: ${visualPipelineError instanceof Error ? visualPipelineError.message : String(visualPipelineError)}`,
			);
		}

		return generateWebsiteContentLegacy(business, options);
	}
}
