"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeGenerationDebugFile = writeGenerationDebugFile;
exports.fetchGenerationDebugSummary = fetchGenerationDebugSummary;
exports.buildPreviewSummaryMarkdown = buildPreviewSummaryMarkdown;
exports.buildRendererVariantLog = buildRendererVariantLog;
exports.renderWordPressDebugHtml = renderWordPressDebugHtml;
const API_URL = import.meta.env?.VITE_API_URL ||
    "http://localhost:5001";
async function writeGenerationDebugFile(traceId, fileName, content, append = false) {
    if (!traceId)
        return;
    try {
        await fetch(`${API_URL}/api/debug-generation/${encodeURIComponent(traceId)}/file`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ fileName, content, append }),
        });
    }
    catch (error) {
        console.warn(`[DebugGeneration] Failed to write ${fileName}:`, error);
    }
}
async function fetchGenerationDebugSummary(traceId) {
    if (!traceId)
        return null;
    try {
        const response = await fetch(`${API_URL}/api/debug-generation/${encodeURIComponent(traceId)}/summary`);
        if (!response.ok)
            return null;
        return (await response.json());
    }
    catch (error) {
        console.warn("[DebugGeneration] Failed to fetch summary:", error);
        return null;
    }
}
function escapeHtml(value) {
    return (value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function buildPreviewSummaryMarkdown(args) {
    const sectionTypes = args.schema.sections.map((section) => section.type);
    const galleryCount = args.schema.sections.filter((section) => section.type === "gallery").length;
    const testimonialCount = args.schema.sections.filter((section) => section.type === "testimonials").length;
    const missingSections = ["hero", "contact"].filter((type) => !sectionTypes.includes(type));
    const parseRepairs = args.summary?.parseRepairs || [];
    const rendererWarnings = [
        ...(args.summary?.rendererWarnings || []),
        ...(galleryCount === 0 ? ["No gallery sections found in schema"] : []),
        ...(testimonialCount === 0
            ? ["No testimonial sections found in schema"]
            : []),
    ];
    const errors = args.summary?.errors || [];
    const fallbackUsed = args.debugFallbackUsed || Boolean(args.summary?.fallbackReason);
    return [
        "# Final Preview Summary",
        "",
        `- Trace ID: ${args.traceId}`,
        `- Business: ${args.schema.brand.businessName}`,
        `- Section order: ${sectionTypes.length ? sectionTypes.join(" -> ") : "none"}`,
        `- Rendered section count: ${args.schema.sections.length}`,
        `- Gallery count: ${galleryCount}`,
        `- Testimonial count: ${testimonialCount}`,
        `- Fallback usage: ${fallbackUsed ? "yes" : "no"}`,
        `- Parse repairs: ${parseRepairs.length}`,
        `- Missing sections: ${missingSections.length ? missingSections.join(", ") : "none"}`,
        `- Renderer warnings: ${rendererWarnings.length ? rendererWarnings.join(" | ") : "none"}`,
        `- Errors logged: ${errors.length}`,
        "",
        "## Rendered HTML Snapshot",
        "",
        "```html",
        args.renderedHtml.slice(0, 12000),
        "```",
        "",
        "## WordPress Blocks Snapshot",
        "",
        "```html",
        args.wordpressBlocks.slice(0, 12000),
        "```",
        "",
        "## Parse Repairs",
        "",
        parseRepairs.length
            ? parseRepairs
                .map((report) => `- [${report.index}] ${report.originalType || "unknown"} -> ${report.finalType}${report.repaired.length ? ` | repaired: ${report.repaired.join(", ")}` : ""}${report.droppedFields.length ? ` | dropped: ${report.droppedFields.join(", ")}` : ""}`)
                .join("\n")
            : "- None",
        "",
        "## Errors",
        "",
        errors.length ? errors.map((line) => `- ${line}`).join("\n") : "- None",
    ].join("\n");
}
function getSectionLayout(section) {
    return (section.layout || section.variant || "standard")
        .toString()
        .toLowerCase();
}
function getRendererVariant(section) {
    const layout = getSectionLayout(section);
    switch (section.type) {
        case "hero":
            return layout === "hero-immersive"
                ? "immersive-full-bleed"
                : layout === "centered"
                    ? "luxury-centered"
                    : layout === "split"
                        ? "editorial-left"
                        : "editorial-left";
        case "features":
            return layout === "feature-grid"
                ? "bento"
                : layout === "list"
                    ? "editorial-stack"
                    : layout === "alternating-grid"
                        ? "alternating-grid"
                        : "bento";
        case "gallery":
            return layout === "gallery-masonry"
                ? "masonry"
                : layout === "asymmetrical"
                    ? "asymmetrical-collage"
                    : "cinematic-grid";
        case "testimonials":
            return layout === "testimonial-carousel"
                ? "floating-cards"
                : layout === "timeline"
                    ? "timeline"
                    : layout === "split"
                        ? "split-highlight"
                        : "floating-cards";
        case "cta":
            return layout === "cta-split"
                ? "side-by-side"
                : layout === "immersive"
                    ? "immersive-banner"
                    : "centered-premium";
        case "faq":
            return layout === "faq-accordion" ? "faq-accordion" : "faq-accordion";
        case "contact":
            return layout === "contact-form" ? "contact-form" : "contact-form";
        default:
            return layout;
    }
}
function getIgnoredSchemaFields(section) {
    const allowedFieldsByType = {
        hero: [
            "id",
            "type",
            "layout",
            "variant",
            "badge",
            "headline",
            "subheadline",
            "ctaPrimary",
            "primaryCta",
            "secondaryCta",
            "ctaSecondary",
            "badges",
            "media",
        ],
        features: [
            "id",
            "type",
            "layout",
            "headline",
            "title",
            "subheadline",
            "items",
        ],
        gallery: [
            "id",
            "type",
            "layout",
            "headline",
            "title",
            "subheadline",
            "items",
        ],
        testimonials: [
            "id",
            "type",
            "layout",
            "headline",
            "title",
            "subheadline",
            "items",
        ],
        faq: ["id", "type", "layout", "headline", "title", "subheadline", "items"],
        cta: [
            "id",
            "type",
            "layout",
            "headline",
            "title",
            "body",
            "primaryCta",
            "buttonLabel",
            "buttonHref",
        ],
        contact: [
            "id",
            "type",
            "layout",
            "headline",
            "title",
            "subheadline",
            "address",
            "phone",
            "hours",
            "showEmail",
            "showPhone",
        ],
    };
    const allowed = new Set(allowedFieldsByType[section.type] || ["id", "type", "layout"]);
    return Object.keys(section).filter((key) => !allowed.has(key));
}
function isFallbackLayout(section) {
    const layout = getSectionLayout(section);
    switch (section.type) {
        case "hero":
            return ![
                "split",
                "immersive",
                "centered",
                "editorial",
                "magazine",
                "split-clinical",
                "immersive-full-bleed",
                "luxury-centered",
                "editorial-left",
                "hero-immersive",
            ].includes(layout);
        case "features":
            return ![
                "cards",
                "bento",
                "list",
                "editorial-stack",
                "alternating-grid",
                "feature-grid",
            ].includes(layout);
        case "gallery":
            return ![
                "asymmetrical",
                "masonry",
                "cinematic-grid",
                "overlapping-panels",
                "gallery-masonry",
            ].includes(layout);
        case "testimonials":
            return ![
                "masonry",
                "timeline",
                "split",
                "editorial-quotes",
                "floating-cards",
                "split-highlight",
                "testimonial-carousel",
            ].includes(layout);
        case "cta":
            return ![
                "centered",
                "side-by-side",
                "immersive",
                "minimal-floating",
                "immersive-banner",
                "centered-premium",
                "cta-split",
            ].includes(layout);
        case "faq":
            return !["standard", "split", "faq-accordion"].includes(layout);
        case "contact":
            return !["standard", "split", "contact-form"].includes(layout);
        default:
            return true;
    }
}
function buildRendererVariantLog(args) {
    const sectionLines = args.schema.sections.map((section, index) => {
        const layout = getSectionLayout(section);
        const rendererVariant = getRendererVariant(section);
        const ignoredFields = getIgnoredSchemaFields(section);
        const fallbackUsed = isFallbackLayout(section);
        return [
            `[${String(index + 1).padStart(2, "0")}] ${section.type}`,
            `layout=${layout}`,
            `rendererVariant=${rendererVariant}`,
            `fallbackRenderer=${fallbackUsed ? "yes" : "no"}`,
            `ignoredFields=${ignoredFields.length ? ignoredFields.join(", ") : "none"}`,
        ].join(" | ");
    });
    const unsupportedLayouts = args.schema.sections
        .filter((section) => isFallbackLayout(section))
        .map((section) => `${section.type}:${getSectionLayout(section)}`);
    return [
        "# Renderer Variant Log",
        "",
        `- Trace ID: ${args.traceId}`,
        `- Renderer fallback used: ${args.debugFallbackUsed || unsupportedLayouts.length > 0 ? "yes" : "no"}`,
        `- Unsupported layouts: ${unsupportedLayouts.length ? unsupportedLayouts.join(", ") : "none"}`,
        "",
        "## Section Mapping",
        "",
        sectionLines.length ? sectionLines.join("\n") : "- None",
        "",
        "## HTML Snapshots",
        "",
        "### Final HTML Before WordPress",
        "```html",
        args.renderedHtml.slice(0, 12000),
        "```",
        "",
        "### Final Gutenberg Output",
        "```html",
        args.wordpressBlocks.slice(0, 12000),
        "```",
    ].join("\n");
}
function renderWordPressDebugHtml(args) {
    const plan = args.provisioningPlan;
    const planPages = Array.isArray(plan?.pages) ? plan.pages : [];
    const mediaAssets = Array.isArray(plan?.media) ? plan.media : [];
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WordPress Block Output</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; line-height: 1.5; padding: 24px; color: #111827; background: #f8fafc; }
    h1, h2, h3 { margin-bottom: 0.5rem; }
    section { margin-bottom: 2rem; padding: 1rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow: auto; }
    .meta { color: #475569; }
  </style>
</head>
<body>
  <h1>WordPress Content Trace</h1>
  <p class="meta">Business: ${escapeHtml(args.schema.brand.businessName)} | Category: ${escapeHtml(args.schema.brand.category)} | Pages: ${planPages.length}</p>
  <section>
    <h2>Generated Gutenberg Blocks</h2>
    <pre>${escapeHtml(args.wordpressBlocks)}</pre>
  </section>
  <section>
    <h2>Provisioning Plan Pages</h2>
    ${planPages
        .map((page) => `
    <article>
      <h3>${escapeHtml(page.title || page.slug || "Page")}</h3>
      <p class="meta">Slug: ${escapeHtml(page.slug || "")}${page.isHomepage ? " | Homepage" : ""}</p>
      <pre>${escapeHtml(page.content || "")}</pre>
    </article>`)
        .join("\n")}
  </section>
  <section>
    <h2>Media Assets</h2>
    <pre>${escapeHtml(JSON.stringify(mediaAssets, null, 2))}</pre>
  </section>
</body>
</html>`;
}
