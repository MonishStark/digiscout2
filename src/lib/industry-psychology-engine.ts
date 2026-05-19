/**
 * INDUSTRY VISUAL PSYCHOLOGY ENGINE
 *
 * Generates business-category-specific visual behavior profiles.
 * Law firms render NOTHING like restaurants.
 * Tattoo studios render completely differently from spas.
 *
 * @format
 */

import {
	IndustryVisualPsychology,
	PipelineGenerationOptions,
} from "./composition-architecture";

interface PsychologyGenerationInput {
	business: {
		name: string;
		category: string;
		address?: string;
	};
	conversionIntent: "bookings" | "walk-ins" | "consultations" | "commerce";
}

/**
 * Map business categories to predefined psychology profiles
 */
const INDUSTRY_PSYCHOLOGY_DATABASE: Record<
	string,
	Partial<IndustryVisualPsychology>
> = {
	"law-firm": {
		emotionalTarget: "trustworthiness",
		decisionPace: "deliberate",
		typographyBehavior: "restrained-serif",
		pagePacing: "slow-meditative",
		colorIntensity: "muted-archive",
		imageTreatment: "natural-square",
		motionCharacter: "subtle-reveal",
		asymmetryPreference: 35,
		densityPreference: 45,
		contrastPreference: 60,
		atmosphere: "archival",
	},
	"restaurant-cafe": {
		emotionalTarget: "joy",
		decisionPace: "immediate",
		typographyBehavior: "dominant-modern",
		pagePacing: "moderate-editorial",
		colorIntensity: "vibrant-energy",
		imageTreatment: "lifestyle-editorial",
		motionCharacter: "kinetic-bounce",
		asymmetryPreference: 75,
		densityPreference: 65,
		contrastPreference: 75,
		atmosphere: "energetic",
	},
	"gym-fitness": {
		emotionalTarget: "energy",
		decisionPace: "immediate",
		typographyBehavior: "compressed-kinetic",
		pagePacing: "fast-kinetic",
		colorIntensity: "vibrant-energy",
		imageTreatment: "lifestyle-editorial",
		motionCharacter: "kinetic-bounce",
		asymmetryPreference: 80,
		densityPreference: 75,
		contrastPreference: 85,
		atmosphere: "energetic",
	},
	"salon-spa": {
		emotionalTarget: "calm",
		decisionPace: "deliberate",
		typographyBehavior: "expansive-airy",
		pagePacing: "slow-meditative",
		colorIntensity: "muted-archive",
		imageTreatment: "texture-macro",
		motionCharacter: "ambient-breathing",
		asymmetryPreference: 45,
		densityPreference: 30,
		contrastPreference: 40,
		atmosphere: "intimate",
	},
	"consulting-agency": {
		emotionalTarget: "authority",
		decisionPace: "analytical",
		typographyBehavior: "dominant-modern",
		pagePacing: "moderate-editorial",
		colorIntensity: "neutral-professional",
		imageTreatment: "product-isolated",
		motionCharacter: "cinematic-glide",
		asymmetryPreference: 55,
		densityPreference: 50,
		contrastPreference: 65,
		atmosphere: "industrial",
	},
	"retail-shop": {
		emotionalTarget: "desire",
		decisionPace: "exploratory",
		typographyBehavior: "layered-wall",
		pagePacing: "moderate-editorial",
		colorIntensity: "vibrant-energy",
		imageTreatment: "product-isolated",
		motionCharacter: "tactile-feedback",
		asymmetryPreference: 70,
		densityPreference: 70,
		contrastPreference: 80,
		atmosphere: "energetic",
	},
	"tattoo-studio": {
		emotionalTarget: "rebellion",
		decisionPace: "exploratory",
		typographyBehavior: "layered-wall",
		pagePacing: "fast-kinetic",
		colorIntensity: "vibrant-energy",
		imageTreatment: "lifestyle-editorial",
		motionCharacter: "kinetic-bounce",
		asymmetryPreference: 85,
		densityPreference: 80,
		contrastPreference: 90,
		atmosphere: "industrial",
	},
	"design-studio": {
		emotionalTarget: "creativity",
		decisionPace: "exploratory",
		typographyBehavior: "layered-wall",
		pagePacing: "moderate-editorial",
		colorIntensity: "vibrant-energy",
		imageTreatment: "lifestyle-editorial",
		motionCharacter: "cinematic-glide",
		asymmetryPreference: 90,
		densityPreference: 70,
		contrastPreference: 85,
		atmosphere: "industrial",
	},
	"photography-studio": {
		emotionalTarget: "emotion",
		decisionPace: "exploratory",
		typographyBehavior: "restrained-serif",
		pagePacing: "slow-meditative",
		colorIntensity: "atmospheric-moody",
		imageTreatment: "cinematic-crops",
		motionCharacter: "cinematic-glide",
		asymmetryPreference: 75,
		densityPreference: 40,
		contrastPreference: 70,
		atmosphere: "luxury",
	},
};

export async function generateIndustryVisualPsychology(
	input: PsychologyGenerationInput,
	options: PipelineGenerationOptions,
): Promise<IndustryVisualPsychology> {
	const category = input.business.category.toLowerCase();

	// Try to match against known categories
	let baseProfile: Partial<IndustryVisualPsychology> | undefined;
	for (const [key, profile] of Object.entries(INDUSTRY_PSYCHOLOGY_DATABASE)) {
		if (
			category.includes(key.split("-")[0]) ||
			category.includes(key.replace("-", " "))
		) {
			baseProfile = profile;
			break;
		}
	}

	// If no match found, generate one
	if (!baseProfile) {
		const prompt = `INDUSTRY VISUAL PSYCHOLOGY PROFILE — ${input.business.category}

Generate a UNIQUE visual psychology profile for this business category and conversion intent.

Business Category: ${input.business.category}
Conversion Intent: ${input.conversionIntent}

This profile determines how the ENTIRE website behaves visually.

Return STRICT JSON with THESE EXACT KEYS:

{
  "emotionalTarget": "string — primary emotion: trustworthiness, energy, intimacy, authority, joy, calm, rebellion, creativity",
  "decisionPace": "string — how fast decisions are made: immediate, deliberate, exploratory, analytical",
  "typographyBehavior": "string — restrained-serif | dominant-modern | layered-wall | compressed-kinetic | expansive-airy",
  "pagePacing": "string — slow-meditative | moderate-editorial | fast-kinetic | rhythmic-pulse",
  "colorIntensity": "string — muted-archive | neutral-professional | vibrant-energy | atmospheric-moody",
  "imageTreatment": "string — cinematic-crops | natural-square | product-isolated | lifestyle-editorial | texture-macro",
  "motionCharacter": "string — subtle-reveal | kinetic-bounce | cinematic-glide | tactile-feedback | ambient-breathing",
  "asymmetryPreference": number (0-100, higher = more chaotic asymmetry),
  "densityPreference": number (0-100, higher = more dense/packed),
  "contrastPreference": number (0-100, higher = stronger contrast),
  "atmosphere": "string — industrial | luxury | editorial | energetic | intimate | archival"
}`;

		try {
			const raw = await options.llmJson(
				prompt,
				"industry-psychology-generator",
			);
			baseProfile = JSON.parse(raw);
		} catch (err) {
			options.logStderr(
				`[IndustryPsychology] Generation failed: ${String(err)}`,
			);
			baseProfile = {
				emotionalTarget: "energy",
				decisionPace: "moderate-editorial",
				typographyBehavior: "dominant-modern",
				pagePacing: "moderate-editorial",
				colorIntensity: "vibrant-energy",
				imageTreatment: "lifestyle-editorial",
				motionCharacter: "kinetic-bounce",
				asymmetryPreference: 65,
				densityPreference: 60,
				contrastPreference: 70,
				atmosphere: "energetic",
			};
		}
	}

	const psychology: IndustryVisualPsychology = {
		industry: input.business.category,
		category,
		emotionalTarget: baseProfile.emotionalTarget || "energy",
		decisionPace: baseProfile.decisionPace || "moderate-editorial",
		typographyBehavior: baseProfile.typographyBehavior || "dominant-modern",
		pagePacing: baseProfile.pagePacing || "moderate-editorial",
		colorIntensity: baseProfile.colorIntensity || "vibrant-energy",
		imageTreatment: baseProfile.imageTreatment || "lifestyle-editorial",
		motionCharacter: baseProfile.motionCharacter || "kinetic-bounce",
		asymmetryPreference: baseProfile.asymmetryPreference || 65,
		densityPreference: baseProfile.densityPreference || 60,
		contrastPreference: baseProfile.contrastPreference || 70,
		atmosphere: baseProfile.atmosphere || "energetic",
	};

	if (options.debugSession) {
		options.persistGenerationDebugFile(
			options.debugSession,
			"01-industry-psychology.json",
			psychology,
		);
	}

	return psychology;
}

/**
 * Get all known industry categories
 */
export function getKnownIndustries(): string[] {
	return Object.keys(INDUSTRY_PSYCHOLOGY_DATABASE);
}
