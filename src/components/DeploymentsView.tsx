/** @format */

import React, { useState } from "react";
import { WebsiteProject, Business } from "../types";
import { renderWebsiteArtifact } from "../lib/website-renderer";
import {
	Globe,
	Mail,
	CheckCircle2,
	Activity,
	Eye,
	Trash2,
	MapPin,
	Star,
	BriefcaseBusiness,
	Phone,
	ShieldCheck,
	Database,
	KeyRound,
	ExternalLink,
	Send,
	X,
	Wand2,
	Copy,
	Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { deleteProvisionedWordPressSite, provisionWordPressSite } from "../lib/wordpress-client";
import { generateWebsite } from "../lib/gemini";
import { schemaToGutenbergBlocks, buildWordPressProvisioningPlan } from "../lib/wordpress";
import {
	buildPreviewSummaryMarkdown,
	fetchGenerationDebugSummary,
	buildRendererVariantLog,
	renderWordPressDebugHtml,
	writeGenerationDebugFile,
} from "../lib/generation-debug";

interface DeploymentsViewProps {
	projects: WebsiteProject[];
	setProjects: React.Dispatch<React.SetStateAction<WebsiteProject[]>>;
}

export default function DeploymentsView({
	projects,
	setProjects,
}: DeploymentsViewProps) {
	const [deployingId, setDeployingId] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const handleCopy = (text: string, id: string) => {
		navigator.clipboard.writeText(text);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
	};
	const [sendingId, setSendingId] = useState<string | null>(null);
	const [outreachModalOpen, setOutreachModalOpen] = useState(false);
	const [outreachProjectId, setOutreachProjectId] = useState<string | null>(
		null,
	);
	const [outreachMessage, setOutreachMessage] = useState(
		"Hi! We've created a premium website for your business. Check it out and let us know what you think.",
	);
	const [outreachChannel, setOutreachChannel] = useState<"whatsapp" | "sms">(
		"whatsapp",
	);

	const stopDeployment = async (projectId: string) => {
		const project = projects.find((item) => item.id === projectId);
		if (!project) return false;

		setDeletingId(projectId);

		try {
			// Purge WordPress/Isolated deployments
			await deleteProvisionedWordPressSite(projectId);
			return true;
		} catch (error) {
			console.error("Failed to stop deployment:", error);
			alert(
				error instanceof Error ? error.message : "Failed to stop deployment.",
			);
			return false;
		} finally {
			setDeletingId(null);
		}
	};

	const handleGenerateWebsiteForLead = async (project: WebsiteProject) => {
		setDeployingId(project.id);
		try {
			console.log("[Generate] Starting website generation for lead:", project.businessName);
			
			// Construct a Business object from the lead's properties
			const business: Business = {
				id: project.businessId,
				name: project.businessName,
				category: project.businessCategory || "General",
				address: project.businessAddress,
				rating: project.rating,
				reviewCount: project.reviewCount,
				email: project.email,
				phoneNumber: project.phoneNumber,
				logo: project.logo,
				photos:
					project.photos ||
					((project.websiteSchema as any)?._validation?.photos ?? []),
				imageSuggestions:
					project.imageSuggestions ||
					((project.websiteSchema as any)?._validation?.imageSuggestions ?? []),
				location: { lat: 39.8283, lng: -98.5795 } // default US center
			};

			const generationResult = await generateWebsite(business);
			const schema = generationResult.schema;
			const debugTraceId = generationResult.debugTraceId;
			const debugFallbackUsed = generationResult.debugFallbackUsed;
			
			console.log("[Generate] Schema generated for lead:", schema.meta?.siteId);
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
					writeGenerationDebugFile(
						debugTraceId,
						"07-rendered-html.html",
						combinedCode,
					),
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
				]).catch(err => console.warn("Failed to write debug files:", err));
			} else if (debugTraceId) {
				const wordpressDebugHtml = renderWordPressDebugHtml({
					schema,
					wordpressBlocks,
					provisioningPlan,
				});
				await Promise.all([
					writeGenerationDebugFile(debugTraceId, "06-renderer-input.json", schema),
					writeGenerationDebugFile(debugTraceId, "08-wordpress-blocks.html", wordpressDebugHtml),
				]).catch(err => console.warn("Failed to write WordPress-only debug files:", err));
			}

			// Update frontend state immediately to show generating progress
			setProjects((prev) =>
				prev.map((p) =>
					p.id === project.id
						? {
								...p,
								websiteContent: combinedCode,
								websiteSchema: schema,
								wordpressBlocks,
								photos: p.photos || business.photos || [],
								imageSuggestions:
									p.imageSuggestions || business.imageSuggestions || [],
								wordpressSiteType: "multisite",
								provisioningStatus: "provisioning",
								subsiteCreationStatus: "in_progress",
								adminCreationStatus: "pending",
								themeInstallStatus: "pending",
								mediaImportStatus: "pending",
								contentImportStatus: "pending",
								homepageSetupStatus: "pending",
								credentialsStatus: "pending",
								outreachStatus: "Pending",
							}
						: p
				)
			);

			console.log("[WordPress Provision] Provisioning WordPress site for lead:", project.businessName);
			await provisionWordPressSite({
				projectId: project.id,
				business,
				websiteSchema: schema,
			});

			setProjects((prev) =>
				prev.map((p) =>
					p.id === project.id
						? {
								...p,
								provisioningStatus: "pending",
								lastProvisionedAt: new Date().toISOString(),
							}
						: p
				)
			);

		} catch (error) {
			console.error("Failed to generate website for lead:", error);
			const errorMsg = error instanceof Error ? error.message : String(error);
			if ((error as any).status === 422) {
				alert(`Website generation could not be completed: ${errorMsg}. Please try again.`);
			} else {
				alert("Failed to generate website. Check console.");
			}
			setProjects((prev) =>
				prev.map((p) =>
					p.id === project.id
						? {
								...p,
								provisioningStatus: "failed",
								provisioningError: String(error),
							}
						: p
				)
			);
		} finally {
			setDeployingId(null);
		}
	};

	const handleSendOutreach = (projectId: string) => {
		setOutreachProjectId(projectId);
		setOutreachModalOpen(true);
	};

	const sendOutreachMessage = async () => {
		const project = projects.find((item) => item.id === outreachProjectId);
		if (!project || !project.phoneNumber) return;

		setSendingId(outreachProjectId);
		const API_URL =
			((import.meta as any).env?.VITE_API_URL as string | undefined) ||
			"http://localhost:5001";

		try {
			const response = await fetch(`${API_URL}/api/outreach/send`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					businessName: project.businessName,
					phoneNumber: project.phoneNumber,
					message: outreachMessage,
					preferredChannel: outreachChannel,
				}),
			});

			const data = (await response.json()) as any;

			if (response.ok && data.success) {
				console.log(
					`[Outreach] Message sent via ${data.channel} to ${project.phoneNumber}`,
				);
				setProjects((prev) =>
					prev.map((item) =>
						item.id === outreachProjectId
							? {
									...item,
									emailSent: true,
									outreachStatus: `Sent via ${data.channel}`,
									outreachSentAt: new Date().toISOString(),
								}
							: item,
					),
				);
				setOutreachModalOpen(false);
				setOutreachMessage(
					"Hi! We've created a premium website for your business. Check it out and let us know what you think.",
				);
				setOutreachChannel("whatsapp");
				alert(`✓ Message sent via ${data.channel} to ${project.phoneNumber}`);
			} else {
				const errorMsg = data.error || "Failed to send message";
				console.error("[Outreach] Error:", errorMsg);
				alert(`✗ Error: ${errorMsg}`);
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : "Network error";
			console.error("[Outreach] Exception:", error);
			alert(`✗ Error: ${errorMsg}`);
		} finally {
			setSendingId(null);
		}
	};

	const handlePreview = async (projectId: string) => {
		const project = projects.find((item) => item.id === projectId);
		if (!project) return;

		if (project.wordpressSiteUrl) {
			window.open(project.wordpressSiteUrl, "_blank");
			return;
		}

		// If no URL available immediately, show a loading window while we check the latest status
		const previewWindow = window.open("", "_blank");
		if (previewWindow) {
			previewWindow.document.write(`
				<!DOCTYPE html>
				<html>
					<head>
						<title>Connecting to WordPress...</title>
						<style>
							body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f8fafc; color: #64748b; }
							.loader { text-align: center; }
							.spinner { border: 3px solid #e2e8f0; border-top: 3px solid #7c3aed; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
							@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
						</style>
					</head>
					<body>
						<div class="loader">
							<div class="spinner"></div>
							<p>Checking WordPress provisioning status for <b>${project.businessName}</b>...</p>
						</div>
					</body>
				</html>
			`);
		}

		const API_URL =
			((import.meta as any).env?.VITE_API_URL as string | undefined) ||
			"http://localhost:5001";

		try {
			const dsToken = localStorage.getItem("ds_token");
			const headers: Record<string, string> = {};
			if (dsToken) {
				headers["Authorization"] = `Bearer ${dsToken}`;
			}
			const response = await fetch(`${API_URL}/api/wordpress/site-status/${projectId}`, {
				headers,
			});
			if (response.ok) {
				const data = await response.json();
				if (data.deployment?.liveUrl) {
					// Update local state and redirect
					setProjects((prev) =>
						prev.map((p) =>
							p.id === projectId
								? {
										...p,
										wordpressSiteUrl: data.deployment.liveUrl,
										wordpressAdminUrl: data.deployment.adminUrl,
									}
								: p
						)
					);
					if (previewWindow) {
						previewWindow.location.href = data.deployment.liveUrl;
					}
					return;
				}
			}
			
			// If we get here, it's either failed or still provisioning and has no URL
			if (previewWindow) {
				previewWindow.document.body.innerHTML = `<div style="padding: 24px; font-family: sans-serif; color: #ef4444; text-align: center;">The WordPress site for ${project.businessName} is still being provisioned or failed.<br/><br/>Please check the dashboard status.</div>`;
			}
		} catch (error) {
			console.error("Failed to check site status:", error);
			if (previewWindow) {
				previewWindow.document.body.innerHTML = `<div style="padding: 24px; font-family: sans-serif; color: #ef4444; text-align: center;">Failed to connect to the server.<br/>${String(error)}</div>`;
			}
		}
	};

	const getPreviewHtml = (project: WebsiteProject) => {
		// If WP site is live, return null — we'll use src iframe instead
		if (project.wordpressSiteUrl) {
			return null;
		}
		if (project.websiteSchema) {
			return renderWebsiteArtifact({
				schema: project.websiteSchema,
				html: "",
				css: "",
				js: "",
			});
		}
		return project.websiteContent;
	};

	const getGeneratedDate = (projectId: string) => {
		const project = projects.find((item) => item.id === projectId);

		// Try to parse lastProvisionedAt as a timestamp
		if (project?.lastProvisionedAt) {
			try {
				const timestamp = Number(project.lastProvisionedAt);
				if (!Number.isNaN(timestamp) && timestamp > 0) {
					const date = new Date(timestamp);
					if (!Number.isNaN(date.getTime())) {
						return `Generated on ${date.toLocaleDateString()}`;
					}
				}
			} catch {
				// Fall through to default
			}
		}

		return "Recently generated";
	};

	const handleDeleteLead = async (projectId: string) => {
		const project = projects.find((item) => item.id === projectId);
		if (!project) return;

		const confirmed = window.confirm(
			`Delete lead for ${project.businessName}? This cannot be undone.`,
		);
		if (!confirmed) return;

		try {
			const stopped = await stopDeployment(projectId);
			if (!stopped && (project.isDeployed || project.siteId)) {
				return;
			}

			setProjects((prev) => prev.filter((item) => item.id !== projectId));
		} catch (error) {
			console.error("Failed to delete lead:", error);
			alert(error instanceof Error ? error.message : "Failed to delete lead.");
		}
	};

	const displayProjects = [...projects].sort((left, right) => {
		const leftTime = Number(left.id.split("-")[1] || 0);
		const rightTime = Number(right.id.split("-")[1] || 0);
		return rightTime - leftTime;
	});

	const totalLeads = projects.length;
	const liveWebsites = projects.filter((project) => project.isDeployed).length;
	const cmsReadyWebsites = projects.filter(
		(project) =>
			project.provisioningStatus === "ready" ||
			project.provisioningStatus === "completed",
	).length;
	const emailsSent = projects.filter((project) => project.emailSent).length;

	const getLeadStatusLabel = (project: WebsiteProject) => {
		if (project.emailSent) return "EMAIL SENT";
		if (project.isDeployed) return "WEBSITE LIVE";
		return "DRAFT";
	};

	const getLeadStatusTone = (project: WebsiteProject) => {
		if (project.emailSent) return "bg-amber-500/90 text-white";
		if (project.isDeployed) return "bg-violet-600/95 text-white";
		return "bg-slate-100 text-slate-700";
	};

	const getProvisioningLabel = (project: WebsiteProject) => {
		switch (project.provisioningStatus) {
			case "completed":
				return project.sslStatus === "pending" ? "Site Live" : "CMS Ready";
			case "lead":
				return "Lead Profile";
			case "pending":
				return "Queueing";
			case "creating_subdomain":
				return "DNS Setup";
			case "creating_database":
				return "Database Setup";
			case "installing_wordpress":
				return "WP Install";
			case "configuring_wordpress":
				return "WP Config";
			case "deploying_content":
				return "Pushing Content";
			case "validating":
				return "Validating";
			case "failed":
				return "Failed";
			default:
				return project.provisioningStatus || "Not Started";
		}
	};

	const getProvisioningTone = (project: WebsiteProject) => {
		switch (project.provisioningStatus) {
			case "completed":
				return project.sslStatus === "pending"
					? "border-emerald-200 bg-emerald-50 text-emerald-700"
					: "border-cyan-200 bg-cyan-50 text-cyan-700";
			case "lead":
				return "border-violet-200 bg-violet-50 text-violet-700";
			case "failed":
				return "border-rose-200 bg-rose-50 text-rose-700";
			case "pending":
			case "creating_subdomain":
			case "creating_database":
			case "installing_wordpress":
			case "configuring_wordpress":
			case "deploying_content":
			case "validating":
				return "border-amber-200 bg-amber-50 text-amber-700 animate-pulse";
			default:
				return "border-slate-200 bg-slate-50 text-slate-600";
		}
	};

	React.useEffect(() => {
		const activeProjects = projects.filter(
			(p) =>
				(p.provisioningStatus &&
					!["completed", "failed", "ready", "dry-run", "lead"].includes(
						p.provisioningStatus,
					)) ||
				(
					p.provisioningStatus === "completed" &&
					!!p.wordpressSiteUrl &&
					(!p.wordpressPassword || !p.wordpressOwnerUsername)
				),
		);

		if (activeProjects.length === 0) return;

		const interval = setInterval(() => {
			activeProjects.forEach(async (project) => {
				try {
					const API_URL =
						((import.meta as any).env?.VITE_API_URL as string | undefined) ||
						"http://localhost:5001";
					const dsToken = localStorage.getItem("ds_token");
					const headers: Record<string, string> = {};
					if (dsToken) {
						headers["Authorization"] = `Bearer ${dsToken}`;
					}
					const response = await fetch(
						`${API_URL}/api/wordpress/site-status/${project.id}`,
						{ headers }
					);
					if (response.ok) {
						const data = await response.json();
						setProjects((prev) =>
							prev.map((p) =>
								p.id === project.id
									? {
											...p,
											provisioningStatus:
												data.status ||
												(data.deployment?.liveUrl ? "completed" : p.provisioningStatus),
											wordpressSiteUrl: data.deployment?.liveUrl,
											wordpressAdminUrl: data.deployment?.adminUrl,
											wordpressOwnerUsername: data.deployment?.username,
											wordpressPassword: data.deployment?.password,
											sslStatus: data.deployment?.sslStatus,
										}
									: p,
							),
						);
					}
				} catch (error) {
					console.error("Polling error:", error);
				}
			});
		}, 3000);

		return () => clearInterval(interval);
	}, [projects, setProjects]);

	const getCategoryLabel = (project: WebsiteProject) =>
		project.businessCategory || "General";

	const getRatingLabel = (project: WebsiteProject) => {
		if (typeof project.rating === "number") {
			return `${project.rating.toFixed(1)} Rating`;
		}

		return "N/A Rating";
	};

	if (projects.length === 0) {
		return (
			<div className='flex h-full flex-col items-center justify-center p-8 text-center text-slate-500'>
				<Globe className='mb-4 h-16 w-16 opacity-20' />
				<h2 className='mb-2 text-xl font-medium text-slate-700'>
					No Leads Yet
				</h2>
				<p className='max-w-md text-sm'>
					Generate a website prototype from the Discover tab to see it here.
				</p>
			</div>
		);
	}

	return (
		<div className='h-full min-h-0 w-full overflow-y-auto px-6 pb-32 lg:px-8'>
			<div className='mx-auto flex w-full max-w-[1600px] flex-col gap-6 min-w-0'>
				<div className='space-y-4 w-full min-w-0'>
					{displayProjects.map((project) => {
						const isLive = project.provisioningStatus === "completed" || project.provisioningStatus === "ready";
						const isSent = Boolean(project.emailSent);
						const statusLabel = getLeadStatusLabel(project);
						const isActionLoading = deployingId === project.id;

						return (
							<article
								key={project.id}
								className='group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_90px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_30px_100px_rgba(15,23,42,0.1)] sm:p-5 lg:p-6 w-full min-w-0'>
								<div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.05),transparent_25%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
								<div className='relative flex flex-col gap-5 w-full min-w-0'>
									<div className='flex min-w-0 flex-1 flex-col gap-5'>
										<div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between w-full min-w-0'>
											<div className='min-w-0 flex-1 space-y-3'>
												<div className='flex flex-wrap items-center gap-2'>
													<Badge className='rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-violet-700'>
														{getCategoryLabel(project)}
													</Badge>
													<Badge className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-600'>
														{getRatingLabel(project)}
													</Badge>
													<Badge
														className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${getProvisioningTone(project)}`}>
														{getProvisioningLabel(project)}
													</Badge>
												</div>
												<div className='space-y-1 min-w-0'>
													<h3 className='truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.7rem]'>
														{project.businessName}
													</h3>
													<p className='flex flex-wrap items-center gap-2 text-sm text-slate-500'>
														<a
															href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.businessName + ", " + project.businessAddress)}`}
															target='_blank'
															rel='noreferrer'
															className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 hover:bg-slate-100 hover:border-violet-300 transition-all cursor-pointer'>
															<MapPin className='h-3.5 w-3.5 text-violet-500' />
															{project.businessAddress}
														</a>
														<span className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5'>
															<ShieldCheck className='h-3.5 w-3.5 text-emerald-500' />
															{getGeneratedDate(project.id)}
														</span>
													</p>
													{project.wordpressPassword && (
														<div className='mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1.5 max-w-md'>
															<p className='font-bold mb-1'>WordPress Admin Credentials</p>
															<div className='flex items-center gap-1.5'>
																<span>User:</span>
																<span className='font-mono bg-white/50 px-1.5 py-0.5 rounded'>{project.wordpressOwnerUsername}</span>
																<button
																	onClick={() => handleCopy(project.wordpressOwnerUsername || "", `${project.id}-user`)}
																	className='text-amber-700 hover:text-amber-900 p-1 rounded hover:bg-amber-100/50 transition-colors flex items-center justify-center'
																	title='Copy Username'>
																	{copiedId === `${project.id}-user` ? (
																		<Check className='h-3.5 w-3.5 text-emerald-600' />
																	) : (
																		<Copy className='h-3.5 w-3.5' />
																	)}
																</button>
															</div>
															<div className='flex items-center gap-1.5'>
																<span>Pass:</span>
																<span className='font-mono bg-white/50 px-1.5 py-0.5 rounded'>{project.wordpressPassword}</span>
																<button
																	onClick={() => handleCopy(project.wordpressPassword || "", `${project.id}-pass`)}
																	className='text-amber-700 hover:text-amber-900 p-1 rounded hover:bg-amber-100/50 transition-colors flex items-center justify-center'
																	title='Copy Password'>
																	{copiedId === `${project.id}-pass` ? (
																		<Check className='h-3.5 w-3.5 text-emerald-600' />
																	) : (
																		<Copy className='h-3.5 w-3.5' />
																	)}
																</button>
															</div>
															<p className='mt-1 text-[10px] text-amber-600 italic'>Save these! They are only shown once.</p>
														</div>
													)}
													{project.deployedUrl && (
														<a
															href={project.deployedUrl}
															target='_blank'
															rel='noreferrer'
															className='inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100'>
															<Globe className='h-3.5 w-3.5 flex-shrink-0' />
															<span className='truncate'>
																{project.deployedUrl}
															</span>
														</a>
													)}
												</div>
											</div>

											<div className='flex flex-col gap-3 xl:items-end justify-start flex-shrink-0'>
												{isSent && (
													<Badge className='rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 self-end'>
														Outreach sent
													</Badge>
												)}
												<div className='flex flex-col gap-2 w-full sm:w-[180px]'>
													{isLive && project.wordpressSiteUrl && (
														<Button
															onClick={() => window.open(project.wordpressSiteUrl, "_blank")}
															disabled={deletingId === project.id}
															className='h-10 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 text-cyan-700 hover:bg-cyan-100 flex items-center justify-center gap-1.5 font-semibold w-full'>
															<Globe className='h-4 w-4' />
															WP Preview
														</Button>
													)}
													{isLive && project.wordpressAdminUrl && (
														<Button
															onClick={() => window.open(project.wordpressAdminUrl, "_blank")}
															disabled={deletingId === project.id}
															className='h-10 rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 font-semibold w-full'>
															<KeyRound className='h-4 w-4' />
															WP Admin
														</Button>
													)}
													{project.provisioningStatus === "lead" ? (
														<Button
															onClick={() => handleGenerateWebsiteForLead(project)}
															disabled={isActionLoading || deletingId === project.id}
															className='h-10 rounded-2xl bg-violet-600 px-4 text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 border-none font-semibold flex items-center justify-center gap-2 shadow-xl shadow-violet-600/15 w-full'>
															{isActionLoading ? (
																<Activity className='h-4 w-4 animate-spin' />
															) : (
																<Wand2 className='h-4 w-4' />
															)}
															Generate Website
														</Button>
													) : (
														<Button
															onClick={() => handleSendOutreach(project.id)}
															disabled={
																!isLive || sendingId === project.id || deletingId === project.id
															}
															className='h-10 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-1.5 font-semibold w-full'>
															{sendingId === project.id ? (
																<Activity className='h-4 w-4 animate-spin' />
															) : (
																<Mail className='h-4 w-4' />
															)}
															Send Outreach
														</Button>
													)}
													<Button
														onClick={() => handleDeleteLead(project.id)}
														disabled={deletingId === project.id}
														className='h-10 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-rose-700 transition-all duration-200 hover:border-rose-600 hover:bg-rose-600 hover:text-white shadow-none flex items-center justify-center gap-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60 w-full'>
														{deletingId === project.id ? (
															<Activity className='h-4 w-4 animate-spin' />
														) : (
															<Trash2 className='h-4 w-4' />
														)}
														{deletingId === project.id ? "Deleting..." : "Delete Lead"}
													</Button>
												</div>
											</div>
										</div>


										{project.provisioningError && (
											<div className='rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100'>
												WordPress provisioning issue:
												<span className='mt-1 block text-xs text-rose-200/75'>
													{project.provisioningError}
												</span>
											</div>
										)}

										<div className='relative flex items-center justify-between gap-3 border-t border-slate-200 pt-4'>
											<div className='flex flex-wrap items-center gap-3 text-xs text-slate-500'>
												<span className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5'>
													<BriefcaseBusiness className='h-3.5 w-3.5 text-violet-500' />
													{project.businessCategory || "General"}
												</span>
												<span className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5'>
													<Phone className='h-3.5 w-3.5 text-cyan-500' />
													{project.phoneNumber || "No phone listed"}
												</span>
												<span className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5'>
													<Mail className='h-3.5 w-3.5 text-amber-500' />
													{project.email || "No email listed"}
												</span>
											</div>
											<div />
										</div>
									</div>
								</div>
							</article>
						);
					})}
				</div>
			</div>

			{/* Outreach Modal */}
			{outreachModalOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
					<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl'>
						<div className='flex items-center justify-between mb-4'>
							<h2 className='text-xl font-semibold text-white'>
								Send Outreach
							</h2>
							<button
								onClick={() => setOutreachModalOpen(false)}
								className='text-slate-500 hover:text-slate-900 transition-colors'>
								<X className='h-5 w-5' />
							</button>
						</div>

						<div className='space-y-4'>
							{/* Business Info */}
							<div className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
								<p className='text-sm text-slate-500'>To:</p>
								<p className='text-white font-medium'>
									{projects.find((p) => p.id === outreachProjectId)
										?.businessName || "Unknown"}
								</p>
								<p className='text-sm text-slate-500'>
									{projects.find((p) => p.id === outreachProjectId)
										?.phoneNumber || "No phone"}
								</p>
							</div>

							{/* Channel Selection */}
							<div>
								<label className='block text-sm font-medium text-white mb-2'>
									Channel
								</label>
								<div className='flex gap-2'>
									<button
										onClick={() => setOutreachChannel("whatsapp")}
										className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
											outreachChannel === "whatsapp"
												? "border-emerald-200 bg-emerald-50 text-emerald-700"
												: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
										}`}>
										WhatsApp
									</button>
									<button
										onClick={() => setOutreachChannel("sms")}
										className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
											outreachChannel === "sms"
												? "border-blue-200 bg-blue-50 text-blue-700"
												: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
										}`}>
										SMS
									</button>
								</div>
							</div>

							{/* Message Input */}
							<div>
								<label className='block text-sm font-medium text-white mb-2'>
									Message
								</label>
								<textarea
									value={outreachMessage}
									onChange={(e) => setOutreachMessage(e.currentTarget.value)}
									className='w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500'
									rows={4}
									placeholder='Enter your outreach message...'
								/>
								<p className='text-xs text-slate-500 mt-1'>
									{outreachMessage.length}/160 characters
								</p>
							</div>

							{/* Actions */}
							<div className='flex gap-2 pt-2'>
								<Button
									onClick={() => setOutreachModalOpen(false)}
									variant='outline'
									className='flex-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'>
									Cancel
								</Button>
								<Button
									onClick={sendOutreachMessage}
									disabled={sendingId !== null || !outreachMessage.trim()}
									className='flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'>
									{sendingId ? (
										<>
											<Activity className='mr-2 h-4 w-4 animate-spin' />
											Sending...
										</>
									) : (
										<>
											<Send className='mr-2 h-4 w-4' />
											Send {outreachChannel === "whatsapp" ? "WhatsApp" : "SMS"}
										</>
									)}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

		</div>
	);
}
