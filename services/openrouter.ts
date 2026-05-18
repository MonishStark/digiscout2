/** @format */

type OpenRouterResponse = {
	choices?: Array<{ message?: { content?: string } }>;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
};

type CallOpenRouterArgs = {
	model: string;
	prompt: string;
	temperature?: number;
	maxTokens?: number;
};

type GenerateWithFallbackArgs = {
	prompt: string;
	models: string[];
	temperature?: number;
	maxTokens?: number;
	minLength?: number;
};

type GenerateWithFallbackResult = {
	model: string;
	content: string;
	fallbackUsed: boolean;
	attempts: string[];
	requestMs: number;
	usage?: OpenRouterResponse["usage"];
};

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function callOpenRouter({
	model,
	prompt,
	temperature = 0.7,
	maxTokens = 12000,
}: CallOpenRouterArgs): Promise<{
	content: string;
	usage?: OpenRouterResponse["usage"];
}> {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error("OPENROUTER_API_KEY is not set");
	}

	const baseUrl = process.env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL;
	const response = await fetch(baseUrl, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			temperature,
			max_tokens: maxTokens,
			messages: [{ role: "user", content: prompt }],
		}),
	});

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`OpenRouter failed: ${response.status} ${text}`);
	}

	const data = (await response.json()) as OpenRouterResponse;
	const content = data.choices?.[0]?.message?.content || "";
	return { content, usage: data.usage };
}

export async function generateWithFallback({
	prompt,
	models,
	temperature = 0.7,
	maxTokens = 12000,
	minLength = 100,
}: GenerateWithFallbackArgs): Promise<GenerateWithFallbackResult> {
	let lastError: unknown = null;
	const attempts: string[] = [];
	const startedAt = Date.now();

	for (const model of models) {
		try {
			console.log(`[OpenRouter] Trying ${model}`);
			attempts.push(model);
			const result = await callOpenRouter({
				model,
				prompt,
				temperature,
				maxTokens,
			});

			if (result.content && result.content.length >= minLength) {
				return {
					model,
					content: result.content,
					fallbackUsed: attempts.length > 1,
					attempts,
					requestMs: Date.now() - startedAt,
					usage: result.usage,
				};
			}

			throw new Error(
				`OpenRouter empty/short response (${result.content.length})`,
			);
		} catch (err) {
			console.error(`[OpenRouter] ${model} failed`, err);
			lastError = err;
		}
	}

	throw lastError || new Error("OpenRouter failed for all models");
}
