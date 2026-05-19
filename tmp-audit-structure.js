/** @format */

import fs from "fs";
const raw = fs.readFileSync("tmp-audit-results.json", "utf16le");
const htmlAudit = JSON.parse(raw.replace(/^\uFEFF/, ""));

function parseSectionStructure(html) {
	const sectionMatch = html.match(/<section[\s\S]*?<\/section>/i);
	if (!sectionMatch) return [];
	const sectionHtml = sectionMatch[0];
	const regex =
		/<(article|aside|div|header|section|span|p|h2|h3|figure|img|blockquote|main|template|footer|nav|ul|li)([^>]*)>/gi;
	const signatures = [];
	const stack = [];
	const voidTags = new Set(["img", "input", "br", "hr", "meta", "link"]);
	let match;
	while ((match = regex.exec(sectionHtml))) {
		const tag = match[1];
		const attrs = match[2];
		const isClosing = /^\s*\//.test(attrs);
		const isSelfClosing = /\/$/.test(attrs) || voidTags.has(tag);
		if (isClosing) {
			stack.pop();
			continue;
		}
		const depth = stack.length;
		const clsMatch = attrs.match(/class=["']([^"']+)["']/i);
		signatures.push({ tag, cls: clsMatch ? clsMatch[1] : undefined, depth });
		if (!isSelfClosing) stack.push(tag);
	}
	return signatures;
}

function signatureSummary(sig) {
	return sig
		.map(
			(s) =>
				`${"  ".repeat(s.depth)}<${s.tag}${s.cls ? ` class="${s.cls}"` : ""}>`,
		)
		.join("\n");
}

for (const entry of htmlAudit) {
	const sigs = parseSectionStructure(entry.html);
	console.log(`ENGINE: ${entry.engine} ${entry.visualBehavior}`);
	console.log(`NODES: ${sigs.length}`);
	console.log(signatureSummary(sigs));
	console.log("---");
}
