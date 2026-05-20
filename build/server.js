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
  const schemaMeta = schema.meta || {};
  const siteSlug = slugify(schemaMeta.slug || business.name || "client-site");
  const emailSlug = slugify(
    business.name || schema.brand.businessName || "client"
  );
  const ownerEmail = options?.ownerEmail || business.email || `${emailSlug}@example-client.test`;
  const ownerUsername = options?.ownerUsername || slugify(`${emailSlug}-${schemaMeta.businessId || business.id || "lead"}`);
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

// src/lib/direct-homepage-renderer.ts
function escapeHtml2(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function pickHeroImage(schema) {
  const photos = schema.brand && schema.brand.photos || schema.photos || [];
  if (photos && photos.length) return photos[0];
  const src = (schema.sections || []).map(
    (s) => s.media && s.media.src || s.items && s.items[0] && s.items[0].src
  ).find(Boolean);
  return src || "";
}
function renderBusinessHomepage(schema) {
  const brand = schema.brand || {};
  const name = escapeHtml2(brand.businessName || "Your Business");
  const category = escapeHtml2(brand.category || "Local Service");
  const address = escapeHtml2(brand.address || "");
  const phone = escapeHtml2(brand.phone || "");
  const heroImage = pickHeroImage(schema);
  const css = `:root{--bg:#fafafa;--surface:#ffffff;--muted:#6b7280;--accent:#1e40af;--radius:16px;--gap:24px}
body{margin:0;font-family:Inter,system-ui,Segoe UI,Roboto,-apple-system,Helvetica,Arial;color:#0f172a;background:var(--bg)}
.site{max-width:1200px;margin:0 auto;padding:40px 20px}
.hero{display:grid;grid-template-columns:1fr 520px;gap:var(--gap);align-items:center;padding:48px 0}
.hero__content{padding:28px;background:var(--surface);border-radius:var(--radius);box-shadow:0 10px 30px rgba(2,6,23,0.06)}
.hero__eyebrow{color:var(--accent);font-weight:700;letter-spacing:0.08em;font-size:0.85rem;margin-bottom:8px}
.hero__title{font-size:clamp(2rem,4vw,3.6rem);margin:0 0 12px;line-height:1.02}
.hero__lead{color:var(--muted);margin:0 0 18px;max-width:44ch}
.cta-row{display:flex;gap:12px}
.btn{display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700}
.btn--primary{background:var(--accent);color:#fff}
.btn--secondary{background:transparent;border:2px solid rgba(15,23,42,0.06);color:var(--accent)}
.hero__visual{border-radius:var(--radius);overflow:hidden;height:440px;background-size:cover;background-position:center;box-shadow:0 18px 50px rgba(2,6,23,0.08)}
.section{display:grid;grid-template-columns:1fr 1fr;gap:32px;padding:64px 0;align-items:start}
.section--stack{grid-template-columns:1fr}
.services{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.service{background:var(--surface);padding:18px;border-radius:12px;box-shadow:0 8px 30px rgba(2,6,23,0.04)}
.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.gallery img{width:100%;height:160px;object-fit:cover;border-radius:12px}
.trust-cards{display:flex;gap:12px;flex-wrap:wrap}
.trust{background:var(--surface);padding:16px;border-radius:10px;min-width:180px}
.contact{background:linear-gradient(180deg,#fff,#f8fafc);padding:20px;border-radius:12px}
@media(max-width:980px){.hero{grid-template-columns:1fr;gap:18px}.hero__visual{height:320px}.section{grid-template-columns:1fr}.gallery{grid-template-columns:repeat(2,1fr)}}`;
  const heroHtml = `
  <header class="hero">
    <div class="hero__content">
      <div class="hero__eyebrow">${category}</div>
      <h1 class="hero__title">${name}</h1>
      <p class="hero__lead">Museum-quality restoration and meticulous workshop craftsmanship. We repair, restore and preserve heirlooms with visible provenance and local authenticity.</p>
      <div class="cta-row">
        <a class="btn btn--primary" href="#contact">Book a consultation</a>
        <a class="btn btn--secondary" href="#gallery">View the work</a>
      </div>
      <div style="margin-top:18px;color:var(--muted);font-size:0.95rem">${address}${phone ? ` \u2022 ${phone}` : ""}</div>
    </div>
    <div class="hero__visual" style="background-image:url('${escapeHtml2(heroImage)}')"></div>
  </header>`;
  const servicesSection = (schema.sections || []).find(
    (s) => s.type === "features" || s.type === "service"
  );
  const services = servicesSection && Array.isArray(servicesSection.items) ? servicesSection.items.slice(0, 4).map(
    (it) => `<div class="service"><strong>${escapeHtml2(it.title || it.name || "Service")}</strong><p style="margin:8px 0 0;color:var(--muted)">${escapeHtml2(it.description || it.copy || "Professional service delivered with care.")}</p></div>`
  ).join("") : [
    `<div class="service"><strong>Conservation & Restoration</strong><p style="margin:8px 0 0;color:var(--muted)">Museum-grade restoration for antiques and heirlooms.</p></div>`,
    `<div class="service"><strong>Refinishing & Repair</strong><p style="margin:8px 0 0;color:var(--muted)">Structural repairs and surface refinishing to restore integrity.</p></div>`
  ].join("");
  const servicesHtml = `<section class="section"><div><h2>What we do</h2><div class="services">${services}</div></div><aside><h3>Why choose us</h3><p style="color:var(--muted)">Local workshop with decades of experience, transparent process, and visible before/after evidence.</p><div class="trust-cards"><div class="trust"><strong>4.9/5</strong><div style="color:var(--muted)">Average client rating</div></div><div class="trust"><strong>Certified</strong><div style="color:var(--muted)">Conservation-grade materials</div></div></div></aside></section>`;
  const galleryImages = ((schema.sections || []).filter((s) => s.type === "gallery").flatMap((g) => g.items || []) || []).slice(0, 6).map((it) => it.src).filter(Boolean);
  const galleryHtml = `<section id="gallery" class="section section--stack"><div><h2>Selected work</h2><div class="gallery">${(galleryImages.length ? galleryImages : [""]).map((src) => `<img src="${escapeHtml2(src || "")}">`).join("")}</div></div></section>`;
  const testimonials = ((schema.sections || []).find((s) => s.type === "testimonials") || {}).items || [];
  const testimonialsHtml = testimonials.length ? `<section class="section"><div><h2>What clients say</h2><div>${testimonials.slice(0, 3).map(
    (t) => `<div class="service"><blockquote style="margin:0 0 8px">${escapeHtml2(t.copy || t.content || t.text || "Great work.")}</blockquote><footer style="color:var(--muted);font-size:0.9rem">\u2014 ${escapeHtml2(t.author || "Client")}</footer></div>`
  ).join("")}</div></div></section>` : "";
  const contactHtml = `<section id="contact" class="section"><div><h2>Contact</h2><div class="contact"><p style="margin:0 0 8px;color:var(--muted)">Ready to start? Book an in-workshop consultation.</p><p style="margin:0"><strong>${name}</strong><br/>${address}<br/>${phone ? `<a href="tel:${phone}">${phone}</a>` : ""}</p></div></div><aside><h3>Request a quote</h3><p style="color:var(--muted)">Send images of your piece and we'll follow up with next steps.</p></aside></section>`;
  const html = `<main class="site">${heroHtml}${servicesHtml}${galleryHtml}${testimonialsHtml}${contactHtml}</main>`;
  return { html, css };
}
var init_direct_homepage_renderer = __esm({
  "src/lib/direct-homepage-renderer.ts"() {
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
function buildPremiumPageContent(schema) {
  if (schema && schema._wordpressHtml) {
    return schema._wordpressHtml;
  }
  const result = renderBusinessHomepage(schema);
  const cssBlock = `<!-- wp:html -->
<style>
${result.css}
</style>
<!-- /wp:html -->`;
  const wrappedHtml = `<!-- wp:group {"align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull">
${result.html}
</div>
<!-- /wp:group -->`;
  return `${cssBlock}

${wrappedHtml}`;
}
var init_premium_site_builder = __esm({
  "src/lib/premium-site-builder.ts"() {
    init_direct_homepage_renderer();
  }
});

// src/lib/vertex-homepage-generation-prompt.ts
var VERTEX_HOMEPAGE_GENERATION_PROMPT;
var init_vertex_homepage_generation_prompt = __esm({
  "src/lib/vertex-homepage-generation-prompt.ts"() {
    VERTEX_HOMEPAGE_GENERATION_PROMPT = `You are a professional agency web design engine specializing in modern local business websites built for WordPress.

Your task: using ONLY the full business context provided in the input variables below, generate ONE final production-ready WordPress-safe homepage as a JSON object with exactly these keys: "html", "css", "assets", "notes". Return ONLY valid JSON. No other text.

============================================
INPUT VARIABLES (provided by caller)
============================================
- business_name (string)
- business_category (string)
- short_tagline (string)
- one_sentence_summary (string)
- primary_cta_text (string)
- primary_cta_url (string)
- secondary_cta_text (string)
- secondary_cta_url (string)
- phone (string)
- address (string)
- maps_url (string)
- hours (string or array)
- services (array of {title, short_description, image_url})
- categories (array of strings)
- reviews (array of {author, rating (1-5), text, date})
- images (object with keys: hero, service1, service2, gallery[]; each value is absolute URL)
- colors (object: primary, accent, neutral - optional)
- logo_url (string - optional)
- local_context (string - neighborhood/city/region)
- competitors (array - optional)
- trust_logos (array of {name, url} - optional)

============================================
OUTPUT FORMAT (REQUIRED)
============================================
Return a JSON object with exactly these keys:

{
  "html": "...",     // HTML fragment only (no <html>/<head>/<body> tags)
  "css": "...",       // Full CSS stylesheet string (no <link> tags, scoped under .ds-homepage)
  "assets": [...],    // Array of image objects used
  "notes": "..."      // Brief fallback decisions
}

============================================
============================================
HTML REQUIREMENTS
============================================

Structure:
- Wrap entire HTML in a single top-level container with class "ds-homepage"
- Use semantic HTML: <header>, <main>, <section>, <footer>
- Do NOT include <html>, <head>, or <body> tags
- Build a REAL business homepage with:
  * STICKY HEADER & NAVBAR (CRITICAL):
    - Must include '<header class="ds-header">' wrapping '<div class="ds-container ds-header-inner">'
    - Header must contain: Business Logo/Name, main navigation links ('<nav class="ds-nav">' with links to '#services', '#reviews', '#contact'), and a clear navigation CTA button.
    - MUST implement a responsive mobile hamburger menu using the pure CSS checkbox hack (completely JS-free/WordPress-safe):
      '<input type="checkbox" id="ds-mobile-menu-toggle" class="ds-mobile-menu-toggle">'
      '<label for="ds-mobile-menu-toggle" class="ds-mobile-menu-label"><span></span></label>'
      - Sibling navigation '.ds-nav' should toggle visibility based on checkbox state.
  * ONE dominant immersive hero section (strongest image + emotional headline + primary CTA + secondary CTA link).
  * Clear business introduction (what they do) with highlighted trust stats.
  * Services section (with real, detailed service descriptions and custom images from the services array).
  * Trust/proof section (at least two real review excerpts with star ratings).
  * Supporting imagery/gallery section in a clean dynamic grid.
  * Contact/location block with clickable phone, address, and maps_url links.

Copy & Tone:
- MUST be business-specific, derived from input context.
- MUST sound like a real local business (human, trustworthy, practical).
- MUST avoid generic AI phrases: "premium solutions", "elevate", "transform", "cutting-edge", "innovative", "elevate your experience".
- Use concrete service descriptions from the services array.
- Use locality signals from local_context or address.
- USE REAL REVIEWS (CRITICAL): You MUST extract and display actual review excerpts from the reviews array (incorporating real author name, star rating, comment text, and date). Do NOT invent fake reviews, fake client names, or generic dates under any circumstances. If real reviews are provided in the context, render them exactly.
- Copy should immediately communicate: what they do, why they're trustworthy, what services they offer, how to contact them.

Image Usage (CRITICAL):
- Identify the STRONGEST provided image and use it as the hero image (dominant visual focal point).
- Use remaining images only as supporting visuals (services, gallery).
- Do NOT treat all images equally or use random image placement.
- If images are weak or missing, state fallback in "notes" and prefer typographic hero with solid accent background.
- Include alt text derived from business name and service context.

Imagery Specifics:
- Use only provided image URLs (do not invent external images).
- For hero: use colors.primary or colors.accent as overlay if needed for contrast.
- For gallery: arrange remaining images with clear visual hierarchy.
- If image URL missing: document in notes and use fallback solid color.

Accessibility:
- Ensure body text has WCAG AA color contrast.
- Provide accessible labels for all CTAs.
- Include proper alt text for all images.
- Use semantic HTML for structure.

WordPress Safety (CRITICAL):
- Do NOT include <script> tags or inline JavaScript code.
- Do NOT include event handlers (onclick, onload, etc.).
- Do NOT rely on external JS libraries.
- Use CSS-only animations and transitions.
- Use anchor links and tel: links for interactivity.
- Avoid fragile absolute positioning; use flexbox/grid.
- Ensure selectors work if Gutenberg wraps the DOM.

============================================
CSS REQUIREMENTS
============================================

Scope & Structure:
- Scope ALL CSS under .ds-homepage selectors (no global rules), EXCEPT for hiding the default WordPress headers/page titles.
- FULL WIDTH SCREEN BREAKOUT (CRITICAL): To ensure the homepage spans the full viewport width and is not constrained to a narrow centered column by the WordPress theme layout, you MUST include this rule at the beginning of the CSS:
  '.ds-homepage { width: 100vw !important; max-width: 100vw !important; position: relative !important; left: 50% !important; right: 50% !important; margin-left: -50vw !important; margin-right: -50vw !important; box-sizing: border-box !important; overflow-x: hidden !important; }'
- HIDE THEME CHROME (CRITICAL): To prevent the WordPress theme from displaying the default site title or the page title (like "San Francisco Water Restoration Service" or "Home") on top of our generated header, you MUST hide them using this CSS:
  '.entry-title, .entry-header, .post-title, .page-title, .wp-block-post-title, .site-header, #masthead, .site-branding, .header-footer-group, .theme-header, .custom-header, .nav-container { display: none !important; }'
- Single stylesheet string (no @import, no external fonts, no <link> tags).
- Use semantic, scoped class names.
- Keep CSS compact (~600-800 lines max).

Responsive Design & Sticky Navigation:
- Mobile-first approach.
- Provide breakpoints for tablet (640px+) and desktop (1024px+).
- Use modern CSS: flexbox, grid, clamp(), min(), max() for fluid scaling.
- MODERN STICKY HEADER (GLASSMORPHISM): The header styling must feel extremely premium, using a frosted-glass blur effect:
  '.ds-header { position: sticky; top: 0; z-index: 1000; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%); border-bottom: 1px solid rgba(0, 0, 0, 0.06); box-shadow: 0 4px 30px rgba(0,0,0,0.03); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 1.25rem 0; }'
- NAV LINK HOVER EFFECT (SLIDING UNDERLINE): Navigation links must have a modern sliding underline on hover. Design it like:
  '.ds-nav-link { position: relative; padding: 0.5rem 0; font-weight: 500; color: rgba(15, 23, 42, 0.8); transition: color 0.3s ease; }'
  '.ds-nav-link::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: var(--ds-primary); transform: scaleX(0); transform-origin: right; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }'
  '.ds-nav-link:hover { color: var(--ds-primary); }'
  '.ds-nav-link:hover::after { transform: scaleX(1); transform-origin: left; }'
- Pure CSS Mobile Hamburger Hack:
  - Hide '.ds-mobile-menu-toggle' with 'display: none;'.
  - On mobile, display '.ds-mobile-menu-label' styled as a clean hamburger (3 lines or neat layout).
  - Hide '.ds-nav' on mobile by default ('display: none;').
  - When checked, display the navigation overlay: '.ds-mobile-menu-toggle:checked ~ .ds-nav { display: flex; flex-direction: column; position: absolute; top: 100%; left: 0; width: 100%; background: #ffffff; padding: 1.5rem; box-shadow: 0 10px 15px rgba(0,0,0,0.05); }'
  - On desktop ('@media (min-width: 768px)'), hide '.ds-mobile-menu-label' and display '.ds-nav' as a flex row.

Visual Design & Polish:
- Spacing: Use 'clamp()' to scale padding fluidly (e.g. 'padding: clamp(5rem, 12vw, 9rem) 0;' for sections). Give sections lots of breathing room and vertical separation.
- Modern Bento-Grid / Asymmetric Layouts: Avoid flat, repetitive 3-column grids. Vary card shapes, use asymmetrical layouts (e.g. 2/3 and 1/3 columns), or give cards unequal heights or backgrounds.
- Premium Accent Badges: Use elegant glass badges above headers instead of plain text:
  '.ds-badge { display: inline-flex; align-items: center; padding: 0.5rem 1.25rem; background: rgba(0, 102, 204, 0.08); color: var(--ds-primary); border-radius: 9999px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: 1px solid rgba(0, 102, 204, 0.15); margin-bottom: 1.25rem; }'
  If the background is dark (e.g. in the hero), use a white/translucent glass badge:
  '.ds-badge-light { background: rgba(255,255,255,0.12); color: #ffffff; border-color: rgba(255,255,255,0.2); }'
- Gradient Text Headers: To make headings stand out, use subtle linear-gradients on main page/hero headings:
  '.ds-gradient-text { background: linear-gradient(135deg, var(--ds-primary) 0%, var(--ds-primary-dark) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }'
- Cards & Containers: Cards must feel premium:
  '.ds-card { background: #ffffff; border-radius: 20px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 10px 30px rgba(0,0,0,0.02); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }'
  '.ds-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: var(--ds-primary); }'
- CTA Buttons: Refine CTA button styles. Use pill shapes (border-radius: 50px), linear-gradient backgrounds, and active hover state zooms.

Hero Refinement:
- Hero section must feel large, immersive and dominant (min-height '75vh' to '85vh' on desktop).
- Use a modern clip-path separator at the bottom of the hero to avoid a flat horizontal edge (e.g., 'clip-path: ellipse(150% 100% at 50% 0%);' or a diagonal slope).
- Use rich overlay styling for the hero text side: gradients, custom icons, and offset spacing.

Lightweight Interaction & Animations (CRITICAL):
- GLOBAL ANIMATION CLASSES: You MUST declare and use these exact classes to animate page content on load:
  '.ds-reveal { opacity: 0; transform: translateY(30px); animation: dsFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }'
  '.ds-delay-1 { animation-delay: 0.15s; }'
  '.ds-delay-2 { animation-delay: 0.3s; }'
  '.ds-delay-3 { animation-delay: 0.45s; }'
  '.ds-delay-4 { animation-delay: 0.6s; }'
  '@keyframes dsFadeInUp { to { opacity: 1; transform: translateY(0); } }'
- IMPLEMENTATION RULE: Apply the '.ds-reveal' class and staggered delay classes to:
  - Hero Title, taglines, and actions.
  - Section intro titles and description paragraphs.
  - Individual grid items/cards so they fade in sequentially on load.
- PREMIUM FLOATING GLOW BLOBS: To give the site a state-of-the-art feel, include floating backdrop blobs:
  '<div class="ds-glow-1"></div><div class="ds-glow-2"></div>' in the HTML layout, and style them:
  '.ds-glow-1, .ds-glow-2 { position: absolute; width: clamp(200px, 40vw, 400px); height: clamp(200px, 40vw, 400px); border-radius: 50%; filter: blur(100px); opacity: 0.06; pointer-events: none; z-index: 0; }'
  '.ds-glow-1 { background: var(--ds-primary); top: 15%; left: -10%; animation: dsFloat 18s infinite alternate ease-in-out; }'
  '.ds-glow-2 { background: var(--ds-accent); bottom: 25%; right: -10%; animation: dsFloat 24s infinite alternate-reverse ease-in-out; }'
  '@keyframes dsFloat { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(6%, 6%) scale(1.08); } 100% { transform: translate(0, 0) scale(1); } }'
- Image Zoom: Scale images inside cards on hover: 'transform: scale(1.06);' with transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'.
- Accessibility support: '@media (prefers-reduced-motion: reduce) { .ds-homepage * { transition: none !important; transform: none !important; animation: none !important; } }'

============================================
ASSETS ARRAY
============================================

Return array of image objects actually used:
[
  {
    "role": "hero" | "service" | "gallery" | "logo",
    "url": "absolute URL",
    "width": number or null,
    "height": number or null,
    "alt": "derived alt text"
  },
  ...
]

Only include images that appear in the HTML.
If image is missing, document in "notes" instead.

============================================
IMPORTANT DESIGN RULES
============================================

Homepage Must Resemble:
- A professionally designed modern local business website built by a real agency.
- NOT: an AI experiment, composition demo, cinematic prototype, or design showcase.

Prioritize:
- Clarity
- Trust and credibility
- Services and offerings
- Contact intent
- Business authenticity

Avoid:
- Repetitive left/right split sections.
- Equal-weight sections (no visual hierarchy).
- Endless cards or lists.
- SaaS startup templates.
- FAQ spam.
- Abstract editorial experiments.
- Design flourishes that don't serve the business.

Visual Hierarchy:
- One DOMINANT hero section.
- One strong focal image.
- One clear primary CTA.
- Supporting sections with decreasing visual intensity.
- Strong spacing and typographic hierarchy.

Section Structure (Recommended):
1. Sticky Header / Navbar
2. Immersive Hero: image + headline + subheading + primary CTA + secondary CTA
3. Intro/Why Us: 1-2 sentences about the business with trust stats
4. Services: 3-4 key services with descriptions in alternating styled container
5. Trust/Proof: 2-3 review quotes with ratings on a distinct background (e.g. brand primary or neutral dark)
6. Gallery: 4-6 supporting images (clean responsive grid)
7. CTA: one more clean, prominent conversion section
8. Contact/Location: phone + address + maps link + hours
9. Footer

Avoid Patterns:
- Do NOT generate 10+ equal-weight cards.
- Do NOT create repeated left-image / right-text sections.
- Do NOT generate generic startup FAQ sections.
- Do NOT use abstract section titles like "Discover", "Elevate", "Transform".
- Do NOT add unnecessary complexity.

Copy Constraints:
- Real business language only.
- No marketing clich\xE9s.
- Grounded, practical, trustworthy tone.
- Services should reflect the actual business category.
- CTAs should be clear and action-oriented.

============================================
WORDPRESS INTEGRATION
============================================

The output must work with the existing WordPress render/deploy flow:
- HTML will be inserted into WordPress post content.
- CSS will be scoped and injected via wp:html blocks.
- Gutenberg may wrap or add additional div/block containers.
- Output must survive DOM wrapping and style injection.

Guardrails:
- No script dependencies.
- No inline event handlers.
- CSS scoped to prevent theme conflicts.
- Use standard, well-supported CSS (avoid cutting-edge features).
- Responsive layout that works with common WP constraints.

============================================
DETERMINISM & OUTPUT
============================================

Generation Settings (caller will apply):
- Temperature: 0.1 (for consistency)
- Top_p: 0.95
- Max tokens: 6000
- Stop: none (parse JSON output)

Output:
- MUST be valid JSON only.
- MUST contain exactly 4 keys: html, css, assets, notes.
- MUST NOT include any explanatory text, markdown, or code fences.
- MUST be parseable and ready for immediate injection into the pipeline.

Final Quality Gate:
The homepage should feel like:
\u2713 A real professionally built WordPress business homepage.
\u2713 Something a customer would be proud to see as their new site.
\u2713 Immediately clear what the business does and how to contact them.

NOT:
\u2717 An AI experiment.
\u2717 A design showcase.
\u2717 An architectural prototype.
\u2717 An experimental rendering system demo.
\u2717 A composition or art direction study.

If you cannot generate perfect output for any reason, prefer clarity and simplicity over ambitious but fragile design.
`;
  }
});

// src/lib/gemini.ts
var gemini_exports = {};
__export(gemini_exports, {
  askBusinessAIChatStream: () => askBusinessAIChatStream,
  fetchLeadAIChatHistory: () => fetchLeadAIChatHistory,
  generateOutreachEmail: () => generateOutreachEmail,
  generateWebsite: () => generateWebsite,
  generateWebsiteContent: () => generateWebsiteContent,
  generateWebsiteContentLegacy: () => generateWebsiteContentLegacy,
  generateWithFallback: () => generateWithFallback
});
async function generateWebsite(business) {
  try {
    const resp = await fetch(`${API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(business)
    });
    if (!resp.ok) {
      let errorMsg = "";
      try {
        const errorJson = await resp.json();
        errorMsg = errorJson.error || errorJson.message || `${resp.status} ${resp.statusText}`;
      } catch {
        const text = await resp.text().catch(() => "");
        errorMsg = text || `${resp.status} ${resp.statusText}`;
      }
      const errorObj = new Error(errorMsg);
      errorObj.status = resp.status;
      throw errorObj;
    }
    const payload = await resp.json();
    return {
      schema: payload,
      debugTraceId: resp.headers.get("x-debug-generation-id") || void 0,
      debugFallbackUsed: (resp.headers.get("x-debug-generation-fallback") || "").toLowerCase() === "true"
    };
  } catch (err) {
    throw err;
  }
}
async function generateOutreachEmail(business, websiteUrl) {
  return `Subject: Modern website for ${business.name}

Hi ${business.name},

We created a prototype website at ${websiteUrl}.`;
}
async function fetchLeadAIChatHistory(leadId) {
  try {
    const resp = await fetch(
      `${API_URL}/api/business-ai-chat/${encodeURIComponent(leadId)}`
    );
    if (!resp.ok) {
      throw new Error("Failed to fetch chat history");
    }
    const data = await resp.json();
    return data.messages || [];
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return [];
  }
}
async function askBusinessAIChatStream(leadId, businessContext, messages, onChunk, signal) {
  const resp = await fetch(`${API_URL}/api/business-ai-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId, businessContext, messages }),
    signal
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Chat request failed: ${resp.status} ${resp.statusText} ${text}`
    );
  }
  const reader = resp.body?.getReader();
  if (!reader) {
    const text = await resp.text().catch(() => "");
    onChunk(text);
    return;
  }
  const decoder = new TextDecoder("utf-8");
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk);
  }
}
async function generateWithFallback(promptOrContents, config = {}, options) {
  const googleCloudApiKey = process.env.GOOGLE_CLOUD_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiRestUrl = process.env.GEMINI_REST_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
  const contents = typeof promptOrContents === "string" ? [{ role: "user", parts: [{ text: promptOrContents }] }] : promptOrContents;
  const contextLabel = options.contextLabel || "unknown-stage";
  const logProvider = (payload) => {
    if (!options.debugSession || !options.persistGenerationDebugFile) return;
    const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] stage=${contextLabel} provider=${payload.provider} model=${payload.model} status=${payload.status}${payload.outputChars !== void 0 ? ` outputChars=${payload.outputChars}` : ""}${payload.error ? ` error=${payload.error}` : ""}`;
    options.persistGenerationDebugFile(
      options.debugSession,
      "00-provider.log",
      line,
      true
    );
  };
  if (googleCloudApiKey) {
    const apiEndpoint = process.env.VERTEX_API_ENDPOINT || "aiplatform.googleapis.com";
    const modelId = "gemini-3.1-pro-preview";
    const generateContentApi = "streamGenerateContent";
    const vertexUrl = `https://${apiEndpoint}/v1/publishers/google/models/${modelId}:${generateContentApi}?key=${googleCloudApiKey}`;
    try {
      options.logStderr(`[AI] Primary Vertex Attempt (${apiEndpoint})...`);
      await options.throttleGemini();
      const payload = {
        contents,
        generationConfig: {
          temperature: config.temperature ?? 1,
          thinkingConfig: {
            thinkingLevel: "HIGH"
          }
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" }
        ],
        tools: [{ googleSearch: {} }]
      };
      if (config.responseMimeType) {
        payload.generationConfig.responseMimeType = config.responseMimeType;
      }
      const res = await fetch(vertexUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        let text = "";
        if (Array.isArray(data)) {
          for (const chunk of data) {
            const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunkText) text += chunkText;
          }
        } else {
          text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
        if (text) {
          options.logStderr(`[AI] Vertex Success!`);
          logProvider({
            provider: "vertex",
            model: modelId,
            status: "success",
            outputChars: text.length
          });
          return text;
        }
        throw new Error("Vertex response contents parts were empty");
      }
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Vertex REST failed with status ${res.status}: ${errText}`
      );
    } catch (err) {
      options.logStderr(
        `[AI] Vertex Failed, Switching to Gemini Flash... Error: ${err.message || err}`
      );
      logProvider({
        provider: "vertex",
        model: modelId,
        status: "failure",
        error: err?.message || String(err)
      });
      if (options.debugSession && options.appendGenerationDebugError) {
        options.appendGenerationDebugError(
          options.debugSession,
          `vertex_failed: ${err.message || err}`
        );
      }
    }
  } else {
    options.logStderr(
      `[AI] GOOGLE_CLOUD_API_KEY not found. Skipping Vertex, trying Public Gemini...`
    );
  }
  if (geminiApiKey) {
    const fallbackUrl = `${geminiRestUrl}${geminiRestUrl.includes("?") ? "&" : "?"}key=${geminiApiKey}`;
    try {
      options.logStderr(`[AI] Fallback Public Gemini Attempt...`);
      await options.throttleGemini();
      const payload = {
        contents,
        generationConfig: {
          temperature: config.temperature ?? 1
        }
      };
      if (config.responseMimeType) {
        payload.generationConfig.responseMimeType = config.responseMimeType;
      }
      const res = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          options.logStderr(`[AI] Public Gemini Success!`);
          logProvider({
            provider: "public-gemini",
            model: geminiRestUrl,
            status: "success",
            outputChars: text.length
          });
          return text;
        }
        throw new Error("Public Gemini response contents parts were empty");
      }
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Public Gemini REST failed with status ${res.status}: ${errText}`
      );
    } catch (err) {
      options.logStderr(
        `[AI] Public Gemini Failed. Error: ${err.message || err}`
      );
      logProvider({
        provider: "public-gemini",
        model: geminiRestUrl,
        status: "failure",
        error: err?.message || String(err)
      });
      if (options.debugSession && options.appendGenerationDebugError) {
        options.appendGenerationDebugError(
          options.debugSession,
          `public_gemini_failed: ${err.message || err}`
        );
      }
    }
  } else {
    options.logStderr(`[AI] GEMINI_API_KEY not found.`);
  }
  options.logStderr(`[AI] Both attempts failed. Triggering UI Alert.`);
  throw new Error("AI_CRITICAL_FAILURE");
}
async function generateWebsiteContentLegacy(business, options) {
  if (typeof window !== "undefined") {
    throw new Error(
      "generateWebsiteContent can only be run on the server-side"
    );
  }
  try {
    const buildImageBlock = (b) => {
      const sources = b.photos || [];
      return sources.length ? sources.slice(0, 10).map((u, i) => `${i + 1}. ${u}`).join("\n") : "None";
    };
    const buildReviewsBlock = (b) => {
      if (Array.isArray(b.reviews) && b.reviews.length) {
        return b.reviews.slice(0, 5).map(
          (r, i) => `${i + 1}. ${r.rating || ""} - ${r.text || r.comment || ""}`
        ).join("\n");
      }
      return "None";
    };
    const stage0Prompt = `You are a premium Senior Staff Brand Director and Art Director.
Establish a custom brand Creative Direction Brief based on:
Business Name: ${business.name}
Category: ${business.category || "Local Service"}
Address: ${business.address || "N/A"}
Phone: ${business.phoneNumber || "N/A"}
Reviews:
${buildReviewsBlock(business)}
Reference Images:
${buildImageBlock(business)}

Return ONLY a valid JSON object matching this structure:
{
  "emotionalTone": "...",
  "brandPersonality": { "luxuryVsApproachable": 50, "technicalVsEmotional": 50, "modernVsHeritage": 50, "industrialVsEditorial": 50, "minimalistVsLayered": 50, "premiumVsEnergetic": 50 },
  "visualIdentity": { "themeMode": "light", "colorPalettePhilosophy": "...", "primaryColorIntent": "...", "accentColorIntent": "...", "backgroundColorIntent": "...", "surfaceColorIntent": "..." },
  "compositionPhilosophy": { "alignment": "asymmetrical", "layoutCadence": "...", "spacingRhythm": "balanced", "sectionTransitions": "..." },
  "typographyMood": { "headingFontFamily": "...", "bodyFontFamily": "...", "moodDescriptor": "..." },
  "mediaTreatment": { "style": "...", "shapes": ["..."] },
  "motionAndInteractions": { "personality": "subtle", "feel": "..." },
  "premiumReferences": ["..."],
  "atmosphericDirectionDescription": "...",
  "designTokens": {
    "spacingScale": { "xs": "...", "sm": "...", "md": "...", "lg": "...", "xl": "...", "xxl": "..." },
    "typographyScale": { "heroHeadline": "clamp(...)", "sectionHeadline": "clamp(...)", "bodyText": "clamp(...)", "headingFont": "...", "bodyFont": "..." },
    "radiusSystem": { "sm": "...", "md": "...", "lg": "...", "full": "..." },
    "shadowSystem": { "soft": "...", "premium": "...", "intense": "..." },
    "textureSystem": { "mode": "grain", "styleString": "..." },
    "animationTimingSystem": { "easingCurve": "...", "revealDuration": "..." },
    "layeringDepthSystem": { "zBack": "...", "zBase": "...", "zOverlay": "..." },
    "colorRamp": { "background": "...", "surface": "...", "primary": "...", "accent": "...", "text": "...", "muted": "...", "outline": "..." },
    "gradientSystem": { "ambientLighting": "...", "brandGradient": "..." }
  }
}`;
    options.logStderr(
      "[Gemini Generation] Stage 0: Generating Creative Direction..."
    );
    if (options.debugSession && options.persistGenerationDebugFile) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "01a-creative-direction-prompt.md",
        stage0Prompt
      );
    }
    const stage0Text = await generateWithFallback(
      stage0Prompt,
      { temperature: 0.2, responseMimeType: "application/json" },
      options
    );
    if (options.debugSession && options.persistGenerationDebugFile) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "01b-creative-direction-raw.json",
        stage0Text
      );
    }
    options.logStderr(
      `[Gemini Generation] Stage 0 Output (Creative Direction): ${stage0Text}`
    );
    const creativeDirection = JSON.parse(stage0Text.trim());
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "01c-creative-direction-parsed.json",
        creativeDirection
      );
    }
    const qualificationNotes = business.notes || business.qualificationNotes || "None";
    const neighborhood = business.neighborhood || business.vibe || "Unknown";
    const specialties = Array.isArray(business.specialties) ? business.specialties.join(", ") : business.specialties || "General services";
    const tone = business.tone || "professional";
    const stage1Prompt = `You are a premium Senior Front-end Architect.
Generate a structured website schema matching the exact design decisions in the Creative Direction Brief.
Your design decisions must respect:
${JSON.stringify(creativeDirection, null, 2)}

Modern layout rules (MUST ENFORCE):
- Avoid excessive, empty whitespace that causes the site to feel "underdeveloped" or generic startup-like. Maintain tight, high-impact padding variables to ensure a cohesive, robust visual experience.
- Break free from templates. Create a unique pacing, visual flow, and section rhythm specifically suited for this business, prioritizing fewer, more high-impact sections over many repetitive ones.
- Enforce the brand's visual identity (theme mode, color palette, custom gradients, typography pairing) with absolute consistency. Avoid excessive mutations or contrast mismatch.

COPYWRITING INSTRUCTIONS (CRITICAL):
- TONE: Journalistic, confident, and highly specific. Write like an editor for Monocle or GQ.
- RULE 1: NO AI SPEAK. Permanently ban words like: "Unlock, Discover, Unleash, Elevate, Premier, Top-Notch, Cutting-Edge, Tailored, Seamless." 
- RULE 2: Show, Don't Tell. Instead of "We offer the best plumbing services," write "Emergency leak repair and pipe routing in under 45 minutes."
- RULE 3: Use hyper-local anchors. Reference the actual neighborhood, street, or city vibe provided in the context to make it feel grounded.
- RULE 4: Hero Subheadlines must state exactly what the business does, who it is for, and where it is located in plain, striking English.

DYNAMIC SECTIONS & COMPOSITION ORCHESTRATION:
- Do NOT use a standard, repetitive section structure.
- You have full creative control over which sections exist, their sequence, and their hierarchy to optimize the brand's narrative.
- You do NOT write raw HTML. Instead, you are the Creative Director and Orchestrator.
- For EVERY section in the "sections" array, you MUST generate a highly custom "composition" object instructing our premium rendering engine how to build that section.

COMPOSITION DICTIONARY OPTIONS (Choose appropriate properties matching business category tone):
"composition": {
  "sectionType": Choose from [
    "cinematicHero", "editorialHero", "splitNarrativeHero", 
    "asymmetricalFeatures", "glassFeatureCards", "processNarrative", 
    "immersiveGallery", "floatingImageStack", 
    "floatingTestimonialWall", 
    "layeredCTA", 
    "luxuryMetricsStrip", "storytellingTimeline", "transformationShowcase", 
    "premiumContactPanel", "accordionClean"
  ],
  "layoutBehavior": Choose from [
    "offset-right", "offset-left", "grid-stagger", "asymmetrical", "side-by-side", "split-grid", "centered-dramatic", "horizontal-carousel", "diagonal-split"
  ],
  "visualDepth": Choose from [
    "layered-atmospheric", "glassmorphic", "frosted-glow", "dramatic-depth", "flat-minimalist"
  ],
  "motionStyle": Choose from [
    "premiumFade", "cinematicReveal", "staggerLift", "softFloat", "atmosphericParallax", "editorialSlide", "luxuryGlow"
  ],
  "imageTreatment": Choose from [
    "layeredGlass", "editorialCrop", "cinematicBleed", "atmosphericOverlay", "luxuryFrame", "brutalistSharp", "floatingDepth", "diagonalWedge"
  ],
  "spacingMode": Choose from [
    "luxury-editorial", "balanced", "compact", "airy"
  ],
  "themeIntensity": Choose from [
    "dramatic", "soft", "balanced", "high-contrast"
  ],
  "hierarchyWeight": Choose from [
    "dominant", "supporting", "breathing", "cinematicPause", "transitionary"
  ]
}

THEME DESIGN SYSTEM:
- Choose the theme mode determined in the Creative Direction Brief: "${creativeDirection.visualIdentity.themeMode}".
- Derive all palette colors (background, surface, primary, accent, text, muted, outline) directly from the visualIdentity and brand personality intents.
- Generative Design DNA: You MUST generate a "designDNA" object under "theme" this DNA system drives the adaptive visual rendering and mutation rules:
  "designDNA": {
    "spacingPersonality": Choose from ["compressed", "balanced", "airy", "luxury-editorial", "brutalist-dense"],
    "compositionAggression": Number (0 to 100 representing layout mutation/offset levels),
    "hierarchyIntensity": Number (0 to 100 representing font size scales & weight variance),
    "motionEnergy": Number (0 to 100 representing stagger/speed timings),
    "visualDensity": Number (0 to 100 representing complexity/content density),
    "asymmetryLevel": Number (0 to 100 representing vertical alignment shifts and margins offsets),
    "atmosphereIntensity": Number (0 to 100 representing ambient radial glow levels & noise opacity),
    "typographyDominance": Choose from ["restrained", "balanced", "dominant-serif", "brutalist-impact", "cinematic-oversized", "layered-typography-walls", "vertical-accents"],
    "imageWeight": Number (0 to 100 representing image coverage vs text layout),
    "luxuryScore": Number (0 to 100 representing rounded smooth cards, high-end serif styling),
    "cinematicScore": Number (0 to 100 representing dark themes, immersive split and bleed panels),
    "brutalismScore": Number (0 to 100 representing blocky outlines, sharp text, raw structural elements),
    "editorialScore": Number (0 to 100 representing warm neutral tones, spacious asymmetric structures),
    "softnessScore": Number (0 to 100 representing rounded curves, fluid overlays, low-contrast shadows),
    "visualAtmosphere": Choose from ["industrial-grit", "luxury-glow", "soft-editorial-warmth", "cinematic-darkness", "energetic-neon", "architectural-minimalism"]
  }

Business Context:
- Name: ${business.name}
- Category: ${business.category || "Local Service"}
- Address: ${business.address || "N/A"}
- Phone: ${business.phoneNumber || "N/A"}
- Email: ${business.email || "NONE PROVIDED"}
- Website: ${business.websiteUri || "N/A"}
- Logo: ${business.logo || "None"}

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

Return only valid JSON matching the WebsiteSchema interface. Include the "designDNA" object under "theme" exactly as specified. Do not enclose in markdown code fences.`;
    options.logStderr(
      "[Gemini Generation] Stage 1: Generating Layout Schema..."
    );
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "02-stage1-prompt.md",
        stage1Prompt
      );
    }
    const schemaText = await generateWithFallback(
      stage1Prompt,
      { temperature: 0.9, responseMimeType: "application/json" },
      { ...options, contextLabel: "stage1-schema" }
    );
    options.logStderr(
      `[Gemini Generation] Stage 1 Output (Raw Schema): ${schemaText}`
    );
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "03-gemini-raw-response.txt",
        schemaText
      );
    }
    let parsedSchema;
    try {
      let cleanedJson = schemaText.trim();
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
      }
      if (options.parseWebsiteSchemaOutput) {
        const result = options.parseWebsiteSchemaOutput(
          cleanedJson,
          business,
          options.debugSession
        );
        if (!result) {
          throw new Error("parseWebsiteSchemaOutput returned null/failed");
        }
        parsedSchema = result;
      } else {
        parsedSchema = JSON.parse(cleanedJson.trim());
      }
      options.logStderr(
        `[Gemini Generation] Stage 1 Parsed & Normalized Schema: ${JSON.stringify(parsedSchema, null, 2)}`
      );
    } catch (parseError) {
      throw new Error(
        `Failed to parse Stage 1 generated schema JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }
    options.logStderr(
      "[Gemini Generation] Stage 2: Generating WordPress HTML..."
    );
    const stage2Prompt = `You are turning the approved website schema you just generated into the FINAL WordPress homepage HTML.

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

MODERN UI & STYLING CONSTRAINTS (Apply via inline styles):
- SPACING: Stop using hard pixel values for padding. Use fluid clamp spacing: padding: clamp(4rem, 8vw, 8rem) 5%;
- BORDERS & SURFACES: For cards (bento grids, features, testimonials), use modern soft UI. Apply: background: #ffffff; border: 1px solid rgba(0,0,0,0.05); border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.03);
- TYPOGRAPHY HIERARCHY: Make h1 massive and tight: font-size: clamp(3.5rem, 8vw, 6rem); line-height: 1.05; tracking: -0.02em; Make paragraph text readable: font-size: 1.125rem; line-height: 1.6; color: rgba(0,0,0,0.7);
- IMAGES: Never use raw sharp corners. All images must have border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); unless they are explicitly arched.
- BENTO GRID REFINEMENT: Ensure gap spacing is modern. display: grid; gap: 24px;.`;
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "05a-wordpress-html-prompt.md",
        stage2Prompt
      );
    }
    const stage2Contents = [
      { role: "user", parts: [{ text: stage1Prompt }] },
      {
        role: "model",
        parts: [{ text: JSON.stringify(parsedSchema, null, 2) }]
      },
      { role: "user", parts: [{ text: stage2Prompt }] }
    ];
    const htmlText = await generateWithFallback(
      stage2Contents,
      { temperature: 0.75 },
      { ...options, contextLabel: "stage2-wordpress-html" }
    );
    options.logStderr(
      `[Gemini Generation] Stage 2 Output (Raw HTML): ${htmlText}`
    );
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "05b-wordpress-html-raw.txt",
        htmlText
      );
    }
    let cleanedHtml = htmlText.trim();
    if (cleanedHtml.startsWith("```")) {
      cleanedHtml = cleanedHtml.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
    }
    options.logStderr(
      `[Gemini Generation] Stage 2 Cleaned HTML: ${cleanedHtml}`
    );
    if (!cleanedHtml) {
      throw new Error("Generated WordPress HTML was empty");
    }
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "05c-wordpress-html-final.html",
        cleanedHtml
      );
    }
    parsedSchema._wordpressHtml = cleanedHtml;
    parsedSchema._renderSource = "gemini-html";
    options.logStderr(
      "[Gemini Generation] Primary website generation succeeded!"
    );
    return parsedSchema;
  } catch (error) {
    options.logStderr(
      `[Gemini Generation] Generation pipeline failed. Error: ${error instanceof Error ? error.message : String(error)}`
    );
    if (options.debugSession) {
      options.appendGenerationDebugError(
        options.debugSession,
        `generation_failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    throw error;
  }
}
async function generateWebsiteContent(business, options) {
  if (typeof window !== "undefined") {
    throw new Error(
      "generateWebsiteContent can only be run on the server-side"
    );
  }
  try {
    options.logStderr(
      "[Gemini] Running direct deterministic homepage generation..."
    );
    const { generateHomepageViaDirectVertexPrompt: generateHomepageViaDirectVertexPrompt2 } = await Promise.resolve().then(() => (init_direct_vertex_homepage_generation(), direct_vertex_homepage_generation_exports));
    return await generateHomepageViaDirectVertexPrompt2(business, {
      debugLog: options.logStderr,
      debugSession: options.debugSession,
      persistFile: (filename, content) => {
        if (options.persistGenerationDebugFile && options.debugSession) {
          options.persistGenerationDebugFile(options.debugSession, filename, content);
        }
      },
      throttleGemini: options.throttleGemini
    });
  } catch (error) {
    options.logStderr(
      `[Gemini] Direct homepage generation failed. Error: ${error instanceof Error ? error.message : String(error)}`
    );
    if (options.debugSession && options.appendGenerationDebugError) {
      options.appendGenerationDebugError(
        options.debugSession,
        `generation_failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    throw error;
  }
}
var API_URL;
var init_gemini = __esm({
  "src/lib/gemini.ts"() {
    API_URL = process.env?.VITE_API_URL || "http://localhost:5001";
  }
});

// src/lib/direct-vertex-homepage-generation.ts
var direct_vertex_homepage_generation_exports = {};
__export(direct_vertex_homepage_generation_exports, {
  buildHomepageGenerationRequest: () => buildHomepageGenerationRequest,
  default: () => direct_vertex_homepage_generation_default,
  generateHomepageViaDirectVertexPrompt: () => generateHomepageViaDirectVertexPrompt
});
function collectBusinessImages(business) {
  const sources = [];
  if (Array.isArray(business.photos)) {
    sources.push(...business.photos);
  }
  if (Array.isArray(business.imageSuggestions)) {
    sources.push(...business.imageSuggestions);
  }
  if (business.logo) {
    sources.push(business.logo);
  }
  return sources;
}
function buildHomepageGenerationRequest(business) {
  const images = collectBusinessImages(business);
  const [hero, service1, service2, ...gallery] = images;
  return {
    business_name: business.name || "Untitled Business",
    business_category: business.category || business.businessType || "Local Service",
    short_tagline: business.tagline || business.shortTagline || `${business.category || "Service"} in ${business.neighborhood || business.city || "Your Area"}`,
    one_sentence_summary: business.summary || business.oneSentenceSummary || `Trusted ${business.category || "service provider"} serving the ${business.neighborhood || business.city || "local"} community.`,
    primary_cta_text: business.cta_primary_text || "Get Started Today",
    primary_cta_url: business.cta_primary_url || business.websiteUri || "#contact",
    secondary_cta_text: business.cta_secondary_text || "Learn More",
    secondary_cta_url: business.cta_secondary_url || business.websiteUri || "#services",
    phone: business.phoneNumber || business.phone || "Contact for availability",
    address: business.address || business.location || "See directions on map",
    maps_url: business.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(business.name || "location")}`,
    hours: business.hours || business.businessHours || "Call for hours of operation",
    services: business.services && Array.isArray(business.services) ? business.services.slice(0, 5).map((s) => ({
      title: typeof s === "string" ? s : s.title || s.name || "Service",
      short_description: typeof s === "string" ? `Professional ${s} service` : s.description || s.short_description || `Professional ${s.title} service`,
      image_url: s.image_url || s.photo || service1
    })) : [],
    categories: business.categories || [business.category],
    reviews: business.reviews && Array.isArray(business.reviews) ? business.reviews.slice(0, 6).map((r) => ({
      author: r.author || r.author_name || r.authorName || r.reviewerName || "Customer",
      rating: r.rating || r.stars || 5,
      text: r.text || r.review || r.comment || "Excellent service and highly recommended",
      date: r.date || r.reviewDate || r.relative_time_description || (r.time ? new Date(r.time * 1e3).toLocaleDateString() : void 0)
    })) : [],
    images: {
      hero,
      service1,
      service2,
      gallery: gallery || []
    },
    colors: {
      primary: business.brandColor || business.primaryColor || business.color || "#0066cc",
      accent: business.accentColor || business.highlightColor || "#ff6600",
      neutral: business.neutralColor || "#f5f5f5"
    },
    logo_url: business.logo,
    local_context: `${business.neighborhood || business.area || business.city || "Local area"}, serving the ${business.city || "community"}`,
    competitors: business.competitors,
    trust_logos: business.trustLogos
  };
}
async function callVertexHomepageGeneration(prompt, request, debugLog, options) {
  const log = debugLog || ((msg) => console.error(msg));
  log(`[Vertex] Calling unified homepage generation via generateWithFallback...`);
  log(`[Vertex] Business: ${request.business_name}`);
  log(`[Vertex] Category: ${request.business_category}`);
  try {
    const { generateWithFallback: generateWithFallback2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
    const responseText = await generateWithFallback2(
      [
        {
          role: "user",
          parts: [
            { text: prompt },
            { text: `

Business Context (JSON):
${JSON.stringify(request, null, 2)}` }
          ]
        }
      ],
      {
        temperature: 0.1,
        responseMimeType: "application/json"
      },
      {
        logStderr: log,
        debugSession: options?.debugSession,
        throttleGemini: options?.throttleGemini || (async () => {
        }),
        persistGenerationDebugFile: options?.persistFile ? (session, filename, content) => options.persistFile(filename, content) : void 0,
        contextLabel: "direct-vertex-prompt"
      }
    );
    if (!responseText) {
      throw new Error("Vertex returned empty response");
    }
    log(`[Vertex] Response received (${responseText.length} characters)`);
    let jsonString = responseText.trim();
    if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
    }
    const parsed = JSON.parse(jsonString);
    if (!parsed.html || !parsed.css || !Array.isArray(parsed.assets)) {
      throw new Error(
        "Invalid response structure: missing html, css, or assets"
      );
    }
    log(`[Vertex] Parsed response successfully`);
    log(
      `[Vertex] Generated HTML (${parsed.html.length} chars), CSS (${parsed.css.length} chars)`
    );
    return parsed;
  } catch (error) {
    log(
      `[Vertex] Generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}
function wrapForWordPress(homepageResult) {
  const cssBlock = `<!-- wp:html -->
<style>
${homepageResult.css}
</style>
<!-- /wp:html -->`;
  const htmlBlock = `<!-- wp:group {"align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull">
${homepageResult.html}
</div>
<!-- /wp:group -->`;
  return `${cssBlock}

${htmlBlock}`;
}
async function generateHomepageViaDirectVertexPrompt(business, options) {
  const log = options?.debugLog || ((msg) => console.error(msg));
  const persist = options?.persistFile || ((filename, content) => {
  });
  try {
    const request = buildHomepageGenerationRequest(business);
    persist("01-homepage-generation-request.json", request);
    log(`[DirectVertex] Starting deterministic homepage generation...`);
    const response = await callVertexHomepageGeneration(
      VERTEX_HOMEPAGE_GENERATION_PROMPT,
      request,
      log,
      options
    );
    persist("02-vertex-response.json", response);
    const wpSafeHtml = wrapForWordPress(response);
    persist("03-wordpress-wrapped.html", wpSafeHtml);
    const schema = {
      id: business.id || `homepage-${Date.now()}`,
      businessId: business.id,
      businessName: business.name || "Untitled",
      theme: {
        primaryColor: request.colors?.primary || "#0066cc",
        accentColor: request.colors?.accent || "#ff6600",
        neutralColor: request.colors?.neutral || "#f5f5f5",
        name: "modern-agency",
        mode: "light"
      },
      sections: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      // Store the generated HTML/CSS for WordPress rendering
      _wordpressHtml: wpSafeHtml,
      _renderSource: "direct-vertex-prompt",
      _generatedHomepage: response
    };
    persist("04-minimal-schema.json", schema);
    log(`[DirectVertex] Homepage generation complete`);
    return schema;
  } catch (error) {
    log(
      `[DirectVertex] Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}
var GENAI_KEY, direct_vertex_homepage_generation_default;
var init_direct_vertex_homepage_generation = __esm({
  "src/lib/direct-vertex-homepage-generation.ts"() {
    init_vertex_homepage_generation_prompt();
    GENAI_KEY = process.env.GEMINI_API_KEY || process.env.GENAI_KEY;
    direct_vertex_homepage_generation_default = {
      generateHomepageViaDirectVertexPrompt,
      buildHomepageGenerationRequest,
      callVertexHomepageGeneration,
      wrapForWordPress
    };
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
    return {
      isValid: false,
      errors: ["Missing core top-level objects (meta, theme, brand, sections)"]
    };
  }
  const repairedSections = schema.sections.map(
    (section, index) => {
      const type = (section.type || "unknown").toLowerCase();
      section.type = type;
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
          validateLayout(
            section.layout,
            section.variant,
            [...HERO_LAYOUTS, ...HERO_VARIANTS],
            HERO_VARIANTS,
            "editorial-left"
          );
          break;
        case "features":
          validateLayout(
            section.layout,
            section.variant,
            [...FEATURES_LAYOUTS, ...FEATURES_VARIANTS],
            FEATURES_VARIANTS,
            "feature-cards"
          );
          break;
        case "gallery":
          validateLayout(
            section.layout,
            section.variant,
            [...GALLERY_LAYOUTS, ...GALLERY_VARIANTS],
            GALLERY_VARIANTS,
            "standard-grid"
          );
          break;
        case "testimonials":
          validateLayout(
            section.layout,
            section.variant,
            [...TESTIMONIALS_LAYOUTS, ...TESTIMONIALS_VARIANTS],
            TESTIMONIALS_VARIANTS,
            "floating-cards"
          );
          break;
        case "cta":
          validateLayout(
            section.layout,
            section.variant,
            [...CTA_LAYOUTS, ...CTA_VARIANTS],
            CTA_VARIANTS,
            "centered-premium"
          );
          break;
        case "faq":
          validateLayout(
            section.layout,
            section.variant,
            [...FAQ_LAYOUTS, ...FAQ_VARIANTS],
            FAQ_VARIANTS,
            "accordion-clean"
          );
          break;
        case "contact":
          validateLayout(
            section.layout,
            section.variant,
            [...CONTACT_LAYOUTS, ...CONTACT_VARIANTS],
            CONTACT_VARIANTS,
            "split-card"
          );
          break;
        default:
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
    }
  );
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
var HERO_VARIANTS, FEATURES_VARIANTS, GALLERY_VARIANTS, TESTIMONIALS_VARIANTS, CTA_VARIANTS, FAQ_VARIANTS, CONTACT_VARIANTS;
var init_website_schema_validator = __esm({
  "src/lib/website-schema-validator.ts"() {
    init_layout_registry();
    HERO_VARIANTS = [
      "immersive",
      "cinematic",
      "editorial",
      "editorial-split",
      "magazine",
      "centered",
      "minimal",
      "split"
    ];
    FEATURES_VARIANTS = [
      "bento",
      "editorial-cards",
      "editorial-list",
      "alternating-stack",
      "grid"
    ];
    GALLERY_VARIANTS = [
      "editorial-mosaic",
      "stacked-collage",
      "collage"
    ];
    TESTIMONIALS_VARIANTS = [
      "floating-cards",
      "editorial-quotes",
      "spotlight"
    ];
    CTA_VARIANTS = ["gradient-band", "split-card", "side-by-side"];
    FAQ_VARIANTS = ["cards", "split-columns", "grid"];
    CONTACT_VARIANTS = [
      "split-card",
      "minimal-centered",
      "centered"
    ];
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
      const result = dotenv.config({
        path: fullPath,
        override: file === ".env.production"
      });
      if (result.error) {
        console.error(`[Env] Error parsing ${fullPath}: ${result.error.message}`);
      } else {
        console.error(`[Env] Successfully loaded ${fullPath} (override: ${file === ".env.production"})`);
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
import fs3 from "fs";
import path3, { dirname } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

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
    await pool.query(`
			CREATE TABLE IF NOT EXISTS lead_ai_messages (
				id INT AUTO_INCREMENT PRIMARY KEY,
				lead_id VARCHAR(255) NOT NULL,
				conversation_id VARCHAR(255) NOT NULL,
				role VARCHAR(50) NOT NULL,
				content TEXT NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				INDEX idx_lead_conv (lead_id, conversation_id)
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
import fs2 from "fs";
import path2 from "path";

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
      throw new Error(
        `cPanel UAPI returned invalid JSON: ${stdout.substring(0, 300)}`
      );
    }
    const result = parsed?.result;
    if (!result) {
      throw new Error(
        `Unexpected cPanel UAPI response shape: ${JSON.stringify(parsed).substring(0, 300)}`
      );
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
    throw new Error(
      `cPanel SSH command failed (${module}::${func}): ${error.message}`
    );
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
  process.stderr.write(
    `[cPanel-SSH] Attempting to delete domain/subdomain: ${fullDomain}
`
  );
  try {
    await callUapiRemote("Domains", "remove_domain", {
      domain: fullDomain
    });
    return true;
  } catch (e) {
    console.warn(
      `[cPanel-SSH] Domains::remove_domain failed: ${e.message}. Trying legacy fallback...`
    );
  }
  try {
    await callUapiRemote("SubDomain", "delsubdomain", {
      domain: subdomain,
      rootdomain: rootDomain
    });
    return true;
  } catch (e) {
    console.warn(
      `[cPanel-SSH] SubDomain::delsubdomain (sub part) failed: ${e.message}. Trying full domain variant...`
    );
  }
  try {
    await callUapiRemote("SubDomain", "delsubdomain", {
      domain: fullDomain,
      rootdomain: rootDomain
    });
    return true;
  } catch (e) {
    console.warn(
      `[cPanel-SSH] SubDomain::delsubdomain (full part) failed: ${e.message}.`
    );
  }
  try {
    await callUapiRemote("SubDomain", "delete_subdomain", {
      domain: subdomain,
      rootdomain: rootDomain
    });
    return true;
  } catch (e) {
    console.warn(
      `[cPanel-SSH] SubDomain::delete_subdomain failed: ${e.message}.`
    );
  }
  try {
    const sshPrefix = getSshPrefix();
    const cpapi2Cmd = `cpapi2 --output=json SubDomain delsubdomain domain=${subdomain} rootdomain=${rootDomain}`;
    const fullCmd = `${sshPrefix} '${cpapi2Cmd}'`;
    process.stderr.write(
      `[cPanel-SSH] Attempting cpapi2 fallback for delsubdomain...
`
    );
    await execAsync(fullCmd, { timeout: 6e4 });
    return true;
  } catch (e) {
    console.warn(
      `[cPanel-SSH] cpapi2 SubDomain::delsubdomain failed: ${e.message}`
    );
  }
  try {
    await callUapiRemote("DomainInfo", "delete_domain", {
      domain: fullDomain
    });
    return true;
  } catch (e) {
    console.error(
      `[cPanel-SSH] All UAPI subdomain deletion methods failed for ${fullDomain}. Final error: ${e.message}`
    );
  }
  const customCmd = process.env.CPANEL_DELETE_SUBDOMAIN_CMD;
  if (customCmd) {
    try {
      const sshPrefix = getSshPrefix();
      const resolved = customCmd.replace(/\{\{subdomain\}\}/g, subdomain).replace(/\{\{rootDomain\}\}/g, rootDomain).replace(/\{\{fullDomain\}\}/g, fullDomain);
      const fullCmd = `${sshPrefix} '${resolved}'`;
      process.stderr.write(
        `[cPanel-SSH] Attempting custom subdomain delete command for ${fullDomain}
`
      );
      await execAsync(fullCmd, { timeout: 6e4 });
      return true;
    } catch (e) {
      console.error(
        `[cPanel-SSH] Custom subdomain delete command failed for ${fullDomain}: ${e.message}`
      );
    }
  }
  throw new Error(
    `Subdomain deletion failed for ${fullDomain}. UAPI modules unavailable and no custom delete command succeeded.`
  );
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
var DEBUG_ROOT_DIR = path2.join(process.cwd(), ".debug-generation");
var MAX_SUBDOMAIN_LENGTH = 45;
var SUBDOMAIN_SEMANTIC_VARIANTS = [
  "-shop",
  "-store",
  "-official",
  "-co",
  "-pro"
];
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
  return `${base}-${crypto.randomBytes(4).toString("hex")}`.substring(
    0,
    MAX_SUBDOMAIN_LENGTH
  );
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
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key),
    Buffer.from(ivHex, "hex")
  );
  let decrypted = decipher.update(Buffer.from(encHex, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
async function appendLog(jobId, message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(`[Job ${jobId}] ${message}`);
  fs2.writeSync(2, `[Job ${jobId}] ${message}
`);
  await pool.query(
    `UPDATE provisioning_jobs SET logs = JSON_ARRAY_APPEND(COALESCE(logs, JSON_ARRAY()), '$', ?) WHERE id = ?`,
    [logEntry, jobId]
  );
}
async function processJob(jobId) {
  const [rows] = await pool.query(
    `SELECT * FROM provisioning_jobs WHERE id = ?`,
    [jobId]
  );
  if (!rows || rows.length === 0) return;
  const job = rows[0];
  if (job.status === "completed" || job.status === "failed") return;
  try {
    await executeStateMachine(job);
  } catch (error) {
    await appendLog(job.id, `ERROR: ${error.message}`);
    if (job.retry_count < MAX_RETRIES) {
      await appendLog(
        job.id,
        `Retrying later (Attempt ${job.retry_count + 1}/${MAX_RETRIES})`
      );
      await pool.query(
        `UPDATE provisioning_jobs SET retry_count = retry_count + 1, locked_at = NULL WHERE id = ?`,
        [job.id]
      );
    } else {
      await appendLog(job.id, `Max retries reached. Initiating rollback.`);
      await rollbackJob(job);
      await pool.query(
        `UPDATE provisioning_jobs SET status = 'failed', locked_at = NULL WHERE id = ?`,
        [job.id]
      );
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
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'creating_subdomain' WHERE id = ?`,
      [job.id]
    );
    await appendLog(job.id, "Starting subdomain creation on remote WP server");
    if (!subdomain) {
      const name = job.business_name || job.project_id;
      subdomain = await generateUniqueSubdomain(name);
      await appendLog(job.id, `Generated subdomain: "${subdomain}"`);
      await pool.query(
        `UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`,
        [subdomain, job.id]
      );
    }
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    await appendLog(job.id, `Remote doc root will be: ${fullDocRoot}`);
    await addSubdomain(subdomain, rootDomain, fullDocRoot);
    await appendLog(
      job.id,
      `Created subdomain: ${subdomain}.${rootDomain} \u2192 ${fullDocRoot}`
    );
    job.status = "creating_database";
  }
  if (job.status === "creating_database") {
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'creating_database' WHERE id = ?`,
      [job.id]
    );
    await appendLog(job.id, "Creating database on remote WP server cPanel");
    const dbPrefix = process.env.CPANEL_USERNAME ? `${process.env.CPANEL_USERNAME}_` : "db_";
    if (!dbName) {
      const suffix = crypto.randomBytes(4).toString("hex");
      dbName = `${dbPrefix}${suffix}`.substring(0, 64);
      dbUser = `${dbPrefix}u${suffix}`.substring(0, 32);
      await pool.query(
        `UPDATE provisioning_jobs SET db_name = ?, db_user = ? WHERE id = ?`,
        [dbName, dbUser, job.id]
      );
    }
    const dbPassword = generateSecurePassword();
    await createDatabase(dbName);
    await createDatabaseUser(dbUser, dbPassword);
    await setDatabasePrivileges(dbUser, dbName);
    await pool.query(
      `UPDATE provisioning_jobs SET db_pass_encrypted = ? WHERE id = ?`,
      [encrypt(dbPassword), job.id]
    );
    job._tempDbPass = dbPassword;
    await appendLog(
      job.id,
      `Created remote database: ${dbName} and user: ${dbUser}`
    );
    job.status = "installing_wordpress";
  }
  if (job.status === "installing_wordpress") {
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'installing_wordpress' WHERE id = ?`,
      [job.id]
    );
    await appendLog(
      job.id,
      "Starting remote WordPress installation via SSH/WP-CLI"
    );
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
      throw new Error(
        `WP-CLI not reachable on remote server: ${wpCliStatus.error}`
      );
    }
    await appendLog(job.id, `WP-CLI available: ${wpCliStatus.version}`);
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    await appendLog(job.id, `Creating remote directory: ${fullDocRoot}`);
    await runRemoteShellCommand(
      `mkdir -p "${fullDocRoot}"`,
      (log) => appendLog(job.id, log)
    );
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
    await createWpConfig(
      fullDocRoot,
      dbName,
      dbUser,
      dbPassword,
      "localhost",
      (log) => appendLog(job.id, log)
    );
    const rawAdminPass = job._tempAdminPass || decrypt(wpAdminPass);
    const siteUrl2 = `http://${subdomain}.${rootDomain}`;
    await installWordPress(
      fullDocRoot,
      siteUrl2,
      `${job.business_name || "Generated Site"} \u2014 ${job.project_id}`,
      wpAdminUser,
      rawAdminPass,
      "admin@digitalscout.online",
      (log) => appendLog(job.id, log)
    );
    await appendLog(job.id, `WordPress installed at ${siteUrl2}`);
    job.status = "configuring_wordpress";
  }
  if (job.status === "configuring_wordpress") {
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'configuring_wordpress' WHERE id = ?`,
      [job.id]
    );
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    await configurePermalinks(
      fullDocRoot,
      "/%postname%/",
      (log) => appendLog(job.id, log)
    );
    await appendLog(job.id, "Configured remote permalinks");
    await appendLog(job.id, "Installing Hello Elementor theme...");
    try {
      await runWpCommand(
        `theme install hello-elementor --activate`,
        fullDocRoot,
        (log) => appendLog(job.id, log)
      );
      await appendLog(job.id, "Hello Elementor theme activated");
    } catch (e) {
      await appendLog(
        job.id,
        `Warning: Theme install failed (${e.message}), using default`
      );
    }
    try {
      await runWpCommand(
        `theme delete twentytwentyfive twentytwentyfour twentytwentythree astra`,
        fullDocRoot,
        (log) => appendLog(job.id, log)
      );
    } catch (e) {
    }
    await runWpCommand(
      `option update default_comment_status closed`,
      fullDocRoot,
      (log) => appendLog(job.id, log)
    ).catch(() => {
    });
    await runWpCommand(
      `option update blogdescription ""`,
      fullDocRoot,
      (log) => appendLog(job.id, log)
    ).catch(() => {
    });
    job.status = "deploying_content";
  }
  if (job.status === "deploying_content") {
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'deploying_content' WHERE id = ?`,
      [job.id]
    );
    await appendLog(
      job.id,
      "Deploying Gutenberg content blocks to remote WordPress..."
    );
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    const schema = typeof job.website_schema === "string" ? JSON.parse(job.website_schema) : job.website_schema;
    if (schema) {
      const { schemaToGutenbergBlocks: schemaToGutenbergBlocks2 } = await Promise.resolve().then(() => (init_wordpress(), wordpress_exports));
      const homepageBlocks = schemaToGutenbergBlocks2(schema);
      await pool.query(
        `UPDATE provisioning_jobs SET gutenberg_trace = ?, status = 'deploying_content' WHERE id = ?`,
        [homepageBlocks, job.id]
      );
      const contentMeta = await injectWebsiteContent(
        fullDocRoot,
        schema,
        homepageBlocks,
        wpAdminUser,
        (log) => appendLog(job.id, log)
      );
      await appendLog(
        job.id,
        `CONTENT_APPLIED source=${contentMeta.renderSource} length=${contentMeta.length} sha1=${contentMeta.sha1}`
      );
      await appendLog(job.id, "Content injected successfully on remote server");
    } else {
      await appendLog(job.id, "WARNING: No website schema found to inject.");
    }
    job.status = "completed";
  }
  if (job.status === "completed") {
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'completed', locked_at = NULL WHERE id = ?`,
      [job.id]
    );
    const httpUrl = `http://${subdomain}.${rootDomain}`;
    await pool.query(
      `
			INSERT IGNORE INTO isolated_deployments
				(id, project_id, subdomain_url, wp_admin_url, admin_username, encrypted_admin_password, website_schema, ssl_status)
			VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
		`,
      [
        crypto.randomUUID(),
        job.project_id,
        httpUrl,
        `${httpUrl}/wp-admin`,
        wpAdminUser,
        wpAdminPass,
        typeof job.website_schema === "string" ? job.website_schema : JSON.stringify(job.website_schema)
      ]
    );
    if (job.trace_id) {
      try {
        await pool.query(
          `INSERT INTO generation_audit_logs (trace_id, step, message, data) VALUES (?, ?, ?, ?)`,
          [
            job.trace_id,
            "provisioning_completed",
            `Remote WordPress site provisioned at ${httpUrl}`,
            JSON.stringify({
              url: httpUrl,
              jobId: job.id,
              remoteHost: process.env.WP_SSH_HOST
            })
          ]
        );
      } catch (e) {
      }
    }
    await appendLog(
      job.id,
      `Job completed! Remote WP site live at ${httpUrl} (SSL polling started)`
    );
  }
}
function esc2(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function ensureWordPressHtmlBlock(html) {
  const trimmed = (html || "").trim();
  if (!trimmed) return "";
  if (trimmed.includes("<!-- wp:html -->")) {
    return trimmed;
  }
  return `<!-- wp:html -->
${trimmed}
<!-- /wp:html -->`;
}
async function injectWebsiteContent(docRoot, schema, _homepageBlocks, adminUser, logCallback) {
  try {
    await logCallback("Cleaning up default WordPress content...");
    try {
      const deleteCmd = `/usr/local/sbin/wp post list --post_type=post,page --format=ids --path="${docRoot}" --allow-root | xargs -r /usr/local/sbin/wp post delete --force --allow-root --path="${docRoot}"`;
      await runRemoteShellCommand(deleteCmd, logCallback);
    } catch (e) {
    }
    let content = "";
    const requireOpenRouterHtml = (process.env.REQUIRE_OPENROUTER_HTML || "").toLowerCase() === "true";
    const renderSource = schema?._renderSource || (schema?._wordpressHtml ? "openrouter-html" : "local-builder");
    if (typeof schema?._wordpressHtml === "string" && schema._wordpressHtml.trim()) {
      await logCallback(
        "Using OpenRouter-generated WordPress homepage HTML..."
      );
      content = ensureWordPressHtmlBlock(schema._wordpressHtml);
    } else {
      if (requireOpenRouterHtml) {
        throw new Error(
          "OpenRouter HTML is required but was not generated. Check OpenRouter config/quota."
        );
      }
      await logCallback(
        "OpenRouter HTML unavailable. Building homepage with local premium-site-builder..."
      );
      const { buildPremiumPageContent: buildPremiumPageContent2 } = await Promise.resolve().then(() => (init_premium_site_builder(), premium_site_builder_exports));
      content = buildPremiumPageContent2(schema);
    }
    const contentHash = crypto.createHash("sha1").update(content).digest("hex");
    await logCallback(
      `Content source=${renderSource} length=${content.length} sha1=${contentHash}`
    );
    await logCallback(
      `[Provisioning] WordPress Homepage HTML Content:
${content}
`
    );
    const traceId = schema?.meta?.traceId || schema?._validation?.traceId;
    if (traceId) {
      try {
        const traceDir = path2.join(DEBUG_ROOT_DIR, traceId);
        fs2.mkdirSync(traceDir, { recursive: true });
        fs2.writeFileSync(
          path2.join(traceDir, "11-wp-injected.html"),
          content,
          "utf8"
        );
        fs2.writeFileSync(
          path2.join(traceDir, "11-wp-injected-meta.json"),
          JSON.stringify(
            {
              renderSource,
              length: content.length,
              sha1: contentHash,
              injectedAt: (/* @__PURE__ */ new Date()).toISOString()
            },
            null,
            2
          ),
          "utf8"
        );
      } catch (e) {
        await logCallback(
          `Warning: failed to write debug injection artifacts: ${e instanceof Error ? e.message : String(e)}`
        );
      }
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
      `post create --post_type=page --post_title="Home" --post_content="$(cat '${tmpFile}')" --post_status=publish --format=ids --user="${adminUser}"`,
      docRoot,
      logCallback
    );
    const homePageId = homePageIdOut.stdout.replace(/[^0-9]/g, "").trim();
    await runRemoteShellCommand(`rm -f '${tmpFile}'`, logCallback).catch(
      () => {
      }
    );
    if (!homePageId || homePageId === "0") {
      throw new Error("Home page creation failed \u2014 invalid ID returned");
    }
    await logCallback(
      `Home page created with ID: ${homePageId}. Setting as front page...`
    );
    await runWpCommand(
      `option update show_on_front page`,
      docRoot,
      logCallback
    );
    await runWpCommand(
      `option update page_on_front ${homePageId}`,
      docRoot,
      logCallback
    );
    if (schema.brand?.businessName) {
      await runWpCommand(
        `option update blogname "${esc2(schema.brand.businessName)}"`,
        docRoot,
        logCallback
      );
    }
    await runWpCommand(
      `rewrite structure "/%postname%/"`,
      docRoot,
      logCallback
    );
    await runWpCommand(`rewrite flush`, docRoot, logCallback);
    if (schema.brand?.logo) {
      try {
        await logCallback(`Attempting to import logo: ${schema.brand.logo}`);
        let mediaId = "";
        try {
          const mediaOut = await runWpCommand(
            `media import "${schema.brand.logo}" --porcelain`,
            docRoot,
            logCallback
          );
          mediaId = mediaOut.stdout.trim();
        } catch (e) {
          await logCallback(
            "Direct import failed. Retrying with local temp file..."
          );
          const ext = schema.brand.logo.toLowerCase().includes(".png") ? "png" : "jpg";
          const remoteTmpMedia = `/tmp/ds_logo_${Date.now()}.${ext}`;
          await runRemoteShellCommand(
            `curl -sL "${schema.brand.logo}" -o "${remoteTmpMedia}"`,
            logCallback
          );
          const mediaOut = await runWpCommand(
            `media import "${remoteTmpMedia}" --porcelain`,
            docRoot,
            logCallback
          );
          mediaId = mediaOut.stdout.trim();
          await runRemoteShellCommand(
            `rm -f "${remoteTmpMedia}"`,
            logCallback
          ).catch(() => {
          });
        }
        if (/^\d+$/.test(mediaId)) {
          await logCallback(
            `Logo imported successfully (ID: ${mediaId}). Setting as site icon.`
          );
          await runWpCommand(
            `option update site_icon ${mediaId}`,
            docRoot,
            logCallback
          );
        }
      } catch (e) {
        await logCallback(`Warning: logo import failed: ${e.message}`);
      }
    }
    await logCallback("Premium WordPress site injection complete \u2713");
    try {
      if (siteUrl) {
        await logCallback(
          `Fetching final rendered site at ${siteUrl} for debug capture...`
        );
        const resp = await fetch(siteUrl);
        const finalDom = await resp.text().catch(() => "");
        const traceId2 = schema?.meta?.traceId || schema?._validation?.traceId;
        if (traceId2 && finalDom) {
          const traceDir = path2.join(DEBUG_ROOT_DIR, traceId2);
          fs2.mkdirSync(traceDir, { recursive: true });
          fs2.writeFileSync(
            path2.join(traceDir, "12-wp-final-dom.html"),
            finalDom,
            "utf8"
          );
          const stripped = finalDom.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\sstyle="[^"]*"/gi, "");
          fs2.writeFileSync(
            path2.join(traceDir, "12-wp-final-dom-stripped.html"),
            stripped,
            "utf8"
          );
          const wpMutations = {
            contains_elementor: /elementor/i.test(finalDom),
            contains_wp_blocks: /wp-block/i.test(finalDom),
            theme_injection_detected: /theme|header|footer|site-title/i.test(
              finalDom
            ),
            length: finalDom.length
          };
          fs2.writeFileSync(
            path2.join(traceDir, "12-wp-final-mutations.json"),
            JSON.stringify(wpMutations, null, 2),
            "utf8"
          );
        }
      }
    } catch (e) {
      await logCallback(
        `Warning: failed to fetch/persist final WP DOM: ${e instanceof Error ? e.message : String(e)}`
      );
    }
    return { renderSource, length: content.length, sha1: contentHash };
  } catch (error) {
    await logCallback(
      `CRITICAL ERROR during content injection: ${error.message}`
    );
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
      await appendLog(
        job.id,
        `[ROLLBACK] Deleted subdomain ${job.subdomain}.${rootDomain}`
      );
    } catch (e) {
      await appendLog(
        job.id,
        `[ROLLBACK] Failed to delete subdomain: ${e.message}`
      );
      await appendLog(
        job.id,
        "[ROLLBACK] Tip: configure CPANEL_DELETE_SUBDOMAIN_CMD if UAPI delete is unavailable."
      );
    }
    const fullDocRoot = `${docRootBase}/${job.subdomain}`;
    try {
      await runRemoteShellCommand(
        `rm -rf "${fullDocRoot}"`,
        (log) => appendLog(job.id, log)
      );
      await appendLog(
        job.id,
        `[ROLLBACK] Deleted remote directory: ${fullDocRoot}`
      );
    } catch (e) {
      await appendLog(
        job.id,
        `[ROLLBACK] Failed to delete remote directory: ${e.message}`
      );
    }
  }
  if (job.db_name) {
    try {
      await deleteDatabase(job.db_name);
      await appendLog(
        job.id,
        `[ROLLBACK] Deleted remote database: ${job.db_name}`
      );
    } catch (e) {
      await appendLog(
        job.id,
        `[ROLLBACK] Failed to delete database: ${e.message}`
      );
    }
  }
  if (job.db_user) {
    try {
      await deleteDatabaseUser(job.db_user);
      await appendLog(
        job.id,
        `[ROLLBACK] Deleted remote DB user: ${job.db_user}`
      );
    } catch (e) {
      await appendLog(
        job.id,
        `[ROLLBACK] Failed to delete DB user: ${e.message}`
      );
    }
  }
  await appendLog(job.id, "[ROLLBACK] Remote cleanup finished.");
}
async function deleteProvisionedWordPressSite(projectId) {
  console.log(
    `[Cleanup] Starting comprehensive remote deletion for project ${projectId}`
  );
  const [rows] = await pool.query(
    `SELECT * FROM provisioning_jobs WHERE project_id = ?`,
    [projectId]
  );
  if (!rows || rows.length === 0) {
    console.warn(
      `[Cleanup] No provisioning job found in DB for project ${projectId}. Attempting database-only purge.`
    );
    await pool.query(`DELETE FROM isolated_deployments WHERE project_id = ?`, [
      projectId
    ]);
    await pool.query(`DELETE FROM provisioning_jobs WHERE project_id = ?`, [
      projectId
    ]);
    return;
  }
  for (const job of rows) {
    try {
      await rollbackJob(job);
    } catch (e) {
      console.error(
        `[Cleanup] Rollback failed for job ${job.id}: ${e.message}`
      );
    }
  }
  try {
    const [del1] = await pool.query(
      `DELETE FROM isolated_deployments WHERE project_id = ?`,
      [projectId]
    );
    const [del2] = await pool.query(
      `DELETE FROM provisioning_jobs WHERE project_id = ?`,
      [projectId]
    );
    console.log(
      `[Cleanup] Project ${projectId} purged from local DB. Jobs removed: ${del2.affectedRows}`
    );
  } catch (e) {
    console.error(
      `[Cleanup] Failed to purge project ${projectId} from local DB: ${e.message}`
    );
    throw e;
  }
  console.log(
    `[Cleanup] Project ${projectId} remote resources and local records fully processed.`
  );
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
init_premium_site_builder();
init_direct_vertex_homepage_generation();
fs3.writeSync(
  2,
  `[BOOT] Server process starting at ${(/* @__PURE__ */ new Date()).toISOString()}
`
);
fs3.writeSync(2, `[BOOT] CWD: ${process.cwd()}
`);
fs3.writeSync(2, `[BOOT] DB_USER: ${process.env.DB_USER || "NOT SET"}
`);
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname(__filename2);
var GoogleGenerativeAI = null;
var app = express();
var PORT = process.env.PORT || 5001;
var logStderr = (message) => {
  fs3.writeSync(2, `${message}
`);
};
var lastGeminiCallTime = 0;
var geminiQueueChain = Promise.resolve();
async function throttleGemini() {
  const currentQueue = geminiQueueChain;
  let resolveLock;
  const lockPromise = new Promise((resolve) => {
    resolveLock = resolve;
  });
  geminiQueueChain = lockPromise;
  await currentQueue;
  const now = Date.now();
  const elapsed = now - lastGeminiCallTime;
  if (elapsed < 1e4) {
    const waitTime = 1e4 - elapsed;
    logStderr(
      `[Gemini Throttle] Queue waiting ${waitTime}ms to maintain 10s gap...`
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastGeminiCallTime = Date.now();
  resolveLock();
}
app.use(
  cors({
    exposedHeaders: ["x-debug-generation-id", "x-debug-generation-fallback"]
  })
);
app.use(express.json({ limit: "50mb" }));
app.get("/", (req, res) => {
  res.send("DigitalScout API Running");
});
var DEBUG_ROOT_DIR2 = path3.join(process.cwd(), ".debug-generation");
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
  let folderPath = path3.join(DEBUG_ROOT_DIR2, folderName);
  let suffix = 2;
  while (fs3.existsSync(folderPath)) {
    folderName = `${traceId}-${suffix}`;
    folderPath = path3.join(DEBUG_ROOT_DIR2, folderName);
    suffix += 1;
  }
  fs3.mkdirSync(folderPath, { recursive: true });
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
  fs3.mkdirSync(session.folderPath, { recursive: true });
  const targetPath = path3.join(session.folderPath, fileName);
  const payload = formatDebugPayload(content);
  if (append && fs3.existsSync(targetPath)) {
    fs3.appendFileSync(targetPath, `${payload}
`, "utf8");
    return;
  }
  fs3.writeFileSync(targetPath, payload, "utf8");
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
function getLatestApiKeyFromDisk(keyName = "GEMINI_API_KEY") {
  const key = process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      `Missing Gemini API Key. Please provide GOOGLE_CLOUD_API_KEY or GEMINI_API_KEY in your environment.`
    );
  }
  return key;
}
async function getSDKGenAI() {
  const key = getLatestApiKeyFromDisk();
  console.log(
    `[AI Chat] getSDKGenAI runtime lookup key:`,
    key ? `${key.substring(0, 10)}...` : "NOT FOUND"
  );
  if (!key) return null;
  if (!GoogleGenerativeAI) {
    try {
      const mod = await import("@google/generative-ai");
      GoogleGenerativeAI = mod.GoogleGenerativeAI;
    } catch (e) {
      console.error("[Gemini] SDK package @google/generative-ai not found.");
      return null;
    }
  }
  return new GoogleGenerativeAI(key);
}
var GENAI_KEY2 = process.env.GEMINI_API_KEY || process.env.GENAI_KEY;
async function generateCreativeDirection(business, debugSession) {
  const modelsToTry = [
    { name: "gemini-flash-latest", timeoutMs: 45e3 },
    { name: "gemini-flash-latest", timeoutMs: 45e3 }
  ];
  const buildImageBlock = (b) => {
    const sources = typeof collectBusinessImages2 === "function" ? collectBusinessImages2(b) : b.photos || [];
    return sources.length ? sources.slice(0, 10).map((u, i) => `${i + 1}. ${u}`).join("\n") : "None";
  };
  const buildReviewsBlock = (b) => {
    if (Array.isArray(b.reviews) && b.reviews.length) {
      return b.reviews.slice(0, 5).map(
        (r, i) => `${i + 1}. ${r.rating || ""} - ${r.text || r.comment || ""}`
      ).join("\n");
    }
    return "None";
  };
  const prompt = `You are a premium Senior Staff Brand Director and Art Director.
Your task is to analyze the local business data below and establish a highly custom, unique, and premium Creative Direction Brief.

This brief will dictate the brand personality, visual identity, storytelling flow, composition style, and spacing pacing for their website. Avoid generic and repetitive templates at all costs.

Business Context:
- Name: ${business.name}
- Category: ${business.category || "Local Service"}
- Address: ${business.address || "N/A"}
- Phone: ${business.phoneNumber || "N/A"}
- Email: ${business.email || "N/A"}
- Neighborhood / Vibe: ${business.neighborhood || business.vibe || "Unknown"}
- Specialties: ${Array.isArray(business.specialties) ? business.specialties.join(", ") : business.specialties || "General"}
- Tone: ${business.tone || "professional"}
- Reviews:
${buildReviewsBlock(business)}
- Reference Images:
${buildImageBlock(business)}

INSTRUCTIONS:
1. Infer the Business Personality along these six spectrums (score 0 to 100):
   - luxuryVsApproachable (0 = extremely friendly/budget, 100 = high-end premium luxury)
   - technicalVsEmotional (0 = emotional/sensory, 100 = precise/clinical/technical)
   - modernVsHeritage (0 = timeless/heritage/vintage, 100 = bleeding-edge modern)
   - industrialVsEditorial (0 = raw/structural/industrial, 100 = high-fashion editorial layout)
   - minimalistVsLayered (0 = high-density sensory layered, 100 = clean ultra-minimalist)
   - premiumVsEnergetic (0 = high-intensity energetic/playful, 100 = premium/restrained)

CATEGORY-SPECIFIC DESIGN MANDATES (Enforce specifically if the business matches these industries):
- Supermarkets / Groceries / Bakeries:
  * luxuryVsApproachable: 30 to 50 (warm, welcoming, community-first marketplace).
  * technicalVsEmotional: 10 to 30 (highly sensory, abundance-focused, fresh food imagery).
  * minimalistVsLayered: 20 to 45 (layered product showcases, textured natural grids, denser sensory layout).
  * themeMode: "textured-neutral" or "light" (warm eggshell, linen, soft cream).
  * headingFontFamily / bodyFontFamily: Soft approachable typography (e.g. Plus Jakarta Sans / Inter).
  * spacingRhythm: "compact" or "balanced" (tighter margin-top/bottom scales to reduce excess whitespace).
- Damage Restoration / Cleanup / Emergency Contractors:
  * luxuryVsApproachable: 50 to 65 (authoritative, trustworthy, highly-professional).
  * technicalVsEmotional: 80 to 95 (technical precision, dramatic safety confidence).
  * minimalistVsLayered: 60 to 80 (structural layouts, atmospheric contrast).
  * themeMode: "light" or "textured-neutral" (warm eggshell, clean white, or light slate backgrounds. Do NOT use dark backgrounds under any circumstances).
  * headingFontFamily / bodyFontFamily: Strong uppercase impact (e.g. Outfit / Space Grotesk).
  * spacingRhythm: "balanced" or "compact" (rugged precision).
- Roofing Companies / Roofers / Structural Contractors:
  * luxuryVsApproachable: 35 to 50 (bold contractor, powerful, action-focused).
  * technicalVsEmotional: 65 to 80 (precise durable roofing engineering).
  * minimalistVsLayered: 50 to 70 (high-energy bold highlights).
  * themeMode: "light" or "textured-neutral" (eggshell or clean white background, accented with bright safety-orange or durable blue details. Do NOT use dark backgrounds under any circumstances).
  * headingFontFamily / bodyFontFamily: Heavy geometric headings (e.g. Syne / Inter).
  * spacingRhythm: "compact" (highly energetic, high readability, compact text columns).


2. Determine the Visual Theme Mode. FORCE "light" or "textured-neutral" themes ONLY. Do NOT generate "dark" or "charcoal" themes under any circumstances. All designs must feel bright, airy, clean, professional, and accessible.
   - "light": Warm-white, clean, high visibility. Best for medical, local cleaners, organic day-spas.
   - "textured-neutral": Warm linen, eggshell, textured beige, soft taupe. Best for fine-dining restaurants, boutique hotels, artisan pottery.

3. GOOGLE MAPS PHOTO MANDATE:
   - Always prioritize using the provided Google Maps photos from the "Reference Images" list inside the media layouts. Do not recommend placeholder designs or external stock illustrations when custom business imagery is available.

3. Establish the Brand Concept and Art Direction Brief:
   - emotionalTone (e.g. "Warm, slow-paced luxury" or "Raw, high-octane energetic speed")
   - brandPersonalityDescription
   - typographyMood (e.g. Serif headings + clean sans-serif body, or stark monospaced typography)
   - headingFontFamily and bodyFontFamily pairings
   - spacingRhythm: Choose "airy" (generous negative space, editorial spacing), "balanced" (standard premium spacing), or "compact" (dense, clean, high information density)
   - layoutPacing (narrative flow pacing and section rhythm description)
   - compositionPhilosophy (e.g., asymmetrical grids, layered overlapping elements, cinematic full-bleed sections, or centered balanced grids)
   - mediaTreatment (how photos should be styled: round corners, arched frames, moody luxury shadow overlays)
   - motionPersonality (interaction transition details)
   - premiumReferences (specific real-world high-end design inspirations)
   - atmosphericDirectionDescription

4. Construct a Design Token Engine output specifically fitted for the category's visual design language:
   - Spacing Scale: Choose responsive vertical intervals using relative sizing (e.g., clamp for section padding, and custom variables for element spacing matching spacing density).
   - Typography Scale: Responsive header scales using fluid clamp() declarations.
   - Radius System: Values from soft rounded shapes to sharp geometric cuts.
   - Shadow System: Advanced layered box-shadow styles utilizing smooth transparency ramps.
   - Texture System: Choose "grain", "noise", "backdrop-glass", or "none" with a CSS styleString descriptor.
   - Animation Timing System: Choose premium custom cubic-bezier easing curves.
   - Layering Depth System: Specify CSS z-index hierarchies.
   - Gradient System: Inferred ambient background glows and brand highlights.

Return ONLY a valid JSON object matching the following structure (no markdown, no backticks, no other text):
{
  "emotionalTone": "...",
  "brandPersonality": {
    "luxuryVsApproachable": 50,
    "technicalVsEmotional": 50,
    "modernVsHeritage": 50,
    "industrialVsEditorial": 50,
    "minimalistVsLayered": 50,
    "premiumVsEnergetic": 50
  },
  "visualIdentity": {
    "themeMode": "light",
    "colorPalettePhilosophy": "...",
    "primaryColorIntent": "...",
    "accentColorIntent": "...",
    "backgroundColorIntent": "...",
    "surfaceColorIntent": "..."
  },
  "compositionPhilosophy": {
    "alignment": "asymmetrical",
    "layoutCadence": "...",
    "spacingRhythm": "balanced",
    "sectionTransitions": "..."
  },
  "typographyMood": {
    "headingFontFamily": "...",
    "bodyFontFamily": "...",
    "moodDescriptor": "..."
  },
  "mediaTreatment": {
    "style": "...",
    "shapes": ["..."]
  },
  "motionAndInteractions": {
    "personality": "subtle",
    "feel": "..."
  },
  "premiumReferences": ["..."],
  "atmosphericDirectionDescription": "...",
  "designTokens": {
    "spacingScale": {
      "xs": "...",
      "sm": "...",
      "md": "...",
      "lg": "...",
      "xl": "...",
      "xxl": "..."
    },
    "typographyScale": {
      "heroHeadline": "clamp(...)",
      "sectionHeadline": "clamp(...)",
      "bodyText": "clamp(...)",
      "headingFont": "...",
      "bodyFont": "..."
    },
    "radiusSystem": {
      "sm": "...",
      "md": "...",
      "lg": "...",
      "full": "..."
    },
    "shadowSystem": {
      "soft": "...",
      "premium": "...",
      "intense": "..."
    },
    "textureSystem": {
      "mode": "grain",
      "styleString": "..."
    },
    "animationTimingSystem": {
      "easingCurve": "...",
      "revealDuration": "..."
    },
    "layeringDepthSystem": {
      "zBack": "...",
      "zBase": "...",
      "zOverlay": "..."
    },
    "colorRamp": {
      "background": "...",
      "surface": "...",
      "primary": "...",
      "accent": "...",
      "text": "...",
      "muted": "...",
      "outline": "..."
    },
    "gradientSystem": {
      "ambientLighting": "...",
      "brandGradient": "..."
    }
  }
}`;
  let responseText = "";
  let lastError = null;
  for (const model of modelsToTry) {
    try {
      const restUrl = process.env.GEMINI_REST_URL || "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";
      const key = getLatestApiKeyFromDisk() || process.env.GEMINI_API_KEY || process.env.GENAI_KEY || GENAI_KEY2;
      if (!key) {
        throw new Error("Gemini API key is not configured.");
      }
      const modelRestUrl = restUrl.includes("{model}") ? restUrl.replace("{model}", model.name) : restUrl;
      const url = `${modelRestUrl}${modelRestUrl.includes("?") ? "&" : "?"}key=${key}`;
      await throttleGemini();
      const fetchResponse = await Promise.race([
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 2048
            }
          })
        }),
        new Promise(
          (_, reject) => setTimeout(
            () => reject(
              new Error(
                `Creative Direction timeout after ${model.timeoutMs}ms`
              )
            ),
            model.timeoutMs
          )
        )
      ]);
      if (!fetchResponse.ok) {
        throw new Error(
          `REST failed (${fetchResponse.status}): ${await fetchResponse.text()}`
        );
      }
      const data = await fetchResponse.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (responseText) {
        break;
      }
    } catch (err) {
      lastError = err;
      console.error(
        `[Creative Direction] attempt failed for ${model.name}:`,
        err
      );
    }
  }
  if (!responseText) {
    throw lastError || new Error("Failed to generate creative direction");
  }
  try {
    const cleaned = responseText.replace(/```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error(
      "[Creative Direction] JSON parse failed, returning fallback art brief",
      e
    );
    return {
      emotionalTone: "Warm, professional, trust-first",
      brandPersonality: {
        luxuryVsApproachable: 40,
        technicalVsEmotional: 30,
        modernVsHeritage: 50,
        industrialVsEditorial: 30,
        minimalistVsLayered: 40,
        premiumVsEnergetic: 60
      },
      visualIdentity: {
        themeMode: "light",
        colorPalettePhilosophy: "Earthy modern elegance",
        primaryColorIntent: "#1e3a8a",
        accentColorIntent: "#3b82f6",
        backgroundColorIntent: "#fafafa",
        surfaceColorIntent: "#ffffff"
      },
      compositionPhilosophy: {
        alignment: "balanced",
        layoutCadence: "Clear vertical hierarchy, balanced visual weights",
        spacingRhythm: "balanced",
        sectionTransitions: "Clean margins with subtle boundaries"
      },
      typographyMood: {
        headingFontFamily: "Outfit",
        bodyFontFamily: "Inter",
        moodDescriptor: "Clean and modern professional"
      },
      mediaTreatment: {
        style: "bright-clean",
        shapes: ["rounded"]
      },
      motionAndInteractions: {
        personality: "subtle",
        feel: "Fade transitions and quiet slide overlays"
      },
      premiumReferences: ["Apple", "Stripe Layouts"],
      atmosphericDirectionDescription: "Clean, inviting, highly structured page layout"
    };
  }
}
var CALLHIPPO_API_KEY = process.env.CALLHIPPO_API_KEY;
var NETLIFY_TOKEN = process.env.VITE_NETLIFY_TOKEN || process.env.NETLIFY_TOKEN;
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
      await throttleGemini();
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
      const parsed = parseLeadQualificationOutput(
        (response.text() || "").trim()
      );
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
      return pickBySeed(["editorial-mosaic", "stacked-collage"], seed + 19);
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
      return pickBySeed(
        ["gradient-band", "split-card", "side-by-side"],
        seed + 31
      );
    }
    if (sectionType === "contact") {
      return pickBySeed(
        ["split-card", "minimal-centered", "centered"],
        seed + 37
      );
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
function collectBusinessImages2(business) {
  return Array.from(
    new Set(
      [
        ...business?.photos || [],
        ...business?.imageSuggestions || []
      ].filter(
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
          typography: {
            heading: "Playfair Display",
            body: "Plus Jakarta Sans"
          }
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
        quote: "The new site actually reflects what makes this place special\u0393\xC7\xF6it brought me back to visit.",
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
        quote: "The website shows professionalism and care\u0393\xC7\xF6exactly what I experienced when I visited.",
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
        quote: "The online tour showed real community energy\u0393\xC7\xF6joined immediately and haven't looked back.",
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
        quote: "Their online listing brought clarity to a complex market\u0393\xC7\xF6guided me through the whole process with expertise.",
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
        quote: "My premium items have never looked better\u0393\xC7\xF6trusted professionals who care about quality.",
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
        answer: "We stand behind our work and have industry insurance. We'll discuss solutions immediately\u0393\xC7\xF6your satisfaction matters."
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
  const imagePool = collectBusinessImages2(business);
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
  const featureLayout = categoryNorm.includes("salon") || categoryNorm.includes("spa") ? pickBySeed(
    ["bento", "alternating-stack", "editorial-cards"],
    copySeed + 9
  ) : layoutVariant === "minimal" ? "list" : "cards";
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
      description: `Premium website for ${siteName}\u0393\xC7\xF6${categoryLabel} services with modern design and seamless booking.`,
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
function ensureSchemaMetadata(schema, business, traceId) {
  const now = Date.now();
  const safeSchema = schema || {};
  if (!safeSchema.schemaVersion) {
    safeSchema.schemaVersion = "1.0";
  }
  if (!safeSchema.meta) {
    safeSchema.meta = {};
  }
  if (!safeSchema.meta.businessId) {
    safeSchema.meta.businessId = business?.id || business?.placeId || `biz-${now}`;
  }
  if (!safeSchema.meta.siteId) {
    safeSchema.meta.siteId = `site-${safeSchema.meta.businessId}-${now}`;
  }
  if (!safeSchema.meta.slug) {
    safeSchema.meta.slug = (business?.name || "site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  if (!safeSchema.meta.version) {
    safeSchema.meta.version = 1;
  }
  if (!safeSchema.meta.target) {
    safeSchema.meta.target = "wordpress";
  }
  if (traceId) {
    safeSchema.meta.traceId = traceId;
  }
  if (!safeSchema.brand) {
    safeSchema.brand = {};
  }
  safeSchema.brand.businessName = safeSchema.brand.businessName || business?.name || "Business";
  safeSchema.brand.category = safeSchema.brand.category || business?.category || "Local Business";
  safeSchema.brand.address = safeSchema.brand.address || business?.address || "";
  safeSchema.brand.phone = safeSchema.brand.phone || business?.phoneNumber || "";
  safeSchema.brand.email = safeSchema.brand.email || business?.email || "";
  safeSchema.brand.websiteUri = safeSchema.brand.websiteUri || business?.websiteUri || "";
  safeSchema.brand.logo = safeSchema.brand.logo || business?.logo || "";
  if (!safeSchema.seo) {
    safeSchema.seo = {};
  }
  safeSchema.seo.title = safeSchema.seo.title || business?.name || "Website Preview";
  safeSchema.seo.description = safeSchema.seo.description || business?.description || `Bespoke web presentation for ${business?.name || "our client"}.`;
  safeSchema.seo.keywords = safeSchema.seo.keywords || [
    business?.name || "Business",
    business?.category || "Local Business"
  ];
  if (!safeSchema.theme) {
    safeSchema.theme = {
      name: "default",
      style: "modern",
      radius: "8px",
      layout: "balanced",
      buttonStyle: "rounded",
      surfaceStyle: "solid",
      mediaShape: "rounded",
      density: "balanced",
      accentMode: "fresh",
      palette: {
        primary: "#2563eb",
        surface: "#ffffff",
        background: "#f8fafc",
        accent: "#f59e0b",
        text: "#0f172a",
        muted: "#64748b",
        outline: "#e2e8f0"
      },
      typography: {
        heading: "Inter",
        body: "Inter"
      },
      brandDNA: {
        spacingPersonality: "balanced",
        compositionAggression: 50,
        hierarchyIntensity: 50,
        motionEnergy: 50,
        visualDensity: 50,
        asymmetryLevel: 50,
        atmosphereIntensity: 50,
        typographyDominance: "balanced",
        imageWeight: 50,
        luxuryScore: 50,
        cinematicScore: 50,
        brutalismScore: 50,
        editorialScore: 50,
        softnessScore: 50,
        visualAtmosphere: "soft-editorial-warmth"
      }
    };
  } else {
    safeSchema.theme.brandDNA = safeSchema.theme.brandDNA || {
      spacingPersonality: "balanced",
      compositionAggression: 50,
      hierarchyIntensity: 50,
      motionEnergy: 50,
      visualDensity: 50,
      asymmetryLevel: 50,
      atmosphereIntensity: 50,
      typographyDominance: "balanced",
      imageWeight: 50,
      luxuryScore: 50,
      cinematicScore: 50,
      brutalismScore: 50,
      editorialScore: 50,
      softnessScore: 50,
      visualAtmosphere: "soft-editorial-warmth"
    };
  }
  if (!safeSchema._validation) {
    safeSchema._validation = {
      repairs: [],
      validatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      traceId,
      photos: business?.photos || [],
      imageSuggestions: business?.imageSuggestions || [],
      logo: business?.logo || ""
    };
  } else if (traceId) {
    safeSchema._validation.traceId = traceId;
  }
  return safeSchema;
}
app.post("/api/generate", async (req, res) => {
  try {
    const business = req.body;
    if (!business || !business.name) {
      return res.status(400).json({ error: "Missing business payload" });
    }
    const debugSession = createGenerationDebugSession(business);
    logStderr(
      `[Generate] start traceId=${debugSession.traceId} business=${business.name} mode=${WEBSITE_GENERATION_MODE}`
    );
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
      return res.status(422).json({
        error: "Website creation failed: template mode is enabled."
      });
    }
    if (!GENAI_KEY2 && !process.env.GEMINI_REST_URL) {
      debugSession.fallbackReason = "missing-config";
      appendGenerationDebugError(
        debugSession,
        "fallback_triggered: no Gemini API configuration found"
      );
      return res.status(422).json({
        error: "Website creation failed: AI configuration missing."
      });
    }
    const restFallback = async () => {
      res.setHeader("x-debug-generation-fallback", "true");
      console.error(
        `[Generate] [REST Fallback] Generating Creative Direction stage 0...`
      );
      const creativeDirection = await generateCreativeDirection(
        business,
        debugSession
      );
      persistGenerationDebugFile(
        debugSession,
        "01a-creative-direction.json",
        creativeDirection
      );
      const buildImageBlock = (b) => {
        const sources = collectBusinessImages2(b);
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
      const qualificationNotes = business.notes || business.qualificationNotes || "None";
      const neighborhood = business.neighborhood || business.vibe || "Unknown";
      const specialties = Array.isArray(business.specialties) ? business.specialties.join(", ") : business.specialties || "General services";
      const tone = business.tone || "professional";
      const creativeSeed = `${business.id || "lead"}-${Date.now()}`;
      const dynamicVariationSeed = crypto2.randomUUID().slice(0, 8);
      const variationBriefs = [
        "Enforce an asymmetrical, high-end editorial composition. Avoid grids where every card is equal size; use offset cards or split layouts.",
        "Enforce a clean, layered minimal aesthetic. Use large typography, generous negative margins, and overlapping media panels.",
        "Enforce a cinematic, grid-forward dynamic layout. Mix bento cells (span layouts) with full-bleed atmospheric banners.",
        "Enforce a highly structured, content-rich storytelling split layout. Alternate left-aligned text with large asymmetrical shapes."
      ];
      const chosenVariationBrief = variationBriefs[Math.abs(
        creativeSeed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      ) % variationBriefs.length];
      const prompt = `You are generating a PREMIUM WORDPRESS HOMEPAGE schema for a real local business based on a custom-designed Creative Direction Brief.

CREATIVE DIRECTION BRIEF:
${JSON.stringify(creativeDirection, null, 2)}

PRIMARY OBJECTIVE:
- Generate a highly bespoke, custom-themed WebsiteSchema that implements the Creative Direction Brief with extreme visual restraint, elegance, and emotional sophistication.
- FORCE LIGHT THEME: You MUST generate "light" or "textured-neutral" themes only. Under NO circumstances should any section backgrounds, cards, or hero wrappers be dark, charcoal, deep gray, or pitch black. All surfaces must be bright (warm eggshell, soft cream, linen, or white).
- GOOGLE MAPS IMAGES MANDATE: You MUST use the provided Google Maps photos from the "Reference Images" list directly for all image, media, or background URL properties in your sections. Do NOT invent external stock links or placeholder names. Simply copy the exact Google Maps URL strings from the list directly into your schema!
- Avoid excessive, empty whitespace that causes the site to feel "underdeveloped" or generic startup-like. Maintain tight, high-impact padding variables to ensure a cohesive, robust visual experience.
- Break free from templates. Create a unique pacing, visual flow, and section rhythm specifically suited for this business, prioritizing fewer, more high-impact sections over many repetitive ones.
- Enforce the brand's visual identity (theme mode, color palette, custom gradients, typography pairing) with absolute consistency. Avoid excessive mutations or contrast mismatch.
- Adopt a visual reference language suited perfectly to the business category:
  * "Supermarkets / Groceries": Sensory, abundant, rich, culturally-layered, and fresh-produce oriented. Use soft warm colors, magazine-style layouts, overlapping collages, dense marketplace section showcases, and warm approachable fonts.
  * "Restoration / Construction / Emergency": Cinematic, rugged, technical, industrial, and highly authoritative. Use clean white/light sand backdrops, bold high-contrast details, dramatic before/after comparing blocks, and technical timelines.
  * "Roofing / Structural Contractor": Rugged, powerful, action-focused, energetic, and extremely durable. Use clean light slate backdrops, angular layouts, diagonal transitions, safety orange highlights, weather-proof metrics strips, and bold trust badges.

COPYWRITING INSTRUCTIONS (CRITICAL):
- TONE: Journalistic, confident, and highly specific. Write like an editor for Monocle or GQ.
- RULE 1: NO AI SPEAK. Permanently ban words like: "Unlock, Discover, Unleash, Elevate, Premier, Top-Notch, Cutting-Edge, Tailored, Seamless." 
- RULE 2: Show, Don't Tell. Instead of "We offer the best plumbing services," write "Emergency leak repair and pipe routing in under 45 minutes."
- RULE 3: Use hyper-local anchors. Reference the actual neighborhood, street, or city vibe provided in the context to make it feel grounded.
- RULE 4: Hero Subheadlines must state exactly what the business does, who it is for, and where it is located in plain, striking English.

DYNAMIC SECTIONS & COMPOSITION ORCHESTRATION:
- Do NOT use a standard, repetitive section structure.
- You have full creative control over which sections exist, their sequence, and their hierarchy to optimize the brand's narrative.
- You do NOT write raw HTML. Instead, you are the Creative Director and Orchestrator.
- For EVERY section in the "sections" array, you MUST generate a highly custom "composition" object instructing our premium rendering engine how to build that section.

COMPOSITION DICTIONARY OPTIONS (Choose appropriate properties matching business category tone):
"composition": {
  "sectionType": Choose from [
    "cinematicHero", "editorialHero", "splitNarrativeHero", 
    "asymmetricalFeatures", "glassFeatureCards", "processNarrative", 
    "immersiveGallery", "floatingImageStack", 
    "floatingTestimonialWall", 
    "layeredCTA", 
    "luxuryMetricsStrip", "storytellingTimeline", "transformationShowcase", 
    "premiumContactPanel", "accordionClean"
  ],
  "layoutBehavior": Choose from [
    "offset-right", "offset-left", "grid-stagger", "asymmetrical", "side-by-side", "split-grid", "centered-dramatic", "horizontal-carousel", "diagonal-split"
  ],
  "visualDepth": Choose from [
    "layered-atmospheric", "glassmorphic", "frosted-glow", "dramatic-depth", "flat-minimalist"
  ],
  "motionStyle": Choose from [
    "premiumFade", "cinematicReveal", "staggerLift", "softFloat", "atmosphericParallax", "editorialSlide", "luxuryGlow"
  ],
  "imageTreatment": Choose from [
    "layeredGlass", "editorialCrop", "cinematicBleed", "atmosphericOverlay", "luxuryFrame", "brutalistSharp", "floatingDepth", "diagonalWedge"
  ],
  "spacingMode": Choose from [
    "luxury-editorial", "balanced", "compact", "airy"
  ],
  "themeIntensity": Choose from [
    "dramatic", "soft", "balanced", "high-contrast"
  ],
  "hierarchyWeight": Choose from [
    "dominant", "supporting", "breathing", "cinematicPause", "transitionary"
  ]
}

UNIQUENESS ENFORCEMENT BRIEF:
- Variation Seed: ${dynamicVariationSeed}
- Layout Fingerprint Direction: ${chosenVariationBrief}
- Ensure that the order of sections, the typography weights, the padding spacing cadence, and CTA structures actively avoid duplicating typical structures.

THEME DESIGN SYSTEM:
- Choose the theme mode determined in the Creative Direction Brief: "${creativeDirection.visualIdentity.themeMode}".
- Derive all palette colors (background, surface, primary, accent, text, muted, outline) directly from the visualIdentity and brand personality intents.
- Generative Design DNA: You MUST generate a "designDNA" object under "theme". This DNA system drives the adaptive visual rendering and mutation rules:
  "designDNA": {
    "spacingPersonality": Choose from ["compressed", "balanced", "airy", "luxury-editorial", "brutalist-dense"],
    "compositionAggression": Number (0 to 100 representing layout mutation/offset levels),
    "hierarchyIntensity": Number (0 to 100 representing font size scales & weight variance),
    "motionEnergy": Number (0 to 100 representing stagger/speed timings),
    "visualDensity": Number (0 to 100 representing complexity/content density),
    "asymmetryLevel": Number (0 to 100 representing vertical alignment shifts and margins offsets),
    "atmosphereIntensity": Number (0 to 100 representing ambient radial glow levels & noise opacity),
    "typographyDominance": Choose from ["restrained", "balanced", "dominant-serif", "brutalist-impact", "cinematic-oversized", "layered-typography-walls", "vertical-accents"],
    "imageWeight": Number (0 to 100 representing image coverage vs text layout),
    "luxuryScore": Number (0 to 100 representing rounded smooth cards, high-end serif styling),
    "cinematicScore": Number (0 to 100 representing dark themes, immersive split and bleed panels),
    "brutalismScore": Number (0 to 100 representing blocky outlines, sharp text, raw structural elements),
    "editorialScore": Number (0 to 100 representing warm neutral tones, spacious asymmetric structures),
    "softnessScore": Number (0 to 100 representing rounded curves, fluid overlays, low-contrast shadows),
    "visualAtmosphere": Choose from ["industrial-grit", "luxury-glow", "soft-editorial-warmth", "cinematic-darkness", "energetic-neon", "architectural-minimalism"]
  }

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

Return only valid JSON matching the WebsiteSchema TypeScript interface. Make sure the returned theme contains the "designDNA" object exactly as described.`;
      const callGeminiText = async (promptText, stageLabel) => {
        let stageRawText = "";
        let stageLastError = null;
        for (const model of modelsToTry) {
          try {
            const restUrl = process.env.GEMINI_REST_URL || "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";
            const key = getLatestApiKeyFromDisk() || process.env.GEMINI_API_KEY || process.env.GENAI_KEY || GENAI_KEY2;
            if (!key) {
              throw new Error("Gemini API key is not configured.");
            }
            const modelRestUrl = restUrl.includes("{model}") ? restUrl.replace("{model}", model.name) : restUrl;
            console.error(
              `[Gemini] Attempting ${stageLabel} direct REST call to ${modelRestUrl}...`
            );
            const url = `${modelRestUrl}${modelRestUrl.includes("?") ? "&" : "?"}key=${key}`;
            await throttleGemini();
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
                (_, reject) => setTimeout(
                  () => reject(
                    new Error(`REST timeout after ${model.timeoutMs}ms`)
                  ),
                  model.timeoutMs
                )
              )
            ]);
            if (!fetchResponse.ok) {
              throw new Error(
                `REST failed (${fetchResponse.status}): ${await fetchResponse.text()}`
              );
            }
            const data = await fetchResponse.json();
            stageRawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (stageRawText) {
              console.error(
                `[Gemini] ${model.name} ${stageLabel} success! Response length: ${stageRawText.length}`
              );
              return stageRawText;
            }
            console.error(
              `[Gemini] ${model.name} returned empty ${stageLabel} text.`
            );
          } catch (error) {
            stageLastError = error;
            console.error(
              `[Gemini] ${model.name} ${stageLabel} failed:`,
              error instanceof Error ? error.message : error
            );
            fs3.writeSync(
              2,
              `[Gemini] ${stageLabel.toUpperCase()} ERROR DETAIL: ${JSON.stringify(error)}
`
            );
          }
        }
        throw stageLastError || new Error(`All Gemini ${stageLabel} attempts failed`);
      };
      console.error(
        `[Gemini] Starting generation for ${business.name} with model ${modelsToTry[0].name}`
      );
      fs3.writeSync(
        2,
        `
--- GEMINI PROMPT START ---
${prompt}
--- GEMINI PROMPT END ---
`
      );
      persistGenerationDebugFile(
        debugSession,
        "02-generation-prompt.md",
        prompt
      );
      const rawText = await callGeminiText(prompt, "schema");
      fs3.writeSync(
        2,
        `
--- GEMINI RESPONSE START ---
${rawText}
--- GEMINI RESPONSE END ---
`
      );
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
          "[Generate] Gemini output could not be parsed as WebsiteSchema."
        );
        debugSession.fallbackReason = "parse-failure";
        appendGenerationDebugError(
          debugSession,
          "fallback_triggered: parse failure"
        );
        throw new Error("AI_GENERATION_FAILED");
      }
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

MODERN UI & STYLING CONSTRAINTS (Apply via inline styles):
- SPACING: Stop using hard pixel values for padding. Use fluid clamp spacing: padding: clamp(4rem, 8vw, 8rem) 5%;
- BORDERS & SURFACES: For cards (bento grids, features, testimonials), use modern soft UI. Apply: background: #ffffff; border: 1px solid rgba(0,0,0,0.05); border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.03);
- TYPOGRAPHY HIERARCHY: Make h1 massive and tight: font-size: clamp(3.5rem, 8vw, 6rem); line-height: 1.05; tracking: -0.02em; Make paragraph text readable: font-size: 1.125rem; line-height: 1.6; color: rgba(0,0,0,0.7);
- IMAGES: Never use raw sharp corners. All images must have border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); unless they are explicitly arched.
- BENTO GRID REFINEMENT: Ensure gap spacing is modern. display: grid; gap: 24px;.`;
        persistGenerationDebugFile(
          debugSession,
          "05a-wordpress-html-prompt.md",
          wordpressHtmlPrompt
        );
        const rawWordPressHtml = await callGeminiText(
          wordpressHtmlPrompt,
          "wordpress-html"
        );
        fs3.writeSync(
          2,
          `
--- GEMINI WORDPRESS HTML START ---
${rawWordPressHtml}
--- GEMINI WORDPRESS HTML END ---
`
        );
        persistGenerationDebugFile(
          debugSession,
          "05b-wordpress-html-raw.txt",
          rawWordPressHtml
        );
        const extractedWordPressHtml = extractHtmlDocument(rawWordPressHtml) || rawWordPressHtml.trim();
        if (extractedWordPressHtml) {
          parsedSchema._wordpressHtml = extractedWordPressHtml;
          parsedSchema._renderSource = "gemini-html";
          persistGenerationDebugFile(
            debugSession,
            "05c-wordpress-html-final.html",
            extractedWordPressHtml
          );
        } else {
          throw new Error("Extracted HTML was empty");
        }
      } catch (wordpressHtmlError) {
        try {
          logStderr(
            `[Generate] AI WordPress HTML failed. Falling back to local builder traceId=${debugSession.traceId}. Error: ${wordpressHtmlError instanceof Error ? wordpressHtmlError.message : String(wordpressHtmlError)}`
          );
          const premiumHtml = buildPremiumPageContent(parsedSchema);
          if (premiumHtml) {
            parsedSchema._wordpressHtml = premiumHtml;
            parsedSchema._renderSource = "component-composition-engine";
            persistGenerationDebugFile(
              debugSession,
              "05c-wordpress-html-final.html",
              premiumHtml
            );
          }
        } catch (fallbackError) {
          parsedSchema._renderSource = "local-builder";
          appendGenerationDebugError(
            debugSession,
            `wordpress_html_generation_failed: ${wordpressHtmlError instanceof Error ? wordpressHtmlError.message : String(wordpressHtmlError)}`
          );
        }
      }
      return parsedSchema;
    };
    let finalSchema;
    let validation = { isValid: true, repairs: [], errors: [] };
    const modelsToTry = [
      { name: "gemini-flash-latest", timeoutMs: 45e3 },
      { name: "gemini-flash-latest", timeoutMs: 45e3 }
    ];
    try {
      const { generateWebsiteContent: generateWebsiteContent2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
      const generatedSchema = await generateWebsiteContent2(business, {
        fallback: restFallback,
        debugSession,
        logStderr: (msg) => logStderr(msg),
        persistGenerationDebugFile: (session, name, content) => persistGenerationDebugFile(session, name, content),
        appendGenerationDebugError: (session, err) => appendGenerationDebugError(session, err),
        throttleGemini: () => throttleGemini(),
        parseWebsiteSchemaOutput: (rawText, b, session) => parseWebsiteSchemaOutput(rawText, b, session)
      });
      const { validateWebsiteSchema: validateWebsiteSchema2 } = await Promise.resolve().then(() => (init_website_schema_validator(), website_schema_validator_exports));
      const normalizedSchema = ensureSchemaMetadata(
        generatedSchema,
        business,
        debugSession.traceId
      );
      validation = validateWebsiteSchema2(normalizedSchema);
      if (!validation.isValid && !validation.repairedSchema) {
        appendGenerationDebugError(
          debugSession,
          `validation_failed: ${validation.errors?.join(" | ") || "unknown"}`
        );
        return res.status(422).json({
          error: "Website creation failed: AI output validation failed."
        });
      }
      finalSchema = validation.repairedSchema || normalizedSchema;
    } catch (error) {
      if (error instanceof Error && (error.message === "AI_GENERATION_FAILED" || error.message === "AI_CRITICAL_FAILURE")) {
        logStderr(`[Generate] AI Generation pipeline failed completely.`);
        return res.status(422).json({
          error: "AI Content Generation Service Currently Unavailable."
        });
      }
      throw error;
    }
    finalSchema = ensureSchemaMetadata(
      finalSchema,
      business,
      debugSession.traceId
    );
    if (finalSchema._wordpressHtml) {
      persistGenerationDebugFile(
        debugSession,
        "05c-wordpress-html-final.html",
        finalSchema._wordpressHtml
      );
    }
    persistGenerationDebugFile(
      debugSession,
      "05-normalized-schema.json",
      finalSchema
    );
    debugSession.sectionTypes = finalSchema.sections.map(
      (section) => section.type
    );
    logStderr(
      `[Generate] complete traceId=${debugSession.traceId} sections=${debugSession.sectionTypes.length} renderSource=${finalSchema._renderSource || "unknown"} wpHtml=${finalSchema._wordpressHtml ? `yes(${finalSchema._wordpressHtml.length})` : "no"}`
    );
    res.setHeader("x-debug-generation-fallback", "false");
    return res.json(finalSchema);
  } catch (error) {
    const debugSession = req.body && req.body.name ? Array.from(generationDebugSessions.values()).find(
      (session) => session.businessName === req.body.name
    ) : void 0;
    if (debugSession) {
      appendGenerationDebugError(
        debugSession,
        `route_error: ${error instanceof Error ? error.message : String(error)}`
      );
      res.setHeader("x-debug-generation-id", debugSession.traceId);
      res.setHeader("x-debug-generation-fallback", "false");
    }
    console.warn("/api/generate failed:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Website creation failed."
    });
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
app.post("/api/generate-v2", async (req, res) => {
  try {
    const business = req.body;
    if (!business || !business.name) {
      return res.status(400).json({ error: "Missing business payload" });
    }
    const debugSession = createGenerationDebugSession(business);
    logStderr(
      `[GenerateV2] start traceId=${debugSession.traceId} business=${business.name}`
    );
    res.setHeader("x-debug-generation-id", debugSession.traceId);
    res.setHeader("x-debug-generation-fallback", "false");
    if (WEBSITE_GENERATION_MODE === "template") {
      logStderr(`[GenerateV2] Template mode enabled - skipping generation`);
      return res.status(422).json({
        error: "Website creation failed: template mode is enabled."
      });
    }
    if (!GENAI_KEY2 && !process.env.GEMINI_REST_URL) {
      logStderr(`[GenerateV2] Missing Gemini API configuration`);
      return res.status(422).json({
        error: "Website creation failed: AI configuration missing."
      });
    }
    const schema = await generateHomepageViaDirectVertexPrompt(business, {
      debugLog: (msg) => logStderr(msg),
      debugSession,
      persistFile: (filename, content) => {
        persistGenerationDebugFile(debugSession, filename, content);
      },
      throttleGemini: () => throttleGemini()
    });
    logStderr(
      `[GenerateV2] complete traceId=${debugSession.traceId} renderSource=direct-vertex-prompt`
    );
    return res.json(schema);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logStderr(`[GenerateV2] Error: ${errorMsg}`);
    return res.status(500).json({
      error: `Website generation failed: ${errorMsg}`
    });
  }
});
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
      const renderSource = websiteSchema._renderSource || "unknown";
      const wpHtml = websiteSchema._wordpressHtml;
      logStderr(
        `[Provisioning] queue request projectId=${projectId} business=${business.name} traceId=${websiteSchema.meta?.traceId || "n/a"} renderSource=${renderSource} wpHtml=${wpHtml ? `yes(${wpHtml.length})` : "no"}`
      );
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
          [JSON.stringify(websiteSchema), targetStatus, traceId, projectId]
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
    const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscout.online";
    const liveUrl = rows[0].subdomain_url || (rows[0].subdomain ? `http://${rows[0].subdomain}.${rootDomain}` : null);
    const adminUrl = rows[0].wp_admin_url || (rows[0].subdomain ? `http://${rows[0].subdomain}.${rootDomain}/wp-admin` : null);
    const effectiveStatus = rows[0].status === "completed" || liveUrl || adminUrl ? "completed" : rows[0].status;
    let rawPassword = null;
    if (effectiveStatus === "completed" && rows[0].wp_admin_pass_encrypted) {
      try {
        const [ivHex, encryptedHex] = rows[0].wp_admin_pass_encrypted.split(":");
        const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
        const decipher = crypto2.createDecipheriv(
          "aes-256-cbc",
          Buffer.from(key),
          Buffer.from(ivHex, "hex")
        );
        let decrypted = decipher.update(Buffer.from(encryptedHex, "hex"));
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        rawPassword = decrypted.toString();
      } catch (e) {
        console.error("Decryption failed:", e);
      }
    }
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
    const inputPath = path3.join(
      DEBUG_ROOT_DIR2,
      traceId,
      "06-renderer-input.json"
    );
    if (!fs3.existsSync(inputPath)) {
      return res.status(404).json({ error: "Trace not found or missing renderer input" });
    }
    const schemaContent = fs3.readFileSync(inputPath, "utf-8");
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
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to replay trace"
    });
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
          const decipher = crypto2.createDecipheriv(
            "aes-256-cbc",
            Buffer.from(key),
            Buffer.from(ivHex, "hex")
          );
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
app.get(
  "/api/business-ai-chat/:leadId",
  async (req, res) => {
    try {
      const { leadId } = req.params;
      if (!leadId) {
        return res.status(400).json({ error: "Missing leadId" });
      }
      const [messages] = await pool.query(
        "SELECT role, content, created_at FROM lead_ai_messages WHERE lead_id = ? ORDER BY id ASC",
        [leadId]
      );
      return res.json({ messages: messages || [] });
    } catch (error) {
      console.error("[AI Chat] Failed to fetch chat history:", error);
      return res.status(500).json({ error: "Failed to fetch chat history" });
    }
  }
);
app.post("/api/business-ai-chat", async (req, res) => {
  try {
    const { leadId, businessContext, messages, conversationId } = req.body;
    if (!leadId || !businessContext || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Missing required fields: leadId, businessContext, messages"
      });
    }
    const latestMessage = messages[messages.length - 1];
    let chatContents = [];
    try {
      if (latestMessage && latestMessage.role === "user") {
        await pool.query(
          "INSERT INTO lead_ai_messages (lead_id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
          [leadId, conversationId || leadId, "user", latestMessage.content]
        );
      }
      const [dbHistory] = await pool.query(
        "SELECT role, content FROM lead_ai_messages WHERE lead_id = ? ORDER BY id ASC",
        [leadId]
      );
      chatContents = dbHistory.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));
    } catch (dbError) {
      console.warn(
        "[AI Chat] Database offline. Using stateless array fallback:",
        dbError
      );
      chatContents = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));
    }
    if (chatContents.length === 0) {
      chatContents.push({
        role: "user",
        parts: [{ text: latestMessage?.content || "Hello" }]
      });
    }
    const restUrl = process.env.GEMINI_REST_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
    const key = getLatestApiKeyFromDisk() || process.env.GEMINI_API_KEY || process.env.GENAI_KEY || GENAI_KEY2;
    if (!key) {
      return res.status(500).json({
        error: "Gemini API key is not configured on the server. Please check your .env.production."
      });
    }
    const businessName = businessContext.name || "Local Business";
    const businessCategory = businessContext.category || "Local Service";
    const businessAddress = businessContext.address || "N/A";
    const rating = businessContext.rating || "N/A";
    const reviewCount = businessContext.reviewCount || 0;
    const reviewsText = Array.isArray(businessContext.reviews) && businessContext.reviews.length ? businessContext.reviews.map(
      (r, i) => `${i + 1}. [Rating: ${r.rating || "N/A"}] "${r.text || r.comment || ""}"`
    ).join("\n") : "No reviews or rating insights available.";
    let websiteText = "";
    if (businessContext.websiteSchema) {
      const ws = businessContext.websiteSchema;
      websiteText = `
Generated Website Details:
- Theme: ${ws.theme?.name || "N/A"} (Style: ${ws.theme?.style || "N/A"})
- Palette Background: ${ws.theme?.palette?.background || "N/A"}, Primary: ${ws.theme?.palette?.primary || "N/A"}, Accent: ${ws.theme?.palette?.accent || "N/A"}
- Typography: Heading: ${ws.theme?.typography?.heading || "N/A"}, Body: ${ws.theme?.typography?.body || "N/A"}
- SEO Title: ${ws.seo?.title || "N/A"}
- SEO Description: ${ws.seo?.description || "N/A"}
- Sections Configured: ${Array.isArray(ws.sections) ? ws.sections.map((s) => `${s.type} (${s.layout || "default"})`).join(", ") : "None"}
`;
    }
    const systemPrompt = `You are an elite, production-grade AI Business Intelligence Assistant, local market analyst, SEO consultant, and branding strategist.
You are deeply grounded in the following business context for ${businessName}:
- Name: ${businessName}
- Category: ${businessCategory}
- Address: ${businessAddress}
- Rating: ${rating} (${reviewCount} reviews)

Reviews & Sentiment:
${reviewsText}
${websiteText}

Rules for your responses:
1. Act as a high-value growth strategist and consultant, NOT a generic chatbot. Provide action items, local SEO opportunities, conversion enhancements, and competitor analysis.
2. Utilize native Google Search grounding to query real-world competitors, neighboring prices, local SEO rankings, and local citations for this exact neighborhood and business type.
3. Be highly structured and readable. Format your answers in professional Markdown with bullet points, bold opportunities, and clean comparison tables. Keep paragraphs strategic and concise.`;
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    let fullResponseText = "";
    let fallbackUsed = false;
    const genAI = await getSDKGenAI();
    if (genAI) {
      try {
        console.log(
          "[AI Chat] Attempting SDK generation with gemini-3.1-pro-preview..."
        );
        await throttleGemini();
        const result = await genAI.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: chatContents,
          config: {
            systemInstruction: systemPrompt,
            tools: [{ googleSearch: {} }]
          }
        });
        fullResponseText = result.text || "";
      } catch (sdkError) {
        console.warn(
          "[AI Chat] SDK generation failed, falling back to REST:",
          sdkError
        );
        fallbackUsed = true;
      }
    } else {
      console.log("[AI Chat] SDK not available, falling back to REST");
      fallbackUsed = true;
    }
    if (fallbackUsed || !fullResponseText) {
      console.log(
        "[AI Chat] Attempting REST generation with gemini-flash-latest..."
      );
      const modelRestUrl = restUrl.includes("{model}") ? restUrl.replace("{model}", "gemini-flash-latest") : restUrl;
      const url = `${modelRestUrl}${modelRestUrl.includes("?") ? "&" : "?"}key=${key}`;
      const requestBody = {
        contents: chatContents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        tools: [{ googleSearch: {} }]
      };
      await throttleGemini();
      const fetchResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text().catch(() => "");
        throw new Error(
          `Gemini REST API returned status ${fetchResponse.status}: ${errorText}`
        );
      }
      const responseJson = await fetchResponse.json();
      fullResponseText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    res.write(fullResponseText);
    if (fullResponseText.trim()) {
      try {
        await pool.query(
          "INSERT INTO lead_ai_messages (lead_id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
          [leadId, conversationId || leadId, "model", fullResponseText]
        );
      } catch (dbError) {
        console.warn(
          "[AI Chat] Failed to save AI response text to database:",
          dbError
        );
      }
    }
    res.end();
  } catch (error) {
    console.error("[AI Chat] Error during chat session:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Chat session generation failed"
      });
    } else {
      const errMessage = error instanceof Error ? error.message : String(error);
      res.write(
        `

*Error: Connection to Gemini failed. Details: ${errMessage}*`
      );
      res.end();
    }
  }
});
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
          const req = https.get(
            {
              hostname: host,
              port: 443,
              path: "/",
              timeout: 5e3,
              rejectUnauthorized: true
              // We want to know if the cert is valid
            },
            (res) => {
              resolve(true);
            }
          );
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
      console.log(
        `[Cleanup Worker] Cleaning up expired preview for project ${dep.project_id}`
      );
      try {
        await deleteProvisionedWordPressSite(dep.project_id);
        await pool.query(
          `UPDATE provisioning_jobs SET status = 'cleaned' WHERE project_id = ?`,
          [dep.project_id]
        );
        console.log(
          `[Cleanup Worker] Cleanup successful for project ${dep.project_id}`
        );
      } catch (error) {
        console.error(
          `[Cleanup Worker] Failed to clean up ${dep.project_id}:`,
          error
        );
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
