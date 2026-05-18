/** @format */

import { ValidationResult } from "../types";
import {
	HERO_LAYOUTS,
	FEATURES_LAYOUTS,
	GALLERY_LAYOUTS,
	TESTIMONIALS_LAYOUTS,
	CTA_LAYOUTS,
	FAQ_LAYOUTS,
	CONTACT_LAYOUTS,
} from "./layout-registry";

const HERO_VARIANTS = [
	"immersive",
	"cinematic",
	"editorial",
	"editorial-split",
	"magazine",
	"centered",
	"minimal",
	"split",
] as const;

const FEATURES_VARIANTS = [
	"bento",
	"editorial-cards",
	"editorial-list",
	"alternating-stack",
	"grid",
] as const;

const GALLERY_VARIANTS = [
	"editorial-mosaic",
	"stacked-collage",
	"collage",
] as const;

const TESTIMONIALS_VARIANTS = [
	"floating-cards",
	"editorial-quotes",
	"spotlight",
] as const;

const CTA_VARIANTS = ["gradient-band", "split-card", "side-by-side"] as const;

const FAQ_VARIANTS = ["cards", "split-columns", "grid"] as const;

const CONTACT_VARIANTS = [
	"split-card",
	"minimal-centered",
	"centered",
] as const;

export function validateWebsiteSchema(schema: any): ValidationResult {
	const errors: string[] = [];
	const repairs: string[] = [];

	if (!schema) {
		return { isValid: false, errors: ["Schema is null or undefined"] };
	}

	// 1. Version & Structure Check
	if (schema.schemaVersion !== "1.0") {
		schema.schemaVersion = "1.0";
		repairs.push("version_forced_1.0");
	}

	if (
		!schema.meta ||
		!schema.theme ||
		!schema.brand ||
		!Array.isArray(schema.sections)
	) {
		return {
			isValid: false,
			errors: ["Missing core top-level objects (meta, theme, brand, sections)"],
		};
	}

	// 2. Section Layout Enforcement
	const repairedSections = schema.sections.map(
		(section: any, index: number) => {
			const type = (section.type || "unknown").toLowerCase();
			section.type = type; // Normalize case

			const normalizeValue = (value?: string) =>
				(value || "").toString().toLowerCase();

			const validateLayout = (
				layout: string | undefined,
				variant: string | undefined,
				allowed: readonly string[],
				variantAllowed: readonly string[],
				fallback: string,
			) => {
				const normalizedLayout = normalizeValue(layout);
				const normalizedVariant = normalizeValue(variant);
				const layoutValid = allowed.includes(normalizedLayout as any);
				const variantValid = variantAllowed.includes(normalizedVariant as any);

				if (layoutValid) {
					section.layout = normalizedLayout;
					return;
				}
				if (variantValid) {
					section.layout = normalizedVariant;
					repairs.push(
						`section_${index}_layout_repair: ${normalizedLayout || "(missing)"} -> ${normalizedVariant}`,
					);
					return;
				}

				errors.push(
					`Section ${index} (${type}): Invalid layout "${normalizedLayout || normalizedVariant || "(missing)"}"`,
				);
				section.layout = fallback;
				repairs.push(
					`section_${index}_layout_repair: ${normalizedLayout || normalizedVariant || "(missing)"} -> ${fallback}`,
				);
			};

			switch (type) {
				case "hero":
					validateLayout(
						section.layout,
						section.variant,
						[...HERO_LAYOUTS, ...HERO_VARIANTS],
						HERO_VARIANTS,
						"editorial-left",
					);
					break;
				case "features":
					validateLayout(
						section.layout,
						section.variant,
						[...FEATURES_LAYOUTS, ...FEATURES_VARIANTS],
						FEATURES_VARIANTS,
						"feature-cards",
					);
					break;
				case "gallery":
					validateLayout(
						section.layout,
						section.variant,
						[...GALLERY_LAYOUTS, ...GALLERY_VARIANTS],
						GALLERY_VARIANTS,
						"standard-grid",
					);
					break;
				case "testimonials":
					validateLayout(
						section.layout,
						section.variant,
						[...TESTIMONIALS_LAYOUTS, ...TESTIMONIALS_VARIANTS],
						TESTIMONIALS_VARIANTS,
						"floating-cards",
					);
					break;
				case "cta":
					validateLayout(
						section.layout,
						section.variant,
						[...CTA_LAYOUTS, ...CTA_VARIANTS],
						CTA_VARIANTS,
						"centered-premium",
					);
					break;
				case "faq":
					validateLayout(
						section.layout,
						section.variant,
						[...FAQ_LAYOUTS, ...FAQ_VARIANTS],
						FAQ_VARIANTS,
						"accordion-clean",
					);
					break;
				case "contact":
					validateLayout(
						section.layout,
						section.variant,
						[...CONTACT_LAYOUTS, ...CONTACT_VARIANTS],
						CONTACT_VARIANTS,
						"split-card",
					);
					break;
				default:
					errors.push(`Section ${index}: Unknown section type "${type}"`);
			}

			if (!section.id) {
				section.id = `${type}-${index}`;
				repairs.push(`section_${index}_missing_id_auto_gen`);
			}

			return section;
		},
	);

	// 3. Section Order Enforcement (Business Logic)
	const sectionTypes = repairedSections.map((s: any) => s.type);
	if (sectionTypes[0] !== "hero") {
		errors.push("Layout sequencing error: Hero must be first");
		// Strategic repair: Find hero and move to front if it exists
		const heroIdx = repairedSections.findIndex((s: any) => s.type === "hero");
		if (heroIdx > 0) {
			const hero = repairedSections.splice(heroIdx, 1)[0];
			repairedSections.unshift(hero);
			repairs.push("hero_moved_to_front");
		}
	}

	if (sectionTypes[sectionTypes.length - 1] !== "contact") {
		errors.push("Layout sequencing error: Contact must be last");
		const contactIdx = repairedSections.findIndex(
			(s: any) => s.type === "contact",
		);
		if (contactIdx >= 0 && contactIdx < repairedSections.length - 1) {
			const contact = repairedSections.splice(contactIdx, 1)[0];
			repairedSections.push(contact);
			repairs.push("contact_moved_to_back");
		}
	}

	// 4. Brand & Theme Validation
	if (!schema.brand.businessName) errors.push("Missing businessName in brand");
	if (!schema.theme.brandDNA) errors.push("Missing brandDNA in theme");

	return {
		isValid: errors.length === 0,
		errors,
		repairedSchema: {
			...schema,
			sections: repairedSections,
			_validation: {
				repairs,
				validatedAt: new Date().toISOString(),
			},
		} as WebsiteSchema,
	};
}
