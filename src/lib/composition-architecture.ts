/**
 * COMPOSITION ARCHITECTURE
 *
 * Replaces template-section thinking with true compositional design.
 * Every website is composed from:
 * 1. Layout DNA (persistent visual identity system)
 * 2. Visual Psychology Profile (industry-specific behavior)
 * 3. Image Intelligence (how imagery drives layout)
 * 4. Narrative Compositions (cinematic spatial moments)
 * 5. Composition Systems (geometry, density, motion)
 * 6. Visual Entropy Score (uniqueness tracking)
 *
 * @format
 */

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

/**
 * LAYOUT DNA: The persistent visual identity system that controls the entire page
 */
export interface LayoutDNA {
	/** 12-col, 6-col, asymmetric, modular, editorial, cinematic, brutal */
	gridSystem: string;

	/** compressed, balanced, airy, luxury-breathing, brutalist-dense, kinetic-tight */
	spacingRhythm: string;

	/** horizontal-flow, diagonal-ascending, vertical-stagger, z-pattern, circular, spiral */
	scanPath: string;

	/** slow-meditative, steady-editorial, kinetic-rapid, pulse-cinematic, breath-rhythm */
	visualTempo: string;

	/** flat-modern, layered-depth, overlapping-planes, immersive-3d, floating-hierarchy */
	depthBehavior: string;

	/** images-dominant, images-supporting, image-texture-background, image-accent-moments */
	imageWeighting: string;

	/** interactive-dense, interactive-sparse, interactive-punctuated, interactive-hidden */
	interactionDensity: string;

	/** asymmetryLevel 0-100: how much asymmetry (0=perfectly symmetric, 100=maximum chaos) */
	asymmetryLevel: number;

	/** primary visual axis: horizontal, vertical, diagonal, radial, chaotic */
	dominantAxis: string;

	/** color palette strategy: monochromatic, analogous, complementary, triadic, atmospheric */
	colorStrategy: string;

	/** dominant geometric shape: circles, squares, triangles, organic, mixed */
	shapeLanguage: string;
}

/**
 * VISUAL PSYCHOLOGY PROFILE: How industry category influences design behavior
 */
export interface IndustryVisualPsychology {
	industry: string;

	/** e.g., "law" | "restaurant" | "gym" | "salon" | "consulting" */
	category: string;

	/** emotional intent: trustworthiness, energy, intimacy, authority, joy, calm */
	emotionalTarget: string;

	/** decision-making speed: immediate, deliberate, exploratory, analytical */
	decisionPace: string;

	/** How text should behave: restrained, dominant, layered, compressed, expansive */
	typographyBehavior:
		| "restrained-serif"
		| "dominant-modern"
		| "layered-wall"
		| "compressed-kinetic"
		| "expansive-airy";

	/** Pacing through the page: slow-meditative, moderate-editorial, fast-kinetic, rhythmic-pulse */
	pagePacing: string;

	/** Color intensity: muted-archive, neutral-professional, vibrant-energy, atmospheric-moody */
	colorIntensity: string;

	/** Image treatment: cinematic-crops, natural-square, product-isolated, lifestyle-editorial, texture-macro */
	imageTreatment: string;

	/** Motion character: subtle-reveal, kinetic-bounce, cinematic-glide, tactile-feedback, ambient-breathing */
	motionCharacter: string;

	/** Asymmetry preference: 0-100 */
	asymmetryPreference: number;

	/** Density preference: 0-100 (0=very airy, 100=very dense) */
	densityPreference: number;

	/** Contrast intensity: 0-100 */
	contrastPreference: number;

	/** Visual atmosphere: "industrial" | "luxury" | "editorial" | "energetic" | "intimate" | "archival" */
	atmosphere: string;
}

/**
 * IMAGE CLASSIFICATION: What type of image and how it should influence layout
 */
export type ImageClassification =
	| "portrait"
	| "landscape"
	| "macro-detail"
	| "workspace"
	| "product-isolated"
	| "signage-text"
	| "people-group"
	| "people-single"
	| "texture-abstract"
	| "interior-full"
	| "interior-detail"
	| "before-after"
	| "lifestyle"
	| "environment";

export interface ImageIntelligence {
	src: string;
	classification: ImageClassification;
	dominantColor: string;
	aspectRatio: number;
	hasText: boolean;
	hasfaces: boolean;
	emotionalTone: "professional" | "warm" | "energetic" | "calm" | "moody";
	suggestedTreatment:
		| "full-bleed"
		| "contained"
		| "overlapped"
		| "textured-bg"
		| "accent-pop";
}

/**
 * NARRATIVE COMPOSITION: Replaces "section" thinking
 * Describes a spatial moment in the page's compositional journey
 */
export interface NarrativeComposition {
	id: string;

	/** What purpose this composition serves in the overall narrative */
	narrativePurpose:
		| "establish-authority"
		| "prove-credibility"
		| "showcase-work"
		| "build-emotion"
		| "create-fomo"
		| "explain-process"
		| "generate-desire"
		| "facilitate-action"
		| "close-conversion";

	/** How the layout should behave: immersive, editorial, kinetic, intimate, monumental */
	visualBehavior:
		| "immersive-overlap"
		| "editorial-asymmetry"
		| "kinetic-stagger"
		| "intimate-paired"
		| "monumental-scale"
		| "intimate-breathe"
		| "cinematic-reveal"
		| "brutalist-stack";

	/** How the eye should scan: horizontal, diagonal, vertical, spiral, chaotic, random */
	scanPattern: string;

	/** Dense, balanced, airy, rhythmic-breathing, sparse-breathing */
	densityMode: string;

	/** Which composition system to use: grid-overlay, stack-layer, overlap-plane, organic-flow */
	geometrySystem: string;

	/** Primary content: hero, proof, showcase, narrative, interaction, pause */
	contentType: string;

	/** How much height this consumes relative to viewport */
	viewportRatio: number; // 0.3 to 1.5

	/** Images for this composition */
	images: ImageIntelligence[];

	/** Main heading/text for this composition */
	heading?: string;

	/** Supporting copy */
	description?: string;

	/** CTAs, if any */
	actions?: Array<{
		label: string;
		href: string;
		style: "primary" | "secondary" | "ghost";
	}>;

	/** Proof elements: testimonials, stats, credentials, gallery items */
	proofElements?: Array<{
		type: "testimonial" | "stat" | "credential" | "item";
		content: string;
		author?: string;
	}>;

	/** Motion behavior for this composition */
	motionLanguage: {
		entryTrigger: "on-scroll" | "on-hover" | "immediate";
		entryType: "fade" | "slide" | "scale" | "reveal" | "parallax";
		internalMotion: "subtle" | "rhythmic" | "kinetic" | "none";
	};

	/** Color and typography decisions for this composition */
	styling: {
		backgroundColor?: string;
		textColor?: string;
		accentColor?: string;
		typographySize: "large" | "medium" | "small";
		typographyWeight: "light" | "regular" | "bold" | "contrast";
	};
}

/**
 * COMPOSITION SYSTEM: Rules for how to render a narrative composition
 */
export interface CompositionSystem {
	/** overlap, density, scan-path, pacing, hierarchy orchestration, viewport-choreography */
	engineType: string;

	/** Grid columns: 12, 8, 6, asymmetric */
	gridColumns: number | "asymmetric";

	/** How content overlaps: none, subtle, aggressive, immersive */
	overlapBehavior: "none" | "subtle" | "aggressive" | "immersive";

	/** CSS Grid template: defines exact layout behavior */
	gridTemplate?: string;

	/** Spacing system: clamp expressions or exact values */
	spacingSystem: Record<string, string>;

	/** Viewport breakpoints and their behavior */
	responsiveBehavior: Array<{
		breakpoint: string;
		gridColumns: number;
		spacingScale: number;
	}>;

	/** Whether to use CSS Grid or Flexbox: prefer grid */
	preferredRenderSystem: "css-grid" | "flexbox" | "absolute-positioned";
}

/**
 * TYPOGRAPHY BEHAVIOR: How typography drives layout
 */
export interface TypographyBehavior {
	/** Hierarchy level: dominates layout, supports layout, breathes with layout */
	hierarchyRole: "dominant" | "supporting" | "breathing";

	/** Line height and compression: creates spatial rhythm */
	lineCompressionRatio: number; // 1.1 (tight) to 2.0 (loose)

	/** Size progression: how typography scales across page */
	sizeProgression: "stepped" | "smooth" | "exponential";

	/** Scan guidance: how typography directs eye movement */
	scanGuidance: "horizontal" | "vertical" | "diagonal";

	/** Emotional pacing: aggressive, moderate, calm */
	emotionalPacing: "aggressive" | "moderate" | "calm";

	/** Font choice rationale for this industry */
	fontRationale: string;

	/** Size range for body: min, max */
	bodySizeRange: [number, number];

	/** Size range for headings: min, max */
	headingSizeRange: [number, number];
}

/**
 * MOTION LANGUAGE: Replaces generic fade/stagger with directional, narrative motion
 */
export interface MotionLanguage {
	/** motion character: cinematic, kinetic, subtle, tactile, ambient */
	character: "cinematic" | "kinetic" | "subtle" | "tactile" | "ambient";

	/** All motion should be directional and have purpose */
	primaryDirection:
		| "ascending"
		| "descending"
		| "horizontal"
		| "spiral"
		| "chaotic";

	/** Duration in ms */
	defaultDuration: number;

	/** Easing: ease-out, ease-in-out, linear, spring */
	defaultEasing: string;

	/** Parallax depth: none, subtle, aggressive */
	parallaxDepth: "none" | "subtle" | "aggressive";

	/** Hover interactions: subtle, pronounced, playful, none */
	hoverBehavior: "subtle" | "pronounced" | "playful" | "none";

	/** Stagger pattern: sequential, random, wave, offset */
	staggerPattern: "sequential" | "random" | "wave" | "offset" | "none";

	/** Color transitions: none, subtle, bold */
	colorAnimation: "none" | "subtle" | "bold";

	/** Specific motion for different composition types */
	compositionMotion: Record<
		string,
		{
			enterAnimation: string;
			internalMotion?: string;
			exitAnimation?: string;
		}
	>;
}

/**
 * VISUAL ENTROPY SCORE: Measures uniqueness and prevents convergence
 */
export interface VisualEntropyScore {
	/** 0-100: Overall uniqueness score */
	overallScore: number;

	/** 0-100: How unique the hero is vs other generated sites */
	heroUniqueness: number;

	/** 0-100: How varied the typography behavior is */
	typographyDiversity: number;

	/** 0-100: How varied the spacing is */
	spacingDiversity: number;

	/** 0-100: How varied the section ordering is */
	compositionDiversity: number;

	/** 0-100: How varied the grid systems are */
	gridDiversity: number;

	/** 0-100: How varied CTA presentations are */
	ctaDiversity: number;

	/** 0-100: Layout similarity to known patterns (lower is better) */
	templateSimilarityScore: number;

	/** Flags that indicate low entropy / template-like behavior */
	risks: string[];

	/** Compositions that score below 40 entropy should be regenerated */
	lowEntropyCompositions: string[];
}

/**
 * WEBSITE FINGERPRINT: Stores the identity of generated sites to prevent convergence
 */
export interface WebsiteFingerprint {
	siteId: string;
	generatedAt: number;

	/** Section sequence: "establish → prove → showcase → convince → convert" */
	compositionSequence: string[];

	/** Overall spacing rhythm signature */
	spacingFingerprint: string;

	/** Typography behavior hash */
	typographyFingerprint: string;

	/** Grid geometry signature */
	gridFingerprint: string;

	/** CTA positioning and styling signature */
	ctaFingerprint: string;

	/** Visual entropy score at generation */
	entropyScore: number;

	/** Color palette hash */
	colorFingerprint: string;

	/** Industry category */
	industry: string;

	/** Conversion intent */
	conversionIntent: string;
}

/**
 * NEW WEBSITE SCHEMA: Composition-driven instead of section-driven
 */
export interface CompositionDrivenWebsite {
	id: string;
	siteId: string;
	business: {
		name: string;
		category: string;
		address: string;
	};

	/** The fundamental visual identity system */
	layoutDNA: LayoutDNA;

	/** Industry-specific visual behavior */
	visualPsychology: IndustryVisualPsychology;

	/** All images classified and analyzed */
	imageIntelligence: ImageIntelligence[];

	/** Typography behavior that drives layout */
	typographyBehavior: TypographyBehavior;

	/** Motion language for the entire site */
	motionLanguage: MotionLanguage;

	/** Narrative compositions (replaces sections) */
	narrativeCompositions: NarrativeComposition[];

	/** Composition systems for rendering */
	compositionSystems: CompositionSystem[];

	/** How unique this site is */
	entropyScore: VisualEntropyScore;

	/** Fingerprint for convergence detection */
	fingerprint: WebsiteFingerprint;

	/** Theme/palette */
	theme: any; // Keep existing theme structure for compatibility

	/** Final HTML output */
	_wordpressHtml?: string;

	/** Debug info */
	_debugMetadata?: Record<string, any>;
}

/**
 * REGENERATION DECISION: Should we regenerate and which parts?
 */
export interface RegenerationDecision {
	shouldRegenerate: boolean;
	reason?: string;
	partsToRegenerate: Array<
		| "layoutDNA"
		| "psychologyProfile"
		| "compositions"
		| "typography"
		| "motion"
		| "all"
	>;
	targetEntropyThreshold?: number;
}

/**
 * AI WEBSITE DETECTION: Pattern recognition for template-like outputs
 */
export interface AIWebsiteDetectionResult {
	isDetectedAsTemplate: boolean;
	templatePatterns: string[];
	suspicionScore: number; // 0-100
	issues: Array<{
		pattern: string;
		severity: "low" | "medium" | "high" | "critical";
		recommendation: string;
	}>;
}

export const ANTI_TEMPLATE_PATTERNS = {
	startupSaaS: [
		"hero with large centered headline",
		"features in 3-column grid",
		"testimonials as quote cards",
		"FAQ accordion at bottom",
		"smooth gradient backgrounds",
	],
	centeredHeroes: [
		"text-center class",
		"mx-auto containers",
		"symmetric layout",
		"centered CTA",
	],
	repetitiveCards: [
		"identical card heights",
		"uniform gap spacing",
		"same aspect ratios",
		"repeated shadows",
	],
	bootstrapGeometry: [
		"12-column grid with equal spans",
		"row/col classes",
		"standard breakpoints at 768/1024",
		"equal gutter spacing",
	],
};
