/**
 * premium-site-builder.ts
 *
 * Visual Curation & Taste Refinement Engine.
 * Delegates the rendering to composition-renderer.
 *
 * @format
 */

import { renderCompositionExperience } from "./composition-renderer";
import { renderBusinessHomepage } from "./direct-homepage-renderer";

export function esc(str: string) {
	return (str || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function buildPremiumPageContent(schema: any): string {
	// Priority guardrail: if the schema already contains the compiled WordPress HTML/CSS from the direct prompt flow, return it directly.
	if (schema && schema._wordpressHtml) {
		return schema._wordpressHtml;
	}
	// Use the simplified direct homepage renderer for production-ready business pages.
	const result = renderBusinessHomepage(schema);
	// Inject CSS via a wp:html block (safe) and wrap the content in a container
	const cssBlock = `<!-- wp:html -->\n<style>\n${result.css}\n</style>\n<!-- /wp:html -->`;
	const wrappedHtml = `<!-- wp:group {"align":"full","layout":{"type":"constrained"}} -->\n<div class="wp-block-group alignfull">\n${result.html}\n</div>\n<!-- /wp:group -->`;
	return `${cssBlock}\n\n${wrappedHtml}`;
}
