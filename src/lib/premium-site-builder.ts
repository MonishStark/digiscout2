/**
 * premium-site-builder.ts
 *
 * Visual Curation & Taste Refinement Engine.
 * Overhauls the adaptive rendering engine to focus on aesthetic restraint,
 * premium whitespace, cinematic image treatments, and category-specific design languages.
 */

export function esc(str: string) {
	return (str || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function hexToRgb(hex: string): string {
	const clean = (hex || "#000000").replace("#", "");
	const r = parseInt(clean.slice(0, 2), 16) || 0;
	const g = parseInt(clean.slice(2, 4), 16) || 0;
	const b = parseInt(clean.slice(4, 6), 16) || 0;
	return `${r},${g},${b}`;
}

function getSectionValue<T>(section: any, keys: string[], fallback: T): T {
	for (const key of keys) {
		const value = section?.[key] ?? section?.content?.[key];
		if (value !== undefined && value !== null && value !== "") {
			return value as T;
		}
	}
	return fallback;
}

function getSectionItems(section: any) {
	return section?.items || section?.content?.items || [];
}

// ==========================================
// 1. IMAGE QUALITY CURATION & STORYTELLING CENSOR
// ==========================================
export interface CuratedImage {
	src: string;
	alt: string;
	qualityScore: number; // 0 to 100
	isMapsImage: boolean;
	storytellingValue: number; // 0 to 100
}

function curateImagePool(images: any[]): CuratedImage[] {
	if (!Array.isArray(images) || images.length === 0) return [];

	return images.map((img: any) => {
		const src = img.src || img.url || (typeof img === "string" ? img : "");
		const alt = img.alt || "Premium visual display";
		const lowerSrc = src.toLowerCase();

		let score = 80; // default baseline
		let isMaps = false;

		// 1. Detect low-quality or generic map street views
		if (lowerSrc.includes("maps.googleapis") || lowerSrc.includes("googleusercontent.com/p/")) {
			isMaps = true;
			score -= 20; // Maps photos are often raw or unedited
		}

		// 2. Filter out generic file placeholders or broken links
		if (lowerSrc.includes("placeholder") || lowerSrc.includes("avatar") || lowerSrc.includes("broken")) {
			score -= 50;
		}

		// 3. Score storytelling value based on context alt tags
		let storyVal = 60;
		if (alt && alt.length > 15 && !alt.includes("photo") && !alt.includes("image")) {
			storyVal += 20; // descriptive alts imply high-value content
		}

		return {
			src,
			alt,
			qualityScore: Math.max(0, Math.min(100, score)),
			isMapsImage: isMaps,
			storytellingValue: Math.max(0, Math.min(100, storyVal))
		};
	}).filter(img => img.src && img.qualityScore > 35); // filter out absolute trash
}

function selectBestImages(curated: CuratedImage[], count: number, minScore = 50): CuratedImage[] {
	return curated
		.filter(img => img.qualityScore >= minScore)
		.sort((a, b) => b.qualityScore - a.qualityScore)
		.slice(0, count);
}

// ==========================================
// 2. CINEMATIC IMAGE ENHANCEMENT PIPELINE
// ==========================================
function getCinematicImageHtml(img: CuratedImage, treatment: string, ctx: any, customStyle = "") {
	const enhanceType = ctx.visualAtmosphere || "architectural-minimalism";
	let filterStyle = "";
	let overlayHtml = "";

	// Grade and apply cinematic filters without heavy performance costs
	if (enhanceType === "cinematic-darkness") {
		filterStyle = "filter: contrast(1.08) brightness(0.85) saturate(0.85) sepia(0.08) !important;";
		overlayHtml = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle, transparent 35%, rgba(8,9,13,0.65) 100%);pointer-events:none;"></div>`;
	} else if (enhanceType === "luxury-glow" || enhanceType === "soft-editorial-warmth") {
		filterStyle = "filter: sepia(0.18) saturate(0.88) contrast(0.98) brightness(1.02) !important;";
		overlayHtml = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(to bottom, rgba(${hexToRgb(ctx.BG)}, 0.05), rgba(${hexToRgb(ctx.BG)}, 0.2) 100%);pointer-events:none;"></div>`;
	} else if (enhanceType === "industrial-grit") {
		filterStyle = "filter: contrast(1.15) brightness(0.92) grayscale(0.2) !important;";
		// raw texture overlay
		overlayHtml = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background-image:url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.95\" numOctaves=\"2\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\" opacity=\"0.02\"/%3E%3C/svg%3E');opacity:0.6;pointer-events:none;"></div>`;
	} else if (enhanceType === "energetic-neon") {
		filterStyle = "filter: contrast(1.1) brightness(0.88) saturate(1.15) !important;";
		overlayHtml = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg, transparent 40%, rgba(12,13,18,0.7) 100%);pointer-events:none;"></div>`;
	}

	const shapeStyle = getImageTreatmentStyles(treatment, ctx);

	return `
<div style="position:relative;overflow:hidden;display:inline-block;width:100%;${customStyle} ${shapeStyle.container}">
  <img src="${esc(img.src)}" alt="${esc(img.alt)}" style="display:block;width:100%;height:100%;object-fit:cover;transition:transform 0.8s var(--ease-expo);${filterStyle} ${shapeStyle.image}" />
  ${overlayHtml}
</div>`;
}

// ==========================================
// 3. DESIGN DNA & VISUAL REFERENCE LANGUAGES
// ==========================================
export interface DesignDNA {
	spacingPersonality: "compressed" | "balanced" | "airy" | "luxury-editorial" | "brutalist-dense";
	compositionAggression: number;
	hierarchyIntensity: number;
	motionEnergy: number;
	visualDensity: number;
	asymmetryLevel: number;
	atmosphereIntensity: number;
	typographyDominance: "restrained" | "balanced" | "dominant-serif" | "brutalist-impact" | "cinematic-oversized" | "layered-typography-walls" | "vertical-accents";
	imageWeight: number;
	luxuryScore: number;
	cinematicScore: number;
	brutalismScore: number;
	editorialScore: number;
	softnessScore: number;
	visualAtmosphere: "industrial-grit" | "luxury-glow" | "soft-editorial-warmth" | "cinematic-darkness" | "energetic-neon" | "architectural-minimalism";
}

function getFallbackDNA(category: string): DesignDNA {
	const cat = (category || "").toLowerCase();
	if (cat.includes("salon") || cat.includes("spa") || cat.includes("boutique") || cat.includes("hair")) {
		return {
			spacingPersonality: "luxury-editorial",
			compositionAggression: 35, // High-end design is more restrained, less aggressive
			hierarchyIntensity: 65,
			motionEnergy: 30,
			visualDensity: 35,
			asymmetryLevel: 45,
			atmosphereIntensity: 60,
			typographyDominance: "dominant-serif",
			imageWeight: 75,
			luxuryScore: 90,
			cinematicScore: 20,
			brutalismScore: 5,
			editorialScore: 85,
			softnessScore: 85,
			visualAtmosphere: "luxury-glow"
		};
	}
	if (cat.includes("law") || cat.includes("advocat") || cat.includes("consult") || cat.includes("firm")) {
		return {
			spacingPersonality: "balanced",
			compositionAggression: 15,
			hierarchyIntensity: 50,
			motionEnergy: 25,
			visualDensity: 40,
			asymmetryLevel: 10,
			atmosphereIntensity: 30,
			typographyDominance: "restrained",
			imageWeight: 40,
			luxuryScore: 60,
			cinematicScore: 10,
			brutalismScore: 5,
			editorialScore: 70,
			softnessScore: 40,
			visualAtmosphere: "architectural-minimalism"
		};
	}
	if (cat.includes("restaurant") || cat.includes("cafe") || cat.includes("baker") || cat.includes("food")) {
		return {
			spacingPersonality: "balanced",
			compositionAggression: 40,
			hierarchyIntensity: 60,
			motionEnergy: 40,
			visualDensity: 50,
			asymmetryLevel: 30,
			atmosphereIntensity: 70,
			typographyDominance: "dominant-serif",
			imageWeight: 80,
			luxuryScore: 70,
			cinematicScore: 60,
			brutalismScore: 10,
			editorialScore: 60,
			softnessScore: 60,
			visualAtmosphere: "soft-editorial-warmth"
		};
	}
	if (cat.includes("gym") || cat.includes("fitness") || cat.includes("crossfit")) {
		return {
			spacingPersonality: "brutalist-dense",
			compositionAggression: 65,
			hierarchyIntensity: 80,
			motionEnergy: 80,
			visualDensity: 65,
			asymmetryLevel: 55,
			atmosphereIntensity: 75,
			typographyDominance: "brutalist-impact",
			imageWeight: 75,
			luxuryScore: 10,
			cinematicScore: 70,
			brutalismScore: 85,
			editorialScore: 20,
			softnessScore: 15,
			visualAtmosphere: "energetic-neon"
		};
	}
	return {
		spacingPersonality: "balanced",
		compositionAggression: 35,
		hierarchyIntensity: 50,
		motionEnergy: 40,
		visualDensity: 45,
		asymmetryLevel: 30,
		atmosphereIntensity: 50,
		typographyDominance: "balanced",
		imageWeight: 50,
		luxuryScore: 50,
		cinematicScore: 35,
		brutalismScore: 20,
		editorialScore: 50,
		softnessScore: 50,
		visualAtmosphere: "architectural-minimalism"
	};
}

// ==========================================
// 4. RESTRAINT CENSOR & VISUAL MODERATION ENGINE
// ==========================================
function applyRestraintModeration(dna: DesignDNA): DesignDNA {
	const moderated = { ...dna };

	// 1. Overdesign Suppression: Prevent aggressive mutations from becoming noisy
	if (moderated.compositionAggression > 75) {
		moderated.compositionAggression = 70; // Cap visual tension offsets
	}

	// 2. Glow and Atmosphere Moderation: High glow becomes visually cheap
	if (moderated.atmosphereIntensity > 80) {
		moderated.atmosphereIntensity = 75; // Dampen glow radial spreads
	}

	// 3. Typographic Restraint: Excessive font scales reduce elite designer feel
	if (moderated.hierarchyIntensity > 85) {
		moderated.hierarchyIntensity = 80;
	}

	// 4. Softness vs Brutalism Harmony
	if (moderated.brutalismScore > 75 && moderated.luxuryScore > 30) {
		moderated.luxuryScore = 15; // Hard boundaries should not blend with circular shapes
	}

	return moderated;
}

// ==========================================
// 5. POST-LAYOUT TASTE REFINEMENT PASS ENGINE
// ==========================================
function runPostLayoutTasteRefinement(sections: any[], dna: DesignDNA): any[] {
	let lastSectionBgWasAlternative = false;

	return sections.map((sec, idx) => {
		const comp = { ...(sec.composition || {}) };

		// 1. Spacing pacing control: Avoid identical airy segments consecutively
		if (idx > 0 && comp.spacingMode === "luxury-editorial" && sections[idx - 1]?.composition?.spacingMode === "luxury-editorial") {
			comp.spacingMode = "airy"; // Tone down layout padding for a cleaner storytelling transition
		}

		// 2. Prevent consecutive massive glowing cards
		if (idx > 0 && comp.visualDepth === "frosted-glow" && sections[idx - 1]?.composition?.visualDepth === "frosted-glow") {
			comp.visualDepth = "layered-atmospheric"; // Restore design calm
		}

		// 3. Force breathing zone transition before contact
		if (idx === sections.length - 2) {
			comp.hierarchyWeight = "breathing";
			comp.spacingMode = "luxury-editorial";
		}

		return { ...sec, composition: comp };
	});
}

// ==========================================
// 6. MAIN RENDERER COMPILATION ENGINE
// ==========================================
export function buildPremiumPageContent(schema: any): string {
	const theme = schema.theme || {};
	const category = schema.brand?.category || "Premium Service";
	
	// Curate Visual Reference DNA & Moderation
	let rawDna = (theme.designDNA || getFallbackDNA(category)) as DesignDNA;
	const dna = applyRestraintModeration(rawDna);

	// Collect and Curate available Maps/Google Images
	const allImages = schema._validation?.photos || schema.photos || [];
	const curatedImages = curateImagePool(allImages);

	// Extract primary palette configurations
	const palette = theme.palette || {
		background: "#faf8f5",
		surface: "#ffffff",
		primary: "#1a1a1a",
		accent: "#c4952a",
		text: "#1a1208",
		muted: "#6b5c3e",
		outline: "rgba(0,0,0,0.08)",
	};

	let P = palette.primary || "#111827";
	let BG = palette.background || "#faf8f5";
	let SURF = palette.surface || "#ffffff";
	let TEXT = palette.text || "#111827";
	let MUTED = palette.muted || "#6b7280";
	let OUTLINE = palette.outline || "rgba(0,0,0,0.08)";
	let ACCENT = palette.accent || P;

	// Dynamic Category Visual Reference Overlay
	if (dna.visualAtmosphere === "cinematic-darkness") {
		BG = "#08090d";
		SURF = "#111218";
		TEXT = "#f3f4f6";
		MUTED = "#9ca3af";
		OUTLINE = "rgba(255,255,255,0.08)";
		P = "#ffffff";
		ACCENT = palette.accent || "#c4952a";
	} else if (dna.visualAtmosphere === "energetic-neon") {
		BG = "#0b0c10";
		SURF = "#14161f";
		TEXT = "#f9fafb";
		MUTED = "#9ca3af";
		OUTLINE = "rgba(255,255,255,0.1)";
		P = "#c084fc";
		ACCENT = "#a3e635";
	} else if (dna.visualAtmosphere === "soft-editorial-warmth") {
		BG = "#fbf8f3";
		SURF = "#ffffff";
		TEXT = "#292524";
		MUTED = "#78716c";
		OUTLINE = "rgba(0,0,0,0.05)";
		P = "#78350f";
		ACCENT = "#d97706";
	} else if (dna.visualAtmosphere === "luxury-glow") {
		BG = "#fafaf9";
		SURF = "#ffffff";
		TEXT = "#1c1917";
		MUTED = "#6c6a67";
		OUTLINE = "rgba(0,0,0,0.05)";
		P = "#1c1917";
		ACCENT = "#b45309"; // rich amber gold
	} else if (dna.visualAtmosphere === "architectural-minimalism") {
		BG = "#ffffff";
		SURF = "#fafafa";
		TEXT = "#000000";
		MUTED = "#666666";
		OUTLINE = "rgba(0,0,0,0.08)";
		P = "#000000";
		ACCENT = "#000000";
	}

	const radius = dna.brutalismScore > 60 ? "0px" : dna.luxuryScore > 60 ? "32px" : theme.radius || "20px";
	
	// Dynamic typography selection matching DNA Dominance
	let typography = theme.typography || { heading: "Cormorant Garamond", body: "Inter" };
	if (dna.typographyDominance === "brutalist-impact") {
		typography = { heading: "Syne", body: "Space Grotesk" };
	} else if (dna.typographyDominance === "dominant-serif" || dna.typographyDominance === "cinematic-oversized") {
		typography = { heading: "Cormorant Garamond", body: "Inter" };
	} else if (dna.typographyDominance === "restrained") {
		typography = { heading: "Playfair Display", body: "Inter" };
	}

	// 1. Spacing Systems Mutator
	let spaceXs = "8px", spaceSm = "16px", spaceMd = "32px", spaceLg = "64px", spaceXl = "100px", space2xl = "140px";
	if (dna.spacingPersonality === "airy") {
		spaceLg = "80px"; spaceXl = "115px"; space2xl = "180px";
	} else if (dna.spacingPersonality === "luxury-editorial") {
		spaceLg = "90px"; spaceXl = "135px"; space2xl = "210px";
	} else if (dna.spacingPersonality === "compressed" || dna.spacingPersonality === "brutalist-dense") {
		spaceLg = "40px"; spaceXl = "60px"; space2xl = "80px";
	}

	// 2. Shadows System Mutator
	let shadowSoft = "0 4px 30px rgba(0,0,0,0.02)";
	let shadowPremium = "0 20px 80px rgba(0,0,0,0.06)";
	let shadowIntense = "0 30px 100px rgba(0,0,0,0.12)";
	if (dna.brutalismScore > 60) {
		shadowSoft = `4px 4px 0px ${ACCENT}`;
		shadowPremium = `8px 8px 0px ${P}`;
		shadowIntense = `12px 12px 0px ${ACCENT}`;
	} else if (dna.luxuryScore > 60) {
		shadowSoft = "0 4px 40px rgba(0,0,0,0.015)";
		shadowPremium = "0 25px 85px rgba(0,0,0,0.04)";
		shadowIntense = "0 40px 110px rgba(0,0,0,0.07)";
	}

	// Typography Dominance Scale Cap
	let textHero = "clamp(3rem, 7vw, 5.8rem)";
	let textSection = "clamp(2rem, 4.8vw, 3.8rem)";
	if (dna.typographyDominance === "cinematic-oversized" || dna.hierarchyIntensity > 75) {
		textHero = "clamp(3.8rem, 10vw, 8rem)";
		textSection = "clamp(2.6rem, 7vw, 5rem)";
	} else if (dna.typographyDominance === "brutalist-impact") {
		textHero = "clamp(3.5rem, 9vw, 7.5rem)";
		textSection = "clamp(2.4rem, 6vw, 4.4rem)";
	}

	const businessName = schema.brand?.businessName || "Welcome";

	// Run Post-Layout Taste Refinement filter
	const rawSections = schema.sections || [];
	const sections = runPostLayoutTasteRefinement(rawSections, dna);

	// Setup Base CSS and Motion Variables inside Root
	const globalCss = `<!-- wp:html -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;700;900&family=Space+Grotesk:wght@300;500;700;800&family=Cormorant+Garamond:wght@300;400;600;700&family=Outfit:wght@300;500;700;900&family=Plus+Jakarta+Sans:wght@300;500;700;800&family=Syne:wght@400;700;800&family=Cormorant+Infant:ital,wght@1,400;1,600&display=swap');

:root {
  --bg: ${BG};
  --surface: ${SURF};
  --primary: ${P};
  --accent: ${ACCENT};
  --text: ${TEXT};
  --muted: ${MUTED};
  --outline: ${OUTLINE};
  
  /* Dynamic Curation Spacing Scale */
  --space-xs: ${spaceXs};
  --space-sm: ${spaceSm};
  --space-md: ${spaceMd};
  --space-lg: ${spaceLg};
  --space-xl: ${spaceXl};
  --space-2xl: ${space2xl};

  /* Fluid Typography Scale */
  --text-hero: ${textHero};
  --text-section: ${textSection};
  --text-body: clamp(1.02rem, 1.5vw, 1.25rem);

  /* Radius System */
  --radius-sm: ${dna.brutalismScore > 60 ? "0px" : "6px"};
  --radius-md: ${dna.brutalismScore > 60 ? "0px" : "14px"};
  --radius-lg: ${radius};
  --radius-full: ${dna.brutalismScore > 60 ? "0px" : "9999px"};

  /* Shadow Depth System */
  --shadow-soft: ${shadowSoft};
  --shadow-premium: ${shadowPremium};
  --shadow-intense: ${shadowIntense};

  /* DNA Animation Timings */
  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --reveal-duration: ${dna.motionEnergy > 70 ? "0.8s" : "1.2s"};
  --z-back: -1;
  --z-base: 1;
  --z-overlay: 10;
}

*,*::before,*::after{box-sizing:border-box!important}
html,body{margin:0!important;padding:0!important;background:var(--bg)!important;color:var(--text)!important;font-family:'${typography.body}',sans-serif!important;-webkit-font-smoothing:antialiased;scroll-behavior:smooth}
.site-header,.site-footer,.elementor-location-header,.elementor-location-footer,#masthead,#colophon,.entry-title,.wp-block-post-title,.page-title,.breadcrumbs,.posted-on,.byline,header.entry-header{display:none!important}
.site-content,.hentry,.entry-content,.wp-block-post-content,.wp-site-blocks,.is-layout-flow,.elementor,.page,.single{padding:0!important;margin:0!important;max-width:100%!important;width:100%!important;background:var(--bg)!important}

/* Atmospheric Noise Overlays matching DNA intensity */
.noise-overlay-bg {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='${dna.atmosphereIntensity > 70 ? "0.02" : "0.012"}'/%3E%3C/svg%3E");
}

.text-gradient {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Stagger hover states */
.hover-lift {
  transition: transform .4s var(--ease-expo), box-shadow .4s var(--ease-expo), border-color .4s ease!important;
}
.hover-lift:hover {
  transform: translateY(-5px) scale(1.008)!important;
  box-shadow: var(--shadow-premium)!important;
}

/* Scoped Scroll Reveal Styles */
.scroll-reveal {
  opacity: 0;
  will-change: transform, opacity;
}
.scroll-reveal.in-view {
  opacity: 1;
}

.premium-fade {
  transition: opacity var(--reveal-duration) var(--ease-expo);
}
.cinematic-reveal {
  transform: translateY(35px) scale(0.99);
  transition: opacity var(--reveal-duration) var(--ease-expo), transform var(--reveal-duration) var(--ease-expo);
}
.cinematic-reveal.in-view {
  transform: translateY(0) scale(1);
}
.stagger-lift {
  transform: translateY(22px);
  transition: opacity var(--reveal-duration) var(--ease-expo), transform var(--reveal-duration) var(--ease-expo);
}
.stagger-lift.in-view {
  transform: translateY(0);
}
.editorial-slide {
  transform: translateX(-30px);
  transition: opacity var(--reveal-duration) var(--ease-expo), transform var(--reveal-duration) var(--ease-expo);
}
.editorial-slide.in-view {
  transform: translateX(0);
}
.luxury-glow-reveal {
  box-shadow: 0 0 0px rgba(0,0,0,0);
  transition: opacity var(--reveal-duration) var(--ease-expo), box-shadow 1.5s var(--ease-expo);
}
.luxury-glow-reveal.in-view {
  box-shadow: 0 0 40px rgba(${hexToRgb(ACCENT)}, 0.08);
}

.delay-1 { transition-delay: 0.1s !important; }
.delay-2 { transition-delay: 0.2s !important; }
.delay-3 { transition-delay: 0.3s !important; }
.delay-4 { transition-delay: 0.4s !important; }

.section-shell {
  max-width: 1280px;
  margin: 0 auto;
  position: relative;
  z-index: var(--z-base);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  border: 1px solid var(--outline);
  border-radius: var(--radius-full);
  background: var(--surface);
  font-size: .74rem;
  font-weight: 800;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 20px;
}

.section-title {
  font-family: '${typography.heading}', serif;
  font-size: var(--text-section);
  line-height: 0.96;
  letter-spacing: ${dna.typographyDominance === "brutalist-impact" ? "-.04em" : "-.03em"};
  font-weight: 800;
  color: var(--text);
  margin: 0 0 16px;
}

.section-copy {
  font-size: var(--text-body);
  line-height: 1.72;
  color: var(--muted);
  margin: 0;
}

.wp-block-button__link, .wp-element-button {
  background: var(--primary)!important;
  color: ${dna.cinematicScore > 65 || dna.visualAtmosphere === "cinematic-darkness" ? "#000" : "#fff"}!important;
  border: ${dna.brutalismScore > 60 ? "2px solid #000" : "none"}!important;
  border-radius: var(--radius-md)!important;
  padding: 18px 38px!important;
  font-weight: 800!important;
  text-transform: ${dna.brutalismScore > 60 ? "uppercase" : "none"}!important;
  letter-spacing: ${dna.brutalismScore > 60 ? "0.06em" : "normal"}!important;
  text-decoration: none!important;
  display: inline-flex!important;
  align-items: center;
  justify-content: center;
  cursor: pointer!important;
  box-shadow: var(--shadow-soft)!important;
  transition: transform .28s var(--ease-expo), box-shadow .28s var(--ease-expo), background .28s ease!important;
}
.wp-block-button__link:hover {
  transform: translateY(-2px) scale(1.015)!important;
  box-shadow: var(--shadow-premium)!important;
}

.ambient-glow-glow {
  position: absolute;
  width: 450px;
  height: 450px;
  border-radius: var(--radius-full);
  background: radial-gradient(circle, rgba(${hexToRgb(ACCENT)}, ${dna.atmosphereIntensity > 70 ? "0.1" : "0.06"}) 0%, transparent 70%);
  pointer-events: none;
  z-index: var(--z-back);
}

@media (max-width: 960px) {
  .split-grid, .cta-split, .feature-bento, .gallery-editorial, .gallery-stack, .testimonial-grid, .contact-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
<!-- /wp:html -->\n\n`;

	const revealScript = `<!-- wp:html -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  const obs = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in-view");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.05 });
  document.querySelectorAll(".scroll-reveal").forEach(el => obs.observe(el));
});
</script>
<!-- /wp:html -->\n\n`;

	let html = globalCss + revealScript;

	// Loop and compile adaptive curated sections
	sections.forEach((section: any, index: number) => {
		const comp = (section.composition || {}) as any;

		const sectionType = comp.sectionType || (section.type === "hero" ? "cinematicHero" : section.type === "features" ? "asymmetricalFeatures" : section.type === "gallery" ? "immersiveGallery" : section.type === "testimonials" ? "floatingTestimonialWall" : section.type === "cta" ? "layeredCTA" : section.type === "faq" ? "accordionClean" : "premiumContactPanel");
		const layoutBehavior = comp.layoutBehavior || "asymmetrical";
		const visualDepth = comp.visualDepth || "layered-atmospheric";
		const motionStyle = comp.motionStyle || "staggerLift";
		const imageTreatment = comp.imageTreatment || "floatingDepth";
		const spacingMode = comp.spacingMode || "balanced";
		const hierarchyWeight = comp.hierarchyWeight || "supporting";
		
		const sectionBg = index % 2 === 0 ? BG : SURF;

		const componentContext = {
			typography, P, BG, SURF, TEXT, MUTED, OUTLINE, ACCENT, radius,
			palette, dna, spacingMode, layoutBehavior, visualDepth, motionStyle, imageTreatment,
			sectionBg, businessName, category, hierarchyWeight, brand: schema.brand || {}, index,
			curatedImages
		};

		// 4. DETECT ADAPTIVE COMPONENT TO RENDER
		switch (sectionType) {
			case "cinematicHero":
			case "editorialHero":
			case "splitNarrativeHero":
				html += renderAdaptiveHero(section, componentContext);
				break;
			case "asymmetricalFeatures":
			case "glassFeatureCards":
			case "processNarrative":
				html += renderAdaptiveFeatures(section, componentContext);
				break;
			case "immersiveGallery":
			case "floatingImageStack":
				html += renderAdaptiveGallery(section, componentContext);
				break;
			case "floatingTestimonialWall":
				html += renderAdaptiveTestimonials(section, componentContext);
				break;
			case "layeredCTA":
			case "atmosphericBand":
				html += renderAdaptiveCta(section, componentContext);
				break;
			case "storytellingTimeline":
			case "transformationShowcase":
			case "luxuryMetricsStrip":
				html += renderAdaptiveExtra(section, componentContext);
				break;
			case "premiumContactPanel":
			case "accordionClean":
			default:
				if (section.type === "faq" || sectionType === "accordionClean") {
					html += renderAdaptiveFaq(section, componentContext);
				} else if (section.type === "contact" || sectionType === "premiumContactPanel") {
					html += renderAdaptiveContact(section, componentContext);
				} else {
					html += renderAdaptiveHero(section, componentContext);
				}
				break;
		}
	});

	// Dynamic Footer
	html += `<!-- wp:html -->
<footer style="background:#090a0f;padding:var(--space-2xl) 5%;text-align:center;position:relative;" class="noise-overlay-bg">
  <div class="section-shell">
    <div class="eyebrow" style="background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12);color:#fff">Digital Experience</div>
    <h2 style="font-family:'${typography.heading}',serif;color:#fff;font-size:var(--text-section);letter-spacing:-.045em;margin:22px 0 12px;">${esc(
		businessName,
	)}</h2>
    <p style="color:rgba(255,255,255,.45);font-size:var(--text-body);margin:0;">Generative design system crafted with emergent visual orchestration.</p>
  </div>
</footer>
<!-- /wp:html -->`;

	return html;
}

// ==========================================
// 7. COMPONENT SUB-RENDERERS
// ==========================================

// A: ADAPTIVE HERO COMPONENT
function renderAdaptiveHero(section: any, ctx: any) {
	const curatedList = selectBestImages(ctx.curatedImages, 2, 45);
	const title = getSectionValue(section, ["headline", "title"], ctx.businessName);
	const sub = getSectionValue(section, ["subheadline", "body", "description"], "");
	const ctaPrimary = section.ctaPrimary || { label: "Get Started", href: "#contact" };
	const ctaSecondary = section.ctaSecondary || null;

	const spacing = getSpacingStyles(ctx);
	const motion = getMotionClasses(ctx.motionStyle);
	const imgTreatment = ctx.imageTreatment || "floatingDepth";

	// Image Quality Intelligence Censor: Typographic Dominance Mutation
	const isLowMedia = ctx.dna.imageWeight < 30 || curatedList.length === 0;
	if (isLowMedia) {
		return `<!-- wp:html -->
<section class="noise-overlay-bg" style="background:var(--bg);position:relative;overflow:hidden;${spacing}">
  <div class="ambient-glow-glow" style="top:10%;left:10%;"></div>
  <div class="section-shell ${motion} delay-1" style="max-width:1080px;text-align:left;">
    <div class="eyebrow">${esc(ctx.category)}</div>
    <h1 style="font-family:'${ctx.typography.heading}',serif;font-size:var(--text-hero);line-height:0.88;letter-spacing:-.05em;font-weight:900;color:var(--primary);margin:24px 0 28px;">
      ${esc(title)}
    </h1>
    <div style="display:grid;grid-template-columns:1.15fr .85fr;gap:40px;margin-top:var(--space-md);">
      <div>
        <p style="font-size:var(--text-body);line-height:1.75;color:var(--text);font-weight:400;margin-bottom:34px;">${esc(sub)}</p>
        <div style="display:flex;gap:14px;">
          ${buttonHtml(ctaPrimary.label, ctaPrimary.href)}
        </div>
      </div>
      <div style="border-left:2px solid var(--outline);padding-left:36px;display:flex;align-items:center;">
        <span style="font-family:'Cormorant Infant',serif;font-style:italic;font-size:1.85rem;color:var(--muted);line-height:1.44;">
          “Quiet design projects a confidence that visual noise can never reproduce.”
        </span>
      </div>
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
	}

	const imgHtml = getCinematicImageHtml(curatedList[0], imgTreatment, ctx, "width:100%;height:520px;");

	// 1. Cinematic Bleed Layout
	if (ctx.layoutBehavior === "split-grid" || ctx.dna.cinematicScore > 65) {
		return `<!-- wp:html -->
<section class="noise-overlay-bg" style="min-height:90vh;display:flex;align-items:center;background:var(--bg);position:relative;overflow:hidden;${spacing}">
  <div class="ambient-glow-glow" style="top:-60px;left:-60px;"></div>
  <div class="section-shell split-grid" style="display:grid;grid-template-columns:1.05fr .95fr;gap:var(--space-xl);align-items:center;width:100%;">
    <div class="${motion} delay-1">
      <div class="eyebrow">${esc(ctx.category)}</div>
      <h1 class="text-gradient" style="font-family:'${ctx.typography.heading}',serif;font-size:var(--text-hero);line-height:0.92;letter-spacing:-.04em;margin:24px 0 20px;font-weight:800;">${esc(title)}</h1>
      <p style="max-width:580px;font-size:var(--text-body);line-height:1.75;color:var(--muted);margin:0 0 var(--space-md);">${esc(sub)}</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        ${buttonHtml(ctaPrimary.label, ctaPrimary.href)}
        ${ctaSecondary ? buttonHtml(ctaSecondary.label, ctaSecondary.href, "background:transparent!important;color:var(--text)!important;border:1px solid var(--outline)!important;box-shadow:none!important;") : ""}
      </div>
    </div>
    <div class="${motion} delay-2" style="position:relative;display:flex;justify-content:center;">
      <div class="ambient-glow-glow" style="bottom:-50px;right:-50px;width:300px;height:300px;"></div>
      ${imgHtml}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
	}

	// 2. Editorial Layout
	return `<!-- wp:html -->
<section class="noise-overlay-bg" style="background:var(--bg);text-align:center;position:relative;overflow:hidden;${spacing}">
  <div class="ambient-glow-glow" style="top:25%;left:50%;transform:translate(-50%,-50%);width:550px;height:550px;opacity:0.6;"></div>
  <div class="section-shell ${motion} delay-1" style="max-width:1020px;">
    <div class="eyebrow">${esc(ctx.category)}</div>
    <h1 style="font-family:'${ctx.typography.heading}',serif;font-size:var(--text-hero);line-height:0.96;letter-spacing:-.045em;color:var(--text);margin:24px 0 22px;font-weight:800;">${esc(title)}</h1>
    <p style="font-size:var(--text-body);line-height:1.72;color:var(--muted);max-width:760px;margin:0 auto var(--space-md);">${esc(sub)}</p>
    <div style="display:flex;gap:14px;justify-content:center;margin-bottom:var(--space-lg);">
      ${buttonHtml(ctaPrimary.label, ctaPrimary.href)}
      ${ctaSecondary ? buttonHtml(ctaSecondary.label, ctaSecondary.href, "background:transparent!important;color:var(--text)!important;border:1px solid var(--outline)!important;box-shadow:none!important;") : ""}
    </div>
    <div class="${motion} delay-2" style="margin-top:var(--space-sm);position:relative;max-width:920px;margin-left:auto;margin-right:auto;">
      ${imgHtml}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

// B: ADAPTIVE FEATURES COMPONENT
function renderAdaptiveFeatures(section: any, ctx: any) {
	const items = getSectionItems(section);
	const title = getSectionValue(section, ["title", "headline"], "Specialties");
	const intro = getSectionValue(section, ["subheadline", "description"], "");

	const spacing = getSpacingStyles(ctx);
	const motion = getMotionClasses(ctx.motionStyle);
	const depth = getDepthStyles(ctx.visualDepth, ctx);

	// 1. Process Timeline Layout
	if (ctx.layoutBehavior === "grid-stagger" || ctx.dna.brutalismScore > 60) {
		return `<!-- wp:html -->
<section style="background:var(--bg);${spacing}" class="noise-overlay-bg">
  <div class="section-shell">
    <div style="margin-bottom:var(--space-lg); border-bottom: 1px solid var(--outline); padding-bottom: 24px;">
      <div class="eyebrow">The Process</div>
      <h2 class="section-title">${esc(title)}</h2>
      ${intro ? `<p class="section-copy" style="max-width:640px;">${esc(intro)}</p>` : ""}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:var(--space-md);">
      ${items.map((item: any, idx: number) => `
        <article class="${motion} ${idx % 2 === 0 ? 'delay-1' : 'delay-2'}" style="${depth} padding:var(--space-md); border-radius:var(--radius-lg); position:relative;">
          <div style="font-family:'${ctx.typography.heading}',serif;font-size:2.8rem;color:var(--accent);opacity:0.35;margin-bottom:var(--space-sm); font-weight:800;">${String(idx + 1).padStart(2, "0")}</div>
          <h3 style="font-family:'${ctx.typography.heading}',serif;font-size:1.72rem;color:var(--text);margin:0 0 12px;letter-spacing:-.03em;font-weight:700;">${esc(item.title || item.name)}</h3>
          <p style="color:var(--muted);line-height:1.72;font-size:1rem;margin:0;">${esc(item.description || item.body)}</p>
        </article>
      `).join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
	}

	// 2. Default Asymmetrical Grid Layout
	return `<!-- wp:html -->
<section style="background:var(--bg);${spacing}" class="noise-overlay-bg">
  <div class="section-shell">
    <div style="display:flex;justify-content:space-between;align-items:end;gap:var(--space-md);flex-wrap:wrap;margin-bottom:var(--space-lg);">
      <div>
        <div class="eyebrow">Services</div>
        <h2 class="section-title">${esc(title)}</h2>
      </div>
      ${intro ? `<p class="section-copy" style="max-width:580px;">${esc(intro)}</p>` : ""}
    </div>
    <div class="feature-bento" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-md);">
      ${items.map((item: any, idx: number) => {
		const span = idx === 0 || idx === 3 ? "span 2" : "span 1";
		// Restricted offset boundaries
		const offset = ctx.dna.asymmetryLevel > 50 && idx % 2 === 0 ? "transform: translateY(-10px);" : "";
		return `
        <article class="${motion} hover-lift" style="grid-column:${span};${depth} ${offset} padding:40px;border-radius:var(--radius-lg);min-height:280px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="font-family:'${ctx.typography.heading}',serif;font-size:1.8rem;color:var(--primary);opacity:0.3;margin-bottom:16px;font-weight:800;">${String(idx + 1).padStart(2, "0")}</div>
            <h3 style="font-family:'${ctx.typography.heading}',serif;font-size:1.75rem;color:var(--text);margin:0 0 10px;letter-spacing:-.03em;font-weight:800;">${esc(item.title || item.name)}</h3>
          </div>
          <p style="color:var(--muted);line-height:1.72;font-size:0.98rem;margin:0;">${esc(item.description || item.body)}</p>
        </article>
      `;
	}).join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

// C: ADAPTIVE GALLERY COMPONENT
function renderAdaptiveGallery(section: any, ctx: any) {
	const curatedList = selectBestImages(ctx.curatedImages, 4, 45);
	const title = getSectionValue(section, ["title", "headline"], "Showcase");
	const intro = getSectionValue(section, ["subheadline", "description"], "Visual perspectives of our craft and service execution.");

	const spacing = getSpacingStyles(ctx);
	const motion = getMotionClasses(ctx.motionStyle);
	const imgTreatment = ctx.imageTreatment || "floatingDepth";

	// Image Curation Censor: Typographic Collage Mutation
	const isLowMedia = ctx.dna.imageWeight < 30 || curatedList.length === 0;
	if (isLowMedia) {
		return `<!-- wp:html -->
<section style="background:var(--bg);${spacing}" class="noise-overlay-bg">
  <div class="ambient-glow-glow" style="top:20%;right:10%;"></div>
  <div class="section-shell ${motion} delay-1" style="max-width:1080px;text-align:center;">
    <div class="eyebrow">Philosophies</div>
    <h2 class="section-title" style="font-size:clamp(2.4rem,6.5vw,5rem);line-height:0.95;margin-bottom:34px;font-weight:800;">
      Crafting details with <span class="text-gradient">high-precision</span> local care.
    </h2>
    <p style="max-width:680px;margin:0 auto var(--space-lg);font-size:1.2rem;color:var(--muted);line-height:1.72;">
      ${esc(intro)}
    </p>
  </div>
</section>
<!-- /wp:html -->\n\n`;
	}

	// 1. Double Stack Layout
	if (ctx.layoutBehavior === "offset-right" || ctx.dna.cinematicScore > 65) {
		const img1 = getCinematicImageHtml(curatedList[0], imgTreatment, ctx, "width:100%;height:460px;");
		const img2 = curatedList[1] ? getCinematicImageHtml(curatedList[1], imgTreatment, ctx, "width:100%;height:220px;") : "";
		const img3 = curatedList[2] ? getCinematicImageHtml(curatedList[2], imgTreatment, ctx, "width:100%;height:220px;") : "";

		return `<!-- wp:html -->
<section style="background:var(--bg);${spacing};overflow:hidden;" class="noise-overlay-bg">
  <div class="section-shell">
    <div style="margin-bottom:var(--space-md);max-width:700px;">
      <div class="eyebrow">Gallery Portfolio</div>
      <h2 class="section-title">${esc(title)}</h2>
      <p class="section-copy">${esc(intro)}</p>
    </div>
    <div class="gallery-stack" style="display:grid;grid-template-columns:1.15fr .85fr;gap:var(--space-md);align-items:center;">
      <div class="${motion} delay-1">
        ${img1}
      </div>
      <div style="display:grid;grid-template-columns:1fr;gap:20px;" class="${motion} delay-2">
        ${img2}
        ${img3}
      </div>
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
	}

	// 2. Default Asymmetrical Mosaic
	return `<!-- wp:html -->
<section style="background:var(--bg);${spacing}" class="noise-overlay-bg">
  <div class="section-shell">
    <div style="display:flex;justify-content:space-between;align-items:end;gap:var(--space-md);flex-wrap:wrap;margin-bottom:var(--space-lg);">
      <div>
        <div class="eyebrow">Works</div>
        <h2 class="section-title">${esc(title)}</h2>
      </div>
      <p class="section-copy" style="max-width:540px;">${esc(intro)}</p>
    </div>
    <div class="gallery-editorial" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
      ${curatedList.map((item: any, idx: number) => {
		const offset = ctx.dna.asymmetryLevel > 60 && idx % 2 === 0 ? "margin-top: -15px;" : "";
		const imgH = getCinematicImageHtml(item, imgTreatment, ctx, "width:100%;height:320px;");
		return `
        <div class="${motion} ${idx === 0 ? 'delay-1' : idx === 1 ? 'delay-2' : 'delay-3'}" style="${offset} overflow:hidden;">
          ${imgH}
        </div>
      `;
	}).join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

// D: ADAPTIVE TESTIMONIALS COMPONENT
function renderAdaptiveTestimonials(section: any, ctx: any) {
	const items = getSectionItems(section);
	const title = getSectionValue(section, ["title", "headline"], "Endorsements");

	const spacing = getSpacingStyles(ctx);
	const motion = getMotionClasses(ctx.motionStyle);
	const depth = getDepthStyles(ctx.visualDepth, ctx);

	return `<!-- wp:html -->
<section style="background:var(--bg);${spacing}" class="noise-overlay-bg">
  <div class="section-shell">
    <div style="text-align:center;margin-bottom:var(--space-lg);">
      <div class="eyebrow">Endorsements</div>
      <h2 class="section-title">${esc(title)}</h2>
    </div>
    <div class="testimonial-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:var(--space-md);">
      ${items.map((item: any, idx: number) => {
		// Restricted offset boundaries
		const offset = ctx.dna.asymmetryLevel > 50 && idx % 3 === 1 ? "transform: translateY(-10px);" : "";
		return `
        <article class="${motion} ${idx % 3 === 0 ? 'delay-1' : idx % 3 === 1 ? 'delay-2' : 'delay-3'} hover-lift" style="${depth} ${offset} padding:36px;border-radius:var(--radius-lg);position:relative;">
          <div style="font-family:'${ctx.typography.heading}',serif;font-size:3.2rem;color:var(--accent);opacity:0.22;line-height:0.7;margin-bottom:6px;">“</div>
          <p style="font-size:1.04rem;line-height:1.72;color:var(--text);margin:0 0 22px;font-style:italic;">${esc(item.quote || "")}</p>
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:40px;height:40px;border-radius:var(--radius-full);background:var(--primary);color:${ctx.dna.cinematicScore > 65 || ctx.visualAtmosphere === "cinematic-darkness" ? "#000" : "#fff"};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;">${esc((item.author || "C").charAt(0))}</div>
            <div>
              <div style="font-weight:800;color:var(--text);font-size:0.95rem;">${esc(item.author || "Client")}</div>
              <div style="font-size:0.74rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">${esc(item.role || "Verified Customer")}</div>
            </div>
          </div>
        </article>
      `;
	}).join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

// E: ADAPTIVE FAQ COMPONENT
function renderAdaptiveFaq(section: any, ctx: any) {
	const items = getSectionItems(section);
	const title = getSectionValue(section, ["title", "headline"], "Support FAQs");

	const spacing = getSpacingStyles(ctx);
	const motion = getMotionClasses(ctx.motionStyle);
	const depth = getDepthStyles(ctx.visualDepth, ctx);

	return `<!-- wp:html -->
<section style="background:var(--bg);${spacing}" class="noise-overlay-bg">
  <div class="section-shell" style="max-width:900px;">
    <div style="text-align:center;margin-bottom:var(--space-lg);">
      <div class="eyebrow">FAQs</div>
      <h2 class="section-title">${esc(title)}</h2>
    </div>
    <div style="display:grid;gap:16px;">
      ${items.map((item: any, idx: number) => `
        <details class="${motion} ${idx % 2 === 0 ? 'delay-1' : 'delay-2'}" style="${depth} padding:22px 28px;border-radius:var(--radius-md);cursor:pointer;">
          <summary style="font-weight:800;font-size:1.06rem;color:var(--text);outline:none;list-style:none;display:flex;justify-content:space-between;align-items:center;">
            <span>${esc(item.question || item.title)}</span>
            <span style="font-size:1.2rem;color:var(--accent);font-weight:800;">+</span>
          </summary>
          <p style="margin:14px 0 0;line-height:1.72;color:var(--muted);font-size:0.98rem;cursor:default;">${esc(item.answer || item.description)}</p>
        </details>
      `).join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

// F: ADAPTIVE CTA COMPONENT
function renderAdaptiveCta(section: any, ctx: any) {
	const title = getSectionValue(section, ["title", "headline"], "Let's Get Started");
	const body = getSectionValue(section, ["body", "description"], "Contact us today for a premium custom consulting consultation.");
	const label = getSectionValue(section, ["buttonLabel"], "Connect Now");
	const href = getSectionValue(section, ["buttonHref"], "#contact");

	const spacing = getSpacingStyles(ctx);
	const motion = getMotionClasses(ctx.motionStyle);

	return `<!-- wp:html -->
<section style="background:linear-gradient(135deg, var(--primary), var(--accent));position:relative;overflow:hidden;${spacing}">
  <div class="ambient-glow-glow" style="top:-90px;right:-90px;width:350px;height:350px;opacity:0.35;"></div>
  <div class="section-shell ${motion} delay-1" style="text-align:center;max-width:850px;z-index:2;">
    <div class="eyebrow" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.18);">Connect</div>
    <h2 style="font-family:'${ctx.typography.heading}',serif;font-size:var(--text-section);color:#fff;line-height:1.04;letter-spacing:-.04em;margin:22px 0 16px;font-weight:900;">${esc(title)}</h2>
    <p style="color:rgba(255,255,255,0.8);font-size:1.1rem;line-height:1.72;margin:0 auto var(--space-md);max-width:640px;">${esc(body)}</p>
    ${buttonHtml(label, href, `background:#fff!important;color:var(--primary)!important;box-shadow:none!important;border-radius:var(--radius-md)!important;`)}
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

// G: ADAPTIVE CONTACT COMPONENT
function renderAdaptiveContact(section: any, ctx: any) {
	const title = getSectionValue(section, ["title", "headline"], "Get in Touch");
	const body = getSectionValue(section, ["body", "description"], "We would love to hear from you. Send us a message.");

	const spacing = getSpacingStyles(ctx);
	const motion = getMotionClasses(ctx.motionStyle);
	const depth = getDepthStyles(ctx.visualDepth, ctx);

	const brand = ctx.brand;
	const contactItems = [
		brand.phone ? `<div style="margin-bottom:20px;"><div style="font-size:0.72rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:4px;">Phone</div><div style="font-size:1.1rem;color:var(--text);font-weight:600;">${esc(brand.phone)}</div></div>` : "",
		brand.email && brand.email.includes("@") && !/^none|n\/a$/i.test(brand.email) ? `<div style="margin-bottom:20px;"><div style="font-size:0.72rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:4px;">Email</div><div style="font-size:1.1rem;color:var(--text);font-weight:600;">${esc(brand.email)}</div></div>` : "",
		brand.address ? `<div style="margin-bottom:20px;"><div style="font-size:0.72rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:4px;">Address</div><div style="font-size:1.02rem;line-height:1.6;color:var(--text);font-weight:500;">${esc(brand.address)}</div></div>` : ""
	].filter(Boolean).join("");

	return `<!-- wp:html -->
<section id="contact" style="background:var(--bg);${spacing}" class="noise-overlay-bg">
  <div class="section-shell contact-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-xl);align-items:center;">
    <div class="${motion} delay-1">
      <div class="eyebrow">Reach Out</div>
      <h2 class="section-title">${esc(title)}</h2>
      <p class="section-copy" style="margin-bottom:34px;">${esc(body)}</p>
      <div style="display:grid;">${contactItems}</div>
    </div>
    <div class="${motion} delay-2 hover-lift" style="${depth} padding:40px;border-radius:var(--radius-lg);">
      <h3 style="font-family:'${ctx.typography.heading}',serif;font-size:1.8rem;color:var(--text);margin:0 0 20px;font-weight:700;">Submit Inquiry</h3>
      <div style="display:grid;gap:14px;">
        <div style="height:48px;border-radius:var(--radius-sm);background:rgba(0,0,0,0.015);border:1px solid var(--outline);"></div>
        <div style="height:48px;border-radius:var(--radius-sm);background:rgba(0,0,0,0.015);border:1px solid var(--outline);"></div>
        <div style="height:110px;border-radius:var(--radius-sm);background:rgba(0,0,0,0.015);border:1px solid var(--outline);"></div>
        ${buttonHtml("Send Inquiry", "#")}
      </div>
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

// H: ADAPTIVE EXTRA / STORYTELLING & METRICS
function renderAdaptiveExtra(section: any, ctx: any) {
	const items = getSectionItems(section);
	const title = getSectionValue(section, ["title", "headline"], "Performance");

	const spacing = getSpacingStyles(ctx);
	const motion = getMotionClasses(ctx.motionStyle);
	const depth = getDepthStyles(ctx.visualDepth, ctx);

	// 1. luxuryMetricsStrip Layout
	if (ctx.layoutBehavior === "side-by-side" || ctx.dna.luxuryScore > 60) {
		return `<!-- wp:html -->
<section style="background:var(--bg);${spacing}" class="noise-overlay-bg">
  <div class="section-shell">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:var(--space-md);text-align:center;">
      ${items.map((item: any, idx: number) => `
        <div class="${motion} ${idx % 3 === 0 ? 'delay-1' : idx % 3 === 1 ? 'delay-2' : 'delay-3'}" style="${depth} padding:36px;border-radius:var(--radius-lg);">
          <div style="font-family:'${ctx.typography.heading}',serif;font-size:3.5rem;color:var(--accent);font-weight:800;margin-bottom:8px;">${esc(item.title || "100%")}</div>
          <div style="font-size:0.88rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--text);font-weight:700;">${esc(item.description || item.name || "")}</div>
        </div>
      `).join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
	}

	// 2. storytellingTimeline Layout
	return `<!-- wp:html -->
<section style="background:var(--bg);${spacing}" class="noise-overlay-bg">
  <div class="section-shell" style="max-width:900px;">
    <div style="text-align:center;margin-bottom:var(--space-lg);">
      <div class="eyebrow">Milestones</div>
      <h2 class="section-title">${esc(title)}</h2>
    </div>
    <div style="position:relative;padding-left:40px;border-left:1px solid var(--outline);">
      ${items.map((item: any, idx: number) => `
        <div class="${motion} delay-1" style="position:relative;margin-bottom:var(--space-lg);">
          <div style="position:absolute;left:-49px;top:4px;width:16px;height:16px;border-radius:var(--radius-full);background:var(--accent);border:3px solid var(--bg);"></div>
          <h3 style="font-family:'${ctx.typography.heading}',serif;font-size:1.6rem;color:var(--text);margin:0 0 6px;font-weight:700;">${esc(item.title)}</h3>
          <p style="color:var(--muted);line-height:1.7;font-size:0.98rem;margin:0;">${esc(item.description || item.body)}</p>
        </div>
      `).join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

// ==========================================
// 8. VISUAL PRESETS & STYLING ENGINE
// ==========================================

function getSpacingStyles(ctx: any) {
	let bottomPadding = "var(--space-lg)";
	if (ctx.hierarchyWeight === "breathing") {
		bottomPadding = "var(--space-2xl)";
	} else if (ctx.hierarchyWeight === "cinematicPause") {
		return "padding: var(--space-2xl) 5% var(--space-2xl); gap: var(--space-xl);";
	}

	switch (ctx.spacingMode) {
		case "luxury-editorial":
			return `padding: var(--space-2xl) 5% ${bottomPadding}; gap: var(--space-xl);`;
		case "airy":
			return `padding: var(--space-xl) 5% ${bottomPadding}; gap: var(--space-lg);`;
		case "compact":
			return "padding: var(--space-md) 4%; gap: var(--space-sm);";
		case "balanced":
		default:
			return `padding: var(--space-lg) 5% ${bottomPadding}; gap: var(--space-md);`;
	}
}

function getMotionClasses(motionStyle: string) {
	switch (motionStyle) {
		case "cinematicReveal":
			return "scroll-reveal cinematic-reveal";
		case "staggerLift":
			return "scroll-reveal stagger-lift";
		case "editorialSlide":
			return "scroll-reveal editorial-slide";
		case "luxuryGlow":
			return "scroll-reveal luxury-glow-reveal";
		case "premiumFade":
		default:
			return "scroll-reveal premium-fade";
	}
}

function getDepthStyles(visualDepth: string, ctx: any) {
	const rgbBg = hexToRgb(ctx.BG);
	const rgbText = hexToRgb(ctx.TEXT);
	
	switch (visualDepth) {
		case "glassmorphic":
			return `background: rgba(${rgbBg}, 0.74) !important; backdrop-filter: blur(20px) !important; border: 1px solid rgba(${rgbText}, 0.06) !important; box-shadow: var(--shadow-premium) !important;`;
		case "frosted-glow":
			return `background: rgba(${rgbBg}, 0.62) !important; backdrop-filter: blur(15px) !important; border: 1px solid rgba(${rgbText}, 0.04) !important; box-shadow: var(--shadow-intense) !important;`;
		case "dramatic-depth":
			return `background: ${ctx.SURF} !important; border: 2px solid ${ctx.P} !important; box-shadow: var(--shadow-premium) !important;`;
		case "flat-minimalist":
			return `background: transparent !important; border: none !important; box-shadow: none !important; border-bottom: 1px solid ${ctx.OUTLINE} !important;`;
		case "layered-atmospheric":
		default:
			return `background: ${ctx.SURF} !important; border: 1px solid ${ctx.OUTLINE} !important; box-shadow: var(--shadow-soft) !important;`;
	}
}

function getImageTreatmentStyles(treatment: string, ctx: any) {
	let container = "";
	let image = "";

	switch (treatment) {
		case "editorialCrop":
			// Arched Crop masking
			container = `border-radius: 200px 200px 0 0 !important; clip-path: ellipse(50% 50% at 50% 50%);`;
			break;
		case "layeredGlass":
			container = `border: 6px solid ${ctx.SURF} !important; box-shadow: var(--shadow-premium), 0 0 0 1px rgba(0,0,0,0.03) !important; transform: rotate(1deg);`;
			break;
		case "cinematicBleed":
			container = `border-radius: 0px !important; width: 100% !important;`;
			break;
		case "atmosphericOverlay":
			container = `box-shadow: var(--shadow-premium) !important; border-radius: var(--radius-md) !important;`;
			break;
		case "luxuryFrame":
			container = `border: 1px solid ${ctx.OUTLINE} !important; padding: var(--space-xs) !important; background: ${ctx.SURF} !important; box-shadow: var(--shadow-soft) !important;`;
			break;
		case "brutalistSharp":
			container = `border: 2px solid var(--primary) !important; border-radius: 0px !important; box-shadow: var(--shadow-premium) !important;`;
			break;
		case "floatingDepth":
		default:
			container = `box-shadow: var(--shadow-premium) !important; border-radius: var(--radius-md) !important; transform: translateY(-4px);`;
			break;
	}

	return { container, image };
}

function buttonHtml(label: string, href: string, style = "") {
	return `<a class="wp-block-button__link wp-element-button hover-lift" href="${esc(
		href || "#contact",
	)}" style="${style}">${esc(label)}</a>`;
}
