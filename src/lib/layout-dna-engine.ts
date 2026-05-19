/**
 * LAYOUT DNA ENGINE
 *
 * Generates the fundamental visual identity system that controls the entire page.
 * Every design decision derives from this DNA.
 *
 * @format
 */

import {
	LayoutDNA,
	IndustryVisualPsychology,
	PipelineGenerationOptions,
} from "./composition-architecture";

interface LayoutDNAGenerationInput {
	business: {
		name: string;
		category: string;
	};
	industryPsychology: IndustryVisualPsychology;
	conversationIntent: "bookings" | "walk-ins" | "consultations" | "commerce";
}

export async function generateLayoutDNA(
	input: LayoutDNAGenerationInput,
	options: PipelineGenerationOptions,
): Promise<LayoutDNA> {
	const prompt = `LAYOUT DNA GENERATION — Create the fundamental visual identity system for ${input.business.name}

You are generating the PERSISTENT VISUAL IDENTITY SYSTEM that will control ALL design decisions for this website.
Every layout choice, spacing decision, and compositional moment must derive from this DNA.

Business: ${input.business.name}
Category: ${input.business.category}
Industry Psychology: ${JSON.stringify(input.industryPsychology)}
Conversion Intent: ${input.conversationIntent}

Generate STRICT JSON with THESE EXACT KEYS (no extra keys):

{
  "gridSystem": "string — specify the grid structure: '12-column-asymmetric', '6-column-modular', 'editorial-flexible', 'cinematic-offset', 'brutalist-monolithic'",
  "spacingRhythm": "string — specify the spatial rhythm: 'compressed-kinetic', 'balanced-editorial', 'airy-breathing', 'luxury-silence', 'brutalist-dense'",
  "scanPath": "string — how the eye should move: 'horizontal-flow', 'diagonal-ascending', 'vertical-stagger', 'z-pattern', 'circular-spiral'",
  "visualTempo": "string — pacing through the page: 'slow-meditative', 'steady-editorial', 'kinetic-rapid', 'pulse-cinematic', 'breath-rhythm'",
  "depthBehavior": "string — layering approach: 'flat-modern', 'layered-depth', 'overlapping-planes', 'immersive-3d', 'floating-hierarchy'",
  "imageWeighting": "string — role of imagery: 'images-dominant', 'images-supporting', 'image-texture-background', 'image-accent-moments'",
  "interactionDensity": "string — how interactive: 'interactive-dense', 'interactive-sparse', 'interactive-punctuated', 'interactive-hidden'",
  "asymmetryLevel": number (0-100, where 0=perfectly symmetric, 100=maximum compositional chaos),
  "dominantAxis": "string — primary visual direction: 'horizontal', 'vertical', 'diagonal', 'radial', 'chaotic'",
  "colorStrategy": "string — palette approach: 'monochromatic', 'analogous', 'complementary', 'triadic', 'atmospheric'",
  "shapeLanguage": "string — primary geometric shapes: 'circles', 'squares', 'triangles', 'organic-curves', 'mixed-geometry'"
}

CRITICAL RULES:
- This DNA is PERSISTENT — every element must respect it
- Be specific and intentional, not generic
- Choose based on industry psychology and business category
- Avoid SaaS/startup defaults (balanced grids, centered layouts, equal spacing)
- Asymmetry and irregular rhythm are preferred over perfect balance
`;

	try {
		const rawResponse = await options.llmJson(prompt, "layout-dna-generator");
		const dna = JSON.parse(rawResponse) as LayoutDNA;

		if (options.debugSession) {
			options.persistGenerationDebugFile(
				options.debugSession,
				"01-layout-dna-response.json",
				dna,
			);
		}

		return dna;
	} catch (err) {
		options.logStderr(`[LayoutDNAEngine] Generation failed: ${String(err)}`);
		// Return a fallback composition-driven DNA
		return {
			gridSystem: "editorial-flexible",
			spacingRhythm: "balanced-editorial",
			scanPath: "diagonal-ascending",
			visualTempo: "steady-editorial",
			depthBehavior: "layered-depth",
			imageWeighting: "images-supporting",
			interactionDensity: "interactive-punctuated",
			asymmetryLevel: 60,
			dominantAxis: "diagonal",
			colorStrategy: "complementary",
			shapeLanguage: "mixed-geometry",
		};
	}
}

/**
 * Validate that Layout DNA is actually unique and not defaulting
 */
export function validateLayoutDNAUniqueness(dna: LayoutDNA): {
	isUnique: boolean;
	issues: string[];
} {
	const issues: string[] = [];

	// Check for template-like defaults
	const defaultPatterns = {
		gridSystem: ["12-column", "standard-grid", "bootstrap"],
		spacingRhythm: ["balanced", "standard", "default"],
		asymmetryLevel: [50], // Perfect balance is template-like
		dominantAxis: ["horizontal"], // Most templates use horizontal
	};

	if (
		defaultPatterns.gridSystem.some((p) =>
			dna.gridSystem.toLowerCase().includes(p),
		)
	) {
		issues.push("Grid system defaulting to template pattern");
	}
	if (
		defaultPatterns.spacingRhythm.some((p) =>
			dna.spacingRhythm.toLowerCase().includes(p),
		)
	) {
		issues.push("Spacing rhythm using generic default");
	}
	if (dna.asymmetryLevel === 50) {
		issues.push("Asymmetry at perfect balance — too template-like");
	}
	if (dna.dominantAxis === "horizontal") {
		issues.push(
			"Dominant axis is generic horizontal — consider more unique direction",
		);
	}

	return {
		isUnique: issues.length === 0,
		issues,
	};
}
