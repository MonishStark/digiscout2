/** @format */

import {
	Business,
	CtaSection,
	FaqSection,
	FeatureSection,
	GallerySection,
	HeroSection,
	TestimonialSection,
	WebsiteArtifact,
	WebsiteSchema,
	WebsiteSection,
} from "../types";

const escapeHtml = (value: string) =>
	(value || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");

const safeHref = (href?: string) =>
	href && href.trim() ? href.trim() : "#contact";

const safeLabel = (label?: string, fallback = "Learn More") =>
	label && label.trim() ? label.trim() : fallback;

const fallbackImageForCategory = (category: string) => {
	const normalized = (category || "").toLowerCase();
	if (normalized.includes("restaurant") || normalized.includes("cafe")) {
		return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80";
	}
	if (normalized.includes("gym") || normalized.includes("fitness")) {
		return "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=80";
	}
	if (normalized.includes("salon") || normalized.includes("spa")) {
		return "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1800&q=80";
	}
	return "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80";
};

const defaultTheme = (schema?: WebsiteSchema["theme"]) => ({
	name: schema?.name || "Noir Luxe",
	style: schema?.style || "premium glass editorial",
	radius: schema?.radius || "28px",
	layout: schema?.layout || "editorial",
	buttonStyle: schema?.buttonStyle || "pill",
	surfaceStyle: schema?.surfaceStyle || "glass",
	mediaShape: schema?.mediaShape || "rounded",
	density: schema?.density || "balanced",
	accentMode: schema?.accentMode || "neon",
	palette: {
		background: schema?.palette?.background || "#07070a",
		surface: schema?.palette?.surface || "#111114",
		primary: schema?.palette?.primary || "#7c3aed",
		accent: schema?.palette?.accent || "#10b981",
		text: schema?.palette?.text || "#f4f4f5",
		muted: schema?.palette?.muted || "#a1a1aa",
		outline: schema?.palette?.outline || "rgba(255,255,255,0.10)",
	},
	typography: {
		heading: schema?.typography?.heading || "Inter",
		body: schema?.typography?.body || "Inter",
	},
});

const getThemeClassName = (theme?: WebsiteSchema["theme"]) =>
	[
		`theme-${theme?.layout || "editorial"}`,
		`accent-${theme?.accentMode || "neon"}`,
		`surface-${theme?.surfaceStyle || "glass"}`,
		`density-${theme?.density || "balanced"}`,
		`buttons-${theme?.buttonStyle || "pill"}`,
	].join(" ");

type SiteVoice = {
	nav: Array<{ href: string; label: string }>;
	headerCta: string;
	servicesTitle: string;
	galleryTitle: string;
	testimonialsTitle: string;
	faqTitle: string;
	contactTitle: string;
	ctaTitle: string;
	introLine: string;
	aboutTitle: string;
	sectionNumberLabel: string;
};

function getSiteVoice(schema: WebsiteSchema): SiteVoice {
	const category = (schema.brand.category || "").toLowerCase();
	const businessName = schema.brand.businessName || "The Brand";

	if (
		category.includes("restaurant") ||
		category.includes("cafe") ||
		category.includes("bakery")
	) {
		return {
			nav: [
				{ href: "#services", label: "Menu" },
				{ href: "#gallery", label: "Atmosphere" },
				{ href: "#testimonials", label: "Reviews" },
				{ href: "#faq", label: "Info" },
				{ href: "#contact", label: "Visit" },
			],
			headerCta: "Reserve",
			servicesTitle: "Signature Dishes & Experiences",
			galleryTitle: "Dining Room & Detail",
			testimonialsTitle: "Guest Impressions",
			faqTitle: "Dining Questions",
			contactTitle: `Visit ${businessName}`,
			ctaTitle: "Reserve Your Table",
			introLine: `${businessName} pairs atmosphere, hospitality, and memorable food into one polished dining experience.`,
			aboutTitle: `The Story Behind ${businessName}`,
			sectionNumberLabel: "Course",
		};
	}

	if (
		category.includes("salon") ||
		category.includes("spa") ||
		category.includes("wellness")
	) {
		return {
			nav: [
				{ href: "#services", label: "Rituals" },
				{ href: "#gallery", label: "Spaces" },
				{ href: "#testimonials", label: "Results" },
				{ href: "#faq", label: "Care" },
				{ href: "#contact", label: "Book" },
			],
			headerCta: "Book Now",
			servicesTitle: "Signature Rituals",
			galleryTitle: "Studio Atmosphere",
			testimonialsTitle: "Client Notes",
			faqTitle: "Treatment Questions",
			contactTitle: `Book ${businessName}`,
			ctaTitle: "Schedule Your Appointment",
			introLine: `${businessName} creates a calm, elevated experience built around intention, detail, and confidence.`,
			aboutTitle: `About ${businessName}`,
			sectionNumberLabel: "Step",
		};
	}

	if (
		category.includes("gym") ||
		category.includes("fitness") ||
		category.includes("training")
	) {
		return {
			nav: [
				{ href: "#services", label: "Programs" },
				{ href: "#gallery", label: "Training" },
				{ href: "#testimonials", label: "Results" },
				{ href: "#faq", label: "Plan" },
				{ href: "#contact", label: "Join" },
			],
			headerCta: "Join Now",
			servicesTitle: "Training Programs",
			galleryTitle: "Progress & Environment",
			testimonialsTitle: "Member Wins",
			faqTitle: "Training Questions",
			contactTitle: `Start Training at ${businessName}`,
			ctaTitle: "Start Your Program",
			introLine: `${businessName} is built for momentum, accountability, and measurable change.`,
			aboutTitle: `About ${businessName}`,
			sectionNumberLabel: "Phase",
		};
	}

	if (
		category.includes("law") ||
		category.includes("finance") ||
		category.includes("consult") ||
		category.includes("agency")
	) {
		return {
			nav: [
				{ href: "#services", label: "Expertise" },
				{ href: "#gallery", label: "Casework" },
				{ href: "#testimonials", label: "Clients" },
				{ href: "#faq", label: "Questions" },
				{ href: "#contact", label: "Discuss" },
			],
			headerCta: "Discuss",
			servicesTitle: "Core Expertise",
			galleryTitle: "Selected Work",
			testimonialsTitle: "Client Feedback",
			faqTitle: "Common Questions",
			contactTitle: `Contact ${businessName}`,
			ctaTitle: "Request a Consultation",
			introLine: `${businessName} presents a measured, high-trust brand experience designed for serious decision makers.`,
			aboutTitle: `Our Approach`,
			sectionNumberLabel: "Tier",
		};
	}

	return {
		nav: [
			{ href: "#services", label: "Services" },
			{ href: "#gallery", label: "Gallery" },
			{ href: "#testimonials", label: "Reviews" },
			{ href: "#faq", label: "FAQ" },
			{ href: "#contact", label: "Contact" },
		],
		headerCta: "Start Project",
		servicesTitle: "Capabilities Built For Growth",
		galleryTitle: "Signature Spaces And Moments",
		testimonialsTitle: "Trusted By Real Customers",
		faqTitle: "Questions, Answered Clearly",
		contactTitle: `Let's Build Your Next Version`,
		ctaTitle: "Ready To Elevate Your Brand?",
		introLine: `${businessName} deserves a polished digital presence that feels current, deliberate, and credible.`,
		aboutTitle: `About ${businessName}`,
		sectionNumberLabel: "Part",
	};
}

function getSection<T extends WebsiteSection["type"]>(
	schema: WebsiteSchema,
	type: T,
) {
	return schema.sections.find((section) => section.type === type) as
		| Extract<WebsiteSection, { type: T }>
		| undefined;
}

function renderHeader(schema: WebsiteSchema) {
	const voice = getSiteVoice(schema);
	const logo = schema.brand.logo;

	return `
<header class="site-header">
  <a class="brandmark" href="#top">
    ${
			logo
				? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(schema.brand.businessName)}" class="site-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
				: ""
		}
    <div class="logo-fallback" style="${logo ? "display: none;" : "display: flex;"}">
      <span class="brand-dot"></span>
      <span>${escapeHtml(schema.brand.businessName)}</span>
    </div>
  </a>
  <nav class="top-nav">
    ${voice.nav.map((link) => `<a href="${link.href}">${escapeHtml(link.label)}</a>`).join("")}
  </nav>
  <a class="button button-secondary header-cta" href="#contact">${escapeHtml(voice.headerCta)}</a>
</header>`;
}

function renderHero(section: HeroSection, schema: WebsiteSchema) {
	const layout = ((section as any).layout || section.variant || "split")
		.toString()
		.toLowerCase();
	const image =
		section.media?.src || fallbackImageForCategory(schema.brand.category);
	const voice = getSiteVoice(schema);
	const stats = [
		schema.brand.category,
		schema.theme.name,
		schema.theme.style,
	].filter(Boolean);
	const headline = section.headline || schema.brand.businessName || "Welcome";
	const subheadline =
		section.subheadline &&
		!/premium|designed to convert|first impression|conversion-ready/i.test(
			section.subheadline,
		)
			? section.subheadline
			: voice.introLine;
	const heroCopy = subheadline || voice.introLine;
	const primaryCta = {
		label: safeLabel(section.ctaPrimary?.label, "Learn More"),
		href: safeHref(section.ctaPrimary?.href),
	};
	const secondaryCta = section.ctaSecondary
		? {
				label: safeLabel(section.ctaSecondary.label, "Learn More"),
				href: safeHref(section.ctaSecondary.href),
			}
		: undefined;
	const badgePills = section.badges?.length
		? `<div class="pill-row">${section.badges.map((badge) => `<span class="pill">${escapeHtml(badge)}</span>`).join("")}</div>`
		: "";

	if (layout === "hero-immersive") {
		return `
<section class="site-section hero hero-immersive hero-layout-immersive" id="top" data-layout="hero-immersive">
  <div class="hero-media immersive-media">
    <img src="${escapeHtml(image)}" alt="${escapeHtml(section.media?.alt || schema.brand.businessName)}" />
    <div class="hero-overlay"></div>
  </div>
  <div class="hero-copy hero-copy-overlay">
    <div class="eyebrow">${escapeHtml(schema.brand.category)}</div>
    <h1>${escapeHtml(headline)}</h1>
    <p>${escapeHtml(heroCopy)}</p>
    <div class="cta-row">
      <a class="button button-primary" href="${escapeHtml(primaryCta.href)}">${escapeHtml(primaryCta.label)}</a>
      ${secondaryCta ? `<a class="button button-secondary" href="${escapeHtml(secondaryCta.href)}">${escapeHtml(secondaryCta.label)}</a>` : ""}
    </div>
  </div>
</section>`;
	}

	if (layout === "hero-centered") {
		return `
<section class="site-section hero hero-layout-centered" id="top" data-layout="hero-centered">
  <div class="hero-copy hero-copy-centered">
    <div class="eyebrow">${escapeHtml(schema.brand.category)}</div>
    <h1>${escapeHtml(headline)}</h1>
    <p>${escapeHtml(heroCopy)}</p>
    ${badgePills}
    <div class="cta-row cta-row-centered">
      <a class="button button-primary" href="${escapeHtml(primaryCta.href)}">${escapeHtml(primaryCta.label)}</a>
      ${secondaryCta ? `<a class="button button-secondary" href="${escapeHtml(secondaryCta.href)}">${escapeHtml(secondaryCta.label)}</a>` : ""}
    </div>
  </div>
  <div class="hero-media hero-media-centered">
    <img src="${escapeHtml(image)}" alt="${escapeHtml(section.media?.alt || schema.brand.businessName)}" />
  </div>
</section>`;
	}

	if (layout === "hero-split") {
		return `
<section class="site-section hero hero-layout-editorial" id="top" data-layout="hero-split">
  <div class="hero-copy hero-copy-editorial">
    <div class="eyebrow">${escapeHtml(schema.brand.category)}</div>
    <h1>${escapeHtml(headline)}</h1>
    <p>${escapeHtml(heroCopy)}</p>
    ${badgePills}
    <div class="cta-row">
      <a class="button button-primary" href="${escapeHtml(primaryCta.href)}">${escapeHtml(primaryCta.label)}</a>
      ${secondaryCta ? `<a class="button button-secondary" href="${escapeHtml(secondaryCta.href)}">${escapeHtml(secondaryCta.label)}</a>` : ""}
    </div>
  </div>
  <aside class="hero-sidecar">
    <div class="hero-stats hero-stats-sidecar">
      ${stats.map((stat) => `<span>${escapeHtml(stat)}</span>`).join("")}
    </div>
    <div class="hero-media hero-media-sidecar">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(section.media?.alt || schema.brand.businessName)}" />
    </div>
  </aside>
</section>`;
	}

	return `
<section class="site-section hero hero-${layout}" id="top" data-layout="${escapeHtml(layout)}">
  <div class="hero-copy">
    ${
			section.media?.logo
				? `<img src="${escapeHtml(section.media.logo)}" alt="Logo" class="hero-logo-stamp" />`
				: ""
		}
    <div class="eyebrow">${escapeHtml(schema.brand.category)}</div>
    <h1>${escapeHtml(headline)}</h1>
    <p>${escapeHtml(heroCopy)}</p>
    ${badgePills}
    <div class="cta-row">
      <a class="button button-primary" href="${escapeHtml(primaryCta.href)}">${escapeHtml(primaryCta.label)}</a>
      ${secondaryCta ? `<a class="button button-secondary" href="${escapeHtml(secondaryCta.href)}">${escapeHtml(secondaryCta.label)}</a>` : ""}
    </div>
    <div class="hero-stats">
      ${stats.map((stat) => `<span>${escapeHtml(stat)}</span>`).join("")}
    </div>
  </div>
  <div class="hero-media">
    <img src="${escapeHtml(image)}" alt="${escapeHtml(section.media?.alt || schema.brand.businessName)}" />
  </div>
</section>`;
}

function renderFeatures(schema: WebsiteSchema, section: FeatureSection) {
	const layout = ((section as any).layout || "cards").toString().toLowerCase();
	const voice = getSiteVoice(schema);
	const sectionTitle =
		(
			section as FeatureSection & {
				title?: string;
				content?: { title?: string };
			}
		).title ||
		(section as FeatureSection & { content?: { title?: string } }).content
			?.title ||
		voice.servicesTitle;
	if (layout === "list" || layout === "editorial-stack") {
		return `
<section class="site-section features features-layout-list" id="services" data-layout="${escapeHtml(layout)}">
  <div class="section-heading">
    <div class="eyebrow">Services</div>
    <h2>${escapeHtml(sectionTitle)}</h2>
  </div>
  <div class="feature-stack">
    ${(section.items || [])
			.map(
				(item, index) => `
    <article class="feature-card feature-card-stack">
      <span class="feature-index">${String(index + 1).padStart(2, "0")}</span>
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
      </div>
    </article>`,
			)
			.join("")}
  </div>
</section>`;
	}
	if (layout === "feature-grid") {
		const leadItem = (section.items || [])[0];
		return `
<section class="site-section features features-layout-bento" id="services" data-layout="feature-grid">
  <div class="section-heading">
    <div class="eyebrow">Services</div>
    <h2>${escapeHtml(sectionTitle)}</h2>
  </div>
  <div class="feature-grid feature-grid-bento">
    ${
			leadItem
				? `
    <article class="feature-card feature-card-lead">
      <span class="feature-index">01</span>
      <h3>${escapeHtml(leadItem.title)}</h3>
      <p>${escapeHtml(leadItem.description)}</p>
    </article>`
				: ""
		}
    ${(section.items || [])
			.slice(leadItem ? 1 : 0)
			.map(
				(item, index) => `
    <article class="feature-card feature-card-support">
      <span class="feature-index">${String(index + (leadItem ? 2 : 1)).padStart(2, "0")}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>`,
			)
			.join("")}
  </div>
</section>`;
	}
	const leadItem = layout === "bento" ? (section.items || [])[0] : null;
	return `
<section class="site-section features features-layout-${layout}" id="services" data-layout="${escapeHtml(layout)}">
  <div class="section-heading">
    <div class="eyebrow">Services</div>
    <h2>${escapeHtml(sectionTitle)}</h2>
  </div>
  <div class="feature-grid feature-grid-${layout}">
    ${
			leadItem
				? `
    <article class="feature-card feature-card-lead">
      <span class="feature-index">01</span>
      <h3>${escapeHtml(leadItem.title)}</h3>
      <p>${escapeHtml(leadItem.description)}</p>
    </article>`
				: ""
		}
    ${(section.items || [])
			.slice(leadItem ? 1 : 0)
			.map(
				(item, index) => `
    <article class="feature-card feature-card-support">
      <span class="feature-index">${String(index + (leadItem ? 2 : 1)).padStart(2, "0")}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>`,
			)
			.join("")}
  </div>
</section>`;
}

function renderGallery(schema: WebsiteSchema, section: GallerySection) {
	const layout = ((section as any).layout || "asymmetrical")
		.toString()
		.toLowerCase();
	const voice = getSiteVoice(schema);
	const sectionTitle =
		(
			section as GallerySection & {
				title?: string;
				content?: { title?: string };
			}
		).title ||
		(section as GallerySection & { content?: { title?: string } }).content
			?.title ||
		voice.galleryTitle;
	if (layout === "gallery-masonry") {
		return `
<section class="site-section gallery gallery-layout-masonry" id="gallery" data-layout="gallery-masonry">
  <div class="section-heading">
    <div class="eyebrow">Gallery</div>
    <h2>${escapeHtml(sectionTitle)}</h2>
  </div>
  <div class="gallery-grid gallery-grid-masonry">
    ${(section.items || section.media || [])
			.map(
				(item, index) => `
    <figure class="gallery-item gallery-item-masonry gallery-item-${(index % 4) + 1}">
      <img src="${escapeHtml(item.src || item.url)}" alt="${escapeHtml(item.alt)}" />
    </figure>`,
			)
			.join("")}
  </div>
</section>`;
	}
	if (layout === "overlapping-panels") {
		return `
<section class="site-section gallery gallery-layout-overlap" id="gallery" data-layout="overlapping-panels">
  <div class="section-heading">
    <div class="eyebrow">Gallery</div>
    <h2>${escapeHtml(sectionTitle)}</h2>
  </div>
  <div class="gallery-overlap">
    ${(section.items || [])
			.map(
				(item, index) => `
    <figure class="gallery-overlap__item gallery-overlap__item--${index + 1}">
      <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" />
    </figure>`,
			)
			.join("")}
  </div>
</section>`;
	}
	return `
<section class="site-section gallery gallery-layout-${layout}" id="gallery" data-layout="${escapeHtml(layout)}">
  <div class="section-heading">
    <div class="eyebrow">Gallery</div>
    <h2>${escapeHtml(sectionTitle)}</h2>
  </div>
  <div class="gallery-grid">
    ${(section.items || [])
			.map(
				(item, index) => `
    <figure class="gallery-item gallery-item-${(index % 4) + 1}">
      <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" />
    </figure>`,
			)
			.join("")}
  </div>
</section>`;
}

function renderTestimonials(
	schema: WebsiteSchema,
	section: TestimonialSection,
) {
	const layout = ((section as any).layout || "floating-cards")
		.toString()
		.toLowerCase();
	const voice = getSiteVoice(schema);
	const sectionTitle =
		(
			section as TestimonialSection & {
				title?: string;
				content?: { title?: string };
			}
		).title ||
		(section as TestimonialSection & { content?: { title?: string } }).content
			?.title ||
		voice.testimonialsTitle;
	if (layout === "testimonial-carousel") {
		return `
<section class="site-section testimonials testimonials-layout-carousel" id="testimonials" data-layout="testimonial-carousel">
  <div class="section-heading">
    <div class="eyebrow">Testimonials</div>
    <h2>${escapeHtml(sectionTitle)}</h2>
  </div>
  <div class="testimonial-carousel">
    ${(section.items || [])
			.map(
				(item) => `
    <blockquote class="testimonial-card testimonial-card-carousel">
      <p>"${escapeHtml(item.quote)}"</p>
      <footer>
        <strong>${escapeHtml(item.author || item.name)}</strong>
        ${item.role ? `<span>${escapeHtml(item.role)}</span>` : ""}
      </footer>
    </blockquote>`,
			)
			.join("")}
  </div>
</section>`;
	}
	return `
<section class="site-section testimonials testimonials-layout-${layout}" id="testimonials" data-layout="${escapeHtml(layout)}">
  <div class="section-heading">
    <div class="eyebrow">Testimonials</div>
    <h2>${escapeHtml(sectionTitle)}</h2>
  </div>
  <div class="testimonial-grid">
    ${(section.items || [])
			.map(
				(item) => `
    <blockquote class="testimonial-card">
      <p>"${escapeHtml(item.quote)}"</p>
      <footer>
        <strong>${escapeHtml(item.author || item.name)}</strong>
        ${item.role ? `<span>${escapeHtml(item.role)}</span>` : ""}
      </footer>
    </blockquote>`,
			)
			.join("")}
  </div>
</section>`;
}

function renderCta(schema: WebsiteSchema, section: CtaSection) {
	const voice = getSiteVoice(schema);
	const layout = ((section as any).layout || "centered")
		.toString()
		.toLowerCase();
	if (layout === "cta-split") {
		return `
<section class="site-section final-cta final-cta-layout-split" data-layout="cta-split">
  <div class="final-cta-card final-cta-card-split">
    <div class="final-cta-text">
      <h2>${escapeHtml(section.title || voice.ctaTitle)}</h2>
      <p>${escapeHtml(section.body)}</p>
    </div>
    <div class="final-cta-visual">
      <a class="button button-primary" href="${escapeHtml(section.buttonHref)}">${escapeHtml(section.buttonLabel)}</a>
    </div>
  </div>
</section>`;
	}
	return `
<section class="site-section final-cta final-cta-layout-${layout}" data-layout="${escapeHtml(layout)}">
  <div class="final-cta-card">
    <h2>${escapeHtml(section.title || voice.ctaTitle)}</h2>
    <p>${escapeHtml(section.body)}</p>
    <a class="button button-primary" href="${escapeHtml(section.buttonHref)}">${escapeHtml(section.buttonLabel)}</a>
  </div>
</section>`;
}

function renderFaq(schema: WebsiteSchema, section: FaqSection) {
	const voice = getSiteVoice(schema);
	const layout = ((section as any).layout || "accordion")
		.toString()
		.toLowerCase();
	const sectionTitle =
		(section as FaqSection & { title?: string; content?: { title?: string } })
			.title ||
		(section as FaqSection & { content?: { title?: string } }).content?.title ||
		voice.faqTitle;
	if (layout === "faq-accordion") {
		return `
<section class="site-section faq faq-layout-accordion" id="faq" data-layout="faq-accordion">
  <div class="section-heading">
    <div class="eyebrow">FAQ</div>
    <h2>${escapeHtml(sectionTitle)}</h2>
  </div>
  <div class="faq-accordion">
    ${(section.items || [])
			.map(
				(item) => `
    <details class="faq-item faq-item-accordion">
      <summary>${escapeHtml(item.question)}</summary>
      <p>${escapeHtml(item.answer)}</p>
    </details>`,
			)
			.join("")}
  </div>
</section>`;
	}
	return `
<section class="site-section faq faq-layout-${layout}" id="faq" data-layout="${escapeHtml(layout)}">
  <div class="section-heading">
    <div class="eyebrow">FAQ</div>
    <h2>${escapeHtml(sectionTitle)}</h2>
  </div>
  <div class="faq-list">
    ${(section.items || [])
			.map(
				(item) => `
    <details class="faq-item">
      <summary>${escapeHtml(item.question)}</summary>
      <p>${escapeHtml(item.answer)}</p>
    </details>`,
			)
			.join("")}
  </div>
</section>`;
}

function renderContact(schema: WebsiteSchema) {
	const voice = getSiteVoice(schema);
	const layout = "contact-form"; // since it's always contact
	const emailLabel = schema.brand.category.toLowerCase().includes("restaurant")
		? "Reserve A Table"
		: schema.brand.category.toLowerCase().includes("gym")
			? "Book A Tour"
			: schema.brand.category.toLowerCase().includes("salon") ||
				  schema.brand.category.toLowerCase().includes("spa")
				? "Book An Appointment"
				: "Book A Consultation";
	if (layout === "contact-form") {
		return `
<section class="site-section contact contact-layout-form" id="contact" data-layout="contact-form">
  <div class="section-heading">
    <div class="eyebrow">Contact</div>
    <h2>${escapeHtml(voice.contactTitle)}</h2>
  </div>
  <div class="contact-form-grid">
    <article class="contact-details">
      <h3>${escapeHtml(schema.brand.businessName)}</h3>
      <p>${escapeHtml(schema.brand.address || "")}</p>
      <p><strong>Phone:</strong> ${escapeHtml(schema.brand.phone || "")}</p>
      <p><strong>Email:</strong> ${escapeHtml(schema.brand.email || "")}</p>
      <a class="button button-primary" href="mailto:${escapeHtml(schema.brand.email || "")}">${escapeHtml(emailLabel)}</a>
    </article>
    <article class="contact-form-card">
      <form class="contact-form">
        <label>Name <input type="text" required /></label>
        <label>Email <input type="email" required /></label>
        <label>Message <textarea required></textarea></label>
        <button type="submit" class="button button-primary">Send Message</button>
      </form>
    </article>
  </div>
</section>`;
	}
	return `
<section class="site-section contact contact-layout-${layout}" id="contact" data-layout="${escapeHtml(layout)}">
  <div class="section-heading">
    <div class="eyebrow">Contact</div>
    <h2>${escapeHtml(voice.contactTitle)}</h2>
  </div>
  <div class="contact-grid">
    <article class="contact-card">
      <h3>${escapeHtml(schema.brand.businessName)}</h3>
      <p>${escapeHtml(schema.brand.address || "")}</p>
      ${schema.brand.phone ? `<p><strong>Phone:</strong> ${escapeHtml(schema.brand.phone)}</p>` : ""}
      ${schema.brand.email ? `<p><strong>Email:</strong> ${escapeHtml(schema.brand.email)}</p>` : ""}
      ${schema.brand.email ? `<a class="button button-primary" href="mailto:${escapeHtml(schema.brand.email)}">${escapeHtml(emailLabel)}</a>` : ""}
    </article>
    <article class="contact-card map-card">
      <div class="map-placeholder">${escapeHtml(schema.brand.address || "")}</div>
    </article>
  </div>
</section>`;
}

function renderSection(section: WebsiteSection, schema: WebsiteSchema) {
	switch (section.type) {
		case "hero":
			return renderHero(section, schema);
		case "features":
			return renderFeatures(schema, section);
		case "gallery":
			return renderGallery(schema, section);
		case "testimonials":
			return renderTestimonials(schema, section);
		case "contact":
			return renderContact(schema);
		case "cta":
			return renderCta(schema, section);
		case "faq":
			return renderFaq(schema, section);
		default:
			// Generic rendering for unknown / future section types
			const title =
				(section as any).title ||
				(section as any).heading ||
				(section as any).label ||
				section.type;
			const items = (section as any).items || (section as any).content || [];
			return `
<section class="site-section section-${escapeHtml(section.type)}">
  <div class="section-heading">
    <div class="eyebrow">${escapeHtml(section.type)}</div>
    <h2>${escapeHtml(title)}</h2>
  </div>
  <div class="generic-list">
    ${Array.isArray(items) ? items.map((it: any) => `<div class="generic-item">${escapeHtml(it.title || it.name || it)}${it.description ? `<p>${escapeHtml(it.description)}</p>` : ""}</div>`).join("") : ""}
  </div>
</section>`;
	}
}

function renderPageBody(schema: WebsiteSchema) {
	// Preserve Gemini-provided ordering. Only fall back to a fixed order when schema.sections is empty.
	const sectionsFromSchema =
		Array.isArray(schema.sections) && schema.sections.length
			? schema.sections
			: null;

	const fallbackHero = {
		id: "hero-fallback",
		type: "hero",
		variant: "centered",
		headline: schema.brand.businessName || "Welcome",
		subheadline: `Discover what ${schema.brand.businessName || "your business"} can offer online.`,
		ctaPrimary: { label: "Contact Us", href: "#contact" },
	} as HeroSection;

	let sectionsToRender: WebsiteSection[] = [];
	if (sectionsFromSchema) {
		sectionsToRender = sectionsFromSchema.slice();
		// ensure there is at least one hero at the beginning
		if (!sectionsToRender.find((s) => s.type === "hero")) {
			sectionsToRender.unshift(fallbackHero as unknown as WebsiteSection);
		}
		// ensure contact exists at end
		if (!sectionsToRender.find((s) => s.type === "contact")) {
			sectionsToRender.push({ type: "contact" } as WebsiteSection);
		}
	} else {
		// preserve previous fixed ordering as fallback
		const hero = getSection(schema, "hero") || fallbackHero;
		const features = getSection(schema, "features");
		const gallery = getSection(schema, "gallery");
		const testimonials = getSection(schema, "testimonials");
		const cta = getSection(schema, "cta");
		const faq = getSection(schema, "faq");

		sectionsToRender = [
			hero,
			features,
			gallery,
			testimonials,
			cta,
			faq,
			{ type: "contact" } as WebsiteSection,
		].filter(Boolean) as WebsiteSection[];
	}

	return sectionsToRender
		.map((section) => renderSection(section, schema))
		.filter(Boolean)
		.join("\n");
}

function renderFooter(schema: WebsiteSchema) {
	const logo = schema.brand.logo;
	const currentYear = new Date().getFullYear();
	
	return `
<footer class="site-footer">
  <div class="footer-grid">
    <div class="footer-brand">
      <a class="brandmark" href="#top">
        ${
					logo
						? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(schema.brand.businessName)}" class="site-logo" />`
						: ""
				}
        <div class="logo-fallback" style="${logo ? "display: none;" : "display: flex;"}">
          <span class="brand-dot"></span>
          <span>${escapeHtml(schema.brand.businessName)}</span>
        </div>
      </a>
      <p>${escapeHtml(schema.brand.businessName)} — Digital Presence</p>
    </div>
    <div class="footer-contact">
      <h4>Contact</h4>
      <p>${escapeHtml(schema.brand.address)}</p>
      <p>${escapeHtml(schema.brand.phone)}</p>
      <p>${escapeHtml(schema.brand.email)}</p>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; ${currentYear} ${escapeHtml(schema.brand.businessName)}. All rights reserved.</p>
  </div>
</footer>`;
}

const buildCss = (schema: WebsiteSchema) => {
	const theme = defaultTheme(schema.theme);
	const voice = getSiteVoice(schema);
	const shellWidth =
		theme.density === "compact"
			? "1320px"
			: theme.density === "airy"
				? "1180px"
				: "1240px";
	const bodyGrid =
		theme.accentMode === "earthy"
			? "radial-gradient(circle at 20% 15%, rgba(245,158,11,.22), transparent 32%), radial-gradient(circle at 90% 75%, rgba(217,119,6,.14), transparent 28%)"
			: theme.accentMode === "luxury"
				? "radial-gradient(circle at 16% 14%, rgba(196,133,250,.22), transparent 30%), radial-gradient(circle at 86% 72%, rgba(255,120,188,.12), transparent 30%)"
				: theme.accentMode === "fresh"
					? "radial-gradient(circle at 18% 12%, rgba(37,99,235,.18), transparent 32%), radial-gradient(circle at 88% 70%, rgba(15,118,110,.14), transparent 28%)"
					: "radial-gradient(circle at 18% 12%, rgba(124,58,237,.18), transparent 32%), radial-gradient(circle at 88% 70%, rgba(16,185,129,.14), transparent 28%)";
	const cardFill =
		theme.surfaceStyle === "solid"
			? "var(--surface)"
			: theme.surfaceStyle === "outline"
				? "transparent"
				: "color-mix(in srgb, var(--surface) 70%, transparent)";
	const sectionSpacingTop =
		theme.density === "compact"
			? "56px"
			: theme.density === "airy"
				? "120px"
				: "88px";
	const sectionSpacingBottom =
		theme.density === "compact"
			? "56px"
			: theme.density === "airy"
				? "120px"
				: "88px";

	return `
:root {
  --bg: ${theme.palette.background};
  --surface: ${theme.palette.surface};
  --primary: ${theme.palette.primary};
  --accent: ${theme.palette.accent};
  --text: ${theme.palette.text};
  --muted: ${theme.palette.muted};
  --outline: ${theme.palette.outline};
  --radius: ${theme.radius};
  --heading-font: ${theme.typography.heading}, ui-serif, Georgia, serif;
  --body-font: ${theme.typography.body}, Inter, ui-sans-serif, system-ui;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--body-font);
  color: var(--text);
  background: ${bodyGrid}, var(--bg);
  line-height: 1.65;
  letter-spacing: .006em;
  min-height: 100vh;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(to right, color-mix(in srgb, var(--outline) 20%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--outline) 20%, transparent) 1px, transparent 1px);
  background-size: 52px 52px;
  opacity: .08;
}
a { color: inherit; text-decoration: none; }
img { display: block; width: 100%; max-width: 100%; }
.site-shell {
  width: min(${shellWidth}, calc(100% - 40px));
  margin: 0 auto;
  padding: 28px 0 128px;
  position: relative;
  z-index: 1;
}
.site-header {
  position: sticky;
  top: 14px;
  z-index: 40;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
  padding: 16px 22px;
  border-radius: 20px;
  border: 1px solid var(--outline);
  background: color-mix(in srgb, var(--surface) 62%, transparent);
  backdrop-filter: blur(18px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, .08);
  transition: all .3s cubic-bezier(.4, 0, .2, 1);
}
.site-header:hover {
  background: color-mix(in srgb, var(--surface) 72%, transparent);
  box-shadow: 0 12px 48px rgba(0, 0, 0, .12);
}
.brandmark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  letter-spacing: -.008em;
  font-size: 1.02rem;
  transition: transform .2s ease;
}
.brandmark:hover { transform: translateX(2px); }
.site-logo {
  max-height: 38px;
  width: auto;
  object-fit: contain;
  transition: transform .3s ease;
}
.brandmark:hover .site-logo { transform: scale(1.05); }
.logo-fallback {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--primary) 22%, transparent);
  transition: transform .3s ease;
}
.brandmark:hover .brand-dot { transform: scale(1.15); }
.top-nav {
  display: flex;
  justify-content: center;
  gap: 28px;
  flex-wrap: wrap;
}
.top-nav a {
  color: var(--muted);
  font-size: .92rem;
  font-weight: 500;
  letter-spacing: .01em;
  transition: color .2s ease, transform .2s ease;
  position: relative;
}
.top-nav a::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent);
  transition: width .3s ease;
}
.top-nav a:hover::after { width: 100%; }
.top-nav a:hover { color: var(--text); transform: translateY(-1px); }
.site-section {
  margin-top: ${sectionSpacingTop};
  margin-bottom: ${sectionSpacingBottom};
  animation: fadeInUp .7s ease-out backwards;
}
.site-section:nth-child(even) { background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 4%, transparent) 0%, color-mix(in srgb, var(--primary) 3%, transparent) 100%); padding: ${theme.density === "airy" ? "72px" : "48px"} 0; margin-left: -40px; margin-right: -40px; padding-left: 40px; padding-right: 40px; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
.section-heading { margin-bottom: clamp(28px, 3vw, 48px); }
.section-heading h2 { max-width: 16ch; font-size: clamp(2rem, 4.2vw, 3.4rem); font-weight: 700; line-height: 1.1; letter-spacing: -.02em; }
.eyebrow {
  text-transform: uppercase;
  letter-spacing: .28em;
  font-weight: 700;
  font-size: .68rem;
  color: color-mix(in srgb, var(--accent) 78%, var(--text));
  margin-bottom: 14px;
  display: block;
}
.section-heading h2,
.hero h1,
.final-cta-card h2 {
  font-family: var(--heading-font);
  letter-spacing: -.025em;
  line-height: 1.08;
  margin: 0;
}
.hero {
  display: grid;
  gap: clamp(40px, 6vw, 64px);
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  align-items: center;
  padding: clamp(20px, 3vw, 48px) 0;
}
.hero h1 { font-size: clamp(3.2rem, 9vw, 6.4rem); margin-bottom: 24px; font-weight: 800; line-height: 1.08; }
.hero p { font-size: clamp(1.08rem, 2.2vw, 1.55rem); color: var(--muted); max-width: 62ch; margin: 0 0 28px; line-height: 1.55; }
.hero-logo-stamp {
  max-height: 52px;
  width: auto;
  object-fit: contain;
  margin-bottom: 24px;
  display: block;
}
.hero-copy { position: relative; z-index: 2; }
.hero-stats {
  margin-top: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.hero-stats span {
  font-size: .74rem;
  letter-spacing: .15em;
  text-transform: uppercase;
  font-weight: 600;
  border: 1.5px solid var(--outline);
  border-radius: 999px;
  padding: 8px 16px;
  color: var(--muted);
  transition: all .3s ease;
  background: color-mix(in srgb, var(--surface) 40%, transparent);
}
.hero-stats span:hover { border-color: var(--accent); color: var(--text); background: color-mix(in srgb, var(--accent) 12%, transparent); }
.hero-media {
  overflow: hidden;
  border-radius: calc(var(--radius) + 8px);
  border: 1.5px solid var(--outline);
  box-shadow: 0 32px 96px rgba(0, 0, 0, .18), inset 0 1px 0 rgba(255, 255, 255, .1);
  position: relative;
  aspect-ratio: 4 / 3;
}
.hero-media img { object-fit: cover; width: 100%; height: 100%; transition: transform .6s cubic-bezier(.4, 0, .2, 1); }
.hero:hover .hero-media img { transform: scale(1.04); }
.hero-immersive {
  position: relative;
  min-height: 76vh;
  border-radius: calc(var(--radius) + 12px);
  overflow: hidden;
  margin-left: -40px;
  margin-right: -40px;
  width: calc(100% + 80px);
}
.immersive-media {
  position: absolute;
  inset: 0;
  border: none;
  box-shadow: none;
}
.immersive-media img { height: 100%; object-fit: cover; }
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(125deg, rgba(0,0,0,.68) 8%, rgba(0,0,0,.22) 62%, rgba(0,0,0,.48) 100%);
}
.hero-copy-overlay {
  position: relative;
  align-self: end;
  padding: clamp(32px, 6vw, 56px);
  z-index: 3;
  color: white;
}
.hero-copy-overlay h1 { color: white; }
.hero-copy-overlay .eyebrow { color: rgba(255, 255, 255, .85); }
.hero-copy-overlay p { color: rgba(255, 255, 255, .8); }
.pill-row, .cta-row { display: flex; flex-wrap: wrap; gap: 14px; }
.feature-grid, .testimonial-grid { display: flex; flex-wrap: wrap; gap: 16px; }
.pill {
  border: 1.5px solid var(--outline);
  border-radius: 999px;
  padding: 10px 18px;
  font-size: .92rem;
  font-weight: 500;
  color: var(--muted);
  background: color-mix(in srgb, var(--surface) 35%, transparent);
  transition: all .2s ease;
}
.pill:hover { border-color: var(--accent); color: var(--text); background: color-mix(in srgb, var(--accent) 12%, transparent); }
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  border-radius: ${theme.buttonStyle === "sharp" ? "12px" : theme.buttonStyle === "ghost" ? "20px" : "999px"};
  border: 1.5px solid var(--outline);
  padding: 0 24px;
  font-weight: 600;
  font-size: .98rem;
  letter-spacing: .01em;
  transition: all .3s cubic-bezier(.4, 0, .2, 1);
  position: relative;
  overflow: hidden;
}
.button::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,.1) 100%);
  opacity: 0;
  transition: opacity .3s ease;
  pointer-events: none;
}
.button:hover::before { opacity: 1; }
.button:hover { transform: translateY(-3px); }
.button-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 65%, var(--accent) 35%));
  box-shadow: 0 16px 48px color-mix(in srgb, var(--primary) 42%, transparent), inset 0 1px 0 rgba(255, 255, 255, .15);
  border: none;
}
.button-primary:hover {
  box-shadow: 0 22px 64px color-mix(in srgb, var(--primary) 48%, transparent), inset 0 1px 0 rgba(255, 255, 255, .2);
}
.button-secondary {
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  color: var(--text);
  border: 1.5px solid var(--outline);
}
.button-secondary:hover {
  background: color-mix(in srgb, var(--surface) 85%, transparent);
  border-color: var(--accent);
}
.feature-grid-cards {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
}
.feature-grid-list {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 18px;
}
.feature-card {
  grid-column: span 6;
  background: ${cardFill};
  border: 1.5px solid var(--outline);
  border-radius: calc(var(--radius) + 2px);
  padding: 32px;
  position: relative;
  backdrop-filter: ${theme.surfaceStyle === "glass" ? "blur(18px)" : "none"};
  transition: all .4s cubic-bezier(.4, 0, .2, 1);
  overflow: hidden;
}
.feature-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, .1) 100%);
  opacity: 0;
  transition: opacity .4s ease;
  pointer-events: none;
}
.feature-card:hover {
  border-color: var(--accent);
  box-shadow: 0 16px 56px color-mix(in srgb, var(--accent) 18%, transparent), 0 0 0 1px inset rgba(255, 255, 255, .1);
  transform: translateY(-4px);
}
.feature-card:hover::before { opacity: 1; }
.feature-grid-list .feature-card { grid-column: span 1; }
.feature-index {
  display: inline-flex;
  font-size: .72rem;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 12px;
  font-weight: 700;
}
.feature-card h3 { margin: 0 0 12px; font-size: clamp(1.4rem, 2.4vw, 1.7rem); font-family: var(--heading-font); font-weight: 700; line-height: 1.2; }
.feature-card p { margin: 0; color: var(--muted); font-size: 1.02rem; line-height: 1.6; }
.feature-card:nth-child(2n) { transform: translateY(20px); }
.feature-card:nth-child(3n) { margin-top: 8px; }
.feature-card:hover { transform: translateY(-4px); }
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}
.gallery-item {
  overflow: hidden;
  border-radius: calc(var(--radius) + 4px);
  border: 1.5px solid var(--outline);
  min-height: 240px;
  position: relative;
  background: var(--surface);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .08);
  transition: all .4s cubic-bezier(.4, 0, .2, 1);
}
.gallery-item img {
  height: 100%;
  object-fit: cover;
  transition: transform .7s cubic-bezier(.4, 0, .2, 1);
  width: 100%;
}
.gallery-item:hover {
  box-shadow: 0 18px 52px rgba(0, 0, 0, .14);
  border-color: var(--accent);
}
.gallery-item:hover img { transform: scale(1.08); }
.gallery-item-1 { grid-column: span 7; min-height: 380px; }
.gallery-item-2 { grid-column: span 5; min-height: 380px; }
.gallery-item-3 { grid-column: span 5; min-height: 280px; }
.gallery-item-4 { grid-column: span 7; min-height: 280px; }
.testimonial-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
}
.testimonial-card {
  grid-column: span 4;
  background: ${cardFill};
  border: 1.5px solid var(--outline);
  border-radius: calc(var(--radius) + 2px);
  padding: 28px;
  position: relative;
  backdrop-filter: ${theme.surfaceStyle === "glass" ? "blur(18px)" : "none"};
  transition: all .4s cubic-bezier(.4, 0, .2, 1);
  overflow: hidden;
}
.testimonial-card::before {
  content: '"';
  position: absolute;
  top: -8px;
  right: 12px;
  font-size: 8rem;
  color: color-mix(in srgb, var(--accent) 12%, transparent);
  font-family: Georgia, serif;
  line-height: 1;
}
.testimonial-card:hover {
  border-color: var(--accent);
  box-shadow: 0 16px 52px color-mix(in srgb, var(--accent) 22%, transparent), 0 0 0 1px inset rgba(255, 255, 255, .1);
  transform: translateY(-6px);
}
.testimonial-card:nth-child(2n) { transform: translateY(16px); }
.testimonial-card:hover { transform: translateY(-6px); }
.testimonial-card p { margin: 0 0 18px; color: var(--text); font-size: 1.04rem; line-height: 1.7; font-weight: 500; }
.testimonial-card footer { display: grid; gap: 4px; color: var(--muted); font-size: .92rem; }
.testimonial-card footer strong { color: var(--text); font-weight: 700; }
.final-cta-card {
  border: 1.5px solid var(--outline);
  border-radius: calc(var(--radius) + 10px);
  padding: clamp(40px, 6vw, 64px);
  background: linear-gradient(145deg, color-mix(in srgb, var(--surface) 72%, transparent), color-mix(in srgb, var(--primary) 14%, transparent));
  text-align: center;
  text-align: center;
  box-shadow: 0 16px 64px color-mix(in srgb, var(--primary) 16%, transparent), inset 0 1px 0 rgba(255, 255, 255, .1);
  transition: all .4s ease;
  position: relative;
  overflow: hidden;
}
.final-cta-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, .08) 100%);
  opacity: 0;
  transition: opacity .4s ease;
  pointer-events: none;
}
.final-cta-card:hover {
  border-color: var(--accent);
  box-shadow: 0 22px 84px color-mix(in srgb, var(--primary) 22%, transparent), inset 0 1px 0 rgba(255, 255, 255, .15);
}
.final-cta-card:hover::before { opacity: 1; }
.final-cta-card h2 { font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 16px; }
.final-cta-card p { color: var(--muted); font-size: 1.08rem; max-width: 68ch; margin: 0 auto 32px; line-height: 1.6; }
.hero-layout-centered {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  text-align: center;
  gap: 32px;
}
.hero-layout-centered .hero-copy-centered,
.hero-layout-editorial .hero-copy-editorial { max-width: 760px; }
.hero-layout-centered .hero-media-centered {
  width: min(100%, 980px);
  overflow: hidden;
  border-radius: calc(var(--radius) + 12px);
  border: 1.5px solid var(--outline);
  box-shadow: 0 22px 72px rgba(0, 0, 0, .14);
}
.hero-layout-editorial {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr);
  gap: 32px;
  align-items: end;
}
.hero-layout-editorial .hero-sidecar { display: grid; gap: 18px; }
.hero-layout-editorial .hero-media-sidecar {
  overflow: hidden;
  border-radius: calc(var(--radius) + 8px);
  border: 1.5px solid var(--outline);
  box-shadow: 0 18px 60px rgba(0, 0, 0, .12);
}
.hero-layout-editorial .hero-stats-sidecar { justify-content: flex-start; }
.feature-stack { display: grid; gap: 16px; }
.feature-card-stack {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.feature-grid-alternating { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 18px; }
.feature-grid-alternating .feature-card-tall { grid-column: span 7; }
.feature-grid-alternating .feature-card-wide { grid-column: span 5; }
.gallery-grid-masonry { display: block; column-count: 2; column-gap: 18px; }
.gallery-grid-masonry .gallery-item { display: inline-block; width: 100%; margin: 0 0 18px; break-inside: avoid; }
.gallery-overlap { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; }
.gallery-overlap__item { overflow: hidden; border-radius: calc(var(--radius) + 4px); border: 1.5px solid var(--outline); min-height: 260px; }
.gallery-overlap__item img { width: 100%; height: 100%; object-fit: cover; }
.gallery-overlap__item--1 { grid-column: span 8; min-height: 420px; }
.gallery-overlap__item--2 { grid-column: span 4; min-height: 280px; margin-top: 70px; }
.gallery-overlap__item--3 { grid-column: span 5; min-height: 300px; }
.gallery-overlap__item--4 { grid-column: span 7; min-height: 320px; margin-top: -24px; }
.testimonial-timeline { display: grid; gap: 18px; }
.testimonial-card-timeline {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}
.final-cta-layout-side-by-side .final-cta-card-side-by-side {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  text-align: left;
  align-items: center;
}
.faq-list { display: grid; gap: 12px; }
.faq-item {
  border: 1.5px solid var(--outline);
  border-radius: calc(var(--radius));
  padding: 18px 22px;
  background: ${cardFill};
  transition: all .3s ease;
  backdrop-filter: ${theme.surfaceStyle === "glass" ? "blur(14px)" : "none"};
}
.faq-item:hover {
  border-color: var(--accent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 16%, transparent);
}
.faq-item summary {
  cursor: pointer;
  font-weight: 700;
  font-size: 1.06rem;
  color: var(--text);
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}
.faq-item summary::after {
  content: "+";
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  border-radius: 6px;
  transition: transform .3s ease;
  font-weight: 700;
  font-size: 1.2rem;
}
.faq-item[open] summary::after { transform: rotate(45deg); }
.faq-item p { margin: 14px 0 0; color: var(--muted); line-height: 1.7; }
.contact-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
}
.contact-card {
  grid-column: span 6;
  border: 1.5px solid var(--outline);
  border-radius: calc(var(--radius) + 2px);
  padding: 32px;
  background: ${cardFill};
  transition: all .4s ease;
  backdrop-filter: ${theme.surfaceStyle === "glass" ? "blur(16px)" : "none"};
  position: relative;
  overflow: hidden;
}
.contact-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, .08) 100%);
  opacity: 0;
  transition: opacity .4s ease;
  pointer-events: none;
}
.contact-card:hover {
  border-color: var(--accent);
  box-shadow: 0 12px 40px color-mix(in srgb, var(--accent) 20%, transparent);
  transform: translateY(-2px);
}
.contact-card:hover::before { opacity: 1; }
.contact-card h3 { margin: 0 0 12px; font-size: 1.8rem; font-family: var(--heading-font); font-weight: 700; }
.contact-card p { margin: 0 0 10px; color: var(--muted); line-height: 1.6; }
.map-card {
  display: grid;
  place-items: center;
}
.map-placeholder {
  width: 100%;
  min-height: 280px;
  border-radius: calc(var(--radius));
  border: 2px dashed color-mix(in srgb, var(--outline) 52%, transparent);
  display: grid;
  place-items: center;
  color: var(--muted);
  font-weight: 600;
  text-align: center;
  padding: 24px;
  font-size: .96rem;
  background: color-mix(in srgb, var(--surface) 35%, transparent);
  transition: all .3s ease;
}
.map-card:hover .map-placeholder { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); }
.site-footer {
  margin-top: 120px;
  padding: 64px 0 32px;
  border-top: 1px solid var(--outline);
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}
.footer-brand p {
  margin-top: 18px;
  color: var(--muted);
  max-width: 320px;
  font-size: .94rem;
}
.footer-contact h4 {
  margin: 0 0 16px;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}
.footer-contact p {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: .92rem;
}
.footer-bottom {
  padding-top: 32px;
  border-top: 1px solid var(--outline);
  text-align: center;
  color: var(--muted);
  font-size: .84rem;
}
@media (max-width: 768px) {
  .footer-grid { grid-template-columns: 1fr; gap: 32px; }
  .site-header { grid-template-columns: 1fr auto; }
  .top-nav { display: none; }
}
[data-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity .6s ease, transform .6s cubic-bezier(.4, 0, .2, 1);
}
[data-reveal].is-visible {
  opacity: 1;
  transform: translateY(0);
}
@media (min-width: 1100px) {
  .hero-copy { padding-right: 32px; }
  .section-heading h2 { font-size: clamp(2.2rem, 4.4vw, 3.6rem); }
}
@media (max-width: 1100px) {
  .site-header { grid-template-columns: 1fr; text-align: center; gap: 14px; }
  .top-nav { justify-content: center; gap: 20px; }
  .hero { grid-template-columns: 1fr; gap: clamp(28px, 4vw, 48px); }
  .hero-layout-editorial { grid-template-columns: 1fr; }
  .gallery-grid-masonry { column-count: 1; }
  .feature-card { grid-column: span 12; }
  .feature-grid-alternating .feature-card-tall,
  .feature-grid-alternating .feature-card-wide { grid-column: span 12; }
  .gallery-item-1, .gallery-item-2, .gallery-item-3, .gallery-item-4 { grid-column: span 12; min-height: 280px; }
  .gallery-overlap__item--1, .gallery-overlap__item--2, .gallery-overlap__item--3, .gallery-overlap__item--4 { grid-column: span 12; min-height: 280px; margin-top: 0; }
  .testimonial-card { grid-column: span 6; }
  .final-cta-layout-side-by-side .final-cta-card-side-by-side { grid-template-columns: 1fr; text-align: center; }
  .contact-card { grid-column: span 12; }
  .site-section:nth-child(even) { margin-left: -20px; margin-right: -20px; padding-left: 20px; padding-right: 20px; }
}
@media (max-width: 720px) {
  .site-shell { width: min(100%, calc(100% - 20px)); padding: 18px 0 96px; }
  .site-header { padding: 12px 16px; gap: 10px; }
  .brandmark { font-size: .96rem; }
  .top-nav { gap: 14px; }
  .header-cta { display: none; }
  .hero h1 { font-size: clamp(2.4rem, 13vw, 3.8rem); }
  .hero p { font-size: clamp(1.02rem, 2.5vw, 1.35rem); }
  .hero-stats { margin-top: 24px; gap: 10px; }
  .hero-stats span { font-size: .68rem; padding: 6px 12px; }
  .testimonial-card { grid-column: span 12; }
  .feature-card { padding: 24px; }
  .final-cta-card { padding: clamp(28px, 4vw, 48px); }
  .pill { padding: 8px 14px; font-size: .88rem; }
  .button { min-height: 46px; padding: 0 20px; font-size: .94rem; }
  .section-heading h2 { font-size: clamp(1.6rem, 3.5vw, 2.8rem); }
  .site-section:nth-child(even) { padding: 48px 0; margin-left: -20px; margin-right: -20px; padding-left: 20px; padding-right: 20px; }
}
`;
};

const buildJs = () => `
(() => {
  // === SMOOTH SCROLL REVEAL ANIMATIONS ===
  const revealElements = document.querySelectorAll('.site-section, .feature-card, .testimonial-card, .gallery-item, .faq-item, .contact-card, .pill, .button');
  revealElements.forEach((el) => el.setAttribute('data-reveal', ''));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, index * 45);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });

  revealElements.forEach((element) => revealObserver.observe(element));

  // === HERO IMAGE PARALLAX & ZOOM ===
  const parallaxTarget = document.querySelector('.hero-media img');
  if (parallaxTarget) {
    let currentX = 0, currentY = 0;
    window.addEventListener('mousemove', (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2.2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2.2;
      currentX = x;
      currentY = y;
      parallaxTarget.style.transform = 'scale(1.04) translate(' + x.toFixed(2) + '%, ' + y.toFixed(2) + '%)';
    });
    window.addEventListener('mouseleave', () => {
      parallaxTarget.style.transform = 'scale(1) translate(0, 0)';
    });
  }

  // === SUBTLE SCROLL DEPTH EFFECT ===
  const scrollTrigger = () => {
    const scrolled = window.scrollY;
    const parallaxLayers = document.querySelectorAll('.hero-media');
    parallaxLayers.forEach((layer) => {
      const offset = scrolled * 0.35;
      layer.style.transform = 'translateY(' + offset + 'px)';
    });
  };
  window.addEventListener('scroll', scrollTrigger, { passive: true });

  // === SMOOTH FOCUS STYLES FOR ACCESSIBILITY ===
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });

  // === BUTTON RIPPLE EFFECT ===
  const buttons = document.querySelectorAll('.button');
  buttons.forEach((button) => {
    button.addEventListener('click', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.width = '0';
      ripple.style.height = '0';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, .3)';
      ripple.style.pointerEvents = 'none';
      ripple.style.animation = 'ripple 0.6s ease-out';
      
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // === GALLERY IMAGE LAZY LOAD WITH FADE ===
  const galleryImages = document.querySelectorAll('.gallery-item img');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.style.opacity = '0';
        img.style.transition = 'opacity .8s ease';
        img.onload = () => {
          img.style.opacity = '1';
        };
        if (img.src) {
          imageObserver.unobserve(img);
        }
      }
    });
  }, { threshold: 0.1 });
  galleryImages.forEach((img) => imageObserver.observe(img));

  // === FAQ SMOOTH EXPAND ===
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const details = item.querySelector('details');
    if (details) {
      details.addEventListener('toggle', () => {
        details.style.transition = 'all .3s ease';
      });
    }
  });

  // === HEADER SCROLL EFFECT ===
  const header = document.querySelector('.site-header');
  let lastScrollY = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 100 && scrollY > lastScrollY) {
      // scrolling down
      header.style.opacity = '0.85';
    } else if (scrollY < 50) {
      header.style.opacity = '1';
    }
    lastScrollY = scrollY;
  }, { passive: true });

  // === RIPPLE ANIMATION KEYFRAME ===
  const style = document.createElement('style');
  style.textContent = \`
    @keyframes ripple {
      to {
        width: 400px;
        height: 400px;
        opacity: 0;
      }
    }
  \`;
  document.head.appendChild(style);
})();
`;

export function renderWebsiteArtifact(artifact: WebsiteArtifact): string {
	const normalizedSchema: WebsiteSchema = {
		...artifact.schema,
		theme: {
			...defaultTheme(),
			...artifact.schema.theme,
		},
		brand: {
			businessName: artifact.schema.brand?.businessName || "",
			category: artifact.schema.brand?.category || "",
			address: artifact.schema.brand?.address || "",
			phone: artifact.schema.brand?.phone || "",
			email: artifact.schema.brand?.email || "",
			websiteUri: artifact.schema.brand?.websiteUri || "",
			logo: artifact.schema.brand?.logo,
		},
		seo: {
			title:
				artifact.schema.seo?.title ||
				artifact.schema.brand?.businessName ||
				"Website Preview",
			description: artifact.schema.seo?.description || "",
			keywords: artifact.schema.seo?.keywords || [],
		},
		sections: artifact.schema.sections || [],
	};

	const htmlBody = renderPageBody(normalizedSchema);

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(normalizedSchema.seo.description)}" />
  <title>${escapeHtml(normalizedSchema.seo.title)}</title>
  <style>${artifact.css || buildCss(normalizedSchema)}</style>
</head>
<body class="${getThemeClassName(normalizedSchema.theme)}">
  <main class="site-shell">
    ${renderHeader(normalizedSchema)}
    ${htmlBody}
    ${renderFooter(normalizedSchema)}
  </main>
  <script>${artifact.js || buildJs()}</script>
</body>
</html>`;
}

export function createDefaultWebsiteArtifact(
	business: Business,
	schema: WebsiteSchema,
	content: { html: string; css: string; js: string },
): WebsiteArtifact {
	return {
		schema,
		html: content.html,
		css: content.css,
		js: content.js,
	};
}
