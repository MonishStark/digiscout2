"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
exports.provisionWordPressSite = provisionWordPressSite;
exports.deleteProvisionedWordPressSite = deleteProvisionedWordPressSite;
const wordpress_1 = require("./wordpress");
const API_URL = import.meta.env?.VITE_API_URL ||
    "http://localhost:5001";
async function provisionWordPressSite(request) {
    const plan = (0, wordpress_1.buildWordPressProvisioningPlan)(request.websiteSchema, request.business, {
        ownerEmail: request.ownerEmail,
        ownerUsername: request.ownerUsername,
    });
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
    const text = await response.text().catch(() => "");
    let parsed = null;
    try {
        parsed = JSON.parse(text);
    }
    catch {
        parsed = null;
    }
    if (!response.ok) {
        throw new Error(parsed?.error ||
            parsed?.details ||
            `WordPress provisioning failed: ${response.status} ${response.statusText}`);
    }
    if (!parsed) {
        throw new Error("WordPress provisioning returned invalid JSON.");
    }
    return parsed;
}
async function deleteProvisionedWordPressSite(siteId) {
    const response = await fetch(`${API_URL}/api/wordpress/site/${siteId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Failed to delete provisioned site ${siteId}.`);
    }
}
