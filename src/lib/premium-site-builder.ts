/**
 * premium-site-builder.ts
 *
 * Visual Curation & Taste Refinement Engine.
 * Delegates the rendering to composition-renderer.
 */

import { renderCompositionExperience } from "./composition-renderer";

export function esc(str: string) {
	return (str || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function buildPremiumPageContent(schema: any): string {
	const result = renderCompositionExperience(schema);
	const cssBlock = `<!-- wp:html -->\n<style>\n${result.css}\n</style>\n<!-- /wp:html -->`;
	const htmlBlock = `<!-- wp:html -->\n${result.html}\n<!-- /wp:html -->`;
	return `${cssBlock}\n\n${htmlBlock}`;
}
