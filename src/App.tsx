/** @format */

import { useState, useEffect } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";

import { Business, WebsiteProject } from "./types";
import Sidebar from "./components/Sidebar";
import MapArea from "./components/MapArea";
import DeploymentsView from "./components/DeploymentsView";

const API_KEY =
	process.env.GOOGLE_MAPS_PLATFORM_KEY ||
	(import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
	(globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
	"";
const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

export default function App() {
	const [businesses, setBusinesses] = useState<Business[]>([]);
	const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
		null,
	);
	const [projects, setProjects] = useState<WebsiteProject[]>([]);
	const [activePage, setActivePage] = useState<"discover" | "leads">(
		"discover",
	);

	useEffect(() => {
		const fetchLeads = async () => {
			const API_URL = ((import.meta as any).env?.VITE_API_URL as string | undefined) || "http://localhost:5001";
			try {
				const response = await fetch(`${API_URL}/api/leads`);
				if (response.ok) {
					const data = await response.json();
					setProjects(data);
				}
			} catch (error) {
				console.error("Failed to fetch leads:", error);
			}
		};

		fetchLeads();
	}, []);

	if (!hasValidKey) {
		return (
			<div className='flex h-screen items-center justify-center bg-[#f5f7fb] font-sans text-slate-900'>
				<div className='glass max-w-lg rounded-2xl border border-slate-200 bg-white/80 p-8 text-center shadow-xl'>
					<h2 className='mb-4 text-2xl font-bold tracking-tight text-slate-900'>
						API Key Required
					</h2>
					<p className='mb-4 text-slate-600'>
						Digital Scout requires a Google Maps Platform API key.
					</p>
					<ul className='mb-6 space-y-2 text-left leading-relaxed'>
						<li>
							<span className='font-semibold text-violet-600'>Step 1:</span>{" "}
							<a
								className='underline transition-colors hover:text-violet-700'
								href='https://console.cloud.google.com/google/maps-apis/start'
								target='_blank'
								rel='noopener noreferrer'>
								Get an API Key
							</a>
						</li>
						<li>
							<span className='font-semibold text-violet-600'>Step 2:</span>{" "}
							Open <strong>Settings</strong> (⚙️ gear icon,{" "}
							<strong>top-right corner</strong>)
						</li>
						<li>
							<span className='font-semibold text-violet-600'>Step 3:</span>{" "}
							Select <strong>Secrets</strong>
						</li>
						<li>
							<span className='font-semibold text-violet-600'>Step 4:</span>{" "}
							Type{" "}
							<code className='rounded bg-slate-100 px-1 py-0.5 text-slate-700'>
								GOOGLE_MAPS_PLATFORM_KEY
							</code>
							, paste your key, and press Enter
						</li>
					</ul>
				</div>
			</div>
		);
	}

	return (
		<APIProvider apiKey={API_KEY} version='weekly'>
			<div className='light-theme relative flex h-screen w-full overflow-hidden bg-[#f5f7fb] text-slate-900'>
				<div className='pointer-events-none absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-violet-200/40 blur-[120px]' />
				<div className='pointer-events-none absolute bottom-[-20%] right-[-10%] h-[40%] w-[40%] rounded-full bg-sky-200/30 blur-[120px]' />

				<Sidebar
					businesses={businesses}
					setBusinesses={setBusinesses}
					selectedBusiness={selectedBusiness}
					setSelectedBusiness={setSelectedBusiness}
				/>
				<div className='map-bg relative flex min-h-0 flex-1 flex-col border-t border-slate-200 md:border-t-0'>
					<nav className='absolute top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/75 px-8 backdrop-blur-xl'>
						<div className='flex h-full items-center gap-6'>
							<button
								onClick={() => setActivePage("discover")}
								className={`flex h-full items-center pt-[2px] text-sm font-medium transition-all ${activePage === "discover" ? "border-b-2 border-violet-500 text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
								Discover
							</button>
							<button
								onClick={() => setActivePage("leads")}
								className={`flex h-full items-center pt-[2px] text-sm font-medium transition-all ${activePage === "leads" ? "border-b-2 border-violet-500 text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
								Leads{" "}
								{projects.length > 0 && (
									<span className='ml-2 rounded-full bg-violet-500 px-1.5 py-0.5 text-[10px] text-white'>
										{projects.length}
									</span>
								)}
							</button>
						</div>
						<div className='flex items-center gap-4'>
							<div className='flex h-8 w-8 items-center justify-center rounded-full border border-violet-200 bg-violet-100 text-[10px] font-bold text-violet-700'>
								DS
							</div>
						</div>
					</nav>

					<div className='relative min-h-0 flex-1 pt-16'>
						{activePage === "discover" ? (
							<MapArea
								businesses={businesses}
								selectedBusiness={selectedBusiness}
								setSelectedBusiness={setSelectedBusiness}
								setProjects={setProjects}
								setActivePage={setActivePage}
								projects={projects}
							/>
						) : (
							<DeploymentsView projects={projects} setProjects={setProjects} />
						)}
					</div>
				</div>
			</div>
		</APIProvider>
	);
}
