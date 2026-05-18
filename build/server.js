var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/wordpress.ts
var wordpress_exports = {};
__export(wordpress_exports, {
  buildWordPressProvisioningPlan: () => buildWordPressProvisioningPlan,
  buildWordPressSitePages: () => buildWordPressSitePages,
  collectWordPressMediaAssets: () => collectWordPressMediaAssets,
  schemaToGutenbergBlocks: () => schemaToGutenbergBlocks
});
function escapeHtml(value) {
  return (value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}
function slugify(value) {
  return (value || "client-site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function renderNavBlocks(schema) {
  const voice = getSiteVoice(schema);
  const links = [
    { title: "Home", href: "/" },
    { title: "About", href: "/about/" },
    { title: voice.featuresTitle, href: "/services/" },
    { title: voice.galleryTitle, href: "/gallery/" },
    { title: voice.faqTitle, href: "/faq/" },
    { title: voice.contactTitle, href: "/contact/" }
  ];
  return `<!-- wp:navigation {"layout":{"type":"flex","justifyContent":"center"}} -->
<nav class="wp-block-navigation">${links.map((link) => `<a class="wp-block-navigation-item__content" href="${link.href}">${escapeHtml(link.title)}</a>`).join("")}</nav>
<!-- /wp:navigation -->`;
}
function getSiteVoice(schema) {
  const category = (schema.brand.category || "").toLowerCase();
  const businessName = schema.brand.businessName || "The Brand";
  if (category.includes("restaurant") || category.includes("cafe") || category.includes("bakery")) {
    return {
      featuresTitle: "Signature Dishes & Experiences",
      galleryTitle: "Dining Room & Detail",
      testimonialsTitle: "Guest Impressions",
      faqTitle: "Dining Questions",
      contactTitle: `Visit ${businessName}`,
      aboutTitle: `The Story Behind ${businessName}`,
      ctaButton: "Reserve Your Table"
    };
  }
  if (category.includes("salon") || category.includes("spa") || category.includes("wellness")) {
    return {
      featuresTitle: "Signature Rituals",
      galleryTitle: "Studio Atmosphere",
      testimonialsTitle: "Client Notes",
      faqTitle: "Treatment Questions",
      contactTitle: `Book ${businessName}`,
      aboutTitle: `About ${businessName}`,
      ctaButton: "Schedule Your Appointment"
    };
  }
  if (category.includes("gym") || category.includes("fitness") || category.includes("training")) {
    return {
      featuresTitle: "Training Programs",
      galleryTitle: "Progress & Environment",
      testimonialsTitle: "Member Wins",
      faqTitle: "Training Questions",
      contactTitle: `Start Training at ${businessName}`,
      aboutTitle: `About ${businessName}`,
      ctaButton: "Start Your Program"
    };
  }
  return {
    featuresTitle: "Capabilities Built For Growth",
    galleryTitle: "Selected Work",
    testimonialsTitle: "Trusted By Real Customers",
    faqTitle: "Questions, Answered Clearly",
    contactTitle: `Let's Build Your Next Version`,
    aboutTitle: `About ${businessName}`,
    ctaButton: "Book A Consultation"
  };
}
function getSection(schema, type) {
  return schema.sections.find((section) => section.type === type);
}
function wrapHtmlBlock(content) {
  return `<!-- wp:html -->
${content}
<!-- /wp:html -->`;
}
function getSectionLayout(section) {
  return (section.layout || section.variant || "standard").toLowerCase();
}
function getSectionTitle(section, fallback) {
  return section?.headline || section?.title || fallback;
}
function renderStructuredHeroSection(schema) {
  const hero = getSection(schema, "hero");
  if (!hero) return "";
  const layout = getSectionLayout(hero);
  const title = getSectionTitle(hero, schema.brand.businessName || "Welcome");
  const subheadline = hero.subheadline || `${schema.brand.businessName || "This business"} deserves a more distinctive digital presence.`;
  const primaryCta = hero.primaryCta || hero.ctaPrimary || { label: "Learn More", href: "#contact" };
  const secondaryCta = hero.secondaryCta || hero.ctaSecondary;
  const mediaUrl = hero.media?.url || hero.media?.src || "";
  const mediaAlt = hero.media?.alt || schema.brand.businessName;
  const badge = hero.badge || schema.brand.category;
  if (layout === "immersive") {
    return wrapHtmlBlock(`
<section class="wp-section wp-hero wp-hero--immersive" id="top" data-layout="immersive">
	<div class="wp-hero__media">
		${mediaUrl ? `<img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(mediaAlt)}" />` : ""}
		<div class="wp-hero__overlay"></div>
	</div>
	<div class="wp-hero__content">
		<p class="wp-hero__badge">${escapeHtml(badge)}</p>
		<h1>${escapeHtml(title)}</h1>
		<p>${escapeHtml(subheadline)}</p>
		<div class="wp-hero__actions">
			<a class="wp-button wp-button--primary" href="${escapeHtml(primaryCta.href)}">${escapeHtml(primaryCta.label)}</a>
			${secondaryCta ? `<a class="wp-button wp-button--secondary" href="${escapeHtml(secondaryCta.href)}">${escapeHtml(secondaryCta.label)}</a>` : ""}
		</div>
	</div>
</section>`);
  }
  if (layout === "centered") {
    return wrapHtmlBlock(`
<section class="wp-section wp-hero wp-hero--centered" id="top" data-layout="centered">
	<div class="wp-hero__content wp-hero__content--centered">
		<p class="wp-hero__badge">${escapeHtml(badge)}</p>
		<h1>${escapeHtml(title)}</h1>
		<p>${escapeHtml(subheadline)}</p>
		<div class="wp-hero__actions wp-hero__actions--centered">
			<a class="wp-button wp-button--primary" href="${escapeHtml(primaryCta.href)}">${escapeHtml(primaryCta.label)}</a>
			${secondaryCta ? `<a class="wp-button wp-button--secondary" href="${escapeHtml(secondaryCta.href)}">${escapeHtml(secondaryCta.label)}</a>` : ""}
		</div>
	</div>
	${mediaUrl ? `<figure class="wp-hero__figure"><img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(mediaAlt)}" /></figure>` : ""}
</section>`);
  }
  return wrapHtmlBlock(`
<section class="wp-section wp-hero wp-hero--split" id="top" data-layout="${escapeHtml(layout)}">
	<div class="wp-hero__content">
		<p class="wp-hero__badge">${escapeHtml(badge)}</p>
		<h1>${escapeHtml(title)}</h1>
		<p>${escapeHtml(subheadline)}</p>
		<div class="wp-hero__actions">
			<a class="wp-button wp-button--primary" href="${escapeHtml(primaryCta.href)}">${escapeHtml(primaryCta.label)}</a>
			${secondaryCta ? `<a class="wp-button wp-button--secondary" href="${escapeHtml(secondaryCta.href)}">${escapeHtml(secondaryCta.label)}</a>` : ""}
		</div>
	</div>
	${mediaUrl ? `<figure class="wp-hero__figure"><img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(mediaAlt)}" /></figure>` : ""}
</section>`);
}
function renderStructuredFeaturesSection(schema) {
  const features = getSection(schema, "features");
  if (!features || !Array.isArray(features.items) || features.items.length === 0) {
    return "";
  }
  const layout = getSectionLayout(features);
  const title = getSectionTitle(features, getSiteVoice(schema).featuresTitle);
  const items = features.items;
  if (layout === "list") {
    return wrapHtmlBlock(`
<section class="wp-section wp-features wp-features--list" id="services" data-layout="list">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Services</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-features__list">
		${items.map(
      (item, index) => `
		<article class="wp-feature wp-feature--row">
			<span class="wp-feature__index">${String(index + 1).padStart(2, "0")}</span>
			<div>
				<h3>${escapeHtml(item.title)}</h3>
				<p>${escapeHtml(item.description)}</p>
			</div>
		</article>`
    ).join("")}
	</div>
</section>`);
  }
  if (layout === "alternating-grid") {
    return wrapHtmlBlock(`
<section class="wp-section wp-features wp-features--alternating" id="services" data-layout="alternating-grid">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Services</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-features__grid wp-features__grid--alternating">
		${items.map(
      (item, index) => `
		<article class="wp-feature wp-feature--${index % 2 === 0 ? "tall" : "wide"}">
			<span class="wp-feature__index">${String(index + 1).padStart(2, "0")}</span>
			<h3>${escapeHtml(item.title)}</h3>
			<p>${escapeHtml(item.description)}</p>
		</article>`
    ).join("")}
	</div>
</section>`);
  }
  return wrapHtmlBlock(`
<section class="wp-section wp-features wp-features--bento" id="services" data-layout="${escapeHtml(layout)}">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Services</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-features__grid wp-features__grid--bento">
		${items.map(
    (item, index) => `
		<article class="wp-feature wp-feature--card wp-feature--${index === 0 ? "lead" : "support"}">
			<span class="wp-feature__index">${String(index + 1).padStart(2, "0")}</span>
			<h3>${escapeHtml(item.title)}</h3>
			<p>${escapeHtml(item.description)}</p>
		</article>`
  ).join("")}
	</div>
</section>`);
}
function renderStructuredGallerySection(schema) {
  const gallery = getSection(schema, "gallery");
  if (!gallery || !Array.isArray(gallery.items) || gallery.items.length === 0) {
    return "";
  }
  const layout = getSectionLayout(gallery);
  const title = getSectionTitle(gallery, getSiteVoice(schema).galleryTitle);
  if (layout === "masonry") {
    return wrapHtmlBlock(`
<section class="wp-section wp-gallery wp-gallery--masonry" id="gallery" data-layout="masonry">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Gallery</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-gallery__masonry">
		${gallery.items.map(
      (item, index) => `
		<figure class="wp-gallery__item wp-gallery__item--${index % 3 + 1}">
			<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" />
		</figure>`
    ).join("")}
	</div>
</section>`);
  }
  if (layout === "asymmetrical") {
    return wrapHtmlBlock(`
<section class="wp-section wp-gallery wp-gallery--asymmetrical" id="gallery" data-layout="asymmetrical">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Gallery</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-gallery__asymmetrical">
		${gallery.items.map(
      (item, index) => `
		<figure class="wp-gallery__panel wp-gallery__panel--${index === 0 ? "hero" : index % 2 === 0 ? "stack" : "rail"}">
			<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" />
		</figure>`
    ).join("")}
	</div>
</section>`);
  }
  return wrapHtmlBlock(`
<section class="wp-section wp-gallery wp-gallery--grid" id="gallery" data-layout="${escapeHtml(layout)}">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Gallery</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-gallery__grid">
		${gallery.items.map(
    (item) => `
		<figure class="wp-gallery__item">
			<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" />
		</figure>`
  ).join("")}
	</div>
</section>`);
}
function renderStructuredTestimonialsSection(schema) {
  const testimonials = getSection(schema, "testimonials");
  if (!testimonials || !Array.isArray(testimonials.items) || testimonials.items.length === 0) {
    return "";
  }
  const layout = getSectionLayout(testimonials);
  const title = getSectionTitle(
    testimonials,
    getSiteVoice(schema).testimonialsTitle
  );
  if (layout === "timeline") {
    return wrapHtmlBlock(`
<section class="wp-section wp-testimonials wp-testimonials--timeline" id="testimonials" data-layout="timeline">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Testimonials</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-testimonials__timeline">
		${testimonials.items.map(
      (item, index) => `
		<article class="wp-testimonial wp-testimonial--timeline">
			<span class="wp-testimonial__index">${String(index + 1).padStart(2, "0")}</span>
			<blockquote><p>${escapeHtml(item.quote)}</p></blockquote>
			<footer><strong>${escapeHtml(item.author)}</strong>${item.role ? `<span>${escapeHtml(item.role)}</span>` : ""}</footer>
		</article>`
    ).join("")}
	</div>
</section>`);
  }
  return wrapHtmlBlock(`
<section class="wp-section wp-testimonials wp-testimonials--cards" id="testimonials" data-layout="${escapeHtml(layout)}">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Testimonials</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-testimonials__grid">
		${testimonials.items.map(
    (item) => `
		<article class="wp-testimonial wp-testimonial--card">
			<blockquote><p>${escapeHtml(item.quote)}</p></blockquote>
			<footer><strong>${escapeHtml(item.author)}</strong>${item.role ? `<span>${escapeHtml(item.role)}</span>` : ""}</footer>
		</article>`
  ).join("")}
	</div>
</section>`);
}
function renderStructuredFaqSection(schema) {
  const faq = getSection(schema, "faq");
  if (!faq || !Array.isArray(faq.items) || faq.items.length === 0) {
    return "";
  }
  const title = getSectionTitle(faq, getSiteVoice(schema).faqTitle);
  return wrapHtmlBlock(`
<section class="wp-section wp-faq" id="faq" data-layout="${escapeHtml(getSectionLayout(faq))}">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">FAQ</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-faq__list">
		${faq.items.map(
    (item) => `
		<details class="wp-faq__item">
			<summary>${escapeHtml(item.question)}</summary>
			<p>${escapeHtml(item.answer)}</p>
		</details>`
  ).join("")}
	</div>
</section>`);
}
function renderStructuredContactSection(schema) {
  const contact = getSection(schema, "contact");
  const title = getSectionTitle(contact, getSiteVoice(schema).contactTitle);
  const layout = getSectionLayout(contact || {});
  const email = schema.brand.email || "";
  return wrapHtmlBlock(`
<section class="wp-section wp-contact wp-contact--${escapeHtml(layout)}" id="contact" data-layout="${escapeHtml(layout)}">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Contact</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-contact__grid">
		<article class="wp-contact__details">
			<h3>${escapeHtml(schema.brand.businessName)}</h3>
			<p>${escapeHtml(schema.brand.address || "")}</p>
			${schema.brand.phone ? `<p><strong>Phone:</strong> ${escapeHtml(schema.brand.phone)}</p>` : ""}
			${email ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : ""}
		</article>
		<article class="wp-contact__card">
			<div class="wp-contact__map">${escapeHtml(schema.brand.address || "")}</div>
			${email ? `<a class="wp-button wp-button--primary" href="mailto:${escapeHtml(email)}">Book A Conversation</a>` : ""}
		</article>
	</div>
</section>`);
}
function renderStructuredCtaSection(schema) {
  const cta = getSection(schema, "cta");
  if (!cta) return "";
  const layout = getSectionLayout(cta);
  const title = getSectionTitle(cta, getSiteVoice(schema).ctaTitle);
  const body = cta.body || "";
  const buttonLabel = cta.buttonLabel || cta.primaryCta?.label || getSiteVoice(schema).ctaButton;
  const buttonHref = cta.buttonHref || cta.primaryCta?.href || "#contact";
  if (layout === "side-by-side") {
    return wrapHtmlBlock(`
<section class="wp-section wp-cta wp-cta--split" data-layout="side-by-side">
	<div class="wp-cta__split">
		<div>
			<p class="wp-section__eyebrow">Call To Action</p>
			<h2>${escapeHtml(title)}</h2>
			<p>${escapeHtml(body)}</p>
		</div>
		<div class="wp-cta__actions">
			<a class="wp-button wp-button--primary" href="${escapeHtml(buttonHref)}">${escapeHtml(buttonLabel)}</a>
		</div>
	</div>
</section>`);
  }
  return wrapHtmlBlock(`
<section class="wp-section wp-cta wp-cta--centered" data-layout="${escapeHtml(layout)}">
	<div class="wp-cta__card">
		<p class="wp-section__eyebrow">Call To Action</p>
		<h2>${escapeHtml(title)}</h2>
		<p>${escapeHtml(body)}</p>
		<a class="wp-button wp-button--primary" href="${escapeHtml(buttonHref)}">${escapeHtml(buttonLabel)}</a>
	</div>
</section>`);
}
function renderStructuredSection(schema, section) {
  switch (section?.type) {
    case "hero":
      return renderStructuredHeroSection(schema);
    case "features":
      return renderStructuredFeaturesSection(schema);
    case "gallery":
      return renderStructuredGallerySection(schema);
    case "testimonials":
      return renderStructuredTestimonialsSection(schema);
    case "faq":
      return renderStructuredFaqSection(schema);
    case "contact":
      return renderStructuredContactSection(schema);
    case "cta":
      return renderStructuredCtaSection(schema);
    default:
      return "";
  }
}
function buildHomePageBlocks(schema) {
  return [
    renderNavBlocks(schema),
    ...(Array.isArray(schema.sections) ? schema.sections : []).map(
      (section) => renderStructuredSection(schema, section)
    )
  ].filter(Boolean).join("\n\n");
}
function buildAboutPageBlocks(schema) {
  const hero = getSection(schema, "hero");
  const voice = getSiteVoice(schema);
  const intro = hero?.subheadline || schema.seo.description || `${schema.brand.businessName} is a modern ${schema.brand.category} brand.`;
  const highlights = [
    `Category: ${schema.brand.category}`,
    `Style Direction: ${schema.theme.name}`,
    `Experience Focus: ${schema.theme.style}`
  ];
  return [
    renderNavBlocks(schema),
    wrapHtmlBlock(`
<section class="wp-section wp-about" data-layout="editorial">
  <header class="wp-section__header">
    <p class="wp-section__eyebrow">About</p>
    <h1>${escapeHtml(voice.aboutTitle)}</h1>
  </header>
  <div class="wp-about__content">
    <p>${escapeHtml(intro)}</p>
    <ul>
      ${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n      ")}
    </ul>
  </div>
</section>`),
    renderStructuredTestimonialsSection(schema)
  ].filter(Boolean).join("\n\n");
}
function buildServicesPageBlocks(schema) {
  const voice = getSiteVoice(schema);
  return [
    renderNavBlocks(schema),
    wrapHtmlBlock(`
<section class="wp-section wp-services" data-layout="editorial">
  <header class="wp-section__header">
    <p class="wp-section__eyebrow">Services</p>
    <h1>${escapeHtml(voice.featuresTitle)}</h1>
  </header>
</section>`),
    renderStructuredFeaturesSection(schema),
    renderStructuredCtaSection(schema)
  ].filter(Boolean).join("\n\n");
}
function buildGalleryPageBlocks(schema) {
  const voice = getSiteVoice(schema);
  return [
    renderNavBlocks(schema),
    wrapHtmlBlock(`
<section class="wp-section wp-gallery-page" data-layout="editorial">
  <header class="wp-section__header">
    <p class="wp-section__eyebrow">Gallery</p>
    <h1>${escapeHtml(voice.galleryTitle)}</h1>
  </header>
</section>`),
    renderStructuredGallerySection(schema)
  ].filter(Boolean).join("\n\n");
}
function buildFaqPageBlocks(schema) {
  const voice = getSiteVoice(schema);
  return [
    renderNavBlocks(schema),
    wrapHtmlBlock(`
<section class="wp-section wp-faq-page" data-layout="editorial">
  <header class="wp-section__header">
    <p class="wp-section__eyebrow">FAQ</p>
    <h1>${escapeHtml(voice.faqTitle)}</h1>
  </header>
</section>`),
    renderStructuredFaqSection(schema)
  ].filter(Boolean).join("\n\n");
}
function buildContactPageBlocks(schema) {
  const voice = getSiteVoice(schema);
  return [
    renderNavBlocks(schema),
    wrapHtmlBlock(`
<section class="wp-section wp-contact-page" data-layout="split">
  <header class="wp-section__header">
    <p class="wp-section__eyebrow">Contact</p>
    <h1>${escapeHtml(voice.contactTitle)}</h1>
  </header>
</section>`),
    renderStructuredContactSection(schema)
  ].filter(Boolean).join("\n\n");
}
function schemaToGutenbergBlocks(schema) {
  if (!schema) {
    return "";
  }
  return buildHomePageBlocks(schema);
}
function collectWordPressMediaAssets(schema) {
  const assets = [];
  for (const section of schema.sections) {
    if (section.type === "hero" && section.media?.src) {
      assets.push({
        sourceUrl: section.media.src,
        alt: section.media.alt || schema.brand.businessName,
        preferredFilename: `${schema.meta.slug}-hero`
      });
    }
    if (section.type === "gallery" && Array.isArray(section.items)) {
      for (const [index, item] of section.items.entries()) {
        assets.push({
          sourceUrl: item.src,
          alt: item.alt || `${schema.brand.businessName} gallery ${index + 1}`,
          preferredFilename: `${schema.meta.slug}-gallery-${index + 1}`
        });
      }
    }
  }
  const unique = /* @__PURE__ */ new Map();
  for (const asset of assets) {
    if (asset.sourceUrl) {
      unique.set(asset.sourceUrl, asset);
    }
  }
  return Array.from(unique.values());
}
function buildWordPressSitePages(schema) {
  const pages = [
    {
      title: schema.brand.businessName || "Home",
      slug: "home",
      content: buildHomePageBlocks(schema),
      isHomepage: true
    },
    {
      title: "About",
      slug: "about",
      content: buildAboutPageBlocks(schema)
    },
    {
      title: "Services",
      slug: "services",
      content: buildServicesPageBlocks(schema)
    },
    {
      title: "Gallery",
      slug: "gallery",
      content: buildGalleryPageBlocks(schema)
    },
    {
      title: "FAQ",
      slug: "faq",
      content: buildFaqPageBlocks(schema)
    },
    {
      title: "Contact",
      slug: "contact",
      content: buildContactPageBlocks(schema)
    }
  ];
  return pages;
}
function buildWordPressProvisioningPlan(schema, business, options) {
  const siteSlug = slugify(schema.meta?.slug || business.name || "client-site");
  const emailSlug = slugify(
    business.name || schema.brand.businessName || "client"
  );
  const ownerEmail = options?.ownerEmail || business.email || `${emailSlug}@example-client.test`;
  const ownerUsername = options?.ownerUsername || slugify(`${emailSlug}-${schema.meta.businessId}`);
  return {
    siteTitle: schema.brand.businessName || business.name || schema.seo.title || "Client Site",
    siteSlug,
    ownerEmail,
    ownerUsername,
    ownerDisplayName: schema.brand.businessName || business.name || ownerUsername,
    baseTheme: options?.baseTheme || "digital-scout-base-theme",
    pages: buildWordPressSitePages(schema),
    media: collectWordPressMediaAssets(schema),
    themeSettings: {
      palette: schema.theme.palette,
      typography: schema.theme.typography,
      radius: schema.theme.radius,
      style: schema.theme.style,
      name: schema.theme.name
    }
  };
}
var init_wordpress = __esm({
  "src/lib/wordpress.ts"() {
  }
});

// src/lib/premium-site-builder.ts
var premium_site_builder_exports = {};
__export(premium_site_builder_exports, {
  buildPremiumPageContent: () => buildPremiumPageContent,
  esc: () => esc
});
function esc(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function hexToRgb(hex) {
  const clean = (hex || "#000000").replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return `${r},${g},${b}`;
}
function getSectionValue(section, keys, fallback) {
  for (const key of keys) {
    const value = section?.[key] ?? section?.content?.[key];
    if (value !== void 0 && value !== null && value !== "") {
      return value;
    }
  }
  return fallback;
}
function getSectionItems(section) {
  return section?.items || section?.content?.items || [];
}
function normalizeVariant(section, fallback) {
  return (section?.variant || section?.layout || section?.styleVariant || fallback).toString().toLowerCase();
}
function buttonHtml(label, href, style = "") {
  return `<a class="wp-block-button__link wp-element-button" href="${esc(
    href || "#contact"
  )}" style="${style}">${esc(label)}</a>`;
}
function mediaSrc(section, fallback) {
  return section?.media?.[0]?.url || section?.media?.src || section?.media?.url || fallback;
}
function buildPremiumPageContent(schema) {
  const palette = schema.theme?.palette || {
    background: "#f8fafc",
    surface: "#ffffff",
    primary: "#7c3aed",
    accent: "#ec4899",
    text: "#111827",
    muted: "#6b7280",
    outline: "#e2e8f0"
  };
  const theme = schema.theme || {};
  const sections = schema.sections || [];
  const P = palette.primary;
  const BG = palette.background;
  const SURF = palette.surface;
  const TEXT = palette.text;
  const MUTED = palette.muted;
  const OUTLINE = palette.outline;
  const ACCENT = palette.accent || palette.primary;
  const radius = theme.radius || "28px";
  const typography = theme.typography || {
    heading: "Cormorant Garamond",
    body: "Inter"
  };
  const businessName = schema.brand?.businessName || "Welcome";
  const category = schema.brand?.category || "Premium Service";
  const globalCss = `<!-- wp:html -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;700;900&family=Space+Grotesk:wght@300;500;700&family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;500;700;900&family=Plus+Jakarta+Sans:wght@300;500;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box!important}
html,body{margin:0!important;padding:0!important;background:${BG}!important;color:${TEXT}!important;font-family:'${typography.body}',sans-serif!important;-webkit-font-smoothing:antialiased;scroll-behavior:smooth}
.site-header,.site-footer,.elementor-location-header,.elementor-location-footer,#masthead,#colophon,.entry-title,.wp-block-post-title,.page-title,.breadcrumbs,.posted-on,.byline,header.entry-header{display:none!important}
.site-content,.hentry,.entry-content,.wp-block-post-content,.wp-site-blocks,.is-layout-flow,.elementor,.page,.single{padding:0!important;margin:0!important;max-width:100%!important;width:100%!important;background:${BG}!important}
.glass{background:rgba(255,255,255,.76)!important;backdrop-filter:blur(20px)!important;border:1px solid rgba(255,255,255,.45)!important;box-shadow:0 18px 48px rgba(15,23,42,.08)!important}
.text-gradient{background:linear-gradient(135deg,${P},${ACCENT});-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hover-lift{transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s cubic-bezier(.2,.8,.2,1),border-color .35s ease!important}
.hover-lift:hover{transform:translateY(-8px)!important;box-shadow:0 28px 64px rgba(15,23,42,.14)!important}
.animate-up{animation:fadeInUp .8s cubic-bezier(.2,.8,.2,1) forwards}
.animate-scale{animation:scaleIn .8s cubic-bezier(.2,.8,.2,1) forwards}
.section-padding{padding:140px 40px}
.section-shell{max-width:1320px;margin:0 auto}
.eyebrow{display:inline-flex;align-items:center;gap:10px;padding:8px 16px;border:1px solid ${OUTLINE};border-radius:999px;background:rgba(255,255,255,.72);font-size:.76rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${P}}
.section-title{font-family:'${typography.heading}',serif;font-size:clamp(2.6rem,5vw,5rem);line-height:.94;letter-spacing:-.045em;font-weight:800;color:${TEXT};margin:0 0 18px}
.section-copy{max-width:640px;font-size:1.08rem;line-height:1.75;color:${MUTED};margin:0}
.wp-block-button__link,.wp-element-button{
	background:${P}!important;color:#fff!important;border:none!important;
	border-radius:${theme.buttonStyle === "sharp" ? "10px" : "999px"}!important;
	padding:18px 36px!important;font-weight:700!important;text-decoration:none!important;
	display:inline-flex!important;align-items:center;justify-content:center;cursor:pointer!important;
	box-shadow:0 14px 32px rgba(${hexToRgb(P)},.24)!important;
	transition:transform .28s ease,box-shadow .28s ease,background .28s ease!important
}
.wp-block-button__link:hover{transform:translateY(-2px) scale(1.02)!important;box-shadow:0 18px 40px rgba(${hexToRgb(P)},.32)!important}
.button-ghost{background:transparent!important;color:${TEXT}!important;border:1px solid ${OUTLINE}!important;box-shadow:none!important}
.shape-orb{position:absolute;border-radius:999px;pointer-events:none;filter:blur(4px)}
@keyframes fadeInUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@media (max-width: 920px){
	.section-padding{padding:88px 24px}
	.two-col,.split-grid,.contact-grid,.cta-split,.feature-bento,.gallery-editorial,.gallery-stack,.testimonial-featured,.faq-split{grid-template-columns:1fr!important}
}
${theme.customCss || ""}
${sections.map((section) => section.customCss || "").join("\n")}
</style>
<!-- /wp:html -->

`;
  let html = globalCss;
  sections.forEach((section, index) => {
    const sectionBg = index % 2 === 0 ? BG : SURF;
    switch (section.type) {
      case "hero":
        html += renderHero(
          section,
          { businessName, category, typography, P, TEXT, MUTED, BG, SURF, ACCENT, OUTLINE }
        );
        break;
      case "features":
      case "services":
        html += renderFeatures(
          section,
          { typography, P, TEXT, MUTED, SURF, OUTLINE, radius, sectionBg }
        );
        break;
      case "gallery":
        html += renderGallery(
          section,
          { typography, TEXT, MUTED, sectionBg, radius }
        );
        break;
      case "testimonials":
        html += renderTestimonials(
          section,
          { typography, P, TEXT, MUTED, sectionBg, SURF, OUTLINE, radius }
        );
        break;
      case "faq":
        html += renderFaq(
          section,
          { typography, P, TEXT, MUTED, sectionBg, SURF, OUTLINE, radius }
        );
        break;
      case "cta":
        html += renderCta(
          section,
          { typography, P, TEXT, ACCENT, radius }
        );
        break;
      case "contact":
        html += renderContact(
          section,
          { typography, P, TEXT, MUTED, sectionBg, SURF, OUTLINE, radius, brand: schema.brand || {} }
        );
        break;
    }
  });
  html += `<!-- wp:html -->
<footer style="background:#050816;padding:92px 40px;text-align:center;">
  <div class="section-shell">
    <div class="eyebrow" style="background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14);color:#fff">Digital Presence</div>
    <h2 style="font-family:'${typography.heading}',serif;color:#fff;font-size:2.2rem;letter-spacing:-.04em;margin:22px 0 12px;">${esc(
    businessName
  )}</h2>
    <p style="color:rgba(255,255,255,.48);font-size:.92rem;margin:0;">Crafted for premium presentation and clear conversion.</p>
  </div>
</footer>
<!-- /wp:html -->`;
  return html;
}
function renderHero(section, context) {
  const { businessName, category, typography, P, TEXT, MUTED, BG, SURF, ACCENT, OUTLINE } = context;
  const img = mediaSrc(
    section,
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80"
  );
  const title = getSectionValue(section, ["headline", "title"], businessName);
  const sub = getSectionValue(
    section,
    ["subheadline", "body", "description"],
    ""
  );
  const ctaPrimary = section.ctaPrimary || section.primaryCta || {
    label: "Discover More",
    href: "#contact"
  };
  const ctaSecondary = section.ctaSecondary || section.secondaryCta || null;
  const variant = normalizeVariant(section, "split");
  if (variant === "immersive" || variant === "cinematic") {
    return `<!-- wp:cover {"url":"${esc(
      img
    )}","dimRatio":56,"minHeight":100,"minHeightUnit":"vh","align":"full"} -->
<div class="wp-block-cover alignfull" style="min-height:100vh;position:relative;overflow:hidden;">
<span aria-hidden="true" class="wp-block-cover__background has-background-dim" style="background:linear-gradient(180deg,rgba(7,10,23,.14),rgba(7,10,23,.68))"></span>
<img class="wp-block-cover__image-background" alt="${esc(
      businessName
    )}" src="${esc(img)}" data-object-fit="cover" />
<div class="wp-block-cover__inner-container">
  <div class="section-shell animate-up" style="min-height:100vh;display:grid;align-items:end;padding:48px 24px 72px;">
    <div style="max-width:780px;">
      <div class="eyebrow" style="background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);color:#fff">${esc(
      category
    )}</div>
      <h1 style="font-family:'${typography.heading}',serif;font-size:clamp(3.8rem,11vw,8rem);line-height:.88;letter-spacing:-.06em;color:#fff;margin:26px 0 18px;">${esc(
      title
    )}</h1>
      <p style="font-size:clamp(1.16rem,2.6vw,1.5rem);line-height:1.6;color:rgba(255,255,255,.84);max-width:620px;margin:0 0 34px;">${esc(
      sub
    )}</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        ${buttonHtml(ctaPrimary.label || "Discover More", ctaPrimary.href || "#contact")}
        ${ctaSecondary ? buttonHtml(
      ctaSecondary.label || "Explore",
      ctaSecondary.href || "#services",
      "background:rgba(255,255,255,.14)!important;color:#fff!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:none!important"
    ) : ""}
      </div>
    </div>
  </div>
</div>
</div>
<!-- /wp:cover -->

`;
  }
  if (variant === "editorial" || variant === "editorial-split" || variant === "magazine") {
    return `<!-- wp:html -->
<section class="section-padding" style="background:${BG};overflow:hidden;">
  <div class="section-shell split-grid" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(420px,.92fr);gap:44px;align-items:center;">
    <div class="animate-up">
      <div class="eyebrow">${esc(category)}</div>
      <h1 style="font-family:'${typography.heading}',serif;font-size:clamp(3rem,7vw,5.7rem);line-height:.92;letter-spacing:-.05em;color:${TEXT};margin:24px 0 18px;">${esc(
      title
    )}</h1>
      <p style="max-width:520px;font-size:1.14rem;line-height:1.78;color:${MUTED};margin:0 0 34px;">${esc(
      sub
    )}</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        ${buttonHtml(ctaPrimary.label || "Discover More", ctaPrimary.href || "#contact")}
        ${ctaSecondary ? buttonHtml(
      ctaSecondary.label || "Explore",
      ctaSecondary.href || "#services",
      "background:transparent!important;color:" + TEXT + "!important;border:1px solid " + OUTLINE + "!important;box-shadow:none!important"
    ) : ""}
      </div>
    </div>
    <div class="animate-scale" style="position:relative;">
      <div class="shape-orb" style="width:220px;height:220px;right:-32px;top:-28px;background:rgba(${hexToRgb(
      ACCENT
    )},.12)"></div>
      <img src="${esc(img)}" alt="${esc(
      businessName
    )}" style="width:100%;aspect-ratio:4/4.5;object-fit:cover;border-radius:34px;box-shadow:0 24px 70px rgba(15,23,42,.12);" />
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
  }
  if (variant === "centered" || variant === "minimal") {
    return `<!-- wp:html -->
<section class="section-padding" style="background:${BG};">
  <div class="section-shell animate-up" style="max-width:1080px;text-align:center;">
    <div class="eyebrow">${esc(category)}</div>
    <h1 style="font-family:'${typography.heading}',serif;font-size:clamp(3rem,8vw,6.4rem);line-height:.9;letter-spacing:-.06em;color:${TEXT};margin:24px auto 18px;max-width:860px;">${esc(
      title
    )}</h1>
    <p style="font-size:1.15rem;line-height:1.78;color:${MUTED};max-width:680px;margin:0 auto 34px;">${esc(
      sub
    )}</p>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:42px;">
      ${buttonHtml(ctaPrimary.label || "Discover More", ctaPrimary.href || "#contact")}
      ${ctaSecondary ? buttonHtml(
      ctaSecondary.label || "Explore",
      ctaSecondary.href || "#services",
      "background:transparent!important;color:" + TEXT + "!important;border:1px solid " + OUTLINE + "!important;box-shadow:none!important"
    ) : ""}
    </div>
    <img src="${esc(img)}" alt="${esc(
      businessName
    )}" style="width:100%;max-width:1080px;aspect-ratio:16/9;object-fit:cover;border-radius:38px;box-shadow:0 24px 70px rgba(15,23,42,.12);" />
  </div>
</section>
<!-- /wp:html -->

`;
  }
  return `<!-- wp:html -->
<section class="section-padding" style="background:${BG};overflow:hidden;">
  <div class="section-shell two-col" style="display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:36px;align-items:stretch;">
    <div class="glass animate-up" style="padding:clamp(32px,5vw,64px);border-radius:36px;display:flex;flex-direction:column;justify-content:center;">
      <div class="eyebrow">${esc(category)}</div>
      <h1 style="font-family:'${typography.heading}',serif;font-size:clamp(2.8rem,7vw,5.8rem);line-height:.92;letter-spacing:-.05em;color:${TEXT};margin:24px 0 18px;">${esc(
    title
  )}</h1>
      <p style="font-size:1.12rem;line-height:1.76;color:${MUTED};margin:0 0 34px;">${esc(
    sub
  )}</p>
      ${buttonHtml(ctaPrimary.label || "Discover More", ctaPrimary.href || "#contact")}
    </div>
    <div class="animate-scale" style="position:relative;min-height:420px;">
      <img src="${esc(img)}" alt="${esc(
    businessName
  )}" style="width:100%;height:100%;min-height:420px;object-fit:cover;border-radius:36px;" />
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
}
function renderFeatures(section, context) {
  const { typography, P, TEXT, MUTED, SURF, OUTLINE, radius, sectionBg } = context;
  const items = getSectionItems(section);
  const title = getSectionValue(section, ["title", "headline"], "Services");
  const intro = getSectionValue(
    section,
    ["subheadline", "description"],
    ""
  );
  const variant = normalizeVariant(section, "bento");
  const wrap = (inner) => `<!-- wp:html -->
<section class="section-padding" style="background:${sectionBg};">
  <div class="section-shell">
    <div style="display:flex;justify-content:space-between;align-items:end;gap:28px;flex-wrap:wrap;margin-bottom:66px;">
      <div>
        <div class="eyebrow">Services</div>
        <h2 class="section-title">${esc(title)}</h2>
      </div>
      ${intro ? `<p class="section-copy">${esc(intro)}</p>` : ""}
    </div>
    ${inner}
  </div>
</section>
<!-- /wp:html -->

`;
  if (variant === "editorial-list" || variant === "alternating-stack" || variant === "list") {
    return wrap(`<div style="display:grid;gap:18px;">
      ${items.map(
      (item, index) => `<article class="hover-lift" style="display:grid;grid-template-columns:84px minmax(0,1fr);gap:22px;padding:28px 0;border-top:1px solid ${OUTLINE};">
          <div style="font-family:'${typography.heading}',serif;font-size:2rem;color:${P};opacity:.64;">${String(
        index + 1
      ).padStart(2, "0")}</div>
          <div>
            <h3 style="font-family:'${typography.heading}',serif;font-size:2rem;letter-spacing:-.03em;color:${TEXT};margin:0 0 10px;">${esc(
        item.title || item.name
      )}</h3>
            <p style="color:${MUTED};line-height:1.75;font-size:1.04rem;margin:0;max-width:760px;">${esc(
        item.description || item.body
      )}</p>
          </div>
        </article>`
    ).join("")}
    </div>`);
  }
  if (variant === "editorial-cards" || variant === "grid") {
    return wrap(`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
      ${items.map(
      (item, index) => `<article class="glass hover-lift" style="padding:34px;border-radius:${radius};">
          <div style="display:inline-flex;width:52px;height:52px;border-radius:16px;align-items:center;justify-content:center;background:rgba(${hexToRgb(
        P
      )},.12);color:${P};font-weight:800;margin-bottom:18px;">${index + 1}</div>
          <h3 style="font-family:'${typography.heading}',serif;font-size:1.7rem;letter-spacing:-.03em;color:${TEXT};margin:0 0 10px;">${esc(
        item.title || item.name
      )}</h3>
          <p style="color:${MUTED};line-height:1.72;font-size:1rem;margin:0;">${esc(
        item.description || item.body
      )}</p>
        </article>`
    ).join("")}
    </div>`);
  }
  return wrap(`<div class="feature-bento" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;">
      ${items.map((item, index) => {
    const span = index === 0 ? "span 2" : index % 3 === 0 ? "span 2" : "span 1";
    return `<article class="hover-lift" style="grid-column:${span};background:${SURF};border:1px solid ${OUTLINE};border-radius:${radius};padding:38px;">
            <div style="font-family:'${typography.heading}',serif;font-size:2.4rem;color:${P};opacity:.42;margin-bottom:16px;">${String(
      index + 1
    ).padStart(2, "0")}</div>
            <h3 style="font-family:'${typography.heading}',serif;font-size:2rem;line-height:.98;letter-spacing:-.035em;color:${TEXT};margin:0 0 12px;">${esc(
      item.title || item.name
    )}</h3>
            <p style="color:${MUTED};line-height:1.72;font-size:1.03rem;margin:0;">${esc(
      item.description || item.body
    )}</p>
          </article>`;
  }).join("")}
    </div>`);
}
function renderGallery(section, context) {
  const { typography, TEXT, MUTED, sectionBg, radius } = context;
  const items = getSectionItems(section).slice(0, 5);
  const title = getSectionValue(section, ["title", "headline"], "Inside The Experience");
  const intro = getSectionValue(
    section,
    ["subheadline", "description"],
    "A visual sense of the work, atmosphere, and detail behind the brand."
  );
  const variant = normalizeVariant(section, "editorial-mosaic");
  if (variant === "stacked-collage" || variant === "collage") {
    return `<!-- wp:html -->
<section class="section-padding" style="background:${sectionBg};">
  <div class="section-shell">
    <div style="margin-bottom:56px;">
      <div class="eyebrow">Gallery</div>
      <h2 class="section-title">${esc(title)}</h2>
      <p class="section-copy">${esc(intro)}</p>
    </div>
    <div class="gallery-stack" style="display:grid;grid-template-columns:1.2fr .8fr;gap:20px;align-items:start;">
      <div style="display:grid;gap:20px;">
        <figure class="hover-lift" style="margin:0;overflow:hidden;border-radius:${radius};"><img src="${esc(
      items[0]?.src || items[0]?.url || ""
    )}" alt="${esc(items[0]?.alt || title)}" style="width:100%;aspect-ratio:4/5;object-fit:cover;" /></figure>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;">
          ${items.slice(1, 3).map(
      (item) => `<figure class="hover-lift" style="margin:0;overflow:hidden;border-radius:${radius};"><img src="${esc(
        item?.src || item?.url || ""
      )}" alt="${esc(item?.alt || title)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;" /></figure>`
    ).join("")}
        </div>
      </div>
      <div style="display:grid;gap:20px;">
        ${items.slice(3, 5).map(
      (item) => `<figure class="hover-lift" style="margin:0;overflow:hidden;border-radius:${radius};"><img src="${esc(
        item?.src || item?.url || ""
      )}" alt="${esc(item?.alt || title)}" style="width:100%;aspect-ratio:${item === items[3] ? "3/4" : "1/1"};object-fit:cover;" /></figure>`
    ).join("")}
      </div>
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
  }
  return `<!-- wp:html -->
<section class="section-padding" style="background:${sectionBg};">
  <div class="section-shell">
    <div style="display:flex;justify-content:space-between;align-items:end;gap:28px;flex-wrap:wrap;margin-bottom:56px;">
      <div>
        <div class="eyebrow">Gallery</div>
        <h2 class="section-title">${esc(title)}</h2>
      </div>
      <p class="section-copy">${esc(intro)}</p>
    </div>
    <div class="gallery-editorial" style="display:grid;grid-template-columns:1.05fr .95fr .75fr;gap:20px;align-items:start;">
      ${items.map(
    (item, index) => `<figure class="hover-lift" style="margin:0;overflow:hidden;border-radius:${radius};grid-column:${index === 0 ? "span 2" : "span 1"};">
          <img src="${esc(item?.src || item?.url || "")}" alt="${esc(
      item?.alt || title
    )}" style="width:100%;aspect-ratio:${index === 0 ? "16/10" : index % 2 === 0 ? "4/5" : "1/1"};object-fit:cover;" />
        </figure>`
  ).join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
}
function renderTestimonials(section, context) {
  const { typography, P, TEXT, MUTED, sectionBg, SURF, OUTLINE, radius } = context;
  const items = getSectionItems(section);
  const title = getSectionValue(section, ["title", "headline"], "What Clients Say");
  const variant = normalizeVariant(section, "floating-cards");
  if (variant === "editorial-quotes" || variant === "spotlight") {
    const lead = items[0];
    const supporting = items.slice(1);
    return `<!-- wp:html -->
<section class="section-padding" style="background:${sectionBg};">
  <div class="section-shell">
    <div style="margin-bottom:56px;text-align:center;">
      <div class="eyebrow">Testimonials</div>
      <h2 class="section-title">${esc(title)}</h2>
    </div>
    <div class="testimonial-featured" style="display:grid;grid-template-columns:1.15fr .85fr;gap:24px;">
      <article class="hover-lift" style="background:${SURF};border:1px solid ${OUTLINE};border-radius:${radius};padding:42px;">
        <div style="font-family:'${typography.heading}',serif;font-size:5rem;color:${P};opacity:.16;line-height:.7;">\u201C</div>
        <p style="font-size:1.36rem;line-height:1.72;color:${TEXT};margin:-14px 0 22px;">${esc(
      lead?.quote || ""
    )}</p>
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:50px;height:50px;border-radius:999px;background:${P};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;">${esc(
      (lead?.author || "A").charAt(0)
    )}</div>
          <div><div style="font-weight:700;color:${TEXT};">${esc(
      lead?.author || "Client"
    )}</div><div style="font-size:.82rem;color:${MUTED};text-transform:uppercase;letter-spacing:.16em;">${esc(
      lead?.role || "Verified Client"
    )}</div></div>
        </div>
      </article>
      <div style="display:grid;gap:20px;">
        ${supporting.map(
      (item) => `<article class="glass hover-lift" style="padding:28px;border-radius:${radius};">
            <p style="font-size:1.02rem;line-height:1.72;color:${TEXT};margin:0 0 14px;">${esc(
        item?.quote || ""
      )}</p>
            <div style="font-weight:700;color:${TEXT};">${esc(
        item?.author || "Client"
      )}</div>
            <div style="font-size:.78rem;color:${P};text-transform:uppercase;letter-spacing:.16em;">${esc(
        item?.role || "Verified Client"
      )}</div>
          </article>`
    ).join("")}
      </div>
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
  }
  return `<!-- wp:html -->
<section class="section-padding" style="background:${sectionBg};">
  <div class="section-shell">
    <div style="margin-bottom:56px;text-align:center;">
      <div class="eyebrow">Testimonials</div>
      <h2 class="section-title">${esc(title)}</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px;">
      ${items.map(
    (item) => `<article class="glass hover-lift" style="padding:34px;border-radius:${radius};position:relative;">
          <div style="font-family:'${typography.heading}',serif;font-size:4rem;color:${P};opacity:.12;line-height:.7;margin-bottom:10px;">\u201C</div>
          <p style="font-size:1.06rem;line-height:1.74;color:${TEXT};margin:0 0 18px;">${esc(
      item?.quote || ""
    )}</p>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:999px;background:${P};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;">${esc(
      (item?.author || "A").charAt(0)
    )}</div>
            <div>
              <div style="font-weight:700;color:${TEXT};">${esc(item?.author || "Client")}</div>
              <div style="font-size:.78rem;color:${MUTED};text-transform:uppercase;letter-spacing:.16em;">${esc(
      item?.role || "Verified Client"
    )}</div>
            </div>
          </div>
        </article>`
  ).join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
}
function renderFaq(section, context) {
  const { typography, P, TEXT, MUTED, sectionBg, SURF, OUTLINE, radius } = context;
  const items = getSectionItems(section);
  const title = getSectionValue(section, ["title", "headline"], "Common Questions");
  const variant = normalizeVariant(section, "cards");
  if (variant === "split-columns" || variant === "grid") {
    return `<!-- wp:html -->
<section class="section-padding" style="background:${sectionBg};">
  <div class="section-shell">
    <div style="margin-bottom:56px;text-align:center;">
      <div class="eyebrow">FAQ</div>
      <h2 class="section-title">${esc(title)}</h2>
    </div>
    <div class="faq-split" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;">
      ${items.map(
      (item) => `<article class="hover-lift" style="background:${SURF};border:1px solid ${OUTLINE};border-radius:${radius};padding:28px;">
          <h4 style="font-family:'${typography.heading}',serif;font-size:1.42rem;letter-spacing:-.02em;color:${TEXT};margin:0 0 10px;">${esc(
        item?.question || item?.title || ""
      )}</h4>
          <p style="font-size:1rem;line-height:1.7;color:${MUTED};margin:0;">${esc(
        item?.answer || item?.description || ""
      )}</p>
        </article>`
    ).join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
  }
  return `<!-- wp:html -->
<section class="section-padding" style="background:${sectionBg};">
  <div class="section-shell" style="max-width:1080px;">
    <div style="margin-bottom:44px;text-align:center;">
      <div class="eyebrow">FAQ</div>
      <h2 class="section-title">${esc(title)}</h2>
    </div>
    <div style="display:grid;gap:14px;">
      ${items.map(
    (item) => `<details class="glass hover-lift" style="padding:24px 28px;border-radius:${radius};">
          <summary style="cursor:pointer;font-weight:700;font-size:1.04rem;color:${TEXT};list-style:none;">${esc(
      item?.question || item?.title || ""
    )}</summary>
          <p style="font-size:1rem;line-height:1.72;color:${MUTED};margin:14px 0 0;">${esc(
      item?.answer || item?.description || ""
    )}</p>
        </details>`
  ).join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
}
function renderCta(section, context) {
  const { typography, P, TEXT, ACCENT, radius } = context;
  const title = getSectionValue(section, ["title", "headline"], "Ready To Take The Next Step?");
  const body = getSectionValue(
    section,
    ["body", "description", "subheadline"],
    "Reach out and start the conversation."
  );
  const label = getSectionValue(section, ["buttonLabel"], "Contact Us");
  const href = getSectionValue(section, ["buttonHref"], "#contact");
  const variant = normalizeVariant(section, "gradient-band");
  if (variant === "split-card" || variant === "side-by-side") {
    return `<!-- wp:html -->
<section class="section-padding" style="background:linear-gradient(135deg,rgba(${hexToRgb(
      P
    )},.14),rgba(${hexToRgb(
      ACCENT
    )},.18));">
  <div class="section-shell cta-split" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:30px;align-items:center;background:#fff;border:1px solid rgba(${hexToRgb(
      P
    )},.12);border-radius:${radius};padding:42px;">
    <div>
      <div class="eyebrow">Call To Action</div>
      <h2 class="section-title" style="margin-top:18px;">${esc(title)}</h2>
      <p class="section-copy">${esc(body)}</p>
    </div>
    <div>${buttonHtml(label, href)}</div>
  </div>
</section>
<!-- /wp:html -->

`;
  }
  return `<!-- wp:html -->
<section class="section-padding" style="background:linear-gradient(135deg,${P},${ACCENT});position:relative;overflow:hidden;">
  <div class="shape-orb" style="width:220px;height:220px;top:-60px;right:-40px;background:rgba(255,255,255,.12)"></div>
  <div class="shape-orb" style="width:180px;height:180px;bottom:-40px;left:-50px;background:rgba(255,255,255,.08)"></div>
  <div class="section-shell animate-up" style="text-align:center;position:relative;z-index:2;max-width:900px;">
    <div class="eyebrow" style="background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);color:#fff">Call To Action</div>
    <h2 style="font-family:'${typography.heading}',serif;font-size:clamp(2.8rem,6vw,5rem);line-height:.92;letter-spacing:-.05em;color:#fff;margin:24px 0 16px;">${esc(
    title
  )}</h2>
    <p style="font-size:1.18rem;line-height:1.72;color:rgba(255,255,255,.86);max-width:640px;margin:0 auto 32px;">${esc(
    body
  )}</p>
    ${buttonHtml(
    label,
    href,
    `background:#fff!important;color:${P}!important;border-radius:${radius}!important`
  )}
  </div>
</section>
<!-- /wp:html -->

`;
}
function renderContact(section, context) {
  const { typography, P, TEXT, MUTED, sectionBg, SURF, OUTLINE, radius, brand } = context;
  const title = getSectionValue(section, ["title", "headline"], "Visit Or Reach Out");
  const body = getSectionValue(
    section,
    ["body", "description", "subheadline"],
    "We're ready when you are."
  );
  const variant = normalizeVariant(section, "split-card");
  const contactFacts = [
    brand.phone ? `<div><div style="font-size:.74rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${P};margin-bottom:8px;">Phone</div><div style="font-size:1.18rem;color:${TEXT};">${esc(
      brand.phone
    )}</div></div>` : "",
    brand.email && brand.email.includes("@") && !/^none|n\/a$/i.test(brand.email) ? `<div><div style="font-size:.74rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${P};margin-bottom:8px;">Email</div><div style="font-size:1.18rem;color:${TEXT};">${esc(
      brand.email
    )}</div></div>` : "",
    brand.address ? `<div><div style="font-size:.74rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${P};margin-bottom:8px;">Address</div><div style="font-size:1.06rem;line-height:1.68;color:${TEXT};">${esc(
      brand.address
    )}</div></div>` : ""
  ].filter(Boolean).join("");
  if (variant === "minimal-centered" || variant === "centered") {
    return `<!-- wp:html -->
<section id="contact" class="section-padding" style="background:${sectionBg};">
  <div class="section-shell" style="max-width:960px;text-align:center;">
    <div class="eyebrow">Contact</div>
    <h2 class="section-title" style="margin-top:18px;">${esc(title)}</h2>
    <p class="section-copy" style="margin:0 auto 34px;">${esc(body)}</p>
    <div style="display:grid;gap:18px;justify-items:center;">
      ${contactFacts}
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
  }
  return `<!-- wp:html -->
<section id="contact" class="section-padding" style="background:${sectionBg};">
  <div class="section-shell contact-grid" style="display:grid;grid-template-columns:minmax(0,.9fr) minmax(340px,.8fr);gap:28px;align-items:start;">
    <div class="animate-up">
      <div class="eyebrow">Contact</div>
      <h2 class="section-title" style="margin-top:18px;">${esc(title)}</h2>
      <p class="section-copy" style="margin-bottom:32px;">${esc(body)}</p>
      <div style="display:grid;gap:24px;">${contactFacts}</div>
    </div>
    <div class="glass animate-scale" style="padding:32px;border-radius:${radius};">
      <h3 style="font-family:'${typography.heading}',serif;font-size:1.9rem;letter-spacing:-.03em;color:${TEXT};margin:0 0 18px;">Send A Message</h3>
      <div style="display:grid;gap:14px;">
        <div style="height:54px;border-radius:14px;background:rgba(${hexToRgb(
    P
  )},.06);border:1px solid ${OUTLINE};"></div>
        <div style="height:54px;border-radius:14px;background:rgba(${hexToRgb(
    P
  )},.06);border:1px solid ${OUTLINE};"></div>
        <div style="height:148px;border-radius:14px;background:rgba(${hexToRgb(
    P
  )},.06);border:1px solid ${OUTLINE};"></div>
        <div style="margin-top:6px;">${buttonHtml("Send Enquiry", "#")}</div>
      </div>
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
}
var init_premium_site_builder = __esm({
  "src/lib/premium-site-builder.ts"() {
  }
});

// src/lib/layout-registry.ts
var HERO_LAYOUTS, FEATURES_LAYOUTS, GALLERY_LAYOUTS, TESTIMONIALS_LAYOUTS, CTA_LAYOUTS, FAQ_LAYOUTS, CONTACT_LAYOUTS;
var init_layout_registry = __esm({
  "src/lib/layout-registry.ts"() {
    HERO_LAYOUTS = [
      "immersive-split",
      "minimal-centered",
      "editorial-left",
      "stacked-media",
      "luxury-overlap",
      "split-modern-dark",
      "centered-glass"
    ];
    FEATURES_LAYOUTS = [
      "bento-grid",
      "alternating-stack",
      "icon-list",
      "feature-cards",
      "editorial-rows",
      "masonry-grid"
    ];
    GALLERY_LAYOUTS = [
      "masonry-cinematic",
      "asymmetrical-overlap",
      "standard-grid",
      "collage-editorial"
    ];
    TESTIMONIALS_LAYOUTS = [
      "floating-cards",
      "editorial-quotes",
      "timeline-scroll",
      "split-highlight"
    ];
    CTA_LAYOUTS = [
      "centered-premium",
      "side-by-side-split",
      "immersive-banner",
      "minimal-inline"
    ];
    FAQ_LAYOUTS = ["accordion-clean", "split-columns"];
    CONTACT_LAYOUTS = ["split-card", "minimal-centered"];
  }
});

// src/lib/website-schema-validator.ts
var website_schema_validator_exports = {};
__export(website_schema_validator_exports, {
  validateWebsiteSchema: () => validateWebsiteSchema
});
function validateWebsiteSchema(schema) {
  const errors = [];
  const repairs = [];
  if (!schema) {
    return { isValid: false, errors: ["Schema is null or undefined"] };
  }
  if (schema.schemaVersion !== "1.0") {
    schema.schemaVersion = "1.0";
    repairs.push("version_forced_1.0");
  }
  if (!schema.meta || !schema.theme || !schema.brand || !Array.isArray(schema.sections)) {
    return { isValid: false, errors: ["Missing core top-level objects (meta, theme, brand, sections)"] };
  }
  const repairedSections = schema.sections.map((section, index) => {
    const type = (section.type || "unknown").toLowerCase();
    section.type = type;
    const validateLayout = (layout, allowed, fallback) => {
      if (!allowed.includes(layout)) {
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
  const sectionTypes = repairedSections.map((s) => s.type);
  if (sectionTypes[0] !== "hero") {
    errors.push("Layout sequencing error: Hero must be first");
    const heroIdx = repairedSections.findIndex((s) => s.type === "hero");
    if (heroIdx > 0) {
      const hero = repairedSections.splice(heroIdx, 1)[0];
      repairedSections.unshift(hero);
      repairs.push("hero_moved_to_front");
    }
  }
  if (sectionTypes[sectionTypes.length - 1] !== "contact") {
    errors.push("Layout sequencing error: Contact must be last");
    const contactIdx = repairedSections.findIndex((s) => s.type === "contact");
    if (contactIdx >= 0 && contactIdx < repairedSections.length - 1) {
      const contact = repairedSections.splice(contactIdx, 1)[0];
      repairedSections.push(contact);
      repairs.push("contact_moved_to_back");
    }
  }
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
        validatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    }
  };
}
var init_website_schema_validator = __esm({
  "src/lib/website-schema-validator.ts"() {
    init_layout_registry();
  }
});

// src/lib/env.ts
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var cwd = process.cwd();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var bundleRoot = path.resolve(__dirname, "../");
var searchPaths = [cwd, bundleRoot];
var envFiles = [".env.production", ".env.local", ".env"];
console.error(`[Env] Searching in: ${searchPaths.join(", ")}`);
try {
  const files = fs.readdirSync(cwd);
  console.error(`[Env] Files found in ${cwd}: ${files.join(", ")}`);
} catch (e) {
  console.error(`[Env] Could not list files in ${cwd}: ${e.message}`);
}
for (const root of searchPaths) {
  for (const file of envFiles) {
    const fullPath = path.join(root, file);
    if (fs.existsSync(fullPath)) {
      console.error(`[Env] Found environment file: ${fullPath}`);
      const result = dotenv.config({ path: fullPath });
      if (result.error) {
        console.error(`[Env] Error parsing ${fullPath}: ${result.error.message}`);
      } else {
        console.error(`[Env] Successfully loaded ${fullPath}`);
      }
    }
  }
}
if (!process.env.DB_USER) {
  console.error("[Env] WARNING: DB_USER is not set after loading environment files.");
} else {
  console.error(`[Env] DB_USER is set to: ${process.env.DB_USER}`);
}
var env_default = process.env;

// server.ts
import crypto2 from "crypto";
import cors from "cors";
import express from "express";
import fs2 from "fs";
import path2 from "path";

// src/lib/callhippo-service.ts
async function sendOutreachViaCallHippo(request, apiKey) {
  const { businessName, phoneNumber, message, preferredChannel } = request;
  const TEST_MOCK = process.env.CALLHIPPO_TEST_MOCK === "true";
  const TEST_TARGET = process.env.CALLHIPPO_TEST_TARGET;
  const FORCE_SUCCESS = process.env.CALLHIPPO_FORCE_SUCCESS === "true";
  if (TEST_MOCK) {
    const target = TEST_TARGET || phoneNumber;
    console.log(
      `[CallHippo][MOCK] Pretending to send ${preferredChannel} to ${target} for ${businessName}`
    );
    return {
      success: true,
      channel: preferredChannel,
      messageId: `mock-${Date.now()}`,
      status: "mocked"
    };
  }
  console.log(
    `[CallHippo] Outreach request for ${businessName} (${phoneNumber}) via ${preferredChannel}`
  );
  if (preferredChannel === "whatsapp") {
    try {
      const result = await sendWhatsAppMessage(phoneNumber, message, apiKey);
      if (result.success) {
        console.log(`[CallHippo] WhatsApp sent successfully to ${phoneNumber}`);
        return result;
      }
    } catch (whatsappError) {
      console.warn(
        `[CallHippo] WhatsApp failed for ${phoneNumber}, falling back to SMS:`,
        whatsappError instanceof Error ? whatsappError.message : whatsappError
      );
    }
  }
  try {
    const result = await sendSmsMessage(phoneNumber, message, apiKey);
    if (result.success) {
      console.log(`[CallHippo] SMS sent successfully to ${phoneNumber}`);
      return result;
    }
    if (FORCE_SUCCESS) {
      console.warn(
        `[CallHippo][FORCE_SUCCESS] Returning demo success for ${phoneNumber}`
      );
      return {
        success: true,
        channel: preferredChannel,
        messageId: `forced-${Date.now()}`,
        status: "forced-success"
      };
    }
    return result;
  } catch (smsError) {
    const errorMsg = smsError instanceof Error ? smsError.message : String(smsError);
    console.error(`[CallHippo] SMS also failed for ${phoneNumber}:`, errorMsg);
    if (FORCE_SUCCESS) {
      console.warn(
        `[CallHippo][FORCE_SUCCESS] API failed, returning demo success for ${phoneNumber}`
      );
      return {
        success: true,
        channel: preferredChannel,
        messageId: `forced-${Date.now()}`,
        status: "forced-success"
      };
    }
    return {
      success: false,
      channel: "sms",
      error: `SMS delivery failed: ${errorMsg}`
    };
  }
}
async function sendWhatsAppMessage(phoneNumber, message, apiKey) {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const url = "https://api.callhippo.com/v1/whatsapp/send";
  const payload = {
    to: formattedPhone,
    message
  };
  console.log(`[CallHippo] Attempting WhatsApp to ${formattedPhone}`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `[CallHippo] WhatsApp API returned ${response.status}:`,
        errorText
      );
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`WhatsApp not available: ${response.statusText}`);
      }
      throw new Error(
        `WhatsApp API error: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    console.log(`[CallHippo] WhatsApp success response:`, data);
    return {
      success: true,
      channel: "whatsapp",
      messageId: data.id || data.messageId,
      status: data.status || "sent"
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[CallHippo] WhatsApp error:`, errorMsg);
    throw error;
  }
}
async function sendSmsMessage(phoneNumber, message, apiKey) {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const url = "https://api.callhippo.com/v1/sms/send";
  const payload = {
    to: formattedPhone,
    message
  };
  console.log(`[CallHippo] Attempting SMS to ${formattedPhone}`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `[CallHippo] SMS API returned ${response.status}:`,
        errorText
      );
      throw new Error(
        `SMS API error: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    console.log(`[CallHippo] SMS success response:`, data);
    return {
      success: true,
      channel: "sms",
      messageId: data.id || data.messageId,
      status: data.status || "sent"
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[CallHippo] SMS error:`, errorMsg);
    throw error;
  }
}
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  if (!cleaned.startsWith("+")) {
    return `+1${cleaned.replace(/^1/, "")}`;
  }
  return cleaned;
}

// src/lib/db.ts
import mysql from "mysql2/promise";
var pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "digitalscout",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
console.error(`[DB] Pool initialized. User: ${process.env.DB_USER || "root (default)"}, Host: ${process.env.DB_HOST || "127.0.0.1"}`);
async function initializeDatabase() {
  try {
    await pool.query(`
			CREATE TABLE IF NOT EXISTS provisioning_jobs (
				id VARCHAR(255) PRIMARY KEY,
				project_id VARCHAR(255) NOT NULL,
				business_name VARCHAR(255) NULL,
				website_schema JSON NULL,
				status ENUM('lead', 'pending', 'creating_subdomain', 'creating_database', 'installing_wordpress', 'configuring_wordpress', 'deploying_content', 'validating', 'completed', 'failed') DEFAULT 'lead',
				subdomain VARCHAR(255) NULL,
				db_name VARCHAR(255) NULL,
				db_user VARCHAR(255) NULL,
				db_pass_encrypted TEXT NULL,
				wp_admin_user VARCHAR(255) NULL,
				wp_admin_pass_encrypted TEXT NULL,
				retry_count INT DEFAULT 0,
				locked_at DATETIME NULL,
				logs JSON NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				trace_id VARCHAR(255) NULL,
				is_preview BOOLEAN DEFAULT FALSE,
				preview_expires_at DATETIME NULL,
				generation_metrics JSON NULL,
				gutenberg_trace LONGTEXT NULL,
				raw_ai_trace JSON NULL,
				INDEX idx_status (status),
				INDEX idx_project (project_id),
				INDEX idx_trace (trace_id),
				INDEX idx_preview_expiry (preview_expires_at)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    await pool.query(`
			CREATE TABLE IF NOT EXISTS generation_audit_logs (
				id INT AUTO_INCREMENT PRIMARY KEY,
				trace_id VARCHAR(255) NOT NULL,
				step VARCHAR(100) NOT NULL,
				message TEXT NOT NULL,
				data JSON NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				INDEX idx_trace (trace_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    try {
      await pool.query(`ALTER TABLE provisioning_jobs MODIFY COLUMN status ENUM('lead', 'pending', 'creating_subdomain', 'creating_database', 'installing_wordpress', 'configuring_wordpress', 'deploying_content', 'validating', 'completed', 'failed') DEFAULT 'lead'`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN website_schema JSON NULL AFTER business_name`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN db_pass_encrypted TEXT NULL AFTER db_user`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN business_name VARCHAR(255) NULL AFTER project_id`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN trace_id VARCHAR(255) NULL AFTER updated_at`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN is_preview BOOLEAN DEFAULT FALSE AFTER trace_id`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN preview_expires_at DATETIME NULL AFTER is_preview`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN generation_metrics JSON NULL AFTER preview_expires_at`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN gutenberg_trace LONGTEXT NULL AFTER generation_metrics`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN raw_ai_trace JSON NULL AFTER gutenberg_trace`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD INDEX idx_trace (trace_id)`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD INDEX idx_preview_expiry (preview_expires_at)`);
    } catch (e) {
    }
    await pool.query(`
			CREATE TABLE IF NOT EXISTS isolated_deployments (
				id VARCHAR(255) PRIMARY KEY,
				project_id VARCHAR(255) NOT NULL,
				subdomain_url VARCHAR(255) NOT NULL,
				wp_admin_url VARCHAR(255) NOT NULL,
				admin_username VARCHAR(255) NOT NULL,
				encrypted_admin_password TEXT NOT NULL,
				website_schema JSON NULL,
				ssl_status ENUM('pending', 'valid') DEFAULT 'pending',
				last_ssl_check DATETIME NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				UNIQUE KEY uk_project (project_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    try {
      await pool.query(`ALTER TABLE isolated_deployments ADD COLUMN website_schema JSON NULL AFTER encrypted_admin_password`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE isolated_deployments ADD COLUMN ssl_status ENUM('pending', 'valid') DEFAULT 'pending' AFTER website_schema`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE isolated_deployments ADD COLUMN last_ssl_check DATETIME NULL AFTER ssl_status`);
    } catch (e) {
    }
    console.log("[DB] Provisioning schema initialized successfully.");
  } catch (error) {
    console.error("[DB] Failed to initialize schema:", error);
  }
}

// src/lib/provisioning-engine.ts
import crypto from "crypto";

// src/lib/cpanel-uapi.ts
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
function getSshPrefix() {
  const host = process.env.WP_SSH_HOST;
  const port = process.env.WP_SSH_PORT || "22";
  const user = process.env.WP_SSH_USER;
  const keyPath = process.env.WP_SSH_KEY_PATH || "";
  if (!host || !user) {
    throw new Error(
      "WP_SSH_HOST and WP_SSH_USER must be set to run cPanel UAPI commands remotely."
    );
  }
  const keyFlag = keyPath ? `-i "${keyPath}"` : "";
  return [
    "ssh",
    "-p",
    port,
    keyFlag,
    "-o StrictHostKeyChecking=no",
    "-o ConnectTimeout=30",
    "-o BatchMode=yes",
    `${user}@${host}`
  ].filter(Boolean).join(" ");
}
async function callUapiRemote(module, func, params) {
  const paramStr = Object.entries(params).map(([k, v]) => `${k}=${v.replace(/'/g, "\\'")}`).join(" ");
  const uapiCmd = `uapi --output=json ${module} ${func} ${paramStr}`;
  const sshPrefix = getSshPrefix();
  const fullCmd = `${sshPrefix} '${uapiCmd}'`;
  process.stderr.write(`[cPanel-SSH] ${module}::${func} ${paramStr}
`);
  try {
    const { stdout, stderr } = await execAsync(fullCmd, { timeout: 6e4 });
    if (stderr.trim()) {
      process.stderr.write(`[cPanel-SSH] STDERR: ${stderr.trim()}
`);
    }
    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch (e) {
      throw new Error(`cPanel UAPI returned invalid JSON: ${stdout.substring(0, 300)}`);
    }
    const result = parsed?.result;
    if (!result) {
      throw new Error(`Unexpected cPanel UAPI response shape: ${JSON.stringify(parsed).substring(0, 300)}`);
    }
    if (result.status === 0 || result.errors && result.errors.length > 0) {
      const errMsg = Array.isArray(result.errors) ? result.errors.join(", ") : "Unknown cPanel error";
      throw new Error(`cPanel UAPI Error (${module}::${func}): ${errMsg}`);
    }
    process.stderr.write(`[cPanel-SSH] ${module}::${func} \u2192 OK
`);
    return result.data;
  } catch (error) {
    if (error.message?.includes("cPanel UAPI")) throw error;
    throw new Error(`cPanel SSH command failed (${module}::${func}): ${error.message}`);
  }
}
async function addSubdomain(subdomain, rootDomain, documentRoot) {
  const cpanelUser = process.env.CPANEL_USERNAME || "";
  const homePrefix = `/home/${cpanelUser}/`;
  const relativeDir = documentRoot.startsWith(homePrefix) ? documentRoot.slice(homePrefix.length) : documentRoot;
  return callUapiRemote("SubDomain", "addsubdomain", {
    domain: subdomain,
    rootdomain: rootDomain,
    dir: relativeDir
  });
}
async function deleteSubdomain(subdomain, rootDomain) {
  const fullDomain = `${subdomain}.${rootDomain}`;
  process.stderr.write(`[cPanel-SSH] Attempting to delete domain/subdomain: ${fullDomain}
`);
  try {
    await callUapiRemote("Domains", "remove_domain", {
      domain: fullDomain
    });
    return true;
  } catch (e) {
    console.warn(`[cPanel-SSH] Domains::remove_domain failed: ${e.message}. Trying legacy fallback...`);
  }
  try {
    await callUapiRemote("SubDomain", "delsubdomain", {
      domain: subdomain,
      rootdomain: rootDomain
    });
    return true;
  } catch (e) {
    console.warn(`[cPanel-SSH] SubDomain::delsubdomain (sub part) failed: ${e.message}. Trying full domain variant...`);
  }
  try {
    await callUapiRemote("SubDomain", "delsubdomain", {
      domain: fullDomain,
      rootdomain: rootDomain
    });
    return true;
  } catch (e) {
    console.warn(`[cPanel-SSH] SubDomain::delsubdomain (full part) failed: ${e.message}.`);
  }
  try {
    await callUapiRemote("SubDomain", "delete_subdomain", {
      domain: subdomain,
      rootdomain: rootDomain
    });
    return true;
  } catch (e) {
    console.warn(`[cPanel-SSH] SubDomain::delete_subdomain failed: ${e.message}.`);
  }
  try {
    const sshPrefix = getSshPrefix();
    const cpapi2Cmd = `cpapi2 --output=json SubDomain delsubdomain domain=${subdomain} rootdomain=${rootDomain}`;
    const fullCmd = `${sshPrefix} '${cpapi2Cmd}'`;
    process.stderr.write(`[cPanel-SSH] Attempting cpapi2 fallback for delsubdomain...
`);
    await execAsync(fullCmd, { timeout: 6e4 });
    return true;
  } catch (e) {
    console.warn(`[cPanel-SSH] cpapi2 SubDomain::delsubdomain failed: ${e.message}`);
  }
  try {
    await callUapiRemote("DomainInfo", "delete_domain", {
      domain: fullDomain
    });
    return true;
  } catch (e) {
    console.error(`[cPanel-SSH] All subdomain deletion methods failed for ${fullDomain}. Final error: ${e.message}`);
    throw e;
  }
}
async function createDatabase(dbName) {
  return callUapiRemote("Mysql", "create_database", { name: dbName });
}
async function deleteDatabase(dbName) {
  return callUapiRemote("Mysql", "delete_database", { name: dbName });
}
async function createDatabaseUser(dbUser, password) {
  return callUapiRemote("Mysql", "create_user", {
    name: dbUser,
    password
  });
}
async function deleteDatabaseUser(dbUser) {
  return callUapiRemote("Mysql", "delete_user", { name: dbUser });
}
async function setDatabasePrivileges(dbUser, dbName, privileges = "ALL PRIVILEGES") {
  return callUapiRemote("Mysql", "set_privileges_on_database", {
    user: dbUser,
    database: dbName,
    privileges
  });
}

// src/lib/wp-cli.ts
import { exec as exec2 } from "child_process";
import { promisify as promisify2 } from "util";
var execAsync2 = promisify2(exec2);
var WpCliError = class extends Error {
  constructor(message, stdout, stderr, code) {
    super(message);
    this.name = "WpCliError";
    this.stdout = stdout;
    this.stderr = stderr;
    this.code = code;
  }
};
function getSshConfig() {
  const host = process.env.WP_SSH_HOST;
  const port = process.env.WP_SSH_PORT || "22";
  const user = process.env.WP_SSH_USER;
  const keyPath = process.env.WP_SSH_KEY_PATH || "";
  const wpCliPath = process.env.WP_CLI_PATH || "wp";
  return { host, port, user, keyPath, wpCliPath };
}
async function executeRemoteCommand(remoteCommand, logCallback) {
  const { host, port, user, keyPath, wpCliPath: _wpCliPath } = getSshConfig();
  let cmd;
  if (host && user) {
    const escapedCmd = remoteCommand.replace(/'/g, `'\\''`);
    const keyFlag = keyPath ? `-i "${keyPath}"` : "";
    cmd = [
      "ssh",
      "-p",
      port,
      keyFlag,
      "-o StrictHostKeyChecking=no",
      "-o ConnectTimeout=30",
      "-o ServerAliveInterval=60",
      "-o BatchMode=yes",
      `${user}@${host}`,
      `'${escapedCmd}'`
    ].filter(Boolean).join(" ");
    if (logCallback) {
      logCallback(`[SSH\u2192${host}] ${remoteCommand.replace(/--dbpass=[^\s'"]+/g, "--dbpass=***").replace(/--admin_password=[^\s'"]+/g, "--admin_password=***")}`);
    }
    process.stderr.write(`[SSH] RUNNING: ${cmd.replace(/--dbpass=[^\s'"]+/g, "--dbpass=***").replace(/--admin_password=[^\s'"]+/g, "--admin_password=***")}
`);
  } else {
    cmd = remoteCommand;
    if (logCallback) logCallback(`[LOCAL] ${cmd}`);
    process.stderr.write(`[LOCAL] RUNNING: ${cmd}
`);
  }
  try {
    const { stdout, stderr } = await execAsync2(cmd, {
      timeout: 18e4,
      // 3 min max per command
      maxBuffer: 10 * 1024 * 1024,
      // 10MB
      env: { ...process.env }
    });
    if (stdout.trim()) {
      process.stderr.write(`[SSH] STDOUT: ${stdout.trim().substring(0, 1e3)}
`);
      if (logCallback) logCallback(`[WP-CLI] STDOUT: ${stdout.trim()}`);
    }
    if (stderr.trim()) {
      process.stderr.write(`[SSH] STDERR: ${stderr.trim()}
`);
      if (logCallback) logCallback(`[WP-CLI] STDERR: ${stderr.trim()}`);
    }
    return { stdout, stderr };
  } catch (error) {
    const stdout = error.stdout || "";
    const stderr = error.stderr || "";
    process.stderr.write(`[SSH] FAILED: ${error.message}
`);
    if (stderr) process.stderr.write(`[SSH] STDERR_OUT: ${stderr}
`);
    if (logCallback) {
      logCallback(`[WP-CLI] FAILED: ${error.message}`);
      if (stdout) logCallback(`[WP-CLI] STDOUT: ${stdout}`);
      if (stderr) logCallback(`[WP-CLI] STDERR: ${stderr}`);
    }
    throw new WpCliError(
      `WP-CLI remote command failed: ${remoteCommand.substring(0, 120)}`,
      stdout,
      stderr,
      error.code
    );
  }
}
async function checkWpCliAvailable() {
  const { wpCliPath } = getSshConfig();
  try {
    const { stdout } = await executeRemoteCommand(`${wpCliPath} --version --allow-root`);
    return {
      available: true,
      version: stdout.trim(),
      path: wpCliPath
    };
  } catch (e) {
    return {
      available: false,
      error: `WP-CLI not reachable on remote server: ${e.message}`
    };
  }
}
async function runWpCommand(command, documentRoot, logCallback) {
  const { wpCliPath } = getSshConfig();
  const fullCommand = `${wpCliPath} ${command} --path="${documentRoot}" --allow-root`;
  return executeRemoteCommand(fullCommand, logCallback);
}
async function downloadWordPressCore(documentRoot, logCallback) {
  await executeRemoteCommand(`mkdir -p "${documentRoot}"`, logCallback);
  return runWpCommand("core download", documentRoot, logCallback);
}
async function createWpConfig(documentRoot, dbName, dbUser, dbPass, dbHost = "localhost", logCallback) {
  return runWpCommand(
    `config create --dbname="${dbName}" --dbuser="${dbUser}" --dbpass="${dbPass}" --dbhost="${dbHost}" --extra-php="define('WP_DEBUG', false); define('WP_DEBUG_LOG', false);" --force`,
    documentRoot,
    logCallback
  );
}
async function installWordPress(documentRoot, url, title, adminUser, adminPassword, adminEmail, logCallback) {
  const safeTitle = title.replace(/'/g, `'\\''`);
  return runWpCommand(
    `core install --url="${url}" --title='${safeTitle}' --admin_user="${adminUser}" --admin_password="${adminPassword}" --admin_email="${adminEmail}" --skip-email`,
    documentRoot,
    logCallback
  );
}
async function configurePermalinks(documentRoot, structure = "/%postname%/", logCallback) {
  return runWpCommand(`rewrite structure "${structure}"`, documentRoot, logCallback);
}
async function runRemoteShellCommand(command, logCallback) {
  return executeRemoteCommand(command, logCallback);
}

// src/lib/provisioning-engine.ts
var MAX_RETRIES = 3;
var MAX_SUBDOMAIN_LENGTH = 45;
var SUBDOMAIN_SEMANTIC_VARIANTS = ["-shop", "-store", "-official", "-co", "-pro"];
function sanitizeSubdomainBase(name) {
  return (name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").substring(0, 40);
}
async function isSubdomainTaken(subdomain) {
  const [rows] = await pool.query(
    `SELECT id FROM provisioning_jobs
		 WHERE subdomain = ? AND status NOT IN ('failed', 'cleaned')
		 LIMIT 1`,
    [subdomain]
  );
  return rows && rows.length > 0;
}
async function generateUniqueSubdomain(businessName) {
  const base = sanitizeSubdomainBase(businessName);
  if (!base) {
    return `site-${crypto.randomBytes(3).toString("hex")}`;
  }
  if (!await isSubdomainTaken(base)) {
    return base;
  }
  for (let i = 1; i <= 5; i++) {
    const candidate = `${base}-${i}`.substring(0, MAX_SUBDOMAIN_LENGTH);
    if (!await isSubdomainTaken(candidate)) {
      return candidate;
    }
  }
  for (const suffix of SUBDOMAIN_SEMANTIC_VARIANTS) {
    const candidate = `${base}${suffix}`.substring(0, MAX_SUBDOMAIN_LENGTH);
    if (!await isSubdomainTaken(candidate)) {
      return candidate;
    }
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = crypto.randomBytes(2).toString("hex");
    const candidate = `${base}-${suffix}`.substring(0, MAX_SUBDOMAIN_LENGTH);
    if (!await isSubdomainTaken(candidate)) {
      return candidate;
    }
  }
  return `${base}-${crypto.randomBytes(4).toString("hex")}`.substring(0, MAX_SUBDOMAIN_LENGTH);
}
function generateSecurePassword() {
  return crypto.randomBytes(16).toString("hex") + "!aA1";
}
function encrypt(text) {
  const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}
function decrypt(encryptedValue) {
  const [ivHex, encHex] = encryptedValue.split(":");
  const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), Buffer.from(ivHex, "hex"));
  let decrypted = decipher.update(Buffer.from(encHex, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
async function appendLog(jobId, message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(`[Job ${jobId}] ${message}`);
  await pool.query(
    `UPDATE provisioning_jobs SET logs = JSON_ARRAY_APPEND(COALESCE(logs, JSON_ARRAY()), '$', ?) WHERE id = ?`,
    [logEntry, jobId]
  );
}
async function processJob(jobId) {
  const [rows] = await pool.query(`SELECT * FROM provisioning_jobs WHERE id = ?`, [jobId]);
  if (!rows || rows.length === 0) return;
  const job = rows[0];
  if (job.status === "completed" || job.status === "failed") return;
  try {
    await executeStateMachine(job);
  } catch (error) {
    await appendLog(job.id, `ERROR: ${error.message}`);
    if (job.retry_count < MAX_RETRIES) {
      await appendLog(job.id, `Retrying later (Attempt ${job.retry_count + 1}/${MAX_RETRIES})`);
      await pool.query(`UPDATE provisioning_jobs SET retry_count = retry_count + 1, locked_at = NULL WHERE id = ?`, [job.id]);
    } else {
      await appendLog(job.id, `Max retries reached. Initiating rollback.`);
      await rollbackJob(job);
      await pool.query(`UPDATE provisioning_jobs SET status = 'failed', locked_at = NULL WHERE id = ?`, [job.id]);
    }
  }
}
async function executeStateMachine(job) {
  const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscoutwp.online";
  const docRootBase = process.env.WP_DOCROOT_BASE || "/home/digigesf/public_html/sites";
  let subdomain = job.subdomain;
  let dbName = job.db_name;
  let dbUser = job.db_user;
  let wpAdminUser = job.wp_admin_user || "admin";
  let wpAdminPass = job.wp_admin_pass_encrypted;
  if (job.status === "pending" || job.status === "creating_subdomain") {
    await pool.query(`UPDATE provisioning_jobs SET status = 'creating_subdomain' WHERE id = ?`, [job.id]);
    await appendLog(job.id, "Starting subdomain creation on remote WP server");
    if (!subdomain) {
      const name = job.business_name || job.project_id;
      subdomain = await generateUniqueSubdomain(name);
      await appendLog(job.id, `Generated subdomain: "${subdomain}"`);
      await pool.query(`UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`, [subdomain, job.id]);
    }
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    await appendLog(job.id, `Remote doc root will be: ${fullDocRoot}`);
    await addSubdomain(subdomain, rootDomain, fullDocRoot);
    await appendLog(job.id, `Created subdomain: ${subdomain}.${rootDomain} \u2192 ${fullDocRoot}`);
    job.status = "creating_database";
  }
  if (job.status === "creating_database") {
    await pool.query(`UPDATE provisioning_jobs SET status = 'creating_database' WHERE id = ?`, [job.id]);
    await appendLog(job.id, "Creating database on remote WP server cPanel");
    const dbPrefix = process.env.CPANEL_USERNAME ? `${process.env.CPANEL_USERNAME}_` : "db_";
    if (!dbName) {
      const suffix = crypto.randomBytes(4).toString("hex");
      dbName = `${dbPrefix}${suffix}`.substring(0, 64);
      dbUser = `${dbPrefix}u${suffix}`.substring(0, 32);
      await pool.query(`UPDATE provisioning_jobs SET db_name = ?, db_user = ? WHERE id = ?`, [dbName, dbUser, job.id]);
    }
    const dbPassword = generateSecurePassword();
    await createDatabase(dbName);
    await createDatabaseUser(dbUser, dbPassword);
    await setDatabasePrivileges(dbUser, dbName);
    await pool.query(`UPDATE provisioning_jobs SET db_pass_encrypted = ? WHERE id = ?`, [encrypt(dbPassword), job.id]);
    job._tempDbPass = dbPassword;
    await appendLog(job.id, `Created remote database: ${dbName} and user: ${dbUser}`);
    job.status = "installing_wordpress";
  }
  if (job.status === "installing_wordpress") {
    await pool.query(`UPDATE provisioning_jobs SET status = 'installing_wordpress' WHERE id = ?`, [job.id]);
    await appendLog(job.id, "Starting remote WordPress installation via SSH/WP-CLI");
    let dbPassword = job._tempDbPass;
    if (!dbPassword && job.db_pass_encrypted) {
      try {
        dbPassword = decrypt(job.db_pass_encrypted);
      } catch (e) {
        throw new Error(`Failed to decrypt DB password: ${e.message}`);
      }
    }
    if (!dbPassword) {
      throw new Error("Database password missing. Cannot install WordPress.");
    }
    const wpCliStatus = await checkWpCliAvailable();
    if (!wpCliStatus.available) {
      throw new Error(`WP-CLI not reachable on remote server: ${wpCliStatus.error}`);
    }
    await appendLog(job.id, `WP-CLI available: ${wpCliStatus.version}`);
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    await appendLog(job.id, `Creating remote directory: ${fullDocRoot}`);
    await runRemoteShellCommand(`mkdir -p "${fullDocRoot}"`, (log) => appendLog(job.id, log));
    await downloadWordPressCore(fullDocRoot, (log) => appendLog(job.id, log));
    if (!wpAdminPass) {
      const rawPass = generateSecurePassword();
      wpAdminPass = encrypt(rawPass);
      job._tempAdminPass = rawPass;
      await pool.query(
        `UPDATE provisioning_jobs SET wp_admin_user = ?, wp_admin_pass_encrypted = ? WHERE id = ?`,
        [wpAdminUser, wpAdminPass, job.id]
      );
    }
    await createWpConfig(fullDocRoot, dbName, dbUser, dbPassword, "localhost", (log) => appendLog(job.id, log));
    const rawAdminPass = job._tempAdminPass || decrypt(wpAdminPass);
    const siteUrl = `http://${subdomain}.${rootDomain}`;
    await installWordPress(
      fullDocRoot,
      siteUrl,
      `${job.business_name || "Generated Site"} \u2014 ${job.project_id}`,
      wpAdminUser,
      rawAdminPass,
      "admin@digitalscout.online",
      (log) => appendLog(job.id, log)
    );
    await appendLog(job.id, `WordPress installed at ${siteUrl}`);
    job.status = "configuring_wordpress";
  }
  if (job.status === "configuring_wordpress") {
    await pool.query(`UPDATE provisioning_jobs SET status = 'configuring_wordpress' WHERE id = ?`, [job.id]);
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    await configurePermalinks(fullDocRoot, "/%postname%/", (log) => appendLog(job.id, log));
    await appendLog(job.id, "Configured remote permalinks");
    await appendLog(job.id, "Installing Hello Elementor theme...");
    try {
      await runWpCommand(`theme install hello-elementor --activate`, fullDocRoot, (log) => appendLog(job.id, log));
      await appendLog(job.id, "Hello Elementor theme activated");
    } catch (e) {
      await appendLog(job.id, `Warning: Theme install failed (${e.message}), using default`);
    }
    try {
      await runWpCommand(`theme delete twentytwentyfive twentytwentyfour twentytwentythree astra`, fullDocRoot, (log) => appendLog(job.id, log));
    } catch (e) {
    }
    await runWpCommand(`option update default_comment_status closed`, fullDocRoot, (log) => appendLog(job.id, log)).catch(() => {
    });
    await runWpCommand(`option update blogdescription ""`, fullDocRoot, (log) => appendLog(job.id, log)).catch(() => {
    });
    job.status = "deploying_content";
  }
  if (job.status === "deploying_content") {
    await pool.query(`UPDATE provisioning_jobs SET status = 'deploying_content' WHERE id = ?`, [job.id]);
    await appendLog(job.id, "Deploying Gutenberg content blocks to remote WordPress...");
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    const schema = typeof job.website_schema === "string" ? JSON.parse(job.website_schema) : job.website_schema;
    if (schema) {
      const { schemaToGutenbergBlocks: schemaToGutenbergBlocks2 } = await Promise.resolve().then(() => (init_wordpress(), wordpress_exports));
      const homepageBlocks = schemaToGutenbergBlocks2(schema);
      await pool.query(
        `UPDATE provisioning_jobs SET gutenberg_trace = ?, status = 'deploying_content' WHERE id = ?`,
        [homepageBlocks, job.id]
      );
      await injectWebsiteContent(fullDocRoot, schema, homepageBlocks, (log) => appendLog(job.id, log));
      await appendLog(job.id, "Content injected successfully on remote server");
    } else {
      await appendLog(job.id, "WARNING: No website schema found to inject.");
    }
    job.status = "completed";
  }
  if (job.status === "completed") {
    await pool.query(`UPDATE provisioning_jobs SET status = 'completed', locked_at = NULL WHERE id = ?`, [job.id]);
    const httpUrl = `http://${subdomain}.${rootDomain}`;
    await pool.query(`
			INSERT IGNORE INTO isolated_deployments
				(id, project_id, subdomain_url, wp_admin_url, admin_username, encrypted_admin_password, website_schema, ssl_status)
			VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
		`, [
      crypto.randomUUID(),
      job.project_id,
      httpUrl,
      `${httpUrl}/wp-admin`,
      wpAdminUser,
      wpAdminPass,
      typeof job.website_schema === "string" ? job.website_schema : JSON.stringify(job.website_schema)
    ]);
    if (job.trace_id) {
      try {
        await pool.query(
          `INSERT INTO generation_audit_logs (trace_id, step, message, data) VALUES (?, ?, ?, ?)`,
          [
            job.trace_id,
            "provisioning_completed",
            `Remote WordPress site provisioned at ${httpUrl}`,
            JSON.stringify({ url: httpUrl, jobId: job.id, remoteHost: process.env.WP_SSH_HOST })
          ]
        );
      } catch (e) {
      }
    }
    await appendLog(job.id, `Job completed! Remote WP site live at ${httpUrl} (SSL polling started)`);
  }
}
function esc2(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
async function injectWebsiteContent(docRoot, schema, _homepageBlocks, logCallback) {
  try {
    await logCallback("Cleaning up default WordPress content...");
    try {
      const deleteCmd = `/usr/local/sbin/wp post list --post_type=post,page --format=ids --path="${docRoot}" --allow-root | xargs -r /usr/local/sbin/wp post delete --force --allow-root --path="${docRoot}"`;
      await runRemoteShellCommand(deleteCmd, logCallback);
    } catch (e) {
    }
    let content = "";
    if (typeof schema?._wordpressHtml === "string" && schema._wordpressHtml.trim()) {
      await logCallback("Using Gemini-generated WordPress homepage HTML...");
      content = schema._wordpressHtml.trim();
    } else {
      await logCallback("Gemini HTML unavailable. Building homepage with local premium-site-builder...");
      const { buildPremiumPageContent: buildPremiumPageContent2 } = await Promise.resolve().then(() => (init_premium_site_builder(), premium_site_builder_exports));
      content = buildPremiumPageContent2(schema);
    }
    const tmpFile = `/tmp/ds_home_${Date.now()}.html`;
    await logCallback(`Writing to remote temp file: ${tmpFile}`);
    const base64Content = Buffer.from(content).toString("base64");
    await runRemoteShellCommand(
      `echo "${base64Content}" | base64 -d > '${tmpFile}'`,
      logCallback
    );
    await logCallback("Creating Home page in WordPress...");
    const homePageIdOut = await runWpCommand(
      `post create --post_type=page --post_title="Home" --post_content="$(cat '${tmpFile}')" --post_status=publish --format=ids`,
      docRoot,
      logCallback
    );
    const homePageId = homePageIdOut.stdout.replace(/[^0-9]/g, "").trim();
    await runRemoteShellCommand(`rm -f '${tmpFile}'`, logCallback).catch(() => {
    });
    if (!homePageId || homePageId === "0") {
      throw new Error("Home page creation failed \u2014 invalid ID returned");
    }
    await logCallback(`Home page created with ID: ${homePageId}. Setting as front page...`);
    await runWpCommand(`option update show_on_front page`, docRoot, logCallback);
    await runWpCommand(`option update page_on_front ${homePageId}`, docRoot, logCallback);
    if (schema.brand?.businessName) {
      await runWpCommand(`option update blogname "${esc2(schema.brand.businessName)}"`, docRoot, logCallback);
    }
    await runWpCommand(`rewrite structure "/%postname%/"`, docRoot, logCallback);
    await runWpCommand(`rewrite flush`, docRoot, logCallback);
    if (schema.brand?.logo) {
      try {
        await logCallback(`Attempting to import logo: ${schema.brand.logo}`);
        let mediaId = "";
        try {
          const mediaOut = await runWpCommand(`media import "${schema.brand.logo}" --porcelain`, docRoot, logCallback);
          mediaId = mediaOut.stdout.trim();
        } catch (e) {
          await logCallback("Direct import failed. Retrying with local temp file...");
          const ext = schema.brand.logo.toLowerCase().includes(".png") ? "png" : "jpg";
          const remoteTmpMedia = `/tmp/ds_logo_${Date.now()}.${ext}`;
          await runRemoteShellCommand(`curl -sL "${schema.brand.logo}" -o "${remoteTmpMedia}"`, logCallback);
          const mediaOut = await runWpCommand(`media import "${remoteTmpMedia}" --porcelain`, docRoot, logCallback);
          mediaId = mediaOut.stdout.trim();
          await runRemoteShellCommand(`rm -f "${remoteTmpMedia}"`, logCallback).catch(() => {
          });
        }
        if (/^\d+$/.test(mediaId)) {
          await logCallback(`Logo imported successfully (ID: ${mediaId}). Setting as site icon.`);
          await runWpCommand(`option update site_icon ${mediaId}`, docRoot, logCallback);
        }
      } catch (e) {
        await logCallback(`Warning: logo import failed: ${e.message}`);
      }
    }
    await logCallback("Premium WordPress site injection complete \u2713");
  } catch (error) {
    await logCallback(`CRITICAL ERROR during content injection: ${error.message}`);
    throw error;
  }
}
async function rollbackJob(job) {
  await appendLog(job.id, "[ROLLBACK] Starting remote cleanup...");
  const docRootBase = process.env.WP_DOCROOT_BASE || "/home/digigesf/public_html/sites";
  if (job.subdomain) {
    try {
      const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscoutwp.online";
      await deleteSubdomain(job.subdomain, rootDomain);
      await appendLog(job.id, `[ROLLBACK] Deleted subdomain ${job.subdomain}.${rootDomain}`);
    } catch (e) {
      await appendLog(job.id, `[ROLLBACK] Failed to delete subdomain: ${e.message}`);
    }
    const fullDocRoot = `${docRootBase}/${job.subdomain}`;
    try {
      await runRemoteShellCommand(`rm -rf "${fullDocRoot}"`, (log) => appendLog(job.id, log));
      await appendLog(job.id, `[ROLLBACK] Deleted remote directory: ${fullDocRoot}`);
    } catch (e) {
      await appendLog(job.id, `[ROLLBACK] Failed to delete remote directory: ${e.message}`);
    }
  }
  if (job.db_name) {
    try {
      await deleteDatabase(job.db_name);
      await appendLog(job.id, `[ROLLBACK] Deleted remote database: ${job.db_name}`);
    } catch (e) {
      await appendLog(job.id, `[ROLLBACK] Failed to delete database: ${e.message}`);
    }
  }
  if (job.db_user) {
    try {
      await deleteDatabaseUser(job.db_user);
      await appendLog(job.id, `[ROLLBACK] Deleted remote DB user: ${job.db_user}`);
    } catch (e) {
      await appendLog(job.id, `[ROLLBACK] Failed to delete DB user: ${e.message}`);
    }
  }
  await appendLog(job.id, "[ROLLBACK] Remote cleanup finished.");
}
async function deleteProvisionedWordPressSite(projectId) {
  console.log(`[Cleanup] Starting comprehensive remote deletion for project ${projectId}`);
  const [rows] = await pool.query(
    `SELECT * FROM provisioning_jobs WHERE project_id = ?`,
    [projectId]
  );
  if (!rows || rows.length === 0) {
    console.warn(`[Cleanup] No provisioning job found in DB for project ${projectId}. Attempting database-only purge.`);
    await pool.query(`DELETE FROM isolated_deployments WHERE project_id = ?`, [projectId]);
    await pool.query(`DELETE FROM provisioning_jobs WHERE project_id = ?`, [projectId]);
    return;
  }
  for (const job of rows) {
    try {
      await rollbackJob(job);
    } catch (e) {
      console.error(`[Cleanup] Rollback failed for job ${job.id}: ${e.message}`);
    }
  }
  try {
    const [del1] = await pool.query(`DELETE FROM isolated_deployments WHERE project_id = ?`, [projectId]);
    const [del2] = await pool.query(`DELETE FROM provisioning_jobs WHERE project_id = ?`, [projectId]);
    console.log(`[Cleanup] Project ${projectId} purged from local DB. Jobs removed: ${del2.affectedRows}`);
  } catch (e) {
    console.error(`[Cleanup] Failed to purge project ${projectId} from local DB: ${e.message}`);
    throw e;
  }
  console.log(`[Cleanup] Project ${projectId} remote resources and local records fully processed.`);
}

// src/lib/provisioning-worker.ts
var POLL_INTERVAL_MS = 5e3;
var isWorkerRunning = false;
async function startProvisioningWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  console.log("[Worker] Provisioning worker started.");
  setInterval(async () => {
    try {
      await pollQueue();
    } catch (error) {
      console.error("[Worker] Error in poll loop:", error);
    }
  }, POLL_INTERVAL_MS);
}
async function pollQueue() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(`
			SELECT id FROM provisioning_jobs 
			WHERE status NOT IN ('completed', 'failed', 'lead') 
			  AND (locked_at IS NULL OR locked_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE))
			ORDER BY created_at ASC 
			LIMIT 1
			FOR UPDATE SKIP LOCKED
		`);
    if (!rows || rows.length === 0) {
      await connection.commit();
      return;
    }
    const jobId = rows[0].id;
    await connection.query(`UPDATE provisioning_jobs SET locked_at = NOW() WHERE id = ?`, [jobId]);
    await connection.commit();
    console.log(`[Worker] Picked up job ${jobId}`);
    await processJob(jobId);
  } catch (error) {
    await connection.rollback();
    console.error("[Worker] Transaction error:", error);
  } finally {
    connection.release();
  }
}

// server.ts
fs2.writeSync(2, `[BOOT] Server process starting at ${(/* @__PURE__ */ new Date()).toISOString()}
`);
fs2.writeSync(2, `[BOOT] CWD: ${process.cwd()}
`);
fs2.writeSync(2, `[BOOT] DB_USER: ${process.env.DB_USER || "NOT SET"}
`);
var GoogleGenerativeAI = null;
var app = express();
var PORT = process.env.PORT || 5001;
app.use(
  cors({
    exposedHeaders: ["x-debug-generation-id", "x-debug-generation-fallback"]
  })
);
app.use(express.json({ limit: "50mb" }));
app.get("/", (req, res) => {
  res.send("DigitalScout API Running");
});
var DEBUG_ROOT_DIR = path2.join(process.cwd(), ".debug-generation");
var generationDebugSessions = /* @__PURE__ */ new Map();
function slugifyDebugSegment(value) {
  return (value || "generation").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function createGenerationTraceId(business) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/:/g, "-");
  const businessSlug = slugifyDebugSegment(
    business?.name || business?.businessName || business?.id || "site"
  );
  return `${timestamp}-${businessSlug}`;
}
function createGenerationDebugSession(business) {
  const traceId = createGenerationTraceId(business);
  let folderName = traceId;
  let folderPath = path2.join(DEBUG_ROOT_DIR, folderName);
  let suffix = 2;
  while (fs2.existsSync(folderPath)) {
    folderName = `${traceId}-${suffix}`;
    folderPath = path2.join(DEBUG_ROOT_DIR, folderName);
    suffix += 1;
  }
  fs2.mkdirSync(folderPath, { recursive: true });
  const session = {
    traceId,
    folderName,
    folderPath,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    businessName: business?.name || "Unknown Business",
    businessCategory: business?.category || "Unknown Category",
    parseRepairs: [],
    malformedSections: [],
    warnings: [],
    errors: [],
    rendererWarnings: [],
    sectionTypes: []
  };
  generationDebugSessions.set(traceId, session);
  return session;
}
function getGenerationDebugSession(traceId) {
  return generationDebugSessions.get(traceId);
}
function formatDebugPayload(content) {
  if (typeof content === "string") return content;
  return JSON.stringify(content, null, 2);
}
function persistGenerationDebugFile(session, fileName, content, append = false) {
  fs2.mkdirSync(session.folderPath, { recursive: true });
  const targetPath = path2.join(session.folderPath, fileName);
  const payload = formatDebugPayload(content);
  if (append && fs2.existsSync(targetPath)) {
    fs2.appendFileSync(targetPath, `${payload}
`, "utf8");
    return;
  }
  fs2.writeFileSync(targetPath, payload, "utf8");
}
function appendGenerationDebugError(session, message) {
  const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`;
  session.errors.push(line);
  persistGenerationDebugFile(session, "10-errors.log", `${line}
`, true);
}
function buildBusinessDebugInput(business) {
  return {
    business,
    context: {
      name: business?.name || null,
      category: business?.category || null,
      address: business?.address || null,
      reviews: business?.reviews || [],
      photos: business?.photos || [],
      imageSuggestions: business?.imageSuggestions || [],
      qualificationNotes: business?.qualificationNotes || business?.notes || null,
      enrichment: {
        websiteUri: business?.websiteUri || null,
        email: business?.email || null,
        phoneNumber: business?.phoneNumber || null,
        specialties: business?.specialties || [],
        tone: business?.tone || null,
        neighborhood: business?.neighborhood || business?.vibe || null
      },
      mapsSearch: {
        location: business?.location || null,
        rating: business?.rating || null,
        reviewCount: business?.reviewCount || null,
        businessStatus: business?.businessStatus || null
      }
    }
  };
}
async function getSDKGenAI() {
  if (!GENAI_KEY) return null;
  if (!GoogleGenerativeAI) {
    try {
      const mod = await import("@google/generative-ai");
      GoogleGenerativeAI = mod.GoogleGenerativeAI;
    } catch (e) {
      console.error("[Gemini] SDK package @google/generative-ai not found.");
      return null;
    }
  }
  return new GoogleGenerativeAI(GENAI_KEY);
}
var GENAI_KEY = process.env.GEMINI_API_KEY || process.env.GENAI_API_KEY;
var CALLHIPPO_API_KEY = process.env.CALLHIPPO_API_KEY;
var WEBSITE_GENERATION_MODE = process.env.WEBSITE_GENERATION_MODE || "gemini";
function extractEmails(html) {
  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  return Array.from(new Set(html.match(emailPattern) || [])).slice(0, 3);
}
function extractPhones(html) {
  const phonePattern = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;
  return Array.from(new Set(html.match(phonePattern) || [])).slice(0, 3);
}
function extractImages(html) {
  const imagePattern = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  const matches = [];
  let match;
  while ((match = imagePattern.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return Array.from(new Set(matches)).slice(0, 3);
}
function extractJsonObject(text) {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const candidate = fencedMatch[1].trim();
    if (candidate.startsWith("{") && candidate.endsWith("}")) {
      return candidate;
    }
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return null;
}
function extractHtmlDocument(text) {
  if (!text) return null;
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const candidate = fencedMatch[1].trim();
    if (candidate.includes("<")) return candidate;
  }
  if (trimmed.includes("<!-- wp:html -->") || trimmed.includes("<section") || trimmed.includes("<style")) {
    return trimmed;
  }
  const firstTag = trimmed.indexOf("<");
  if (firstTag >= 0) {
    return trimmed.slice(firstTag);
  }
  return null;
}
function parseLeadQualificationOutput(rawText) {
  const candidateJson = extractJsonObject(rawText);
  if (!candidateJson) return null;
  try {
    const parsed = JSON.parse(candidateJson);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return {
      hasWebsite: Boolean(parsed.hasWebsite),
      websiteUri: typeof parsed.websiteUri === "string" ? parsed.websiteUri : void 0,
      email: typeof parsed.email === "string" ? parsed.email : void 0,
      phoneNumber: typeof parsed.phoneNumber === "string" ? parsed.phoneNumber : void 0,
      confidence: parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low" ? parsed.confidence : void 0,
      notes: typeof parsed.notes === "string" ? parsed.notes : void 0
    };
  } catch {
    return null;
  }
}
async function runWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const index = cursor++;
        if (index >= items.length) {
          return;
        }
        results[index] = await task(items[index], index);
      }
    }
  );
  await Promise.all(workers);
  return results;
}
async function qualifyLeadCandidate(business, city) {
  if (business.websiteUri) {
    return {
      hasWebsite: true,
      websiteUri: business.websiteUri,
      email: business.email,
      phoneNumber: business.phoneNumber,
      confidence: "high",
      notes: "Google Places returned an official website URL."
    };
  }
  const genAI = await getSDKGenAI();
  if (!genAI) {
    return {
      hasWebsite: false,
      email: business.email,
      phoneNumber: business.phoneNumber,
      confidence: "low",
      notes: "Gemini API key is not configured or SDK missing."
    };
  }
  const prompt = `You are qualifying a local business lead using live grounded data.

Business:
- Name: ${business.name}
- Category: ${business.category || "Unknown"}
- Address: ${business.address || "Unknown"}
- City/Area: ${city || "Unknown"}
- Existing website from app: ${business.websiteUri || "None found"}
- Existing phone from app: ${business.phoneNumber || "Unknown"}

Task:
1. Determine whether this business appears to have an official website right now.
2. Find the best public contact email for the business, if one exists.
3. Find the best public phone number for the business, if one exists.

Rules:
- Use grounded live sources only.
- If an official business website exists, set hasWebsite to true.
- Only return an email if it is a business contact email that is publicly available.
- Do not guess.
- Prefer high confidence only; otherwise leave fields blank.

Return only valid JSON in this exact shape:
{
  "hasWebsite": true,
  "websiteUri": "https://example.com",
  "email": "info@example.com",
  "phoneNumber": "(555) 555-5555",
  "confidence": "high",
  "notes": "short explanation"
}`;
  const configsToTry = [
    {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: business.location ? {
        retrievalConfig: {
          latLng: {
            latitude: business.location.lat,
            longitude: business.location.lng
          }
        }
      } : void 0
    },
    {
      tools: [{ googleSearch: {} }],
      toolConfig: void 0
    }
  ];
  let lastError = null;
  for (const configVariant of configsToTry) {
    try {
      const modelInstance = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        tools: configVariant.tools,
        toolConfig: configVariant.toolConfig
      });
      const result = await modelInstance.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      });
      const response = await result.response;
      const parsed = parseLeadQualificationOutput((response.text() || "").trim());
      if (parsed) {
        return parsed;
      }
    } catch (error) {
      lastError = error;
    }
  }
  return {
    hasWebsite: false,
    email: business.email,
    phoneNumber: business.phoneNumber,
    confidence: "low",
    notes: lastError instanceof Error ? lastError.message : "Lead qualification failed."
  };
}
function parseWebsiteSchemaOutput(rawText, business, debugSession) {
  const candidateJson = extractJsonObject(rawText);
  if (!candidateJson) {
    if (debugSession) {
      persistGenerationDebugFile(debugSession, "04-extracted-json.json", {
        error: "No JSON object could be extracted from Gemini output.",
        rawPreview: (rawText || "").slice(0, 4e3)
      });
      appendGenerationDebugError(
        debugSession,
        "parser_failure: no JSON object could be extracted"
      );
    }
    return null;
  }
  try {
    let normalizeSectionShape = function(rawSections) {
      if (!Array.isArray(rawSections)) {
        return {
          sections: null,
          reports: [],
          warnings: []
        };
      }
      const reports = [];
      const warnings = [];
      const sections = [];
      for (const [index, rawSection] of rawSections.entries()) {
        const original = JSON.parse(JSON.stringify(rawSection || {}));
        const repaired = [];
        const droppedFields = [];
        const section = { ...rawSection || {} };
        const originalType = original.type || original.kind || null;
        if (!section.type && section.kind) {
          section.type = section.kind;
          repaired.push("kind->type");
        }
        if (!section.type) {
          const inferredType = inferSectionType(section.id) || inferSectionType(section.section) || inferSectionType(section.name) || inferSectionType(section.variant);
          if (inferredType) {
            section.type = inferredType;
            repaired.push("id/name->type");
          }
        }
        if (section.content && typeof section.content === "object") {
          for (const [key, value] of Object.entries(section.content)) {
            if (section[key] === void 0) {
              section[key] = value;
              repaired.push(`content.${key}->${key}`);
            } else {
              droppedFields.push(`content.${key}`);
            }
          }
          delete section.content;
        }
        switch ((section.type || "").toLowerCase()) {
          case "hero": {
            section.type = "hero";
            section.headline = section.headline || section.title || section.label || business.name || "Welcome";
            section.subheadline = section.subheadline || section.subtitle || section.description || "";
            if (!section.ctaPrimary && Array.isArray(section.buttons) && section.buttons.length > 0) {
              section.ctaPrimary = section.buttons[0];
              repaired.push("buttons[0]->ctaPrimary");
            }
            break;
          }
          case "features":
            section.type = "features";
            section.items = section.items || section.features || section.featureItems || [];
            break;
          case "gallery":
            section.type = "gallery";
            if (!section.items && (section.images || section.photos)) {
              repaired.push("images/photos->items");
            }
            section.items = section.items || section.images || section.photos || [];
            section.items = Array.isArray(section.items) ? section.items.map((item) => {
              if (typeof item === "string") {
                return { src: item, alt: business.name || "" };
              }
              if (item?.url && !item.src) {
                item.src = item.url;
                repaired.push("gallery.url->src");
              }
              if (item?.src && !item.alt) {
                item.alt = business.name || "";
              }
              return item;
            }) : [];
            if (!section.items.length) {
              warnings.push(
                `gallery section ${index} normalized to empty items`
              );
            }
            break;
          case "testimonials":
            section.type = "testimonials";
            if (!section.items && section.testimonials) {
              repaired.push("testimonials->items");
            }
            section.items = section.items || section.testimonials || section.reviews || [];
            break;
          case "faq":
            section.type = "faq";
            if (!section.items && (section.faqs || section.questions)) {
              repaired.push("faqs/questions->items");
            }
            section.items = section.items || section.faqs || section.questions || [];
            break;
          case "cta":
            section.type = "cta";
            section.title = section.title || section.headline || section.heading || "Ready to get started?";
            section.body = section.body || section.description || "";
            section.buttonLabel = section.buttonLabel || section.cta || section.button?.label || "Contact Us";
            section.buttonHref = section.buttonHref || section.cta?.href || section.button?.href || "#contact";
            break;
          case "contact":
            section.type = "contact";
            section.showEmail = section.showEmail !== false;
            section.showPhone = section.showPhone !== false;
            break;
          default:
            section.type = section.type || section.kind || "unknown";
            section.title = section.title || section.heading || section.label || (section.type === "unknown" ? "Section" : section.type);
            break;
        }
        if (!section.id) {
          section.id = `${section.type || "section"}-${index + 1}`;
          repaired.push("generated-id");
        }
        const report = {
          index,
          originalType: originalType ? String(originalType) : null,
          finalType: section.type || "unknown",
          repaired,
          droppedFields,
          sectionId: section.id
        };
        if (debugSession && (repaired.length > 0 || droppedFields.length > 0)) {
          debugSession.warnings.push(
            `section[${index}] ${report.originalType || "unknown"} -> ${report.finalType} (${repaired.join(", ") || "no repairs"})`
          );
          appendGenerationDebugError(
            debugSession,
            `normalization_repair: ${JSON.stringify(report)}`
          );
        }
        if (Array.isArray(section.items) && section.items.length === 0) {
          warnings.push(
            `section[${index}] ${section.type} has no items after normalization`
          );
        }
        reports.push(report);
        sections.push(section);
      }
      return { sections, reports, warnings };
    };
    const parsed = JSON.parse(candidateJson);
    if (!parsed || typeof parsed !== "object") {
      if (debugSession) {
        persistGenerationDebugFile(debugSession, "04-extracted-json.json", {
          error: "Parsed JSON was not an object.",
          extractedJson: candidateJson
        });
        appendGenerationDebugError(
          debugSession,
          "parser_failure: parsed JSON was not an object"
        );
      }
      return null;
    }
    const root = typeof parsed.schema === "object" && parsed.schema ? parsed.schema : parsed;
    const nestedSections = Array.isArray(root.sections) && root.sections || Array.isArray(parsed?.website?.sections) && parsed.website.sections || Array.isArray(parsed?.site?.sections) && parsed.site.sections || null;
    const inferSectionType = (value) => {
      if (typeof value !== "string") return null;
      const normalized = value.trim().toLowerCase();
      if (!normalized) return null;
      if (normalized.startsWith("hero")) return "hero";
      if (normalized.startsWith("feature") || normalized.startsWith("service"))
        return "features";
      if (normalized.startsWith("gallery")) return "gallery";
      if (normalized.startsWith("testimonial") || normalized.startsWith("review"))
        return "testimonials";
      if (normalized.startsWith("faq") || normalized.startsWith("question"))
        return "faq";
      if (normalized.startsWith("cta") || normalized.startsWith("call-to-action"))
        return "cta";
      if (normalized.startsWith("contact")) return "contact";
      return null;
    };
    const fallback = createFallbackWebsiteSchema(business);
    const normalizationResult = nestedSections && nestedSections.length > 0 ? normalizeSectionShape(nestedSections) : {
      sections: null,
      reports: [],
      warnings: []
    };
    const merged = {
      meta: {
        ...fallback.meta,
        ...root.meta || {}
      },
      theme: {
        ...fallback.theme,
        ...root.theme || {},
        palette: {
          ...fallback.theme.palette,
          ...root.theme?.palette || {},
          ...root.theme?.colors || {},
          primary: root.theme?.palette?.primary || root.theme?.colors?.primary || root.theme?.primaryColor || fallback.theme.palette.primary,
          surface: root.theme?.palette?.surface || root.theme?.colors?.surface || root.theme?.secondaryColor || fallback.theme.palette.surface,
          background: root.theme?.palette?.background || root.theme?.colors?.background || root.theme?.secondaryColor || fallback.theme.palette.background,
          accent: root.theme?.palette?.accent || root.theme?.colors?.accent || root.theme?.accentColor || root.theme?.primaryColor || fallback.theme.palette.accent
        },
        typography: {
          ...fallback.theme.typography,
          ...root.theme?.typography || {},
          heading: root.theme?.typography?.heading || root.theme?.typography?.headingFont || root.theme?.fontHeading || fallback.theme.typography.heading,
          body: root.theme?.typography?.body || root.theme?.typography?.bodyFont || root.theme?.fontBody || fallback.theme.typography.body
        },
        customCss: root.theme?.customCss || root?.customCss || fallback.theme?.customCss || ""
      },
      brand: {
        ...fallback.brand,
        ...root.brand || {},
        businessName: root.brand?.businessName || root?.businessName || fallback.brand.businessName,
        category: root.brand?.category || root?.category || fallback.brand.category
      },
      seo: {
        ...fallback.seo,
        ...root.seo || {},
        keywords: Array.isArray(root.seo?.keywords) && root.seo?.keywords.length > 0 ? root.seo.keywords : fallback.seo.keywords
      },
      sections: normalizationResult.sections && normalizationResult.sections.length > 0 ? normalizationResult.sections : fallback.sections
    };
    merged.theme = sanitizeThemeEnums(merged.theme);
    merged.theme = enforceLightTheme(merged.theme);
    if (debugSession) {
      debugSession.parseRepairs = normalizationResult.reports;
      debugSession.malformedSections = normalizationResult.reports.filter(
        (report) => report.repaired.length > 0 || report.droppedFields.length > 0
      );
      debugSession.sectionTypes = merged.sections.map(
        (section) => section.type
      );
      debugSession.warnings.push(...normalizationResult.warnings);
      persistGenerationDebugFile(
        debugSession,
        "04-extracted-json.json",
        parsed
      );
    }
    return merged;
  } catch (error) {
    if (debugSession) {
      appendGenerationDebugError(
        debugSession,
        `parser_failure: ${error instanceof Error ? error.message : String(error)}`
      );
      persistGenerationDebugFile(debugSession, "04-extracted-json.json", {
        error: error instanceof Error ? error.message : String(error),
        extractedJson: candidateJson
      });
    }
    return null;
  }
}
function hashSeed(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = hash * 31 + input.charCodeAt(i) | 0;
  }
  return Math.abs(hash);
}
function pickBySeed(items, seed) {
  if (!items.length) {
    throw new Error("pickBySeed requires at least one item");
  }
  return items[seed % items.length];
}
function buildUniqueHeroSubheadline(businessName, categoryLabel, seed) {
  const openings = [
    "delivers a sharper digital first impression for",
    "frames a premium online experience for",
    "positions your brand as the standout choice in",
    "brings editorial-grade storytelling to",
    "pairs visual depth with clear intent for",
    "transforms discovery clicks into confident enquiries for",
    "sets a modern, conversion-ready standard for"
  ];
  const closings = [
    "with bold hierarchy and clear booking paths",
    "through polished visuals and concise trust signals",
    "by balancing atmosphere, proof, and action",
    "with mobile-first pacing and high-intent CTAs",
    "using distinctive sections that avoid template sameness",
    "with premium composition and service-first messaging",
    "through a brand voice tailored to local demand"
  ];
  const opening = pickBySeed(openings, seed + 5);
  const closing = pickBySeed(closings, seed + 17);
  return `${businessName} ${opening} ${categoryLabel} ${closing}.`;
}
function buildSectionOrderPattern(category, seed) {
  const categoryNorm = (category || "").toLowerCase();
  const isFitness = categoryNorm.includes("gym") || categoryNorm.includes("fitness");
  const isDental = categoryNorm.includes("dental");
  const isRealEstate = categoryNorm.includes("real estate") || categoryNorm.includes("property");
  const isCafe = categoryNorm.includes("cafe") || categoryNorm.includes("restaurant");
  const isSalon = categoryNorm.includes("salon") || categoryNorm.includes("spa");
  let patterns = [];
  if (isFitness) {
    patterns = [
      ["features", "gallery", "testimonials", "faq", "cta"],
      ["gallery", "features", "testimonials", "cta", "faq"],
      ["testimonials", "features", "gallery", "cta", "faq"]
    ];
  } else if (isDental) {
    patterns = [
      ["features", "testimonials", "faq", "gallery", "cta"],
      ["testimonials", "features", "faq", "gallery", "cta"],
      ["features", "faq", "testimonials", "cta", "gallery"]
    ];
  } else if (isRealEstate) {
    patterns = [
      ["gallery", "features", "testimonials", "faq", "cta"],
      ["features", "gallery", "testimonials", "cta", "faq"],
      ["gallery", "testimonials", "features", "cta", "faq"]
    ];
  } else if (isCafe) {
    patterns = [
      ["features", "gallery", "testimonials", "cta", "faq"],
      ["gallery", "features", "testimonials", "faq", "cta"],
      ["testimonials", "gallery", "features", "faq", "cta"]
    ];
  } else if (isSalon) {
    patterns = [
      ["gallery", "features", "testimonials", "faq", "cta"],
      ["features", "gallery", "testimonials", "cta", "faq"],
      ["testimonials", "features", "gallery", "faq", "cta"]
    ];
  } else {
    patterns = [
      ["features", "gallery", "testimonials", "faq", "cta"],
      ["features", "testimonials", "gallery", "cta", "faq"],
      ["gallery", "features", "testimonials", "cta", "faq"],
      ["testimonials", "features", "faq", "gallery", "cta"]
    ];
  }
  return pickBySeed(patterns, seed + 41);
}
function ensureNonTemplateCopy(schema, business) {
  const seed = hashSeed(
    `${business.id || business.name || "lead"}-${business.category || "category"}`
  );
  const categoryLabel = business.category || schema.brand.category || "local business";
  const businessName = business.name || schema.brand.businessName || "This business";
  const genericPattern = /^a\s+premium\s+.+website\s+designed\s+to\s+convert\s+visitors\s+into\s+customers\.?$/i;
  const categoryNorm = (categoryLabel || "").toLowerCase();
  const pickVariant = (sectionType) => {
    if (sectionType === "hero") {
      if (categoryNorm.includes("salon") || categoryNorm.includes("spa") || categoryNorm.includes("wellness")) {
        return pickBySeed(
          ["editorial-split", "magazine", "centered", "minimal", "split"],
          seed + 3
        );
      }
      if (categoryNorm.includes("gym") || categoryNorm.includes("fitness") || categoryNorm.includes("training")) {
        return pickBySeed(["immersive", "split", "cinematic"], seed + 5);
      }
      if (categoryNorm.includes("dental") || categoryNorm.includes("law") || categoryNorm.includes("finance") || categoryNorm.includes("consult")) {
        return pickBySeed(["centered", "editorial", "minimal"], seed + 7);
      }
      return pickBySeed(["editorial", "split", "immersive"], seed + 11);
    }
    if (sectionType === "features") {
      if (categoryNorm.includes("dental") || categoryNorm.includes("law") || categoryNorm.includes("finance") || categoryNorm.includes("consult")) {
        return pickBySeed(
          ["editorial-list", "editorial-cards", "bento"],
          seed + 13
        );
      }
      if (categoryNorm.includes("salon") || categoryNorm.includes("spa") || categoryNorm.includes("wellness")) {
        return pickBySeed(
          ["alternating-stack", "bento", "editorial-cards", "editorial-list"],
          seed + 15
        );
      }
      return pickBySeed(
        ["bento", "editorial-cards", "editorial-list"],
        seed + 17
      );
    }
    if (sectionType === "gallery") {
      if (categoryNorm.includes("salon") || categoryNorm.includes("spa") || categoryNorm.includes("wellness")) {
        return pickBySeed(
          ["stacked-collage", "editorial-mosaic", "collage"],
          seed + 19
        );
      }
      return pickBySeed(
        ["editorial-mosaic", "stacked-collage"],
        seed + 19
      );
    }
    if (sectionType === "testimonials") {
      return pickBySeed(
        ["floating-cards", "editorial-quotes", "spotlight"],
        seed + 23
      );
    }
    if (sectionType === "faq") {
      return pickBySeed(["cards", "split-columns", "grid"], seed + 29);
    }
    if (sectionType === "cta") {
      return pickBySeed(["gradient-band", "split-card", "side-by-side"], seed + 31);
    }
    if (sectionType === "contact") {
      return pickBySeed(["split-card", "minimal-centered", "centered"], seed + 37);
    }
    return "default";
  };
  const nextSections = (schema.sections || []).map((section) => {
    const layout = pickVariant(section.type);
    const modified = {
      ...section,
      layout,
      variant: section.variant || layout
    };
    if (section.type === "hero") {
      modified.ctaPrimary = modified.ctaPrimary || {};
      modified.ctaPrimary.label = modified.ctaPrimary.label || "Book Now";
      modified.ctaPrimary.href = modified.ctaPrimary.href || "#contact";
      if (modified.ctaSecondary) {
        modified.ctaSecondary.href = modified.ctaSecondary.href || "#services";
      }
      modified.media = modified.media || {
        src: business.photos?.[0] || business.imageSuggestions?.[0] || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
        alt: `${businessName} hero image`
      };
    }
    if (section.type === "cta") {
      modified.buttonHref = modified.buttonHref || "#contact";
      modified.buttonLabel = modified.buttonLabel || "Start Your Enquiry";
    }
    if (section.type === "gallery" && modified.items) {
      modified.items = modified.items.map((item) => ({
        ...item,
        src: item.src || "https://via.placeholder.com/400x300?text=Gallery+Image",
        alt: item.alt || `${businessName} gallery image`
      }));
    }
    if (section.type !== "hero") return modified;
    const current = (section.subheadline || "").trim();
    if (!current || genericPattern.test(current)) {
      return {
        ...modified,
        subheadline: buildUniqueHeroSubheadline(
          businessName,
          categoryLabel,
          seed
        )
      };
    }
    return modified;
  });
  return {
    ...schema,
    sections: nextSections
  };
}
function sanitizeThemeEnums(theme) {
  const sanitize = (value, allowed, fallback) => {
    return typeof value === "string" && allowed.includes(value) ? value : fallback;
  };
  return {
    ...theme,
    layout: sanitize(
      theme.layout,
      [
        "editorial",
        "immersive",
        "minimal",
        "gallery-forward",
        "split-screen"
      ],
      "editorial"
    ),
    buttonStyle: sanitize(
      theme.buttonStyle,
      ["pill", "sharp", "ghost"],
      "pill"
    ),
    surfaceStyle: sanitize(
      theme.surfaceStyle,
      ["glass", "solid", "outline"],
      "glass"
    ),
    mediaShape: sanitize(
      theme.mediaShape,
      ["rounded", "arched", "portrait", "square"],
      "rounded"
    ),
    density: sanitize(
      theme.density,
      ["airy", "balanced", "compact"],
      "balanced"
    ),
    accentMode: sanitize(
      theme.accentMode,
      ["neon", "earthy", "luxury", "fresh"],
      "neon"
    )
  };
}
function enforceLightTheme(theme) {
  const parseColor = (value) => {
    const hex = value.trim().toLowerCase();
    const rgbaMatch = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbaMatch) {
      return [Number(rgbaMatch[1]), Number(rgbaMatch[2]), Number(rgbaMatch[3])];
    }
    const shorthand = hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (shorthand) {
      return [
        parseInt(shorthand[1] + shorthand[1], 16),
        parseInt(shorthand[2] + shorthand[2], 16),
        parseInt(shorthand[3] + shorthand[3], 16)
      ];
    }
    const full = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (full) {
      return [
        parseInt(full[1], 16),
        parseInt(full[2], 16),
        parseInt(full[3], 16)
      ];
    }
    return null;
  };
  const isDark = (color) => {
    const rgb = parseColor(color);
    if (!rgb) return false;
    const [r, g, b] = rgb.map((channel) => channel / 255);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 0.35;
  };
  const safeBackground = isDark(theme.palette.background) ? "#f8fafc" : theme.palette.background;
  const safeSurface = isDark(theme.palette.surface) ? "#ffffff" : theme.palette.surface;
  const safeText = isDark(theme.palette.text) ? theme.palette.text : theme.palette.text;
  return {
    ...theme,
    palette: {
      ...theme.palette,
      background: safeBackground,
      surface: safeSurface,
      text: safeText,
      outline: theme.palette.outline || "rgba(15, 23, 42, 0.08)"
    },
    sectionDensity: theme.sectionDensity || "balanced",
    interactionStyle: theme.interactionStyle || "refined"
  };
}
function collectBusinessImages(business) {
  return Array.from(
    new Set(
      [...business?.photos || [], ...business?.imageSuggestions || []].filter(
        (value) => typeof value === "string" && value.trim().length > 0
      )
    )
  );
}
function pickDesignProfile(category, seed = 0) {
  const normalized = (category || "").toLowerCase();
  if (normalized.includes("restaurant") || normalized.includes("cafe") || normalized.includes("bakery")) {
    return pickBySeed(
      [
        {
          name: "Warm Editorial",
          style: "editorial hospitality",
          layout: "editorial",
          buttonStyle: "pill",
          surfaceStyle: "glass",
          mediaShape: "arched",
          density: "airy",
          accentMode: "earthy",
          palette: {
            background: "#fcf3ea",
            surface: "#ffffff",
            primary: "#c2410c",
            accent: "#f59e0b",
            text: "#1f2937",
            muted: "#6b7280",
            outline: "rgba(194, 65, 12, 0.12)"
          },
          typography: { heading: "Playfair Display", body: "Inter" }
        },
        {
          name: "Layered Bistro",
          style: "sensory hospitality",
          layout: "gallery-forward",
          buttonStyle: "sharp",
          surfaceStyle: "solid",
          mediaShape: "rounded",
          density: "balanced",
          accentMode: "earthy",
          palette: {
            background: "#f8f1ea",
            surface: "#fffdf9",
            primary: "#9a3412",
            accent: "#d97706",
            text: "#292524",
            muted: "#78716c",
            outline: "rgba(154, 52, 18, 0.12)"
          },
          typography: { heading: "Cormorant Garamond", body: "Inter" }
        }
      ],
      seed + 101
    );
  }
  if (normalized.includes("salon") || normalized.includes("spa") || normalized.includes("wellness")) {
    return pickBySeed(
      [
        {
          name: "Soft Luxe",
          style: "luxury wellness",
          layout: "split-screen",
          buttonStyle: "pill",
          surfaceStyle: "glass",
          mediaShape: "portrait",
          density: "balanced",
          accentMode: "luxury",
          palette: {
            background: "#f8f4f5",
            surface: "#ffffff",
            primary: "#9333ea",
            accent: "#e9d5ff",
            text: "#1f2937",
            muted: "#9ca3af",
            outline: "rgba(147, 51, 234, 0.12)"
          },
          typography: { heading: "Cormorant Garamond", body: "Inter" }
        },
        {
          name: "Editorial Blush",
          style: "airy salon editorial",
          layout: "editorial",
          buttonStyle: "ghost",
          surfaceStyle: "outline",
          mediaShape: "arched",
          density: "airy",
          accentMode: "luxury",
          palette: {
            background: "#fbf6f3",
            surface: "#fffdfb",
            primary: "#b45363",
            accent: "#f4c2d7",
            text: "#2d1f24",
            muted: "#7f6a72",
            outline: "rgba(180, 83, 99, 0.12)"
          },
          typography: { heading: "Playfair Display", body: "Plus Jakarta Sans" }
        },
        {
          name: "Champagne Studio",
          style: "polished beauty studio",
          layout: "gallery-forward",
          buttonStyle: "sharp",
          surfaceStyle: "solid",
          mediaShape: "rounded",
          density: "balanced",
          accentMode: "earthy",
          palette: {
            background: "#faf7f1",
            surface: "#fffdfa",
            primary: "#8b6b3f",
            accent: "#d4b483",
            text: "#2b2117",
            muted: "#8b8177",
            outline: "rgba(139, 107, 63, 0.12)"
          },
          typography: { heading: "Cormorant Garamond", body: "Outfit" }
        },
        {
          name: "Modern Atelier",
          style: "clean creative salon",
          layout: "minimal",
          buttonStyle: "pill",
          surfaceStyle: "glass",
          mediaShape: "square",
          density: "compact",
          accentMode: "fresh",
          palette: {
            background: "#f5f4f8",
            surface: "#ffffff",
            primary: "#4f46e5",
            accent: "#c7d2fe",
            text: "#1f2937",
            muted: "#6b7280",
            outline: "rgba(79, 70, 229, 0.10)"
          },
          typography: { heading: "Space Grotesk", body: "Inter" }
        }
      ],
      seed + 131
    );
  }
  if (normalized.includes("gym") || normalized.includes("fitness") || normalized.includes("training")) {
    return {
      name: "Electric Performance",
      style: "high-energy conversion",
      layout: "immersive",
      buttonStyle: "sharp",
      surfaceStyle: "solid",
      mediaShape: "square",
      density: "compact",
      accentMode: "neon",
      palette: {
        background: "#f0fdf4",
        surface: "#ffffff",
        primary: "#16a34a",
        accent: "#0284c7",
        text: "#0f172a",
        muted: "#64748b",
        outline: "rgba(22, 163, 74, 0.16)"
      },
      typography: { heading: "Space Grotesk", body: "Inter" }
    };
  }
  if (normalized.includes("dry clean") || normalized.includes("laundry")) {
    return {
      name: "Polished Cleanliness",
      style: "clinical luxury",
      layout: "split-screen",
      buttonStyle: "pill",
      surfaceStyle: "glass",
      mediaShape: "rounded",
      density: "airy",
      accentMode: "fresh",
      palette: {
        background: "#f0f9ff",
        surface: "#ffffff",
        primary: "#0c4a6e",
        accent: "#3b82f6",
        text: "#1e293b",
        muted: "#78716c",
        outline: "rgba(12, 74, 110, 0.12)"
      },
      typography: { heading: "IBM Plex Sans", body: "Inter" }
    };
  }
  if (normalized.includes("dental") || normalized.includes("dentist") || normalized.includes("orthodont")) {
    return {
      name: "Clinical Calm",
      style: "healthcare premium",
      layout: "minimal",
      buttonStyle: "pill",
      surfaceStyle: "outline",
      mediaShape: "rounded",
      density: "balanced",
      accentMode: "fresh",
      palette: {
        background: "#f0fdf4",
        surface: "#ffffff",
        primary: "#059669",
        accent: "#06b6d4",
        text: "#1f2937",
        muted: "#6b7280",
        outline: "rgba(5, 150, 105, 0.10)"
      },
      typography: { heading: "Inter", body: "Inter" }
    };
  }
  if (normalized.includes("real estate") || normalized.includes("realtor") || normalized.includes("property")) {
    return {
      name: "Architectural Premium",
      style: "property luxury",
      layout: "gallery-forward",
      buttonStyle: "sharp",
      surfaceStyle: "solid",
      mediaShape: "square",
      density: "balanced",
      accentMode: "earthy",
      palette: {
        background: "#fafaf9",
        surface: "#ffffff",
        primary: "#5b4e48",
        accent: "#a16207",
        text: "#1f2937",
        muted: "#9ca3af",
        outline: "rgba(91, 78, 72, 0.12)"
      },
      typography: { heading: "IBM Plex Serif", body: "Inter" }
    };
  }
  if (normalized.includes("law") || normalized.includes("finance") || normalized.includes("consult") || normalized.includes("agency")) {
    return {
      name: "Modern Authority",
      style: "editorial professional",
      layout: "minimal",
      buttonStyle: "sharp",
      surfaceStyle: "outline",
      mediaShape: "rounded",
      density: "balanced",
      accentMode: "fresh",
      palette: {
        background: "#f7f7f5",
        surface: "#ffffff",
        primary: "#0f766e",
        accent: "#2563eb",
        text: "#111827",
        muted: "#6b7280",
        outline: "rgba(17, 24, 39, 0.10)"
      },
      typography: { heading: "IBM Plex Sans", body: "Inter" }
    };
  }
  return pickBySeed(
    [
      {
        name: "Luxe Bright",
        style: "premium luminous editorial",
        layout: "editorial",
        buttonStyle: "pill",
        surfaceStyle: "glass",
        mediaShape: "rounded",
        density: "balanced",
        accentMode: "neon",
        palette: {
          background: "#f8fafc",
          surface: "#ffffff",
          primary: "#7c3aed",
          accent: "#0ea5e9",
          text: "#0f172a",
          muted: "#64748b",
          outline: "rgba(124, 58, 237, 0.12)"
        },
        typography: { heading: "Inter", body: "Inter" }
      },
      {
        name: "Studio Neutral",
        style: "minimal luminous studio",
        layout: "minimal",
        buttonStyle: "sharp",
        surfaceStyle: "outline",
        mediaShape: "arched",
        density: "airy",
        accentMode: "fresh",
        palette: {
          background: "#f8f7f4",
          surface: "#fffefd",
          primary: "#1d4ed8",
          accent: "#14b8a6",
          text: "#1f2937",
          muted: "#6b7280",
          outline: "rgba(29, 78, 216, 0.10)"
        },
        typography: { heading: "IBM Plex Serif", body: "Inter" }
      }
    ],
    seed + 199
  );
}
function buildCategorySpecificFeatures(category, businessName, seed) {
  const categoryNorm = (category || "").toLowerCase();
  if (categoryNorm.includes("cafe") || categoryNorm.includes("restaurant")) {
    return [
      {
        title: "Curated Atmosphere",
        description: "A space designed for both quick visits and lingering moments, with photography that captures the essence of hospitality."
      },
      {
        title: "Quality First",
        description: "Every detail reflects commitment to fresh ingredients, thoughtful preparation, and the craft of hospitality."
      },
      {
        title: "Clear Online Ordering",
        description: "Streamlined booking and reservation system that respects both your time and your team's workflow."
      }
    ];
  }
  if (categoryNorm.includes("salon") || categoryNorm.includes("spa")) {
    return [
      {
        title: "Personalized Beauty",
        description: "Expert services tailored to your unique needs, from color and cuts to specialized treatments and wellness."
      },
      {
        title: "Relaxation & Care",
        description: "A sanctuary where skilled practitioners use premium products and proven techniques to create transformation."
      },
      {
        title: "Convenient Scheduling",
        description: "Book your next appointment with ease, with availability and reminders that respect your schedule."
      }
    ];
  }
  if (categoryNorm.includes("dental")) {
    return [
      {
        title: "Clinical Excellence",
        description: "Advanced diagnostic tools and evidence-based techniques combined with a calm, patient-centered approach."
      },
      {
        title: "Preventive Focus",
        description: "Education and care strategies that prioritize long-term oral health and smile confidence."
      },
      {
        title: "Comfortable Experience",
        description: "Modern techniques, clear communication, and genuine care that make dental visits something to look forward to."
      }
    ];
  }
  if (categoryNorm.includes("gym") || categoryNorm.includes("fitness")) {
    return [
      {
        title: "Results-Driven Training",
        description: "Customized programs and expert coaching that transform fitness goals into measurable achievements."
      },
      {
        title: "Community Energy",
        description: "Train alongside like-minded members in an environment that motivates and celebrates progress."
      },
      {
        title: "State-of-the-Art Equipment",
        description: "Well-maintained facilities and cutting-edge tools that support every phase of your fitness journey."
      }
    ];
  }
  if (categoryNorm.includes("real estate") || categoryNorm.includes("property")) {
    return [
      {
        title: "Expert Market Knowledge",
        description: "Deep insights into local neighborhoods, market trends, and investment opportunities backed by data and experience."
      },
      {
        title: "Personalized Guidance",
        description: "Dedicated support through every step of buying, selling, or investing in property that matters."
      },
      {
        title: "Trusted Negotiation",
        description: "Strategic representation that secures favorable terms and protects your interests in every transaction."
      }
    ];
  }
  if (categoryNorm.includes("dry clean") || categoryNorm.includes("laundry")) {
    return [
      {
        title: "Expert Garment Care",
        description: "Specialist handling for delicate fabrics and premium materials, using proven techniques and quality products."
      },
      {
        title: "Fast Turnaround",
        description: "Reliable, on-time service that respects your schedule without compromising on quality."
      },
      {
        title: "Premium Quality Assurance",
        description: "Every garment inspected and handled with the precision expected of a trusted, professional service."
      }
    ];
  }
  return [
    {
      title: "Premium Positioning",
      description: "Your service distinguished by quality, attention to detail, and a commitment to customer satisfaction."
    },
    {
      title: "Clear Value Proposition",
      description: "What you offer and why it matters, communicated with clarity and confidence."
    },
    {
      title: "Seamless Booking",
      description: "Effortless way for customers to discover, understand, and take action with your business."
    }
  ];
}
function buildCategorySpecificTestimonials(category, businessName, seed) {
  const categoryNorm = (category || "").toLowerCase();
  const names = ["Alex M.", "Jordan K.", "Casey P.", "Morgan T.", "Riley S."];
  const roles = [
    "Regular Guest",
    "Loyal Client",
    "Returning Customer",
    "Business Owner",
    "Local Professional"
  ];
  const name1 = pickBySeed(names, seed + 11);
  const name2 = pickBySeed(names, seed + 23);
  const role1 = pickBySeed(roles, seed + 37);
  const role2 = pickBySeed(roles, seed + 47);
  if (categoryNorm.includes("cafe") || categoryNorm.includes("restaurant")) {
    return [
      {
        quote: "The new site actually reflects what makes this place special\u2014it brought me back to visit.",
        author: name1,
        role: role1
      },
      {
        quote: "Booking a table online and seeing their story upfront made me want to experience it in person.",
        author: name2,
        role: role2
      }
    ];
  }
  if (categoryNorm.includes("salon") || categoryNorm.includes("spa")) {
    return [
      {
        quote: "The website shows professionalism and care\u2014exactly what I experienced when I visited.",
        author: name1,
        role: role1
      },
      {
        quote: "Easy online booking and clear service descriptions gave me confidence before my first appointment.",
        author: name2,
        role: role2
      }
    ];
  }
  if (categoryNorm.includes("dental")) {
    return [
      {
        quote: "The information online calmed my nerves before my visit. Professional and reassuring.",
        author: name1,
        role: role1
      },
      {
        quote: "Clear details about services and friendly communication made me feel valued as a patient.",
        author: name2,
        role: role2
      }
    ];
  }
  if (categoryNorm.includes("gym") || categoryNorm.includes("fitness")) {
    return [
      {
        quote: "The online tour showed real community energy\u2014joined immediately and haven't looked back.",
        author: name1,
        role: role1
      },
      {
        quote: "Clear class descriptions and trainer profiles helped me pick the perfect fit for my goals.",
        author: name2,
        role: role2
      }
    ];
  }
  if (categoryNorm.includes("real estate") || categoryNorm.includes("property")) {
    return [
      {
        quote: "Their online listing brought clarity to a complex market\u2014guided me through the whole process with expertise.",
        author: name1,
        role: role1
      },
      {
        quote: "Professional presentation and transparent communication made me feel confident in my investment decision.",
        author: name2,
        role: role2
      }
    ];
  }
  if (categoryNorm.includes("dry clean") || categoryNorm.includes("laundry")) {
    return [
      {
        quote: "My premium items have never looked better\u2014trusted professionals who care about quality.",
        author: name1,
        role: role1
      },
      {
        quote: "Reliable, on-time service with genuine attention to detail. That's why they're my go-to.",
        author: name2,
        role: role2
      }
    ];
  }
  return [
    {
      quote: "Professional, reliable, and genuinely committed to customer satisfaction.",
      author: name1,
      role: role1
    },
    {
      quote: "The online experience matched the quality of service I received in person.",
      author: name2,
      role: role2
    }
  ];
}
function buildCategorySpecificFaqs(category, businessName, seed) {
  const categoryNorm = (category || "").toLowerCase();
  if (categoryNorm.includes("cafe") || categoryNorm.includes("restaurant")) {
    return [
      {
        question: "How far in advance should I book a table?",
        answer: "Most weeknights have availability, but weekends often fill 2-3 weeks ahead. Call or book online to check real-time availability."
      },
      {
        question: "Do you accommodate dietary preferences or restrictions?",
        answer: "Yes, we work with guests on allergies, preferences, and dietary needs. Please mention these when booking or call ahead."
      },
      {
        question: "What's your cancellation policy?",
        answer: "Cancellations 24 hours in advance are free. Late cancellations are held to your card to secure your reservation."
      }
    ];
  }
  if (categoryNorm.includes("salon") || categoryNorm.includes("spa")) {
    return [
      {
        question: "How do I book my first appointment?",
        answer: "Call or book online to select your service, preferred stylist, and time. Consultations are included for new clients."
      },
      {
        question: "What should I know before my appointment?",
        answer: "Arrive a few minutes early. Bring photos for clarity on your vision. Our team will discuss any concerns or allergies."
      },
      {
        question: "What's your rescheduling and cancellation policy?",
        answer: "Free cancellations up to 24 hours before. Late cancellations are charged 50% to respect your stylist's time."
      }
    ];
  }
  if (categoryNorm.includes("dental")) {
    return [
      {
        question: "What should I do if I have a dental emergency?",
        answer: "Call us immediately. We keep emergency slots open and guide you through treatment options and costs."
      },
      {
        question: "Do you offer payment plans?",
        answer: "Yes. We work with multiple financing partners to make treatment accessible and manageable for your budget."
      },
      {
        question: "How often should I schedule cleanings?",
        answer: "Most patients benefit from cleanings every 6 months. Your dentist may recommend more frequent visits based on your health."
      }
    ];
  }
  if (categoryNorm.includes("gym") || categoryNorm.includes("fitness")) {
    return [
      {
        question: "Do I need experience to join group classes?",
        answer: "No. All fitness levels are welcome. Instructors offer modifications so you can go at your own pace."
      },
      {
        question: "What's included with a membership?",
        answer: "Full facility access, all group classes, locker rooms, and member events. Personal training is available separately."
      },
      {
        question: "Can I freeze or pause my membership?",
        answer: "Yes. Members can pause for up to 3 months. Contact us to discuss your situation."
      }
    ];
  }
  if (categoryNorm.includes("real estate") || categoryNorm.includes("property")) {
    return [
      {
        question: "What's the first step in buying or selling property?",
        answer: "Start with a consultation to discuss your goals, timeline, and market conditions. We'll create a tailored strategy."
      },
      {
        question: "How are your agent fees structured?",
        answer: "Standard rates for most transactions. We also offer consultation packages for strategic guidance. Full details available on request."
      },
      {
        question: "How long does a typical sale take?",
        answer: "Varies by market and property. Most sales take 30-45 days from offer to close. We manage timelines and reduce surprises."
      }
    ];
  }
  if (categoryNorm.includes("dry clean") || categoryNorm.includes("laundry")) {
    return [
      {
        question: "What fabrics and garments do you handle?",
        answer: "We care for wool, silk, delicate blends, leather, suede, furs, and premium items. Ask about specialty services."
      },
      {
        question: "How long does dry cleaning take?",
        answer: "Most items are ready in 2-3 business days. We offer rush service for important events when requested in advance."
      },
      {
        question: "What if something goes wrong with my garment?",
        answer: "We stand behind our work and have industry insurance. We'll discuss solutions immediately\u2014your satisfaction matters."
      }
    ];
  }
  return [
    {
      question: "How do I get started?",
      answer: "Contact us via phone or book online. We'll guide you through the process and answer any questions."
    },
    {
      question: "What's your pricing?",
      answer: "Pricing varies by service. Call or visit for a quote tailored to your specific needs."
    },
    {
      question: "Do you offer any guarantees?",
      answer: "Yes. We stand behind our service quality and customer satisfaction is our top priority."
    }
  ];
}
function createFallbackWebsiteSchema(business) {
  const siteName = business.name || "Demo Business";
  const categoryLabel = business.category || "local business";
  const copySeed = hashSeed(`${business.id || siteName}-${categoryLabel}`);
  const design = pickDesignProfile(business.category || "", copySeed);
  const imagePool = collectBusinessImages(business);
  const layoutVariant = pickBySeed(
    [
      "editorial",
      "split-screen",
      "gallery-forward",
      "minimal",
      "immersive"
    ],
    copySeed + 7
  );
  const buttonVariant = pickBySeed(
    ["pill", "sharp", "ghost"],
    copySeed + 13
  );
  const mediaVariant = pickBySeed(
    ["arched", "rounded", "portrait"],
    copySeed + 19
  );
  const densityVariant = pickBySeed(
    ["airy", "balanced", "compact"],
    copySeed + 23
  );
  const accentVariant = pickBySeed(
    ["earthy", "luxury", "fresh", "neon"],
    copySeed + 31
  );
  const categoryNorm = (business.category || "").toLowerCase();
  const heroVariant = categoryNorm.includes("salon") || categoryNorm.includes("spa") ? pickBySeed(
    ["magazine", "editorial-split", "centered", "minimal", "split"],
    copySeed + 5
  ) : layoutVariant === "minimal" ? "centered" : layoutVariant === "immersive" ? "immersive" : layoutVariant === "split-screen" ? "split" : "split";
  const featureLayout = categoryNorm.includes("salon") || categoryNorm.includes("spa") ? pickBySeed(["bento", "alternating-stack", "editorial-cards"], copySeed + 9) : layoutVariant === "minimal" ? "list" : "cards";
  const heroImage = imagePool[0] || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80";
  const heroSubheadline = buildUniqueHeroSubheadline(
    siteName,
    categoryLabel,
    copySeed
  );
  const features = buildCategorySpecificFeatures(
    business.category || "",
    siteName,
    copySeed
  );
  const testimonials = buildCategorySpecificTestimonials(
    business.category || "",
    siteName,
    copySeed
  );
  const faqs = buildCategorySpecificFaqs(
    business.category || "",
    siteName,
    copySeed
  );
  const sectionOrder = buildSectionOrderPattern(
    business.category || "",
    copySeed
  );
  const baseSections = [
    {
      id: "hero-1",
      type: "hero",
      variant: heroVariant,
      headline: siteName,
      subheadline: heroSubheadline,
      ctaPrimary: { label: "Get Started", href: "#contact" },
      ctaSecondary: { label: "Learn More", href: "#features" },
      badges: [design.name],
      media: {
        type: "image",
        src: heroImage,
        alt: siteName
      }
    }
  ];
  const midSections = [];
  for (const sectionType of sectionOrder) {
    if (sectionType === "features") {
      midSections.push({
        id: "features-1",
        type: "features",
        layout: featureLayout,
        items: features
      });
    } else if (sectionType === "gallery") {
      midSections.push({
        id: "gallery-1",
        type: "gallery",
        items: [
          {
            src: imagePool[1] || imagePool[0] || "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
            alt: `${siteName} gallery 1`
          },
          {
            src: imagePool[2] || imagePool[1] || imagePool[0] || "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
            alt: `${siteName} gallery 2`
          },
          {
            src: imagePool[3] || imagePool[2] || imagePool[1] || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
            alt: `${siteName} gallery 3`
          }
        ]
      });
    } else if (sectionType === "testimonials") {
      midSections.push({
        id: "testimonials-1",
        type: "testimonials",
        items: testimonials
      });
    } else if (sectionType === "faq") {
      midSections.push({
        id: "faq-1",
        type: "faq",
        items: faqs
      });
    } else if (sectionType === "cta") {
      midSections.push({
        id: "cta-1",
        type: "cta",
        title: `Ready to discover ${siteName}?`,
        body: "Reach out today and let's discuss how we can help you achieve your goals.",
        buttonLabel: "Get in Touch",
        buttonHref: "#contact"
      });
    }
  }
  const allSections = [
    ...baseSections,
    ...midSections,
    { id: "contact-1", type: "contact", showEmail: true, showPhone: true }
  ];
  const schema = {
    meta: {
      siteId: `fallback-${business.id || "business"}-${Date.now()}`,
      businessId: business.id || "business",
      slug: siteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      version: 1,
      target: "static"
    },
    theme: {
      name: design.name,
      style: design.style,
      radius: design.surfaceStyle === "solid" ? "20px" : layoutVariant === "minimal" ? "16px" : "28px",
      layout: layoutVariant,
      buttonStyle: buttonVariant,
      surfaceStyle: design.surfaceStyle,
      mediaShape: mediaVariant,
      density: densityVariant,
      accentMode: accentVariant,
      palette: design.palette,
      typography: design.typography
    },
    brand: {
      businessName: siteName,
      category: business.category || "Local Business",
      address: business.address || "",
      phone: business.phoneNumber || "",
      email: business.email || "",
      websiteUri: business.websiteUri || "",
      logo: business.logo || imagePool[0] || ""
    },
    seo: {
      title: `${siteName} | Preview`,
      description: `Premium website for ${siteName}\u2014${categoryLabel} services with modern design and seamless booking.`,
      keywords: [
        business.category || "local",
        "services",
        "premium",
        categoryLabel
      ]
    },
    sections: allSections,
    _validation: {
      repairs: [],
      validatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      photos: business.photos || [],
      imageSuggestions: business.imageSuggestions || [],
      logo: business.logo || ""
    }
  };
  return ensureNonTemplateCopy(schema, business);
}
app.post("/api/generate", async (req, res) => {
  try {
    const business = req.body;
    if (!business || !business.name) {
      return res.status(400).json({ error: "Missing business payload" });
    }
    const debugSession = createGenerationDebugSession(business);
    res.setHeader("x-debug-generation-id", debugSession.traceId);
    res.setHeader("x-debug-generation-fallback", "false");
    persistGenerationDebugFile(
      debugSession,
      "01-business-input.json",
      buildBusinessDebugInput(business)
    );
    if (WEBSITE_GENERATION_MODE === "template") {
      console.log(
        "[Generate] Using TEMPLATE mode (TEST_MODE) - skipping Gemini"
      );
      debugSession.fallbackReason = "template-mode";
      appendGenerationDebugError(
        debugSession,
        "fallback_triggered: template mode"
      );
      res.setHeader("x-debug-generation-fallback", "true");
      const fallbackSchema = createFallbackWebsiteSchema(business);
      persistGenerationDebugFile(
        debugSession,
        "05-normalized-schema.json",
        fallbackSchema
      );
      return res.json(fallbackSchema);
    }
    if (!GENAI_KEY && !process.env.GEMINI_REST_URL) {
      debugSession.fallbackReason = "missing-config";
      appendGenerationDebugError(
        debugSession,
        "fallback_triggered: no Gemini API configuration found"
      );
      res.setHeader("x-debug-generation-fallback", "true");
      const fallbackSchema = createFallbackWebsiteSchema(business);
      persistGenerationDebugFile(
        debugSession,
        "05-normalized-schema.json",
        fallbackSchema
      );
      return res.json(fallbackSchema);
    }
    const buildImageBlock = (b) => {
      const sources = collectBusinessImages(b);
      return sources.length ? sources.map(
        (u, i) => `${i + 1}. ${u}${i < (b.photos || []).length ? " (business photo / Google Maps source)" : " (additional reference image)"}`
      ).join("\n") : "No direct image URLs provided.";
    };
    const buildReviewsBlock = (b) => {
      if (Array.isArray(b.reviews) && b.reviews.length) {
        return b.reviews.map(
          (r, i) => `${i + 1}. ${r.rating || ""} - ${r.text || r.comment || ""}`
        ).join("\n");
      }
      return "No reviews provided.";
    };
    const qualificationNotes = business.notes || business.qualificationNotes || business.notes || "None";
    const neighborhood = business.neighborhood || business.vibe || "Unknown";
    const specialties = Array.isArray(business.specialties) ? business.specialties.join(", ") : business.specialties || "General services";
    const tone = business.tone || "professional";
    const creativeSeed = `${business.id || "lead"}-${Date.now()}`;
    const prompt = `You are generating a PREMIUM WORDPRESS HOMEPAGE schema for a real local business.

This output is used to create the final WordPress site. Optimize for the WordPress result, not for a generic preview.

PRIMARY OBJECTIVE:
- Make the site feel bespoke, premium, and clearly different from other businesses.
- Use category-aware composition, specific service copy, and distinct section rhythm.
- Avoid anything that feels like a safe local-business template.

ABSOLUTE RULES:
- Light theme only. No black or charcoal backgrounds. No dark hero sections.
- Return valid JSON only.
- Do not use generic phrases like "designed to convert", "cutting-edge", "innovative", "best-in-class", or "one-stop shop".
- Hero must be first. Contact must be last.
- Sections 2-6 may be reordered for uniqueness.
- If reference images are provided, use those exact URLs first for hero and gallery media.
- Do not use unrelated stock imagery when real business photos are available.
- Avoid the common local-business pattern of: split hero -> 3 cards -> simple gallery -> testimonials -> FAQ -> CTA -> contact unless the seed clearly justifies it.
- Each site should feel like a different art direction, not a recolor of the same template.

SUPPORTED THEME ENUMS:
- layout: "editorial" | "immersive" | "minimal" | "gallery-forward" | "split-screen"
- buttonStyle: "pill" | "sharp" | "ghost"
- surfaceStyle: "glass" | "solid" | "outline"
- mediaShape: "rounded" | "arched" | "portrait" | "square"
- density: "airy" | "balanced" | "compact"
- accentMode: "neon" | "earthy" | "luxury" | "fresh"

SUPPORTED SECTION VARIANTS:
- hero.variant: "immersive" | "cinematic" | "editorial" | "editorial-split" | "magazine" | "centered" | "minimal" | "split"
- features.variant: "bento" | "editorial-cards" | "editorial-list" | "alternating-stack" | "grid"
- gallery.variant: "editorial-mosaic" | "stacked-collage" | "collage"
- testimonials.variant: "floating-cards" | "editorial-quotes" | "spotlight"
- faq.variant: "cards" | "split-columns" | "grid"
- cta.variant: "gradient-band" | "split-card" | "side-by-side"
- contact.variant: "split-card" | "minimal-centered" | "centered"

REQUIRED SECTIONS:
- hero
- features
- gallery
- testimonials
- faq
- cta
- contact

SECTION CONTENT RULES:
- hero:
  - strong headline
  - specific subheadline tied to the business
  - ctaPrimary with action label and href "#contact"
  - optional ctaSecondary with href "#services" or "#gallery"
  - media { src, alt }
- features:
  - 3 to 5 items
  - use real service names or believable category-specific offerings
  - descriptions must be concrete, not hype
- gallery:
  - 3 to 5 images
  - use provided business photos first when available
  - do not substitute unrelated imagery if business photos already cover the scene, storefront, staff, work, or interior
  - alt text must be descriptive
- testimonials:
  - 2 to 4 realistic quotes
  - mention specific benefits or experiences
- faq:
  - 3 to 5 practical customer questions
  - clear, grounded answers
- cta:
  - title
  - body
  - buttonLabel
  - buttonHref "#contact"
- contact:
  - present the supplied business details professionally
  - do not invent email addresses

UNIQUENESS RULES:
- Use this seed to make layout and pacing distinct: ${creativeSeed}
- Do not make every site use the same hero, same feature grid, and same gallery arrangement.
- Make section order, section variant choices, and tone visibly specific to the business.
- Match the category:
  - salon/spa: elegant, airy, editorial
  - cafe/restaurant: warm, sensory, layered
  - dental/medical: calm, precise, trust-first
  - gym/fitness: energetic, bold, high contrast in layout
  - dry cleaning/laundry: polished, crisp, reassuring
  - real estate/property: architectural, image-led
  - professional services: restrained, authoritative

THEME RULES:
- backgrounds and surfaces must be very light
- text must be dark and readable
- accents should feel premium and category-appropriate
- typography should feel intentional
- choose a distinct heading/body font pairing for this specific business
- prefer visibly different composition, spacing rhythm, and section hierarchy from other sites in the same category
- customCss is optional; include it only if it materially improves the final WordPress site

Business Context:
- Name: ${business.name}
- Category: ${business.category || "Local Service"}
- Address: ${business.address || "N/A"}
- Phone: ${business.phoneNumber || "N/A"}
- Email: ${business.email || "NONE PROVIDED (Do not invent an email if this is the case)"}
- Website: ${business.websiteUri || "N/A"}
- Logo: ${business.logo || "None detected"}

Qualification Notes:
${qualificationNotes}

Neighborhood / Vibe:
${neighborhood}

Service Specialties:
${specialties}

Customer Tone / Sentiment:
${tone}

Reviews:
${buildReviewsBlock(business)}

Reference Images:
${buildImageBlock(business)}

Return only valid JSON matching the WebsiteSchema TypeScript interface.`;
    const modelsToTry = [
      { name: "gemini-flash-latest", timeoutMs: 45e3 },
      { name: "gemini-flash-latest", timeoutMs: 45e3 }
    ];
    const callGeminiText = async (promptText, stageLabel) => {
      let stageRawText = "";
      let stageLastError = null;
      for (const model of modelsToTry) {
        try {
          const restUrl = process.env.GEMINI_REST_URL;
          if (restUrl && GENAI_KEY) {
            const modelRestUrl = restUrl.includes("{model}") ? restUrl.replace("{model}", model.name) : restUrl;
            console.error(`[Gemini] Attempting ${stageLabel} direct REST call to ${modelRestUrl}...`);
            const url = `${modelRestUrl}${modelRestUrl.includes("?") ? "&" : "?"}key=${GENAI_KEY}`;
            const fetchResponse = await Promise.race([
              fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: promptText }] }],
                  generationConfig: {
                    temperature: stageLabel === "schema" ? 0.9 : 0.75,
                    maxOutputTokens: stageLabel === "schema" ? 8192 : 12288
                  }
                })
              }),
              new Promise(
                (_, reject) => setTimeout(() => reject(new Error(`REST timeout after ${model.timeoutMs}ms`)), model.timeoutMs)
              )
            ]);
            if (!fetchResponse.ok) {
              throw new Error(`REST failed (${fetchResponse.status}): ${await fetchResponse.text()}`);
            }
            const data = await fetchResponse.json();
            stageRawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          } else {
            console.error(`[Gemini] Attempting ${stageLabel} SDK call for ${model.name}...`);
            const genAI = await getSDKGenAI();
            if (!genAI) {
              throw new Error("Gemini SDK not available.");
            }
            const response = await Promise.race([
              genAI.getGenerativeModel({ model: model.name }).generateContent(promptText),
              new Promise(
                (_, reject) => setTimeout(
                  () => reject(
                    new Error(`${model.name} request timed out after ${model.timeoutMs}ms`)
                  ),
                  model.timeoutMs
                )
              )
            ]);
            const result = await response.response;
            stageRawText = result.text().trim();
          }
          if (stageRawText) {
            console.error(`[Gemini] ${model.name} ${stageLabel} success! Response length: ${stageRawText.length}`);
            return stageRawText;
          }
          console.error(`[Gemini] ${model.name} returned empty ${stageLabel} text.`);
        } catch (error) {
          stageLastError = error;
          console.error(`[Gemini] ${model.name} ${stageLabel} failed:`, error instanceof Error ? error.message : error);
          fs2.writeSync(2, `[Gemini] ${stageLabel.toUpperCase()} ERROR DETAIL: ${JSON.stringify(error)}
`);
        }
      }
      throw stageLastError || new Error(`All Gemini ${stageLabel} attempts failed`);
    };
    console.error(`[Gemini] Starting generation for ${business.name} with model ${modelsToTry[0].name}`);
    fs2.writeSync(2, `
--- GEMINI PROMPT START ---
${prompt}
--- GEMINI PROMPT END ---
`);
    persistGenerationDebugFile(debugSession, "02-generation-prompt.md", prompt);
    const rawText = await callGeminiText(prompt, "schema");
    fs2.writeSync(2, `
--- GEMINI RESPONSE START ---
${rawText}
--- GEMINI RESPONSE END ---
`);
    persistGenerationDebugFile(
      debugSession,
      "03-gemini-raw-response.txt",
      rawText
    );
    const parsedSchema = parseWebsiteSchemaOutput(
      rawText,
      business,
      debugSession
    );
    if (!parsedSchema) {
      console.warn(
        "[Generate] Gemini output could not be parsed as WebsiteSchema, using fallback schema."
      );
      debugSession.fallbackReason = "parse-failure";
      appendGenerationDebugError(
        debugSession,
        "fallback_triggered: parse failure"
      );
      res.setHeader("x-debug-generation-fallback", "true");
      const fallbackSchema = createFallbackWebsiteSchema(business);
      persistGenerationDebugFile(
        debugSession,
        "05-normalized-schema.json",
        fallbackSchema
      );
      return res.json(fallbackSchema);
    }
    const { validateWebsiteSchema: validateWebsiteSchema2 } = await Promise.resolve().then(() => (init_website_schema_validator(), website_schema_validator_exports));
    const validation = validateWebsiteSchema2(parsedSchema);
    const finalSchema = validation.repairedSchema || parsedSchema;
    try {
      const wordpressHtmlPrompt = `You are turning an approved website schema into the FINAL WordPress homepage HTML.

Return ONLY homepage HTML suitable for WordPress post_content.
Do not return JSON.
Do not explain anything.
Do not wrap the response in markdown unless it is a plain \`\`\`html fenced block.
Do not output JavaScript.
Use one initial <style> block if needed, then the homepage markup.
Render the sections in the schema order exactly as provided.
Use the exact business copy and exact media URLs from the schema.
Do not collapse the page into a common in-house template.
Make the composition, spacing, typography treatment, and hierarchy feel bespoke to this business.
Light theme only.
No site header chrome, no WordPress admin text, no fake badges like "crafted for premium presentation".
No generic placeholder copy.

BUSINESS:
${JSON.stringify({
        name: business.name,
        category: business.category,
        address: business.address,
        phone: business.phoneNumber,
        email: business.email,
        website: business.websiteUri
      }, null, 2)}

APPROVED SCHEMA:
${JSON.stringify(finalSchema, null, 2)}

Return only the final HTML for the homepage body content.`;
      persistGenerationDebugFile(debugSession, "05a-wordpress-html-prompt.md", wordpressHtmlPrompt);
      const rawWordPressHtml = await callGeminiText(wordpressHtmlPrompt, "wordpress-html");
      fs2.writeSync(2, `
--- GEMINI WORDPRESS HTML START ---
${rawWordPressHtml}
--- GEMINI WORDPRESS HTML END ---
`);
      persistGenerationDebugFile(debugSession, "05b-wordpress-html-raw.txt", rawWordPressHtml);
      const extractedWordPressHtml = extractHtmlDocument(rawWordPressHtml) || rawWordPressHtml.trim();
      if (extractedWordPressHtml) {
        finalSchema._wordpressHtml = extractedWordPressHtml;
        finalSchema._renderSource = "gemini-html";
        persistGenerationDebugFile(debugSession, "05c-wordpress-html-final.html", extractedWordPressHtml);
      }
    } catch (wordpressHtmlError) {
      finalSchema._renderSource = "local-builder";
      appendGenerationDebugError(
        debugSession,
        `wordpress_html_generation_failed: ${wordpressHtmlError instanceof Error ? wordpressHtmlError.message : String(wordpressHtmlError)}`
      );
    }
    try {
      await pool.query(
        `INSERT INTO generation_audit_logs (trace_id, step, message, data) VALUES (?, ?, ?, ?)`,
        [
          debugSession.traceId,
          "generation_completed",
          validation.isValid ? "Valid schema generated" : "Schema repaired during validation",
          JSON.stringify({
            model: modelsToTry[0].name,
            isValid: validation.isValid,
            repairs: validation.repairs,
            errors: validation.errors
          })
        ]
      );
    } catch (e) {
      console.error("[DB] Audit log failed:", e);
    }
    persistGenerationDebugFile(
      debugSession,
      "05-normalized-schema.json",
      finalSchema
    );
    debugSession.sectionTypes = finalSchema.sections.map(
      (section) => section.type
    );
    res.setHeader("x-debug-generation-fallback", "false");
    return res.json(finalSchema);
  } catch (error) {
    const fallbackSchema = createFallbackWebsiteSchema(req.body);
    const debugSession = req.body && req.body.name ? Array.from(generationDebugSessions.values()).find(
      (session) => session.businessName === req.body.name
    ) : void 0;
    if (debugSession) {
      appendGenerationDebugError(
        debugSession,
        `route_error: ${error instanceof Error ? error.message : String(error)}`
      );
      persistGenerationDebugFile(
        debugSession,
        "05-normalized-schema.json",
        fallbackSchema
      );
      res.setHeader("x-debug-generation-id", debugSession.traceId);
      res.setHeader("x-debug-generation-fallback", "true");
    }
    console.warn("/api/generate falling back to local schema:", error);
    return res.json(fallbackSchema);
  }
});
app.post(
  "/api/debug-generation/:traceId/file",
  (req, res) => {
    const { traceId } = req.params;
    const session = getGenerationDebugSession(traceId);
    if (!session) {
      return res.status(404).json({ error: "Unknown debug generation trace" });
    }
    const { fileName, content, append } = req.body || {};
    if (!fileName) {
      return res.status(400).json({ error: "Missing fileName" });
    }
    persistGenerationDebugFile(
      session,
      fileName,
      content ?? "",
      Boolean(append)
    );
    return res.json({ success: true, traceId, fileName });
  }
);
app.get(
  "/api/debug-generation/:traceId/summary",
  (req, res) => {
    const { traceId } = req.params;
    const session = getGenerationDebugSession(traceId);
    if (!session) {
      return res.status(404).json({ error: "Unknown debug generation trace" });
    }
    return res.json(session);
  }
);
app.post(
  "/api/deploy",
  async (req, res) => {
    try {
      if (!NETLIFY_TOKEN) {
        return res.status(500).json({ error: "Netlify token not configured on server" });
      }
      const { websiteContent, businessName } = req.body;
      if (!websiteContent || !businessName) {
        return res.status(400).json({ error: "Missing websiteContent or businessName" });
      }
      const siteName = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "digital-scout"}-${Date.now()}`;
      const siteResponse = await fetch("https://api.netlify.com/api/v1/sites", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NETLIFY_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: siteName })
      });
      if (!siteResponse.ok) {
        const errorDetails = await siteResponse.text();
        return res.status(siteResponse.status).json({
          error: `Netlify site creation failed: ${siteResponse.statusText}`,
          details: errorDetails
        });
      }
      const siteData = await siteResponse.json();
      const siteId = siteData.id;
      const deployedUrl = siteData.ssl_url || siteData.url || siteData.deploy_url;
      const sha1 = crypto2.createHash("sha1").update(websiteContent).digest("hex");
      const deployResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NETLIFY_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            files: {
              "/index.html": sha1
            }
          })
        }
      );
      if (!deployResponse.ok) {
        const errorDetails = await deployResponse.text();
        return res.status(deployResponse.status).json({
          error: `Netlify deploy creation failed: ${deployResponse.statusText}`,
          details: errorDetails
        });
      }
      const deployData = await deployResponse.json();
      const deployId = deployData.id;
      const uploadResponse = await fetch(
        `https://api.netlify.com/api/v1/deploys/${deployId}/files/index.html`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${NETLIFY_TOKEN}`,
            "Content-Type": "application/octet-stream"
          },
          body: websiteContent
        }
      );
      if (!uploadResponse.ok) {
        const errorDetails = await uploadResponse.text();
        return res.status(uploadResponse.status).json({
          error: `Netlify file upload failed: ${uploadResponse.statusText}`,
          details: errorDetails
        });
      }
      return res.json({
        success: true,
        deployedUrl,
        siteId,
        deployId,
        deployedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Deployment failed"
      });
    }
  }
);
app.post(
  "/api/enrich-business",
  async (req, res) => {
    try {
      let categoryImageSuggestions = function(cat, name) {
        const c = (cat || "").toLowerCase();
        if (c.includes("restaurant") || c.includes("cafe")) {
          return [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1541542684-18f77c1f6b5a?auto=format&fit=crop&w=1200&q=80"
          ];
        }
        if (c.includes("salon") || c.includes("spa")) {
          return [
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1200&q=80"
          ];
        }
        if (c.includes("gym") || c.includes("fitness")) {
          return [
            "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1517960413843-0aee4a3d5a0c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1558611848-73f7eb4001d6?auto=format&fit=crop&w=1200&q=80"
          ];
        }
        return [
          "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1500306365237-7b4b9d7d0f0b?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
        ];
      };
      const { websiteUri, businessName, category, photos } = req.body;
      if (!businessName) {
        return res.status(400).json({ error: "Missing businessName" });
      }
      let detectedLogo = photos && photos.length > 0 ? photos[0] : void 0;
      if (detectedLogo && detectedLogo.includes("googleusercontent.com")) {
        detectedLogo = detectedLogo.split("=")[0] + "=s400-c";
      }
      if (!websiteUri) {
        return res.json({
          email: void 0,
          phones: [],
          imageSuggestions: categoryImageSuggestions(category, businessName)
        });
      }
      const response = await fetch(websiteUri, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; DigitalScout/1.0)"
        }
      });
      if (!response.ok) {
        return res.json({
          email: void 0,
          phones: [],
          imageSuggestions: []
        });
      }
      const html = await response.text();
      const email = extractEmails(html)[0];
      const phones = extractPhones(html);
      const imageSuggestions = extractImages(html);
      const websiteLogo = extractLogo(html, websiteUri);
      if (websiteLogo) {
        detectedLogo = websiteLogo;
      }
      return res.json({
        email,
        phones,
        imageSuggestions,
        logo: detectedLogo,
        businessName,
        category
      });
    } catch (error) {
      console.error("Enrich business error:", error);
      return res.json({
        email: void 0,
        phones: [],
        imageSuggestions: [],
        logo: req.body.photos?.[0]
      });
    }
  }
);
function extractLogo(html, baseUrl) {
  try {
    const iconRegex = /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i;
    const appleIconRegex = /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i;
    const ogImageRegex = /<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i;
    const schemaLogoRegex = /["']logo["']\s*:\s*["']([^"']+)["']/i;
    const match = html.match(ogImageRegex) || html.match(appleIconRegex) || html.match(iconRegex) || html.match(schemaLogoRegex);
    if (match && match[1]) {
      let logoUrl = match[1];
      if (logoUrl.startsWith("//")) {
        logoUrl = "https:" + logoUrl;
      } else if (logoUrl.startsWith("/")) {
        const origin = new URL(baseUrl).origin;
        logoUrl = origin + logoUrl;
      } else if (!logoUrl.startsWith("http")) {
        const origin = new URL(baseUrl).origin;
        logoUrl = origin + "/" + logoUrl;
      }
      return logoUrl;
    }
    try {
      const origin = new URL(baseUrl).origin;
      return `${origin}/favicon.ico`;
    } catch {
      return void 0;
    }
  } catch {
    return void 0;
  }
}
app.post(
  "/api/qualify-leads",
  async (req, res) => {
    try {
      const { businesses, city } = req.body;
      if (!Array.isArray(businesses)) {
        return res.status(400).json({ error: "Missing businesses array" });
      }
      const candidates = businesses.filter(
        (business) => business && typeof business.name === "string"
      );
      const qualifications = await runWithConcurrency(
        candidates,
        3,
        async (business) => {
          const qualification = await qualifyLeadCandidate(business, city);
          return { business, qualification };
        }
      );
      const qualifiedBusinesses = qualifications.filter(
        ({ qualification }) => !qualification.hasWebsite && Boolean(qualification.email || qualification.phoneNumber)
      ).map(({ business, qualification }) => ({
        ...business,
        websiteUri: qualification.websiteUri,
        email: qualification.email || business.email,
        phoneNumber: qualification.phoneNumber || business.phoneNumber,
        notes: qualification.notes || void 0,
        confidence: qualification.confidence || void 0
      }));
      return res.json({
        businesses: qualifiedBusinesses,
        totalCandidates: candidates.length,
        totalQualified: qualifiedBusinesses.length
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Lead qualification failed"
      });
    }
  }
);
app.post(
  "/api/wordpress/provision-site",
  async (req, res) => {
    try {
      const { projectId, business, websiteSchema, provisioningPlan, status } = req.body;
      if (!projectId || !business || !websiteSchema) {
        return res.status(400).json({
          error: "Missing projectId, business, or websiteSchema."
        });
      }
      const jobId = crypto2.randomUUID();
      const traceId = websiteSchema.meta?.traceId || websiteSchema._validation?.traceId || null;
      const isPreview = String(projectId).includes("preview-");
      const previewExpiresAt = isPreview ? new Date(Date.now() + 24 * 60 * 60 * 1e3) : null;
      const [existing] = await pool.query(
        `SELECT id FROM provisioning_jobs WHERE project_id = ? LIMIT 1`,
        [projectId]
      );
      const targetStatus = status || "pending";
      let activeJobId = jobId;
      if (existing && existing.length > 0) {
        activeJobId = existing[0].id;
        await pool.query(
          `UPDATE provisioning_jobs SET website_schema = ?, status = ?, trace_id = ?, updated_at = NOW() WHERE project_id = ?`,
          [
            JSON.stringify(websiteSchema),
            targetStatus,
            traceId,
            projectId
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO provisioning_jobs (id, project_id, business_name, website_schema, status, trace_id, is_preview, preview_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            jobId,
            projectId,
            business.name,
            JSON.stringify(websiteSchema),
            targetStatus,
            traceId,
            isPreview,
            previewExpiresAt
          ]
        );
      }
      return res.json({
        success: true,
        jobId: activeJobId,
        message: isPreview ? "Preview provisioning queued" : "Provisioning job queued successfully",
        previewExpiresAt
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to queue provisioning job"
      });
    }
  }
);
app.get("/api/wordpress/site-status/:projectId", async (req, res) => {
  const { projectId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT status, logs, subdomain, subdomain_url, wp_admin_url, ssl_status, wp_admin_user, wp_admin_pass_encrypted 
			 FROM provisioning_jobs 
			 LEFT JOIN isolated_deployments ON provisioning_jobs.project_id = isolated_deployments.project_id
			 WHERE provisioning_jobs.project_id = ? ORDER BY provisioning_jobs.created_at DESC LIMIT 1`,
      [projectId]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }
    let rawPassword = null;
    if (rows[0].status === "completed" && rows[0].wp_admin_pass_encrypted) {
      try {
        const [ivHex, encryptedHex] = rows[0].wp_admin_pass_encrypted.split(":");
        const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
        const decipher = crypto2.createDecipheriv("aes-256-cbc", Buffer.from(key), Buffer.from(ivHex, "hex"));
        let decrypted = decipher.update(Buffer.from(encryptedHex, "hex"));
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        rawPassword = decrypted.toString();
      } catch (e) {
        console.error("Decryption failed:", e);
      }
    }
    const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscout.online";
    const liveUrl = rows[0].subdomain_url || (rows[0].subdomain ? `http://${rows[0].subdomain}.${rootDomain}` : null);
    const adminUrl = rows[0].wp_admin_url || (rows[0].subdomain ? `http://${rows[0].subdomain}.${rootDomain}/wp-admin` : null);
    const effectiveStatus = rows[0].status === "completed" || liveUrl || adminUrl ? "completed" : rows[0].status;
    return res.json({
      success: true,
      status: effectiveStatus,
      logs: rows[0].logs || [],
      deployment: liveUrl ? {
        liveUrl,
        adminUrl,
        username: rows[0].wp_admin_user || "admin",
        password: rawPassword,
        sslStatus: rows[0].ssl_status || "pending"
      } : null
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch status"
    });
  }
});
app.get("/api/generate/replay/:traceId", async (req, res) => {
  const { traceId } = req.params;
  try {
    const inputPath = path2.join(DEBUG_ROOT_DIR, traceId, "06-renderer-input.json");
    if (!fs2.existsSync(inputPath)) {
      return res.status(404).json({ error: "Trace not found or missing renderer input" });
    }
    const schemaContent = fs2.readFileSync(inputPath, "utf-8");
    const rawSchema = JSON.parse(schemaContent);
    const { validateWebsiteSchema: validateWebsiteSchema2 } = await Promise.resolve().then(() => (init_website_schema_validator(), website_schema_validator_exports));
    const { schemaToGutenbergBlocks: schemaToGutenbergBlocks2 } = await Promise.resolve().then(() => (init_wordpress(), wordpress_exports));
    const validatedSchema = validateWebsiteSchema2(rawSchema);
    const blocks = schemaToGutenbergBlocks2(validatedSchema);
    return res.json({
      success: true,
      schema: validatedSchema,
      blocks
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to replay trace" });
  }
});
app.delete("/api/wordpress/site/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: "Missing projectId" });
    }
    await deleteProvisionedWordPressSite(projectId);
    return res.json({
      success: true,
      message: `WordPress site for project ${projectId} deleted successfully`
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete WordPress site"
    });
  }
});
app.get("/api/leads", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
				pj.project_id as id,
				pj.business_name as businessName,
				pj.website_schema as websiteSchema,
				pj.status as provisioningStatus,
				pj.created_at as lastProvisionedAt,
				pj.wp_admin_user as wordpressOwnerUsername,
				pj.wp_admin_pass_encrypted,
				idp.subdomain_url as wordpressSiteUrl,
				idp.wp_admin_url as wordpressAdminUrl,
				idp.ssl_status as sslStatus
			 FROM provisioning_jobs pj
			 LEFT JOIN isolated_deployments idp ON pj.project_id = idp.project_id
			 ORDER BY pj.created_at DESC`
    );
    const leads = rows.map((row) => {
      let rawPassword = null;
      if (row.wp_admin_pass_encrypted) {
        try {
          const [ivHex, encryptedHex] = row.wp_admin_pass_encrypted.split(":");
          const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
          const decipher = crypto2.createDecipheriv("aes-256-cbc", Buffer.from(key), Buffer.from(ivHex, "hex"));
          let decrypted = decipher.update(Buffer.from(encryptedHex, "hex"));
          decrypted = Buffer.concat([decrypted, decipher.final()]);
          rawPassword = decrypted.toString();
        } catch (e) {
        }
      }
      const schema = row.websiteSchema || {};
      return {
        ...row,
        businessId: schema.meta?.businessId || row.id,
        businessAddress: schema.brand?.address || "",
        businessCategory: schema.brand?.category || "General",
        rating: schema._validation?.rating || 0,
        reviewCount: schema._validation?.reviewCount || 0,
        email: schema.brand?.email || "",
        phoneNumber: schema.brand?.phone || "",
        logo: schema.brand?.logo || schema._validation?.logo || "",
        photos: schema._validation?.photos || [],
        imageSuggestions: schema._validation?.imageSuggestions || [],
        wordpressPassword: rawPassword,
        websiteContent: ""
      };
    });
    return res.json(leads);
  } catch (error) {
    console.error("[Leads] Failed to fetch leads:", error);
    return res.status(500).json({ error: "Failed to fetch leads history" });
  }
});
app.post(
  "/api/outreach/send",
  async (req, res) => {
    try {
      const { businessName, phoneNumber, message, preferredChannel } = req.body;
      if (!businessName || !phoneNumber || !message) {
        return res.status(400).json({
          error: "Missing required fields: businessName, phoneNumber, message"
        });
      }
      if (!CALLHIPPO_API_KEY) {
        console.error("[CallHippo] API key is not configured");
        return res.status(500).json({
          error: "CallHippo API key is not configured on the server. Please check .env.local."
        });
      }
      const result = await sendOutreachViaCallHippo(
        {
          businessName,
          phoneNumber,
          message,
          preferredChannel: preferredChannel || "whatsapp"
        },
        CALLHIPPO_API_KEY
      );
      if (result.success) {
        console.log(
          `[Outreach] Successfully sent via ${result.channel} to ${phoneNumber}`
        );
        return res.json({
          success: true,
          channel: result.channel,
          messageId: result.messageId,
          status: result.status
        });
      } else {
        console.warn(
          `[Outreach] Failed to send to ${phoneNumber}: ${result.error}`
        );
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to send outreach message"
        });
      }
    } catch (error) {
      console.error("[Outreach] Unexpected error:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Outreach sending failed"
      });
    }
  }
);
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.delete("/api/sites/:siteId", async (req, res) => {
  try {
    if (!NETLIFY_TOKEN) {
      return res.status(500).json({ error: "Netlify token not configured on server" });
    }
    const { siteId } = req.params;
    if (!siteId) {
      return res.status(400).json({ error: "Missing siteId" });
    }
    const response = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${NETLIFY_TOKEN}`
        }
      }
    );
    if (!response.ok) {
      const errorDetails = await response.text();
      return res.status(response.status).json({
        error: `Failed to delete Netlify site: ${response.statusText}`,
        details: errorDetails
      });
    }
    return res.json({ success: true, siteId });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Delete failed"
    });
  }
});
async function pollSslStatus() {
  try {
    const [deployments] = await pool.query(
      `SELECT * FROM isolated_deployments WHERE ssl_status = 'pending' LIMIT 5`
    );
    for (const dep of deployments) {
      const httpsUrl = dep.subdomain_url.replace("http://", "https://");
      const host = httpsUrl.replace("https://", "").split("/")[0];
      console.log(`[SSL Worker] Checking SSL for ${host}`);
      try {
        const https = await import("https");
        await new Promise((resolve, reject) => {
          const req = https.get({
            hostname: host,
            port: 443,
            path: "/",
            timeout: 5e3,
            rejectUnauthorized: true
            // We want to know if the cert is valid
          }, (res) => {
            resolve(true);
          });
          req.on("error", (e) => reject(e));
          req.on("timeout", () => {
            req.destroy();
            reject(new Error("Timeout"));
          });
        });
        console.log(`[SSL Worker] SSL is VALID for ${httpsUrl}. Upgrading...`);
        await pool.query(
          `UPDATE isolated_deployments SET ssl_status = 'valid', subdomain_url = ?, wp_admin_url = ? WHERE id = ?`,
          [httpsUrl, `${httpsUrl}/wp-admin`, dep.id]
        );
      } catch (error) {
        console.log(`[SSL Worker] SSL not ready for ${host}`);
      }
    }
  } catch (error) {
    console.error("[SSL Worker] Error:", error);
  }
}
async function pollCleanupPreviewSites() {
  try {
    const [deployments] = await pool.query(
      `SELECT project_id, preview_expires_at, status FROM provisioning_jobs WHERE preview_expires_at < NOW() AND status != 'cleaned' LIMIT 10`
    );
    for (const dep of deployments) {
      console.log(`[Cleanup Worker] Cleaning up expired preview for project ${dep.project_id}`);
      try {
        await deleteProvisionedWordPressSite(dep.project_id);
        await pool.query(
          `UPDATE provisioning_jobs SET status = 'cleaned' WHERE project_id = ?`,
          [dep.project_id]
        );
        console.log(`[Cleanup Worker] Cleanup successful for project ${dep.project_id}`);
      } catch (error) {
        console.error(`[Cleanup Worker] Failed to clean up ${dep.project_id}:`, error);
      }
    }
  } catch (error) {
    console.error("[Cleanup Worker] Error:", error);
  }
}
setInterval(pollSslStatus, 12e4);
setInterval(pollCleanupPreviewSites, 3e5);
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await initializeDatabase();
  startProvisioningWorker();
});
var server_default = app;
export {
  server_default as default
};
