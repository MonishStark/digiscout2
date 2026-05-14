"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploySiteToNetlify = deploySiteToNetlify;
exports.deleteDeployedSite = deleteDeployedSite;
const API_URL = import.meta.env?.VITE_API_URL ||
    "http://localhost:5001";
async function deploySiteToNetlify(websiteContent, businessName) {
    try {
        console.log(`Calling backend API at: ${API_URL}/api/deploy`);
        const response = await fetch(`${API_URL}/api/deploy`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                websiteContent,
                businessName,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Backend deployment error:", errorData);
            throw new Error(errorData.error || `Deployment failed: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Deployment successful:", data);
        if (!data.deployedUrl || !data.siteId) {
            throw new Error("No deployment URL returned from server");
        }
        return {
            deployedUrl: data.deployedUrl,
            siteId: data.siteId,
            deployId: data.deployId || "",
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Failed to deploy";
        console.error("Deployment error:", message);
        throw new Error(message);
    }
}
async function deleteDeployedSite(siteId) {
    const response = await fetch(`${API_URL}/api/sites/${siteId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete deployment: ${response.statusText}`);
    }
}
