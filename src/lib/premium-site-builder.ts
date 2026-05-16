/**
 * premium-site-builder.ts
 *
 * Builds flashy, modern WordPress page content using 100% inline styles.
 * High-fidelity editorial layouts inspired by modern landing pages (Stripe, Linear, Framer).
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
		background: "#f8f9fa",
		surface: "#ffffff",
		primary: "#7c3aed",
		text: "#1a1a1a",
		muted: "#666666",
	};

	const P = palette.primary;
	const BG = palette.background;
	const SURF = palette.surface;
	const TEXT = palette.text;
	const MUTED = palette.muted || "#666666";

	const businessName = schema.brand?.businessName || "Welcome";
	const theme = schema.theme || {};
	const radius = theme.radius || "24px";
	const typography = theme.typography || { heading: "Playfair Display", body: "Inter" };

	const sections = schema.sections || [];

	// ── Global reset + fonts + advanced animations ──
	const globalCss = `<!-- wp:html -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;700;900&family=Space+Grotesk:wght@300;500;700&family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;500;700;900&display=swap');

*,*::before,*::after{box-sizing:border-box!important;}
html,body{background:${BG}!important;color:${TEXT}!important;font-family:'${typography.body}',sans-serif!important;margin:0!important;padding:0!important;scroll-behavior:smooth!important;-webkit-font-smoothing:antialiased;}

/* Hide default WP theme elements */
.site-header,.site-footer,.elementor-location-header,.elementor-location-footer,#masthead,#colophon,.entry-title,.wp-block-post-title,.page-title,.breadcrumbs,.posted-on,.byline,header.entry-header{display:none!important;}
.site-content,.hentry,.entry-content,.wp-block-post-content,.wp-site-blocks,.is-layout-flow,.elementor,.page,.single{padding:0!important;margin:0!important;max-width:100%!important;width:100%!important;background:${BG}!important;}

/* Advanced Premium Styles */
.glass{background:rgba(255,255,255,0.7)!important;backdrop-filter:blur(16px)!important;border:1px solid rgba(255,255,255,0.3)!important;box-shadow:0 10px 30px rgba(0,0,0,0.05)!important;}
.text-gradient{background:linear-gradient(135deg,${P},#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}

/* Animations */
@keyframes fadeInUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
@keyframes scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
@keyframes float { 0%{transform:translateY(0px)} 50%{transform:translateY(-15px)} 100%{transform:translateY(0px)} }

.animate-up { animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
.animate-scale { animation: scaleIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
.floating { animation: float 6s ease-in-out infinite; }

.hover-lift{transition:all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)!important;}
.hover-lift:hover{transform:translateY(-10px) scale(1.02)!important;box-shadow:0 40px 80px rgba(0,0,0,0.12)!important;z-index:10;}

/* Button Overrides */
.wp-block-button__link,.wp-element-button{
  background:${P}!important;color:#fff!important;border:none!important;
  border-radius:${theme.buttonStyle === 'sharp' ? '4px' : '99px'}!important;
  padding:18px 48px!important;font-weight:700!important;cursor:pointer!important;
  text-decoration:none!important;display:inline-flex!important;align-items:center;justify-content:center;
  transition:all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)!important;
  box-shadow: 0 10px 20px rgba(${hexToRgb(P)}, 0.2)!important;
}
.wp-block-button__link:hover{transform:scale(1.05) translateY(-2px)!important;box-shadow: 0 15px 30px rgba(${hexToRgb(P)}, 0.3)!important;color:#fff!important;}

.section-padding { padding: 160px 40px; }
@media(max-width:768px){ .section-padding { padding: 80px 24px; } }

/* Custom CSS from Gemini */
${schema.theme?.customCss || ""}
${sections.map((s: any) => s.customCss || "").join("\n")}
</style>
<!-- /wp:html -->\n\n`;

	let html = globalCss;
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
			case "faq":
				html += renderFAQ(section, schema, P, TEXT, MUTED, sectionBg, typography);
				break;
			case "contact":
				html += renderContact(section, schema, P, TEXT, MUTED, sectionBg, typography);
				break;
		}
	});

	// Footer
	html += `<!-- wp:html -->
<footer style="background:#000;padding:100px 40px;text-align:center;">
  <div style="max-width:1200px;margin:0 auto;">
    <h2 style="font-family:'${typography.heading}',serif;color:#fff;font-size:2rem;margin-bottom:2rem;">${esc(businessName)}</h2>
    <p style="color:rgba(255,255,255,0.4);font-size:0.9rem;margin-bottom:4rem;">Crafted with excellence. &copy; ${new Date().getFullYear()} All rights reserved.</p>
    <div style="width:40px;height:2px;background:${P};margin:0 auto;"></div>
  </div>
</footer>
<!-- /wp:html -->`;

	return html;
}

function renderHero(section: any, schema: any, P: string, TEXT: string, MUTED: string, typography: any) {
	const businessName = schema.brand?.businessName || "";
	const img = section.media?.src || section.media?.url || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80";
	const title = section.headline || businessName;
	const sub = section.subheadline || "";
	const cta = section.ctaPrimary?.label || "Discover More";
	const variant = section.variant || "immersive"; 

	if (variant === "centered" || variant === "immersive") {
		return `<!-- wp:cover {"url":"${esc(img)}","dimRatio":${variant === 'immersive' ? 70 : 40},"overlayColor":"black","minHeight":100,"minHeightUnit":"vh","align":"full"} -->
<div class="wp-block-cover alignfull section-hero" style="min-height:100vh;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;">
<span aria-hidden="true" class="wp-block-cover__background has-black-background-color has-background-dim-${variant === 'immersive' ? 70 : 40} has-background-dim" style="background:linear-gradient(180deg,rgba(0,0,0,0.7) 0%,rgba(${hexToRgb(P)},0.4) 100%)!important;"></span>
<img class="wp-block-cover__image-background" alt="${esc(businessName)}" src="${esc(img)}" data-object-fit="cover" style="object-fit:cover;width:100%;height:100%;position:absolute;inset:0;"/>
<div class="wp-block-cover__inner-container animate-up" style="position:relative;z-index:2;padding:40px 24px;text-align:center;max-width:1100px;margin:0 auto;">
<div style="display:inline-block;padding:8px 20px;background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border-radius:100px;color:#fff;font-size:0.85rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:2rem;border:1px solid rgba(255,255,255,0.2);">${esc(schema.brand?.category || 'Premium Service')}</div>
<h1 style="font-family:'${typography.heading}',serif;font-size:clamp(3.5rem,10vw,7.5rem);line-height:0.95;font-weight:900;color:#fff;letter-spacing:-0.05em;margin-bottom:2rem;text-shadow:0 20px 50px rgba(0,0,0,0.5);">${esc(title)}</h1>
<p style="font-size:clamp(1.2rem,2.5vw,1.6rem);color:rgba(255,255,255,0.85);max-width:700px;margin:0 auto 3.5rem;line-height:1.5;font-weight:400;">${esc(sub)}</p>
<div class="wp-block-buttons" style="justify-content:center;display:flex;"><div class="wp-block-button"><a class="wp-block-button__link wp-element-button">${esc(cta)}</a></div></div>
</div></div><!-- /wp:cover -->\n\n`;
	}

	// Split Variant (Framer-style)
	return `<!-- wp:html -->
<section class="section-hero" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));min-height:100vh;background:${schema.theme?.palette?.background || '#fff'};overflow:hidden;">
  <div class="animate-up" style="padding:160px 80px;display:flex;flex-direction:column;justify-content:center;">
    <div style="color:${P};font-weight:900;text-transform:uppercase;letter-spacing:0.2em;font-size:0.8rem;margin-bottom:2rem;">${esc(schema.brand?.category || 'Official Site')}</div>
    <h1 style="font-family:'${typography.heading}',serif;font-size:clamp(3rem,6vw,5.5rem);line-height:0.9;font-weight:900;color:${TEXT};letter-spacing:-0.04em;margin-bottom:2rem;">${esc(title)}</h1>
    <p style="font-size:1.3rem;color:${MUTED};margin-bottom:3.5rem;line-height:1.6;max-width:500px;">${esc(sub)}</p>
    <div style="display:flex;gap:20px;"><a class="wp-block-button__link wp-element-button">${esc(cta)}</a></div>
  </div>
  <div class="animate-scale" style="position:relative;min-height:500px;">
    <img src="${esc(img)}" style="width:100%;height:100%;object-fit:cover;" alt="${esc(businessName)}"/>
    <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent, rgba(0,0,0,0.1));"></div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderFeatures(section: any, schema: any, P: string, TEXT: string, MUTED: string, Bg: string, typography: any, radius: string) {
	const items = section.items || [];
	
	const cards = items.map((item: any, i: number) => `
<div class="glass hover-lift" style="border-radius:${radius};padding:60px 45px;display:flex;flex-direction:column;gap:25px;">
  <div style="width:64px;height:64px;border-radius:20px;background:${P};color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.8rem;box-shadow:0 15px 30px rgba(${hexToRgb(P)},0.25);">
    ${i + 1}
  </div>
  <h3 style="font-family:'${typography.heading}',serif;font-size:1.8rem;font-weight:700;color:${TEXT};margin:0;letter-spacing:-0.02em;">${esc(item.title || item.name)}</h3>
  <p style="color:${MUTED};line-height:1.7;font-size:1.1rem;margin:0;opacity:0.9;">${esc(item.description || item.body)}</p>
</div>`).join("\n");

	return `<!-- wp:html -->
<section class="section-padding section-features" style="background:${Bg};">
  <div style="max-width:1300px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:100px;max-width:800px;margin-left:auto;margin-right:auto;">
      <h2 style="font-family:'${typography.heading}',serif;font-size:clamp(2.5rem,5vw,4.5rem);font-weight:900;color:${TEXT};line-height:1;letter-spacing:-0.04em;margin-bottom:1.5rem;">${esc(section.headline || "Unmatched Excellence")}</h2>
      <div style="width:60px;height:4px;background:${P};margin:0 auto;"></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:40px;">
      ${cards}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderGallery(section: any, schema: any, TEXT: string, Bg: string, typography: any) {
	const items = section.items || [];
	const figures = items.slice(0,4).map((item: any, i: number) => `
<div class="hover-lift" style="overflow:hidden;border-radius:30px;aspect-ratio:${i % 2 === 0 ? '4/5' : '1'};position:relative;grid-column: span ${i === 0 ? 2 : 1};">
  <img src="${esc(item.src || item.url)}" style="width:100%;height:100%;object-fit:cover;" alt="Gallery"/>
</div>`).join("\n");

	return `<!-- wp:html -->
<section class="section-padding section-gallery" style="background:${Bg};">
  <div style="max-width:1300px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:80px;flex-wrap:wrap;gap:30px;">
      <h2 style="font-family:'${typography.heading}',serif;font-size:clamp(2.5rem,5vw,4.5rem);font-weight:900;color:${TEXT};line-height:0.9;letter-spacing:-0.04em;">Inside The <br/><span class="text-gradient">Experience</span></h2>
      <p style="max-width:400px;font-size:1.1rem;color:${Bg === '#fff' ? '#666' : 'rgba(255,255,255,0.6)'};line-height:1.6;">${esc(section.subheadline || "A visual journey through our craft, space, and the results we deliver for our clients every day.")}</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:25px;">
      ${figures}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderTestimonials(section: any, schema: any, P: string, TEXT: string, MUTED: string, Bg: string, typography: any) {
	const items = section.items || [];
	const cards = items.map((item: any) => `
<div class="glass" style="padding:50px;border-radius:40px;display:flex;flex-direction:column;gap:30px;position:relative;overflow:hidden;">
  <div style="font-size:5rem;position:absolute;top:-10px;left:20px;opacity:0.05;font-family:serif;">&ldquo;</div>
  <p style="font-size:1.3rem;font-weight:500;color:${TEXT};line-height:1.6;position:relative;z-index:2;">${esc(item.quote)}</p>
  <div style="display:flex;align-items:center;gap:15px;">
    <div style="width:50px;height:50px;background:${P};border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;">${item.author ? item.author.charAt(0) : 'A'}</div>
    <div>
      <div style="font-weight:800;color:${TEXT};font-size:1.1rem;">${esc(item.author)}</div>
      <div style="color:${P};font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${esc(item.role || "Verified Client")}</div>
    </div>
  </div>
</div>`).join("\n");

	return `<!-- wp:html -->
<section class="section-padding section-testimonials" style="background:${Bg};">
  <div style="max-width:1200px;margin:0 auto;">
    <h2 style="font-family:'${typography.heading}',serif;font-size:3.5rem;font-weight:900;color:${TEXT};margin-bottom:100px;text-align:center;letter-spacing:-0.03em;">What They <span class="text-gradient">Say</span></h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:30px;">
      ${cards}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderCTA(section: any, schema: any, P: string, TEXT: string, typography: any) {
	return `<!-- wp:html -->
<section class="section-cta" style="padding:140px 40px;background:linear-gradient(135deg, ${P}, #ec4899);text-align:center;position:relative;overflow:hidden;">
  <div class="floating" style="position:absolute;top:-100px;right:-100px;width:300px;height:300px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>
  <div class="floating" style="position:absolute;bottom:-50px;left:-50px;width:200px;height:200px;background:rgba(255,255,255,0.05);border-radius:50%;animation-delay:2s;"></div>
  <div style="max-width:900px;margin:0 auto;position:relative;z-index:5;">
    <h2 style="font-family:'${typography.heading}',serif;font-size:clamp(3rem,6vw,5rem);font-weight:900;color:#fff;margin-bottom:2rem;line-height:1;letter-spacing:-0.04em;">${esc(section.title || "Ready to Level Up?")}</h2>
    <p style="font-size:1.4rem;color:rgba(255,255,255,0.9);margin-bottom:4rem;max-width:600px;margin-left:auto;margin-right:auto;line-height:1.5;">${esc(section.body || "Join hundreds of businesses growing with our premium solutions.")}</p>
    <a class="wp-block-button__link" style="background:#fff!important;color:${P}!important;font-size:1.2rem;">${esc(section.buttonLabel || "Get Started Now")}</a>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderContact(section: any, schema: any, P: string, TEXT: string, MUTED: string, Bg: string, typography: any) {
	const brand = schema.brand || {};
	return `<!-- wp:html -->
<section id="contact" class="section-padding section-contact" style="background:${Bg};">
  <div style="max-width:1300px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:100px;align-items:center;">
    <div class="animate-up">
      <h2 style="font-family:'${typography.heading}',serif;font-size:4.5rem;font-weight:900;color:${TEXT};margin-bottom:2rem;letter-spacing:-0.04em;line-height:0.9;">Let's <br/><span class="text-gradient">Connect</span></h2>
      <p style="color:${MUTED};font-size:1.3rem;margin-bottom:4rem;line-height:1.6;">We're ready to discuss your vision and how our expertise can bring it to life.</p>
      
      <div style="display:flex;flex-direction:column;gap:35px;">
        ${brand.phone ? `<div><h4 style="color:${P};font-weight:900;text-transform:uppercase;letter-spacing:0.1em;font-size:0.8rem;margin-bottom:10px;">Direct Line</h4><p style="font-size:1.8rem;font-weight:500;color:${TEXT}">${esc(brand.phone)}</p></div>` : ""}
        ${brand.email ? `<div><h4 style="color:${P};font-weight:900;text-transform:uppercase;letter-spacing:0.1em;font-size:0.8rem;margin-bottom:10px;">Email</h4><p style="font-size:1.8rem;font-weight:500;color:${TEXT}">${esc(brand.email)}</p></div>` : ""}
        ${brand.address ? `<div><h4 style="color:${P};font-weight:900;text-transform:uppercase;letter-spacing:0.1em;font-size:0.8rem;margin-bottom:10px;">Location</h4><p style="font-size:1.4rem;font-weight:400;color:${TEXT};line-height:1.4;">${esc(brand.address)}</p></div>` : ""}
      </div>
    </div>
    <div class="glass animate-scale" style="padding:60px;border-radius:50px;">
      <h3 style="font-family:'${typography.heading}',serif;font-size:2rem;font-weight:800;margin-bottom:2rem;">Send a Message</h3>
      <div style="display:flex;flex-direction:column;gap:20px;">
        <div style="height:60px;background:rgba(0,0,0,0.05);border-radius:15px;border:1px solid rgba(0,0,0,0.1);"></div>
        <div style="height:60px;background:rgba(0,0,0,0.05);border-radius:15px;border:1px solid rgba(0,0,0,0.1);"></div>
        <div style="height:150px;background:rgba(0,0,0,0.05);border-radius:15px;border:1px solid rgba(0,0,0,0.1);"></div>
        <div style="height:60px;background:${P};border-radius:15px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">Submit Enquiry</div>
      </div>
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function renderFAQ(section: any, schema: any, P: string, TEXT: string, MUTED: string, Bg: string, typography: any) {
	const items = (section.content?.items || section.items || []);
	const cards = items.map((item: any) => `
<div class="glass" style="padding:40px;border-radius:25px;">
  <h4 style="font-family:'${typography.heading}',serif;font-size:1.4rem;font-weight:800;color:${TEXT};margin-bottom:15px;line-height:1.3;">${esc(item.question || item.title)}</h4>
  <p style="color:${MUTED};font-size:1.1rem;line-height:1.6;margin:0;">${esc(item.answer || item.description)}</p>
</div>`).join("\n");

	return `<!-- wp:html -->
<section class="section-padding section-faq" style="background:${Bg};">
  <div style="max-width:1100px;margin:0 auto;">
    <h2 style="font-family:'${typography.heading}',serif;font-size:3.5rem;font-weight:900;color:${TEXT};margin-bottom:80px;text-align:center;letter-spacing:-0.03em;">${esc(section.content?.title || section.title || "Common Inquiries")}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(450px,1fr));gap:30px;">
      ${cards}
    </div>
  </div>
</section>
<!-- /wp:html -->\n\n`;
}

function hexToRgb(hex: string): string {
	const clean = hex.replace("#", "");
	const r = parseInt(clean.slice(0, 2), 16) || 0;
	const g = parseInt(clean.slice(2, 4), 16) || 0;
	const b = parseInt(clean.slice(4, 6), 16) || 0;
	return `${r},${g},${b}`;
}
