/** @format */

import { useState, useEffect, useRef } from "react";
import {
	SearchIcon,
	Globe,
	MapPin,
	Building,
	Activity,
	Phone,
	Mail,
	Navigation,
} from "lucide-react";
import { useMapsLibrary, useMap } from "@vis.gl/react-google-maps";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Business } from "../types";
import { cn } from "../lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { searchBusinessesExpanded } from "../lib/search-businesses-expanded";

interface SidebarProps {
	businesses: Business[];
	setBusinesses: (b: Business[]) => void;
	selectedBusiness: Business | null;
	setSelectedBusiness: (b: Business | null) => void;
}

function sanitizeBusiness(b: any): Business {
	return {
		id: String(b.id || ""),
		name: String(b.name || ""),
		category: String(b.category || ""),
		address: String(b.address || ""),
		rating: Number(b.rating || 0),
		reviewCount: Number(b.reviewCount || 0),
		location: {
			lat: Number(b.location?.lat || 0),
			lng: Number(b.location?.lng || 0),
		},
		websiteUri: b.websiteUri ? String(b.websiteUri) : undefined,
		email: b.email ? String(b.email) : undefined,
		phoneNumber: b.phoneNumber ? String(b.phoneNumber) : undefined,
		photos: Array.isArray(b.photos) ? b.photos.map((p) => String(p)) : [],
		imageSuggestions: Array.isArray(b.imageSuggestions)
			? b.imageSuggestions.map((s) => String(s))
			: [],
		logo: b.logo ? String(b.logo) : undefined,
		isOpen: Boolean(b.isOpen),
		reviews: Array.isArray(b.reviews) ? b.reviews : undefined,
	};
}

const API_URL =
	((import.meta as any).env?.VITE_API_URL as string | undefined) ||
	"http://localhost:5001";

async function enrichBusinessContacts(businesses: Business[]) {
	const sanitizedInputs = businesses.map(sanitizeBusiness);
	const enrichedBusinesses = await Promise.all(
		sanitizedInputs.map(async (business) => {
			// Always attempt enrichment, even when websiteUri is missing. Server will return
			// category-based image suggestions when no website is available.

			try {
				const response = await fetch(`${API_URL}/api/enrich-business`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						websiteUri: business.websiteUri,
						businessName: business.name,
						category: business.category,
						photos: business.photos,
					}),
				});

				if (!response.ok) {
					return business;
				}

				const data = await response.json();
				return {
					...business,
					email: data.email,
					phoneNumber: business.phoneNumber || data.phones?.[0],
					imageSuggestions: data.imageSuggestions || [],
					logo: data.logo || business.logo,
				};
			} catch {
				return business;
			}
		}),
	);

	return enrichedBusinesses;
}

async function qualifyLeads(
	businesses: Business[],
	city: string,
	category: string,
) {
	const sanitizedBusinesses = businesses.map(sanitizeBusiness);
	const response = await fetch(`${API_URL}/api/qualify-leads`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			businesses: sanitizedBusinesses,
			city,
			category,
		}),
	});

	if (!response.ok) {
		throw new Error(`Lead qualification failed: ${response.statusText}`);
	}

	const data = await response.json();
	return (data.businesses || []) as Business[];
}

export default function Sidebar({
	businesses,
	setBusinesses,
	selectedBusiness,
	setSelectedBusiness,
}: SidebarProps) {
	const [city, setCity] = useState("");
	const [category, setCategory] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [suggestions, setSuggestions] = useState<
		google.maps.places.AutocompletePrediction[]
	>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const suggestionRef = useRef<HTMLDivElement>(null);
	const autocompleteService =
		useRef<google.maps.places.AutocompleteService | null>(null);

	const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
	const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
	const categorySuggestionRef = useRef<HTMLDivElement>(null);

	const [activeTab, setActiveTab] = useState("search");

	const placesLib = useMapsLibrary("places");
	const geocodingLib = useMapsLibrary("geocoding");
	const map = useMap();

	useEffect(() => {
		if (placesLib && !autocompleteService.current) {
			autocompleteService.current = new placesLib.AutocompleteService();
		}
	}, [placesLib]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				suggestionRef.current &&
				!suggestionRef.current.contains(event.target as Node)
			) {
				setShowSuggestions(false);
			}
			if (
				categorySuggestionRef.current &&
				!categorySuggestionRef.current.contains(event.target as Node)
			) {
				setShowCategorySuggestions(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const COMMON_PLACE_TYPES = [
		"Accounting",
		"Airport",
		"Amusement Park",
		"Aquarium",
		"Art Gallery",
		"Atm",
		"Bakery",
		"Bank",
		"Bar",
		"Beauty Salon",
		"Bicycle Store",
		"Book Store",
		"Bowling Alley",
		"Bus Station",
		"Cafe",
		"Campground",
		"Car Dealer",
		"Car Rental",
		"Car Repair",
		"Car Wash",
		"Casino",
		"Cemetery",
		"Church",
		"City Hall",
		"Clothing Store",
		"Convenience Store",
		"Courthouse",
		"Dentist",
		"Department Store",
		"Doctor",
		"Drugstore",
		"Electrician",
		"Electronics Store",
		"Embassy",
		"Fire Station",
		"Florist",
		"Funeral Home",
		"Furniture Store",
		"Gas Station",
		"Gym",
		"Hair Care",
		"Hardware Store",
		"Hindu Temple",
		"Home Goods Store",
		"Hospital",
		"Insurance Agency",
		"Jewelry Store",
		"Laundry",
		"Lawyer",
		"Library",
		"Light Rail Station",
		"Liquor Store",
		"Local Government Office",
		"Locksmith",
		"Lodging",
		"Meal Delivery",
		"Meal Takeaway",
		"Mosque",
		"Movie Rental",
		"Movie Theater",
		"Moving Company",
		"Museum",
		"Night Club",
		"Painter",
		"Park",
		"Parking",
		"Pet Store",
		"Pharmacy",
		"Physiotherapist",
		"Plumber",
		"Police",
		"Post Office",
		"Primary School",
		"Real Estate Agency",
		"Restaurant",
		"Roofing Contractor",
		"Rv Park",
		"School",
		"Secondary School",
		"Shoe Store",
		"Shopping Mall",
		"Spa",
		"Stadium",
		"Storage",
		"Store",
		"Subway Station",
		"Supermarket",
		"Synagogue",
		"Taxi Stand",
		"Tourist Attraction",
		"Train Station",
		"Transit Station",
		"Travel Agency",
		"University",
		"Veterinary Care",
		"Zoo",
	];

	useEffect(() => {
		if (!category || category.length < 1) {
			setCategorySuggestions([]);
			return;
		}

		const filtered = COMMON_PLACE_TYPES.filter((t) =>
			t.toLowerCase().includes(category.toLowerCase()),
		).slice(0, 8);

		setCategorySuggestions(filtered);
	}, [category]);

	useEffect(() => {
		if (!city || city.length < 2 || !autocompleteService.current) {
			setSuggestions([]);
			return;
		}

		const timeoutId = setTimeout(() => {
			autocompleteService.current?.getPlacePredictions(
				{
					input: city,
					types: ["(regions)"], // Get cities/regions
				},
				(predictions, status) => {
					if (
						status === google.maps.places.PlacesServiceStatus.OK &&
						predictions
					) {
						setSuggestions(predictions);
					} else {
						setSuggestions([]);
					}
				},
			);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [city]);
	const filteredBusinesses = businesses;

	const handleSearch = async (overrideCategory?: string) => {
		const searchCategory =
			typeof overrideCategory === "string" && overrideCategory.length > 0
				? overrideCategory
				: category;
		if (!city || !searchCategory || !placesLib || !geocodingLib || !map) return;
		setIsLoading(true);
		setError(null);

		try {
			// First, get Coordinates for the City
			const geocoder = new geocodingLib.Geocoder();
			const geoResult = await geocoder.geocode({ address: city });
			if (!geoResult.results || geoResult.results.length === 0) {
				setIsLoading(false);
				return;
			}

			const location = geoResult.results[0].geometry.location;

			// Pan map to search area
			map.panTo(location);
			map.setZoom(12);

			const parsedBusinesses = await searchBusinessesExpanded({
				category: searchCategory,
				city,
				coordinates: location,
				placesLib,
				onProgress: (partialBusinesses) => {
					setBusinesses(partialBusinesses.map(sanitizeBusiness));
					setActiveTab("results");
				},
			});

			if (!parsedBusinesses || parsedBusinesses.length === 0) {
				setBusinesses([]);
				setActiveTab("results");
				return;
			}

			const websiteMissingCandidates = parsedBusinesses.filter(
				(b) => !b.websiteUri,
			);

			let candidatesToQualify =
				websiteMissingCandidates.length > 0
					? websiteMissingCandidates
					: parsedBusinesses;
			const enrichedBusinesses =
				await enrichBusinessContacts(candidatesToQualify);
			const qualifiedBusinesses = await qualifyLeads(
				enrichedBusinesses,
				city,
				searchCategory,
			);

			const finalBusinesses = qualifiedBusinesses.map(sanitizeBusiness);
			setBusinesses(finalBusinesses);
			setActiveTab("results");
		} catch (err: any) {
			console.error(err);
			setError(err?.message || "An error occurred during search.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='w-80 h-full border-r border-slate-200 bg-white flex flex-col z-20 shadow-[12px_0_40px_rgba(15,23,42,0.04)]'>
			<div className='p-6 pb-4 flex items-center gap-2 border-b border-slate-200'>
				<div className='w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-bold text-white'>
					DS
				</div>
				<h1 className='text-lg font-semibold tracking-tight text-slate-900'>
					Digital Scout
				</h1>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className='flex-1 flex flex-col'>
				<div className='px-6 py-2 border-b border-slate-200'>
					<TabsList className='grid w-full grid-cols-2 bg-slate-100 border border-slate-200 rounded-xl p-1'>
						<TabsTrigger
							value='search'
							className='rounded-lg text-xs font-medium uppercase tracking-wider !text-slate-600 data-[state=active]:!text-slate-900 data-[state=active]:bg-violet-50 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-violet-300 data-[state=active]:ring-1 data-[state=active]:ring-violet-200'>
							Search
						</TabsTrigger>
						<TabsTrigger
							value='results'
							className='rounded-lg text-xs font-medium uppercase tracking-wider !text-slate-600 data-[state=active]:!text-slate-900 data-[state=active]:bg-violet-50 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-violet-300 data-[state=active]:ring-1 data-[state=active]:ring-violet-200'>
							Results{" "}
							{businesses.length > 0 && (
								<Badge
									variant='secondary'
									className='ml-2 bg-violet-100 text-violet-700 border border-violet-200'>
									{businesses.length}
								</Badge>
							)}
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value='search' className='flex-1 p-6 space-y-6 mt-0'>
					<div className='space-y-4'>
						{error && (
							<div className='bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-medium'>
								{error}
							</div>
						)}
						<div className='space-y-1.5'>
							<label className='text-[10px] uppercase tracking-wider text-slate-600 font-bold'>
								Location
							</label>
							<div className='relative' ref={suggestionRef}>
								<Input
									placeholder='e.g. Austin, TX'
									value={city}
									onChange={(e) => {
										setCity(e.target.value);
										setShowSuggestions(true);
									}}
									onFocus={() => city.length >= 2 && setShowSuggestions(true)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleSearch();
											setShowSuggestions(false);
										}
									}}
									className='w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-violet-500 text-slate-900 placeholder:text-slate-400'
								/>
								{showSuggestions && suggestions.length > 0 && (
									<div className='absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden'>
										{suggestions.map((s) => (
											<button
												key={s.place_id}
												className='w-full px-4 py-2 text-left text-sm hover:bg-violet-50 flex items-center gap-2 text-slate-700 transition-colors border-b border-slate-50 last:border-0'
												onClick={() => {
													setCity(s.description);
													setShowSuggestions(false);
													setSuggestions([]);
												}}>
												<MapPin className='h-3.5 w-3.5 text-slate-400' />
												<span className='truncate'>{s.description}</span>
											</button>
										))}
									</div>
								)}
							</div>
						</div>
						<div className='space-y-1.5'>
							<label className='text-[10px] uppercase tracking-wider text-slate-600 font-bold'>
								Business Type
							</label>
							<div className='relative' ref={categorySuggestionRef}>
								<Input
									placeholder='e.g. Restaurants, Gyms, Salons'
									value={category}
									onChange={(e) => {
										setCategory(e.target.value);
										setShowCategorySuggestions(true);
									}}
									onFocus={() =>
										category.length > 0 && setShowCategorySuggestions(true)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleSearch();
											setShowCategorySuggestions(false);
										}
									}}
									className='w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-violet-500 text-slate-900 placeholder:text-slate-400'
								/>
								{showCategorySuggestions && categorySuggestions.length > 0 && (
									<div className='absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden'>
										{categorySuggestions.map((cat) => (
											<button
												key={cat}
												className='w-full px-4 py-2 text-left text-sm hover:bg-violet-50 flex items-center gap-2 text-slate-700 transition-colors border-b border-slate-50 last:border-0'
												onClick={() => {
													setCategory(cat);
													setShowCategorySuggestions(false);
													setCategorySuggestions([]);
													// Trigger search if city is present
													if (city) {
														handleSearch(cat);
													}
												}}>
												<Building className='h-3.5 w-3.5 text-slate-400' />
												<span className='truncate'>{cat}</span>
											</button>
										))}
									</div>
								)}
							</div>
						</div>

						<div className='flex gap-2 pt-2'>
							<Button
								onClick={() => handleSearch()}
								disabled={isLoading || !city || !category}
								className='flex-1 bg-violet-600 hover:bg-violet-500 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-violet-500/20 text-white border-0 h-9'>
								{isLoading ? (
									<span className='flex items-center gap-2'>
										<Activity className='w-4 h-4 animate-spin' />
										Scanning...
									</span>
								) : (
									<span className='flex items-center gap-2'>
										<SearchIcon className='w-4 h-4' />
										Scan Area
									</span>
								)}
							</Button>
						</div>
					</div>

					<div className='rounded-xl p-4 bg-slate-50 border border-slate-200 relative overflow-hidden text-slate-600'>
						<p className='text-[11px] leading-relaxed'>
							<strong>How it works:</strong> The Scout agent uses Google Search
							and Map Grounding to locate businesses in your target area
							completely lacking a web presence.
						</p>
					</div>
				</TabsContent>

				<TabsContent
					value='results'
					className='flex-1 mt-0 flex flex-col overflow-hidden'>
					{businesses.length === 0 ? (
						<div className='flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500'>
							<Building className='w-12 h-12 mb-4 opacity-20' />
							<p className='text-sm'>No leads discovered yet.</p>
						</div>
					) : filteredBusinesses.length === 0 ? (
						<div className='flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500'>
							<Building className='w-12 h-12 mb-4 opacity-20' />
							<p className='text-sm'>No leads match the current filter.</p>
						</div>
					) : (
						<div className='flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar'>
							{filteredBusinesses.map((business) => (
								<div
									key={business.id}
									className={cn(
										"sidebar-item p-3 rounded-lg border border-slate-200 bg-white cursor-pointer transition-all shadow-sm",
										selectedBusiness?.id === business.id
											? "border-violet-300 ring-1 ring-violet-200 bg-violet-50"
											: "opacity-90 hover:opacity-100 hover:border-violet-200",
									)}
									onClick={() => {
										setSelectedBusiness(business);
										if (map) {
											map.panTo(business.location);
											map.setZoom(16);
										}
									}}>
									<div className='flex justify-between items-start mb-1'>
										<h3 className='text-sm font-semibold text-slate-900'>
											{business.name}
										</h3>
										<div className='flex items-center gap-1.5 text-slate-500'>
											{business.websiteUri && <Globe className='h-3.5 w-3.5' />}
											{business.phoneNumber && (
												<Phone className='h-3.5 w-3.5' />
											)}
											{business.email && <Mail className='h-3.5 w-3.5' />}
										</div>
									</div>
									<div className='flex items-center gap-1 text-[11px] text-slate-500'>
										<span>{business.rating || "New"} stars</span>
										<span>•</span>
										<span>{business.reviewCount || 0} reviews</span>
									</div>
								</div>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
