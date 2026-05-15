/** @format */

import { BrandDNA, WebsiteTheme } from "../types";

export interface ColorPalette {
	background: string;
	surface: string;
	primary: string;
	accent: string;
	text: string;
	muted: string;
	outline: string;
}

const PALETTES: Record<string, ColorPalette> = {
	"luxury-dark": {
		background: "#07070a",
		surface: "#111114",
		primary: "#c485fa",
		accent: "#ff78bc",
		text: "#f4f4f5",
		muted: "#a1a1aa",
		outline: "rgba(255,255,255,0.10)",
	},
	"modern-light": {
		background: "#ffffff",
		surface: "#f8fafc",
		primary: "#0f172a",
		accent: "#3b82f6",
		text: "#1e293b",
		muted: "#64748b",
		outline: "rgba(0,0,0,0.05)",
	},
	"earthy-natural": {
		background: "#fdfbf7",
		surface: "#f5f2ed",
		primary: "#433d3c",
		accent: "#8c7355",
		text: "#2c2726",
		muted: "#7d7471",
		outline: "rgba(67,61,60,0.08)",
	},
	"energetic-vibrant": {
		background: "#ffffff",
		surface: "#f0fdf4",
		primary: "#166534",
		accent: "#10b981",
		text: "#064e3b",
		muted: "#34d399",
		outline: "rgba(16,185,129,0.1)",
	},
};

export function generateBrandDNA(category: string): BrandDNA {
	const normalized = category.toLowerCase();

	if (normalized.includes("restaurant") || normalized.includes("cafe")) {
		return {
			personality: "friendly",
			visualMood: "warm-editorial",
			ctaEnergy: "inviting",
			spacingDensity: "balanced",
			imageStyle: "natural",
			typographyMood: "editorial",
			iconStyle: "outline",
		};
	}

	if (normalized.includes("salon") || normalized.includes("spa") || normalized.includes("luxury")) {
		return {
			personality: "luxurious",
			visualMood: "warm-editorial",
			ctaEnergy: "inviting",
			spacingDensity: "airy",
			imageStyle: "moody-luxury",
			typographyMood: "elegant",
			iconStyle: "minimal",
		};
	}

	if (normalized.includes("law") || normalized.includes("legal") || normalized.includes("consult")) {
		return {
			personality: "trustworthy",
			visualMood: "modern-authority",
			ctaEnergy: "formal",
			spacingDensity: "balanced",
			imageStyle: "cinematic",
			typographyMood: "corporate",
			iconStyle: "minimal",
		};
	}

	if (normalized.includes("gym") || normalized.includes("fitness") || normalized.includes("sport")) {
		return {
			personality: "energetic",
			visualMood: "vibrant-energy",
			ctaEnergy: "urgent",
			spacingDensity: "compact",
			imageStyle: "natural",
			typographyMood: "energetic",
			iconStyle: "filled",
		};
	}

	// Default premium personality
	return {
		personality: "premium",
		visualMood: "modern-authority",
		ctaEnergy: "inviting",
		spacingDensity: "balanced",
		imageStyle: "bright-clean",
		typographyMood: "minimal",
		iconStyle: "outline",
	};
}

export function getPaletteForDNA(dna: BrandDNA): ColorPalette {
	switch (dna.visualMood) {
		case "warm-editorial":
			return PALETTES["earthy-natural"];
		case "vibrant-energy":
			return PALETTES["energetic-vibrant"];
		case "polished-clinical":
		case "modern-authority":
		default:
			return PALETTES["modern-light"];
	}
}
