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
				errorMsg = errorJson.error || errorJson.message || `${resp.status} ${resp.statusText}`;
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
		if ((err as any).status === 422) {
			throw err;
		}
		console.warn("Backend generate failed, returning dry-run schema:", err);
		// Return a conservative, editable schema for UI testing
		const now = Date.now();
		const category = (business.category || "").toLowerCase();
		const isHospitality =
			category.includes("restaurant") ||
			category.includes("cafe") ||
			category.includes("bakery");
		const isWellness =
			category.includes("salon") ||
			category.includes("spa") ||
			category.includes("wellness");
		const isFitness =
			category.includes("gym") ||
			category.includes("fitness") ||
			category.includes("training");
		const isProfessional =
			category.includes("law") ||
			category.includes("finance") ||
			category.includes("consult") ||
			category.includes("agency");
		const theme = isHospitality
			? {
					name: "Warm Editorial",
					style: "editorial hospitality",
					radius: "24px",
					layout: "editorial" as const,
					buttonStyle: "pill" as const,
					surfaceStyle: "glass" as const,
					mediaShape: "arched" as const,
					density: "airy" as const,
					accentMode: "earthy" as const,
					palette: {
						background: "#120f0b",
						surface: "rgba(32, 24, 18, 0.82)",
						primary: "#d97706",
						accent: "#f59e0b",
						text: "#fff8ee",
						muted: "#d6c6b8",
						outline: "rgba(255, 237, 213, 0.14)",
					},
					typography: { heading: "Fraunces", body: "Inter" },
				}
			: isWellness
				? {
						name: "Soft Luxe",
						style: "luxury wellness",
						radius: "30px",
						layout: "split-screen" as const,
						buttonStyle: "pill" as const,
						surfaceStyle: "glass" as const,
						mediaShape: "portrait" as const,
						density: "balanced" as const,
						accentMode: "luxury" as const,
						palette: {
							background: "#0b0a10",
							surface: "rgba(22, 18, 32, 0.86)",
							primary: "#c084fc",
							accent: "#f5d0fe",
							text: "#f8f5ff",
							muted: "#cabcd6",
							outline: "rgba(233, 213, 255, 0.14)",
						},
						typography: { heading: "Cormorant Garamond", body: "Inter" },
					}
				: isFitness
					? {
							name: "Electric Performance",
							style: "high-energy conversion",
							radius: "18px",
							layout: "immersive" as const,
							buttonStyle: "sharp" as const,
							surfaceStyle: "solid" as const,
							mediaShape: "square" as const,
							density: "compact" as const,
							accentMode: "neon" as const,
							palette: {
								background: "#07090f",
								surface: "#0f172a",
								primary: "#22c55e",
								accent: "#38bdf8",
								text: "#f8fafc",
								muted: "#94a3b8",
								outline: "rgba(148, 163, 184, 0.18)",
							},
							typography: { heading: "Space Grotesk", body: "Inter" },
						}
					: isProfessional
						? {
								name: "Modern Authority",
								style: "editorial professional",
								radius: "18px",
								layout: "minimal" as const,
								buttonStyle: "sharp" as const,
								surfaceStyle: "outline" as const,
								mediaShape: "rounded" as const,
								density: "balanced" as const,
								accentMode: "fresh" as const,
								palette: {
									background: "#f7f7f5",
									surface: "#ffffff",
									primary: "#0f766e",
									accent: "#2563eb",
									text: "#111827",
									muted: "#6b7280",
									outline: "rgba(17, 24, 39, 0.10)",
								},
								typography: { heading: "IBM Plex Sans", body: "Inter" },
							}
						: {
								name: "Noir Luxe",
								style: "premium glass editorial",
								radius: "28px",
								layout: "editorial" as const,
								buttonStyle: "pill" as const,
								surfaceStyle: "glass" as const,
								mediaShape: "rounded" as const,
								density: "balanced" as const,
								accentMode: "neon" as const,
								palette: {
									background: "#07070a",
									surface: "#111114",
									primary: "#7c3aed",
									accent: "#10b981",
									text: "#f4f4f5",
									muted: "#a1a1aa",
									outline: "rgba(255,255,255,0.10)",
								},
								typography: { heading: "Inter", body: "Inter" },
							};
		const schema: WebsiteSchema = {
			meta: {
				siteId: `dry-${business.id}-${now}`,
				businessId: business.id,
				slug: (business.name || "site")
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/(^-|-$)/g, ""),
				version: 1,
				target: "static",
			},
			theme: {
				...theme,
			},
			brand: {
				businessName: business.name || "Demo Business",
				category: business.category || "Local Business",
				address: business.address || "",
				phone: business.phoneNumber || "",
				email: business.email || "",
				websiteUri: business.websiteUri || "",
				logo: business.logo,
			},
			seo: {
				title: `${business.name || "Demo Business"} — Preview`,
				description: `Preview site for ${business.name || "Demo Business"}`,
				keywords: [business.category || "local", "preview"],
			},
			sections: [
				{
					id: "hero-1",
					type: "hero",
					variant:
						theme.layout === "minimal"
							? "centered"
							: theme.layout === "immersive"
								? "immersive"
								: "split",
					headline: `${business.name || "Your Business"}`,
					subheadline: isFitness
						? `High-performance ${business.category || "services"} designed to feel fast, bold, and conversion-focused.`
						: `Premium ${business.category || "services"} designed to convert.`,
					ctaPrimary: { label: "Book Now", href: "#contact" },
					badges: [theme.name, "New Prototype"],
					media: {
						type: "image",
						src:
							business.photos?.[0] ||
							"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
						alt: business.name || "Hero",
						logo: business.logo,
					},
				},
				{
					id: "features-1",
					type: "features",
					layout: theme.layout === "minimal" ? "list" : "cards",
					items: [
						{
							title:
								theme.layout === "minimal" ? "Core Value" : "Signature Service",
							description: isWellness
								? "Soft, polished, and reassuring messaging that feels aligned with a premium service experience."
								: isFitness
									? "Strong positioning with a clear transformation promise and high-energy visual hierarchy."
									: "A brief description of your key offering.",
						},
						{
							title: "Operational Excellence",
							description:
								"Streamlined processes, clear pricing, and a trusted team to deliver consistent quality.",
						},
						{
							title: "Customer Experience",
							description:
								"A focus on convenience, clear booking, and reliable follow-up to keep customers coming back.",
						},
					],
				},
				{
					id: "gallery-1",
					type: "gallery",
					items: [
						{
							src:
								business.photos?.[1] ||
								business.photos?.[0] ||
								"https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
							alt: "Photo 1",
						},
						{
							src:
								business.photos?.[2] ||
								business.photos?.[1] ||
								"https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
							alt: "Photo 2",
						},
						{
							src:
								business.photos?.[0] ||
								"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
							alt: "Photo 3",
						},
					],
				},
				{
					id: "testimonials-1",
					type: "testimonials",
					items: [
						{
							author: "Alex M.",
							quote: "Booking was seamless — highly recommend.",
						},
						{ author: "Jordan K.", quote: "Friendly staff and great results." },
					],
				},
				{
					id: "faq-1",
					type: "faq",
					items: [
						{
							question: "How do I book?",
							answer: "Use the booking link or call us during business hours.",
						},
						{
							question: "What are your hours?",
							answer: "Open daily with extended weekend hours.",
						},
					],
				},
				{ id: "contact-1", type: "contact", showEmail: true, showPhone: true },
			],
		};

		return {
			schema,
			debugTraceId: undefined,
			debugFallbackUsed: true,
		};
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

export async function fetchLeadAIChatHistory(leadId: string): Promise<AIChatMessage[]> {
	try {
		const resp = await fetch(`${API_URL}/api/business-ai-chat/${encodeURIComponent(leadId)}`);
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
	signal?: AbortSignal
): Promise<void> {
	const resp = await fetch(`${API_URL}/api/business-ai-chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ leadId, businessContext, messages }),
		signal
	});

	if (!resp.ok) {
		const text = await resp.text().catch(() => "");
		throw new Error(`Chat request failed: ${resp.status} ${resp.statusText} ${text}`);
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

export async function generateWebsiteContent(
	business: Business,
	options: {
		fallback: () => Promise<WebsiteSchema>;
		debugSession?: any;
		logStderr: (msg: string) => void;
		persistGenerationDebugFile: (session: any, fileName: string, content: any) => void;
		appendGenerationDebugError: (session: any, errorMsg: string) => void;
		throttleGemini: () => Promise<void>;
	}
): Promise<WebsiteSchema> {
	if (typeof window !== "undefined") {
		throw new Error("generateWebsiteContent can only be run on the server-side");
	}

	const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY;
	if (!apiKey) {
		options.logStderr("[Gemini Generation] No primary API key found. Running website generation via REST Fallback (gemini-flash-latest) immediately...");
		return await options.fallback();
	}

	try {
		options.logStderr("[Gemini Generation] Running website generation via SDK (gemini-3.1-pro-preview)...");
		const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = await import("@google/genai");
		const ai = new GoogleGenAI({ apiKey });
		const model = "gemini-3.1-pro-preview";

		const safetySettings = [
			{
				category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
				threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
			},
			{
				category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
				threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
			},
			{
				category: HarmCategory.HARM_CATEGORY_HARASSMENT,
				threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
			},
			{
				category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
				threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
			}
		];

		// Stage 0: Creative Direction
		options.logStderr("[Gemini SDK] Generating Stage 0 Creative Direction...");
		
		const buildImageBlock = (b: any) => {
			const sources = b.photos || [];
			return sources.length ? sources.slice(0, 10).map((u: string, i: number) => `${i + 1}. ${u}`).join("\n") : "None";
		};

		const buildReviewsBlock = (b: any) => {
			if (Array.isArray(b.reviews) && b.reviews.length) {
				return b.reviews.slice(0, 5).map((r: any, i: number) => `${i + 1}. ${r.rating || ""} - ${r.text || r.comment || ""}`).join("\n");
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

		// Enforce 10s gap
		await options.throttleGemini();

		const stage0Response = await ai.models.generateContent({
			model,
			contents: stage0Prompt,
			config: {
				thinkingConfig: { thinkingLevel: "HIGH" },
				safetySettings,
				responseMimeType: "application/json"
			}
		});

		const stage0Text = stage0Response.text;
		if (!stage0Text) {
			throw new Error("Empty response from Stage 0 SDK generation");
		}
		const creativeDirection = JSON.parse(stage0Text.trim());
		if (options.debugSession) {
			options.persistGenerationDebugFile(options.debugSession, "01a-creative-direction.json", creativeDirection);
		}

		// Stage 1: Website Schema JSON Layout (Multi-turn chat)
		options.logStderr("[Gemini SDK] Starting Stage 1 Layout Generation...");
		const chat = ai.chats.create({
			model,
			config: {
				thinkingConfig: { thinkingLevel: "HIGH" },
				safetySettings
			}
		});

		// Build Stage 1 prompt
		const qualificationNotes = business.notes || (business as any).qualificationNotes || "None";
		const neighborhood = business.neighborhood || business.vibe || "Unknown";
		const specialties = Array.isArray(business.specialties) ? business.specialties.join(", ") : business.specialties || "General services";
		const tone = business.tone || "professional";

		const stage1Prompt = `You are generating a PREMIUM WORDPRESS HOMEPAGE schema for a real local business based on the custom-designed Creative Direction Brief.

CREATIVE DIRECTION BRIEF:
${JSON.stringify(creativeDirection, null, 2)}

PRIMARY OBJECTIVE:
- Generate a highly bespoke, custom-themed WebsiteSchema that implements the Creative Direction Brief with extreme visual restraint, elegance, and emotional sophistication.
- FORCE LIGHT THEME: You MUST generate "light" or "textured-neutral" themes only. Under NO circumstances should any section backgrounds, cards, or hero wrappers be dark, charcoal, deep gray, or pitch black. All surfaces must be bright (warm eggshell, soft cream, linen, or white).
- GOOGLE MAPS IMAGES MANDATE: You MUST use the provided Google Maps photos from the "Reference Images" list directly for all image, media, or background URL properties in your sections. Do NOT invent external stock links or placeholder names. Simply copy the exact Google Maps URL strings from the list directly into your schema!
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
- Generative Design DNA: You MUST generate a "designDNA" object under "theme". This DNA system drives the adaptive visual rendering and mutation rules:
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

		// Enforce 10s gap
		await options.throttleGemini();

		// Use sendMessageStream as requested
		const schemaStream = await chat.sendMessageStream({ message: stage1Prompt });
		let schemaText = "";
		for await (const chunk of schemaStream) {
			schemaText += chunk.text;
		}

		if (options.debugSession) {
			options.persistGenerationDebugFile(options.debugSession, "03-gemini-raw-response.txt", schemaText);
		}

		// Parse the JSON schema
		let parsedSchema: WebsiteSchema;
		try {
			let cleanedJson = schemaText.trim();
			if (cleanedJson.startsWith("```")) {
				cleanedJson = cleanedJson.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
			}
			parsedSchema = JSON.parse(cleanedJson.trim()) as WebsiteSchema;
		} catch (parseError) {
			throw new Error(`Failed to parse Stage 1 generated schema JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
		}

		// Stage 2: WordPress HTML generation in same chat session
		options.logStderr("[Gemini SDK] Starting Stage 2 WordPress HTML Generation...");

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

		// Enforce 10s gap
		await options.throttleGemini();

		const htmlStream = await chat.sendMessageStream({ message: stage2Prompt });
		let htmlText = "";
		for await (const chunk of htmlStream) {
			htmlText += chunk.text;
		}

		if (options.debugSession) {
			options.persistGenerationDebugFile(options.debugSession, "05b-wordpress-html-raw.txt", htmlText);
		}

		let cleanedHtml = htmlText.trim();
		if (cleanedHtml.startsWith("```")) {
			cleanedHtml = cleanedHtml.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
		}

		if (!cleanedHtml) {
			throw new Error("Generated WordPress HTML was empty");
		}

		parsedSchema._wordpressHtml = cleanedHtml;
		parsedSchema._renderSource = "gemini-html";

		options.logStderr("[Gemini Generation] Primary SDK website generation succeeded!");
		return parsedSchema;
	} catch (sdkError) {
		options.logStderr(`[Gemini Generation] SDK generation failed. Switching to REST Fallback (gemini-flash-latest)... Error: ${sdkError instanceof Error ? sdkError.message : String(sdkError)}`);
		if (options.debugSession) {
			options.appendGenerationDebugError(options.debugSession, `sdk_generation_failed: ${sdkError instanceof Error ? sdkError.message : String(sdkError)}`);
		}
		
		try {
			return await options.fallback();
		} catch (fallbackError) {
			options.logStderr(`[Gemini Generation] Fallback REST generation also failed! Error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
			if (options.debugSession) {
				options.appendGenerationDebugError(options.debugSession, `fallback_generation_failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
			}
			throw new Error("AI_GENERATION_FAILED");
		}
	}
}
