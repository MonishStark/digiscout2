/**
 * VISUAL ENTROPY ENGINE
 *
 * Scores websites for uniqueness and detects low-entropy patterns.
 * Prevents convergence by tracking what makes each website unique.
 *
 * @format
 */

import {
	VisualEntropyScore,
	NarrativeComposition,
	LayoutDNA,
	TypographyBehavior,
	PipelineGenerationOptions,
} from "./composition-architecture";

interface EntropyCalculationInput {
	html: string;
	narrativeCompositions: NarrativeComposition[];
	layoutDNA: LayoutDNA;
	typographyBehavior: TypographyBehavior;
	businessCategory: string;
}

export function calculateVisualEntropyScore(
	input: EntropyCalculationInput,
): VisualEntropyScore {
	const score: VisualEntropyScore = {
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
	};

	// Score 1: Hero Uniqueness (0-100)
	const heroComposition = input.narrativeCompositions.find(
		(c) => c.narrativePurpose === "establish-authority",
	);
	if (heroComposition) {
		let heroScore = 50; // Start at baseline

		// Add points for unique visual behaviors
		if (
			!["immersive-overlap", "editorial-asymmetry"].includes(
				heroComposition.visualBehavior,
			)
		) {
			heroScore += 15;
		}
		// Add points for asymmetric layout
		if (heroComposition.scanPattern !== "horizontal-flow") {
			heroScore += 20;
		}
		// Add points for unique density
		if (!["balanced"].includes(heroComposition.densityMode)) {
			heroScore += 15;
		}

		score.heroUniqueness = Math.min(100, heroScore);
	}

	// Score 2: Typography Diversity (0-100)
	let typographyScore = 50;
	if (input.typographyBehavior.hierarchyRole !== "supporting") {
		typographyScore += 15;
	}
	if (input.typographyBehavior.sizeProgression !== "stepped") {
		typographyScore += 15;
	}
	if (input.typographyBehavior.emotionalPacing !== "moderate") {
		typographyScore += 20;
	}
	score.typographyDiversity = Math.min(100, typographyScore);

	// Score 3: Spacing Diversity (0-100)
	let spacingScore = 50;
	const spacingVariation = countUniqueSpacingValues(input.html);
	spacingScore += Math.min(30, spacingVariation * 3); // More unique values = higher score
	score.spacingDiversity = Math.min(100, spacingScore);

	// Score 4: Composition Diversity (0-100)
	let compositionScore = 0;
	const uniquePurposes = new Set(
		input.narrativeCompositions.map((c) => c.narrativePurpose),
	);
	compositionScore += Math.min(30, uniquePurposes.size * 5);
	const uniqueBehaviors = new Set(
		input.narrativeCompositions.map((c) => c.visualBehavior),
	);
	compositionScore += Math.min(40, uniqueBehaviors.size * 8);
	const uniqueScanPatterns = new Set(
		input.narrativeCompositions.map((c) => c.scanPattern),
	);
	compositionScore += Math.min(30, uniqueScanPatterns.size * 5);
	score.compositionDiversity = Math.min(100, compositionScore);

	// Score 5: Grid Diversity (0-100)
	let gridScore = 50;
	if (
		!input.layoutDNA.gridSystem.includes("12-column") &&
		!input.layoutDNA.gridSystem.includes("standard")
	) {
		gridScore += 30;
	}
	if (input.layoutDNA.asymmetryLevel > 60) {
		gridScore += 20;
	}
	score.gridDiversity = Math.min(100, gridScore);

	// Score 6: CTA Diversity (0-100)
	let ctaScore = 50;
	const ctaTexts = input.narrativeCompositions
		.flatMap((c) => c.actions || [])
		.map((a) => a.label.toLowerCase());
	const uniqueCTAs = new Set(ctaTexts);
	if (uniqueCTAs.size > 2) {
		ctaScore += 30;
	}
	score.ctaDiversity = Math.min(100, ctaScore);

	// Score 7: Template Similarity Score (0-100, lower is better)
	const templateIndicators = detectTemplateIndicators(input);
	score.templateSimilarityScore = templateIndicators;

	// Calculate overall score (weighted average)
	score.overallScore = Math.round(
		score.heroUniqueness * 0.15 +
			score.typographyDiversity * 0.15 +
			score.spacingDiversity * 0.1 +
			score.compositionDiversity * 0.2 +
			score.gridDiversity * 0.15 +
			score.ctaDiversity * 0.1 +
			(100 - score.templateSimilarityScore) * 0.15,
	);

	// Identify low-entropy compositions
	for (const composition of input.narrativeCompositions) {
		const compositionEntropy = calculateCompositionEntropy(composition);
		if (compositionEntropy < 40) {
			score.lowEntropyCompositions.push(composition.id);
		}
	}

	// Add risk flags
	if (score.overallScore < 50) {
		score.risks.push(
			"Overall entropy is too low — entire site feels template-like",
		);
	}
	if (score.heroUniqueness < 40) {
		score.risks.push(
			"Hero section is generic — lack of unique visual treatment",
		);
	}
	if (score.gridDiversity < 40) {
		score.risks.push("Grid system is too standard — increase asymmetry");
	}
	if (score.compositionDiversity < 50) {
		score.risks.push(
			"Composition sequence is predictable — vary narrative purposes",
		);
	}
	if (score.templateSimilarityScore > 60) {
		score.risks.push(
			"High similarity to known templates — regenerate with different DNA",
		);
	}

	return score;
}

/**
 * Count unique spacing values in HTML
 */
function countUniqueSpacingValues(html: string): number {
	const spacingValues = new Set<string>();

	// Find clamp() expressions
	const clampMatches = html.match(/clamp\([^)]+\)/g) || [];
	clampMatches.forEach((m) => spacingValues.add(m));

	// Find px/rem/em values
	const sizeMatches = html.match(/\b\d+(?:px|rem|em|vh|vw)\b/g) || [];
	sizeMatches.forEach((m) => spacingValues.add(m));

	return spacingValues.size;
}

/**
 * Detect template-like patterns
 */
function detectTemplateIndicators(input: EntropyCalculationInput): number {
	let score = 0;

	// Check for centered layouts (template-like)
	const centeredCount = (
		input.html.match(/text-center|mx-auto|justify-center/gi) || []
	).length;
	if (centeredCount > 5) {
		score += 20;
	}

	// Check for symmetric grid
	if (input.layoutDNA.asymmetryLevel < 40) {
		score += 25;
	}

	// Check for balanced spacing rhythm (generic)
	if (input.layoutDNA.spacingRhythm.includes("balanced")) {
		score += 15;
	}

	// Check for standard grid system
	if (
		input.layoutDNA.gridSystem.includes("12-column") &&
		!input.layoutDNA.gridSystem.includes("asymmetric")
	) {
		score += 15;
	}

	// Check for predictable composition order
	const purposes = input.narrativeCompositions.map((c) => c.narrativePurpose);
	if (
		purposes[0] === "establish-authority" &&
		purposes[purposes.length - 1] === "close-conversion"
	) {
		score += 10; // Predictable arc
	}

	// Check for generic visual behavior
	const behaviors = new Set(
		input.narrativeCompositions.map((c) => c.visualBehavior),
	);
	if (behaviors.size === 1) {
		score += 25; // All sections use same behavior = template-like
	}

	return Math.min(100, score);
}

/**
 * Calculate entropy for a single composition
 */
function calculateCompositionEntropy(
	composition: NarrativeComposition,
): number {
	let entropy = 50; // Start at baseline

	// Add points for unique visual behavior
	const commonBehaviors = [
		"immersive-overlap",
		"editorial-asymmetry",
		"kinetic-stagger",
		"intimate-paired",
	];
	if (!commonBehaviors.includes(composition.visualBehavior)) {
		entropy += 20;
	}

	// Add points for unique scan pattern
	if (composition.scanPattern !== "horizontal-flow") {
		entropy += 15;
	}

	// Add points for interesting density
	if (!["balanced"].includes(composition.densityMode)) {
		entropy += 15;
	}

	// Add points for motion
	if (composition.motionLanguage.internalMotion !== "none") {
		entropy += 10;
	}

	return Math.min(100, entropy);
}

/**
 * Determine if regeneration is needed
 */
export function shouldRegenerateCompositions(score: VisualEntropyScore): {
	shouldRegenerate: boolean;
	compositions: string[];
	threshold: number;
} {
	return {
		shouldRegenerate:
			score.overallScore < 55 || score.lowEntropyCompositions.length > 2,
		compositions: score.lowEntropyCompositions,
		threshold: 40,
	};
}

/**
 * Get entropy report as string (for debugging)
 */
export function getEntropyReport(score: VisualEntropyScore): string {
	return `
VISUAL ENTROPY REPORT
======================
Overall Score: ${score.overallScore}/100
- Hero Uniqueness: ${score.heroUniqueness}
- Typography Diversity: ${score.typographyDiversity}
- Spacing Diversity: ${score.spacingDiversity}
- Composition Diversity: ${score.compositionDiversity}
- Grid Diversity: ${score.gridDiversity}
- CTA Diversity: ${score.ctaDiversity}
- Template Similarity: ${score.templateSimilarityScore}/100

Risks: ${score.risks.length > 0 ? score.risks.join("\n  - ") : "None"}
Low Entropy Compositions: ${score.lowEntropyCompositions.length > 0 ? score.lowEntropyCompositions.join(", ") : "None"}
`;
}
