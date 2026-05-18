/** @format */

export const HERO_LAYOUTS = [
	"immersive-split",
	"minimal-centered",
	"editorial-left",
	"stacked-media",
	"luxury-overlap",
	"split-modern-dark",
	"centered-glass"
] as const;

export const FEATURES_LAYOUTS = [
	"bento-grid",
	"alternating-stack",
	"icon-list",
	"feature-cards",
	"editorial-rows",
	"masonry-grid"
] as const;

export const GALLERY_LAYOUTS = [
	"masonry-cinematic",
	"asymmetrical-overlap",
	"standard-grid",
	"collage-editorial",
] as const;

export const TESTIMONIALS_LAYOUTS = [
	"floating-cards",
	"editorial-quotes",
	"timeline-scroll",
	"split-highlight",
] as const;

export const CTA_LAYOUTS = [
	"centered-premium",
	"side-by-side-split",
	"immersive-banner",
	"minimal-inline",
] as const;

export const FAQ_LAYOUTS = ["accordion-clean", "split-columns"] as const;

export const CONTACT_LAYOUTS = ["split-card", "minimal-centered"] as const;

export type HeroLayout = (typeof HERO_LAYOUTS)[number] | string;
export type FeaturesLayout = (typeof FEATURES_LAYOUTS)[number] | string;
export type GalleryLayout = (typeof GALLERY_LAYOUTS)[number] | string;
export type TestimonialsLayout = (typeof TESTIMONIALS_LAYOUTS)[number] | string;
export type CtaLayout = (typeof CTA_LAYOUTS)[number] | string;
export type FaqLayout = (typeof FAQ_LAYOUTS)[number] | string;
export type ContactLayout = (typeof CONTACT_LAYOUTS)[number] | string;

export const DESIGN_TOKENS = {
	spacing: ["compact", "balanced", "airy"] as const,
	radius: ["sharp", "soft", "oversized"] as const,
	shadows: ["none", "soft", "premium", "intense"] as const,
	surface: ["glass", "solid", "outline"] as const,
	animations: ["none", "subtle", "dynamic"] as const,
} as const;

export type SpacingToken = (typeof DESIGN_TOKENS.spacing)[number];
export type RadiusToken = (typeof DESIGN_TOKENS.radius)[number];
export type ShadowToken = (typeof DESIGN_TOKENS.shadows)[number];
export type SurfaceToken = (typeof DESIGN_TOKENS.surface)[number];
export type AnimationToken = (typeof DESIGN_TOKENS.animations)[number];
