/** @format */
function escapeHtml(value) {
    return (value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function slugify(value) {
    return (value || "client-site")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
function renderParagraph(text) {
    return `<!-- wp:paragraph -->\n<p>${escapeHtml(text)}</p>\n<!-- /wp:paragraph -->`;
}
const safeHref = (href) => href && href.trim() ? href.trim() : "#contact";
const safeLabel = (label, fallback = "Learn More") => label && label.trim() ? label.trim() : fallback;
function renderHeading(text, level = 2) {
    return `<!-- wp:heading {"level":${level}} -->\n<h${level}>${escapeHtml(text)}</h${level}>\n<!-- /wp:heading -->`;
}
function renderButton(label, href) {
    return `<!-- wp:buttons -->\n<div class="wp-block-buttons">\n  <!-- wp:button -->\n  <div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${escapeHtml(safeHref(href))}">${escapeHtml(safeLabel(label))}</a></div>\n  <!-- /wp:button -->\n</div>\n<!-- /wp:buttons -->`;
}
function renderList(items) {
    if (!items.length) {
        return "";
    }
    return `<!-- wp:list -->\n<ul>\n${items.map((item) => `  <li>${escapeHtml(item)}</li>`).join("\n")}\n</ul>\n<!-- /wp:list -->`;
}
function renderNavBlocks(schema) {
    const voice = getSiteVoice(schema);
    const links = [
        { title: "Home", href: "/" },
        { title: "About", href: "/about/" },
        { title: voice.featuresTitle, href: "/services/" },
        { title: voice.galleryTitle, href: "/gallery/" },
        { title: voice.faqTitle, href: "/faq/" },
        { title: voice.contactTitle, href: "/contact/" },
    ];
    return `<!-- wp:navigation {"layout":{"type":"flex","justifyContent":"center"}} -->\n<nav class="wp-block-navigation">${links.map((link) => `<a class="wp-block-navigation-item__content" href="${link.href}">${escapeHtml(link.title)}</a>`).join("")}</nav>\n<!-- /wp:navigation -->`;
}
function renderMedia(imageUrl, alt) {
    return `<!-- wp:image {"sizeSlug":"large"} -->\n<figure class="wp-block-image size-large"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(alt)}" /></figure>\n<!-- /wp:image -->`;
}
function getSiteVoice(schema) {
    const category = (schema.brand.category || "").toLowerCase();
    const businessName = schema.brand.businessName || "The Brand";
    if (category.includes("restaurant") ||
        category.includes("cafe") ||
        category.includes("bakery")) {
        return {
            featuresTitle: "Signature Dishes & Experiences",
            galleryTitle: "Dining Room & Detail",
            testimonialsTitle: "Guest Impressions",
            faqTitle: "Dining Questions",
            contactTitle: `Visit ${businessName}`,
            aboutTitle: `The Story Behind ${businessName}`,
            ctaButton: "Reserve Your Table",
        };
    }
    if (category.includes("salon") ||
        category.includes("spa") ||
        category.includes("wellness")) {
        return {
            featuresTitle: "Signature Rituals",
            galleryTitle: "Studio Atmosphere",
            testimonialsTitle: "Client Notes",
            faqTitle: "Treatment Questions",
            contactTitle: `Book ${businessName}`,
            aboutTitle: `About ${businessName}`,
            ctaButton: "Schedule Your Appointment",
        };
    }
    if (category.includes("gym") ||
        category.includes("fitness") ||
        category.includes("training")) {
        return {
            featuresTitle: "Training Programs",
            galleryTitle: "Progress & Environment",
            testimonialsTitle: "Member Wins",
            faqTitle: "Training Questions",
            contactTitle: `Start Training at ${businessName}`,
            aboutTitle: `About ${businessName}`,
            ctaButton: "Start Your Program",
        };
    }
    return {
        featuresTitle: "Capabilities Built For Growth",
        galleryTitle: "Selected Work",
        testimonialsTitle: "Trusted By Real Customers",
        faqTitle: "Questions, Answered Clearly",
        contactTitle: `Let's Build Your Next Version`,
        aboutTitle: `About ${businessName}`,
        ctaButton: "Book A Consultation",
    };
}
function getSection(schema, type) {
    return schema.sections.find((section) => section.type === type);
}
function renderHeroSection(schema) {
    const hero = getSection(schema, "hero") ||
        {
            id: "hero-fallback",
            type: "hero",
            variant: "centered",
            headline: schema.brand.businessName || "Welcome",
            subheadline: `Discover what ${schema.brand.businessName || "your business"} can offer online.`,
            ctaPrimary: { label: "Learn More", href: "#contact" },
        };
    const image = hero.media?.src || "";
    const headline = hero.headline || schema.brand.businessName || "Welcome";
    const subheadline = hero.subheadline &&
        !/premium|designed to convert|first impression|conversion-ready/i.test(hero.subheadline)
        ? hero.subheadline
        : `${schema.brand.businessName} deserves a more distinctive digital presence.`;
    const primaryCta = hero.ctaPrimary || {
        label: "Learn More",
        href: "#contact",
    };
    if (hero.variant === "split-modern-dark") {
        return `<!-- wp:columns {"align":"wide","style":{"color":{"background":"#111111","text":"#ffffff"}}} -->\n<div class="wp-block-columns alignwide has-text-color has-background" style="background-color:#111111;color:#ffffff">\n<!-- wp:column {"verticalAlignment":"center"} -->\n<div class="wp-block-column is-vertically-aligned-center">\n  ${renderHeading(headline, 1)}\n  ${renderParagraph(subheadline)}\n  ${renderButton(primaryCta.label, primaryCta.href)}\n</div>\n<!-- /wp:column -->\n<!-- wp:column {"verticalAlignment":"center"} -->\n<div class="wp-block-column is-vertically-aligned-center">\n  ${image ? renderMedia(image, hero.media?.alt || schema.brand.businessName) : ""}\n</div>\n<!-- /wp:column -->\n</div>\n<!-- /wp:columns -->`;
    }
    if (hero.variant === "centered-glass") {
        return `<!-- wp:cover {"url":"${escapeHtml(image)}","dimRatio":50,"overlayColor":"black","align":"full"} -->\n<div class="wp-block-cover alignfull"><span aria-hidden="true" class="wp-block-cover__background has-black-background-color has-background-dim"></span><img class="wp-block-cover__image-background" src="${escapeHtml(image)}" data-object-fit="cover"/>\n  <div class="wp-block-cover__inner-container" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 40px; border-radius: 12px;">\n  ${renderHeading(headline, 1)}\n  ${renderParagraph(subheadline)}\n  ${renderButton(primaryCta.label, primaryCta.href)}\n  </div>\n</div>\n<!-- /wp:cover -->`;
    }
    return `<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group">\n  ${renderHeading(headline, 1)}\n  ${renderParagraph(subheadline)}\n  ${renderButton(primaryCta.label, primaryCta.href)}\n  ${image ? renderMedia(image, hero.media?.alt || schema.brand.businessName) : ""}\n</div>\n<!-- /wp:group -->`;
}
function renderFeaturesSection(schema) {
    const features = getSection(schema, "features");
    if (!features ||
        !Array.isArray(features.items) ||
        features.items.length === 0)
        return "";
    const voice = getSiteVoice(schema);
    if (features.variant === "masonry-grid") {
        return `<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group">\n  ${renderHeading(voice.featuresTitle, 2)}\n  <!-- wp:columns {"align":"wide"} -->\n<div class="wp-block-columns alignwide">\n${features.items
            .map((item) => `<!-- wp:column -->\n<div class="wp-block-column" style="padding: 24px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 24px;">\n${renderHeading(item.title, 3)}\n${renderParagraph(item.description)}\n</div>\n<!-- /wp:column -->`)
            .join("\n")}\n</div>\n<!-- /wp:columns -->\n</div>\n<!-- /wp:group -->`;
    }
    return `<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group">\n  ${renderHeading(voice.featuresTitle, 2)}\n  ${renderList(features.items.map((item) => `${item.title}: ${item.description}`))}\n</div>\n<!-- /wp:group -->`;
}
function renderGallerySection(schema) {
    const gallery = getSection(schema, "gallery");
    if (!gallery || !Array.isArray(gallery.items) || gallery.items.length === 0)
        return "";
    const voice = getSiteVoice(schema);
    return `<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group">\n  ${renderHeading(voice.galleryTitle, 2)}\n  <!-- wp:gallery {"linkTo":"none"} -->\n<figure class="wp-block-gallery has-nested-images columns-3 is-cropped">\n${gallery.items
        .map((item) => `  <figure class="wp-block-image size-large"><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" /></figure>`)
        .join("\n")}\n</figure>\n<!-- /wp:gallery -->\n</div>\n<!-- /wp:group -->`;
}
function renderTestimonialsSection(schema) {
    const testimonials = getSection(schema, "testimonials");
    if (!testimonials ||
        !Array.isArray(testimonials.items) ||
        testimonials.items.length === 0)
        return "";
    const voice = getSiteVoice(schema);
    return `<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group">\n  ${renderHeading(voice.testimonialsTitle, 2)}\n  ${testimonials.items
        .map((item) => `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><p>${escapeHtml(item.quote)}</p><cite>${escapeHtml(item.author)}${item.role ? `, ${escapeHtml(item.role)}` : ""}</cite></blockquote>\n<!-- /wp:quote -->`)
        .join("\n")}\n</div>\n<!-- /wp:group -->`;
}
function renderFaqSection(schema) {
    const faq = getSection(schema, "faq");
    if (!faq || !Array.isArray(faq.items) || faq.items.length === 0)
        return "";
    const voice = getSiteVoice(schema);
    return `<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group">\n  ${renderHeading(voice.faqTitle, 2)}\n  ${faq.items
        .map((item) => `<!-- wp:details -->\n<details class="wp-block-details"><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>\n<!-- /wp:details -->`)
        .join("\n")}\n</div>\n<!-- /wp:group -->`;
}
function renderContactSection(schema) {
    const voice = getSiteVoice(schema);
    return `<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group" id="contact">\n  ${renderHeading(voice.contactTitle, 2)}\n  ${renderParagraph(schema.brand.address || "")}\n  ${schema.brand.phone ? renderParagraph(`Phone: ${schema.brand.phone}`) : ""}\n  ${schema.brand.email ? renderParagraph(`Email: ${schema.brand.email}`) : ""}\n  ${schema.brand.email ? renderButton(voice.ctaButton, `mailto:${schema.brand.email}`) : ""}\n</div>\n<!-- /wp:group -->`;
}
function renderCtaSection(schema) {
    const cta = getSection(schema, "cta");
    if (!cta)
        return "";
    return `<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group">\n  ${renderHeading(cta.title, 2)}\n  ${renderParagraph(cta.body)}\n  ${renderButton(cta.buttonLabel, cta.buttonHref)}\n</div>\n<!-- /wp:group -->`;
}
function wrapHtmlBlock(content) {
    return `<!-- wp:html -->\n${content}\n<!-- /wp:html -->`;
}
function getSectionLayout(section) {
    return (section.layout || section.variant || "standard").toLowerCase();
}
function getSectionTitle(section, fallback) {
    return section?.headline || section?.title || fallback;
}
function renderStructuredHeroSection(schema) {
    const hero = getSection(schema, "hero");
    if (!hero)
        return "";
    const layout = getSectionLayout(hero);
    const title = getSectionTitle(hero, schema.brand.businessName || "Welcome");
    const subheadline = hero.subheadline ||
        `${schema.brand.businessName || "This business"} deserves a more distinctive digital presence.`;
    const primaryCta = hero.primaryCta ||
        hero.ctaPrimary || { label: "Learn More", href: "#contact" };
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
    if (!features ||
        !Array.isArray(features.items) ||
        features.items.length === 0) {
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
		${items
            .map((item, index) => `
		<article class="wp-feature wp-feature--row">
			<span class="wp-feature__index">${String(index + 1).padStart(2, "0")}</span>
			<div>
				<h3>${escapeHtml(item.title)}</h3>
				<p>${escapeHtml(item.description)}</p>
			</div>
		</article>`)
            .join("")}
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
		${items
            .map((item, index) => `
		<article class="wp-feature wp-feature--${index % 2 === 0 ? "tall" : "wide"}">
			<span class="wp-feature__index">${String(index + 1).padStart(2, "0")}</span>
			<h3>${escapeHtml(item.title)}</h3>
			<p>${escapeHtml(item.description)}</p>
		</article>`)
            .join("")}
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
		${items
        .map((item, index) => `
		<article class="wp-feature wp-feature--card wp-feature--${index === 0 ? "lead" : "support"}">
			<span class="wp-feature__index">${String(index + 1).padStart(2, "0")}</span>
			<h3>${escapeHtml(item.title)}</h3>
			<p>${escapeHtml(item.description)}</p>
		</article>`)
        .join("")}
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
		${gallery.items
            .map((item, index) => `
		<figure class="wp-gallery__item wp-gallery__item--${(index % 3) + 1}">
			<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" />
		</figure>`)
            .join("")}
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
		${gallery.items
            .map((item, index) => `
		<figure class="wp-gallery__panel wp-gallery__panel--${index === 0 ? "hero" : index % 2 === 0 ? "stack" : "rail"}">
			<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" />
		</figure>`)
            .join("")}
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
		${gallery.items
        .map((item) => `
		<figure class="wp-gallery__item">
			<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" />
		</figure>`)
        .join("")}
	</div>
</section>`);
}
function renderStructuredTestimonialsSection(schema) {
    const testimonials = getSection(schema, "testimonials");
    if (!testimonials ||
        !Array.isArray(testimonials.items) ||
        testimonials.items.length === 0) {
        return "";
    }
    const layout = getSectionLayout(testimonials);
    const title = getSectionTitle(testimonials, getSiteVoice(schema).testimonialsTitle);
    if (layout === "timeline") {
        return wrapHtmlBlock(`
<section class="wp-section wp-testimonials wp-testimonials--timeline" id="testimonials" data-layout="timeline">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Testimonials</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-testimonials__timeline">
		${testimonials.items
            .map((item, index) => `
		<article class="wp-testimonial wp-testimonial--timeline">
			<span class="wp-testimonial__index">${String(index + 1).padStart(2, "0")}</span>
			<blockquote><p>${escapeHtml(item.quote)}</p></blockquote>
			<footer><strong>${escapeHtml(item.author)}</strong>${item.role ? `<span>${escapeHtml(item.role)}</span>` : ""}</footer>
		</article>`)
            .join("")}
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
		${testimonials.items
        .map((item) => `
		<article class="wp-testimonial wp-testimonial--card">
			<blockquote><p>${escapeHtml(item.quote)}</p></blockquote>
			<footer><strong>${escapeHtml(item.author)}</strong>${item.role ? `<span>${escapeHtml(item.role)}</span>` : ""}</footer>
		</article>`)
        .join("")}
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
		${faq.items
        .map((item) => `
		<details class="wp-faq__item">
			<summary>${escapeHtml(item.question)}</summary>
			<p>${escapeHtml(item.answer)}</p>
		</details>`)
        .join("")}
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
    if (!cta)
        return "";
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
        ...(Array.isArray(schema.sections) ? schema.sections : []).map((section) => renderStructuredSection(schema, section)),
    ]
        .filter(Boolean)
        .join("\n\n");
}
function buildAboutPageBlocks(schema) {
    const hero = getSection(schema, "hero");
    const voice = getSiteVoice(schema);
    const intro = hero?.subheadline ||
        schema.seo.description ||
        `${schema.brand.businessName} is a modern ${schema.brand.category} brand.`;
    const highlights = [
        `Category: ${schema.brand.category}`,
        `Style Direction: ${schema.theme.name}`,
        `Experience Focus: ${schema.theme.style}`,
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
        renderStructuredTestimonialsSection(schema),
    ]
        .filter(Boolean)
        .join("\n\n");
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
        renderStructuredCtaSection(schema),
    ]
        .filter(Boolean)
        .join("\n\n");
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
        renderStructuredGallerySection(schema),
    ]
        .filter(Boolean)
        .join("\n\n");
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
        renderStructuredFaqSection(schema),
    ]
        .filter(Boolean)
        .join("\n\n");
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
        renderStructuredContactSection(schema),
    ]
        .filter(Boolean)
        .join("\n\n");
}
export function schemaToGutenbergBlocks(schema) {
    if (!schema) {
        return "";
    }
    return buildHomePageBlocks(schema);
}
export function collectWordPressMediaAssets(schema) {
    const assets = [];
    for (const section of schema.sections) {
        if (section.type === "hero" && section.media?.src) {
            assets.push({
                sourceUrl: section.media.src,
                alt: section.media.alt || schema.brand.businessName,
                preferredFilename: `${schema.meta.slug}-hero`,
            });
        }
        if (section.type === "gallery" && Array.isArray(section.items)) {
            for (const [index, item] of section.items.entries()) {
                assets.push({
                    sourceUrl: item.src,
                    alt: item.alt || `${schema.brand.businessName} gallery ${index + 1}`,
                    preferredFilename: `${schema.meta.slug}-gallery-${index + 1}`,
                });
            }
        }
    }
    const unique = new Map();
    for (const asset of assets) {
        if (asset.sourceUrl) {
            unique.set(asset.sourceUrl, asset);
        }
    }
    return Array.from(unique.values());
}
export function buildWordPressSitePages(schema) {
    const pages = [
        {
            title: schema.brand.businessName || "Home",
            slug: "home",
            content: buildHomePageBlocks(schema),
            isHomepage: true,
        },
        {
            title: "About",
            slug: "about",
            content: buildAboutPageBlocks(schema),
        },
        {
            title: "Services",
            slug: "services",
            content: buildServicesPageBlocks(schema),
        },
        {
            title: "Gallery",
            slug: "gallery",
            content: buildGalleryPageBlocks(schema),
        },
        {
            title: "FAQ",
            slug: "faq",
            content: buildFaqPageBlocks(schema),
        },
        {
            title: "Contact",
            slug: "contact",
            content: buildContactPageBlocks(schema),
        },
    ];
    return pages;
}
export function buildWordPressProvisioningPlan(schema, business, options) {
    const siteSlug = slugify(schema.meta?.slug || business.name || "client-site");
    const emailSlug = slugify(business.name || schema.brand.businessName || "client");
    const ownerEmail = options?.ownerEmail || business.email || `${emailSlug}@example-client.test`;
    const ownerUsername = options?.ownerUsername || slugify(`${emailSlug}-${schema.meta.businessId}`);
    return {
        siteTitle: schema.brand.businessName ||
            business.name ||
            schema.seo.title ||
            "Client Site",
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
            name: schema.theme.name,
        },
    };
}
