/** @format */

import { WebsiteSchema, WebsiteSection } from "../types";
import {
	HERO_LAYOUTS,
	FEATURES_LAYOUTS,
	GALLERY_LAYOUTS,
	TESTIMONIALS_LAYOUTS,
	CTA_LAYOUTS,
	FAQ_LAYOUTS,
	CONTACT_LAYOUTS,
} from "./layout-registry";

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	repairedSchema?: WebsiteSchema;
}

export function validateWebsiteSchema(schema: any): ValidationResult {
	const errors: string[] = [];
	
	if (!schema) {
		return { isValid: false, errors: ["Schema is null or undefined"] };
	}

	if (schema.schemaVersion !== "1.0") {
		errors.push(`Invalid schema version: ${schema.schemaVersion}`);
	}

	if (!schema.meta || !schema.theme || !schema.brand || !Array.isArray(schema.sections)) {
		errors.push("Schema is missing core top-level objects (meta, theme, brand, sections)");
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	// Section specific validation
	const repairedSections = schema.sections.map((section: any, index: number) => {
		const type = section.type;
		
		switch (type) {
			case "hero":
				if (!HERO_LAYOUTS.includes(section.layout)) {
					errors.push(`Section ${index}: Invalid hero layout "${section.layout}"`);
					section.layout = "editorial-left"; // Fallback
				}
				break;
			case "features":
				if (!FEATURES_LAYOUTS.includes(section.layout)) {
					errors.push(`Section ${index}: Invalid features layout "${section.layout}"`);
					section.layout = "feature-cards";
				}
				break;
			case "gallery":
				if (!GALLERY_LAYOUTS.includes(section.layout)) {
					errors.push(`Section ${index}: Invalid gallery layout "${section.layout}"`);
					section.layout = "standard-grid";
				}
				break;
			case "testimonials":
				if (!TESTIMONIALS_LAYOUTS.includes(section.layout)) {
					errors.push(`Section ${index}: Invalid testimonials layout "${section.layout}"`);
					section.layout = "floating-cards";
				}
				break;
			case "cta":
				if (!CTA_LAYOUTS.includes(section.layout)) {
					errors.push(`Section ${index}: Invalid cta layout "${section.layout}"`);
					section.layout = "centered-premium";
				}
				break;
			case "faq":
				if (!FAQ_LAYOUTS.includes(section.layout)) {
					errors.push(`Section ${index}: Invalid faq layout "${section.layout}"`);
					section.layout = "accordion-clean";
				}
				break;
			case "contact":
				if (!CONTACT_LAYOUTS.includes(section.layout)) {
					errors.push(`Section ${index}: Invalid contact layout "${section.layout}"`);
					section.layout = "split-card";
				}
				break;
			default:
				errors.push(`Section ${index}: Unknown section type "${type}"`);
		}
		
		return section;
	});

	// Order validation
	const sectionTypes = repairedSections.map((s: any) => s.type);
	if (sectionTypes[0] !== "hero") {
		errors.push("Hero section must be the first section");
		// In a real repair we would move it, but for now we just log
	}
	if (sectionTypes[sectionTypes.length - 1] !== "contact") {
		errors.push("Contact section must be the last section");
	}

	return {
		isValid: errors.length === 0,
		errors,
		repairedSchema: { ...schema, sections: repairedSections } as WebsiteSchema,
	};
}
