/** @format */

import React, { useState } from "react";
import { WebsiteProject } from "../types";
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
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { deleteProvisionedWordPressSite } from "../lib/wordpress-client";

interface DeploymentsViewProps {
	projects: WebsiteProject[];
	setProjects: React.Dispatch<React.SetStateAction<WebsiteProject[]>>;
}

export default function DeploymentsView({
	projects,
	setProjects,
}: DeploymentsViewProps) {
	const [deployingId, setDeployingId] = useState<string | null>(null);
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

		setDeployingId(projectId);

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
			const response = await fetch(`${API_URL}/api/wordpress/site-status/${projectId}`);
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
		if (project.wordpressSiteUrl && project.provisioningStatus === "completed") {
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
				return "CMS Ready";
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
				return "border-cyan-200 bg-cyan-50 text-cyan-700";
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
				p.provisioningStatus &&
				!["completed", "failed", "ready", "dry-run"].includes(
					p.provisioningStatus,
				),
		);

		if (activeProjects.length === 0) return;

		const interval = setInterval(() => {
			activeProjects.forEach(async (project) => {
				try {
					const API_URL =
						((import.meta as any).env?.VITE_API_URL as string | undefined) ||
						"http://localhost:5001";
					const response = await fetch(
						`${API_URL}/api/wordpress/site-status/${project.id}`,
					);
					if (response.ok) {
						const data = await response.json();
						setProjects((prev) =>
							prev.map((p) =>
								p.id === project.id
									? {
											...p,
											provisioningStatus: data.status,
											wordpressSiteUrl: data.deployment?.liveUrl,
											wordpressAdminUrl: data.deployment?.adminUrl,
											wordpressOwnerUsername: data.deployment?.username,
											wordpressPassword: data.deployment?.password,
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
			<div className='mx-auto flex w-full max-w-[1600px] flex-col gap-6'>
				<div className='space-y-4'>
					{displayProjects.map((project) => {
						const isLive = project.provisioningStatus === "completed" || project.provisioningStatus === "ready";
						const isSent = Boolean(project.emailSent);
						const statusLabel = getLeadStatusLabel(project);
						const isActionLoading = deployingId === project.id;

						return (
							<article
								key={project.id}
								className='group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_90px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_30px_100px_rgba(15,23,42,0.1)] sm:p-5 lg:p-6'>
								<div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.05),transparent_25%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
								<div className='relative flex flex-col gap-5 xl:flex-row xl:items-stretch xl:gap-6'>
									{/* ── MINI PREVIEW ── */}
									<div className='relative h-[200px] w-full overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:h-[220px] xl:h-auto xl:w-[320px] xl:flex-shrink-0'>
										{project.wordpressSiteUrl && isLive ? (
											<iframe
												src={project.wordpressSiteUrl}
												className='absolute left-0 top-0 h-full w-full border-0'
												loading='lazy'
												style={{
													transform: 'scale(0.5)',
													transformOrigin: 'top left',
													width: '200%',
													height: '200%',
													pointerEvents: 'none',
												}}
												title={`Preview of ${project.businessName}`}
											/>
										) : (
											<div className='flex h-full w-full flex-col items-center justify-center p-6 text-center'>
												<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600'>
													<Database className='h-6 w-6 animate-pulse' />
												</div>
												<p className='text-sm font-medium text-slate-600'>
													Building your unique site...
												</p>
												<p className='mt-1 text-xs text-slate-400'>
													Provisioning Hello Elementor & Content
												</p>
											</div>
										)}
										<div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none' />
										<div className='absolute left-4 top-4 flex items-center gap-2'>
											<Badge className='rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-600 backdrop-blur-xl'>
												{getProvisioningLabel(project)}
											</Badge>
										</div>
									</div>

									<div className='flex min-w-0 flex-1 flex-col gap-5'>
										<div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
											<div className='min-w-0 space-y-3'>
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
												<div className='space-y-1'>
													<h3 className='truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.7rem]'>
														{project.businessName}
													</h3>
													<p className='flex flex-wrap items-center gap-2 text-sm text-slate-500'>
														<span className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5'>
															<MapPin className='h-3.5 w-3.5 text-violet-500' />
															{project.businessAddress}
														</span>
														<span className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5'>
															<ShieldCheck className='h-3.5 w-3.5 text-emerald-500' />
															{getGeneratedDate(project.id)}
														</span>
													</p>
													{isLive && project.wordpressSiteUrl && (
														<a
															href={project.wordpressSiteUrl}
															target='_blank'
															rel='noreferrer'
															className='inline-flex max-w-full items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs text-cyan-700 hover:bg-cyan-100'>
															<Database className='h-3.5 w-3.5 flex-shrink-0' />
															<span className='truncate'>
																{project.wordpressSiteUrl}
															</span>
														</a>
													)}
													{isLive && project.wordpressAdminUrl && (
														<a
															href={project.wordpressAdminUrl}
															target='_blank'
															rel='noreferrer'
															className='inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50'>
															<KeyRound className='h-3.5 w-3.5 flex-shrink-0' />
															<span className='truncate'>WP Admin</span>
															<ExternalLink className='h-3 w-3 flex-shrink-0' />
														</a>
													)}
													{project.wordpressPassword && (
														<div className='mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800'>
															<p className='font-bold mb-1'>WordPress Admin Credentials</p>
															<p>User: <span className='font-mono bg-white/50 px-1 rounded'>{project.wordpressOwnerUsername}</span></p>
															<p>Pass: <span className='font-mono bg-white/50 px-1 rounded'>{project.wordpressPassword}</span></p>
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

											<div className='flex flex-col gap-3 xl:items-end'>
												<div className='flex flex-wrap items-center gap-2 xl:justify-end'>
													{isSent && (
														<Badge className='rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700'>
															Outreach sent
														</Badge>
													)}
												</div>
												<div className='flex flex-wrap items-center gap-2 xl:justify-end'>
													<Button
														onClick={() => handleSendOutreach(project.id)}
														disabled={
															!isLive || sendingId === project.id
														}
														className='h-10 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60'>
														{sendingId === project.id ? (
															<Activity className='mr-2 h-4 w-4 animate-spin' />
														) : (
															<Mail className='mr-2 h-4 w-4' />
														)}
														Send Outreach
													</Button>
													<Button
														onClick={() => handleDeleteLead(project.id)}
														className='h-10 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-rose-700 transition-all duration-200 hover:border-rose-600 hover:bg-rose-600 hover:text-white shadow-none'>
														<Trash2 className='mr-2 h-4 w-4' />
														Delete Lead
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
