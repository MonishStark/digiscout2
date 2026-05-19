/** @format */
import { HERO_LAYOUTS, FEATURES_LAYOUTS, GALLERY_LAYOUTS, TESTIMONIALS_LAYOUTS, CTA_LAYOUTS, FAQ_LAYOUTS, CONTACT_LAYOUTS, } from "./layout-registry";
const HERO_VARIANTS = [
    "immersive",
    "cinematic",
    "editorial",
    "editorial-split",
    "magazine",
    "centered",
    "minimal",
    "split",
];
const FEATURES_VARIANTS = [
    "bento",
    "editorial-cards",
    "editorial-list",
    "alternating-stack",
    "grid",
];
const GALLERY_VARIANTS = [
    "editorial-mosaic",
    "stacked-collage",
    "collage",
];
const TESTIMONIALS_VARIANTS = [
    "floating-cards",
    "editorial-quotes",
    "spotlight",
];
const CTA_VARIANTS = ["gradient-band", "split-card", "side-by-side"];
const FAQ_VARIANTS = ["cards", "split-columns", "grid"];
const CONTACT_VARIANTS = [
    "split-card",
    "minimal-centered",
    "centered",
];
export function validateWebsiteSchema(schema) {
    const errors = [];
    const repairs = [];
    if (!schema) {
        return { isValid: false, errors: ["Schema is null or undefined"] };
    }
    // 1. Version & Structure Check
    if (schema.schemaVersion !== "1.0") {
        schema.schemaVersion = "1.0";
        repairs.push("version_forced_1.0");
    }
    if (!schema.meta ||
        !schema.theme ||
        !schema.brand ||
        !Array.isArray(schema.sections)) {
        return {
            isValid: false,
            errors: ["Missing core top-level objects (meta, theme, brand, sections)"],
        };
    }
    // 2. Section Layout Enforcement
    const repairedSections = schema.sections.map((section, index) => {
        const type = (section.type || "unknown").toLowerCase();
        section.type = type; // Normalize case
        const normalizeValue = (value) => (value || "").toString().toLowerCase();
        const validateLayout = (layout, variant, allowed, variantAllowed, fallback) => {
            const finalLayout = layout || variant || fallback;
            section.layout = finalLayout;
            if (variant) {
                section.variant = variant;
            }
        };
        switch (type) {
            case "hero":
                validateLayout(section.layout, section.variant, [...HERO_LAYOUTS, ...HERO_VARIANTS], HERO_VARIANTS, "editorial-left");
                break;
            case "features":
                validateLayout(section.layout, section.variant, [...FEATURES_LAYOUTS, ...FEATURES_VARIANTS], FEATURES_VARIANTS, "feature-cards");
                break;
            case "gallery":
                validateLayout(section.layout, section.variant, [...GALLERY_LAYOUTS, ...GALLERY_VARIANTS], GALLERY_VARIANTS, "standard-grid");
                break;
            case "testimonials":
                validateLayout(section.layout, section.variant, [...TESTIMONIALS_LAYOUTS, ...TESTIMONIALS_VARIANTS], TESTIMONIALS_VARIANTS, "floating-cards");
                break;
            case "cta":
                validateLayout(section.layout, section.variant, [...CTA_LAYOUTS, ...CTA_VARIANTS], CTA_VARIANTS, "centered-premium");
                break;
            case "faq":
                validateLayout(section.layout, section.variant, [...FAQ_LAYOUTS, ...FAQ_VARIANTS], FAQ_VARIANTS, "accordion-clean");
                break;
            case "contact":
                validateLayout(section.layout, section.variant, [...CONTACT_LAYOUTS, ...CONTACT_VARIANTS], CONTACT_VARIANTS, "split-card");
                break;
            default:
                // Allow custom section types dynamically
                if (!section.layout) {
                    section.layout = "custom-block";
                }
                break;
        }
        if (!section.id) {
            section.id = `${type}-${index}`;
            repairs.push(`section_${index}_missing_id_auto_gen`);
        }
        return section;
    });
    // 3. Relaxed Section Order (AI decides narrative structure)
    // We no longer strictly enforce Hero at index 0 or Contact at the end to allow creative storytelling pacing.
    // 4. Brand & Theme Validation
    if (!schema.brand.businessName)
        errors.push("Missing businessName in brand");
    if (!schema.theme.brandDNA)
        errors.push("Missing brandDNA in theme");
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
        },
    };
}
