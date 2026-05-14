/** @format */

import { useState } from "react";
import {
	SearchIcon,
	Globe,
	MapPin,
	Building,
	Activity,
	Phone,
	Mail,
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

interface SidebarProps {
	businesses: Business[];
	setBusinesses: (b: Business[]) => void;
	selectedBusiness: Business | null;
	setSelectedBusiness: (b: Business | null) => void;
}

const API_URL =
	((import.meta as any).env?.VITE_API_URL as string | undefined) ||
	"http://localhost:5001";

async function enrichBusinessContacts(businesses: Business[]) {
	const enrichedBusinesses = await Promise.all(
		businesses.map(async (business) => {
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
	const response = await fetch(`${API_URL}/api/qualify-leads`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			businesses,
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

	const [activeTab, setActiveTab] = useState("search");

	const placesLib = useMapsLibrary("places");
	const geocodingLib = useMapsLibrary("geocoding");
	const map = useMap();
	const filteredBusinesses = businesses;

	const handleSearch = async () => {
		if (!city || !category || !placesLib || !geocodingLib || !map) return;
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

			// Search Nearby
			const request = {
				textQuery: `${category} in ${city}`,
				fields: [
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
				],
				locationBias: location,
				maxResultCount: 20,
			};

			const { places } = await placesLib.Place.searchByText(request);

			if (!places) {
				setBusinesses([]);
				setActiveTab("results");
				return;
			}

			// Filter: ONLY include businesses that DO NOT have a website, or if we consider them outdated (for now we stick to no website for strict filtering, or just flag them)
			const parsedBusinesses: Business[] = places.map((p) => {
				return {
					id: p.id!,
					name: p.displayName || "Unknown Business",
					category: category,
					address: p.formattedAddress || "",
					rating: p.rating || 0,
					reviewCount: p.userRatingCount || 0,
					location: { lat: p.location!.lat(), lng: p.location!.lng() },
					websiteUri: p.websiteURI || undefined,
					phoneNumber: p.nationalPhoneNumber || undefined,
					photos: p.photos
						? p.photos.map((photo) => photo.getURI({ maxWidth: 400 }))
						: [],
					isOpen: p.businessStatus === "OPERATIONAL",
				};
			});

			const websiteMissingCandidates = parsedBusinesses.filter(
				(b) => !b.websiteUri,
			);
			const candidatesToQualify =
				websiteMissingCandidates.length > 0
					? websiteMissingCandidates
					: parsedBusinesses;
			const enrichedBusinesses =
				await enrichBusinessContacts(candidatesToQualify);
			const qualifiedBusinesses = await qualifyLeads(
				enrichedBusinesses,
				city,
				category,
			);

			setBusinesses(qualifiedBusinesses);
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
							<Input
								placeholder='e.g. Austin, TX'
								value={city}
								onChange={(e) => setCity(e.target.value)}
								className='w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-violet-500 text-slate-900 placeholder:text-slate-400'
							/>
						</div>
						<div className='space-y-1.5'>
							<label className='text-[10px] uppercase tracking-wider text-slate-600 font-bold'>
								Business Type
							</label>
							<Input
								placeholder='e.g. Restaurants, Gyms, Salons'
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className='w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-violet-500 text-slate-900 placeholder:text-slate-400'
							/>
						</div>

						<div className='flex gap-2 pt-2'>
							<Button
								onClick={handleSearch}
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
					className='flex-1 mt-0 flex flex-col h-[calc(100vh-170px)]'>
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
						<ScrollArea className='flex-1'>
							<div className='p-4 space-y-2'>
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
												{business.websiteUri && (
													<Globe className='h-3.5 w-3.5' />
												)}
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
						</ScrollArea>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
