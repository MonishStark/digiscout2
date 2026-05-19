/** @format */

import { renderCompositionPreviewDocument } from "./src/lib/composition-renderer.ts";

type AuditResult = {
	engine: string;
	visualBehavior: string;
	htmlLength: number;
	counts: Record<string, number>;
	html: string;
};

const sampleSchema = (visualBehavior: string) => ({
	seo: { title: "Audit" },
	brand: { businessName: "Test Brand" },
	sections: [
		{
			type: "hero",
			heading: "Hero Heading",
			description: "Open copy",
			media: { src: "https://example.com/image.jpg" },
		},
	],
	narrativeCompositions: [
		{
			id: "comp-1",
			narrativePurpose: "establish-authority",
			visualBehavior,
			scanPattern: "diagonal-ascending",
			densityMode: "balanced",
			geometrySystem: "grid-overlay",
			contentType: "hero",
			viewportRatio: 1,
			images: [
				{
					src: "https://example.com/image.jpg",
					classification: "landscape",
					dominantColor: "#777777",
					aspectRatio: 1.78,
					hasText: false,
					hasfaces: false,
					emotionalTone: "professional",
					suggestedTreatment: "contained",
				},
			],
			heading: "Test Heading",
			description: "Test description",
			actions: [{ label: "Action", href: "#", style: "primary" }],
			proofElements: [{ type: "testimonial", content: "Great!" }],
			motionLanguage: {
				entryTrigger: "on-scroll",
				entryType: "fade",
				internalMotion: "subtle",
			},
			styling: { typographySize: "large", typographyWeight: "bold" },
		},
	],
});

const engines = [
	{ visualBehavior: "immersive-overlap", name: "cinematicImmersive" },
	{ visualBehavior: "cinematic-reveal", name: "galleryStack" },
	{ visualBehavior: "brutalist-stack", name: "brutalistGrid" },
	{ visualBehavior: "editorial-asymmetry", name: "editorialOverlap" },
	{ visualBehavior: "intimate-breathe", name: "atmosphericMinimal" },
];

function countMatches(html: string, pattern: RegExp): number {
	return html.match(pattern)?.length ?? 0;
}

const results: AuditResult[] = engines.map((engine) => {
	const schema = sampleSchema(engine.visualBehavior);
	const html = renderCompositionPreviewDocument(schema);
	return {
		engine: engine.name,
		visualBehavior: engine.visualBehavior,
		htmlLength: html.length,
		counts: {
			sections: countMatches(html, /<section/g),
			divs: countMatches(html, /<div/g),
			spans: countMatches(html, /<span/g),
			compositionImage: countMatches(html, /<div class="composition-image"/g),
			h2: countMatches(html, /<h2/g),
			para: countMatches(html, /<p/g),
			actions: countMatches(html, /composition-actions/g),
		},
		html,
	};
});

console.log(JSON.stringify(results, null, 2));
