/**
 * WEBSITE MEMORY SYSTEM
 *
 * Stores fingerprints of generated websites to prevent convergence.
 * Before finalizing a site, compare against prior generations.
 * If similarity exceeds threshold, mutate layout compositions.
 *
 * @format
 */

import {
	WebsiteFingerprint,
	PipelineGenerationOptions,
} from "./composition-architecture";

/**
 * In-memory storage for fingerprints (in production, use database)
 */
const FINGERPRINT_STORE: WebsiteFingerprint[] = [];

export function generateWebsiteFingerprint(
	siteId: string,
	compositionSequence: string[],
	spacingSignature: string,
	typographySignature: string,
	gridSignature: string,
	ctaSignature: string,
	entropyScore: number,
	colorSignature: string,
	industry: string,
	conversionIntent: string,
): WebsiteFingerprint {
	return {
		siteId,
		generatedAt: Date.now(),
		compositionSequence,
		spacingFingerprint: spacingSignature,
		typographyFingerprint: typographySignature,
		gridFingerprint: gridSignature,
		ctaFingerprint: ctaSignature,
		entropyScore,
		colorFingerprint: colorSignature,
		industry,
		conversionIntent,
	};
}

export function storeFingerprint(fingerprint: WebsiteFingerprint): void {
	FINGERPRINT_STORE.push(fingerprint);

	// Keep only last 100 fingerprints to avoid memory bloat
	if (FINGERPRINT_STORE.length > 100) {
		FINGERPRINT_STORE.shift();
	}
}

/**
 * Calculate similarity between two websites
 */
export function calculateSimilarity(
	fp1: WebsiteFingerprint,
	fp2: WebsiteFingerprint,
): { similarity: number; similarities: Record<string, number> } {
	const similarities: Record<string, number> = {};

	// Composition sequence similarity (0-1)
	similarities.composition = compareSequences(
		fp1.compositionSequence,
		fp2.compositionSequence,
	);

	// Spacing signature similarity (0-1)
	similarities.spacing = compareStrings(
		fp1.spacingFingerprint,
		fp2.spacingFingerprint,
	);

	// Typography similarity (0-1)
	similarities.typography = compareStrings(
		fp1.typographyFingerprint,
		fp2.typographyFingerprint,
	);

	// Grid similarity (0-1)
	similarities.grid = compareStrings(fp1.gridFingerprint, fp2.gridFingerprint);

	// CTA similarity (0-1)
	similarities.cta = compareStrings(fp1.ctaFingerprint, fp2.ctaFingerprint);

	// Color similarity (0-1)
	similarities.color = compareStrings(
		fp1.colorFingerprint,
		fp2.colorFingerprint,
	);

	// Industry match (high similarity if same industry)
	similarities.industryMatch = fp1.industry === fp2.industry ? 0.8 : 0.1;

	// Overall weighted similarity
	const similarity =
		similarities.composition * 0.2 +
		similarities.spacing * 0.15 +
		similarities.typography * 0.15 +
		similarities.grid * 0.15 +
		similarities.cta * 0.15 +
		similarities.color * 0.1 +
		similarities.industryMatch * 0.1;

	return {
		similarity: Math.round(similarity * 100),
		similarities,
	};
}

/**
 * Check if a new fingerprint is too similar to existing ones
 */
export function checkSimilarityToExisting(
	newFingerprint: WebsiteFingerprint,
	threshold: number = 70, // 70% similarity threshold
): {
	isToSimilar: boolean;
	mostSimilar?: WebsiteFingerprint;
	similarity?: number;
	recommendations: string[];
} {
	let mostSimilar: WebsiteFingerprint | undefined;
	let maxSimilarity = 0;
	const recommendations: string[] = [];

	for (const stored of FINGERPRINT_STORE) {
		const { similarity } = calculateSimilarity(stored, newFingerprint);

		if (similarity > maxSimilarity) {
			maxSimilarity = similarity;
			mostSimilar = stored;
		}

		if (similarity > threshold) {
			recommendations.push(
				`Site ${stored.siteId} is ${similarity}% similar (industry: ${stored.industry})`,
			);
		}
	}

	if (maxSimilarity > threshold) {
		recommendations.push(
			`ALERT: Highest similarity is ${maxSimilarity}% — consider regenerating compositions`,
		);
		recommendations.push(
			"Mutation suggestions: Vary asymmetry level, change scan patterns, reorder compositions",
		);
	}

	return {
		isToSimilar: maxSimilarity > threshold,
		mostSimilar,
		similarity: maxSimilarity,
		recommendations,
	};
}

/**
 * Simple string similarity using Levenshtein distance
 */
function compareStrings(str1: string, str2: string): number {
	const len1 = str1.length;
	const len2 = str2.length;
	const matrix: number[][] = [];

	for (let i = 0; i <= len2; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= len1; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= len2; i++) {
		for (let j = 1; j <= len1; j++) {
			if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j] + 1,
				);
			}
		}
	}

	const distance = matrix[len2][len1];
	const maxLen = Math.max(len1, len2);
	return 1 - distance / maxLen;
}

/**
 * Compare composition sequences
 */
function compareSequences(seq1: string[], seq2: string[]): number {
	const set1 = new Set(seq1);
	const set2 = new Set(seq2);

	let matches = 0;
	for (const item of set1) {
		if (set2.has(item)) {
			matches++;
		}
	}

	const totalUnique = new Set([...seq1, ...seq2]).size;
	return totalUnique > 0 ? matches / totalUnique : 0;
}

/**
 * Get all stored fingerprints (for analysis)
 */
export function getAllFingerprints(): WebsiteFingerprint[] {
	return [...FINGERPRINT_STORE];
}

/**
 * Get fingerprints for a specific industry
 */
export function getFingerprintsByIndustry(
	industry: string,
): WebsiteFingerprint[] {
	return FINGERPRINT_STORE.filter((fp) => fp.industry === industry);
}

/**
 * Clear all fingerprints (for testing)
 */
export function clearFingerprints(): void {
	FINGERPRINT_STORE.length = 0;
}

/**
 * Get memory report
 */
export function getMemoryReport(): {
	totalStored: number;
	industriesRepresented: number;
	avgEntropyScore: number;
	oldestGeneration: number;
} {
	if (FINGERPRINT_STORE.length === 0) {
		return {
			totalStored: 0,
			industriesRepresented: 0,
			avgEntropyScore: 0,
			oldestGeneration: 0,
		};
	}

	const industries = new Set(FINGERPRINT_STORE.map((fp) => fp.industry));
	const avgEntropy =
		FINGERPRINT_STORE.reduce((sum, fp) => sum + fp.entropyScore, 0) /
		FINGERPRINT_STORE.length;
	const oldest = Math.min(...FINGERPRINT_STORE.map((fp) => fp.generatedAt));

	return {
		totalStored: FINGERPRINT_STORE.length,
		industriesRepresented: industries.size,
		avgEntropyScore: Math.round(avgEntropy),
		oldestGeneration: Date.now() - oldest,
	};
}
