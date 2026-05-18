/** @format */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Phone,
	Star,
	MapPin,
	Wand2,
	Rocket,
	Mail,
	CheckCircle2,
	ChevronRight,
} from "lucide-react";
import { Business, WebsiteProject } from "../types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { generateWebsite } from "../lib/gemini";
import { renderWebsiteArtifact } from "../lib/website-renderer";
import {
	buildWordPressProvisioningPlan,
	schemaToGutenbergBlocks,
} from "../lib/wordpress";
import { provisionWordPressSite } from "../lib/wordpress-client";
import {
	buildPreviewSummaryMarkdown,
	fetchGenerationDebugSummary,
	buildRendererVariantLog,
	renderWordPressDebugHtml,
	writeGenerationDebugFile,
} from "../lib/generation-debug";

interface LeadDetailsProps {
	business: Business;
	projects?: WebsiteProject[];
	setProjects?: React.Dispatch<React.SetStateAction<WebsiteProject[]>>;
	setActivePage?: (page: "discover" | "leads") => void;
}

export default function LeadDetails({
	business,
	projects = [],
	setProjects,
	setActivePage,
}: LeadDetailsProps) {
	const [isGenerating, setIsGenerating] = useState(false);
	const [isAddingLead, setIsAddingLead] = useState(false);

	const existingProject = projects.find((p) => p.businessId === business.id);

	const handleAddLead = async () => {
		setIsAddingLead(true);
		try {
			const leadId = business.id + "-" + Date.now();
			const partialSchema = {
				schemaVersion: "1.0",
				meta: {
					siteId: leadId,
					businessId: business.id,
					slug: (business.name || "site")
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-")
						.replace(/(^-|-$)/g, ""),
					version: 1,
					target: "wordpress"
				},
				brand: {
					businessName: business.name || "Demo Business",
					category: business.category || "Local Business",
					address: business.address || "",
					phone: business.phoneNumber || "",
					email: business.email || "",
					websiteUri: business.websiteUri || "",
					logo: business.logo || ""
				},
				_validation: {
					rating: business.rating || 0,
					reviewCount: business.reviewCount || 0,
					photos: business.photos || [],
					imageSuggestions: business.imageSuggestions || [],
					logo: business.logo || "",
				},
				sections: []
			};

			const API_URL = ((import.meta as any).env?.VITE_API_URL as string | undefined) || "http://localhost:5001";
			const response = await fetch(`${API_URL}/api/wordpress/provision-site`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					projectId: leadId,
					business,
					websiteSchema: partialSchema,
					status: "lead"
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to save lead");
			}

			if (setProjects) {
				setProjects((prev) => {
					const filtered = prev.filter((p) => p.businessId !== business.id);
					return [
						...filtered,
						{
							id: leadId,
							businessId: business.id,
							businessName: business.name,
							businessCategory: business.category,
							businessAddress: business.address,
							rating: business.rating,
							reviewCount: business.reviewCount,
							email: business.email,
							phoneNumber: business.phoneNumber,
							logo: business.logo,
							photos: business.photos || [],
							imageSuggestions: business.imageSuggestions || [],
							websiteContent: "",
							websiteSchema: partialSchema as any,
							provisioningStatus: "lead",
						},
					];
				});
			}
		} catch (error) {
			console.error("Failed to add lead:", error);
			alert("Failed to add lead. Check console.");
		} finally {
			setIsAddingLead(false);
		}
	};

	const getImageSources = () => {
		const imageSources = [
			...(business.photos || []),
			...(business.imageSuggestions || []),
		];

		const category = business.category.toLowerCase();
		const fallbackMap: Record<string, string[]> = {
			restaurant: [
				"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
				"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
			],
			bar: [
				"https://images.unsplash.com/photo-1541544181074-e33f5e69f2c9?auto=format&fit=crop&w=1200&q=80",
			],
			gym: [
				"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
			],
			salon: [
				"https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
			],
			cafe: [
				"https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
			],
			spa: [
				"https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
			],
		};

		Object.entries(fallbackMap).forEach(([key, values]) => {
			if (category.includes(key)) {
				imageSources.push(...values);
			}
		});

		return Array.from(new Set(imageSources)).slice(0, 4);
	};

	const handleGenerate = async () => {
		setIsGenerating(true);
		try {
			console.log("[Generate] Starting website generation for:", business.name);
			const generationResult = await generateWebsite(business);
			const schema = generationResult.schema;
			const debugTraceId = generationResult.debugTraceId;
			const debugFallbackUsed = generationResult.debugFallbackUsed;
			console.log("[Generate] Schema generated:", schema.meta?.siteId);
			let combinedCode = "";
			try {
				combinedCode = renderWebsiteArtifact({
					schema,
					html: "",
					css: "",
					js: "",
				});
			} catch (renderError) {
				console.warn(
					"[Generate] Preview renderer failed. Continuing with WordPress-only flow:",
					renderError,
				);
				if (debugTraceId) {
					await writeGenerationDebugFile(
						debugTraceId,
						"10-errors.log",
						`[${new Date().toISOString()}] preview_render_error: ${String(renderError)}`,
						true,
					);
				}
			}
			const wordpressBlocks = schemaToGutenbergBlocks(schema);
			const provisioningPlan = buildWordPressProvisioningPlan(schema, business);

			if (debugTraceId && combinedCode) {
				const debugSummary = await fetchGenerationDebugSummary(debugTraceId);
				const wordpressDebugHtml = renderWordPressDebugHtml({
					schema,
					wordpressBlocks,
					provisioningPlan,
				});

				await Promise.all([
					writeGenerationDebugFile(
						debugTraceId,
						"06-renderer-input.json",
						schema,
					),
					writeGenerationDebugFile(debugTraceId, "07-rendered-html.html", combinedCode),
					writeGenerationDebugFile(
						debugTraceId,
						"renderer_variant.log",
						buildRendererVariantLog({
							traceId: debugTraceId,
							schema,
							renderedHtml: combinedCode,
							wordpressBlocks,
							debugFallbackUsed,
						}),
					),
					writeGenerationDebugFile(
						debugTraceId,
						"08-wordpress-blocks.html",
						wordpressDebugHtml,
					),
					writeGenerationDebugFile(
						debugTraceId,
						"09-final-preview-summary.md",
						buildPreviewSummaryMarkdown({
							traceId: debugTraceId,
							schema,
							renderedHtml: combinedCode,
							wordpressBlocks: wordpressDebugHtml,
							summary: debugSummary,
							debugFallbackUsed,
						}),
					),
					writeGenerationDebugFile(
						debugTraceId,
						"10-errors.log",
						[
							...(debugSummary?.warnings || []).map(
								(line) => `[warning] ${line}`,
							),
							...(debugSummary?.errors || []).map((line) => `[server] ${line}`),
							...(debugFallbackUsed
								? ["[fallback] backend fallback was used"]
								: []),
						].join("\n"),
						true,
					),
				]);
			} else if (debugTraceId) {
				const wordpressDebugHtml = renderWordPressDebugHtml({
					schema,
					wordpressBlocks,
					provisioningPlan,
				});
				await Promise.all([
					writeGenerationDebugFile(debugTraceId, "06-renderer-input.json", schema),
					writeGenerationDebugFile(debugTraceId, "08-wordpress-blocks.html", wordpressDebugHtml),
				]);
			}

			if (setProjects) {
				const newId = business.id + "-" + Date.now();
				setProjects((prev) => {
					const filtered = prev.filter((p) => p.businessId !== business.id);
					return [
						...filtered,
						{
							id: newId,
							businessId: business.id,
							businessName: business.name,
							businessCategory: business.category,
							businessAddress: business.address,
							rating: business.rating,
							reviewCount: business.reviewCount,
							email: business.email,
							phoneNumber: business.phoneNumber,
							logo: business.logo,
							photos: business.photos || [],
							imageSuggestions: business.imageSuggestions || [],
							websiteContent: combinedCode,
							websiteSchema: schema,
							wordpressBlocks,
							wordpressSiteType: "multisite",
							provisioningStatus: "provisioning",
							subsiteCreationStatus: "pending",
							adminCreationStatus: "pending",
							themeInstallStatus: "pending",
							mediaImportStatus: "pending",
							contentImportStatus: "pending",
							homepageSetupStatus: "pending",
							credentialsStatus: "pending",
							outreachStatus: "Pending",
						},
					];
				});

				try {
					console.log(
						"[WordPress Provision] Starting subsite provisioning for:",
						business.name,
					);
					setProjects((prev) =>
						prev.map((p) =>
							p.id === newId
								? {
										...p,
										provisioningStatus: "provisioning",
										subsiteCreationStatus: "in_progress",
									}
								: p,
						),
					);

					const provisionResult = await provisionWordPressSite({
						projectId: newId,
						business,
						websiteSchema: schema,
					});

					setProjects((prev) =>
						prev.map((p) =>
							p.id === newId
								? {
										...p,
										provisioningStatus: "pending",
										lastProvisionedAt: new Date().toISOString(),
									}
								: p,
						),
					);
				} catch (provisionErr) {
					console.error("[WordPress Provision] Error:", provisionErr);
					setProjects((prev) =>
						prev.map((p) =>
							p.id === newId
								? {
										...p,
										provisioningStatus: "failed",
										subsiteCreationStatus: "failed",
										adminCreationStatus: "failed",
										themeInstallStatus: "failed",
										mediaImportStatus: "failed",
										contentImportStatus: "failed",
										homepageSetupStatus: "failed",
										credentialsStatus: "failed",
										provisioningError: String(provisionErr),
										provisioningLogs: [
											{
												timestamp: new Date().toISOString(),
												step: "subsite_creation",
												level: "error",
												message: String(provisionErr),
											},
										],
									}
								: p,
						),
					);
					if (debugTraceId) {
						await writeGenerationDebugFile(
							debugTraceId,
							"10-errors.log",
							`[${new Date().toISOString()}] wordpress_provisioning_error: ${String(provisionErr)}`,
							true,
						);
					}
				}
			}
		} catch (error) {
			console.error(error);
			alert("Failed to generate website. Check console.");
		} finally {
			setIsGenerating(false);
		}
	};

	const imageSources = getImageSources();

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 20 }}
				transition={{ type: "spring", stiffness: 300, damping: 25 }}
				className='absolute top-20 right-10 w-[450px] max-h-[calc(100vh-100px)] flex flex-col glass rounded-2xl shadow-2xl overflow-hidden z-50 accent-glow text-slate-900'>
				<div className='p-6 border-b border-slate-200 relative'>
					<div className='absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-violet-500'>
						<Rocket className='w-24 h-24' />
					</div>
					<div className='flex items-start justify-between relative z-10'>
						<div>
							<h2 className='text-2xl font-bold tracking-tight mb-1 text-slate-900'>
								{business.name}
							</h2>
							<div className='flex items-center text-sm text-slate-500 gap-3'>
								<span className='flex items-center'>
									<MapPin className='w-3.5 h-3.5 mr-1 text-violet-500' />{" "}
									{business.address}
								</span>
							</div>
						</div>
					</div>

					<div className='flex items-center gap-4 mt-4 relative z-10 flex-wrap'>
						<div className='flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200'>
							<Star className='w-3.5 h-3.5 text-yellow-400 fill-yellow-400' />
							<span className='text-sm font-bold text-amber-600'>
								{business.rating || "N/A"}
							</span>
							<span className='text-[10px] text-slate-500'>
								({business.reviewCount || 0} reviews)
							</span>
						</div>
						{business.phoneNumber && (
							<div className='flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200'>
								<Phone className='w-3.5 h-3.5 text-slate-500' />
								<span className='text-sm text-slate-700'>
									{business.phoneNumber}
								</span>
							</div>
						)}
						{business.email && (
							<div className='flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200'>
								<Mail className='w-3.5 h-3.5 text-slate-500' />
								<span className='text-sm text-slate-700 truncate max-w-[180px]'>
									{business.email}
								</span>
							</div>
						)}
					</div>
				</div>

				<div className='p-6 space-y-6 overflow-y-auto'>
					{imageSources.length > 0 && (
						<div className='grid grid-cols-2 gap-3'>
							{imageSources.slice(0, 4).map((image, index) => (
								<div
									key={`${image}-${index}`}
									className='rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-28'>
									<img
										src={image}
										alt={`${business.name} visual ${index + 1}`}
										className='w-full h-full object-cover'
									/>
								</div>
							))}
						</div>
					)}

					{!existingProject ? (
						<div className='bg-slate-50 border border-slate-200 rounded-xl p-6 text-center'>
							<div className='w-16 h-16 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center mx-auto mb-4'>
								<Wand2 className='w-8 h-8 text-violet-600' />
							</div>
							<h3 className='text-lg font-bold mb-2 text-slate-900'>
								Automated Pitch Generation
							</h3>
							<p className='text-xs text-slate-600 mb-6 max-w-sm mx-auto'>
								Create a premium website schema, preview
								it instantly, and provision a dedicated WordPress Multisite CMS
								for {business.name}.
							</p>
							<div className='flex flex-col gap-3'>
								<Button
									onClick={handleAddLead}
									disabled={isAddingLead}
									className='w-full bg-violet-600 hover:bg-violet-500 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-violet-600/15 text-white border-0 h-12'>
									{isAddingLead ? (
										<span className='flex items-center gap-2'>
											<Wand2 className='w-5 h-5 animate-spin' /> Adding to Leads...
										</span>
									) : (
										<span className='flex items-center gap-2'>
											<Wand2 className='w-5 h-5' /> Add to Leads
										</span>
									)}
								</Button>
								<Button
									onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + ", " + business.address)}`, "_blank")}
									className='w-full bg-white hover:bg-slate-50 py-3 rounded-xl font-bold text-sm transition-all text-slate-700 border border-slate-200 h-12 flex items-center justify-center gap-2 shadow-none'>
									<MapPin className='w-4 h-4 text-rose-500' /> Open Google Maps Location
								</Button>
							</div>
						</div>
					) : existingProject.provisioningStatus === "lead" ? (
						<div className='bg-violet-50 border border-violet-200 rounded-xl p-6 text-center'>
							<div className='w-16 h-16 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center mx-auto mb-4'>
								<CheckCircle2 className='w-8 h-8 text-violet-600' />
							</div>
							<h3 className='text-lg font-bold mb-2 text-violet-700'>
								Lead Added!
							</h3>
							<p className='text-xs text-slate-600 mb-6 max-w-sm mx-auto'>
								{business.name} is in your leads dashboard. You can generate a premium website prototype for them from the Leads tab.
							</p>
							<div className='flex flex-col gap-3'>
								<Button
									onClick={() => setActivePage?.("leads")}
									className='w-full bg-violet-600 hover:bg-violet-500 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 text-white border-0 h-12 shadow-xl shadow-violet-600/15'>
									Go to Leads <ChevronRight className='w-4 h-4 ml-1' />
								</Button>
								<Button
									onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + ", " + business.address)}`, "_blank")}
									className='w-full bg-white hover:bg-slate-50 py-3 rounded-xl font-bold text-sm transition-all text-slate-700 border border-slate-200 h-12 flex items-center justify-center gap-2 shadow-none'>
									<MapPin className='w-4 h-4 text-rose-500' /> Open Google Maps Location
								</Button>
							</div>
						</div>
					) : (
						<div className='bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center'>
							<div className='w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4'>
								<CheckCircle2 className='w-8 h-8 text-emerald-600' />
							</div>
							<h3 className='text-lg font-bold mb-2 text-emerald-700'>
								Website Generated!
							</h3>
							<p className='text-xs text-slate-600 mb-6 max-w-sm mx-auto'>
								The website for {business.name} is in the leads dashboard with
								its WordPress Multisite provisioning status, site URL, and admin
								access details.
							</p>
							<div className='flex flex-col gap-3'>
								<Button
									onClick={() => setActivePage?.("leads")}
									className='w-full bg-white hover:bg-slate-50 py-3 rounded-xl font-bold text-sm transition-all text-slate-700 border border-slate-200 h-12 shadow-none'>
									Go to Leads <ChevronRight className='w-4 h-4 ml-1' />
								</Button>
								<Button
									onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + ", " + business.address)}`, "_blank")}
									className='w-full bg-white hover:bg-slate-50 py-3 rounded-xl font-bold text-sm transition-all text-slate-700 border border-slate-200 h-12 flex items-center justify-center gap-2 shadow-none'>
									<MapPin className='w-4 h-4 text-rose-500' /> Open Google Maps Location
								</Button>
							</div>
						</div>
					)}
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
