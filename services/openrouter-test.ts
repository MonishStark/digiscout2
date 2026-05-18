/** @format */

type OpenRouterResponse = {
	choices?: Array<{ message?: { content?: string } }>;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
};

type TestOpenRouterResult = {
	model: string;
	html: string;
	outputLength: number;
	preview: string;
	requestMs: number;
	usage?: OpenRouterResponse["usage"];
};

const OPENROUTER_MODEL = "qwen/qwen3-coder-480b-a35b:free";

export async function testOpenRouter(): Promise<TestOpenRouterResult> {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error("OPENROUTER_API_KEY is not set");
	}

	const baseUrl =
		process.env.OPENROUTER_BASE_URL ||
		"https://openrouter.ai/api/v1/chat/completions";

	const prompt =
		"Generate a visually stunning luxury salon landing page using clean HTML and modern CSS. " +
		"The design should feel editorial, premium, elegant, and highly modern. " +
		"Use asymmetrical layouts, large typography, layered sections, premium spacing, glassmorphism accents, " +
		"a luxury color palette, and responsive design. " +
		"Output ONLY valid HTML with embedded CSS suitable for WordPress Custom HTML blocks. " +
		"Do not include markdown fences. Do not include any JavaScript frameworks.";

	const startedAt = Date.now();
	console.log(`[OpenRouter Test] Request started model=${OPENROUTER_MODEL}`);

	const response = await fetch(baseUrl, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: OPENROUTER_MODEL,
			temperature: 0.7,
			max_tokens: 12000,
			messages: [{ role: "user", content: prompt }],
		}),
	});

	const requestMs = Date.now() - startedAt;

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`OpenRouter failed: ${response.status} ${text}`);
	}

	const data = (await response.json()) as OpenRouterResponse;
	const html = data.choices?.[0]?.message?.content || "";
	const outputLength = html.length;
	const preview = html.slice(0, 500);

	console.log(
		`[OpenRouter Test] Success model=${OPENROUTER_MODEL} durationMs=${requestMs} outputLength=${outputLength}`,
	);
	console.log(`[OpenRouter Test] Preview=${preview}`);

	return {
		model: OPENROUTER_MODEL,
		html,
		outputLength,
		preview,
		requestMs,
		usage: data.usage,
	};
}
