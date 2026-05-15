/** @format */

import { BrandDNA } from "../types";

export interface TypographyPair {
	heading: string;
	body: string;
	headingFont: string;
	bodyFont: string;
}

const FONT_PAIRS: Record<string, TypographyPair> = {
	elegant: {
		heading: "Playfair Display, serif",
		body: "Inter, sans-serif",
		headingFont: "Playfair Display",
		bodyFont: "Inter",
	},
	corporate: {
		heading: "IBM Plex Sans, sans-serif",
		body: "Inter, sans-serif",
		headingFont: "IBM Plex Sans",
		bodyFont: "Inter",
	},
	energetic: {
		heading: "Space Grotesk, sans-serif",
		body: "Inter, sans-serif",
		headingFont: "Space Grotesk",
		bodyFont: "Inter",
	},
	editorial: {
		heading: "Fraunces, serif",
		body: "Inter, sans-serif",
		headingFont: "Fraunces",
		bodyFont: "Inter",
	},
	minimal: {
		heading: "Inter, sans-serif",
		body: "Inter, sans-serif",
		headingFont: "Inter",
		bodyFont: "Inter",
	},
};

export function getTypographyForDNA(dna: BrandDNA): TypographyPair {
	return FONT_PAIRS[dna.typographyMood] || FONT_PAIRS.minimal;
}
