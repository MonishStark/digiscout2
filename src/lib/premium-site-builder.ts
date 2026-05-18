/**
 * premium-site-builder.ts
 *
 * Generates the actual WordPress homepage content. This is the output that
 * matters in production, so variants here are intentionally broader than the
 * preview renderer and map directly to the schema Gemini produces.
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

function normalizeVariant(section: any, fallback: string) {
	return (
		section?.variant ||
		section?.layout ||
		section?.styleVariant ||
		fallback
	)
		.toString()
		.toLowerCase();
}

function buttonHtml(
	label: string,
	href: string,
	style = "",
) {
	return `<a class="wp-block-button__link wp-element-button" href="${esc(
		href || "#contact",
	)}" style="${style}">${esc(label)}</a>`;
}

function mediaSrc(section: any, fallback: string) {
	return (
		section?.media?.[0]?.url ||
		section?.media?.src ||
		section?.media?.url ||
		fallback
	);
}

export function buildPremiumPageContent(schema: any): string {
	const palette = schema.theme?.palette || {
		background: "#f8fafc",
		surface: "#ffffff",
		primary: "#7c3aed",
		accent: "#ec4899",
		text: "#111827",
		muted: "#6b7280",
		outline: "#e2e8f0",
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
		body: "Inter",
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
[data-reveal]{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease}
[data-reveal].is-visible{opacity:1;transform:translateY(0)}
@keyframes fadeInUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@media (max-width: 920px){
	.section-padding{padding:88px 24px}
	.two-col,.split-grid,.contact-grid,.cta-split,.feature-bento,.gallery-editorial,.gallery-stack,.testimonial-featured,.faq-split{grid-template-columns:1fr!important}
}
@media (prefers-reduced-motion: reduce){
	[data-reveal]{opacity:1;transform:none;transition:none}
}
${theme.customCss || ""}
${sections.map((section: any) => section.customCss || "").join("\n")}
</style>
<!-- /wp:html -->\n\n`;

	const revealScript = `<!-- wp:html -->
<script>
(() => {
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const targets = document.querySelectorAll(
		'.section-padding .section-shell, .section-padding .glass, .section-padding .hover-lift, .section-padding img, .section-padding .section-title, .section-padding .section-copy, .section-padding .eyebrow'
	);
	targets.forEach((el, index) => {
		el.setAttribute('data-reveal', '');
		if (reduce) {
			el.classList.add('is-visible');
			return;
		}
		el.style.transitionDelay = String((index % 6) * 80) + 'ms';
	});
	if (reduce || !('IntersectionObserver' in window)) {
		targets.forEach((el) => el.classList.add('is-visible'));
		return;
	}
	const observer = new IntersectionObserver(
		(entries, obs) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					obs.unobserve(entry.target);
				}
			});
		},
		{ threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
	);
	targets.forEach((el) => observer.observe(el));
})();
</script>
<!-- /wp:html -->\n\n`;

	let html = globalCss + revealScript;
	sections.forEach((section: any, index: number) => {
		const sectionBg = index % 2 === 0 ? BG : SURF;
		switch (section.type) {
			case "hero":
				html += renderHero(
					section,
					{ businessName, category, typography, P, TEXT, MUTED, BG, SURF, ACCENT, OUTLINE },
				);
				break;
			case "features":
			case "services":
				html += renderFeatures(
					section,
					{ typography, P, TEXT, MUTED, SURF, OUTLINE, radius, sectionBg },
				);
				break;
			case "gallery":
				html += renderGallery(
					section,
					{ typography, TEXT, MUTED, sectionBg, radius },
				);
				break;
			case "testimonials":
				html += renderTestimonials(
					section,
					{ typography, P, TEXT, MUTED, sectionBg, SURF, OUTLINE, radius },
				);
				break;
			case "faq":
				html += renderFaq(
					section,
					{ typography, P, TEXT, MUTED, sectionBg, SURF, OUTLINE, radius },
				);
				break;
			case "cta":
				html += renderCta(
					section,
					{ typography, P, TEXT, ACCENT, radius },
				);
				break;
			case "contact":
				html += renderContact(
					section,
					{ typography, P, TEXT, MUTED, sectionBg, SURF, OUTLINE, radius, brand: schema.brand || {} },
				);
				break;
		}
	});

	html += `<!-- wp:html -->
<footer style="background:#050816;padding:92px 40px;text-align:center;">
  <div class="section-shell">
    <div class="eyebrow" style="background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14);color:#fff">Digital Presence</div>
    <h2 style="font-family:'${typography.heading}',serif;color:#fff;font-size:2.2rem;letter-spacing:-.04em;margin:22px 0 12px;">${esc(
		businessName,
	)}</h2>
    <p style="color:rgba(255,255,255,.48);font-size:.92rem;margin:0;">Crafted for premium presentation and clear conversion.</p>
  </div>
</footer>
<!-- /wp:html -->`;

	return html;
}

function renderHero(section: any, context: any) {
	const { businessName, category, typography, P, TEXT, MUTED, BG, SURF, ACCENT, OUTLINE } =
		context;
	const img = mediaSrc(
		section,
		"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
	);
	const title = getSectionValue(section, ["headline", "title"], businessName);
	const sub = getSectionValue(
		section,
		["subheadline", "body", "description"],
		"",
	);
	const ctaPrimary = section.ctaPrimary || section.primaryCta || {
		label: "Discover More",
		href: "#contact",
	};
	const ctaSecondary = section.ctaSecondary || section.secondaryCta || null;
	const variant = normalizeVariant(section, "split");

	if (variant === "immersive" || variant === "cinematic") {
		return `<!-- wp:cover {"url":"${esc(
			img,
		)}","dimRatio":56,"minHeight":100,"minHeightUnit":"vh","align":"full"} -->
<div class="wp-block-cover alignfull" style="min-height:100vh;position:relative;overflow:hidden;">
<span aria-hidden="true" class="wp-block-cover__background has-background-dim" style="background:linear-gradient(180deg,rgba(7,10,23,.14),rgba(7,10,23,.68))"></span>
<img class="wp-block-cover__image-background" alt="${esc(
		businessName,
	)}" src="${esc(img)}" data-object-fit="cover" />
<div class="wp-block-cover__inner-container">
  <div class="section-shell animate-up" style="min-height:100vh;display:grid;align-items:end;padding:48px 24px 72px;">
    <div style="max-width:780px;">
      <div class="eyebrow" style="background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);color:#fff">${esc(
				category,
			)}</div>
      <h1 style="font-family:'${typography.heading}',serif;font-size:clamp(3.8rem,11vw,8rem);line-height:.88;letter-spacing:-.06em;color:#fff;margin:26px 0 18px;">${esc(
				title,
			)}</h1>
      <p style="font-size:clamp(1.16rem,2.6vw,1.5rem);line-height:1.6;color:rgba(255,255,255,.84);max-width:620px;margin:0 0 34px;">${esc(
				sub,
			)}</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        ${buttonHtml(ctaPrimary.label || "Discover More", ctaPrimary.href || "#contact")}
        ${
					ctaSecondary
						? buttonHtml(
								ctaSecondary.label || "Explore",
								ctaSecondary.href || "#services",
								"background:rgba(255,255,255,.14)!important;color:#fff!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:none!important",
						  )
						: ""
				}
      </div>
    </div>
  </div>
</div>
</div>
<!-- /wp:cover -->\n\n`;
	}

	if (variant === "editorial" || variant === "editorial-split" || variant === "magazine") {
		return `<!-- wp:html -->
<section class="section-padding" style="background:${BG};overflow:hidden;">
  <div class="section-shell split-grid" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(420px,.92fr);gap:44px;align-items:center;">
    <div class="animate-up">
      <div class="eyebrow">${esc(category)}</div>
      <h1 style="font-family:'${typography.heading}',serif;font-size:clamp(3rem,7vw,5.7rem);line-height:.92;letter-spacing:-.05em;color:${TEXT};margin:24px 0 18px;">${esc(
				title,
			)}</h1>
      <p style="max-width:520px;font-size:1.14rem;line-height:1.78;color:${MUTED};margin:0 0 34px;">${esc(
				sub,
			)}</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        ${buttonHtml(ctaPrimary.label || "Discover More", ctaPrimary.href || "#contact")}
        ${
					ctaSecondary
						? buttonHtml(
								ctaSecondary.label || "Explore",
								ctaSecondary.href || "#services",
								"background:transparent!important;color:" +
									TEXT +
									"!important;border:1px solid " +
									OUTLINE +
									"!important;box-shadow:none!important",
						  )
						: ""
				}
      </div>
    </div>
    <div class="animate-scale" style="position:relative;">
      <div class="shape-orb" style="width:220px;height:220px;right:-32px;top:-28px;background:rgba(${hexToRgb(
				ACCENT,
			)},.12)"></div>
      <img src="${esc(img)}" alt="${esc(
				businessName,
			)}" style="width:100%;aspect-ratio:4/4.5;object-fit:cover;border-radius:34px;box-shadow:0 24px 70px rgba(15,23,42,.12);" />
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
	}

	if (variant === "centered" || variant === "minimal") {
		return `<!-- wp:html -->
<section class="section-padding" style="background:${BG};">
  <div class="section-shell animate-up" style="max-width:1080px;text-align:center;">
    <div class="eyebrow">${esc(category)}</div>
    <h1 style="font-family:'${typography.heading}',serif;font-size:clamp(3rem,8vw,6.4rem);line-height:.9;letter-spacing:-.06em;color:${TEXT};margin:24px auto 18px;max-width:860px;">${esc(
				title,
			)}</h1>
    <p style="font-size:1.15rem;line-height:1.78;color:${MUTED};max-width:680px;margin:0 auto 34px;">${esc(
				sub,
			)}</p>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:42px;">
      ${buttonHtml(ctaPrimary.label || "Discover More", ctaPrimary.href || "#contact")}
      ${
				ctaSecondary
					? buttonHtml(
							ctaSecondary.label || "Explore",
							ctaSecondary.href || "#services",
							"background:transparent!important;color:" +
								TEXT +
								"!important;border:1px solid " +
								OUTLINE +
								"!important;box-shadow:none!important",
					  )
					: ""
			}
    </div>
    <img src="${esc(img)}" alt="${esc(
				businessName,
			)}" style="width:100%;max-width:1080px;aspect-ratio:16/9;object-fit:cover;border-radius:38px;box-shadow:0 24px 70px rgba(15,23,42,.12);" />
  </div>
</section>
<!-- /wp:html -->\n\n`;
	}

	return `<!-- wp:html -->
<section class="section-padding" style="background:${BG};overflow:hidden;">
  <div class="section-shell two-col" style="display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:36px;align-items:stretch;">
    <div class="glass animate-up" style="padding:clamp(32px,5vw,64px);border-radius:36px;display:flex;flex-direction:column;justify-content:center;">
      <div class="eyebrow">${esc(category)}</div>
      <h1 style="font-family:'${typography.heading}',serif;font-size:clamp(2.8rem,7vw,5.8rem);line-height:.92;letter-spacing:-.05em;color:${TEXT};margin:24px 0 18px;">${esc(
			title,
		)}</h1>
      <p style="font-size:1.12rem;line-height:1.76;color:${MUTED};margin:0 0 34px;">${esc(
			sub,
		)}</p>
      ${buttonHtml(ctaPrimary.label || "Discover More", ctaPrimary.href || "#contact")}
    </div>
    <div class="animate-scale" style="position:relative;min-height:420px;">
      <img src="${esc(img)}" alt="${esc(
			businessName,
		)}" style="width:100%;height:100%;min-height:420px;object-fit:cover;border-radius:36px;" />
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderFeatures(section: any, context: any) {
	const { typography, P, TEXT, MUTED, SURF, OUTLINE, radius, sectionBg } = context;
	const items = getSectionItems(section);
	const title = getSectionValue(section, ["title", "headline"], "Services");
	const intro = getSectionValue(
		section,
		["subheadline", "description"],
		"",
	);
	const variant = normalizeVariant(section, "bento");

	const wrap = (inner: string) => `<!-- wp:html -->
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
<!-- /wp:html -->\n\n`;

	if (variant === "editorial-list" || variant === "alternating-stack" || variant === "list") {
		return wrap(`<div style="display:grid;gap:18px;">
      ${items
				.map(
					(item: any, index: number) => `<article class="hover-lift" style="display:grid;grid-template-columns:84px minmax(0,1fr);gap:22px;padding:28px 0;border-top:1px solid ${OUTLINE};">
          <div style="font-family:'${typography.heading}',serif;font-size:2rem;color:${P};opacity:.64;">${String(
						index + 1,
					).padStart(2, "0")}</div>
          <div>
            <h3 style="font-family:'${typography.heading}',serif;font-size:2rem;letter-spacing:-.03em;color:${TEXT};margin:0 0 10px;">${esc(
							item.title || item.name,
						)}</h3>
            <p style="color:${MUTED};line-height:1.75;font-size:1.04rem;margin:0;max-width:760px;">${esc(
							item.description || item.body,
						)}</p>
          </div>
        </article>`,
				)
				.join("")}
    </div>`);
	}

	if (variant === "editorial-cards" || variant === "grid") {
		return wrap(`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
      ${items
				.map(
					(item: any, index: number) => `<article class="glass hover-lift" style="padding:34px;border-radius:${radius};">
          <div style="display:inline-flex;width:52px;height:52px;border-radius:16px;align-items:center;justify-content:center;background:rgba(${hexToRgb(
						P,
					)},.12);color:${P};font-weight:800;margin-bottom:18px;">${index + 1}</div>
          <h3 style="font-family:'${typography.heading}',serif;font-size:1.7rem;letter-spacing:-.03em;color:${TEXT};margin:0 0 10px;">${esc(
							item.title || item.name,
						)}</h3>
          <p style="color:${MUTED};line-height:1.72;font-size:1rem;margin:0;">${esc(
							item.description || item.body,
						)}</p>
        </article>`,
				)
				.join("")}
    </div>`);
	}

	return wrap(`<div class="feature-bento" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;">
      ${items
				.map((item: any, index: number) => {
					const span =
						index === 0 ? "span 2" : index % 3 === 0 ? "span 2" : "span 1";
					return `<article class="hover-lift" style="grid-column:${span};background:${SURF};border:1px solid ${OUTLINE};border-radius:${radius};padding:38px;">
            <div style="font-family:'${typography.heading}',serif;font-size:2.4rem;color:${P};opacity:.42;margin-bottom:16px;">${String(
							index + 1,
						).padStart(2, "0")}</div>
            <h3 style="font-family:'${typography.heading}',serif;font-size:2rem;line-height:.98;letter-spacing:-.035em;color:${TEXT};margin:0 0 12px;">${esc(
							item.title || item.name,
						)}</h3>
            <p style="color:${MUTED};line-height:1.72;font-size:1.03rem;margin:0;">${esc(
							item.description || item.body,
						)}</p>
          </article>`;
				})
				.join("")}
    </div>`);
}

function renderGallery(section: any, context: any) {
	const { typography, TEXT, MUTED, sectionBg, radius } = context;
	const items = getSectionItems(section).slice(0, 5);
	const title = getSectionValue(section, ["title", "headline"], "Inside The Experience");
	const intro = getSectionValue(
		section,
		["subheadline", "description"],
		"A visual sense of the work, atmosphere, and detail behind the brand.",
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
					items[0]?.src || items[0]?.url || "",
				)}" alt="${esc(items[0]?.alt || title)}" style="width:100%;aspect-ratio:4/5;object-fit:cover;" /></figure>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;">
          ${items
						.slice(1, 3)
						.map(
							(item: any) => `<figure class="hover-lift" style="margin:0;overflow:hidden;border-radius:${radius};"><img src="${esc(
								item?.src || item?.url || "",
							)}" alt="${esc(item?.alt || title)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;" /></figure>`,
						)
						.join("")}
        </div>
      </div>
      <div style="display:grid;gap:20px;">
        ${items
					.slice(3, 5)
					.map(
						(item: any) => `<figure class="hover-lift" style="margin:0;overflow:hidden;border-radius:${radius};"><img src="${esc(
							item?.src || item?.url || "",
						)}" alt="${esc(item?.alt || title)}" style="width:100%;aspect-ratio:${
							item === items[3] ? "3/4" : "1/1"
						};object-fit:cover;" /></figure>`,
					)
					.join("")}
      </div>
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
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
      ${items
				.map(
					(item: any, index: number) => `<figure class="hover-lift" style="margin:0;overflow:hidden;border-radius:${radius};grid-column:${
						index === 0 ? "span 2" : "span 1"
					};">
          <img src="${esc(item?.src || item?.url || "")}" alt="${esc(
						item?.alt || title,
					)}" style="width:100%;aspect-ratio:${
						index === 0 ? "16/10" : index % 2 === 0 ? "4/5" : "1/1"
					};object-fit:cover;" />
        </figure>`,
				)
				.join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderTestimonials(section: any, context: any) {
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
        <div style="font-family:'${typography.heading}',serif;font-size:5rem;color:${P};opacity:.16;line-height:.7;">“</div>
        <p style="font-size:1.36rem;line-height:1.72;color:${TEXT};margin:-14px 0 22px;">${esc(
					lead?.quote || "",
				)}</p>
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:50px;height:50px;border-radius:999px;background:${P};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;">${esc(
					(lead?.author || "A").charAt(0),
				)}</div>
          <div><div style="font-weight:700;color:${TEXT};">${esc(
					lead?.author || "Client",
				)}</div><div style="font-size:.82rem;color:${MUTED};text-transform:uppercase;letter-spacing:.16em;">${esc(
					lead?.role || "Verified Client",
				)}</div></div>
        </div>
      </article>
      <div style="display:grid;gap:20px;">
        ${supporting
					.map(
						(item: any) => `<article class="glass hover-lift" style="padding:28px;border-radius:${radius};">
            <p style="font-size:1.02rem;line-height:1.72;color:${TEXT};margin:0 0 14px;">${esc(
							item?.quote || "",
						)}</p>
            <div style="font-weight:700;color:${TEXT};">${esc(
							item?.author || "Client",
						)}</div>
            <div style="font-size:.78rem;color:${P};text-transform:uppercase;letter-spacing:.16em;">${esc(
							item?.role || "Verified Client",
						)}</div>
          </article>`,
					)
					.join("")}
      </div>
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
	}

	return `<!-- wp:html -->
<section class="section-padding" style="background:${sectionBg};">
  <div class="section-shell">
    <div style="margin-bottom:56px;text-align:center;">
      <div class="eyebrow">Testimonials</div>
      <h2 class="section-title">${esc(title)}</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px;">
      ${items
				.map(
					(item: any) => `<article class="glass hover-lift" style="padding:34px;border-radius:${radius};position:relative;">
          <div style="font-family:'${typography.heading}',serif;font-size:4rem;color:${P};opacity:.12;line-height:.7;margin-bottom:10px;">“</div>
          <p style="font-size:1.06rem;line-height:1.74;color:${TEXT};margin:0 0 18px;">${esc(
						item?.quote || "",
					)}</p>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:999px;background:${P};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;">${esc(
						(item?.author || "A").charAt(0),
					)}</div>
            <div>
              <div style="font-weight:700;color:${TEXT};">${esc(item?.author || "Client")}</div>
              <div style="font-size:.78rem;color:${MUTED};text-transform:uppercase;letter-spacing:.16em;">${esc(
						item?.role || "Verified Client",
					)}</div>
            </div>
          </div>
        </article>`,
				)
				.join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderFaq(section: any, context: any) {
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
      ${items
				.map(
					(item: any) => `<article class="hover-lift" style="background:${SURF};border:1px solid ${OUTLINE};border-radius:${radius};padding:28px;">
          <h4 style="font-family:'${typography.heading}',serif;font-size:1.42rem;letter-spacing:-.02em;color:${TEXT};margin:0 0 10px;">${esc(
						item?.question || item?.title || "",
					)}</h4>
          <p style="font-size:1rem;line-height:1.7;color:${MUTED};margin:0;">${esc(
						item?.answer || item?.description || "",
					)}</p>
        </article>`,
				)
				.join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
	}

	return `<!-- wp:html -->
<section class="section-padding" style="background:${sectionBg};">
  <div class="section-shell" style="max-width:1080px;">
    <div style="margin-bottom:44px;text-align:center;">
      <div class="eyebrow">FAQ</div>
      <h2 class="section-title">${esc(title)}</h2>
    </div>
    <div style="display:grid;gap:14px;">
      ${items
				.map(
					(item: any) => `<details class="glass hover-lift" style="padding:24px 28px;border-radius:${radius};">
          <summary style="cursor:pointer;font-weight:700;font-size:1.04rem;color:${TEXT};list-style:none;">${esc(
						item?.question || item?.title || "",
					)}</summary>
          <p style="font-size:1rem;line-height:1.72;color:${MUTED};margin:14px 0 0;">${esc(
						item?.answer || item?.description || "",
					)}</p>
        </details>`,
				)
				.join("")}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderCta(section: any, context: any) {
	const { typography, P, TEXT, ACCENT, radius } = context;
	const title = getSectionValue(section, ["title", "headline"], "Ready To Take The Next Step?");
	const body = getSectionValue(
		section,
		["body", "description", "subheadline"],
		"Reach out and start the conversation.",
	);
	const label = getSectionValue(section, ["buttonLabel"], "Contact Us");
	const href = getSectionValue(section, ["buttonHref"], "#contact");
	const variant = normalizeVariant(section, "gradient-band");

	if (variant === "split-card" || variant === "side-by-side") {
		return `<!-- wp:html -->
<section class="section-padding" style="background:linear-gradient(135deg,rgba(${hexToRgb(
			P,
		)},.14),rgba(${hexToRgb(
			ACCENT,
		)},.18));">
  <div class="section-shell cta-split" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:30px;align-items:center;background:#fff;border:1px solid rgba(${hexToRgb(
			P,
		)},.12);border-radius:${radius};padding:42px;">
    <div>
      <div class="eyebrow">Call To Action</div>
      <h2 class="section-title" style="margin-top:18px;">${esc(title)}</h2>
      <p class="section-copy">${esc(body)}</p>
    </div>
    <div>${buttonHtml(label, href)}</div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
	}

	return `<!-- wp:html -->
<section class="section-padding" style="background:linear-gradient(135deg,${P},${ACCENT});position:relative;overflow:hidden;">
  <div class="shape-orb" style="width:220px;height:220px;top:-60px;right:-40px;background:rgba(255,255,255,.12)"></div>
  <div class="shape-orb" style="width:180px;height:180px;bottom:-40px;left:-50px;background:rgba(255,255,255,.08)"></div>
  <div class="section-shell animate-up" style="text-align:center;position:relative;z-index:2;max-width:900px;">
    <div class="eyebrow" style="background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);color:#fff">Call To Action</div>
    <h2 style="font-family:'${typography.heading}',serif;font-size:clamp(2.8rem,6vw,5rem);line-height:.92;letter-spacing:-.05em;color:#fff;margin:24px 0 16px;">${esc(
			title,
		)}</h2>
    <p style="font-size:1.18rem;line-height:1.72;color:rgba(255,255,255,.86);max-width:640px;margin:0 auto 32px;">${esc(
			body,
		)}</p>
    ${buttonHtml(
			label,
			href,
			`background:#fff!important;color:${P}!important;border-radius:${radius}!important`,
		)}
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderContact(section: any, context: any) {
	const { typography, P, TEXT, MUTED, sectionBg, SURF, OUTLINE, radius, brand } = context;
	const title = getSectionValue(section, ["title", "headline"], "Visit Or Reach Out");
	const body = getSectionValue(
		section,
		["body", "description", "subheadline"],
		"We're ready when you are.",
	);
	const variant = normalizeVariant(section, "split-card");

	const contactFacts = [
		brand.phone
			? `<div><div style="font-size:.74rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${P};margin-bottom:8px;">Phone</div><div style="font-size:1.18rem;color:${TEXT};">${esc(
					brand.phone,
				)}</div></div>`
			: "",
		brand.email &&
		brand.email.includes("@") &&
		!/^none|n\/a$/i.test(brand.email)
			? `<div><div style="font-size:.74rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${P};margin-bottom:8px;">Email</div><div style="font-size:1.18rem;color:${TEXT};">${esc(
					brand.email,
				)}</div></div>`
			: "",
		brand.address
			? `<div><div style="font-size:.74rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${P};margin-bottom:8px;">Address</div><div style="font-size:1.06rem;line-height:1.68;color:${TEXT};">${esc(
					brand.address,
				)}</div></div>`
			: "",
	]
		.filter(Boolean)
		.join("");

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
<!-- /wp:html -->\n\n`;
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
					P,
				)},.06);border:1px solid ${OUTLINE};"></div>
        <div style="height:54px;border-radius:14px;background:rgba(${hexToRgb(
					P,
				)},.06);border:1px solid ${OUTLINE};"></div>
        <div style="height:148px;border-radius:14px;background:rgba(${hexToRgb(
					P,
				)},.06);border:1px solid ${OUTLINE};"></div>
        <div style="margin-top:6px;">${buttonHtml("Send Enquiry", "#")}</div>
      </div>
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}
