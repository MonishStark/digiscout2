/** @format */

import {
	Business,
	ProvisioningLogEntry,
	ProvisioningStepStatus,
	ProvisioningStatus,
	WebsiteSchema,
	WordPressProvisioningSite,
} from "../types";
import { buildWordPressProvisioningPlan } from "./wordpress";

const API_URL =
	((import.meta as any).env?.VITE_API_URL as string | undefined) ||
	"http://localhost:5001";

export interface WordPressProvisionSiteRequest {
	projectId: string;
	business: Business;
	websiteSchema: WebsiteSchema;
	ownerEmail?: string;
	ownerUsername?: string;
}

export interface WordPressProvisionSiteResult {
	success: boolean;
	jobId?: string;
	message?: string;
	error?: string;
}

export async function provisionWordPressSite(
	request: WordPressProvisionSiteRequest,
): Promise<WordPressProvisionSiteResult> {
	const plan = buildWordPressProvisioningPlan(
		request.websiteSchema,
		request.business,
		{
			ownerEmail: request.ownerEmail,
			ownerUsername: request.ownerUsername,
		},
	);

	const response = await fetch(`${API_URL}/api/wordpress/provision-site`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			projectId: request.projectId,
			business: request.business,
			websiteSchema: request.websiteSchema,
			provisioningPlan: plan,
		}),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.error ||
				`WordPress provisioning failed: ${response.status} ${response.statusText}`,
		);
	}

	return (await response.json()) as WordPressProvisionSiteResult;
}

export async function deleteProvisionedWordPressSite(
	projectId: number | string,
): Promise<void> {
	const response = await fetch(`${API_URL}/api/wordpress/site/${projectId}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		const payload = await response.json().catch(() => ({}));
		throw new Error(
			payload.error || `Failed to delete provisioned site ${projectId}.`,
		);
	}
}
