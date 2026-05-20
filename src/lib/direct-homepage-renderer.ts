/** @format */

import { WebsiteSchema } from "../types";

export interface SimpleRenderResult {
	html: string;
	css: string;
}

function escapeHtml(s: string | undefined) {
	return (s || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function pickHeroImage(schema: WebsiteSchema) {
	const photos =
		(schema.brand && (schema.brand as any).photos) ||
		(schema as any).photos ||
		[];
	if (photos && photos.length) return photos[0];
	// fallback to first section image
	const src = (schema.sections || [])
		.map(
			(s: any) =>
				(s.media && s.media.src) || (s.items && s.items[0] && s.items[0].src),
		)
		.find(Boolean);
	return src || "";
}

export function renderBusinessHomepage(
	schema: WebsiteSchema,
): SimpleRenderResult {
	const brand = schema.brand || ({} as any);
	const name = escapeHtml(brand.businessName || "Your Business");
	const category = escapeHtml(brand.category || "Local Service");
	const address = escapeHtml(brand.address || "");
	const phone = escapeHtml((brand as any).phone || "");
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
      <div style="margin-top:18px;color:var(--muted);font-size:0.95rem">${address}${phone ? ` • ${phone}` : ""}</div>
    </div>
    <div class="hero__visual" style="background-image:url('${escapeHtml(heroImage)}')"></div>
  </header>`;

	// Services: attempt to read from schema.sections of type 'features' or 'service'
	const servicesSection = (schema.sections || []).find(
		(s: any) => s.type === "features" || s.type === "service",
	);
	const services =
		servicesSection && Array.isArray(servicesSection.items)
			? servicesSection.items
					.slice(0, 4)
					.map(
						(it: any) =>
							`<div class="service"><strong>${escapeHtml(it.title || it.name || "Service")}</strong><p style="margin:8px 0 0;color:var(--muted)">${escapeHtml(it.description || it.copy || "Professional service delivered with care.")}</p></div>`,
					)
					.join("")
			: [
					`<div class="service"><strong>Conservation & Restoration</strong><p style="margin:8px 0 0;color:var(--muted)">Museum-grade restoration for antiques and heirlooms.</p></div>`,
					`<div class="service"><strong>Refinishing & Repair</strong><p style="margin:8px 0 0;color:var(--muted)">Structural repairs and surface refinishing to restore integrity.</p></div>`,
				].join("");

	const servicesHtml = `<section class="section"><div><h2>What we do</h2><div class="services">${services}</div></div><aside><h3>Why choose us</h3><p style="color:var(--muted)">Local workshop with decades of experience, transparent process, and visible before/after evidence.</p><div class="trust-cards"><div class="trust"><strong>4.9/5</strong><div style="color:var(--muted)">Average client rating</div></div><div class="trust"><strong>Certified</strong><div style="color:var(--muted)">Conservation-grade materials</div></div></div></aside></section>`;

	// Gallery
	const galleryImages = (
		(schema.sections || [])
			.filter((s: any) => s.type === "gallery")
			.flatMap((g: any) => g.items || []) || []
	)
		.slice(0, 6)
		.map((it: any) => it.src)
		.filter(Boolean);
	const galleryHtml = `<section id="gallery" class="section section--stack"><div><h2>Selected work</h2><div class="gallery">${(galleryImages.length ? galleryImages : [""]).map((src) => `<img src="${escapeHtml(src || "")}">`).join("")}</div></div></section>`;

	// Testimonials
	const testimonials =
		((schema.sections || []).find((s: any) => s.type === "testimonials") || {})
			.items || [];
	const testimonialsHtml = testimonials.length
		? `<section class="section"><div><h2>What clients say</h2><div>${testimonials
				.slice(0, 3)
				.map(
					(t: any) =>
						`<div class="service"><blockquote style="margin:0 0 8px">${escapeHtml(t.copy || t.content || t.text || "Great work.")}</blockquote><footer style="color:var(--muted);font-size:0.9rem">— ${escapeHtml(t.author || "Client")}</footer></div>`,
				)
				.join("")}</div></div></section>`
		: "";

	const contactHtml = `<section id="contact" class="section"><div><h2>Contact</h2><div class="contact"><p style="margin:0 0 8px;color:var(--muted)">Ready to start? Book an in-workshop consultation.</p><p style="margin:0"><strong>${name}</strong><br/>${address}<br/>${phone ? `<a href="tel:${phone}">${phone}</a>` : ""}</p></div></div><aside><h3>Request a quote</h3><p style="color:var(--muted)">Send images of your piece and we'll follow up with next steps.</p></aside></section>`;

	const html = `<main class="site">${heroHtml}${servicesHtml}${galleryHtml}${testimonialsHtml}${contactHtml}</main>`;

	return { html, css };
}

export default renderBusinessHomepage;
