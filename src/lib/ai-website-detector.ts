/**
 * AI WEBSITE DETECTOR
 *
 * Identifies template-like patterns, startup SaaS layouts, generic AI outputs
 * and rejects them before they reach the user.
 *
 * @format
 */

import {
	AIWebsiteDetectionResult,
	ANTI_TEMPLATE_PATTERNS,
	PipelineGenerationOptions,
	NarrativeComposition,
	LayoutDNA,
} from "./composition-architecture";

interface DetectionInput {
	html: string;
	narrativeCompositions: NarrativeComposition[];
	layoutDNA: LayoutDNA;
	businessCategory: string;
}

export async function detectAIWebsitePatterns(
	input: DetectionInput,
	options: PipelineGenerationOptions,
): Promise<AIWebsiteDetectionResult> {
	const result: AIWebsiteDetectionResult = {
		isDetectedAsTemplate: false,
		templatePatterns: [],
		suspicionScore: 0,
		issues: [],
	};

	// Pattern 1: Startup SaaS detection
	const saasCues = [
		/class="[^"]*hero[^"]*"[\s\S]*?class="[^"]*features[^"]*"[\s\S]*?class="[^"]*testimonials/i,
		/pricing.*features.*testimonials/i,
		/sign[\s-]*up|get[\s-]*started|book[\s-]*a[\s-]*call/i,
	];

	for (const pattern of saasCues) {
		if (pattern.test(input.html)) {
			result.templatePatterns.push("startup-saas-pattern");
			result.suspicionScore += 15;
			result.issues.push({
				pattern: "Startup SaaS layout detected",
				severity: "high",
				recommendation: "Replace with industry-specific composition",
			});
		}
	}

	// Pattern 2: Excessive centering
	const centeredElements = (
		input.html.match(/text-center|mx-auto|justify-center|items-center/g) || []
	).length;
	if (centeredElements > 8) {
		result.templatePatterns.push("excessive-centering");
		result.suspicionScore += 20;
		result.issues.push({
			pattern: `Excessive centering (${centeredElements} instances)`,
			severity: "high",
			recommendation: "Introduce asymmetry and offset layouts",
		});
	}

	// Pattern 3: Repetitive card structure
	const cardPattern = /<div[^>]*class="[^"]*card[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
	const cardMatches = input.html.match(cardPattern) || [];
	if (cardMatches.length > 4) {
		// Check if cards have same structure
		const cardHeights = cardMatches.map((c) =>
			(c.match(/h-\d+|min-h-\d+/g) || []).join("-"),
		);
		const uniqueHeights = new Set(cardHeights);
		if (uniqueHeights.size === 1 && cardMatches.length > 4) {
			result.templatePatterns.push("repetitive-card-structure");
			result.suspicionScore += 25;
			result.issues.push({
				pattern: "Repetitive card structures with identical dimensions",
				severity: "high",
				recommendation: "Vary card sizes, stagger, and use asymmetric layout",
			});
		}
	}

	// Pattern 4: Bootstrap-like grid
	if (input.html.includes("col-") || input.html.includes("row")) {
		result.templatePatterns.push("bootstrap-grid");
		result.suspicionScore += 15;
		result.issues.push({
			pattern: "Bootstrap-like grid system detected",
			severity: "medium",
			recommendation: "Use CSS Grid with asymmetric layouts instead",
		});
	}

	// Pattern 5: Composition sequence similarity
	const compositionSequence = input.narrativeCompositions
		.map((c) => c.narrativePurpose)
		.join(" → ");
	const templateSequences = [
		"establish-authority → prove-credibility → showcase-work → facilitate-action",
		"establish-authority → explain-process → prove-credibility → generate-desire → close-conversion",
		"showcase-work → prove-credibility → build-emotion → facilitate-action",
	];

	if (templateSequences.some((seq) => compositionSequence === seq)) {
		result.templatePatterns.push("template-composition-sequence");
		result.suspicionScore += 20;
		result.issues.push({
			pattern: "Composition sequence matches known template pattern",
			severity: "high",
			recommendation:
				"Vary narrative purpose ordering based on business psychology",
		});
	}

	// Pattern 6: Generic gradient backgrounds
	const gradientCount = (input.html.match(/gradient|from-|to-/gi) || []).length;
	if (gradientCount > 6) {
		result.templatePatterns.push("excessive-gradients");
		result.suspicionScore += 10;
		result.issues.push({
			pattern: "Excessive gradient usage (generic aesthetic)",
			severity: "low",
			recommendation: "Use solid colors or textures for more specific feel",
		});
	}

	// Pattern 7: Generic typography behavior
	if (
		input.html.match(/font-size:\s*48px|font-size:\s*64px/gi) &&
		!input.html.match(/clamp/gi)
	) {
		result.templatePatterns.push("non-responsive-typography");
		result.suspicionScore += 15;
		result.issues.push({
			pattern: "Fixed font sizes instead of fluid typography",
			severity: "medium",
			recommendation:
				"Use clamp() for responsive, business-specific typography scaling",
		});
	}

	// Pattern 8: Symmetry in Layout DNA
	if (input.layoutDNA.asymmetryLevel <= 40) {
		result.templatePatterns.push("symmetric-layout-dna");
		result.suspicionScore += 25;
		result.issues.push({
			pattern: "Layout DNA overly symmetric (suggests template thinking)",
			severity: "high",
			recommendation:
				"Increase asymmetry to 60+ for unique, intentional composition",
		});
	}

	// Pattern 9: Check for generic copy markers
	const genericCopyMarkers = [
		"what makes this different",
		"high-signal positioning",
		"proof-led narrative",
		"conversion architecture",
		"premium experience",
		"world-class service",
		"best in industry",
	];

	for (const marker of genericCopyMarkers) {
		if (input.html.toLowerCase().includes(marker)) {
			result.templatePatterns.push("generic-copy");
			result.suspicionScore += 10;
			result.issues.push({
				pattern: `Generic copy detected: "${marker}"`,
				severity: "medium",
				recommendation: "Use business-specific, industry-aware messaging",
			});
		}
	}

	// Pattern 10: Industry mismatch
	const businessCategory = input.businessCategory.toLowerCase();
	if (
		businessCategory.includes("law") ||
		businessCategory.includes("finance")
	) {
		// Law firms should NOT have playful, energetic vibes
		if (input.layoutDNA.visualTempo === "kinetic-rapid") {
			result.issues.push({
				pattern: "Industry mismatch: Kinetic layout for law firm",
				severity: "high",
				recommendation: "Use slow-meditative pacing for legal services",
			});
			result.suspicionScore += 30;
		}
	}

	result.isDetectedAsTemplate = result.suspicionScore >= 50;

	if (options.debugSession) {
		options.persistGenerationDebugFile(
			options.debugSession,
			"02-ai-detection-result.json",
			result,
		);
	}

	return result;
}

/**
 * Provide specific remediation recommendations
 */
export function getRemediationStrategy(detection: AIWebsiteDetectionResult): {
	regenerateCompositions: string[];
	mutateParts: string[];
} {
	const regenerateCompositions: string[] = [];
	const mutateParts: string[] = [];

	for (const issue of detection.issues) {
		if (issue.severity === "critical" || issue.severity === "high") {
			if (issue.pattern.includes("hero") || issue.pattern.includes("Hero")) {
				regenerateCompositions.push("hero");
			}
			if (issue.pattern.includes("grid")) {
				mutateParts.push("layoutDNA");
			}
			if (issue.pattern.includes("typography")) {
				regenerateCompositions.push("all");
				mutateParts.push("typographyBehavior");
			}
		}
	}

	return {
		regenerateCompositions,
		mutateParts,
	};
}
