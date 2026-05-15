/** @format */

import {
	HeroLayout,
	FeaturesLayout,
	GalleryLayout,
	TestimonialsLayout,
	CtaLayout,
	FaqLayout,
	ContactLayout,
	SpacingToken,
	RadiusToken,
	ShadowToken,
	SurfaceToken,
	AnimationToken,
} from "./lib/layout-registry";

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	repairs?: string[];
	repairedSchema?: WebsiteSchema;
}

export interface Business {
	id: string;
	name: string;
	category: string;
	address: string;
	rating?: number;
	reviewCount?: number;
	location: google.maps.LatLngLiteral;
	websiteUri?: string;
	email?: string;
	phoneNumber?: string;
	photos?: string[];
	imageSuggestions?: string[];
	logo?: string;
	isOpen?: boolean;
}

export type WebsiteSectionType =
	| "hero"
	| "features"
	| "gallery"
	| "testimonials"
	| "contact"
	| "cta"
	| "faq";

export interface BrandDNA {
	personality:
		| "trustworthy"
		| "luxurious"
		| "energetic"
		| "minimalist"
		| "friendly"
		| "corporate"
		| "premium"
		| "playful";
	visualMood: "warm-editorial" | "polished-clinical" | "modern-authority" | "vibrant-energy";
	ctaEnergy: "urgent" | "inviting" | "formal" | "casual";
	spacingDensity: SpacingToken;
	imageStyle: "cinematic" | "natural" | "bright-clean" | "moody-luxury";
	typographyMood: "elegant" | "corporate" | "energetic" | "editorial" | "minimal";
	iconStyle: "outline" | "filled" | "minimal" | "playful";
}

export interface WebsiteTheme {
	name: string;
	brandDNA: BrandDNA;
	palette: {
		background: string;
		surface: string;
		primary: string;
		accent: string;
		text: string;
		muted: string;
		outline: string;
	};
	typography: {
		heading: string;
		body: string;
		headingFont: string;
		bodyFont: string;
	};
	tokens: {
		radius: RadiusToken;
		shadow: ShadowToken;
		surface: SurfaceToken;
		animation: AnimationToken;
	};
}

export interface WebsiteBrand {
	businessName: string;
	category: string;
	address: string;
	phone?: string;
	email?: string;
	websiteUri?: string;
	logo?: string;
}

export interface WebsiteSEO {
	title: string;
	description: string;
	keywords: string[];
}

export interface ImageIntent {
	type: string;
	subject: string;
	style: string;
	alt: string;
	fallbackUrl?: string;
}

export interface HeroSection {
	id: string;
	type: "hero";
	layout: HeroLayout;
	headline: string;
	subheadline: string;
	ctaPrimary: {
		label: string;
		href: string;
	};
	ctaSecondary?: {
		label: string;
		href: string;
	};
	badges?: string[];
	imageIntent: ImageIntent;
	confidence?: number;
}

export interface FeatureSection {
	id: string;
	type: "features";
	layout: FeaturesLayout;
	title: string;
	items: Array<{
		title: string;
		description: string;
		icon?: string;
	}>;
	confidence?: number;
}

export interface GallerySection {
	id: string;
	type: "gallery";
	layout: GalleryLayout;
	title: string;
	items: Array<{
		imageIntent: ImageIntent;
	}>;
	confidence?: number;
}

export interface TestimonialSection {
	id: string;
	type: "testimonials";
	layout: TestimonialsLayout;
	title: string;
	items: Array<{
		quote: string;
		author: string;
		role?: string;
	}>;
	confidence?: number;
}

export interface ContactSection {
	id: string;
	type: "contact";
	layout: ContactLayout;
	title: string;
	showMap?: boolean;
	showHours?: boolean;
	showEmail?: boolean;
	showPhone?: boolean;
	hours?: string[];
	confidence?: number;
}

export interface CtaSection {
	id: string;
	type: "cta";
	layout: CtaLayout;
	title: string;
	body: string;
	buttonLabel: string;
	buttonHref: string;
	confidence?: number;
}

export interface FaqSection {
	id: string;
	type: "faq";
	layout: FaqLayout;
	title: string;
	items: Array<{
		question: string;
		answer: string;
	}>;
	confidence?: number;
}

export type WebsiteSection =
	| HeroSection
	| FeatureSection
	| GallerySection
	| TestimonialSection
	| ContactSection
	| CtaSection
	| FaqSection;

export interface WebsiteSchema {
	schemaVersion: "1.0";
	meta: {
		siteId: string;
		businessId: string;
		slug: string;
		version: number;
		target: "static" | "wordpress";
	};
	theme: WebsiteTheme;
	brand: WebsiteBrand;
	seo: WebsiteSEO;
	sections: WebsiteSection[];
	_validation?: {
		repairs: string[];
		validatedAt: string;
	};
}

export interface WebsiteArtifact {
	schema: WebsiteSchema;
	html: string;
	css: string;
	js: string;
}

export interface Deployment {
	businessId: string;
	url: string;
	timestamp: string;
	websiteContent: {
		html: string;
		css: string;
		js: string;
	};
}

export type ProvisioningStatus =
	| "pending"
	| "creating_subdomain"
	| "creating_database"
	| "installing_wordpress"
	| "configuring_wordpress"
	| "deploying_content"
	| "validating"
	| "completed"
	| "failed"
	| "ready" // Legacy
	| "dry-run";

export type ProvisioningStepStatus =
	| "pending"
	| "in_progress"
	| "completed"
	| "failed"
	| "dry-run";

export interface ProvisioningLogEntry {
	timestamp: string;
	step:
		| "subsite_creation"
		| "admin_creation"
		| "theme_activation"
		| "media_import"
		| "page_creation"
		| "homepage_assignment"
		| "credentials_setup";
	level: "info" | "warn" | "error";
	message: string;
}

export interface WordPressProvisioningSite {
	siteId: number | string;
	siteSlug: string;
	siteUrl: string;
	adminUrl: string;
	ownerUsername: string;
	ownerEmail: string;
	ownerPassword?: string;
	passwordSetupUrl?: string;
}

export interface WordPressProvisioningState {
	wordpressSiteType?: "multisite";
	provisioningStatus?: ProvisioningStatus;
	wordpressSite?: WordPressProvisioningSite;
	wordpressSiteId?: number | string;
	wordpressSiteSlug?: string;
	wordpressSiteUrl?: string;
	wordpressAdminUrl?: string;
	wordpressOwnerUsername?: string;
	wordpressOwnerEmail?: string;
	wordpressPasswordSetupUrl?: string;
	subsiteCreationStatus?: ProvisioningStepStatus;
	adminCreationStatus?: ProvisioningStepStatus;
	themeInstallStatus?: ProvisioningStepStatus;
	mediaImportStatus?: ProvisioningStepStatus;
	contentImportStatus?: ProvisioningStepStatus;
	homepageSetupStatus?: ProvisioningStepStatus;
	credentialsStatus?: ProvisioningStepStatus;
	lastProvisionedAt?: string;
	provisioningLogs?: ProvisioningLogEntry[];
	wordpressPassword?: string;
	provisioningError?: string;
}

export interface WebsiteProject extends WordPressProvisioningState {
	id: string;
	businessId: string;
	businessName: string;
	businessCategory?: string;
	businessAddress: string;
	rating?: number;
	reviewCount?: number;
	email?: string;
	phoneNumber?: string;
	websiteContent: string;
	websiteSchema?: WebsiteSchema;
	wordpressBlocks?: string;
	outreachStatus?: OutreachStatus;
	outreachSentAt?: string;
	emailSent?: boolean;
}

export type OutreachStatus = "Pending" | "Sent" | "Replied";
