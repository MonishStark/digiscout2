import fs from "fs";
import path from "path";
import { ElementorHomepageContent } from "./vertex-homepage-generation-prompt";

interface MediaItem {
	id: number | string;
	url: string;
}

export function mergeElementorTemplate(
	templateDir: string,
	aiContent: ElementorHomepageContent,
	mediaMap: Record<string, MediaItem>,
	businessInfo: {
		name: string;
		address: string;
		phone: string;
		email: string;
	},
	menuId?: string | number,
): string {
	// Paths to templates
	const homePath = path.join(templateDir, "content", "page", "2.json");
	const headerPath = path.join(templateDir, "templates", "15.json");
	const footerPath = path.join(templateDir, "templates", "244.json");

	if (!fs.existsSync(homePath)) {
		throw new Error(`Home page template not found at ${homePath}`);
	}
	if (!fs.existsSync(headerPath)) {
		throw new Error(`Header template not found at ${headerPath}`);
	}
	if (!fs.existsSync(footerPath)) {
		throw new Error(`Footer template not found at ${footerPath}`);
	}

	// Parse JSON files
	const homeData = JSON.parse(fs.readFileSync(homePath, "utf8"));
	const headerData = JSON.parse(fs.readFileSync(headerPath, "utf8"));
	const footerData = JSON.parse(fs.readFileSync(footerPath, "utf8"));

	// Extract content arrays
	const homeSections = homeData.content || [];
	const headerSections = headerData.content || [];
	const footerSections = footerData.content || [];

	// Helper to resolve media item from map
	const getLocalMedia = (url?: string): MediaItem | null => {
		if (!url) return null;
		if (mediaMap[url]) return mediaMap[url];
		// Try fuzzy matching (e.g. without query parameters or protocols)
		const cleanUrl = url.split("?")[0].replace(/^https?:/, "");
		for (const key of Object.keys(mediaMap)) {
			const cleanKey = key.split("?")[0].replace(/^https?:/, "");
			if (cleanKey === cleanUrl) {
				return mediaMap[key];
			}
		}
		return null;
	};

	// Helper to recursively find and modify widgets by widgetType
	const processElements = (elements: any[], sectionIndex: number, sectionTitle: string) => {
		for (const el of elements) {
			if (el.elType === "column" && el.settings) {
				// Column background images
				if (el.settings.background_image && el.settings.background_image.url) {
					const origUrl = el.settings.background_image.url;
					let targetUrl = "";
					if (sectionTitle === "Hero section") {
						targetUrl = aiContent.hero?.hero_image || "";
					} else if (sectionTitle === "What we do") {
						targetUrl = aiContent.services?.image || "";
					}
					const local = getLocalMedia(targetUrl);
					if (local) {
						el.settings.background_image.url = local.url;
						el.settings.background_image.id = String(local.id);
					}
				}

				// Column background slideshow (Testimonials gallery)
				if (el.settings.background_background === "slideshow" && Array.isArray(el.settings.background_slideshow_gallery)) {
					const localSlideshow: any[] = [];
					const slideshowUrls = aiContent.testimonials?.slideshow || [];
					for (let i = 0; i < Math.min(3, slideshowUrls.length); i++) {
						const targetUrl = slideshowUrls[i];
						const local = getLocalMedia(targetUrl);
						if (local) {
							localSlideshow.push({
								id: String(local.id),
								url: local.url,
							});
						}
					}
					if (localSlideshow.length > 0) {
						el.settings.background_slideshow_gallery = localSlideshow;
					}
				}
			}

			if (el.elType === "widget" && el.widgetType) {
				const type = el.widgetType;
				const settings = el.settings || {};

				if (type === "heading" && settings.title) {
					const currentTitle = String(settings.title).trim();

					if (sectionTitle === "Hero section" && currentTitle.includes("wood shop")) {
						settings.title = aiContent.hero?.heading || "";
					} else if (sectionTitle === "Highest level" && currentTitle.includes("Highest level")) {
						settings.title = aiContent.about?.heading || "";
					} else if (sectionTitle === "What we do" && currentTitle.includes("What we do")) {
						settings.title = aiContent.services?.heading || "";
					} else if (sectionTitle === "Exceptional quality" && currentTitle.includes("Exceptional quality")) {
						settings.title = aiContent.features?.heading || "";
					} else if (sectionTitle === "Recent projects" && currentTitle.includes("Recent projects")) {
						settings.title = aiContent.projects?.heading || "";
					} else if (sectionTitle === "Work Process" && currentTitle.includes("Work Process")) {
						settings.title = aiContent.process?.heading || "";
					} else if (sectionTitle === "Client testimonials" && currentTitle.includes("Client testimonials")) {
						settings.title = aiContent.testimonials?.heading || "";
					} else if (currentTitle.includes("Let’s discuss your project!")) {
						settings.title = `Let’s discuss your project!`;
					} else if (settings.__dynamic__ && settings.__dynamic__.title && settings.__dynamic__.title.includes("current-date-time")) {
						// Copyright heading: Replace dynamic tag with static text to avoid Pro dependency
						delete settings.__dynamic__;
						settings.title = `${businessInfo.name} © ${new Date().getFullYear()} All Rights Reserved.`;
					}
				}

				if (type === "text-editor" && settings.editor) {
					if (sectionTitle === "Highest level") {
						settings.editor = `<p>${aiContent.about?.description || ""}</p>`;
					} else if (sectionTitle === "What we do") {
						settings.editor = aiContent.services?.description || "";
					} else if (sectionTitle === "Recent projects") {
						settings.editor = aiContent.projects?.description || "";
					} else if (String(settings.editor).includes("Don’t hesitate to contact us")) {
						settings.editor = `<p>Don’t hesitate to contact us. We’ll be happy to discuss your needs, provide estimates, and answer all your questions.</p>`;
					}
				}

				if (type === "button") {
					const btnText = String(settings.text || "");
					if (sectionTitle === "Hero section" && btnText.includes("Projects")) {
						settings.text = `${aiContent.hero?.button_text || "Get Started"} ➔`;
						settings.link = {
							url: "#services",
							is_external: "",
							nofollow: "",
							custom_attributes: "",
						};
					} else if (sectionTitle === "Highest level" && btnText.includes("Learn More")) {
						settings.text = `${aiContent.about?.button_text || "Learn More"} ➔`;
						settings.link = {
							url: "#services",
							is_external: "",
							nofollow: "",
							custom_attributes: "",
						};
					} else if (btnText.includes("Contact Us")) {
						settings.link = {
							url: "#contact",
							is_external: "",
							nofollow: "",
							custom_attributes: "",
						};
					} else if (btnText.includes("Call Us")) {
						delete settings.__dynamic__;
						settings.text = `Call Us ${businessInfo.phone}`;
						settings.link = {
							url: `tel:${businessInfo.phone.replace(/[^0-9+]/g, "")}`,
							is_external: "",
							nofollow: "",
							custom_attributes: "",
						};
					}
				}

				if (type === "image" && settings.image) {
					let targetUrl = "";
					if (sectionTitle === "Hero section") {
						targetUrl = aiContent.hero?.masked_image || "";
					} else if (sectionTitle === "Highest level") {
						targetUrl = aiContent.about?.image || "";
					}
					const local = getLocalMedia(targetUrl);
					if (local) {
						settings.image.url = local.url;
						settings.image.id = String(local.id);
					}
				}

				if (type === "icon-list" && Array.isArray(settings.icon_list)) {
					if (sectionTitle === "What we do") {
						// Left column list (first list) vs right column list (second list)
						// Left list has "Restaurant and Retail Furniture" placeholder
						const isLeftList = settings.icon_list.some((item: any) =>
							String(item.text).includes("Restaurant"),
						);
						const servicesList = aiContent.services?.list || [];
						if (isLeftList) {
							for (let i = 0; i < 4; i++) {
								if (settings.icon_list[i] && servicesList[i]) {
									settings.icon_list[i].text = servicesList[i];
								}
							}
						} else {
							for (let i = 0; i < 4; i++) {
								if (settings.icon_list[i] && servicesList[i + 4]) {
									settings.icon_list[i].text = servicesList[i + 4];
								}
							}
						}
					} else if (sectionTitle === "Footer" && settings.icon_list.some((item: any) => item.text && item.text.includes("@"))) {
						// Footer contact info list
						for (const item of settings.icon_list) {
							const text = String(item.text || "");
							if (text.includes("St Germain")) {
								item.text = businessInfo.address;
							} else if (text.includes("620-637")) {
								item.text = businessInfo.phone;
								item.link = { url: `tel:${businessInfo.phone.replace(/[^0-9+]/g, "")}` };
							} else if (text.includes("ray@woodworking")) {
								item.text = businessInfo.email;
								item.link = { url: `mailto:${businessInfo.email}` };
							}
						}
					}
				}

				if (type === "icon-box") {
					const title = String(settings.title_text || "");
					if (sectionTitle === "Exceptional quality" && aiContent.features?.items) {
						if (title.includes("quality") && aiContent.features.items[0]) {
							settings.title_text = aiContent.features.items[0].title;
							settings.description_text = aiContent.features.items[0].description;
						} else if (title.includes("experience") && aiContent.features.items[1]) {
							settings.title_text = aiContent.features.items[1].title;
							settings.description_text = aiContent.features.items[1].description;
						} else if (title.includes("details") && aiContent.features.items[2]) {
							settings.title_text = aiContent.features.items[2].title;
							settings.description_text = aiContent.features.items[2].description;
						}
					} else if (sectionTitle === "Work Process" && aiContent.process?.steps) {
						if (title.includes("Brief") && aiContent.process.steps[0]) {
							settings.title_text = aiContent.process.steps[0].title;
							settings.description_text = aiContent.process.steps[0].description;
						} else if (title.includes("Design") && aiContent.process.steps[1]) {
							settings.title_text = aiContent.process.steps[1].title;
							settings.description_text = aiContent.process.steps[1].description;
						} else if (title.includes("Manufacture") && aiContent.process.steps[2]) {
							settings.title_text = aiContent.process.steps[2].title;
							settings.description_text = aiContent.process.steps[2].description;
						} else if (title.includes("Installation") && aiContent.process.steps[3]) {
							settings.title_text = aiContent.process.steps[3].title;
							settings.description_text = aiContent.process.steps[3].description;
						}
					}
				}

				if (type === "testimonial-carousel" && Array.isArray(settings.slides) && aiContent.testimonials?.items) {
					for (let i = 0; i < Math.min(3, settings.slides.length); i++) {
						if (aiContent.testimonials.items[i]) {
							settings.slides[i].content = `“${aiContent.testimonials.items[i].content}”`;
							settings.slides[i].name = aiContent.testimonials.items[i].name;
							settings.slides[i].title = ""; // clear subtitle/role
						}
					}
				}

				if (type === "nav-menu" && menuId) {
					settings.menu = String(menuId);
				}
			}

			if (Array.isArray(el.elements)) {
				processElements(el.elements, sectionIndex, sectionTitle);
			}
		}
	};

	// Process each of the layout sections
	homeSections.forEach((section: any, idx: number) => {
		const title = section.settings?._title || "";
		if (section.elements) {
			processElements(section.elements, idx, title);
		}
	});

	headerSections.forEach((section: any, idx: number) => {
		const title = section.settings?._title || "Header";
		if (section.elements) {
			processElements(section.elements, idx, title);
		}
	});

	footerSections.forEach((section: any, idx: number) => {
		const title = section.settings?._title || "Footer";
		if (section.elements) {
			processElements(section.elements, idx, title);
		}
	});

	// Concatenate sections into a single array for elementor_canvas layout
	// Header sections first, then home sections, then footer sections
	const combinedSections = [
		...headerSections,
		...homeSections,
		...footerSections,
	];

	return JSON.stringify(combinedSections);
}
