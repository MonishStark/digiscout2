/** @format */

import { Business, WebsiteSchema, WebsiteSection } from "../types";

export interface PipelineGenerationOptions {
	debugSession?: any;
	logStderr: (msg: string) => void;
	persistGenerationDebugFile: (
		session: any,
		fileName: string,
		content: any,
		append?: boolean,
	) => void;
	appendGenerationDebugError: (session: any, errorMsg: string) => void;
	llmJson: (promptOrContents: string | any[], contextLabel: string) => Promise<string>;
}

interface BusinessIntelligence {
	industryArchetype: string;
	customerDemographic: string;
	brandPersonality: string[];
	emotionalTone: string;
	trustStyle: string;
	localVisualCulture: string;
	conversionIntent: "bookings" | "walk-ins" | "consultations" | "commerce";
}

interface BrandStrategy {
	typographyPhilosophy: string;
	spacingPhilosophy: string;
	visualRhythm: string;
	compositionPhilosophy: string;
	interactionPhilosophy: string;
	motionLanguage: string;
	densityStrategy: string;
	asymmetryStrategy: string;
	imageryStrategy: string;
}

interface VisualMoodboard {
	references: string[];
	compositionStyles: string[];
	gridBehavior: string;
	whitespaceStrategy: string;
	editorialRhythm: string;
	colorAtmosphere: string;
	animationMood: string;
	imageTreatmentSystem: string;
}

interface LayoutSectionPlan {
	type: WebsiteSection["type"];
	priority: number;
	layoutMode: string;
	span: "full" | "wide" | "split";
	offset: number;
	density: "tight" | "balanced" | "airy";
	visualTension: "low" | "medium" | "high";
}

interface LayoutCompositionPlan {
	grid: {
		columns: number;
		maxWidth: string;
		gutters: string;
	};
	sections: LayoutSectionPlan[];
	heroMode: "immersive" | "editorial-split" | "systems";
	asymmetryBias: number;
	depthBias: number;
}

interface VisualCritique {
	whitespaceBalance: number;
	hierarchyStrength: number;
	compositionUniqueness: number;
	imageRhythm: number;
	ctaProminence: number;
	premiumFeel: number;
	issues: string[];
	refinementActions: string[];
}

interface VisualTokens {
	palette: {
		background: string;
		surface: string;
		primary: string;
		accent: string;
		text: string;
		muted: string;
		outline: string;
	};
	typography: {
		heading: string;
		body: string;
		scaleHero: string;
		scaleH2: string;
		scaleBody: string;
	};
	spacing: {
		sectionY: string;
		sectionYTight: string;
		gutter: string;
		cardPad: string;
	};
	motion: {
		revealDuration: string;
		ease: string;
	};
}

function hashSeed(value: string) {
	const input = value || "seed";
	let hash = 2166136261;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash +=
			(hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
	}
	return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}

function pick<T>(seed: string, values: T[]): T {
	const num = parseInt(seed, 16);
	return values[num % values.length];
}

function industryPreset(category: string) {
	const c = (category || "").toLowerCase();
	if (c.includes("law") || c.includes("attorney")) {
		return {
			archetype: "structured-authority",
			palette: {
				background: "#f4f3f1",
				surface: "#ffffff",
				primary: "#1f2a37",
				accent: "#9c7b4f",
				text: "#121722",
				muted: "#4f5b67",
				outline: "rgba(17,24,39,0.14)",
			},
			typography: { heading: "Fraunces", body: "Manrope" },
		};
	}
	if (c.includes("restaurant") || c.includes("cafe") || c.includes("bakery")) {
		return {
			archetype: "sensory-immersion",
			palette: {
				background: "#f8f5ef",
				surface: "#fffdf9",
				primary: "#6a2f1f",
				accent: "#d5862d",
				text: "#2a2018",
				muted: "#6d5945",
				outline: "rgba(42,32,24,0.12)",
			},
			typography: { heading: "Cormorant Garamond", body: "Sora" },
		};
	}
	if (c.includes("architecture") || c.includes("studio")) {
		return {
			archetype: "brutalist-editorial",
			palette: {
				background: "#efefed",
				surface: "#ffffff",
				primary: "#151515",
				accent: "#4f84ff",
				text: "#111111",
				muted: "#444444",
				outline: "rgba(0,0,0,0.18)",
			},
			typography: { heading: "Space Grotesk", body: "IBM Plex Sans" },
		};
	}
	if (c.includes("fitness") || c.includes("gym")) {
		return {
			archetype: "kinetic-energy",
			palette: {
				background: "#f2f6f9",
				surface: "#ffffff",
				primary: "#0f172a",
				accent: "#ff4d2d",
				text: "#10131a",
				muted: "#4b5563",
				outline: "rgba(15,23,42,0.15)",
			},
			typography: { heading: "Archivo", body: "Space Grotesk" },
		};
	}
	if (c.includes("saas") || c.includes("software") || c.includes("ai")) {
		return {
			archetype: "futuristic-systems",
			palette: {
				background: "#f6f7ff",
				surface: "#ffffff",
				primary: "#1e2a78",
				accent: "#23b6ff",
				text: "#121933",
				muted: "#5b6480",
				outline: "rgba(30,42,120,0.16)",
			},
			typography: { heading: "Sora", body: "Inter" },
		};
	}
	return {
		archetype: "modern-editorial-premium",
		palette: {
			background: "#f5f6f8",
			surface: "#ffffff",
			primary: "#111827",
			accent: "#3366ff",
			text: "#141a27",
			muted: "#576079",
			outline: "rgba(17,24,39,0.12)",
		},
		typography: { heading: "General Sans", body: "Manrope" },
	};
}

function buildBusinessIntelligence(business: Business): BusinessIntelligence {
	const category = business.category || "local business";
	const lower = category.toLowerCase();
	const conversionIntent = lower.includes("restaurant") || lower.includes("cafe")
		? "bookings"
		: lower.includes("store") || lower.includes("shop")
			? "commerce"
			: lower.includes("law") || lower.includes("consult")
				? "consultations"
				: "walk-ins";

	return {
		industryArchetype: industryPreset(category).archetype,
		customerDemographic:
			conversionIntent === "commerce"
				? "price-aware but design-conscious local buyers"
				: "decision-focused local customers seeking trust and proof",
		brandPersonality: ["credible", "distinctive", "high-conviction", "modern"],
		emotionalTone:
			lower.includes("fitness") || lower.includes("gym")
				? "motivating and energetic"
				: "confident and refined",
		trustStyle:
			lower.includes("law") || lower.includes("finance")
				? "structured authority with evidence"
				: "social proof with craft signals",
		localVisualCulture: business.address || "urban contemporary",
		conversionIntent,
	};
}

async function buildBrandStrategy(
	business: Business,
	intel: BusinessIntelligence,
	options: PipelineGenerationOptions,
): Promise<BrandStrategy> {
	const prompt = `You are a Brand Strategy Agent.\nReturn strict JSON with keys: typographyPhilosophy, spacingPhilosophy, visualRhythm, compositionPhilosophy, interactionPhilosophy, motionLanguage, densityStrategy, asymmetryStrategy, imageryStrategy.\nBusiness: ${business.name}\nCategory: ${business.category}\nArchetype: ${intel.industryArchetype}\nDemographic: ${intel.customerDemographic}\nTone: ${intel.emotionalTone}\nAvoid generic or safe design language.`;
	try {
		const raw = await options.llmJson(prompt, "brand-strategy-agent");
		return JSON.parse(raw) as BrandStrategy;
	} catch {
		return {
			typographyPhilosophy: "Oversized heading contrast with compact body rhythm.",
			spacingPhilosophy: "Cadenced section compression with deliberate breathing zones.",
			visualRhythm: "High-contrast alternation between dense and airy sections.",
			compositionPhilosophy: "Asymmetric split grids with layered media anchors.",
			interactionPhilosophy: "Intentional motion on reveals and CTA hover depth.",
			motionLanguage: "Subtle cinematic translate and opacity choreography.",
			densityStrategy: "Start dense above the fold, then progressively breathe.",
			asymmetryStrategy: "Offset blocks and uneven column weight to build tension.",
			imageryStrategy: "Narrative-led crops with overlapping foreground accents.",
		};
	}
}

async function buildVisualMoodboard(
	business: Business,
	strategy: BrandStrategy,
	options: PipelineGenerationOptions,
): Promise<VisualMoodboard> {
	const prompt = `You are a Visual Moodboard Agent. Return strict JSON with keys: references (array), compositionStyles (array), gridBehavior, whitespaceStrategy, editorialRhythm, colorAtmosphere, animationMood, imageTreatmentSystem.\nBusiness: ${business.name}\nCategory: ${business.category}\nStrategy: ${JSON.stringify(strategy)}.`;
	try {
		const raw = await options.llmJson(prompt, "visual-moodboard-agent");
		return JSON.parse(raw) as VisualMoodboard;
	} catch {
		return {
			references: ["Awwwards editorial", "Framer premium"],
			compositionStyles: ["offset split", "stagger grid", "layered hero"],
			gridBehavior: "12-column adaptive with asymmetrical pulls",
			whitespaceStrategy: "rhythm-compressed with tension breaks",
			editorialRhythm: "dense intro, breathable proof, strong CTA closure",
			colorAtmosphere: "high-contrast modern neutral with accent pulse",
			animationMood: "deliberate reveal sequencing",
			imageTreatmentSystem: "editorial crops with atmospheric overlay",
		};
	}
}

function buildCompositionPlan(
	business: Business,
	intel: BusinessIntelligence,
	seed: string,
): LayoutCompositionPlan {
	const heroMode = pick(seed, ["immersive", "editorial-split", "systems"] as const);
	const baseSections: WebsiteSection["type"][] = [
		"hero",
		"features",
		"gallery",
		"testimonials",
		"faq",
		"cta",
		"contact",
	];

	const sections = baseSections.map((type, index) => {
		const sectionSeed = hashSeed(`${seed}-${type}-${index}`);
		return {
			type,
			priority: index,
			layoutMode: pick(sectionSeed, [
				"split-offset",
				"staggered-grid",
				"overlap-layer",
				"editorial-stack",
			]),
			span: pick(sectionSeed, ["full", "wide", "split"] as const),
			offset: (parseInt(sectionSeed.slice(0, 2), 16) % 5) - 2,
			density: pick(sectionSeed, ["tight", "balanced", "airy"] as const),
			visualTension: pick(sectionSeed, ["low", "medium", "high"] as const),
		};
	});

	return {
		grid: {
			columns: 12,
			maxWidth: "min(1320px, 92vw)",
			gutters: "clamp(1rem, 2vw, 2rem)",
		},
		sections,
		heroMode,
		asymmetryBias: intel.industryArchetype.includes("structured") ? 35 : 70,
		depthBias: intel.industryArchetype.includes("kinetic") ? 75 : 55,
	};
}

function createSchemaFromPlan(
	business: Business,
	plan: LayoutCompositionPlan,
	strategy: BrandStrategy,
	moodboard: VisualMoodboard,
	tokens: VisualTokens,
): WebsiteSchema {
	const siteId = `${business.id || "site"}-${Date.now()}`;
	const slug = (business.name || "site")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");

	const photos = (business.photos || []).filter(Boolean);
	const heroPhoto = photos[0] || "";

	const sections: WebsiteSection[] = plan.sections.map((section, index) => {
		const id = `${section.type}-${index + 1}`;
		const composition = {
			sectionType: section.layoutMode,
			layoutBehavior: section.span,
			visualDepth: section.visualTension,
			motionStyle: strategy.motionLanguage,
			imageTreatment: moodboard.imageTreatmentSystem,
			spacingMode: section.density,
			themeIntensity: plan.depthBias > 65 ? "dramatic" : "balanced",
			hierarchyWeight:
				section.type === "hero"
					? "dominant"
					: section.type === "cta"
						? "supporting"
						: "breathing",
		};

		if (section.type === "hero") {
			return {
				id,
				type: "hero",
				layout: plan.heroMode === "immersive" ? "hero-immersive" : "hero-split",
				variant: plan.heroMode,
				composition,
				headline: `${business.name}`,
				subheadline: `${business.category} in ${business.address || "your local market"}, crafted to convert trust into action.`,
				ctaPrimary: { label: "Book Consultation", href: "#contact" },
				ctaSecondary: { label: "View Work", href: "#gallery" },
				badges: [business.category || "Local Service", "Premium Experience"],
				media: {
					type: "image",
					src: heroPhoto,
					alt: `${business.name} hero image`,
				},
			} as WebsiteSection;
		}

		if (section.type === "features") {
			return {
				id,
				type: "features",
				layout: "alternating-grid",
				variant: section.layoutMode,
				composition,
				title: "What Makes This Different",
				items: [
					{ title: "High-Signal Positioning", description: "Offer framing built for fast local decision-making." },
					{ title: "Proof-Led Narrative", description: "Trust signals and testimonials integrated into the primary story arc." },
					{ title: "Conversion Architecture", description: "CTA hierarchy and friction reduction engineered by section." },
				],
			} as WebsiteSection;
		}

		if (section.type === "gallery") {
			const gallery = photos.slice(0, 6).map((src, i) => ({
				src,
				alt: `${business.name} image ${i + 1}`,
			}));
			return {
				id,
				type: "gallery",
				layout: "asymmetrical",
				variant: section.layoutMode,
				composition,
				title: "Visual Story",
				items: gallery,
			} as WebsiteSection;
		}

		if (section.type === "testimonials") {
			return {
				id,
				type: "testimonials",
				layout: "split",
				variant: section.layoutMode,
				composition,
				title: "Client Outcomes",
				items: [
					{ quote: "The new site feels like a premium agency build and converts far better.", author: "Local Client", role: "Owner" },
					{ quote: "Clear messaging, stronger trust, and a much sharper visual presence.", author: "Repeat Customer", role: "Operations" },
				],
			} as WebsiteSection;
		}

		if (section.type === "faq") {
			return {
				id,
				type: "faq",
				layout: "faq-accordion",
				variant: section.layoutMode,
				composition,
				title: "Questions",
				items: [
					{ question: "How fast can we launch?", answer: "Most local projects can go live in days with approved content." },
					{ question: "Can we update content after launch?", answer: "Yes, editing workflows are designed for non-technical teams." },
				],
			} as WebsiteSection;
		}

		if (section.type === "cta") {
			return {
				id,
				type: "cta",
				layout: "cta-split",
				variant: section.layoutMode,
				composition,
				title: "Let’s Build The Better Version",
				body: "Schedule a strategy call and get a premium website direction tailored to your market.",
				buttonLabel: "Start Now",
				buttonHref: "#contact",
			} as WebsiteSection;
		}

		return {
			id,
			type: "contact",
			layout: "contact-form",
			variant: section.layoutMode,
			composition,
			title: "Contact",
			showEmail: true,
			showPhone: true,
			showMap: false,
		} as WebsiteSection;
	});

	return {
		schemaVersion: "1.0",
		meta: {
			siteId,
			businessId: business.id,
			slug,
			version: 2,
			target: "wordpress",
		},
		theme: {
			name: `Studio ${business.category || "Modern"}`,
			brandDNA: {
				personality: "premium",
				visualMood: "modern-authority",
				ctaEnergy: "inviting",
				spacingDensity: "balanced",
				imageStyle: "cinematic",
				typographyMood: "editorial",
				iconStyle: "outline",
			},
			designDNA: {
				spacingPersonality: "balanced",
				compositionAggression: plan.asymmetryBias,
				hierarchyIntensity: 82,
				motionEnergy: 54,
				visualDensity: 68,
				asymmetryLevel: plan.asymmetryBias,
				atmosphereIntensity: plan.depthBias,
				typographyDominance: "cinematic-oversized",
				imageWeight: 72,
				luxuryScore: 70,
				cinematicScore: 65,
				brutalismScore: 20,
				editorialScore: 78,
				softnessScore: 45,
				visualAtmosphere: "architectural-minimalism",
			},
			palette: tokens.palette,
			typography: {
				heading: tokens.typography.heading,
				body: tokens.typography.body,
				headingFont: tokens.typography.heading,
				bodyFont: tokens.typography.body,
			},
			tokens: {
				radius: "soft",
				shadow: "premium",
				surface: "glass",
				animation: "dynamic",
			},
		} as any,
		brand: {
			businessName: business.name,
			category: business.category,
			address: business.address,
			phone: business.phoneNumber,
			email: business.email,
			websiteUri: business.websiteUri,
			logo: business.logo,
		},
		seo: {
			title: `${business.name} | ${business.category}`,
			description: `${business.name} in ${business.address || "your area"} with a premium, conversion-focused digital experience.`,
			keywords: [business.name, business.category, "premium", "local"].filter(Boolean),
		},
		sections,
		_validation: {
			repairs: [],
			validatedAt: new Date().toISOString(),
		},
	} as WebsiteSchema;
}

function buildVisualTokens(business: Business, seed: string): VisualTokens {
	const preset = industryPreset(business.category || "");
	const scaleHero = pick(seed, [
		"clamp(3.2rem, 8.5vw, 8rem)",
		"clamp(3rem, 7.2vw, 7rem)",
	]);
	return {
		palette: preset.palette,
		typography: {
			heading: preset.typography.heading,
			body: preset.typography.body,
			scaleHero,
			scaleH2: "clamp(1.8rem, 3.2vw, 3.4rem)",
			scaleBody: "clamp(1rem, 1.2vw, 1.125rem)",
		},
		spacing: {
			sectionY: "clamp(4rem, 8vw, 9rem)",
			sectionYTight: "clamp(2.5rem, 5vw, 5rem)",
			gutter: "clamp(1rem, 2vw, 2rem)",
			cardPad: "clamp(1rem, 2vw, 1.75rem)",
		},
		motion: {
			revealDuration: "700ms",
			ease: "cubic-bezier(0.22,1,0.36,1)",
		},
	};
}

function renderPremiumHtml(schema: WebsiteSchema, tokens: VisualTokens, plan: LayoutCompositionPlan) {
	const rootVars = `
		--bg:${tokens.palette.background};
		--surface:${tokens.palette.surface};
		--primary:${tokens.palette.primary};
		--accent:${tokens.palette.accent};
		--text:${tokens.palette.text};
		--muted:${tokens.palette.muted};
		--outline:${tokens.palette.outline};
		--hero:${tokens.typography.scaleHero};
		--h2:${tokens.typography.scaleH2};
		--body:${tokens.typography.scaleBody};
		--sectionY:${tokens.spacing.sectionY};
		--sectionYTight:${tokens.spacing.sectionYTight};
		--gutter:${tokens.spacing.gutter};
		--cardPad:${tokens.spacing.cardPad};
		--ease:${tokens.motion.ease};
	`;

	const sectionHtml = schema.sections
		.map((section, index) => {
			const composition = (section as any).composition || {};
			const cls = `section s-${section.type} mode-${composition.sectionType || "standard"} tension-${composition.visualDepth || "medium"}`;
			if (section.type === "hero") {
				const hero = section as any;
				return `<section class="${cls}" id="top"><div class="grid hero-grid"><div class="hero-copy"><p class="eyebrow">${schema.brand.category || ""}</p><h1>${hero.headline || schema.brand.businessName}</h1><p>${hero.subheadline || ""}</p><div class="actions"><a class="btn btn-primary" href="${hero.ctaPrimary?.href || "#contact"}">${hero.ctaPrimary?.label || "Get Started"}</a><a class="btn btn-ghost" href="${hero.ctaSecondary?.href || "#gallery"}">${hero.ctaSecondary?.label || "View Work"}</a></div></div><div class="hero-media">${hero.media?.src ? `<img src="${hero.media.src}" alt="${hero.media.alt || "hero"}"/>` : ""}</div></div></section>`;
			}
			if (section.type === "features") {
				const f = section as any;
				return `<section class="${cls}" id="services"><div class="grid"><header><h2>${f.title || "Services"}</h2></header><div class="stagger-grid">${(f.items || [])
					.map((item: any, i: number) => `<article class="feature-card span-${(i % 3) + 1}"><h3>${item.title}</h3><p>${item.description}</p></article>`)
					.join("")}</div></div></section>`;
			}
			if (section.type === "gallery") {
				const g = section as any;
				return `<section class="${cls}" id="gallery"><div class="grid"><header><h2>${g.title || "Gallery"}</h2></header><div class="editorial-gallery">${(g.items || [])
					.map((item: any, i: number) => `<figure class="shot shot-${(i % 5) + 1}"><img src="${item.src || ""}" alt="${item.alt || ""}"/></figure>`)
					.join("")}</div></div></section>`;
			}
			if (section.type === "testimonials") {
				const t = section as any;
				return `<section class="${cls}" id="testimonials"><div class="grid split"><header><h2>${t.title || "Testimonials"}</h2></header><div class="quotes">${(t.items || [])
					.map((item: any) => `<blockquote><p>\"${item.quote}\"</p><cite>${item.author}${item.role ? `, ${item.role}` : ""}</cite></blockquote>`)
					.join("")}</div></div></section>`;
			}
			if (section.type === "faq") {
				const f = section as any;
				return `<section class="${cls}" id="faq"><div class="grid"><header><h2>${f.title || "FAQ"}</h2></header><div class="faq-list">${(f.items || [])
					.map((item: any) => `<details><summary>${item.question}</summary><p>${item.answer}</p></details>`)
					.join("")}</div></div></section>`;
			}
			if (section.type === "cta") {
				const c = section as any;
				return `<section class="${cls}" id="cta"><div class="grid cta-band"><div><h2>${c.title || "Ready?"}</h2><p>${c.body || ""}</p></div><a class="btn btn-primary" href="${c.buttonHref || "#contact"}">${c.buttonLabel || "Start"}</a></div></section>`;
			}
			return `<section class="${cls}" id="contact"><div class="grid contact"><h2>Contact</h2><p>${schema.brand.address || ""}</p><p>${schema.brand.phone || ""}</p><p>${schema.brand.email || ""}</p></div></section>`;
		})
		.join("\n");

	const css = `
		:root { ${rootVars} }
		* { box-sizing: border-box; }
		body { margin:0; font-family:${tokens.typography.body}, ui-sans-serif, system-ui; background:var(--bg); color:var(--text); line-height:1.5; }
		main { overflow:hidden; }
		.grid { width:min(1320px, 92vw); margin-inline:auto; }
		.section { padding-block:var(--sectionY); position:relative; }
		.section header { margin-bottom:clamp(1.2rem,2vw,2rem); }
		h1 { font-family:${tokens.typography.heading}, serif; font-size:var(--hero); line-height:0.95; letter-spacing:-0.03em; margin:0 0 1rem; max-width:14ch; }
		h2 { font-family:${tokens.typography.heading}, serif; font-size:var(--h2); line-height:1.05; letter-spacing:-0.02em; margin:0; }
		h3 { font-size:clamp(1.1rem,1.4vw,1.5rem); margin:0 0 .5rem; }
		p { margin:0; font-size:var(--body); color:var(--muted); }
		.hero-grid { display:grid; grid-template-columns:1.1fr .9fr; gap:var(--gutter); align-items:end; }
		.hero-media img { width:100%; height:100%; object-fit:cover; min-height:460px; border-radius:24px; box-shadow:0 20px 70px rgba(0,0,0,.12); }
		.eyebrow { text-transform:uppercase; letter-spacing:.18em; font-size:.72rem; color:var(--accent); margin-bottom:1rem; }
		.actions { display:flex; gap:.75rem; margin-top:1.2rem; flex-wrap:wrap; }
		.btn { text-decoration:none; display:inline-flex; align-items:center; justify-content:center; border-radius:999px; padding:.78rem 1.2rem; font-weight:600; transition:all .25s var(--ease); }
		.btn-primary { background:var(--primary); color:#fff; box-shadow:0 10px 28px color-mix(in srgb, var(--primary) 35%, transparent); }
		.btn-primary:hover { transform:translateY(-2px); }
		.btn-ghost { border:1px solid var(--outline); color:var(--text); background:var(--surface); }
		.stagger-grid { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:var(--gutter); }
		.feature-card { border:1px solid var(--outline); background:var(--surface); border-radius:20px; padding:var(--cardPad); min-height:180px; backdrop-filter: blur(8px); }
		.feature-card.span-1 { grid-column:span 2; transform:translateY(0); }
		.feature-card.span-2 { grid-column:span 2; transform:translateY(18px); }
		.feature-card.span-3 { grid-column:span 2; transform:translateY(-10px); }
		.editorial-gallery { display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:var(--gutter); }
		.shot { margin:0; border-radius:18px; overflow:hidden; box-shadow:0 18px 55px rgba(0,0,0,.12); }
		.shot img { width:100%; height:100%; object-fit:cover; display:block; }
		.shot-1{grid-column:span 7; min-height:360px;} .shot-2{grid-column:span 5; min-height:280px;}
		.shot-3{grid-column:span 4; min-height:220px;} .shot-4{grid-column:span 4; min-height:240px;} .shot-5{grid-column:span 4; min-height:220px;}
		.split { display:grid; grid-template-columns:.7fr 1.3fr; gap:var(--gutter); align-items:start; }
		.quotes { display:grid; gap:var(--gutter); }
		blockquote { margin:0; border-left:3px solid var(--accent); padding:1rem 1rem 1rem 1.2rem; background:var(--surface); border-radius:16px; }
		blockquote p { color:var(--text); font-size:clamp(1.1rem,1.4vw,1.4rem); }
		blockquote cite { display:block; margin-top:.8rem; color:var(--muted); font-size:.92rem; }
		.faq-list { display:grid; gap:.7rem; }
		details { border:1px solid var(--outline); border-radius:14px; background:var(--surface); padding:1rem 1.1rem; }
		details summary { cursor:pointer; font-weight:600; color:var(--text); }
		.cta-band { display:grid; grid-template-columns:1fr auto; gap:var(--gutter); align-items:center; padding:clamp(1.6rem,3vw,2.8rem); border:1px solid var(--outline); border-radius:24px; background:linear-gradient(130deg, color-mix(in srgb, var(--accent) 11%, var(--surface)), var(--surface)); }
		.contact { padding:clamp(1.2rem,2vw,2rem); border:1px solid var(--outline); border-radius:18px; background:var(--surface); display:grid; gap:.5rem; }
		.section::before { content:""; position:absolute; inset:auto -20% 100% auto; width:32vw; height:32vw; background:radial-gradient(circle, color-mix(in srgb, var(--accent) 28%, transparent), transparent 62%); pointer-events:none; filter:blur(30px); opacity:.35; }
		@media (max-width: 1000px){
			.hero-grid,.split,.cta-band { grid-template-columns:1fr; }
			.stagger-grid { grid-template-columns:1fr; }
			.feature-card { transform:none !important; grid-column:auto; }
			.editorial-gallery { grid-template-columns:1fr 1fr; }
			.shot { grid-column:auto !important; min-height:220px !important; }
			h1 { max-width: 18ch; }
		}
	`;

	return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${schema.seo.title}</title><style>${css}</style></head><body><main>${sectionHtml}</main></body></html>`;
}

async function maybeCaptureScreenshotBase64(html: string): Promise<string | null> {
	try {
		const dynamicImport = new Function(
			"moduleName",
			"return import(moduleName)",
		) as (moduleName: string) => Promise<any>;
		const playwright = await dynamicImport("playwright");
		const browser = await playwright.chromium.launch({ headless: true });
		const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
		await page.setContent(html, { waitUntil: "networkidle" });
		const png = await page.screenshot({ fullPage: true, type: "png" });
		await browser.close();
		return Buffer.from(png).toString("base64");
	} catch {
		return null;
	}
}

async function runCritique(
	schema: WebsiteSchema,
	html: string,
	options: PipelineGenerationOptions,
	iteration: number,
): Promise<VisualCritique> {
	const screenshot = await maybeCaptureScreenshotBase64(html);
	const prompt = `You are a Visual Quality Critic. Return strict JSON with scores 0-100 for whitespaceBalance, hierarchyStrength, compositionUniqueness, imageRhythm, ctaProminence, premiumFeel and arrays issues, refinementActions. Iteration=${iteration}.`;

	try {
		const contents = screenshot
			? [
					{
						role: "user",
						parts: [
							{ text: `${prompt}\nBusiness=${schema.brand.businessName}, category=${schema.brand.category}.` },
							{ inline_data: { mime_type: "image/png", data: screenshot } },
						],
					},
				]
			: `${prompt}\nNo screenshot available; critique from schema + HTML length=${html.length}.`;
		const raw = await options.llmJson(contents as any, "visual-critique-loop");
		return JSON.parse(raw) as VisualCritique;
	} catch {
		return {
			whitespaceBalance: 68,
			hierarchyStrength: 70,
			compositionUniqueness: 66,
			imageRhythm: 64,
			ctaProminence: 73,
			premiumFeel: 69,
			issues: ["Gallery rhythm could be stronger", "CTA could be more dominant"],
			refinementActions: ["increase_heading_contrast", "tighten_feature_spacing", "boost_cta_surface"],
		};
	}
}

function applyCritiqueRefinements(tokens: VisualTokens, critique: VisualCritique) {
	if (critique.hierarchyStrength < 75) {
		tokens.typography.scaleHero = "clamp(3.6rem, 9vw, 8.4rem)";
	}
	if (critique.whitespaceBalance < 70) {
		tokens.spacing.sectionY = "clamp(3.3rem, 7vw, 7rem)";
		tokens.spacing.cardPad = "clamp(.9rem,1.8vw,1.4rem)";
	}
	if (critique.ctaProminence < 75) {
		tokens.palette.primary = tokens.palette.accent;
	}
}

export async function generateWebsiteWithVisualIntelligence(
	business: Business,
	options: PipelineGenerationOptions,
): Promise<WebsiteSchema> {
	const seed = hashSeed(`${business.id}-${business.name}-${business.category}`);
	options.logStderr(`[VisualPipeline] Start seed=${seed} business=${business.name}`);

	const intelligence = buildBusinessIntelligence(business);
	const strategy = await buildBrandStrategy(business, intelligence, options);
	const moodboard = await buildVisualMoodboard(business, strategy, options);
	const compositionPlan = buildCompositionPlan(business, intelligence, seed);
	const tokens = buildVisualTokens(business, seed);

	let schema = createSchemaFromPlan(
		business,
		compositionPlan,
		strategy,
		moodboard,
		tokens,
	);

	let html = renderPremiumHtml(schema, tokens, compositionPlan);
	let lastCritique: VisualCritique | null = null;

	for (let i = 1; i <= 2; i++) {
		const critique = await runCritique(schema, html, options, i);
		lastCritique = critique;
		applyCritiqueRefinements(tokens, critique);
		html = renderPremiumHtml(schema, tokens, compositionPlan);
	}

	(schema as any)._wordpressHtml = html;
	(schema as any)._renderSource = "visual-intelligence-pipeline";
	(schema as any)._pipeline = {
		intelligence,
		strategy,
		moodboard,
		compositionPlan,
		critique: lastCritique,
		tokens,
	};

	if (options.debugSession) {
		options.persistGenerationDebugFile(options.debugSession, "00-business-intelligence.json", intelligence);
		options.persistGenerationDebugFile(options.debugSession, "00-brand-strategy.json", strategy);
		options.persistGenerationDebugFile(options.debugSession, "00-visual-moodboard.json", moodboard);
		options.persistGenerationDebugFile(options.debugSession, "00-layout-composition-plan.json", compositionPlan);
		options.persistGenerationDebugFile(options.debugSession, "00-visual-tokens.json", tokens);
		options.persistGenerationDebugFile(options.debugSession, "00-critique-loop.json", lastCritique || {});
		options.persistGenerationDebugFile(options.debugSession, "05c-wordpress-html-final.html", html);
	}

	options.logStderr(`[VisualPipeline] Completed with renderSource=visual-intelligence-pipeline`);
	return schema;
}
