/** @format */

const MODEL_ID = "gemini-3.5-flash";
const VERTEX_API_ENDPOINT = "aiplatform.googleapis.com";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_KEYWORDS = 15;

const keywordCache = new Map<
	string,
	{ keywords: string[]; expiresAt: number }
>();
const inflightRequests = new Map<
	string,
	Promise<SearchKeywordExpansionResult>
>();

export interface SearchKeywordExpansionResult {
	keywords: string[];
	rawKeywords: unknown[];
}

const GEO_TERMS = new Set([
	"near",
	"nearby",
	"city",
	"county",
	"metro",
	"metropolitan",
	"suburb",
	"suburban",
	"downtown",
	"uptown",
	"houston",
	"austin",
	"dallas",
	"san antonio",
	"texas",
	"tx",
	"tx.",
]);

function normalize(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function stripCodeFences(text: string): string {
	return text
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/i, "");
}

function extractJsonArray(text: string): unknown[] {
	const cleaned = stripCodeFences(text);
	try {
		const parsed = JSON.parse(cleaned);
		if (Array.isArray(parsed)) return parsed;
		if (parsed && Array.isArray((parsed as any).keywords)) {
			return (parsed as any).keywords;
		}
	} catch {
		// fall through to regex extraction
	}

	const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
	if (!arrayMatch) return [];
	try {
		const parsed = JSON.parse(arrayMatch[0]);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function sanitizeKeywords(
	rawKeywords: unknown[],
	category: string,
	city: string,
): string[] {
	const normalizedCategory = normalize(category);
	const normalizedCity = normalize(city);
	const cityTokens = normalizedCity.split(" ").filter(Boolean);
	const filtered = new Set<string>();

	for (const rawKeyword of rawKeywords) {
		if (typeof rawKeyword !== "string") continue;
		const keyword = rawKeyword
			.replace(/[\r\n\t]+/g, " ")
			.replace(/^[-•*\d.\s]+/, "")
			.trim();
		if (!keyword) continue;

		const normalizedKeyword = normalize(keyword);
		if (!normalizedKeyword) continue;
		if (normalizedKeyword.length < 3) continue;
		if (normalizedKeyword.length > 80) continue;
		if (normalizedKeyword === normalizedCategory) continue;
		if (normalizedKeyword.includes(normalizedCity)) continue;
		if (
			cityTokens.some((token) => token && normalizedKeyword.includes(token))
		) {
			continue;
		}
		if ([...GEO_TERMS].some((term) => normalizedKeyword.includes(term))) {
			continue;
		}
		filtered.add(keyword);
	}

	const deduped = Array.from(filtered.values());
	if (!deduped.includes(category)) {
		deduped.unshift(category);
	}

	return deduped.slice(0, MAX_KEYWORDS);
}

async function fetchVertexKeywords(
	category: string,
	city: string,
	attempt: number,
): Promise<SearchKeywordExpansionResult> {
	const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
	if (!apiKey) {
		throw new Error("GOOGLE_CLOUD_API_KEY is not configured");
	}

	const prompt = [
		"You generate Google Places Text Search keyword expansions for local business discovery.",
		"Return JSON only as an array of strings.",
		"Generate 10 to 15 high-quality search phrases that are semantically related to the business category.",
		"Include industry aliases, service synonyms, contractor variations, and closely related service phrases.",
		"Do not include city names, suburbs, metro areas, neighborhoods, or geographic terms.",
		"Do not include duplicates, numbering, bullets, explanations, or markdown.",
		"Keep each phrase concise, natural, and suitable for Google Places Text Search.",
		`Category: ${category}`,
		`City context: ${city}`,
		"Output only the JSON array.",
	].join("\n");

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const url = `https://${VERTEX_API_ENDPOINT}/v1beta/models/${MODEL_ID}:generateContent?key=${encodeURIComponent(apiKey)}`;
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			signal: controller.signal,
			body: JSON.stringify({
				contents: [
					{
						role: "user",
						parts: [{ text: prompt }],
					},
				],
				generationConfig: {
					temperature: 0.2,
					maxOutputTokens: 256,
					responseMimeType: "application/json",
				},
				safetySettings: [
					{ category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
					{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
					{ category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
					{ category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
				],
			}),
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => "");
			throw new Error(
				`Vertex keyword generation failed (${response.status}): ${errorText}`,
			);
		}

		const data = await response.json();
		const text = Array.isArray(data)
			? data
					.map(
						(chunk) => chunk?.candidates?.[0]?.content?.parts?.[0]?.text || "",
					)
					.join("")
			: data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

		if (!text) {
			throw new Error("Vertex returned an empty keyword payload");
		}

		const parsed = extractJsonArray(text);
		console.log(
			`[Vertex] raw keywords for "${category}" in "${city}": ${JSON.stringify(parsed)}`,
		);
		const keywords = sanitizeKeywords(parsed, category, city);
		if (keywords.length === 0) {
			throw new Error("Vertex returned no valid keywords");
		}
		console.log(
			`[Vertex] sanitized keywords for "${category}" in "${city}": ${JSON.stringify(keywords)}`,
		);

		return { keywords, rawKeywords: parsed };
	} finally {
		clearTimeout(timeoutId);
	}
}

export async function generateSearchKeywords(
	category: string,
	city: string,
): Promise<SearchKeywordExpansionResult> {
	const normalizedCategory = normalize(category);
	const cacheKey = normalizedCategory;
	const cached = keywordCache.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) {
		return { keywords: cached.keywords, rawKeywords: cached.keywords };
	}

	const existing = inflightRequests.get(cacheKey);
	if (existing) {
		return await existing;
	}

	const request: Promise<SearchKeywordExpansionResult> = (async () => {
		let lastError: unknown;
		for (let attempt = 0; attempt < 3; attempt += 1) {
			try {
				const result = await fetchVertexKeywords(category, city, attempt);
				const keywords = result.keywords;
				keywordCache.set(cacheKey, {
					keywords,
					expiresAt: Date.now() + CACHE_TTL_MS,
				});
				return result;
			} catch (error) {
				lastError = error;
				if (attempt < 2) {
					await new Promise((resolve) =>
						setTimeout(resolve, 400 * (attempt + 1)),
					);
				}
			}
		}

		const fallback = [category].filter(Boolean);
		if (fallback.length > 0) {
			return { keywords: fallback, rawKeywords: fallback };
		}

		throw lastError instanceof Error
			? lastError
			: new Error("Failed to generate search keywords");
	})();

	inflightRequests.set(cacheKey, request);
	try {
		return await request;
	} finally {
		inflightRequests.delete(cacheKey);
	}
}
