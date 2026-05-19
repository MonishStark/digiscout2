/** @format */

import { WebsiteSchema } from "../types";
import {
	ImageIntelligence,
	LayoutDNA,
	NarrativeComposition,
	TypographyBehavior,
	MotionLanguage,
	VisualEntropyScore,
} from "./composition-architecture";

export interface CompositionRenderResult {
	html: string;
	css: string;
}

type RenderingTokens = {
	palette: {
		background: string;
		surface: string;
		primary: string;
		accent: string;
		text: string;
		muted: string;
		outline: string;
	};
	spacing: {
		sectionGap: string;
		sectionPadding: string;
		panelGap: string;
		imageGap: string;
		textGap: string;
	};
	typography: {
		heading: string;
		body: string;
		headingScale: string;
		subheadingScale: string;
		bodyScale: string;
		labelScale: string;
	};
	radius: {
		soft: string;
		card: string;
		overlay: string;
	};
	shadow: {
		light: string;
		medium: string;
		deep: string;
	};
	motion: {
		ease: string;
		duration: string;
		reveal: string;
	};
};

type RendererTokenOverrides = Partial<{
	palette: Partial<RenderingTokens["palette"]>;
	typography: Partial<{
		heading: string;
		body: string;
		scaleHero: string;
		scaleH2: string;
		scaleBody: string;
		labelScale: string;
	}>;
	spacing: Partial<{
		sectionY: string;
		sectionYTight: string;
		gutter: string;
		cardPad: string;
	}>;
	motion: Partial<{ revealDuration: string; ease: string }>;
}>;

function applyTokenOverrides(
	tokens: RenderingTokens,
	overrides?: RendererTokenOverrides,
): RenderingTokens {
	if (!overrides) {
		return tokens;
	}
	return {
		...tokens,
		palette: { ...tokens.palette, ...(overrides.palette || {}) },
		typography: {
			...tokens.typography,
			headingScale:
				overrides.typography?.scaleHero ||
				overrides.typography?.scaleH2 ||
				tokens.typography.headingScale,
			subheadingScale:
				overrides.typography?.scaleH2 || tokens.typography.subheadingScale,
			bodyScale: overrides.typography?.scaleBody || tokens.typography.bodyScale,
			labelScale:
				overrides.typography?.labelScale || tokens.typography.labelScale,
			heading: overrides.typography?.heading || tokens.typography.heading,
			body: overrides.typography?.body || tokens.typography.body,
		},
		spacing: {
			...tokens.spacing,
			sectionGap: overrides.spacing?.sectionY || tokens.spacing.sectionGap,
			sectionPadding:
				overrides.spacing?.cardPad || tokens.spacing.sectionPadding,
		},
		motion: {
			...tokens.motion,
			duration: overrides.motion?.revealDuration || tokens.motion.duration,
			ease: overrides.motion?.ease || tokens.motion.ease,
			reveal: tokens.motion.reveal,
		},
	};
}

const DEFAULT_TOKENS: RenderingTokens = {
	palette: {
		background: "#09090b",
		surface: "#111115",
		primary: "#7c3aed",
		accent: "#22d3ee",
		text: "#f8fafc",
		muted: "#cbd5e1",
		outline: "rgba(255,255,255,0.14)",
	},
	spacing: {
		sectionGap: "3.5rem",
		sectionPadding: "3rem",
		panelGap: "2rem",
		imageGap: "1.25rem",
		textGap: "1.5rem",
	},
	typography: {
		heading: "Inter, ui-sans-serif, system-ui, sans-serif",
		body: "Inter, ui-sans-serif, system-ui, sans-serif",
		headingScale: "clamp(2.25rem, 5vw, 4.5rem)",
		subheadingScale: "clamp(1.2rem, 2vw, 1.6rem)",
		bodyScale: "1rem",
		labelScale: "0.8rem",
	},
	radius: {
		soft: "24px",
		card: "28px",
		overlay: "32px",
	},
	shadow: {
		light: "0 18px 55px rgba(0,0,0,0.12)",
		medium: "0 30px 80px rgba(0,0,0,0.18)",
		deep: "0 40px 110px rgba(0,0,0,0.24)",
	},
	motion: {
		ease: "cubic-bezier(0.22, 1, 0.36, 1)",
		duration: "480ms",
		reveal: "120ms",
	},
};

const SPACING_MAP: Record<string, string> = {
	compact: "1.1rem",
	balanced: "2rem",
	airy: "3.25rem",
	"luxury-editorial": "4rem",
	"rhythmic-breathing": "4.5rem",
	"sparse-breathing": "5rem",
	"brutalist-dense": "1.25rem",
	tight: "1.4rem",
	relaxed: "3rem",
};

const RADIUS_MAP: Record<string, string> = {
	soft: "18px",
	card: "24px",
	overlay: "32px",
	rounded: "36px",
	pill: "999px",
	circle: "50%",
};

const SHADOW_MAP: Record<string, string> = {
	light: "0 18px 40px rgba(0,0,0,0.1)",
	medium: "0 28px 70px rgba(0,0,0,0.16)",
	deep: "0 42px 110px rgba(0,0,0,0.22)",
	soft: "0 12px 28px rgba(0,0,0,0.08)",
	premium: "0 30px 100px rgba(0,0,0,0.24)",
};

const TEXT_SCALE_MAP: Record<string, string> = {
	small: "0.95rem",
	medium: "1rem",
	large: "1.15rem",
	heading: "clamp(2.75rem, 5vw, 4.5rem)",
	subheading: "clamp(1.2rem, 2vw, 1.75rem)",
};

const MOTION_EASING_MAP: Record<string, string> = {
	subtle: "cubic-bezier(0.25,0.8,0.5,1)",
	kinetic: "cubic-bezier(0.18,1.0,0.4,1)",
	cinematic: "cubic-bezier(0.22,1,0.36,1)",
	instant: "linear",
};

const MOTION_DURATION_MAP: Record<string, string> = {
	slow: "820ms",
	standard: "520ms",
	fast: "360ms",
};

function normalizeCssValue(
	value: string | undefined,
	fallback: string,
): string {
	if (!value) {
		return fallback;
	}
	const normalized = value.trim().toLowerCase();
	if (/^(\d+(?:\.\d+)?)(px|rem|em|vw|vh|%)$/.test(normalized)) {
		return normalized;
	}
	if (SPACING_MAP[normalized]) {
		return SPACING_MAP[normalized];
	}
	if (RADIUS_MAP[normalized]) {
		return RADIUS_MAP[normalized];
	}
	if (SHADOW_MAP[normalized]) {
		return SHADOW_MAP[normalized];
	}
	if (TEXT_SCALE_MAP[normalized]) {
		return TEXT_SCALE_MAP[normalized];
	}
	if (MOTION_EASING_MAP[normalized]) {
		return MOTION_EASING_MAP[normalized];
	}
	if (MOTION_DURATION_MAP[normalized]) {
		return MOTION_DURATION_MAP[normalized];
	}
	return fallback;
}

function normalizeHeadingScale(value: string | undefined): string {
	if (!value) {
		return DEFAULT_TOKENS.typography.headingScale;
	}
	const normalized = value.trim().toLowerCase();
	if (TEXT_SCALE_MAP[normalized]) {
		return TEXT_SCALE_MAP[normalized];
	}
	return value.trim();
}

function escapeHtml(value: string): string {
	return (value || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function getPrimaryImageClassification(
	composition: NarrativeComposition,
): string {
	return composition.images?.[0]?.classification || "none";
}

function getImageAspect(composition: NarrativeComposition): string {
	const ratio = composition.images?.[0]?.aspectRatio;
	if (!ratio) {
		return "medium";
	}
	if (ratio < 0.8) {
		return "portrait";
	}
	if (ratio > 1.4) {
		return "landscape";
	}
	return "square";
}

function sectionDataAttributes(composition: NarrativeComposition): string {
	return `data-image-classification="${escapeHtml(
		getPrimaryImageClassification(composition),
	)}" data-image-aspect="${escapeHtml(getImageAspect(composition))}"`;
}

function safeHref(href: string | undefined): string {
	const trimmed = (href || "").trim();
	return trimmed && trimmed !== "#" ? trimmed : "#contact";
}

function safeLabel(label: string | undefined, fallback = "Learn More"): string {
	const trimmed = (label || "").trim();
	return trimmed || fallback;
}

function buildRenderingTokens(schema: WebsiteSchema): RenderingTokens {
	const theme = schema.theme || ({} as any);
	const layoutDNA = schema.layoutDNA || ({} as LayoutDNA);
	const palette = {
		...DEFAULT_TOKENS.palette,
		...(theme.palette || {}),
	};

	const densityHint = layoutDNA.spacingRhythm || theme.density || "balanced";
	const sectionGap = normalizeCssValue(
		SPACING_MAP[densityHint] || densityHint,
		DEFAULT_TOKENS.spacing.sectionGap,
	);
	const sectionPadding = normalizeCssValue(
		theme.edgePadding ||
			(layoutDNA.spacingRhythm?.includes("luxury")
				? "4rem"
				: layoutDNA.spacingRhythm === "brutalist-dense"
					? "2rem"
					: "2.75rem"),
		DEFAULT_TOKENS.spacing.sectionPadding,
	);

	const panelGap = normalizeCssValue(
		theme.panelGap ||
			(layoutDNA.spacingRhythm === "brutalist-dense" ? "1.4rem" : "2rem"),
		DEFAULT_TOKENS.spacing.panelGap,
	);
	const imageGap = normalizeCssValue(
		theme.imageGap ||
			(layoutDNA.gridSystem === "asymmetric" ? "1.5rem" : "1rem"),
		DEFAULT_TOKENS.spacing.imageGap,
	);
	const textGap = normalizeCssValue(
		theme.textGap ||
			(layoutDNA.visualTempo?.includes("kinetic") ? "1rem" : "1.3rem"),
		DEFAULT_TOKENS.spacing.textGap,
	);

	const headingScale = normalizeHeadingScale(
		theme.typography?.headingScale ||
			(layoutDNA.dominantAxis === "vertical"
				? "clamp(3rem, 6vw, 5rem)"
				: "clamp(2.25rem, 5vw, 4.5rem)"),
	);
	const subheadingScale = normalizeHeadingScale(
		theme.typography?.subheadingScale ||
			(layoutDNA.visualTempo?.includes("kinetic")
				? "clamp(1.1rem, 2vw, 1.45rem)"
				: "clamp(1.2rem, 2vw, 1.6rem)"),
	);

	return {
		palette,
		spacing: {
			sectionGap,
			sectionPadding,
			panelGap,
			imageGap,
			textGap,
		},
		typography: {
			heading: theme.typography?.heading || DEFAULT_TOKENS.typography.heading,
			body: theme.typography?.body || DEFAULT_TOKENS.typography.body,
			headingScale,
			subheadingScale,
			bodyScale: normalizeCssValue(
				theme.typography?.bodyScale || "1rem",
				DEFAULT_TOKENS.typography.bodyScale,
			),
			labelScale: normalizeCssValue(
				theme.typography?.labelScale || "0.85rem",
				DEFAULT_TOKENS.typography.labelScale,
			),
		},
		radius: {
			soft: normalizeCssValue(
				theme.radius || DEFAULT_TOKENS.radius.soft,
				DEFAULT_TOKENS.radius.soft,
			),
			card: normalizeCssValue(
				theme.cardRadius || DEFAULT_TOKENS.radius.card,
				DEFAULT_TOKENS.radius.card,
			),
			overlay: normalizeCssValue(
				theme.overlayRadius || DEFAULT_TOKENS.radius.overlay,
				DEFAULT_TOKENS.radius.overlay,
			),
		},
		shadow: {
			light: normalizeCssValue(
				theme.lightShadow || DEFAULT_TOKENS.shadow.light,
				DEFAULT_TOKENS.shadow.light,
			),
			medium: normalizeCssValue(
				theme.mediumShadow || DEFAULT_TOKENS.shadow.medium,
				DEFAULT_TOKENS.shadow.medium,
			),
			deep: normalizeCssValue(
				theme.deepShadow || DEFAULT_TOKENS.shadow.deep,
				DEFAULT_TOKENS.shadow.deep,
			),
		},
		motion: {
			ease: normalizeCssValue(theme.motionEase, DEFAULT_TOKENS.motion.ease),
			duration: normalizeCssValue(
				theme.motionDuration,
				DEFAULT_TOKENS.motion.duration,
			),
			reveal: normalizeCssValue(
				theme.motionReveal,
				DEFAULT_TOKENS.motion.reveal,
			),
		},
	};
}

function titleFromPurpose(purpose: string): string {
	return purpose
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (match) => match.toUpperCase());
}

function ensureImagePool(
	section: any,
	schema: WebsiteSchema,
): ImageIntelligence[] {
	const images: ImageIntelligence[] = [];
	const addImage = (src: string, fallbackClass: string) => {
		if (!src) {
			return;
		}
		images.push({
			src,
			classification: fallbackClass as any,
			dominantColor: "#888888",
			aspectRatio: 1.78,
			hasText: false,
			hasfaces: false,
			emotionalTone: "professional",
			suggestedTreatment: "contained",
		});
	};

	if (section?.media?.src) {
		addImage(section.media.src, section.media.classification || "landscape");
	}

	if (Array.isArray(section?.items)) {
		for (const item of section.items) {
			if (item?.src) {
				addImage(item.src, item.classification || "product-isolated");
			}
		}
	}

	if (images.length === 0 && Array.isArray(schema.sections)) {
		const heroImage = schema.sections
			.map((s) => (s as any)?.media?.src || (s as any)?.items?.[0]?.src)
			.find(Boolean);
		if (heroImage) {
			addImage(heroImage, "landscape");
		}
	}

	return images;
}

function hasStrongImagery(schema: WebsiteSchema): boolean {
	return (schema.sections || []).some((section) =>
		Boolean((section as any)?.media?.src || (section as any)?.items?.length),
	);
}

function normalizeCompositionHeading(
	value?: string,
	fallback?: string,
): string {
	return escapeHtml(value || fallback || "");
}

function deriveCompositions(schema: WebsiteSchema): NarrativeComposition[] {
	if (schema.narrativeCompositions?.length) {
		return schema.narrativeCompositions;
	}

	const categories = (schema.brand?.category || "").toLowerCase();
	const strongImages = hasStrongImagery(schema);
	return (schema.sections || []).map((section: any, index: number) => {
		const type = section.type || "section";
		const purpose = {
			hero: "establish-authority",
			feature: "explain-process",
			features: "explain-process",
			gallery: "showcase-work",
			testimonial: "prove-credibility",
			faq: "explain-process",
			contact: "close-conversion",
			about: "build-emotion",
			service: "generate-desire",
		}.hasOwnProperty(type)
			? ({
					hero: "establish-authority",
					feature: "explain-process",
					features: "explain-process",
					gallery: "showcase-work",
					testimonial: "prove-credibility",
					faq: "explain-process",
					contact: "close-conversion",
					about: "build-emotion",
					service: "generate-desire",
				}[type] as string)
			: "generate-desire";

		const visualBehavior = strongImages
			? {
					hero: "immersive-overlap",
					feature: "editorial-asymmetry",
					features: "editorial-asymmetry",
					gallery: "kinetic-stagger",
					testimonial: "intimate-paired",
					faq: "editorial-asymmetry",
					contact: "intimate-breathe",
					about: "monumental-scale",
					service: "cinematic-reveal",
				}[type]
			: {
					hero: "cinematic-reveal",
					feature: "editorial-asymmetry",
					features: "editorial-asymmetry",
					gallery: "brutalist-stack",
					testimonial: "intimate-paired",
					faq: "editorial-asymmetry",
					contact: "intimate-breathe",
					about: "intimate-breathe",
					service: "editorial-asymmetry",
				}[type] || "editorial-asymmetry";

		const densityMode =
			section?.density || schema.layoutDNA?.spacingRhythm || "balanced";
		const composition: NarrativeComposition = {
			id: `composition-${index + 1}`,
			narrativePurpose: purpose as any,
			visualBehavior: visualBehavior as any,
			scanPattern:
				section?.scanPattern ||
				schema.layoutDNA?.scanPath ||
				"diagonal-ascending",
			densityMode: densityMode,
			geometrySystem:
				section?.layoutMode ||
				(schema.layoutDNA?.gridSystem === "asymmetric"
					? "overlap-plane"
					: "grid-overlay"),
			contentType:
				type === "gallery"
					? "showcase"
					: type === "hero"
						? "hero"
						: type === "testimonial"
							? "proof"
							: type === "contact"
								? "interaction"
								: "narrative",
			viewportRatio: section?.viewportRatio || (type === "hero" ? 1.1 : 0.7),
			images: ensureImagePool(section, schema),
			heading: normalizeCompositionHeading(
				section?.heading || section?.title || section?.name,
				section?.subtitle || section?.tagline,
			),
			description: normalizeCompositionHeading(
				section?.description ||
					section?.body ||
					section?.intro ||
					section?.summary,
				section?.copy || "",
			),
			actions: (section?.actions || section?.ctas || []).map((action: any) => ({
				label: safeLabel(action?.label, action?.text || "Learn More"),
				href: safeHref(action?.href || action?.url),
				style: action?.style === "secondary" ? "secondary" : "primary",
			})),
			proofElements: [
				...(section?.testimonials || []),
				...(section?.stats || []),
			].map((item: any) => ({
				type: item?.type || (item?.author ? "testimonial" : "stat"),
				content: escapeHtml(
					item?.copy || item?.content || item?.text || item?.label || "",
				),
				author: item?.author,
			})),
			motionLanguage: {
				entryTrigger: section?.motionTrigger || "on-scroll",
				entryType:
					section?.motionType ||
					(visualBehavior === "kinetic-stagger" ? "slide" : "fade"),
				internalMotion: section?.motionEnergy || "subtle",
			},
			styling: {
				backgroundColor:
					section?.background || schema.theme?.palette?.background,
				textColor: section?.textColor || schema.theme?.palette?.text,
				accentColor: section?.accentColor || schema.theme?.palette?.accent,
				typographySize: section?.typographySize || "medium",
				typographyWeight: section?.typographyWeight || "regular",
			},
		};

		return composition;
	});
}

function chooseEngine(
	composition: NarrativeComposition,
	schema: WebsiteSchema,
): string {
	if (composition.visualBehavior === "immersive-overlap") {
		return "cinematicImmersive";
	}
	if (composition.visualBehavior === "kinetic-stagger") {
		return "kineticDiagonal";
	}
	if (composition.visualBehavior === "brutalist-stack") {
		return "brutalistGrid";
	}
	if (composition.visualBehavior === "monumental-scale") {
		return "editorialOverlap";
	}
	if (
		composition.visualBehavior === "intimate-paired" ||
		composition.visualBehavior === "intimate-breathe"
	) {
		return "atmosphericMinimal";
	}
	if (composition.visualBehavior === "cinematic-reveal") {
		return "galleryStack";
	}
	return composition.contentType === "showcase"
		? "galleryStack"
		: composition.contentType === "interaction"
			? "offsetLayer"
			: "editorialOverlap";
}

function renderActions(actions: NarrativeComposition["actions"] = []): string {
	if (!actions || !actions.length) {
		return "";
	}
	return `<div class="composition-actions">${actions
		.map(
			(action) =>
				`<a class="composition-cta cta-${escapeHtml(action.style)}" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`,
		)
		.join("")}</div>`;
}

function renderProof(composition: NarrativeComposition): string {
	if (!composition.proofElements || !composition.proofElements.length) {
		return "";
	}
	return `<div class="composition-proof">${composition.proofElements
		.map(
			(proof) =>
				`<span class="proof-item proof-${escapeHtml(proof.type)}">${escapeHtml(
					proof.content,
				)}</span>`,
		)
		.join("")}</div>`;
}

function renderMedia(
	composition: NarrativeComposition,
	engine: string,
): string {
	if (!composition.images || !composition.images.length) {
		return `<div class="composition-graphic composition-no-image"><div class="graphic-label">${escapeHtml(
			composition.heading || composition.narrativePurpose.replace(/-/g, " "),
		)}</div></div>`;
	}

	return composition.images
		.map(
			(image, idx) =>
				`<div class="composition-image image-${idx + 1}" style="background-image:url('${escapeHtml(
					image.src,
				)}');" data-classification="${escapeHtml(image.classification)}"></div>`,
		)
		.join("");
}

function compositionClassNames(
	composition: NarrativeComposition,
	engine: string,
): string {
	return [
		"composition",
		`composition-${engine}`,
		`geometry-${composition.geometrySystem}`,
		`behavior-${composition.visualBehavior}`,
		`density-${composition.densityMode}`,
		`scan-${composition.scanPattern}`,
	].join(" ");
}

function renderCinematicImmersive(
	composition: NarrativeComposition,
	tokens: RenderingTokens,
): string {
	const images = renderMedia(composition, "cinematicImmersive");
	return `<section class="${compositionClassNames(
		composition,
		"cinematicImmersive",
	)}" ${sectionDataAttributes(composition)} style="background: radial-gradient(circle at top left, ${escapeHtml(
		composition.styling?.accentColor || tokens.palette.accent,
	)}22, transparent 32%);">
		<div class="cinematic-shell">
			<div class="cinematic-hero">${images}</div>
			<aside class="cinematic-copy">
				<span class="composition-purpose">${escapeHtml(
					composition.narrativePurpose.replace(/-/g, " "),
				)}</span>
				<h2>${escapeHtml(
					composition.heading || titleFromPurpose(composition.narrativePurpose),
				)}</h2>
				<p>${escapeHtml(
					composition.description ||
						"A cinematic composition that layers imagery with typographic clarity.",
				)}</p>
				${renderActions(composition.actions)}
				${renderProof(composition)}
			</aside>
		</div>
	</section>`;
}

function renderEditorialOverlap(
	composition: NarrativeComposition,
	tokens: RenderingTokens,
): string {
	const images = renderMedia(composition, "editorialOverlap");
	return `<section class="${compositionClassNames(
		composition,
		"editorialOverlap",
	)}" ${sectionDataAttributes(composition)}">
		<div class="editorial-shell">
			<div class="editorial-visual">${images}</div>
			<div class="editorial-copy">
				<span class="composition-purpose">${escapeHtml(
					composition.narrativePurpose.replace(/-/g, " "),
				)}</span>
				<h2>${escapeHtml(
					composition.heading || titleFromPurpose(composition.narrativePurpose),
				)}</h2>
				<p>${escapeHtml(
					composition.description ||
						"An editorial overlap composition with layered hierarchy and rich spacing.",
				)}</p>
				${renderProof(composition)}
				${renderActions(composition.actions)}
			</div>
		</div>
	</section>`;
}

function renderBrutalistGrid(
	composition: NarrativeComposition,
	tokens: RenderingTokens,
): string {
	const images = renderMedia(composition, "brutalistGrid");
	return `<section class="${compositionClassNames(
		composition,
		"brutalistGrid",
	)}" ${sectionDataAttributes(composition)}">
		<div class="brutalist-grid-shell">
			<div class="brutalist-intro">
				<span class="composition-purpose">${escapeHtml(
					composition.narrativePurpose.replace(/-/g, " "),
				)}</span>
				<h2>${escapeHtml(
					composition.heading || titleFromPurpose(composition.narrativePurpose),
				)}</h2>
				<p>${escapeHtml(
					composition.description ||
						"A bold, grid-driven composition built for high-impact visual density.",
				)}</p>
				${renderActions(composition.actions)}
			</div>
			<div class="brutalist-image-grid">${images}</div>
			${renderProof(composition)}
		</div>
	</section>`;
}

function renderGalleryStack(
	composition: NarrativeComposition,
	tokens: RenderingTokens,
): string {
	const images = renderMedia(composition, "galleryStack");
	return `<section class="${compositionClassNames(
		composition,
		"galleryStack",
	)}" ${sectionDataAttributes(composition)}">
		<div class="gallery-shell">
			<header class="gallery-heading">
				<span class="composition-purpose">${escapeHtml(
					composition.narrativePurpose.replace(/-/g, " "),
				)}</span>
				<h2>${escapeHtml(
					composition.heading || titleFromPurpose(composition.narrativePurpose),
				)}</h2>
				<p>${escapeHtml(
					composition.description ||
						"A stacked gallery composition that retains playfulness in its rhythm.",
				)}</p>
				${renderActions(composition.actions)}
			</header>
			<div class="gallery-stack">${images}</div>
			${renderProof(composition)}
		</div>
	</section>`;
}

function renderOffsetLayer(
	composition: NarrativeComposition,
	tokens: RenderingTokens,
): string {
	const images = renderMedia(composition, "offsetLayer");
	return `<section class="${compositionClassNames(composition, "offsetLayer")}" ${sectionDataAttributes(composition)}">
		<div class="offset-frame">
			<div class="offset-copy">
				<span class="composition-purpose">${escapeHtml(
					composition.narrativePurpose.replace(/-/g, " "),
				)}</span>
				<h2>${escapeHtml(
					composition.heading || titleFromPurpose(composition.narrativePurpose),
				)}</h2>
				<p>${escapeHtml(
					composition.description ||
						"A layered offset composition that keeps motion and pacing alive.",
				)}</p>
				${renderActions(composition.actions)}
				${renderProof(composition)}
			</div>
			<div class="offset-canvas">${images}</div>
		</div>
	</section>`;
}

function renderAtmosphericMinimal(
	composition: NarrativeComposition,
	tokens: RenderingTokens,
): string {
	const images = renderMedia(composition, "atmosphericMinimal");
	return `<section class="${compositionClassNames(
		composition,
		"atmosphericMinimal",
	)}" ${sectionDataAttributes(composition)}">
		<div class="atmospheric-shell">
			<div class="atmospheric-text">
				<span class="composition-purpose">${escapeHtml(
					composition.narrativePurpose.replace(/-/g, " "),
				)}</span>
				<h2>${escapeHtml(
					composition.heading || titleFromPurpose(composition.narrativePurpose),
				)}</h2>
				<p>${escapeHtml(
					composition.description ||
						"A typography-forward composition that thrives without strong imagery.",
				)}</p>
				${renderActions(composition.actions)}
				${renderProof(composition)}
			</div>
			<div class="atmospheric-visual">${images}</div>
		</div>
	</section>`;
}

function renderKineticDiagonal(
	composition: NarrativeComposition,
	tokens: RenderingTokens,
): string {
	const images = renderMedia(composition, "kineticDiagonal");
	return `<section class="${compositionClassNames(
		composition,
		"kineticDiagonal",
	)}" ${sectionDataAttributes(composition)}">
		<div class="kinetic-wrap">
			<div class="kinetic-frame">
				<div class="kinetic-media">${images}</div>
				<div class="kinetic-copy">
					<span class="composition-purpose">${escapeHtml(
						composition.narrativePurpose.replace(/-/g, " "),
					)}</span>
					<h2>${escapeHtml(
						composition.heading ||
							titleFromPurpose(composition.narrativePurpose),
					)}</h2>
					<p>${escapeHtml(
						composition.description ||
							"A diagonal kinetic layout that emphasizes movement and layered geometry.",
					)}</p>
					${renderActions(composition.actions)}
					${renderProof(composition)}
				</div>
			</div>
		</div>
	</section>`;
}

function renderCompositionBlock(
	composition: NarrativeComposition,
	tokens: RenderingTokens,
	index: number,
	schema: WebsiteSchema,
): string {
	const engine = chooseEngine(composition, schema);
	switch (engine) {
		case "cinematicImmersive":
			return renderCinematicImmersive(composition, tokens);
		case "brutalistGrid":
			return renderBrutalistGrid(composition, tokens);
		case "galleryStack":
			return renderGalleryStack(composition, tokens);
		case "offsetLayer":
			return renderOffsetLayer(composition, tokens);
		case "atmosphericMinimal":
			return renderAtmosphericMinimal(composition, tokens);
		case "kineticDiagonal":
			return renderKineticDiagonal(composition, tokens);
		case "editorialOverlap":
		default:
			return renderEditorialOverlap(composition, tokens);
	}
}

function buildBaseCss(tokens: RenderingTokens): string {
	return `
:root {
	--bg: ${tokens.palette.background};
	--surface: ${tokens.palette.surface};
	--primary: ${tokens.palette.primary};
	--accent: ${tokens.palette.accent};
	--text: ${tokens.palette.text};
	--muted: ${tokens.palette.muted};
	--outline: ${tokens.palette.outline};
	--section-gap: ${tokens.spacing.sectionGap};
	--section-padding: ${tokens.spacing.sectionPadding};
	--panel-gap: ${tokens.spacing.panelGap};
	--image-gap: ${tokens.spacing.imageGap};
	--text-gap: ${tokens.spacing.textGap};
	--radius-soft: ${tokens.radius.soft};
	--radius-card: ${tokens.radius.card};
	--radius-overlay: ${tokens.radius.overlay};
	--shadow-light: ${tokens.shadow.light};
	--shadow-medium: ${tokens.shadow.medium};
	--shadow-deep: ${tokens.shadow.deep};
	--motion-ease: ${tokens.motion.ease};
	--motion-duration: ${tokens.motion.duration};
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; background: var(--bg); color: var(--text); }
body { font-family: ${tokens.typography.body}; line-height: 1.6; }
main.page-grid { display: grid; gap: clamp(2rem, 4vw, 4rem); padding: clamp(1.5rem, 3vw, 3rem); }
.composition { position: relative; overflow: hidden; border-radius: var(--radius-card); padding: 0; }
.composition::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent 36%); }
.composition-shell,
.cinematic-shell,
.gallery-shell,
.brutalist-shell,
.offset-shell { position: relative; display: grid; gap: var(--panel-gap); }
.composition-purpose { display: inline-flex; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.24em; font-size: ${tokens.typography.labelScale}; color: var(--accent); }
.composition-actions { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1.8rem; }
.composition-cta { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 0.95rem 1.5rem; border-radius: 999px; font-weight: 700; transition: transform var(--motion-duration) var(--motion-ease), box-shadow var(--motion-duration) var(--motion-ease); }
.composition-cta:hover { transform: translateY(-1px); }
.cta-primary { background: var(--primary); color: #ffffff; }
.cta-secondary { background: transparent; border: 1px solid var(--outline); color: var(--text); }
.composition-proof { display: flex; flex-wrap: wrap; gap: 0.9rem; margin-top: 1.5rem; }
.proof-item { display: inline-flex; align-items: center; padding: 0.85rem 1rem; border-radius: 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06); color: var(--text); font-size: 0.95rem; }
.composition-media { display: grid; gap: var(--image-gap); }
.composition-image { min-height: 280px; background-size: cover; background-position: center center; border-radius: var(--radius-soft); box-shadow: var(--shadow-light); transition: transform var(--motion-duration) var(--motion-ease), opacity var(--motion-duration) var(--motion-ease); }
.composition-no-image { min-height: 320px; display: grid; place-items: center; text-align: center; padding: 2rem; color: var(--muted); background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08)); border-radius: var(--radius-soft); }
.composition-no-image .graphic-label { font-size: ${tokens.typography.subheadingScale}; color: var(--text); max-width: 28rem; }
`;
}

function buildEngineStyles(tokens: RenderingTokens): string {
	return `
.composition-editorialOverlap .composition-shell { grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr); align-items: stretch; gap: calc(var(--panel-gap) * 1.2); }
.composition-editorialOverlap .editorial-copy { padding: var(--section-padding); background: rgba(17,17,21,0.84); backdrop-filter: blur(12px); border-radius: var(--radius-soft); box-shadow: var(--shadow-medium); }
.composition-editorialOverlap .editorial-visual { display: grid; gap: var(--image-gap); }
.composition-editorialOverlap .composition-image:nth-child(2) { transform: translate(12%, 18%); opacity: 0.94; }
.composition-editorialOverlap h2 { margin: 0 0 1.1rem; font-family: ${tokens.typography.heading}; font-size: clamp(2.3rem, 4vw, 3.4rem); line-height: 1.02; letter-spacing: -0.02em; }
.composition-editorialOverlap p { margin: 0; color: var(--muted); font-size: clamp(1rem, 1.1vw, 1.18rem); max-width: 56ch; }
@media (max-width: 980px) {
	.composition-editorialOverlap .composition-shell { grid-template-columns: 1fr; }
	.composition-editorialOverlap .editorial-copy { padding: 1.6rem; }
}

.composition-cinematicImmersive { min-height: clamp(55vh, 72vh, 88vh); }
.cinematic-shell { display: grid; gap: calc(var(--panel-gap) * 1.1); }
.cinematic-hero { display: grid; gap: var(--image-gap); }
.cinematic-hero .composition-image { min-height: 360px; box-shadow: var(--shadow-deep); filter: saturate(1.08); border-radius: var(--radius-card); }
.cinematic-copy { position: relative; align-self: end; padding: 2.75rem; background: rgba(12,12,16,0.92); border-radius: var(--radius-overlay); box-shadow: var(--shadow-deep); color: #f8fafc; }
.cinematic-copy .composition-purpose { color: var(--accent); }
.composition-cinematicImmersive h2 { margin: 0 0 1rem; font-family: ${tokens.typography.heading}; font-size: clamp(2.5rem, 4vw, 3.6rem); line-height: 1.04; }
.composition-cinematicImmersive p { margin: 0; color: rgba(248,250,252,0.86); font-size: clamp(1rem, 1.2vw, 1.25rem); max-width: 54ch; }
@media (max-width: 980px) {
	.composition-cinematicImmersive .cinematic-shell { grid-template-columns: 1fr; }
	.cinematic-copy { padding: 1.75rem; }
}

.composition-brutalistGrid .brutalist-grid-shell { grid-template-columns: 1fr 1fr; gap: calc(var(--panel-gap) * 1.3); align-items: start; }
.composition-brutalistGrid .brutalist-image-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--image-gap); }
.composition-brutalistGrid .composition-image { min-height: 220px; border-radius: 18px; box-shadow: var(--shadow-light); }
.composition-brutalistGrid .brutalist-intro { padding: var(--section-padding); background: rgba(18,18,22,0.96); border-radius: var(--radius-soft); }
.composition-brutalistGrid h2 { margin: 0 0 1rem; font-family: ${tokens.typography.heading}; font-size: clamp(2.1rem, 3.6vw, 3.2rem); line-height: 1.04; letter-spacing: 0.02em; }
.composition-brutalistGrid p { margin: 0; color: var(--muted); font-size: clamp(0.95rem, 1.0vw, 1.1rem); max-width: 60ch; }
@media (max-width: 980px) {
	.composition-brutalistGrid .brutalist-grid-shell { grid-template-columns: 1fr; }
	.composition-brutalistGrid .brutalist-intro { padding: 1.75rem; }
}

.composition-galleryStack .gallery-shell { display: grid; gap: calc(var(--panel-gap) * 1.05); }
.composition-galleryStack .gallery-stack { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: var(--image-gap); }
.composition-galleryStack .composition-image { min-height: 260px; transition: transform var(--motion-duration) var(--motion-ease); }
.composition-galleryStack .composition-image:nth-child(odd) { transform: translateY(6%); }
.composition-galleryStack h2 { margin: 0 0 1rem; font-family: ${tokens.typography.heading}; font-size: clamp(2.2rem, 3.8vw, 3.3rem); line-height: 1.04; }
.composition-galleryStack p { margin: 0; color: var(--muted); font-size: clamp(0.98rem, 1.05vw, 1.14rem); max-width: 58ch; }
@media (max-width: 980px) {
	.composition-galleryStack .gallery-stack { grid-template-columns: 1fr; }
}

.composition-offsetLayer .offset-frame { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr); gap: calc(var(--panel-gap) * 1.25); align-items: center; }
.composition-offsetLayer .offset-canvas { position: relative; transform: translateX(8%); }
.composition-offsetLayer .offset-copy { padding: var(--section-padding); background: rgba(255,255,255,0.06); border-radius: var(--radius-soft); box-shadow: var(--shadow-light); }
.composition-offsetLayer .composition-image { min-height: 260px; filter: grayscale(0.08); border-radius: var(--radius-soft); }
.composition-offsetLayer h2 { margin: 0 0 1rem; font-family: ${tokens.typography.heading}; font-size: clamp(2rem, 3.5vw, 3rem); line-height: 1.05; }
.composition-offsetLayer p { margin: 0; color: var(--muted); font-size: clamp(0.96rem, 1.02vw, 1.12rem); max-width: 52ch; }
@media (max-width: 980px) {
	.composition-offsetLayer .offset-frame { grid-template-columns: 1fr; }
	.composition-offsetLayer .offset-copy { padding: 1.75rem; }
}

.composition-atmosphericMinimal { background: radial-gradient(circle at top right, rgba(255,255,255,0.04), transparent 65%); }
.composition-atmosphericMinimal .atmospheric-shell { display: grid; grid-template-columns: 1fr; gap: calc(var(--panel-gap) * 1.15); align-items: center; }
.composition-atmosphericMinimal .atmospheric-text { padding: calc(var(--section-padding) * 1.2); background: rgba(7, 9, 11, 0.94); border-radius: var(--radius-overlay); box-shadow: var(--shadow-deep); }
.composition-atmosphericMinimal .atmospheric-visual { display: grid; gap: var(--image-gap); opacity: 0.95; }
.composition-atmosphericMinimal h2 { margin: 0 0 1rem; font-family: ${tokens.typography.heading}; font-size: clamp(2.4rem, 4vw, 3.5rem); line-height: 1.05; }
.composition-atmosphericMinimal p { margin: 0; color: var(--muted); font-size: clamp(0.98rem, 1.08vw, 1.18rem); max-width: 50ch; }
@media (max-width: 980px) {
	.composition-atmosphericMinimal .atmospheric-text { padding: 1.75rem; }
}

.composition-kineticDiagonal { min-height: 60vh; }
.composition-kineticDiagonal .kinetic-wrap { overflow: hidden; }
.composition-kineticDiagonal .kinetic-frame { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: var(--panel-gap); transform: skewY(-2deg); }
.composition-kineticDiagonal .kinetic-frame > * { transform: skewY(2deg); }
.composition-kineticDiagonal .composition-image { transition: transform 0.4s var(--motion-ease), filter 0.4s var(--motion-ease); }
.composition-kineticDiagonal:hover .composition-image { transform: translateY(-12px); filter: saturate(1.15); }
.composition-kineticDiagonal h2 { margin: 0 0 1rem; font-family: ${tokens.typography.heading}; font-size: clamp(2.3rem, 4vw, 3.4rem); line-height: 1.06; }
.composition-kineticDiagonal p { margin: 0; color: var(--muted); font-size: clamp(1rem, 1.1vw, 1.2rem); max-width: 54ch; }
@media (max-width: 980px) {
	.composition-kineticDiagonal .kinetic-frame { grid-template-columns: 1fr; transform: skewY(-1deg); }
	.kinetic-copy { padding: 1.75rem; }
}

.scan-diagonal-ascending .composition-shell,
.scan-spiral .composition-shell { transform: perspective(1200px) rotateX(0.3deg); }
.scan-horizontal .composition-shell { grid-auto-flow: column; }
.scan-vertical .composition-shell { grid-auto-flow: row; }
`;
}

export function renderCompositionExperience(
	schema: WebsiteSchema,
	tokenOverrides?: RendererTokenOverrides,
): CompositionRenderResult {
	const tokens = applyTokenOverrides(
		buildRenderingTokens(schema),
		tokenOverrides,
	);
	const compositions = deriveCompositions(schema);
	const html = compositions
		.map((composition, index) =>
			renderCompositionBlock(composition, tokens, index, schema),
		)
		.join("\n");
	const bodyCss = `${buildBaseCss(tokens)}\n${buildEngineStyles(tokens)}`;
	return { html, css: bodyCss };
}

export function renderCompositionPreviewDocument(
	schema: WebsiteSchema,
	tokenOverrides?: RendererTokenOverrides,
): string {
	const result = renderCompositionExperience(schema, tokenOverrides);
	return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(
		schema.seo?.title || schema.brand?.businessName || "Website Preview",
	)}</title><style>${result.css}</style></head><body><main class="page-grid">${result.html}</main></body></html>`;
}
