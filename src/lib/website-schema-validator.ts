import { 
	ValidationResult 
} from "../types";
import {
	HERO_LAYOUTS,
	FEATURES_LAYOUTS,
	GALLERY_LAYOUTS,
	TESTIMONIALS_LAYOUTS,
	CTA_LAYOUTS,
	FAQ_LAYOUTS,
	CONTACT_LAYOUTS,
} from "./layout-registry";

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

	if (!schema.meta || !schema.theme || !schema.brand || !Array.isArray(schema.sections)) {
		return { isValid: false, errors: ["Missing core top-level objects (meta, theme, brand, sections)"] };
	}

	// 2. Section Layout Enforcement
	const repairedSections = schema.sections.map((section: any, index: number) => {
		const type = (section.type || "unknown").toLowerCase();
		section.type = type; // Normalize case
		
		const validateLayout = (layout: string, allowed: readonly string[], fallback: string) => {
			if (!allowed.includes(layout as any)) {
				errors.push(`Section ${index} (${type}): Invalid layout "${layout}"`);
				section.layout = fallback;
				repairs.push(`section_${index}_layout_repair: ${layout} -> ${fallback}`);
			}
		};

		switch (type) {
			case "hero":
				validateLayout(section.layout, HERO_LAYOUTS, "editorial-left");
				break;
			case "features":
				validateLayout(section.layout, FEATURES_LAYOUTS, "feature-cards");
				break;
			case "gallery":
				validateLayout(section.layout, GALLERY_LAYOUTS, "standard-grid");
				break;
			case "testimonials":
				validateLayout(section.layout, TESTIMONIALS_LAYOUTS, "floating-cards");
				break;
			case "cta":
				validateLayout(section.layout, CTA_LAYOUTS, "centered-premium");
				break;
			case "faq":
				validateLayout(section.layout, FAQ_LAYOUTS, "accordion-clean");
				break;
			case "contact":
				validateLayout(section.layout, CONTACT_LAYOUTS, "split-card");
				break;
			default:
				errors.push(`Section ${index}: Unknown section type "${type}"`);
		}
		
		if (!section.id) {
			section.id = `${type}-${index}`;
			repairs.push(`section_${index}_missing_id_auto_gen`);
		}

		return section;
	});

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
		const contactIdx = repairedSections.findIndex((s: any) => s.type === "contact");
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
				validatedAt: new Date().toISOString() 
			} 
		} as WebsiteSchema,
	};
}
