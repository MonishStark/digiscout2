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
	const theme = schema.theme || {};
	const radius = theme.radius || "24px";
	const typography = theme.typography || { heading: "Playfair Display", body: "Inter" };

	// ── Global reset + fonts ──
	const globalCss = `<!-- wp:html -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;700;900&family=Space+Grotesk:wght@300;500;700&family=Cormorant+Garamond:wght@400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box!important;}
html,body{background:${BG}!important;color:${TEXT}!important;font-family:'${typography.body}',sans-serif!important;margin:0!important;padding:0!important;scroll-behavior:smooth!important;-webkit-font-smoothing:antialiased;}
.site-header,.site-footer,.elementor-location-header,.elementor-location-footer,#masthead,#colophon,.entry-title,.wp-block-post-title,.page-title,.breadcrumbs,.posted-on,.byline,header.entry-header{display:none!important;}
.site-content,.hentry,.entry-content,.wp-block-post-content,.wp-site-blocks,.is-layout-flow,.elementor,.page,.single{padding:0!important;margin:0!important;max-width:100%!important;width:100%!important;background:${BG}!important;}
.glass{background:rgba(255,255,255,0.03)!important;backdrop-filter:blur(12px)!important;border:1px solid rgba(255,255,255,0.08)!important;}
.text-gradient{background:linear-gradient(135deg,${P},#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.hover-lift{transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s ease!important;}
.hover-lift:hover{transform:translateY(-8px)!important;box-shadow:0 30px 60px rgba(0,0,0,0.2)!important;}
.wp-block-button__link,.wp-element-button{
  background:${P}!important;color:#fff!important;border:none!important;
  border-radius:${theme.buttonStyle === 'sharp' ? '4px' : '50px'}!important;
  padding:16px 44px!important;font-weight:700!important;cursor:pointer!important;
  text-decoration:none!important;display:inline-block!important;
  transition:transform .2s ease,box-shadow .2s ease!important;}
.wp-block-button__link:hover{transform:scale(1.05)!important;color:#fff!important;}
</style>
<!-- /wp:html -->\n\n`;

	let html = globalCss;

	// Iterate through sections in the EXACT order Gemini provided
	const sections = schema.sections || [];
	sections.forEach((section: any, index: number) => {
		const isEven = index % 2 === 0;
		const sectionBg = isEven ? BG : SURF;

		switch (section.type) {
			case "hero":
				html += renderHero(section, schema, P, TEXT, MUTED, typography);
				break;
			case "features":
			case "services":
				html += renderFeatures(section, schema, P, TEXT, MUTED, sectionBg, typography, radius);
				break;
			case "gallery":
				html += renderGallery(section, schema, TEXT, sectionBg, typography);
				break;
			case "testimonials":
				html += renderTestimonials(section, schema, P, TEXT, MUTED, sectionBg, typography);
				break;
			case "cta":
				html += renderCTA(section, schema, P, TEXT, typography);
				break;
			case "contact":
				html += renderContact(section, schema, P, TEXT, MUTED, sectionBg, typography);
				break;
		}
	});

	// Footer
	html += `<!-- wp:html -->
<footer style="background:#000;padding:60px 40px;text-align:center;border-top:1px solid rgba(255,255,255,.06);">
  <p style="color:rgba(255,255,255,.35);font-size:.85rem;margin:0;">&copy; ${new Date().getFullYear()} ${esc(businessName)}. All rights reserved.</p>
</footer>
<!-- /wp:html -->`;

	return html;
}

function renderHero(section: any, schema: any, P: string, TEXT: string, MUTED: string, typography: any) {
	const businessName = schema.brand?.businessName || "";
	const img = section.media?.src || section.media?.url || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80";
	const title = section.headline || businessName;
	const sub = section.subheadline || "";
	const cta = section.ctaPrimary?.label || "Get Started";
	const variant = section.variant || "split"; // split, immersive, centered

	if (variant === "centered" || variant === "immersive") {
		return `<!-- wp:cover {"url":"${esc(img)}","dimRatio":${variant === 'immersive' ? 60 : 40},"overlayColor":"black","minHeight":100,"minHeightUnit":"vh","align":"full"} -->
<div class="wp-block-cover alignfull" style="min-height:100vh;position:relative;overflow:hidden;">
<span aria-hidden="true" class="wp-block-cover__background has-black-background-color has-background-dim-${variant === 'immersive' ? 60 : 40} has-background-dim" style="background:linear-gradient(180deg,rgba(0,0,0,0.4) 0%,rgba(${hexToRgb(P)},0.2) 100%)!important;"></span>
<img class="wp-block-cover__image-background" alt="${esc(businessName)}" src="${esc(img)}" data-object-fit="cover" style="object-fit:cover;width:100%;height:100%;position:absolute;inset:0;"/>
<div class="wp-block-cover__inner-container" style="position:relative;z-index:2;padding:160px 24px;text-align:center;max-width:900px;margin:0 auto;">
<h1 style="font-family:'${typography.heading}',serif;font-size:clamp(3rem,8vw,6rem);line-height:1;font-weight:900;color:#fff;letter-spacing:-0.03em;margin-bottom:1.5rem;text-shadow:0 10px 40px rgba(0,0,0,0.3);">${esc(title)}</h1>
<p style="font-size:clamp(1.1rem,2vw,1.4rem);color:rgba(255,255,255,0.9);max-width:600px;margin:0 auto 2.5rem;line-height:1.6;">${esc(sub)}</p>
<div class="wp-block-buttons" style="justify-content:center;display:flex;"><div class="wp-block-button"><a class="wp-block-button__link wp-element-button">${esc(cta)}</a></div></div>
</div></div><!-- /wp:cover -->\n\n`;
	}

	// Default: Split
	return `<!-- wp:html -->
<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));min-height:100vh;background:${schema.theme?.palette?.background || '#fff'};">
  <div style="padding:120px 60px;display:flex;flex-direction:column;justify-content:center;max-width:700px;">
    <h1 style="font-family:'${typography.heading}',serif;font-size:clamp(2.5rem,5vw,4.5rem);line-height:1.1;font-weight:900;color:${TEXT};letter-spacing:-0.03em;margin-bottom:1.5rem;">${esc(title)}</h1>
    <p style="font-size:1.2rem;color:${MUTED};margin-bottom:2.5rem;line-height:1.7;">${esc(sub)}</p>
    <div style="display:flex;gap:16px;"><a class="wp-block-button__link wp-element-button">${esc(cta)}</a></div>
  </div>
  <div style="position:relative;min-height:400px;overflow:hidden;">
    <img src="${esc(img)}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" alt="${esc(businessName)}"/>
    <div style="position:absolute;inset:0;background:linear-gradient(to right,${schema.theme?.palette?.background || '#fff'},transparent);"></div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderFeatures(section: any, schema: any, P: string, TEXT: string, MUTED: string, Bg: string, typography: any, radius: string) {
	const items = section.items || [];
	const layout = section.layout || "cards"; // cards, list, grid
	
	const cards = items.map((item: any, i: number) => `
<div class="glass hover-lift" style="border-radius:${radius};padding:48px 36px;">
  <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,${P}20,${P}10);color:${P};display:flex;align-items:center;justify-content:center;margin-bottom:2rem;font-size:1.8rem;box-shadow:0 8px 16px rgba(0,0,0,0.1);">✦</div>
  <h3 style="font-family:'${typography.heading}',serif;font-size:1.5rem;font-weight:700;color:${TEXT};margin:0 0 1.2rem;letter-spacing:-0.02em;">${esc(item.title || item.name)}</h3>
  <p style="color:${MUTED};line-height:1.8;font-size:1.05rem;margin:0;opacity:0.85;">${esc(item.description || item.body)}</p>
</div>`).join("\n");

	return `<!-- wp:html -->
<section style="background:${Bg};padding:120px 40px;">
  <div style="max-width:1200px;margin:0 auto;">
    <div style="margin-bottom:60px;">
      <h2 style="font-family:'${typography.heading}',serif;font-size:clamp(2rem,4vw,3.5rem);font-weight:900;color:${TEXT};line-height:1.1;letter-spacing:-0.02em;">${esc(section.headline || section.title || "Our Services")}</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:32px;">
      ${cards}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderGallery(section: any, schema: any, TEXT: string, Bg: string, typography: any) {
	const items = section.items || [];
	const figures = items.slice(0,6).map((item: any) => `
<div style="overflow:hidden;border-radius:12px;aspect-ratio:1;position:relative;">
  <img src="${esc(item.src || item.url)}" style="width:100%;height:100%;object-fit:cover;" alt="Gallery"/>
</div>`).join("\n");

	return `<!-- wp:html -->
<section style="background:${Bg};padding:120px 40px;">
  <div style="max-width:1200px;margin:0 auto;">
    <h2 style="font-family:'${typography.heading}',serif;font-size:clamp(2rem,4vw,3.5rem);font-weight:900;color:${TEXT};margin-bottom:60px;text-align:center;">${esc(section.headline || "The Experience")}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;">
      ${figures}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderTestimonials(section: any, schema: any, P: string, TEXT: string, MUTED: string, Bg: string, typography: any) {
	const items = section.items || [];
	const cards = items.map((item: any) => `
<div style="padding:40px;background:rgba(255,255,255,0.03);border-radius:24px;border:1px solid rgba(0,0,0,0.05);">
  <p style="font-size:1.1rem;font-style:italic;color:${TEXT};line-height:1.7;margin-bottom:20px;">"${esc(item.quote)}"</p>
  <div style="display:flex;align-items:center;gap:12px;">
    <div style="font-weight:700;color:${P};">${esc(item.author)}</div>
    <div style="color:${MUTED};font-size:0.9rem;">${esc(item.role || "")}</div>
  </div>
</div>`).join("\n");

	return `<!-- wp:html -->
<section style="background:${Bg};padding:120px 40px;">
  <div style="max-width:1200px;margin:0 auto;">
    <h2 style="font-family:'${typography.heading}',serif;font-size:2.5rem;font-weight:900;color:${TEXT};margin-bottom:60px;text-align:center;">Client Stories</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;">
      ${cards}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderCTA(section: any, schema: any, P: string, TEXT: string, typography: any) {
	return `<!-- wp:html -->
<section style="background:${P};padding:100px 40px;text-align:center;">
  <div style="max-width:800px;margin:0 auto;">
    <h2 style="font-family:'${typography.heading}',serif;font-size:3rem;font-weight:900;color:#fff;margin-bottom:24px;">${esc(section.title || section.headline || "Let's Get Started")}</h2>
    <p style="font-size:1.2rem;color:rgba(255,255,255,0.9);margin-bottom:40px;">${esc(section.body || "")}</p>
    <a class="wp-block-button__link" style="background:#fff!important;color:${P}!important;">${esc(section.buttonLabel || "Contact Us")}</a>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderContact(section: any, schema: any, P: string, TEXT: string, MUTED: string, Bg: string, typography: any) {
	const brand = schema.brand || {};
	return `<!-- wp:html -->
<section id="contact" style="background:${Bg};padding:120px 40px;">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:60px;">
    <div>
      <h2 style="font-family:'${typography.heading}',serif;font-size:3rem;font-weight:900;color:${TEXT};margin-bottom:24px;">Get in Touch</h2>
      <p style="color:${MUTED};font-size:1.1rem;margin-bottom:40px;">Have questions? We're here to help.</p>
    </div>
    <div style="display:grid;gap:32px;">
      ${brand.phone ? `<div><h4 style="color:${P};font-weight:700;margin-bottom:8px;">Call Us</h4><p style="font-size:1.2rem;color:${TEXT}">${esc(brand.phone)}</p></div>` : ""}
      ${brand.email ? `<div><h4 style="color:${P};font-weight:700;margin-bottom:8px;">Email</h4><p style="font-size:1.2rem;color:${TEXT}">${esc(brand.email)}</p></div>` : ""}
      ${brand.address ? `<div><h4 style="color:${P};font-weight:700;margin-bottom:8px;">Visit</h4><p style="font-size:1.2rem;color:${TEXT}">${esc(brand.address)}</p></div>` : ""}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function hexToRgb(hex: string): string {
	const clean = hex.replace("#", "");
	const r = parseInt(clean.slice(0, 2), 16);
	const g = parseInt(clean.slice(2, 4), 16);
	const b = parseInt(clean.slice(4, 6), 16);
	return `${r},${g},${b}`;
}


