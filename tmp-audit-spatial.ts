/** @format */

import {
	renderCompositionPreviewDocument,
	renderCompositionExperience,
} from "./src/lib/composition-renderer.ts";
import { WebsiteSchema } from "./src/types";

const schemas: WebsiteSchema[] = [
	{
		seo: { title: "Immersive Overlap" },
		brand: { businessName: "Studio" },
		layoutDNA: {
			spacingRhythm: "balanced",
			gridSystem: "grid-overlay",
			visualTempo: "cinematic",
			scanPath: "diagonal-ascending",
		},
		sections: [
			{
				type: "hero",
				heading: "Immersive Hero",
				description: "Large layered scene",
				media: {
					src: "https://example.com/landscape.jpg",
					classification: "landscape",
				},
			},
		],
		narrativeCompositions: [
			{
				id: "comp-1",
				narrativePurpose: "establish-authority",
				visualBehavior: "immersive-overlap",
				scanPattern: "diagonal-ascending",
				densityMode: "balanced",
				geometrySystem: "grid-overlay",
				contentType: "hero",
				viewportRatio: 1.1,
				images: [
					{
						src: "https://example.com/landscape.jpg",
						classification: "landscape",
						aspectRatio: 1.78,
					},
				],
				heading: "Immersive Overlap",
				description: "Visual depth with strong hero layering.",
				actions: [{ label: "Explore", href: "#" }],
				proofElements: [
					{ type: "testimonial", content: "A cinematic reveal." },
				],
			},
		],
	},
	{
		seo: { title: "Gallery Stack" },
		brand: { businessName: "Gallery" },
		layoutDNA: {
			spacingRhythm: "airy",
			gridSystem: "grid-overlay",
			visualTempo: "cinematic",
			scanPath: "horizontal",
		},
		sections: [
			{
				type: "gallery",
				heading: "Gallery Stack",
				description: "Stacked visual rhythm",
				media: {
					src: "https://example.com/portrait.jpg",
					classification: "portrait",
				},
			},
		],
		narrativeCompositions: [
			{
				id: "comp-2",
				narrativePurpose: "showcase-work",
				visualBehavior: "cinematic-reveal",
				scanPattern: "horizontal",
				densityMode: "airy",
				geometrySystem: "grid-overlay",
				contentType: "showcase",
				viewportRatio: 0.9,
				images: [
					{
						src: "https://example.com/portrait.jpg",
						classification: "portrait",
						aspectRatio: 0.75,
					},
				],
				heading: "Gallery Stack",
				description: "Portrait-rich imagery in stacked form.",
				actions: [{ label: "View Work", href: "#" }],
			},
		],
	},
	{
		seo: { title: "Brutalist Grid" },
		brand: { businessName: "Bold" },
		layoutDNA: {
			spacingRhythm: "brutalist-dense",
			gridSystem: "asymmetric",
			visualTempo: "kinetic",
			scanPath: "vertical",
		},
		sections: [
			{
				type: "features",
				heading: "Brutalist Grid",
				description: "Chunky, square rhythm",
				media: {
					src: "https://example.com/macro.jpg",
					classification: "macro",
				},
			},
		],
		narrativeCompositions: [
			{
				id: "comp-3",
				narrativePurpose: "explain-process",
				visualBehavior: "brutalist-stack",
				scanPattern: "vertical",
				densityMode: "brutalist-dense",
				geometrySystem: "overlap-plane",
				contentType: "narrative",
				viewportRatio: 0.8,
				images: [
					{
						src: "https://example.com/macro.jpg",
						classification: "macro",
						aspectRatio: 1,
					},
				],
				heading: "Brutalist Grid",
				description: "Dense grid and bold spacing rules.",
				actions: [{ label: "See More", href: "#" }],
			},
		],
	},
	{
		seo: { title: "Editorial Overlap" },
		brand: { businessName: "Magazine" },
		layoutDNA: {
			spacingRhythm: "relaxed",
			gridSystem: "asymmetric",
			visualTempo: "luxury",
			scanPath: "spiral",
		},
		sections: [
			{
				type: "feature",
				heading: "Editorial Overlap",
				description: "Layered asymmetry and image overlays",
				media: {
					src: "https://example.com/texture.jpg",
					classification: "texture",
				},
			},
		],
		narrativeCompositions: [
			{
				id: "comp-4",
				narrativePurpose: "build-emotion",
				visualBehavior: "editorial-asymmetry",
				scanPattern: "spiral",
				densityMode: "relaxed",
				geometrySystem: "overlap-plane",
				contentType: "narrative",
				viewportRatio: 0.85,
				images: [
					{
						src: "https://example.com/texture.jpg",
						classification: "texture",
						aspectRatio: 1.5,
					},
				],
				heading: "Editorial Overlap",
				description: "Asymmetrical copy and image pairing.",
				actions: [{ label: "Read More", href: "#" }],
			},
		],
	},
	{
		seo: { title: "Atmospheric Minimal" },
		brand: { businessName: "Calm" },
		layoutDNA: {
			spacingRhythm: "airy",
			gridSystem: "grid-overlay",
			visualTempo: "intimate",
			scanPath: "vertical",
		},
		sections: [
			{
				type: "testimonial",
				heading: "Atmospheric Minimal",
				description: "Minimal spacing with soft presentation",
				media: {
					src: "https://example.com/lowmedia.jpg",
					classification: "texture",
				},
			},
		],
		narrativeCompositions: [
			{
				id: "comp-5",
				narrativePurpose: "prove-credibility",
				visualBehavior: "intimate-breathe",
				scanPattern: "vertical",
				densityMode: "airy",
				geometrySystem: "grid-overlay",
				contentType: "proof",
				viewportRatio: 0.7,
				images: [
					{
						src: "https://example.com/lowmedia.jpg",
						classification: "texture",
						aspectRatio: 1.2,
					},
				],
				heading: "Atmospheric Minimal",
				description: "Soft, text-forward layout with visual respite.",
				actions: [{ label: "Discover", href: "#" }],
			},
		],
	},
	{
		seo: { title: "Kinetic Diagonal" },
		brand: { businessName: "Motion" },
		layoutDNA: {
			spacingRhythm: "tight",
			gridSystem: "overlap-plane",
			visualTempo: "kinetic",
			scanPath: "diagonal-ascending",
		},
		sections: [
			{
				type: "service",
				heading: "Kinetic Diagonal",
				description: "Diagonal movement and skewed frames",
				media: {
					src: "https://example.com/landscape2.jpg",
					classification: "landscape",
				},
			},
		],
		narrativeCompositions: [
			{
				id: "comp-6",
				narrativePurpose: "generate-desire",
				visualBehavior: "kinetic-stagger",
				scanPattern: "diagonal-ascending",
				densityMode: "tight",
				geometrySystem: "overlap-plane",
				contentType: "narrative",
				viewportRatio: 0.9,
				images: [
					{
						src: "https://example.com/landscape2.jpg",
						classification: "landscape",
						aspectRatio: 2,
					},
				],
				heading: "Kinetic Diagonal",
				description: "A skewed diagonal composition for energetic movement.",
				actions: [{ label: "Book Now", href: "#" }],
			},
		],
	},
	{
		seo: { title: "Offset Layer" },
		brand: { businessName: "Offset" },
		layoutDNA: {
			spacingRhythm: "relaxed",
			gridSystem: "grid-overlay",
			visualTempo: "cinematic",
			scanPath: "horizontal",
		},
		sections: [
			{
				type: "contact",
				heading: "Offset Layer",
				description: "Split surface with offset imagery",
				media: {
					src: "https://example.com/portrait2.jpg",
					classification: "portrait",
				},
			},
		],
		narrativeCompositions: [
			{
				id: "comp-7",
				narrativePurpose: "close-conversion",
				visualBehavior: "cinematic-reveal",
				scanPattern: "horizontal",
				densityMode: "relaxed",
				geometrySystem: "grid-overlay",
				contentType: "interaction",
				viewportRatio: 0.85,
				images: [
					{
						src: "https://example.com/portrait2.jpg",
						classification: "portrait",
						aspectRatio: 0.75,
					},
				],
				heading: "Offset Layer",
				description: "Split panel composition with offset visual motion.",
				actions: [{ label: "Contact", href: "#" }],
			},
		],
	},
	{
		seo: { title: "Low Media" },
		brand: { businessName: "TextFirst" },
		layoutDNA: {
			spacingRhythm: "relaxed",
			gridSystem: "grid-overlay",
			visualTempo: "intimate",
			scanPath: "vertical",
		},
		sections: [
			{
				type: "about",
				heading: "Low Media",
				description: "Text-first pacing with low image dependency",
			},
		],
		narrativeCompositions: [
			{
				id: "comp-8",
				narrativePurpose: "build-emotion",
				visualBehavior: "intimate-breathe",
				scanPattern: "vertical",
				densityMode: "relaxed",
				geometrySystem: "grid-overlay",
				contentType: "narrative",
				viewportRatio: 0.75,
				images: [],
				heading: "Low Media",
				description:
					"When imagery is minimal, the layout still needs to feel composed.",
				actions: [{ label: "Learn More", href: "#" }],
			},
		],
	},
	{
		seo: { title: "Portrait Focus" },
		brand: { businessName: "Portrait" },
		layoutDNA: {
			spacingRhythm: "balanced",
			gridSystem: "grid-overlay",
			visualTempo: "intimate",
			scanPath: "horizontal",
		},
		sections: [
			{
				type: "gallery",
				heading: "Portrait Focus",
				description: "Portrait and texture imagery in a balanced frame",
				media: {
					src: "https://example.com/portrait3.jpg",
					classification: "portrait",
				},
			},
		],
		narrativeCompositions: [
			{
				id: "comp-9",
				narrativePurpose: "showcase-work",
				visualBehavior: "cinematic-reveal",
				scanPattern: "horizontal",
				densityMode: "balanced",
				geometrySystem: "grid-overlay",
				contentType: "showcase",
				viewportRatio: 0.85,
				images: [
					{
						src: "https://example.com/portrait3.jpg",
						classification: "portrait",
						aspectRatio: 0.65,
					},
				],
				heading: "Portrait Focus",
				description:
					"Portrait-oriented media in a composition that should remain unique.",
				actions: [{ label: "See Gallery", href: "#" }],
			},
		],
	},
	{
		seo: { title: "Texture Mood" },
		brand: { businessName: "Tactile" },
		layoutDNA: {
			spacingRhythm: "relaxed",
			gridSystem: "asymmetric",
			visualTempo: "luxury",
			scanPath: "spiral",
		},
		sections: [
			{
				type: "feature",
				heading: "Texture Mood",
				description: "Macro and texture media with calm spacing",
				media: {
					src: "https://example.com/texture2.jpg",
					classification: "texture",
				},
			},
		],
		narrativeCompositions: [
			{
				id: "comp-10",
				narrativePurpose: "build-emotion",
				visualBehavior: "editorial-asymmetry",
				scanPattern: "spiral",
				densityMode: "relaxed",
				geometrySystem: "overlap-plane",
				contentType: "narrative",
				viewportRatio: 0.95,
				images: [
					{
						src: "https://example.com/texture2.jpg",
						classification: "texture",
						aspectRatio: 1.3,
					},
				],
				heading: "Texture Mood",
				description:
					"A tactile composition that should avoid generic stacky fallback.",
				actions: [{ label: "Explore", href: "#" }],
			},
		],
	},
];

function countMatches(value: string, pattern: RegExp): number {
	return value.match(pattern)?.length ?? 0;
}

function extractEngine(html: string): string {
	const match = html.match(/class=\"composition composition-([a-zA-Z]+)\b/);
	return match ? match[1] : "unknown";
}

function analyzeCss(css: string) {
	const mobileRules = /@media \(max-width: 980px\) \{([\s\S]*)\}$/m.exec(css);
	const mobileCss = mobileRules ? mobileRules[1] : "";
	return {
		sharedResponsiveRuleCount: countMatches(
			mobileCss,
			/grid-template-columns:\s*1fr/g,
		),
		engineMobileRules: {
			editorialOverlap: mobileCss.includes(
				".composition-editorialOverlap .composition-shell",
			),
			brutalistGrid: mobileCss.includes(
				".composition-brutalistGrid .brutalist-grid-shell",
			),
			galleryStack: mobileCss.includes(
				".composition-galleryStack .gallery-stack",
			),
			offsetLayer: mobileCss.includes(".composition-offsetLayer .offset-frame"),
			kineticDiagonal: mobileCss.includes(
				".composition-kineticDiagonal .kinetic-frame",
			),
		},
		classificationAware: countMatches(
			css,
			/data-classification|\[data-classification/g,
		),
		gridTemplates: countMatches(css, /grid-template-columns:/g),
		transforms: countMatches(css, /transform:/g),
		negativeSpaceOps: countMatches(
			css,
			/translate\(|perspective\(|rotateX\(|skewY\(/g,
		),
	};
}

const summary = schemas.map((schema, index) => {
	const preview = renderCompositionPreviewDocument(schema);
	const engine = extractEngine(preview);
	const counts = {
		sections: countMatches(preview, /<section/g),
		divs: countMatches(preview, /<div/g),
		images: countMatches(preview, /composition-image/g),
		headings: countMatches(preview, /<h2/g),
		paragraphs: countMatches(preview, /<p/g),
		actions: countMatches(preview, /composition-cta/g),
	};
	const css = renderCompositionExperience(schema).css;
	return {
		sample: index + 1,
		title: schema.seo?.title,
		engine,
		densityMode: schema.narrativeCompositions?.[0]?.densityMode,
		geometrySystem: schema.narrativeCompositions?.[0]?.geometrySystem,
		visualBehavior: schema.narrativeCompositions?.[0]?.visualBehavior,
		contentType: schema.narrativeCompositions?.[0]?.contentType,
		htmlLength: preview.length,
		counts,
		responsiveCounts: {
			gridTemplateCount: countMatches(css, /grid-template-columns:/g),
			mobileGridCollapseCount: analyzeCss(css).sharedResponsiveRuleCount,
			totalTransformCount: analyzeCss(css).transforms,
			negativeSpaceCount: analyzeCss(css).negativeSpaceOps,
			classificationAwareRules: analyzeCss(css).classificationAware,
		},
	};
});

console.log(JSON.stringify(summary, null, 2));
