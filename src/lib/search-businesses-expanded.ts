/** @format */

import { Business } from "../types";

const API_URL =
	((import.meta as any).env?.VITE_API_URL as string | undefined) ||
	"http://localhost:5001";

const DEFAULT_FIELD_SET = [
	"id",
	"displayName",
	"location",
	"formattedAddress",
	"rating",
	"userRatingCount",
	"websiteURI",
	"nationalPhoneNumber",
	"photos",
	"businessStatus",
	"reviews",
];

interface SearchBusinessesExpandedOptions {
	category: string;
	city: string;
	coordinates: google.maps.LatLng | google.maps.LatLngLiteral;
	placesLib: typeof google.maps.places;
	onProgress?: (businesses: Business[]) => void;
	onLog?: (message: string) => void;
	concurrencyLimit?: number;
}

interface CandidateRecord {
	business: Business;
	matchedKeywords: Set<string>;
	score: number;
}

function normalize(text: string): string {
	return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizePhone(phone?: string): string {
	return phone ? phone.replace(/\D+/g, "") : "";
}

function normalizeWebsite(website?: string): string {
	return website ? website.toLowerCase().replace(/\/$/, "") : "";
}

function getPlaceName(place: any): string {
	return (
		place?.displayName?.text ||
		(typeof place?.displayName === "string"
			? place.displayName
			: "Unknown Business")
	);
}

function getPlaceAddress(place: any): string {
	return (
		place?.formattedAddress ||
		place?.formatted_address ||
		"No address available"
	);
}

function toBusiness(place: any, category: string): Business {
	const locationLat =
		typeof place?.location?.lat === "function" ? place.location.lat() : 0;
	const locationLng =
		typeof place?.location?.lng === "function" ? place.location.lng() : 0;

	return {
		id: String(place?.id || Math.random().toString(36).slice(2, 11)),
		name: String(getPlaceName(place)),
		category: String(category),
		address: String(getPlaceAddress(place)),
		rating: typeof place?.rating === "number" ? place.rating : 0,
		reviewCount:
			typeof place?.userRatingCount === "number" ? place.userRatingCount : 0,
		location: {
			lat: locationLat,
			lng: locationLng,
		},
		websiteUri: place?.websiteURI ? String(place.websiteURI) : undefined,
		phoneNumber: place?.nationalPhoneNumber
			? String(place.nationalPhoneNumber)
			: undefined,
		photos: Array.isArray(place?.photos)
			? place.photos.map((photo: any) =>
					String(photo.getURI({ maxWidth: 400 })),
				)
			: [],
		isOpen: place?.businessStatus === "OPERATIONAL",
		reviews: Array.isArray(place?.reviews)
			? place.reviews.map((review: any) => ({
					author: review.authorAttribution?.displayName || "Customer",
					rating: review.rating || 5,
					text:
						review.text?.text ||
						(typeof review.text === "string" ? review.text : ""),
					date: review.relativePublishTimeDescription || "",
				}))
			: [],
	};
}

function runWithConcurrency<T, R>(
	items: T[],
	limit: number,
	worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	const results: R[] = [];
	let nextIndex = 0;
	let active = 0;

	return new Promise((resolve, reject) => {
		const launchNext = () => {
			if (nextIndex >= items.length && active === 0) {
				resolve(results);
				return;
			}

			while (active < limit && nextIndex < items.length) {
				const currentIndex = nextIndex++;
				active += 1;
				Promise.resolve(worker(items[currentIndex], currentIndex))
					.then((value) => {
						results[currentIndex] = value;
					})
					.catch(reject)
					.finally(() => {
						active -= 1;
						launchNext();
					});
			}
		};

		launchNext();
	});
}

async function fetchExpandedKeywords(
	category: string,
	city: string,
): Promise<string[]> {
	const token = localStorage.getItem("ds_token");
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`${API_URL}/api/generate-search-keywords`, {
		method: "POST",
		headers,
		body: JSON.stringify({ category, city }),
	});

	if (!response.ok) {
		throw new Error(
			`Keyword expansion failed: ${response.status} ${response.statusText}`,
		);
	}

	const data = await response.json();
	const keywords = Array.isArray(data?.keywords) ? data.keywords : [];
	return keywords
		.filter((keyword: unknown) => typeof keyword === "string")
		.map((keyword: string) => keyword.trim())
		.filter(Boolean);
}

async function searchAllPagesForQuery(
	placesLib: typeof google.maps.places,
	query: string,
	coordinates: google.maps.LatLng | google.maps.LatLngLiteral,
): Promise<any[]> {
	const collected: any[] = [];
	let nextPageToken: string | undefined;

	do {
		const pageRequest: any = {
			textQuery: query,
			fields: DEFAULT_FIELD_SET,
			locationBias: coordinates,
			maxResultCount: 20,
			...(nextPageToken ? { pageToken: nextPageToken } : {}),
		};

		const response = await placesLib.Place.searchByText(pageRequest);
		const pagePlaces = response?.places || [];
		collected.push(...pagePlaces);
		nextPageToken = response?.nextPageToken || response?.next_page_token;

		if (nextPageToken) {
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	} while (nextPageToken);

	return collected;
}

function buildCandidateKey(business: Business): string {
	const idKey = normalize(business.id || "");
	const phoneKey = normalizePhone(business.phoneNumber);
	const websiteKey = normalizeWebsite(business.websiteUri);
	const fallbackKey = normalize(`${business.name}|${business.address}`);
	return [idKey, phoneKey, websiteKey, fallbackKey].filter(Boolean).join("::");
}

function scoreCandidate(record: CandidateRecord): number {
	const business = record.business;
	const keywordScore = record.matchedKeywords.size * 1000;
	const ratingScore = (business.rating || 0) * 20;
	const reviewScore = Math.min(business.reviewCount || 0, 2000) / 10;
	const websiteScore = business.websiteUri ? 10 : 0;
	const contactScore =
		(business.email ? 5 : 0) + (business.phoneNumber ? 5 : 0);
	return keywordScore + ratingScore + reviewScore + websiteScore + contactScore;
}

function sortCandidates(records: CandidateRecord[]): Business[] {
	return records
		.slice()
		.sort((left, right) => scoreCandidate(right) - scoreCandidate(left))
		.map((record) => record.business);
}

function uniqueDisplayNamesFromBusinesses(businesses: Business[]): string[] {
	const seen = new Set<string>();
	const names: string[] = [];

	for (const business of businesses) {
		const displayName = String(business.name || "").trim();
		if (!displayName || seen.has(displayName)) continue;
		seen.add(displayName);
		names.push(displayName);
	}

	return names;
}

function mergeBusinessCandidates(
	records: Map<string, CandidateRecord>,
	index: Map<string, string>,
	business: Business,
	keyword: string,
): void {
	const candidateKeys = [
		business.id,
		normalizePhone(business.phoneNumber),
		normalizeWebsite(business.websiteUri),
	]
		.map((value) => String(value || "").trim())
		.filter(Boolean);

	let targetRecordId: string | undefined;
	for (const key of candidateKeys) {
		const knownRecordId = index.get(key);
		if (knownRecordId) {
			targetRecordId = knownRecordId;
			break;
		}
	}

	if (!targetRecordId) {
		targetRecordId = buildCandidateKey(business);
		records.set(targetRecordId, {
			business,
			matchedKeywords: new Set([keyword]),
			score: 0,
		});
	} else {
		const existing = records.get(targetRecordId);
		if (existing) {
			existing.business = {
				...existing.business,
				...business,
				photos: Array.from(
					new Set([
						...(existing.business.photos || []),
						...(business.photos || []),
					]),
				),
				reviews:
					Array.isArray(existing.business.reviews) ||
					Array.isArray(business.reviews)
						? [
								...(existing.business.reviews || []),
								...(business.reviews || []),
							].slice(0, 6)
						: existing.business.reviews,
			};
			existing.matchedKeywords.add(keyword);
		} else {
			records.set(targetRecordId, {
				business,
				matchedKeywords: new Set([keyword]),
				score: 0,
			});
		}
	}

	for (const key of candidateKeys) {
		index.set(key, targetRecordId);
	}
}

export async function searchBusinessesExpanded({
	category,
	city,
	coordinates,
	placesLib,
	onProgress,
	onLog,
	concurrencyLimit = 4,
}: SearchBusinessesExpandedOptions): Promise<Business[]> {
	if (!placesLib) {
		throw new Error("Google Places library is unavailable");
	}

	const log = onLog || ((message: string) => console.log(message));

	const records = new Map<string, CandidateRecord>();
	const index = new Map<string, string>();
	let lastProgressLength = 0;

	const emitProgress = () => {
		const current = sortCandidates(Array.from(records.values()));
		if (current.length !== lastProgressLength) {
			lastProgressLength = current.length;
			onProgress?.(current);
		}
	};

	const expandedKeywords = await fetchExpandedKeywords(category, city).catch(
		() => [category],
	);
	const searchTerms = Array.from(
		new Map(
			[category, ...expandedKeywords]
				.map((term) => term.trim())
				.filter(Boolean)
				.map((term) => [normalize(term), term]),
		).values(),
	);

	log(
		`[Search] semantic keywords for "${category}" in "${city}": ${searchTerms.join(" | ")}`,
	);

	await runWithConcurrency(
		searchTerms,
		Math.max(1, Math.min(concurrencyLimit, 6)),
		async (keyword) => {
			const query = `${keyword} in ${city}`;
			log(`[Search] running Places query: ${query}`);
			const places = await searchAllPagesForQuery(
				placesLib,
				query,
				coordinates,
			);
			log(`[Search] query complete: ${query} -> ${places.length} raw results`);
			const keywordDisplayNames = uniqueDisplayNamesFromBusinesses(
				places.map((place) => toBusiness(place, category)),
			);
			log(
				`[Search] query displayNames for ${query}: ${keywordDisplayNames.join(" | ") || "<none>"}`,
			);

			for (const place of places) {
				const business = toBusiness(place, category);
				mergeBusinessCandidates(records, index, business, keyword);
			}

			emitProgress();
		},
	);

	const finalBusinesses = sortCandidates(Array.from(records.values()));
	log(
		`[Search] final unique displayNames (${finalBusinesses.length}): ${uniqueDisplayNamesFromBusinesses(
			finalBusinesses,
		).join(" | ")}`,
	);
	onProgress?.(finalBusinesses);
	return finalBusinesses;
}
