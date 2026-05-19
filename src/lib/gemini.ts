/** @format */

import { Business, WebsiteSchema } from "../types";

const API_URL =
	((import.meta as any).env?.VITE_API_URL as string | undefined) ||
	"http://localhost:5001";

export interface GeneratedWebsiteResult {
	schema: WebsiteSchema;
	debugTraceId?: string;
	debugFallbackUsed?: boolean;
}

export async function generateWebsite(
	business: Business,
): Promise<GeneratedWebsiteResult> {
	try {
		const resp = await fetch(`${API_URL}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(business),
		});

		if (!resp.ok) {
			const text = await resp.text().catch(() => "");
			throw new Error(
				`Generate failed: ${resp.status} ${resp.statusText} ${text}`,
			);
		}

		const payload = (await resp.json()) as WebsiteSchema;
		return {
			schema: payload,
			debugTraceId: resp.headers.get("x-debug-generation-id") || undefined,
			debugFallbackUsed:
				(
					resp.headers.get("x-debug-generation-fallback") || ""
				).toLowerCase() === "true",
		};
	} catch (err) {
		console.warn("Backend generate failed, returning dry-run schema:", err);
		// Return a conservative, editable schema for UI testing
		const now = Date.now();
		const category = (business.category || "").toLowerCase();
		const isHospitality =
			category.includes("restaurant") ||
			category.includes("cafe") ||
			category.includes("bakery");
		const isWellness =
			category.includes("salon") ||
			category.includes("spa") ||
			category.includes("wellness");
		const isFitness =
			category.includes("gym") ||
			category.includes("fitness") ||
			category.includes("training");
		const isProfessional =
			category.includes("law") ||
			category.includes("finance") ||
			category.includes("consult") ||
			category.includes("agency");
		const theme = isHospitality
			? {
					name: "Warm Editorial",
					style: "editorial hospitality",
					radius: "24px",
					layout: "editorial" as const,
					buttonStyle: "pill" as const,
					surfaceStyle: "glass" as const,
					mediaShape: "arched" as const,
					density: "airy" as const,
					accentMode: "earthy" as const,
					palette: {
						background: "#120f0b",
						surface: "rgba(32, 24, 18, 0.82)",
						primary: "#d97706",
						accent: "#f59e0b",
						text: "#fff8ee",
						muted: "#d6c6b8",
						outline: "rgba(255, 237, 213, 0.14)",
					},
					typography: { heading: "Fraunces", body: "Inter" },
				}
			: isWellness
				? {
						name: "Soft Luxe",
						style: "luxury wellness",
						radius: "30px",
						layout: "split-screen" as const,
						buttonStyle: "pill" as const,
						surfaceStyle: "glass" as const,
						mediaShape: "portrait" as const,
						density: "balanced" as const,
						accentMode: "luxury" as const,
						palette: {
							background: "#0b0a10",
							surface: "rgba(22, 18, 32, 0.86)",
							primary: "#c084fc",
							accent: "#f5d0fe",
							text: "#f8f5ff",
							muted: "#cabcd6",
							outline: "rgba(233, 213, 255, 0.14)",
						},
						typography: { heading: "Cormorant Garamond", body: "Inter" },
					}
				: isFitness
					? {
							name: "Electric Performance",
							style: "high-energy conversion",
							radius: "18px",
							layout: "immersive" as const,
							buttonStyle: "sharp" as const,
							surfaceStyle: "solid" as const,
							mediaShape: "square" as const,
							density: "compact" as const,
							accentMode: "neon" as const,
							palette: {
								background: "#07090f",
								surface: "#0f172a",
								primary: "#22c55e",
								accent: "#38bdf8",
								text: "#f8fafc",
								muted: "#94a3b8",
								outline: "rgba(148, 163, 184, 0.18)",
							},
							typography: { heading: "Space Grotesk", body: "Inter" },
						}
					: isProfessional
						? {
								name: "Modern Authority",
								style: "editorial professional",
								radius: "18px",
								layout: "minimal" as const,
								buttonStyle: "sharp" as const,
								surfaceStyle: "outline" as const,
								mediaShape: "rounded" as const,
								density: "balanced" as const,
								accentMode: "fresh" as const,
								palette: {
									background: "#f7f7f5",
									surface: "#ffffff",
									primary: "#0f766e",
									accent: "#2563eb",
									text: "#111827",
									muted: "#6b7280",
									outline: "rgba(17, 24, 39, 0.10)",
								},
								typography: { heading: "IBM Plex Sans", body: "Inter" },
							}
						: {
								name: "Noir Luxe",
								style: "premium glass editorial",
								radius: "28px",
								layout: "editorial" as const,
								buttonStyle: "pill" as const,
								surfaceStyle: "glass" as const,
								mediaShape: "rounded" as const,
								density: "balanced" as const,
								accentMode: "neon" as const,
								palette: {
									background: "#07070a",
									surface: "#111114",
									primary: "#7c3aed",
									accent: "#10b981",
									text: "#f4f4f5",
									muted: "#a1a1aa",
									outline: "rgba(255,255,255,0.10)",
								},
								typography: { heading: "Inter", body: "Inter" },
							};
		const schema: WebsiteSchema = {
			meta: {
				siteId: `dry-${business.id}-${now}`,
				businessId: business.id,
				slug: (business.name || "site")
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/(^-|-$)/g, ""),
				version: 1,
				target: "static",
			},
			theme: {
				...theme,
			},
			brand: {
				businessName: business.name || "Demo Business",
				category: business.category || "Local Business",
				address: business.address || "",
				phone: business.phoneNumber || "",
				email: business.email || "",
				websiteUri: business.websiteUri || "",
				logo: business.logo,
			},
			seo: {
				title: `${business.name || "Demo Business"} — Preview`,
				description: `Preview site for ${business.name || "Demo Business"}`,
				keywords: [business.category || "local", "preview"],
			},
			sections: [
				{
					id: "hero-1",
					type: "hero",
					variant:
						theme.layout === "minimal"
							? "centered"
							: theme.layout === "immersive"
								? "immersive"
								: "split",
					headline: `${business.name || "Your Business"}`,
					subheadline: isFitness
						? `High-performance ${business.category || "services"} designed to feel fast, bold, and conversion-focused.`
						: `Premium ${business.category || "services"} designed to convert.`,
					ctaPrimary: { label: "Book Now", href: "#contact" },
					badges: [theme.name, "New Prototype"],
					media: {
						type: "image",
						src:
							business.photos?.[0] ||
							"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
						alt: business.name || "Hero",
						logo: business.logo,
					},
				},
				{
					id: "features-1",
					type: "features",
					layout: theme.layout === "minimal" ? "list" : "cards",
					items: [
						{
							title:
								theme.layout === "minimal" ? "Core Value" : "Signature Service",
							description: isWellness
								? "Soft, polished, and reassuring messaging that feels aligned with a premium service experience."
								: isFitness
									? "Strong positioning with a clear transformation promise and high-energy visual hierarchy."
									: "A brief description of your key offering.",
						},
						{
							title: "Operational Excellence",
							description:
								"Streamlined processes, clear pricing, and a trusted team to deliver consistent quality.",
						},
						{
							title: "Customer Experience",
							description:
								"A focus on convenience, clear booking, and reliable follow-up to keep customers coming back.",
						},
					],
				},
				{
					id: "gallery-1",
					type: "gallery",
					items: [
						{
							src:
								business.photos?.[1] ||
								business.photos?.[0] ||
								"https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
							alt: "Photo 1",
						},
						{
							src:
								business.photos?.[2] ||
								business.photos?.[1] ||
								"https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
							alt: "Photo 2",
						},
						{
							src:
								business.photos?.[0] ||
								"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
							alt: "Photo 3",
						},
					],
				},
				{
					id: "testimonials-1",
					type: "testimonials",
					items: [
						{
							author: "Alex M.",
							quote: "Booking was seamless — highly recommend.",
						},
						{ author: "Jordan K.", quote: "Friendly staff and great results." },
					],
				},
				{
					id: "faq-1",
					type: "faq",
					items: [
						{
							question: "How do I book?",
							answer: "Use the booking link or call us during business hours.",
						},
						{
							question: "What are your hours?",
							answer: "Open daily with extended weekend hours.",
						},
					],
				},
				{ id: "contact-1", type: "contact", showEmail: true, showPhone: true },
			],
		};

		return {
			schema,
			debugTraceId: undefined,
			debugFallbackUsed: true,
		};
	}
}

export async function generateOutreachEmail(
	business: Business,
	websiteUrl: string,
) {
	// Placeholder: outreach generation should be proxied to the server for safety.
	return `Subject: Modern website for ${business.name}\n\nHi ${business.name},\n\nWe created a prototype website at ${websiteUrl}.`;
}

export interface AIChatMessage {
	role: "user" | "model";
	content: string;
	created_at?: string;
}

export async function fetchLeadAIChatHistory(leadId: string): Promise<AIChatMessage[]> {
	try {
		const resp = await fetch(`${API_URL}/api/business-ai-chat/${encodeURIComponent(leadId)}`);
		if (!resp.ok) {
			throw new Error("Failed to fetch chat history");
		}
		const data = await resp.json();
		return data.messages || [];
	} catch (error) {
		console.error("Failed to fetch chat history:", error);
		return [];
	}
}

export async function askBusinessAIChatStream(
	leadId: string,
	businessContext: any,
	messages: AIChatMessage[],
	onChunk: (chunk: string) => void,
	signal?: AbortSignal
): Promise<void> {
	const resp = await fetch(`${API_URL}/api/business-ai-chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ leadId, businessContext, messages }),
		signal
	});

	if (!resp.ok) {
		const text = await resp.text().catch(() => "");
		throw new Error(`Chat request failed: ${resp.status} ${resp.statusText} ${text}`);
	}

	const reader = resp.body?.getReader();
	if (!reader) {
		throw new Error("Response body is not readable");
	}

	const decoder = new TextDecoder("utf-8");
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		const chunk = decoder.decode(value, { stream: true });
		onChunk(chunk);
	}
}
