/**
 * premium-site-builder.ts
 *
 * Builds flashy, modern WordPress page content using 100% inline styles.
 * Inline styles cannot be overridden by any theme (Hello Elementor, Astra, etc.)
 * resulting in pixel-perfect premium output every time.
 */

export function esc(str: string) {
	return (str || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function buildPremiumPageContent(schema: any): string {
	const palette = schema.theme?.palette || {
		background: "#07070a",
		surface: "#0f0f13",
		primary: "#7c3aed",
		text: "#f4f4f5",
		muted: "#a1a1aa",
	};

	const P = palette.primary;
	const BG = palette.background;
	const SURF = palette.surface;
	const TEXT = palette.text;
	const MUTED = palette.muted || "#a1a1aa";

	const businessName = schema.brand?.businessName || "Welcome";
	const sections = schema.sections || [];
	const hero = sections.find((s: any) => s.type === "hero") || sections[0] || {};
	const feats = sections.find((s: any) => s.type === "features" || s.type === "services");
	const gallery = sections.find((s: any) => s.type === "gallery");
	const testimonials = sections.find((s: any) => s.type === "testimonials");
	const cta = sections.find((s: any) => s.type === "cta");

	const heroImg = hero?.media?.src || hero?.media?.url
		|| "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80";
	const heroTitle = hero?.headline || businessName;
	const heroSub = hero?.subheadline || `${businessName} — modern, professional & ready to impress.`;
	const ctaLabel = hero?.primaryCta?.label || hero?.ctaPrimary?.label || "Get Started";
	const email = schema.brand?.email || "";
	const phone = schema.brand?.phone || "";
	const address = schema.brand?.address || "";

	// ── Global reset + fonts injected via wp:html (scoped, can't be blocked) ──
	const globalCss = `<!-- wp:html -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;700;900&display=swap');
*,*::before,*::after{box-sizing:border-box!important;}
html,body{background:${BG}!important;color:${TEXT}!important;font-family:'Inter',sans-serif!important;margin:0!important;padding:0!important;scroll-behavior:smooth!important;}
/* Hide Hello Elementor/theme chrome completely */
.site-header,.site-footer,.elementor-location-header,.elementor-location-footer,
#masthead,#colophon,.entry-title,.wp-block-post-title,
.page-title,.breadcrumbs,.posted-on,.byline,header.entry-header{display:none!important;}
/* Strip all WP/theme content wrappers */
.site-content,.hentry,.entry-content,.wp-block-post-content,
.wp-site-blocks,.is-layout-flow,.elementor,.page,.single{
  padding:0!important;margin:0!important;max-width:100%!important;width:100%!important;background:${BG}!important;}
/* Hero cover override */
.wp-block-cover.ds-hero{position:relative!important;overflow:hidden!important;}
.wp-block-cover.ds-hero h1{
  font-family:'Playfair Display',serif!important;
  font-size:clamp(2.8rem,6vw,5.5rem)!important;
  line-height:1.08!important;font-weight:900!important;
  color:#fff!important;letter-spacing:-0.03em!important;
  text-shadow:0 4px 40px rgba(0,0,0,0.5)!important;
  margin-bottom:1.5rem!important;}
.wp-block-cover.ds-hero .wp-block-paragraph{
  font-size:clamp(1rem,1.8vw,1.35rem)!important;
  color:rgba(255,255,255,.88)!important;
  max-width:620px!important;margin:0 auto 2.5rem!important;line-height:1.7!important;}
.wp-block-button__link,.wp-element-button{
  background:${P}!important;color:#fff!important;border:none!important;
  border-radius:50px!important;padding:16px 44px!important;font-weight:700!important;
  font-size:1.05rem!important;letter-spacing:.02em!important;cursor:pointer!important;
  text-decoration:none!important;display:inline-block!important;
  box-shadow:0 8px 32px rgba(0,0,0,.3)!important;
  transition:transform .2s ease,box-shadow .2s ease!important;}
.wp-block-button__link:hover{transform:scale(1.05)!important;color:#fff!important;
  box-shadow:0 12px 48px rgba(0,0,0,.4)!important;}
</style>
<!-- /wp:html -->

`;

	// ── HERO: native wp:cover ──────────────────────────────────────────────
	const heroBlock = `<!-- wp:cover {"url":"${esc(heroImg)}","dimRatio":60,"overlayColor":"black","minHeight":100,"minHeightUnit":"vh","align":"full","className":"ds-hero"} -->
<div class="wp-block-cover alignfull ds-hero" style="min-height:100vh;position:relative;overflow:hidden;">
<span aria-hidden="true" class="wp-block-cover__background has-black-background-color has-background-dim-60 has-background-dim" style="background:linear-gradient(160deg,rgba(0,0,0,.7) 0%,rgba(${hexToRgb(P)},.35) 100%)!important;"></span>
<img class="wp-block-cover__image-background" alt="${esc(businessName)}" src="${esc(heroImg)}" data-object-fit="cover" style="object-fit:cover;width:100%;height:100%;position:absolute;inset:0;"/>
<div class="wp-block-cover__inner-container" style="position:relative;z-index:2;padding:160px 24px 120px;text-align:center;max-width:900px;margin:0 auto;">
<!-- wp:heading {"textAlign":"center","level":1} -->
<h1 class="wp-block-heading has-text-align-center">${esc(heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textAlign":"center"} -->
<p class="wp-block-paragraph has-text-align-center">${esc(heroSub)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"40px"}}}} -->
<div class="wp-block-buttons" style="margin-top:40px;"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">${esc(ctaLabel)}</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->
</div></div>
<!-- /wp:cover -->

`;

	// ── FEATURES: fully inline-styled ─────────────────────────────────────
	let featBlock = "";
	if (feats?.items?.length) {
		const items: any[] = feats.items.slice(0, 6);
		const icons = ["✦", "◈", "⬡", "◉", "⬢", "✧"];
		const cards = items.map((item: any, i: number) => `
<div style="background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:36px 28px;transition:transform .3s,box-shadow .3s;position:relative;overflow:hidden;" onmouseover="this.style.transform='translateY(-8px)';this.style.boxShadow='0 30px 70px rgba(0,0,0,.4)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
  <div style="font-size:2rem;margin-bottom:1rem;color:${P};">${icons[i % icons.length]}</div>
  <h3 style="font-size:1.2rem;font-weight:700;color:${TEXT};margin:0 0 .75rem;letter-spacing:-.01em;">${esc(item.title || item.name || "")}</h3>
  <p style="color:${MUTED};line-height:1.75;font-size:.95rem;margin:0;">${esc(item.description || item.body || "")}</p>
</div>`).join("\n");

		featBlock = `<!-- wp:html -->
<section id="services" style="background:${SURF};padding:100px 40px;width:100%;box-sizing:border-box;">
  <div style="max-width:1100px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:60px;">
      <span style="display:inline-block;background:linear-gradient(135deg,${P},#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:.85rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;margin-bottom:1rem;">${esc(feats.tagline || "What We Offer")}</span>
      <h2 style="font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3.2rem);font-weight:900;color:${TEXT};margin:0 auto;letter-spacing:-.03em;line-height:1.1;">${esc(feats.headline || feats.title || "Our Services")}</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
      ${cards}
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
	}

	// ── GALLERY ───────────────────────────────────────────────────────────
	let galleryBlock = "";
	if (gallery?.items?.length) {
		const imgs: any[] = gallery.items.slice(0, 6);
		const figures = imgs.map((item: any) => `
<figure style="margin:0;overflow:hidden;border-radius:16px;aspect-ratio:4/3;position:relative;" onmouseover="this.querySelector('img').style.transform='scale(1.08)'" onmouseout="this.querySelector('img').style.transform='scale(1)'">
  <img src="${esc(item.src || item.url || "")}" alt="${esc(item.alt || businessName)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform .5s ease;display:block;"/>
</figure>`).join("\n");

		galleryBlock = `<!-- wp:html -->
<section id="gallery" style="background:${BG};padding:100px 40px;width:100%;box-sizing:border-box;">
  <div style="max-width:1100px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:60px;">
      <h2 style="font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3.2rem);font-weight:900;color:${TEXT};margin:0 auto;letter-spacing:-.03em;">${esc(gallery.headline || gallery.title || "Gallery")}</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;">
      ${figures}
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
	}

	// ── TESTIMONIALS ──────────────────────────────────────────────────────
	let testimonialsBlock = "";
	if (testimonials?.items?.length) {
		const items: any[] = testimonials.items.slice(0, 4);
		const cards = items.map((item: any) => `
<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-left:3px solid ${P};border-radius:16px;padding:32px;">
  <div style="font-size:2rem;color:${P};margin-bottom:1rem;line-height:1;">❝</div>
  <p style="font-style:italic;color:${TEXT};line-height:1.75;font-size:1rem;margin:0 0 1.25rem;">${esc(item.quote || "")}</p>
  <div style="display:flex;align-items:center;gap:12px;">
    <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,${P},#a855f7);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:.85rem;">${(item.author || "?")[0].toUpperCase()}</div>
    <div>
      <div style="font-weight:700;color:${TEXT};font-size:.95rem;">${esc(item.author || "")}</div>
      ${item.role ? `<div style="color:${MUTED};font-size:.8rem;">${esc(item.role)}</div>` : ""}
    </div>
  </div>
</div>`).join("\n");

		testimonialsBlock = `<!-- wp:html -->
<section id="reviews" style="background:${SURF};padding:100px 40px;width:100%;box-sizing:border-box;">
  <div style="max-width:1100px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:60px;">
      <h2 style="font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3.2rem);font-weight:900;color:${TEXT};margin:0 auto;letter-spacing:-.03em;">${esc(testimonials.headline || "What Our Clients Say")}</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
      ${cards}
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
	}

	// ── CTA BANNER ────────────────────────────────────────────────────────
	let ctaBlock = "";
	if (cta) {
		const ctaTitle = cta.headline || cta.title || `Ready to experience ${businessName}?`;
		const ctaBody = cta.body || "";
		const ctaBtnLabel = cta.buttonLabel || cta.primaryCta?.label || "Book Now";
		const ctaBtnHref = cta.buttonHref || cta.primaryCta?.href || "#contact";

		ctaBlock = `<!-- wp:html -->
<section style="background:linear-gradient(135deg,${P} 0%,#1e1b4b 100%);padding:120px 40px;text-align:center;width:100%;box-sizing:border-box;position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;background:url('data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;60&quot; height=&quot;60&quot;><circle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;1&quot; fill=&quot;rgba(255,255,255,0.15)&quot;/></svg>') repeat;pointer-events:none;"></div>
  <div style="position:relative;z-index:1;max-width:700px;margin:0 auto;">
    <h2 style="font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3rem);font-weight:900;color:#fff;margin:0 0 1.5rem;letter-spacing:-.03em;">${esc(ctaTitle)}</h2>
    ${ctaBody ? `<p style="color:rgba(255,255,255,.85);font-size:1.15rem;margin:0 0 2.5rem;line-height:1.7;">${esc(ctaBody)}</p>` : ""}
    <a href="${esc(ctaBtnHref)}" style="background:#fff;color:${P};padding:18px 48px;border-radius:50px;font-weight:800;text-decoration:none;display:inline-block;font-size:1.05rem;letter-spacing:.02em;box-shadow:0 8px 40px rgba(0,0,0,.3);transition:transform .2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform=''">${esc(ctaBtnLabel)}</a>
  </div>
</section>
<!-- /wp:html -->

`;
	}

	// ── CONTACT ───────────────────────────────────────────────────────────
	let contactBlock = "";
	const contactItems: string[] = [];
	if (address) contactItems.push(`<div style="text-align:center;"><div style="font-size:2rem;margin-bottom:.75rem;">📍</div><h3 style="font-weight:700;color:${TEXT};margin:0 0 .5rem;font-size:1rem;">Address</h3><p style="color:${MUTED};line-height:1.6;margin:0;font-size:.95rem;">${esc(address)}</p></div>`);
	if (phone) contactItems.push(`<div style="text-align:center;"><div style="font-size:2rem;margin-bottom:.75rem;">📞</div><h3 style="font-weight:700;color:${TEXT};margin:0 0 .5rem;font-size:1rem;">Phone</h3><a href="tel:${esc(phone)}" style="color:${P};text-decoration:none;font-size:.95rem;">${esc(phone)}</a></div>`);
	if (email) contactItems.push(`<div style="text-align:center;"><div style="font-size:2rem;margin-bottom:.75rem;">✉️</div><h3 style="font-weight:700;color:${TEXT};margin:0 0 .5rem;font-size:1rem;">Email</h3><a href="mailto:${esc(email)}" style="color:${P};text-decoration:none;font-size:.95rem;">${esc(email)}</a></div>`);

	if (contactItems.length) {
		contactBlock = `<!-- wp:html -->
<section id="contact" style="background:${BG};padding:100px 40px;width:100%;box-sizing:border-box;">
  <div style="max-width:900px;margin:0 auto;">
    <h2 style="font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3rem);font-weight:900;color:${TEXT};text-align:center;margin:0 0 60px;letter-spacing:-.03em;">Get In Touch</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;">
      ${contactItems.join("\n")}
    </div>
  </div>
</section>
<!-- /wp:html -->

`;
	}

	// ── FOOTER ────────────────────────────────────────────────────────────
	const footer = `<!-- wp:html -->
<footer style="background:#000;padding:40px;text-align:center;border-top:1px solid rgba(255,255,255,.06);">
  <p style="color:rgba(255,255,255,.35);font-size:.85rem;margin:0;">&copy; ${new Date().getFullYear()} ${esc(businessName)}. All rights reserved.</p>
</footer>
<!-- /wp:html -->`;

	return globalCss + heroBlock + featBlock + galleryBlock + testimonialsBlock + ctaBlock + contactBlock + footer;
}

/** Convert hex color to "r,g,b" for rgba() usage */
function hexToRgb(hex: string): string {
	const clean = hex.replace("#", "");
	const r = parseInt(clean.slice(0, 2), 16);
	const g = parseInt(clean.slice(2, 4), 16);
	const b = parseInt(clean.slice(4, 6), 16);
	return `${r},${g},${b}`;
}
