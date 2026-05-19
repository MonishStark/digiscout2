/** @format */

import { Business, WebsiteSchema, WebsiteSection } from "../types";
import { generateIndustryVisualPsychology } from "./industry-psychology-engine";
import {
	generateLayoutDNA,
	validateLayoutDNAUniqueness,
} from "./layout-dna-engine";
import {
	calculateVisualEntropyScore,
	shouldRegenerateCompositions,
	getEntropyReport,
} from "./visual-entropy-engine";
import {
	detectAIWebsitePatterns,
	getRemediationStrategy,
} from "./ai-website-detector";
import {
	generateWebsiteFingerprint,
	checkSimilarityToExisting,
	storeFingerprint,
} from "./website-memory-engine";
import {
	LayoutDNA,
	IndustryVisualPsychology,
	TypographyBehavior,
	CompositionSystem,
	NarrativeComposition,
	MotionLanguage,
	VisualEntropyScore,
	WebsiteFingerprint,
	ImageIntelligence,
} from "./composition-architecture";
import { renderCompositionPreviewDocument } from "./composition-renderer";

export interface PipelineGenerationOptions {
	debugSession?: any;
	logStderr: (msg: string) => void;
	persistGenerationDebugFile: (
		session: any,
		fileName: string,
		content: any,
		append?: boolean,
	) => void;
	appendGenerationDebugError: (session: any, errorMsg: string) => void;
	llmJson: (
		promptOrContents: string | any[],
		contextLabel: string,
	) => Promise<string>;
}

function traceLog(
	options: PipelineGenerationOptions,
	stage: string,
	label: string,
	payload: any,
	append = false,
) {
	const traceId = options.debugSession?.traceId || "no-trace";
	const header = `[${traceId}][${stage}] ${label}`;
	try {
		options.logStderr(
			`${header} ${typeof payload === "string" ? payload : JSON.stringify(payload)}`,
		);
	} catch (e) {
		try {
			console.warn(header, payload);
		} catch {}
	}
	try {
		if (options.debugSession && options.persistGenerationDebugFile) {
			const safeName =
				`${stage.toLowerCase().replace(/[^a-z0-9]+/g, "_")}-${label.replace(/[^a-z0-9.-]+/gi, "_")}`.slice(
					0,
					160,
				);
			options.persistGenerationDebugFile(
				options.debugSession,
				`${safeName}.log`,
				payload,
				append,
			);
		}
	} catch (e) {
		try {
			options.appendGenerationDebugError?.(
				options.debugSession,
				`trace_write_failed: ${String(e)}`,
			);
		} catch {}
	}
}

interface BusinessIntelligence {
	industryArchetype: string;
	customerDemographic: string;
	brandPersonality: string[];
	emotionalTone: string;
	trustStyle: string;
	localVisualCulture: string;
	conversionIntent: "bookings" | "walk-ins" | "consultations" | "commerce";
}

interface BrandStrategy {
	typographyPhilosophy: string;
	spacingPhilosophy: string;
	visualRhythm: string;
	compositionPhilosophy: string;
	interactionPhilosophy: string;
	motionLanguage: string;
	densityStrategy: string;
	asymmetryStrategy: string;
	imageryStrategy: string;
}

interface VisualMoodboard {
	references: string[];
	compositionStyles: string[];
	gridBehavior: string;
	whitespaceStrategy: string;
	editorialRhythm: string;
	colorAtmosphere: string;
	animationMood: string;
	imageTreatmentSystem: string;
}

interface LayoutSectionPlan {
	type: WebsiteSection["type"];
	priority: number;
	layoutMode: string;
	span: "full" | "wide" | "split";
	offset: number;
	density: "tight" | "balanced" | "airy";
	visualTension: "low" | "medium" | "high";
}

interface LayoutCompositionPlan {
	grid: {
		columns: number;
		maxWidth: string;
		gutters: string;
	};
	sections: LayoutSectionPlan[];
	heroMode: "immersive" | "editorial-split" | "systems";
	asymmetryBias: number;
	depthBias: number;
	conversionIntent?:
		| "bookings"
		| "walk-ins"
		| "consultations"
		| "commerce"
		| "mixed";
}

interface VisualCritique {
	whitespaceBalance: number;
	hierarchyStrength: number;
	compositionUniqueness: number;
	imageRhythm: number;
	ctaProminence: number;
	premiumFeel: number;
	issues: string[];
	refinementActions: string[];
}

interface VisualTokens {
	palette: {
		background: string;
		surface: string;
		primary: string;
		accent: string;
		text: string;
		muted: string;
		outline: string;
	};
	typography: {
		heading: string;
		body: string;
		scaleHero: string;
		scaleH2: string;
		scaleBody: string;
	};
	spacing: {
		sectionY: string;
		sectionYTight: string;
		gutter: string;
		cardPad: string;
	};
	motion: {
		revealDuration: string;
		ease: string;
	};
}

function hashSeed(value: string) {
	const input = value || "seed";
	let hash = 2166136261;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash +=
			(hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
	}
	return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}

function pick<T>(seed: string, values: T[]): T {
	const num = parseInt(seed, 16);
	return values[num % values.length];
}

function industryPreset(category: string) {
	const c = (category || "").toLowerCase();
	if (c.includes("law") || c.includes("attorney")) {
		return {
			archetype: "structured-authority",
			palette: {
				background: "#f4f3f1",
				surface: "#ffffff",
				primary: "#1f2a37",
				accent: "#9c7b4f",
				text: "#121722",
				muted: "#4f5b67",
				outline: "rgba(17,24,39,0.14)",
			},
			typography: { heading: "Fraunces", body: "Manrope" },
		};
	}
	if (c.includes("restaurant") || c.includes("cafe") || c.includes("bakery")) {
		return {
			archetype: "sensory-immersion",
			palette: {
				background: "#f8f5ef",
				surface: "#fffdf9",
				primary: "#6a2f1f",
				accent: "#d5862d",
				text: "#2a2018",
				muted: "#6d5945",
				outline: "rgba(42,32,24,0.12)",
			},
			typography: { heading: "Cormorant Garamond", body: "Sora" },
		};
	}
	if (c.includes("architecture") || c.includes("studio")) {
		return {
			archetype: "brutalist-editorial",
			palette: {
				background: "#efefed",
				surface: "#ffffff",
				primary: "#151515",
				accent: "#4f84ff",
				text: "#111111",
				muted: "#444444",
				outline: "rgba(0,0,0,0.18)",
			},
			typography: { heading: "Space Grotesk", body: "IBM Plex Sans" },
		};
	}
	if (c.includes("fitness") || c.includes("gym")) {
		return {
			archetype: "kinetic-energy",
			palette: {
				background: "#f2f6f9",
				surface: "#ffffff",
				primary: "#0f172a",
				accent: "#ff4d2d",
				text: "#10131a",
				muted: "#4b5563",
				outline: "rgba(15,23,42,0.15)",
			},
			typography: { heading: "Archivo", body: "Space Grotesk" },
		};
	}
	if (c.includes("saas") || c.includes("software") || c.includes("ai")) {
		return {
			archetype: "futuristic-systems",
			palette: {
				background: "#f6f7ff",
				surface: "#ffffff",
				primary: "#1e2a78",
				accent: "#23b6ff",
				text: "#121933",
				muted: "#5b6480",
				outline: "rgba(30,42,120,0.16)",
			},
			typography: { heading: "Sora", body: "Inter" },
		};
	}
	return {
		archetype: "modern-editorial-premium",
		palette: {
			background: "#f5f6f8",
			surface: "#ffffff",
			primary: "#111827",
			accent: "#3366ff",
			text: "#141a27",
			muted: "#576079",
			outline: "rgba(17,24,39,0.12)",
		},
		typography: { heading: "General Sans", body: "Manrope" },
	};
}

function buildBusinessIntelligence(business: Business): BusinessIntelligence {
	const category = business.category || "local business";
	const lower = category.toLowerCase();
	const conversionIntent =
		lower.includes("restaurant") || lower.includes("cafe")
			? "bookings"
			: lower.includes("store") || lower.includes("shop")
				? "commerce"
				: lower.includes("law") || lower.includes("consult")
					? "consultations"
					: "walk-ins";

	return {
		industryArchetype: industryPreset(category).archetype,
		customerDemographic:
			conversionIntent === "commerce"
				? "price-aware but design-conscious local buyers"
				: "decision-focused local customers seeking trust and proof",
		brandPersonality: ["credible", "distinctive", "high-conviction", "modern"],
		emotionalTone:
			lower.includes("fitness") || lower.includes("gym")
				? "motivating and energetic"
				: "confident and refined",
		trustStyle:
			lower.includes("law") || lower.includes("finance")
				? "structured authority with evidence"
				: "social proof with craft signals",
		localVisualCulture: business.address || "urban contemporary",
		conversionIntent,
	};
}

async function buildBrandStrategy(
	business: Business,
	intel: BusinessIntelligence,
	options: PipelineGenerationOptions,
): Promise<BrandStrategy> {
	const prompt = `PREMIUM BRAND STRATEGY ARCHITECT — Design Uniquely for ${business.name}

Your mission: Create a completely bespoke visual identity and composition language grounded ONLY in this business's category, psychology, and local context. REJECT all template patterns.

FORBIDDEN OUTPUTS:
- Standard SaaS/startup layouts (hero-features-testimonials-CTA repeats)
- Centered, symmetrical grid systems
- Bootstrap-style card layouts
- Generic spacing rhythms
- Startup vocabulary ("Unlock," "Unleash," "Elevate," "Seamless," "Cutting-Edge")

BUSINESS SPECIFICS:
Name: ${business.name}
Category: ${business.category}
Archetype: ${intel.industryArchetype}
Customer Type: ${intel.customerDemographic}
Emotional Tone: ${intel.emotionalTone}
Trust Style: ${intel.trustStyle}
Local Culture: ${intel.localVisualCulture}
Conversion: ${intel.conversionIntent}

Return ONLY valid JSON with these keys (every value must be specific to THIS business, not generic):
{
  "typographyPhilosophy": "Custom font pairing logic grounded in this industry's visual expectations",
  "spacingPhilosophy": "Breathing vs. density rules unique to how customers perceive this category",
  "visualRhythm": "Specific pacing patterns: tight hero, breathing proof, dense CTA? Or inverted?",
  "compositionPhilosophy": "Unique asymmetric or editorial approach. E.g., 'diagonal splits with floating media' or 'staggered grids with layered content'",
  "interactionPhilosophy": "Motion personality specific to the business vibe",
  "motionLanguage": "Is it kinetic/energetic, editorial/slow, cinematic/dramatic, or subtle/trust-focused?",
  "densityStrategy": "How does visual weight change from top to bottom to maintain engagement?",
  "asymmetryStrategy": "Specific offset and alignment rules to create uniqueness without feeling chaotic",
  "imageryStrategy": "Crop styles, overlay treatments, depth techniques custom to this business"
}`;
	try {
		// Persist full creative brief prompt
		traceLog(options, "CREATIVE_BRIEF", "brand_strategy_prompt", prompt);
		const raw = await options.llmJson(prompt, "brand-strategy-agent");
		// Persist raw AI response (untruncated)
		traceLog(options, "CREATIVE_BRIEF", "brand_strategy_raw_response", raw);
		try {
			const parsed = JSON.parse(raw) as BrandStrategy;
			traceLog(options, "CREATIVE_BRIEF", "brand_strategy_parsed", parsed);
			return parsed;
		} catch (parseErr) {
			traceLog(
				options,
				"CREATIVE_BRIEF",
				"brand_strategy_parse_error",
				String(parseErr),
			);
			throw parseErr;
		}
	} catch {
		return {
			typographyPhilosophy:
				"Oversized heading contrast with compact body rhythm.",
			spacingPhilosophy:
				"Cadenced section compression with deliberate breathing zones.",
			visualRhythm:
				"High-contrast alternation between dense and airy sections.",
			compositionPhilosophy:
				"Asymmetric split grids with layered media anchors.",
			interactionPhilosophy:
				"Intentional motion on reveals and CTA hover depth.",
			motionLanguage: "Subtle cinematic translate and opacity choreography.",
			densityStrategy:
				"Start dense above the fold, then progressively breathe.",
			asymmetryStrategy:
				"Offset blocks and uneven column weight to build tension.",
			imageryStrategy:
				"Narrative-led crops with overlapping foreground accents.",
		};
	}
}

async function buildVisualMoodboard(
	business: Business,
	strategy: BrandStrategy,
	options: PipelineGenerationOptions,
): Promise<VisualMoodboard> {
	const prompt = `CUSTOM VISUAL MOODBOARD — Composition Language for ${business.name}

You are designing the visual mood and composition aesthetic EXCLUSIVELY for this business. Reject generic references and template patterns.

Business: ${business.name}
Category: ${business.category}
Brand Strategy: ${JSON.stringify(strategy)}

Create a UNIQUE moodboard with these specific outputs:

{
  "references": ["3-5 specific high-end design/editorial references that match this business's vibe — NOT generic templates"],
  "compositionStyles": ["Specific asymmetric, layered, or editorial techniques to apply throughout — e.g., 'diagonal image bleeds', 'offset stagger grids', 'overlapping panels'"],
  "gridBehavior": "Specific grid system — e.g., '12-column with 40% offset first column' or '5-column grid with asymmetric spans'",
  "whitespaceStrategy": "How to use negative space for this specific business psychology — NOT generic 'balanced'",
  "editorialRhythm": "Specific pacing pattern from hero to footer — tight-breathable-dense? Dense-breathing-tight?",
  "colorAtmosphere": "Specific color usage rules for this category, NOT generic neutral palettes",
  "animationMood": "Motion personality — kinetic-energetic, editorial-slow, cinematic-dramatic, subtle-understated, etc.",
  "imageTreatmentSystem": "Specific image crop, overlay, and depth techniques — e.g., 'cinematic crops with atmospheric grain', 'soft vignettes', 'bold asymmetric bleeds'"
}`;
	try {
		traceLog(options, "MOODBOARD", "moodboard_prompt", prompt);
		const raw = await options.llmJson(prompt, "visual-moodboard-agent");
		traceLog(options, "MOODBOARD", "moodboard_raw_response", raw);
		try {
			const parsed = JSON.parse(raw) as VisualMoodboard;
			traceLog(options, "MOODBOARD", "moodboard_parsed", parsed);
			return parsed;
		} catch (parseErr) {
			traceLog(options, "MOODBOARD", "moodboard_parse_error", String(parseErr));
			throw parseErr;
		}
	} catch {
		return {
			references: ["Awwwards editorial", "Framer premium"],
			compositionStyles: ["offset split", "stagger grid", "layered hero"],
			gridBehavior: "12-column adaptive with asymmetrical pulls",
			whitespaceStrategy: "rhythm-compressed with tension breaks",
			editorialRhythm: "dense intro, breathable proof, strong CTA closure",
			colorAtmosphere: "high-contrast modern neutral with accent pulse",
			animationMood: "deliberate reveal sequencing",
			imageTreatmentSystem: "editorial crops with atmospheric overlay",
		};
	}
}

function buildCompositionPlan(
	business: Business,
	intel: BusinessIntelligence,
	seed: string,
): LayoutCompositionPlan {
	const heroMode = pick(seed, [
		"immersive",
		"editorial-split",
		"systems",
	] as const);

	// Vary section order and selection based on business category and conversion intent
	// This prevents template-like "hero-features-testimonials-cta" repetition across all sites
	let baseSections: WebsiteSection["type"][] = ["hero", "contact"];
	const c = (business.category || "").toLowerCase();

	if (
		intel.conversionIntent === "bookings" ||
		c.includes("restaurant") ||
		c.includes("salon") ||
		c.includes("gym")
	) {
		// Booking-focused: social proof first, then showcase, then features
		baseSections = [
			"hero",
			"testimonials",
			"gallery",
			"features",
			"cta",
			"faq",
			"contact",
		];
	} else if (
		intel.conversionIntent === "consultations" ||
		c.includes("law") ||
		c.includes("consult") ||
		c.includes("agency")
	) {
		// Consultation-focused: authority first, then proof/credentials, then engagement
		baseSections = [
			"hero",
			"features",
			"testimonials",
			"gallery",
			"cta",
			"contact",
		];
	} else if (
		intel.conversionIntent === "commerce" ||
		c.includes("store") ||
		c.includes("shop")
	) {
		// E-commerce: visual showcase first, features second, proof last before CTA
		baseSections = [
			"hero",
			"gallery",
			"features",
			"testimonials",
			"cta",
			"contact",
		];
	} else {
		// Default mixed-intent flow
		baseSections = [
			"hero",
			"features",
			"gallery",
			"testimonials",
			"faq",
			"cta",
			"contact",
		];
	}

	// Remove sections that don't match business profile
	if (c.includes("law") || c.includes("finance") || c.includes("legal")) {
		// Law/finance: remove gallery and faq (not needed)
		baseSections = baseSections.filter((t) => t !== "gallery" && t !== "faq");
	}
	if (!business.photos || business.photos.length < 2) {
		// No photos: remove gallery entirely
		baseSections = baseSections.filter((t) => t !== "gallery");
	}

	const sections = baseSections.map((type, index) => {
		const sectionSeed = hashSeed(`${seed}-${type}-${index}`);
		return {
			type,
			priority: index,
			layoutMode: pick(sectionSeed, [
				"split-offset",
				"staggered-grid",
				"overlap-layer",
				"editorial-stack",
			]),
			span: pick(sectionSeed, ["full", "wide", "split"] as const),
			offset: (parseInt(sectionSeed.slice(0, 2), 16) % 5) - 2,
			density: pick(sectionSeed, ["tight", "balanced", "airy"] as const),
			visualTension: pick(sectionSeed, ["low", "medium", "high"] as const),
		};
	});

	return {
		grid: {
			columns: 12,
			maxWidth: "min(1320px, 92vw)",
			gutters: "clamp(1rem, 2vw, 2rem)",
		},
		sections,
		heroMode,
		asymmetryBias: intel.industryArchetype.includes("structured") ? 35 : 70,
		depthBias: intel.industryArchetype.includes("kinetic") ? 75 : 55,
		conversionIntent: intel.conversionIntent,
	};
}

function classifyImages(
	photos: string[],
	business: Business,
	category: string,
): ImageIntelligence[] {
	return photos.map((src, index) => {
		const lower = src.toLowerCase();
		let classification: ImageIntelligence["classification"];

		if (lower.includes("portrait")) {
			classification = "portrait";
		} else if (lower.includes("interior")) {
			classification = "interior-full";
		} else if (lower.includes("detail") || lower.includes("texture")) {
			classification = "texture-abstract";
		} else if (lower.includes("people") || lower.includes("person")) {
			classification = "people-single";
		} else if (lower.includes("product")) {
			classification = "product-isolated";
		} else if (lower.includes("sign") || lower.includes("logo")) {
			classification = "signage-text";
		} else if (lower.includes("workspace")) {
			classification = "workspace";
		} else {
			classification = "landscape";
		}

		const emotionalTone =
			classification === "workspace" || classification === "product-isolated"
				? "professional"
				: classification === "people-single" ||
					  classification === "people-group"
					? "warm"
					: classification === "texture-abstract"
						? "moody"
						: "calm";

		const suggestedTreatment =
			classification === "portrait" || classification === "people-single"
				? "overlapped"
				: classification === "landscape"
					? "full-bleed"
					: classification === "texture-abstract"
						? "textured-bg"
						: "accent-pop";

		return {
			src,
			classification,
			dominantColor: index % 2 === 0 ? "#121212" : "#999999",
			aspectRatio: classification === "portrait" ? 0.75 : 1.6,
			hasText: /text|sign|logo/i.test(src),
			hasfaces: /people|portrait|face|person/i.test(src),
			emotionalTone,
			suggestedTreatment,
		};
	});
}

function buildTypographyBehavior(
	psychology: IndustryVisualPsychology,
	layoutDNA: LayoutDNA,
): TypographyBehavior {
	const role =
		psychology.typographyBehavior === "restrained-serif"
			? "supporting"
			: psychology.typographyBehavior === "compressed-kinetic"
				? "dominant"
				: "breathing";
	return {
		hierarchyRole: role,
		lineCompressionRatio:
			psychology.typographyBehavior === "compressed-kinetic"
				? 1.15
				: psychology.typographyBehavior === "expansive-airy"
					? 1.9
					: 1.4,
		sizeProgression:
			psychology.typographyBehavior === "layered-wall"
				? "exponential"
				: psychology.typographyBehavior === "compressed-kinetic"
					? "stepped"
					: "smooth",
		scanGuidance: layoutDNA.scanPath.includes("diagonal")
			? "diagonal"
			: layoutDNA.scanPath.includes("vertical")
				? "vertical"
				: "horizontal",
		emotionalPacing:
			psychology.pagePacing === "fast-kinetic"
				? "aggressive"
				: psychology.pagePacing === "slow-meditative"
					? "calm"
					: "moderate",
		fontRationale: `Typography supports ${psychology.emotionalTarget} with ${psychology.typographyBehavior} structure and ${layoutDNA.dominantAxis} movement.`,
		bodySizeRange: [16, 20],
		headingSizeRange: [32, 64],
	};
}

function buildMotionLanguage(
	psychology: IndustryVisualPsychology,
	layoutDNA: LayoutDNA,
): MotionLanguage {
	return {
		character: psychology.motionCharacter.includes("cinematic")
			? "cinematic"
			: psychology.motionCharacter.includes("kinetic")
				? "kinetic"
				: psychology.motionCharacter.includes("tactile")
					? "tactile"
					: "ambient",
		primaryDirection:
			layoutDNA.dominantAxis === "diagonal"
				? "diagonal"
				: layoutDNA.dominantAxis === "radial"
					? "spiral"
					: layoutDNA.dominantAxis === "vertical"
						? "ascending"
						: "horizontal",
		defaultDuration:
			psychology.motionCharacter === "kinetic-bounce" ? 900 : 1200,
		defaultEasing:
			psychology.motionCharacter === "ambient-breathing"
				? "ease-in-out"
				: "ease-out",
		parallaxDepth: layoutDNA.depthBehavior.includes("immersive")
			? "aggressive"
			: "subtle",
		hoverBehavior:
			psychology.motionCharacter === "tactile-feedback"
				? "pronounced"
				: "subtle",
		staggerPattern:
			psychology.pagePacing === "fast-kinetic" ? "offset" : "wave",
		colorAnimation: "subtle",
		compositionMotion: {
			"establish-authority": { enterAnimation: "reveal-up" },
			"prove-credibility": { enterAnimation: "fade-layer" },
			"showcase-work": { enterAnimation: "slide-in" },
			"build-emotion": { enterAnimation: "reveal-layer" },
			"generate-desire": { enterAnimation: "overscroll" },
			"explain-process": { enterAnimation: "scale-in" },
			"facilitate-action": { enterAnimation: "pop-in" },
			"close-conversion": { enterAnimation: "cinematic-reveal" },
		},
	};
}

function buildCompositionSystems(
	plan: LayoutCompositionPlan,
	layoutDNA: LayoutDNA,
	typography: TypographyBehavior,
): CompositionSystem[] {
	return plan.sections.map((section) => {
		const preferredRenderSystem =
			layoutDNA.imageWeighting === "images-dominant" ? "css-grid" : "css-grid";
		const overlapBehavior =
			section.layoutMode === "overlap-layer"
				? "immersive"
				: section.layoutMode === "staggered-grid"
					? "subtle"
					: "none";
		return {
			engineType:
				section.layoutMode === "split-offset"
					? "scan-path"
					: section.layoutMode === "staggered-grid"
						? "density"
						: section.layoutMode === "overlap-layer"
							? "overlap"
							: "hierarchy orchestration",
			gridColumns: layoutDNA.gridSystem.includes("12")
				? 12
				: layoutDNA.gridSystem.includes("6")
					? 6
					: "asymmetric",
			overlapBehavior,
			gridTemplate:
				section.layoutMode === "staggered-grid"
					? "repeat(12, minmax(0,1fr))"
					: section.layoutMode === "split-offset"
						? "1.1fr 0.9fr"
						: "1fr",
			spacingSystem: {
				container:
					typography.lineCompressionRatio > 1.7
						? "clamp(4rem, 8vw, 10rem)"
						: "clamp(3rem, 6vw, 7rem)",
				panel:
					section.span === "full"
						? "clamp(2rem, 4vw, 5rem)"
						: "clamp(1.4rem, 3vw, 4rem)",
			},
			responsiveBehavior: [
				{ breakpoint: "1200px", gridColumns: 12, spacingScale: 1 },
				{ breakpoint: "900px", gridColumns: 1, spacingScale: 1.1 },
			],
			preferredRenderSystem,
		};
	});
}

function buildNarrativeCompositions(
	plan: LayoutCompositionPlan,
	business: Business,
	intelligence: BusinessIntelligence,
	layoutDNA: LayoutDNA,
	images: ImageIntelligence[],
	typography: TypographyBehavior,
	motion: MotionLanguage,
): NarrativeComposition[] {
	return plan.sections.map((section, index) => {
		const contentType =
			section.type === "hero"
				? "hero"
				: section.type === "gallery"
					? "showcase"
					: section.type === "testimonials"
						? "proof"
						: section.type === "features"
							? "explain"
							: section.type === "cta"
								? "interaction"
								: "pause";
		const purpose =
			section.type === "hero"
				? "establish-authority"
				: section.type === "gallery"
					? "showcase-work"
					: section.type === "testimonials"
						? "prove-credibility"
						: section.type === "features"
							? "explain-process"
							: section.type === "cta"
								? "facilitate-action"
								: section.type === "faq"
									? "explain-process"
									: "close-conversion";
		const visualBehavior =
			section.layoutMode === "split-offset"
				? "editorial-asymmetry"
				: section.layoutMode === "staggered-grid"
					? "kinetic-stagger"
					: section.layoutMode === "overlap-layer"
						? "immersive-overlap"
						: "intimate-paired";
		const scanPattern =
			layoutDNA.scanPath === "diagonal-ascending"
				? "diagonal-flow"
				: layoutDNA.scanPath === "vertical-stagger"
					? "vertical"
					: "horizontal";
		const densityMode =
			section.density === "airy"
				? "sparse-breathing"
				: section.density === "tight"
					? "dense"
					: "balanced";
		const geometrySystem =
			section.layoutMode === "staggered-grid"
				? "grid-overlay"
				: section.layoutMode === "overlap-layer"
					? "overlap-plane"
					: section.layoutMode === "split-offset"
						? "organic-flow"
						: "stack-layer";

		const imageSet = images.slice(index, index + 2);

		return {
			id: `composition-${index + 1}`,
			narrativePurpose: purpose as NarrativeComposition["narrativePurpose"],
			visualBehavior: visualBehavior as NarrativeComposition["visualBehavior"],
			scanPattern,
			densityMode,
			geometrySystem,
			contentType,
			viewportRatio: section.type === "hero" ? 1.05 : 0.65,
			images: imageSet.length ? imageSet : images.slice(0, 1),
			heading:
				section.type === "hero"
					? business.name
					: section.type === "gallery"
						? `A cinematic view of ${business.category}`
						: section.type === "testimonials"
							? `Stories from real customers`
							: section.type === "features"
								? `How ${business.name} delivers results`
								: section.type === "cta"
									? `Make your next move`
									: `Connect with ${business.name}`,
			description:
				section.type === "hero"
					? `A crafted website direction for ${business.category} in ${business.address || "your area"}.`
					: section.type === "gallery"
						? `Visual storytelling tailored to your business imagery.`
						: section.type === "testimonials"
							? `Proof that speaks with chosen, specific customer outcomes.`
							: section.type === "features"
								? `Unique service pillars designed for ${business.category}.`
								: section.type === "cta"
									? `A decisive prompt that helps visitors move forward.`
									: `Clear contact and next-step guidance for your audience.`,
			actions:
				section.type === "cta"
					? [
							{
								label: "Start the conversation",
								href: "#contact",
								style: "primary",
							},
						]
					: section.type === "hero"
						? [
								{
									label: "Book a consultation",
									href: "#contact",
									style: "primary",
								},
								{
									label: "View the work",
									href: "#gallery",
									style: "secondary",
								},
							]
						: [],
			proofElements:
				section.type === "testimonials"
					? [
							{
								type: "testimonial",
								content: "Exceptional service and lasting results.",
								author: "Verified client",
							},
						]
					: section.type === "features"
						? [{ type: "stat", content: "4.9/5 average client rating" }]
						: [],
			motionLanguage: {
				entryTrigger: section.type === "cta" ? "on-hover" : "on-scroll",
				entryType:
					section.type === "hero"
						? "reveal"
						: section.type === "gallery"
							? "slide"
							: "fade",
				internalMotion: section.type === "gallery" ? "kinetic" : "subtle",
			},
			styling: {
				backgroundColor: index % 2 === 0 ? "#fff" : "#f7f5f1",
				textColor: "#111",
				accentColor: "#2f2b26",
				typographySize: section.type === "hero" ? "large" : "medium",
				typographyWeight: section.type === "hero" ? "contrast" : "regular",
			},
		};
	});
}

function summarizeCompositionSequence(
	compositions: NarrativeComposition[],
): string {
	return compositions.map((c) => c.narrativePurpose).join(" → ");
}

function buildWebsiteFingerprint(
	id: string,
	compositions: NarrativeComposition[],
	layoutDNA: LayoutDNA,
	typography: TypographyBehavior,
	motion: MotionLanguage,
	color: string,
	industry: string,
	conversionIntent: string,
): WebsiteFingerprint {
	return generateWebsiteFingerprint(
		id,
		compositions.map((c) => c.narrativePurpose),
		layoutDNA.spacingRhythm,
		`${typography.hierarchyRole}-${typography.scanGuidance}-${typography.emotionalPacing}`,
		layoutDNA.gridSystem,
		compositions
			.map((c) => `${c.geometrySystem}-${c.visualBehavior}`)
			.join("|"),
		0,
		color,
		industry,
		conversionIntent,
	);
}

function mutateLayoutDNAForUniqueness(layoutDNA: LayoutDNA): LayoutDNA {
	return {
		...layoutDNA,
		spacingRhythm: layoutDNA.spacingRhythm.includes("balanced")
			? "luxury-silence"
			: layoutDNA.spacingRhythm,
		asymmetryLevel: Math.min(95, Math.max(55, layoutDNA.asymmetryLevel + 10)),
		visualTempo:
			layoutDNA.visualTempo === "steady-editorial"
				? "pulse-cinematic"
				: layoutDNA.visualTempo,
	};
}

function mutatePlanForUniqueCompositions(
	plan: LayoutCompositionPlan,
): LayoutCompositionPlan {
	return {
		...plan,
		sections: plan.sections.map((section, index) => ({
			...section,
			layoutMode:
				section.layoutMode === "split-offset"
					? "overlap-layer"
					: section.layoutMode === "overlap-layer"
						? "staggered-grid"
						: "split-offset",
			density: section.density === "balanced" ? "airy" : "balanced",
			visualTension: section.visualTension === "medium" ? "high" : "medium",
		})),
	};
}

function renderCompositionHtml(
	schema: WebsiteSchema,
	tokens: VisualTokens,
): string {
	const layoutDNA = schema.layoutDNA;
	const compositions = schema.narrativeCompositions || [];
	const rootVars = `
		--bg:${tokens.palette.background};
		--surface:${tokens.palette.surface};
		--primary:${tokens.palette.primary};
		--accent:${tokens.palette.accent};
		--text:${tokens.palette.text};
		--muted:${tokens.palette.muted};
		--outline:${tokens.palette.outline};
		--hero:${tokens.typography.scaleHero};
		--h2:${tokens.typography.scaleH2};
		--body:${tokens.typography.scaleBody};
		--sectionY:${tokens.spacing.sectionY};
		--sectionYTight:${tokens.spacing.sectionYTight};
		--gutter:${tokens.spacing.gutter};
		--cardPad:${tokens.spacing.cardPad};
		--motion-ease:${tokens.motion.ease};
		--asymmetry:${layoutDNA?.asymmetryLevel ?? 60};
		--scan:${layoutDNA?.scanPath ?? "diagonal-ascending"};
		--tempo:${layoutDNA?.visualTempo ?? "steady-editorial"};
		--depth:${layoutDNA?.depthBehavior ?? "layered-depth"};
		--image-weight:${layoutDNA?.imageWeighting ?? "images-supporting"};
	`;

	const compositionHtml = compositions
		.map((comp) => {
			const images = comp.images
				.map(
					(img, idx) =>
						`<div class="composition-image image-${idx + 1}" style="background-image:url('${img.src}');"></div>`,
				)
				.join("");
			const actions = (comp.actions || [])
				.map(
					(action) =>
						`<a class="composition-cta cta-${action.style}" href="${action.href}">${action.label}</a>`,
				)
				.join("");

			return `<article class="composition composition-${comp.geometrySystem} ${comp.visualBehavior} density-${comp.densityMode}" data-scan="${comp.scanPattern}">
				<div class="composition-shell">
					<div class="composition-text">
						<span class="composition-purpose">${comp.narrativePurpose.replace(/-/g, " ")}</span>
						<h2>${comp.heading || ""}</h2>
						<p>${comp.description || ""}</p>
						<div class="composition-actions">${actions}</div>
						<div class="composition-proof">${(comp.proofElements || [])
							.map(
								(proof) => `<span class="proof-item">${proof.content}</span>`,
							)
							.join("")}</div>
					</div>
					<div class="composition-media">${images}</div>
				</div>
			</article>`;
		})
		.join("");

	const css = `
		:root { ${rootVars} }
		* { box-sizing: border-box; }
		body { margin:0; font-family:${tokens.typography.body}, ui-sans-serif, system-ui; background:var(--bg); color:var(--text); line-height:1.5; }
		main { overflow:hidden; }
		.page-grid { display:grid; gap:clamp(3rem, 6vw, 7rem); padding:clamp(2rem, 4vw, 4rem); }
		.composition { position:relative; overflow:hidden; min-height:clamp(55vh, 70vh, 95vh); }
		.composition-shell { display:grid; gap:clamp(1.6rem, 3vw, 3rem); grid-template-columns: minmax(0,1fr) minmax(0,1fr); align-items:center; }
		.composition-grid-overlay { grid-template-columns: 1.1fr .9fr; }
		.composition-overlap-plane { grid-template-columns: minmax(0,1fr) minmax(0,1fr); }
		.composition-stack-layer { grid-template-columns: 1fr; }
		.composition-organic-flow { grid-template-columns: 1.2fr .8fr; }
		.composition-text { position:relative; z-index:2; padding:clamp(2rem, 4vw, 5rem); background:rgba(255,255,255,0.92); backdrop-filter:blur(12px); border-radius:24px; box-shadow:0 30px 90px rgba(0,0,0,0.08); }
		.composition-purpose { display:inline-block; margin-bottom:1rem; text-transform:uppercase; letter-spacing:.22em; font-size:.8rem; color:var(--accent); }
		.composition-text h2 { font-size:clamp(2.4rem, 6vw, 5rem); line-height:0.95; margin:0 0 1rem; }
		.composition-text p { max-width: 60ch; color:var(--muted); }
		.composition-actions { display:flex; flex-wrap:wrap; gap:1rem; margin-top:1.8rem; }
		.composition-cta { text-decoration:none; padding:.95rem 1.4rem; border-radius:999px; font-weight:700; transition:transform .3s ease; }
		.cta-primary { background:var(--primary); color:#fff; }
		.cta-secondary { background:transparent; border:1px solid var(--outline); color:var(--text); }
		.composition-media { position:relative; display:grid; gap:1rem; grid-template-columns:1fr; }
		.composition-image { min-height:320px; border-radius:28px; background-size:cover; background-position:center; box-shadow:0 32px 100px rgba(0,0,0,0.14); transform:translateY(0); }
		.composition-overlap-plane .composition-image:nth-child(1) { grid-column:1; grid-row:1; transform:translateY(0); }
		.composition-overlap-plane .composition-image:nth-child(2) { grid-column:1 / -1; grid-row:1; transform:translate(12%, 18%); z-index:1; opacity:.96; }
		.composition-organc-flow .composition-image, .composition-organic-flow .composition-image { border-radius:24px; }
		.composition-kinetic-stagger .composition-image { transition:transform .6s ease; }
		.composition-kinetic-stagger:hover .composition-image { transform:translateY(-6px); }
		.composition-proof .proof-item { display:inline-flex; margin-top:1rem; padding:.8rem 1rem; background:rgba(255,255,255,0.85); border:1px solid var(--outline); border-radius:18px; }
		@media (max-width: 980px) {
			.composition-shell { grid-template-columns:1fr; }
			.composition-text { padding:2rem; }
			.composition-image { min-height:240px; }
		}
	`;

	return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${schema.seo.title}</title><style>${css}</style></head><body><main class="page-grid">${compositionHtml}</main></body></html>`;
}

function buildWebsiteThemeFromLayout(
	layoutDNA: LayoutDNA,
	tokens: VisualTokens,
	business: Business,
) {
	return {
		name: `Studio ${business.category || "Modern"}`,
		brandDNA: {
			personality: "editorial",
			visualMood: "warm-editorial",
			ctaEnergy: "inviting",
			spacingDensity: "balanced",
			imageStyle: "cinematic",
			typographyMood: "editorial",
			iconStyle: "outline",
		},
		designDNA: {
			spacingPersonality: layoutDNA.spacingRhythm,
			compositionAggression: layoutDNA.asymmetryLevel,
			hierarchyIntensity: 82,
			motionEnergy: layoutDNA.visualTempo.includes("kinetic") ? 78 : 54,
			visualDensity: layoutDNA.imageWeighting === "images-dominant" ? 76 : 62,
			asymmetryLevel: layoutDNA.asymmetryLevel,
			atmosphereIntensity: layoutDNA.depthBehavior.includes("immersive")
				? 78
				: 54,
			typographyDominance: "cinematic-oversized",
			imageWeight: 72,
			luxuryScore: 58,
			cinematicScore: 68,
			brutalismScore: 18,
			editorialScore: 82,
			softnessScore: 45,
			visualAtmosphere: "architectural-minimalism",
		},
		palette: tokens.palette,
		typography: {
			heading: tokens.typography.heading,
			body: tokens.typography.body,
			headingFont: tokens.typography.heading,
			bodyFont: tokens.typography.body,
		},
		tokens: {
			radius: "soft",
			shadow: "premium",
			surface: "glass",
			animation: "dynamic",
		},
	};
}

function createSchemaFromPlan(
	business: Business,
	plan: LayoutCompositionPlan,
	strategy: BrandStrategy,
	moodboard: VisualMoodboard,
	tokens: VisualTokens,
	layoutDNA: LayoutDNA,
	industryPsychology: IndustryVisualPsychology,
	narrativeCompositions: NarrativeComposition[],
	compositionSystems: CompositionSystem[],
	imageIntelligence: ImageIntelligence[],
	typographyBehavior: TypographyBehavior,
	motionLanguage: MotionLanguage,
	entropy: VisualEntropyScore,
	fingerprint: WebsiteFingerprint,
): WebsiteSchema {
	const siteId = `${business.id || "site"}-${Date.now()}`;
	const slug = (business.name || "site")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");

	const photos = (business.photos || []).filter(Boolean);
	const heroPhoto = photos[0] || "";

	const sections: WebsiteSection[] = plan.sections.map((section, index) => {
		const id = `${section.type}-${index + 1}`;
		const composition = {
			sectionType: section.layoutMode,
			layoutBehavior: section.span,
			visualDepth: section.visualTension,
			motionStyle: strategy.motionLanguage,
			imageTreatment: moodboard.imageTreatmentSystem,
			spacingMode: section.density,
			themeIntensity: plan.depthBias > 65 ? "dramatic" : "balanced",
			hierarchyWeight:
				section.type === "hero"
					? "dominant"
					: section.type === "cta"
						? "supporting"
						: "breathing",
		};

		if (section.type === "hero") {
			const c = (business.category || "").toLowerCase();
			const primaryLabel =
				plan.conversionIntent === "bookings" ||
				plan.conversionIntent === "walk-ins"
					? "Book Now"
					: plan.conversionIntent === "consultations"
						? "Schedule a Consultation"
						: plan.conversionIntent === "commerce"
							? "Shop Now"
							: "Get Started";

			const secondaryLabel = photos.length > 1 ? "View Our Work" : "Learn More";

			const secondaryHref = photos.length > 1 ? "#gallery" : "#features";

			return {
				id,
				type: "hero",
				layout: plan.heroMode === "immersive" ? "hero-immersive" : "hero-split",
				variant: plan.heroMode,
				composition,
				headline: `${business.name}`,
				subheadline: c.includes("law")
					? `${business.name} — Legal counsel for ${business.address || "your community"}.`
					: c.includes("restaurant")
						? `${business.category} in ${business.address || "your neighborhood"}. Reserve your table.`
						: c.includes("salon")
							? `Premium ${business.category} experiences in ${business.address || "your area"}.`
							: c.includes("gym")
								? `Your fitness journey starts here — ${business.address || "right in your neighborhood"}.`
								: `${business.category} in ${business.address || "your local market"}, designed for results.`,
				ctaPrimary: { label: primaryLabel, href: "#contact" },
				ctaSecondary: { label: secondaryLabel, href: secondaryHref },
				badges: [business.category || "Local Service", "Custom Crafted"],
				media: {
					type: "image",
					src: heroPhoto,
					alt: `${business.name} hero`,
				},
			} as WebsiteSection;
		}

		if (section.type === "features") {
			const c = (business.category || "").toLowerCase();
			const featureTitle = c.includes("law")
				? "Our Approach"
				: c.includes("restaurant") || c.includes("cafe")
					? "The Experience"
					: c.includes("fitness") || c.includes("gym")
						? "What We Offer"
						: c.includes("salon") || c.includes("spa")
							? "Our Services"
							: c.includes("consulting") || c.includes("agency")
								? "Our Expertise"
								: "What Sets Us Apart";

			const featureItems = c.includes("law")
				? [
						{
							title: "Strategic Counsel",
							description:
								"Decades of legal expertise guiding complex matters to resolution.",
						},
						{
							title: "Local Authority",
							description:
								"Deep roots in this community with trusted relationships.",
						},
						{
							title: "Results-Focused",
							description: "Every case pursued with clarity and tenacity.",
						},
					]
				: c.includes("restaurant") || c.includes("cafe")
					? [
							{
								title: "Sourced Thoughtfully",
								description:
									"Local ingredients, seasonal menus, authentic preparation.",
							},
							{
								title: "Atmosphere Matters",
								description: "Spaces designed for connection and comfort.",
							},
							{
								title: "Your Return",
								description: "Built on regulars and relationship, not churn.",
							},
						]
					: c.includes("fitness") || c.includes("gym")
						? [
								{
									title: "Real Programming",
									description:
										"Expert coaching and programming tailored to your level.",
								},
								{
									title: "Community-Driven",
									description:
										"A place where you belong, not just another gym.",
								},
								{
									title: "Results You'll See",
									description: "Structured progression and measurable wins.",
								},
							]
						: [
								{
									title: "Expertise You Can Trust",
									description: "Years of focused experience in your category.",
								},
								{
									title: "Local & Available",
									description:
										"Here when you need us, responsive to your schedule.",
								},
								{
									title: "Your Success Is Ours",
									description: "We're invested in your goals and outcomes.",
								},
							];

			return {
				id,
				type: "features",
				layout: "alternating-grid",
				variant: section.layoutMode,
				composition,
				title: featureTitle,
				items: featureItems,
			} as WebsiteSection;
		}

		if (section.type === "gallery") {
			const gallery = photos.slice(0, 6).map((src, i) => ({
				src,
				alt: `${business.name} image ${i + 1}`,
			}));
			const c = (business.category || "").toLowerCase();
			const galleryTitle =
				c.includes("restaurant") || c.includes("cafe")
					? "The Atmosphere"
					: c.includes("salon") || c.includes("spa")
						? "Your Transformation"
						: c.includes("fitness") || c.includes("gym")
							? "The Journey"
							: "Our Portfolio";

			return {
				id,
				type: "gallery",
				layout: "asymmetrical",
				variant: section.layoutMode,
				composition,
				title: galleryTitle,
				items: gallery,
			} as WebsiteSection;
		}

		if (section.type === "testimonials") {
			const c = (business.category || "").toLowerCase();
			const testimonialTitle = c.includes("law")
				? "Client Success"
				: c.includes("fitness") || c.includes("gym")
					? "Transformation Stories"
					: c.includes("restaurant") || c.includes("cafe")
						? "Guest Stories"
						: c.includes("salon") || c.includes("spa")
							? "Client Results"
							: "Client Experiences";

			return {
				id,
				type: "testimonials",
				layout: "split",
				variant: section.layoutMode,
				composition,
				title: testimonialTitle,
				items: [
					{
						quote:
							"The experience exceeded my expectations and I'm recommending them to everyone.",
						author: "Real Client",
						role: "Trust-Based",
					},
					{
						quote:
							"Professional, attentive, and genuinely committed to the results.",
						author: "Satisfied Client",
						role: "Verified",
					},
				],
			} as WebsiteSection;
		}

		if (section.type === "faq") {
			return {
				id,
				type: "faq",
				layout: "faq-accordion",
				variant: section.layoutMode,
				composition,
				title: "Questions",
				items: [
					{
						question: "How fast can we launch?",
						answer:
							"Most local projects can go live in days with approved content.",
					},
					{
						question: "Can we update content after launch?",
						answer:
							"Yes, editing workflows are designed for non-technical teams.",
					},
				],
			} as WebsiteSection;
		}

		if (section.type === "cta") {
			return {
				id,
				type: "cta",
				layout: "cta-split",
				variant: section.layoutMode,
				composition,
				title: "Let’s Build The Better Version",
				body: "Schedule a strategy call and get a premium website direction tailored to your market.",
				buttonLabel: "Start Now",
				buttonHref: "#contact",
			} as WebsiteSection;
		}

		return {
			id,
			type: "contact",
			layout: "contact-form",
			variant: section.layoutMode,
			composition,
			title: "Contact",
			showEmail: true,
			showPhone: true,
			showMap: false,
		} as WebsiteSection;
	});

	return {
		schemaVersion: "1.0",
		meta: {
			siteId,
			businessId: business.id,
			slug,
			version: 2,
			target: "wordpress",
		},
		layoutDNA,
		visualPsychology: industryPsychology,
		imageIntelligence,
		typographyBehavior,
		motionLanguage,
		narrativeCompositions,
		compositionSystems,
		entropyScore: entropy,
		fingerprint,
		theme: {
			name: `Studio ${business.category || "Modern"}`,
			brandDNA: {
				personality: "editorial",
				visualMood: "modern-authority",
				ctaEnergy: "inviting",
				spacingDensity: "balanced",
				imageStyle: "cinematic",
				typographyMood: "editorial",
				iconStyle: "outline",
			},
			designDNA: {
				spacingPersonality: "balanced",
				compositionAggression: plan.asymmetryBias,
				hierarchyIntensity: 82,
				motionEnergy: 54,
				visualDensity: 68,
				asymmetryLevel: plan.asymmetryBias,
				atmosphereIntensity: plan.depthBias,
				typographyDominance: "cinematic-oversized",
				imageWeight: 72,
				luxuryScore: 70,
				cinematicScore: 65,
				brutalismScore: 20,
				editorialScore: 78,
				softnessScore: 45,
				visualAtmosphere: "architectural-minimalism",
			},
			palette: tokens.palette,
			typography: {
				heading: tokens.typography.heading,
				body: tokens.typography.body,
				headingFont: tokens.typography.heading,
				bodyFont: tokens.typography.body,
			},
			tokens: {
				radius: "soft",
				shadow: "premium",
				surface: "glass",
				animation: "dynamic",
			},
		} as any,
		brand: {
			businessName: business.name,
			category: business.category,
			address: business.address,
			phone: business.phoneNumber,
			email: business.email,
			websiteUri: business.websiteUri,
			logo: business.logo,
		},
		seo: {
			title: `${business.name} | ${business.category}`,
			description: `${business.name} in ${business.address || "your area"} with a premium, conversion-focused digital experience.`,
			keywords: [business.name, business.category, "premium", "local"].filter(
				Boolean,
			),
		},
		sections,
		_validation: {
			repairs: [],
			validatedAt: new Date().toISOString(),
		},
	} as WebsiteSchema;
}

function buildVisualTokens(business: Business, seed: string): VisualTokens {
	const preset = industryPreset(business.category || "");
	const scaleHero = pick(seed, [
		"clamp(3.2rem, 8.5vw, 8rem)",
		"clamp(3rem, 7.2vw, 7rem)",
	]);
	return {
		palette: preset.palette,
		typography: {
			heading: preset.typography.heading,
			body: preset.typography.body,
			scaleHero,
			scaleH2: "clamp(1.8rem, 3.2vw, 3.4rem)",
			scaleBody: "clamp(1rem, 1.2vw, 1.125rem)",
		},
		spacing: {
			sectionY: "clamp(4rem, 8vw, 9rem)",
			sectionYTight: "clamp(2.5rem, 5vw, 5rem)",
			gutter: "clamp(1rem, 2vw, 2rem)",
			cardPad: "clamp(1rem, 2vw, 1.75rem)",
		},
		motion: {
			revealDuration: "700ms",
			ease: "cubic-bezier(0.22,1,0.36,1)",
		},
	};
}

function renderPremiumHtml(
	schema: WebsiteSchema,
	tokens: VisualTokens,
	plan: LayoutCompositionPlan,
) {
	const layoutOverrides: any = {
		palette: { ...tokens.palette },
		spacing: {
			sectionGap: tokens.spacing.sectionY,
			sectionPadding: tokens.spacing.cardPad,
			panelGap: tokens.spacing.gutter,
			imageGap: tokens.spacing.gutter,
			textGap: tokens.spacing.cardPad,
		},
		typography: {
			heading: tokens.typography.heading,
			body: tokens.typography.body,
			headingScale: tokens.typography.scaleHero,
			subheadingScale: tokens.typography.scaleH2,
			bodyScale: tokens.typography.scaleBody,
		},
		motion: {
			ease: tokens.motion.ease,
			duration: tokens.motion.revealDuration,
		},
	};

	const enrichedSchema: WebsiteSchema = {
		...schema,
		layoutDNA: {
			...(schema.layoutDNA || {}),
			gridSystem:
				schema.layoutDNA?.gridSystem ||
				(plan.grid?.columns === 12 ? "modular" : "asymmetric"),
			spacingRhythm:
				schema.layoutDNA?.spacingRhythm || plan.grid?.gutters || "balanced",
			visualTempo:
				schema.layoutDNA?.visualTempo || plan.heroMode || "steady-editorial",
			depthBehavior:
				schema.layoutDNA?.depthBehavior ||
				(plan.depthBias > 50 ? "immersive-3d" : "layered-depth"),
			asymmetryLevel: schema.layoutDNA?.asymmetryLevel ?? plan.asymmetryBias,
			imageWeighting: schema.layoutDNA?.imageWeighting || "images-supporting",
			dominantAxis: schema.layoutDNA?.dominantAxis || "diagonal",
		},
	};

	return renderCompositionPreviewDocument(enrichedSchema, layoutOverrides);
}

async function maybeCaptureScreenshotBase64(
	html: string,
): Promise<string | null> {
	try {
		const dynamicImport = new Function(
			"moduleName",
			"return import(moduleName)",
		) as (moduleName: string) => Promise<any>;
		const playwright = await dynamicImport("playwright");
		const browser = await playwright.chromium.launch({ headless: true });
		const page = await browser.newPage({
			viewport: { width: 1440, height: 2200 },
		});
		await page.setContent(html, { waitUntil: "networkidle" });
		const png = await page.screenshot({ fullPage: true, type: "png" });
		await browser.close();
		return Buffer.from(png).toString("base64");
	} catch {
		return null;
	}
}

async function runCritique(
	schema: WebsiteSchema,
	html: string,
	options: PipelineGenerationOptions,
	iteration: number,
): Promise<VisualCritique> {
	const screenshot = await maybeCaptureScreenshotBase64(html);
	const prompt = `You are a Visual Quality Critic. Return strict JSON with scores 0-100 for whitespaceBalance, hierarchyStrength, compositionUniqueness, imageRhythm, ctaProminence, premiumFeel and arrays issues, refinementActions. Iteration=${iteration}.`;

	try {
		const contents = screenshot
			? [
					{
						role: "user",
						parts: [
							{
								text: `${prompt}\nBusiness=${schema.brand.businessName}, category=${schema.brand.category}.`,
							},
							{ inline_data: { mime_type: "image/png", data: screenshot } },
						],
					},
				]
			: `${prompt}\nNo screenshot available; critique from schema + HTML length=${html.length}.`;
		const raw = await options.llmJson(contents as any, "visual-critique-loop");
		return JSON.parse(raw) as VisualCritique;
	} catch {
		return {
			whitespaceBalance: 68,
			hierarchyStrength: 70,
			compositionUniqueness: 66,
			imageRhythm: 64,
			ctaProminence: 73,
			premiumFeel: 69,
			issues: [
				"Gallery rhythm could be stronger",
				"CTA could be more dominant",
			],
			refinementActions: [
				"increase_heading_contrast",
				"tighten_feature_spacing",
				"boost_cta_surface",
			],
		};
	}
}

function applyCritiqueRefinements(
	tokens: VisualTokens,
	critique: VisualCritique,
) {
	if (critique.hierarchyStrength < 75) {
		tokens.typography.scaleHero = "clamp(3.6rem, 9vw, 8.4rem)";
	}
	if (critique.whitespaceBalance < 70) {
		tokens.spacing.sectionY = "clamp(3.3rem, 7vw, 7rem)";
		tokens.spacing.cardPad = "clamp(.9rem,1.8vw,1.4rem)";
	}
	if (critique.ctaProminence < 75) {
		tokens.palette.primary = tokens.palette.accent;
	}
}

export async function generateWebsiteWithVisualIntelligence(
	business: Business,
	options: PipelineGenerationOptions,
): Promise<WebsiteSchema> {
	const seed = hashSeed(`${business.id}-${business.name}-${business.category}`);
	options.logStderr(
		`[VisualPipeline] Start seed=${seed} business=${business.name}`,
	);

	// BUSINESS INPUT tracing
	traceLog(options, "BUSINESS_INPUT", "business_full_payload", business);
	traceLog(
		options,
		"BUSINESS_INPUT",
		"business_category",
		business.category || null,
	);
	traceLog(options, "BUSINESS_INPUT", "business_photos", business.photos || []);
	traceLog(options, "BUSINESS_INPUT", "business_logo", business.logo || null);

	const intelligence = buildBusinessIntelligence(business);
	const strategy = await buildBrandStrategy(business, intelligence, options);
	const moodboard = await buildVisualMoodboard(business, strategy, options);
	const compositionPlan = buildCompositionPlan(business, intelligence, seed);
	const tokens = buildVisualTokens(business, seed);
	const industryPsychology = await generateIndustryVisualPsychology(
		{
			business: {
				name: business.name,
				category: business.category || "",
				address: business.address,
			},
			conversionIntent: compositionPlan.conversionIntent as
				| "bookings"
				| "walk-ins"
				| "consultations"
				| "commerce",
		},
		options,
	);
	const layoutDNA = await generateLayoutDNA(
		{
			business: {
				name: business.name,
				category: business.category || "",
			},
			industryPsychology,
			conversationIntent: compositionPlan.conversionIntent as
				| "bookings"
				| "walk-ins"
				| "consultations"
				| "commerce",
		},
		options,
	);
	const typographyBehavior = buildTypographyBehavior(
		industryPsychology,
		layoutDNA,
	);
	const motionLanguage = buildMotionLanguage(industryPsychology, layoutDNA);
	const imageIntelligence = classifyImages(
		business.photos || [],
		business,
		business.category || "",
	);
	const narrativeCompositions = buildNarrativeCompositions(
		compositionPlan,
		business,
		intelligence,
		layoutDNA,
		imageIntelligence,
		typographyBehavior,
		motionLanguage,
	);
	const compositionSystems = buildCompositionSystems(
		compositionPlan,
		layoutDNA,
		typographyBehavior,
	);
	const fingerprint = buildWebsiteFingerprint(
		`${business.id || "site"}-${Date.now()}`,
		narrativeCompositions,
		layoutDNA,
		typographyBehavior,
		motionLanguage,
		tokens.palette.primary,
		business.category || "unknown",
		compositionPlan.conversionIntent || "walk-ins",
	);
	const initialSchema = createSchemaFromPlan(
		business,
		compositionPlan,
		strategy,
		moodboard,
		tokens,
		layoutDNA,
		industryPsychology,
		narrativeCompositions,
		compositionSystems,
		imageIntelligence,
		typographyBehavior,
		motionLanguage,
		{
			overallScore: 0,
			heroUniqueness: 0,
			typographyDiversity: 0,
			spacingDiversity: 0,
			compositionDiversity: 0,
			gridDiversity: 0,
			ctaDiversity: 0,
			templateSimilarityScore: 0,
			risks: [],
			lowEntropyCompositions: [],
		},
		fingerprint,
	);

	let schema = initialSchema;

	// SCHEMA GENERATION: persist schema and per-section details
	traceLog(options, "SCHEMA_GENERATION", "schema_generated", schema);
	try {
		const sectionsMeta = schema.sections.map((s) => ({
			sectionType: s.type,
			layoutBehavior:
				(s as any).composition?.sectionType || (s as any).layout || null,
			visualDepth: (s as any).composition?.visualDepth || null,
			motionStyle: (s as any).composition?.motionStyle || null,
			spacingMode: (s as any).composition?.spacingMode || null,
			hierarchyWeight: (s as any).composition?.hierarchyWeight || null,
			imageTreatment: (s as any).composition?.imageTreatment || null,
		}));
		traceLog(options, "SCHEMA_GENERATION", "sections_meta", sectionsMeta);
	} catch (e) {
		traceLog(options, "SCHEMA_GENERATION", "sections_meta_error", String(e));
	}

	let html = renderCompositionHtml(schema, tokens);
	let lastCritique: VisualCritique | null = null;

	// HTML generation tracing
	traceLog(options, "HTML_GENERATION", "html_generated_initial", html);

	// HTML analysis: classes, spacing, typography, radii, shadows, gradients, repeated structures
	try {
		const classNames = Array.from(
			new Set(
				Array.from(html.matchAll(/class=\"([^\"]+)\"/g)).flatMap((m) =>
					(m[1] || "").split(/\s+/),
				),
			),
		).filter(Boolean);
		const spacingValues = Array.from(
			new Set(
				Array.from(
					html.matchAll(/clamp\([^\)]+\)|\b\d+(?:px|rem|em|vw|vh)\b/g),
				).map((m) => m[0]),
			),
		);
		const radiusValues = Array.from(
			new Set(
				Array.from(html.matchAll(/border-radius:\s*([^;\}]+)/g)).map(
					(m) => m[1],
				),
			),
		);
		const shadowValues = Array.from(
			new Set(
				Array.from(html.matchAll(/box-shadow:\s*([^;\}]+)/g)).map((m) => m[1]),
			),
		);
		const gradients = Array.from(
			new Set(
				Array.from(
					html.matchAll(/linear-gradient\([^\)]+\)|radial-gradient\([^\)]+\)/g),
				).map((m) => m[0]),
			),
		);
		const repeatedStructures = classNames
			.filter((cn) => html.split(cn).length > 3)
			.slice(0, 50);
		const heroPatterns = classNames.filter((cn) => /hero/i.test(cn));
		const ctaPatterns = classNames.filter((cn) => /cta|btn|action/i.test(cn));
		traceLog(options, "HTML_GENERATION", "html_analysis", {
			classNames,
			spacingValues,
			radiusValues,
			shadowValues,
			gradients,
			repeatedStructures,
			heroPatterns,
			ctaPatterns,
		});
	} catch (e) {
		traceLog(options, "HTML_GENERATION", "html_analysis_error", String(e));
	}

	// CRITIQUE LOOP with deep trace
	const tokensBeforeCritique = JSON.parse(JSON.stringify(tokens));
	for (let i = 1; i <= 2; i++) {
		traceLog(options, "CRITIQUE_LOOP", `iteration_${i}_pre`, {
			htmlLength: html.length,
			tokens: tokensBeforeCritique,
		});
		// run critique via options.llmJson to capture raw responses
		try {
			const screenshot = await maybeCaptureScreenshotBase64(html);
			if (screenshot)
				traceLog(options, "CRITIQUE_LOOP", `screenshot_iter_${i}`, screenshot);
			const prompt = `You are a Visual Quality Critic. Return strict JSON with scores 0-100 for whitespaceBalance, hierarchyStrength, compositionUniqueness, imageRhythm, ctaProminence, premiumFeel and arrays issues, refinementActions. Iteration=${i}. Business=${schema.brand.businessName}, category=${schema.brand.category}.`;
			traceLog(options, "CRITIQUE_LOOP", `critique_prompt_iter_${i}`, prompt);
			const raw = await options.llmJson(prompt, `visual-critique-iter-${i}`);
			traceLog(options, "CRITIQUE_LOOP", `critique_raw_iter_${i}`, raw);
			let parsedCritique: VisualCritique | null = null;
			try {
				parsedCritique = JSON.parse(raw) as VisualCritique;
				traceLog(
					options,
					"CRITIQUE_LOOP",
					`critique_parsed_iter_${i}`,
					parsedCritique,
				);
			} catch (e) {
				traceLog(
					options,
					"CRITIQUE_LOOP",
					`critique_parse_error_iter_${i}`,
					String(e),
				);
			}
			if (parsedCritique) {
				lastCritique = parsedCritique;
				const before = JSON.parse(JSON.stringify(tokens));
				applyCritiqueRefinements(tokens, parsedCritique);
				const after = JSON.parse(JSON.stringify(tokens));
				traceLog(options, "CRITIQUE_LOOP", `tokens_before_after_iter_${i}`, {
					before,
					after,
				});
			}
		} catch (e) {
			traceLog(
				options,
				"CRITIQUE_LOOP",
				`critique_exception_iter_${i}`,
				String(e),
			);
		}
		html = renderCompositionHtml(schema, tokens);
		traceLog(options, "CRITIQUE_LOOP", `html_after_iter_${i}`, html);
	}

	// DESIGN TOKEN TRACE: record before/after and usage in final HTML
	try {
		const finalHtml = html;
		const tokenTrace: any = { before: tokensBeforeCritique, after: tokens };
		// check whether token values appear in final HTML
		for (const key of Object.keys(tokens)) {
			tokenTrace.after[key] = tokens[key as any];
			try {
				const asString = JSON.stringify(tokens[key as any]);
				tokenTrace.after[key + "_usedInHtml"] =
					finalHtml.includes(asString) ||
					finalHtml.includes(String(tokens[key as any]));
			} catch (e) {
				tokenTrace.after[key + "_usedInHtml"] = false;
			}
		}
		traceLog(options, "DESIGN_TOKEN_TRACE", "token_trace_summary", tokenTrace);
	} catch (e) {
		traceLog(options, "DESIGN_TOKEN_TRACE", "error", String(e));
	}

	// REPETITION DETECTION: identify repeated layout patterns that cause generic-ness
	try {
		const repeats: any = {};
		// repeated hero/layout types
		const heroCount = schema.sections.filter((s) => s.type === "hero").length;
		repeats.repeated_hero_count = heroCount;
		// repeated CTA, grids, cards
		const ctaCount = schema.sections.filter((s) => s.type === "cta").length;
		repeats.repeated_cta_count = ctaCount;
		// repeated layout identifiers
		const layoutCounts: Record<string, number> = {};
		schema.sections.forEach((s) => {
			const layout = (
				(s as any).layout ||
				(s as any).variant ||
				"standard"
			).toString();
			layoutCounts[layout] = (layoutCounts[layout] || 0) + 1;
		});
		repeats.layoutCounts = layoutCounts;
		// spacing and typography repetition heuristics
		repeats.spacingPatterns = tokens.spacing;
		repeats.typography = tokens.typography;
		traceLog(options, "REPETITION_DETECTION", "repetition_report", repeats);
	} catch (e) {
		traceLog(options, "REPETITION_DETECTION", "error", String(e));
	}

	(schema as any)._wordpressHtml = html;
	(schema as any)._renderSource = "visual-intelligence-pipeline";
	(schema as any)._pipeline = {
		intelligence,
		strategy,
		moodboard,
		compositionPlan,
		critique: lastCritique,
		tokens,
	};

	if (options.debugSession) {
		options.persistGenerationDebugFile(
			options.debugSession,
			"00-business-intelligence.json",
			intelligence,
		);
		options.persistGenerationDebugFile(
			options.debugSession,
			"00-brand-strategy.json",
			strategy,
		);
		options.persistGenerationDebugFile(
			options.debugSession,
			"00-visual-moodboard.json",
			moodboard,
		);
		options.persistGenerationDebugFile(
			options.debugSession,
			"00-layout-composition-plan.json",
			compositionPlan,
		);
		options.persistGenerationDebugFile(
			options.debugSession,
			"00-visual-tokens.json",
			tokens,
		);
		options.persistGenerationDebugFile(
			options.debugSession,
			"00-critique-loop.json",
			lastCritique || {},
		);
		options.persistGenerationDebugFile(
			options.debugSession,
			"05c-wordpress-html-final.html",
			html,
		);

		// Add uniqueness validation check
		try {
			const uniquenessCheck = {
				sectionSequence: schema.sections.map((s) => s.type).join(" → "),
				sectionCount: schema.sections.length,
				heroMode: (schema as any)._pipeline?.compositionPlan?.heroMode,
				asymmetryBias: (schema as any)._pipeline?.compositionPlan
					?.asymmetryBias,
				depthBias: (schema as any)._pipeline?.compositionPlan?.depthBias,
			};
			traceLog(
				options,
				"UNIQUENESS_CHECK",
				"composition_summary",
				uniquenessCheck,
			);
		} catch (e) {
			traceLog(options, "UNIQUENESS_CHECK", "error", String(e));
		}
	}

	options.logStderr(
		`[VisualPipeline] Completed with renderSource=visual-intelligence-pipeline`,
	);
	return schema;
}
