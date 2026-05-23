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
	const isKit2 = fs.existsSync(path.join(templateDir, "templates", "49.json"));
	// Paths to templates
	const homePath = path.join(templateDir, "content", "page", "2.json");
	const headerPath = path.join(templateDir, "templates", isKit2 ? "49.json" : "15.json");
	const footerPath = path.join(templateDir, "templates", isKit2 ? "156.json" : "244.json");

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
		const normalizedUrl = url.replace(/\\/g, "");
		if (mediaMap[normalizedUrl]) return mediaMap[normalizedUrl];
		// Try fuzzy matching (e.g. without query parameters or protocols)
		const cleanUrl = normalizedUrl.split("?")[0].replace(/^https?:/, "");
		for (const key of Object.keys(mediaMap)) {
			const cleanKey = key.split("?")[0].replace(/^https?:/, "");
			if (cleanKey === cleanUrl) {
				return mediaMap[key];
			}
		}
		return null;
	};

	const collectElements = (elements: any[]) => {
		const columns: any[] = [];
		const containers: any[] = [];
		const widgets: Record<string, any[]> = {};

		const traverse = (els: any[]) => {
			if (!els || !Array.isArray(els)) return;
			for (const el of els) {
				if (el.elType === "column") {
					columns.push(el);
				} else if (el.elType === "container") {
					containers.push(el);
				} else if (el.elType === "widget") {
					const type = el.widgetType;
					if (type) {
						if (!widgets[type]) {
							widgets[type] = [];
						}
						widgets[type].push(el);
					}
				}
				if (el.elements && Array.isArray(el.elements)) {
					traverse(el.elements);
				}
			}
		};

		traverse(elements);
		return { columns, containers, widgets };
	};

	const processSection = (section: any, title: string) => {
		if (!section.elements || !Array.isArray(section.elements)) return;
		const { columns, containers, widgets } = collectElements(section.elements);

		if (isKit2) {
			if (title === "Hero") {
				// Hero Container 1 background image
				if (containers[0] && containers[0].settings) {
					const targetUrl = aiContent.hero?.hero_image || "";
					const local = getLocalMedia(targetUrl);
					if (local) {
						containers[0].settings.background_image = {
							url: local.url,
							id: String(local.id),
							source: "library"
						};
					}
				}
				// Hero Container 2 background image
				if (containers[1] && containers[1].settings) {
					const targetUrl = aiContent.hero?.masked_image || "";
					const local = getLocalMedia(targetUrl);
					if (local) {
						containers[1].settings.background_image = {
							url: local.url,
							id: String(local.id),
							source: "library"
						};
					}
				}
				// Hero Call to Action widget
				if (widgets["call-to-action"]?.[0] && widgets["call-to-action"][0].settings) {
					const cta = widgets["call-to-action"][0];
					cta.settings.title = aiContent.hero?.heading || "";
					cta.settings.description = aiContent.about?.description || "";
					cta.settings.button = `${aiContent.hero?.button_text || "Shop Now"} ➔`;
					cta.settings.link = {
						url: "#products",
						is_external: "",
						nofollow: "",
						custom_attributes: "",
					};
				}
			} else if (title === "Home Goods") {
				// About us section (Home Goods)
				const mainContainer = section;
				if (mainContainer && mainContainer.settings) {
					const targetUrl = aiContent.about?.image || "";
					const local = getLocalMedia(targetUrl);
					if (local) {
						mainContainer.settings.background_image = {
							url: local.url,
							id: String(local.id),
							source: "library"
						};
					}
				}
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = aiContent.about?.heading || "";
				}
				if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
					widgets["text-editor"][0].settings.editor = `<p>${aiContent.about?.description || ""}</p>`;
				}
				if (widgets.button?.[0] && widgets.button[0].settings) {
					widgets.button[0].settings.text = `${aiContent.about?.button_text || "Learn More"} ➔`;
					widgets.button[0].settings.link = {
						url: "#products",
						is_external: "",
						nofollow: "",
						custom_attributes: "",
					};
				}
			} else if (title === "Tablewear") {
				// Services section (Tablewear)
				const mainContainer = section;
				if (mainContainer && mainContainer.settings) {
					const targetUrl = aiContent.services?.image || "";
					const local = getLocalMedia(targetUrl);
					if (local) {
						mainContainer.settings.background_image = {
							url: local.url,
							id: String(local.id),
							source: "library"
						};
					}
				}
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = aiContent.services?.heading || "";
				}
				if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
					widgets["text-editor"][0].settings.editor = `<p>${aiContent.services?.description || ""}</p>`;
				}
				if (widgets.button?.[0] && widgets.button[0].settings) {
					widgets.button[0].settings.text = `Our Services ➔`;
					widgets.button[0].settings.link = {
						url: "#products",
						is_external: "",
						nofollow: "",
						custom_attributes: "",
					};
				}
			} else if (title === "Products") {
				// Recent Projects section (Products)
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = aiContent.projects?.heading || "Recent Projects";
				}
				// Convert woocommerce-products to posts widget
				if (widgets["woocommerce-products"]?.[0]) {
					const pWidget = widgets["woocommerce-products"][0];
					pWidget.widgetType = "posts";
					pWidget.settings = {
						classic_columns: "3",
						classic_thumbnail_size_size: "large",
						classic_item_ratio: { unit: "px", size: "0.8", sizes: [] },
						classic_meta_data: [],
						classic_show_excerpt: "",
						classic_posts_per_page: "3",
						classic_column_gap: { unit: "px", size: "30", sizes: [] },
						classic_row_gap: { unit: "px", size: "30", sizes: [] },
						__globals__: {
							classic_title_typography_typography: "globals/typography?id=secondary"
						}
					};
				}
				if (widgets.button?.[0] && widgets.button[0].settings) {
					widgets.button[0].settings.text = `Contact Us ➔`;
					widgets.button[0].settings.link = {
						url: "#contact",
						is_external: "",
						nofollow: "",
						custom_attributes: "",
					};
				}
			} else if (title === "CTA") {
				// CTA background
				const mainContainer = section;
				if (mainContainer && mainContainer.settings) {
					const targetUrl = aiContent.services?.image || "";
					const local = getLocalMedia(targetUrl);
					if (local) {
						mainContainer.settings.background_image = {
							url: local.url,
							id: String(local.id),
							source: "library"
						};
					}
				}
				// Inside the dark overlay box:
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = aiContent.process?.heading || "Our Work Process";
				}
				if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
					let processText = "";
					if (Array.isArray(aiContent.process?.steps)) {
						processText = aiContent.process.steps.map((step: any, idx: number) => 
							`<strong>${idx + 1}. ${step.title}</strong>: ${step.description}`
						).join("<br/><br/>");
					}
					widgets["text-editor"][0].settings.editor = `<p>${processText}</p>`;
				}
				if (widgets.button?.[0] && widgets.button[0].settings) {
					widgets.button[0].settings.text = `Get a Quote ➔`;
					widgets.button[0].settings.link = {
						url: "#contact",
						is_external: "",
						nofollow: "",
						custom_attributes: "",
					};
				}
			} else if (title === "Banner") {
				if (widgets["icon-list"]?.[0] && widgets["icon-list"][0].settings?.icon_list?.[0]) {
					widgets["icon-list"][0].settings.icon_list[0].text = `Call Us: ${businessInfo.phone} | Email: ${businessInfo.email}`;
				}
			} else if (title === "Header") {
				if (widgets["nav-menu"]?.[0] && widgets["nav-menu"][0].settings && menuId) {
					widgets["nav-menu"][0].settings.menu = String(menuId);
				}
				if (widgets["theme-site-logo"]?.[0] && widgets["theme-site-logo"][0].settings) {
					const targetUrl = (aiContent as any).logo_image || "";
					const local = getLocalMedia(targetUrl);
					if (local) {
						widgets["theme-site-logo"][0].settings.image = {
							url: local.url,
							id: String(local.id),
						};
					}
				}
			} else if (title === "Footer") {
				if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
					widgets["text-editor"][0].settings.editor = `<p>${businessInfo.name} - Professional craftsmanship and dedicated service.</p>`;
				}
				// Contact info list
				const contactList = widgets["icon-list"]?.[0];
				if (contactList && Array.isArray(contactList.settings.icon_list)) {
					if (contactList.settings.icon_list[0]) {
						contactList.settings.icon_list[0].text = businessInfo.address;
					}
					if (contactList.settings.icon_list[1]) {
						contactList.settings.icon_list[1].text = `Phone: ${businessInfo.phone}`;
						contactList.settings.icon_list[1].link = { url: `tel:${businessInfo.phone.replace(/[^0-9+]/g, "")}` };
					}
					if (contactList.settings.icon_list[2]) {
						contactList.settings.icon_list[2].text = businessInfo.email;
						contactList.settings.icon_list[2].link = { url: `mailto:${businessInfo.email}` };
					}
					if (contactList.settings.icon_list[3]) {
						contactList.settings.icon_list[3].text = "";
					}
				}
				// Map the footer logo image
				if (widgets.image?.[0] && widgets.image[0].settings) {
					const targetUrl = (aiContent as any).logo_image || "";
					const local = getLocalMedia(targetUrl);
					if (local) {
						widgets.image[0].settings.image = {
							url: local.url,
							id: String(local.id),
						};
					}
				}
				// Clear ceramic page links on headings by setting link.url = "#"
				if (widgets.heading && Array.isArray(widgets.heading)) {
					for (const h of widgets.heading) {
						if (h.settings && h.settings.link) {
							h.settings.link.url = "#";
						}
					}
				}
			} else if (title === "Copyright") {
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = `${businessInfo.name} © ${new Date().getFullYear()} All Rights Reserved.`;
				}
			}
		} else {
			if (title === "Hero section") {
				// Heading
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = aiContent.hero?.heading || "";
				}
				// Button
				if (widgets.button?.[0] && widgets.button[0].settings) {
					widgets.button[0].settings.text = `${aiContent.hero?.button_text || "Get Started"} ➔`;
					widgets.button[0].settings.link = {
						url: "#services",
						is_external: "",
						nofollow: "",
						custom_attributes: "",
					};
				}
				// Column background image
				let bgCol = columns.find((c: any) => c.settings?.background_image?.url);
				if (!bgCol && columns.length > 1) {
					bgCol = columns[1];
				}
				if (bgCol && bgCol.settings?.background_image) {
					const targetUrl = aiContent.hero?.hero_image || "";
					const local = getLocalMedia(targetUrl);
					if (local) {
						bgCol.settings.background_image.url = local.url;
						bgCol.settings.background_image.id = String(local.id);
					}
				}
				// Supporting circular image — ONLY fix: object-fit must be "cover" not "fill"
				// The template already has: image_custom_dimension 260×260, border-radius 50%,
				// and absolute positioning with correct _offset_x/_offset_y values.
				// "fill" (the template default) stretches non-square photos into ovals.
				// "cover" crops to fill the square container → perfect circle.
				if (widgets.image?.[0] && widgets.image[0].settings?.image) {
					const targetUrl = aiContent.hero?.masked_image || "";
					const local = getLocalMedia(targetUrl);
					if (local) {
						widgets.image[0].settings.image.url = local.url;
						widgets.image[0].settings.image.id = String(local.id);
					}
					// THE critical fix: "cover" keeps aspect ratio and crops; "fill" stretches → oval
					widgets.image[0].settings["object-fit"] = "cover";
					// Keep image_size as "full" so WP serves the highest-res version for cropping
					widgets.image[0].settings.image_size = "full";
					// Ensure border-radius 50% is enforced (template already has this but be explicit)
					widgets.image[0].settings.image_border_radius = {
						unit: "%",
						top: "50",
						right: "50",
						bottom: "50",
						left: "50",
						isLinked: "1",
					};
					// DO NOT change width, height, _element_width, _offset_x, _offset_y —
					// the template's absolute positioning values are already correct.
				}


			} else if (title === "Highest level") {
				// About image
				if (widgets.image?.[0] && widgets.image[0].settings?.image) {
					const targetUrl = aiContent.about?.image || "";
					const local = getLocalMedia(targetUrl);
					if (local) {
						widgets.image[0].settings.image.url = local.url;
						widgets.image[0].settings.image.id = String(local.id);
					}
				}
				// About title
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = aiContent.about?.heading || "";
				}
				// About description
				if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
					widgets["text-editor"][0].settings.editor = `<p>${aiContent.about?.description || ""}</p>`;
				}
				// About button
				if (widgets.button?.[0] && widgets.button[0].settings) {
					widgets.button[0].settings.text = `${aiContent.about?.button_text || "Learn More"} ➔`;
					widgets.button[0].settings.link = {
						url: "#services",
						is_external: "",
						nofollow: "",
						custom_attributes: "",
					};
				}
			} else if (title === "What we do") {
				// Services heading
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = aiContent.services?.heading || "";
				}
				// Services description
				if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
					widgets["text-editor"][0].settings.editor = aiContent.services?.description || "";
				}
				// Icon lists (2 columns/widgets)
				const iconLists = widgets["icon-list"] || [];
				const servicesList = aiContent.services?.list || [];
				if (iconLists[0] && iconLists[0].settings && Array.isArray(iconLists[0].settings.icon_list)) {
					for (let i = 0; i < 4; i++) {
						if (iconLists[0].settings.icon_list[i] && servicesList[i]) {
							iconLists[0].settings.icon_list[i].text = servicesList[i];
						}
					}
				}
				if (iconLists[1] && iconLists[1].settings && Array.isArray(iconLists[1].settings.icon_list)) {
					for (let i = 0; i < 4; i++) {
						if (iconLists[1].settings.icon_list[i] && servicesList[i + 4]) {
							iconLists[1].settings.icon_list[i].text = servicesList[i + 4];
						}
					}
				}
				// Column background image
				let bgCol = columns.find((c: any) => c.settings?.background_image?.url);
				if (!bgCol && columns.length > 1) {
					bgCol = columns[1];
				}
				if (bgCol && bgCol.settings?.background_image) {
					const targetUrl = aiContent.services?.image || "";
					const local = getLocalMedia(targetUrl);
					if (local) {
						bgCol.settings.background_image.url = local.url;
						bgCol.settings.background_image.id = String(local.id);
					}
				}
			} else if (title === "Exceptional quality") {
				// Features heading
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = aiContent.features?.heading || "";
				}
				// Icon boxes (3 features)
				const iconBoxes = widgets["icon-box"] || [];
				const featuresItems = aiContent.features?.items || [];
				for (let i = 0; i < 3; i++) {
					if (iconBoxes[i] && iconBoxes[i].settings && featuresItems[i]) {
						iconBoxes[i].settings.title_text = featuresItems[i].title;
						iconBoxes[i].settings.description_text = featuresItems[i].description;
					}
				}
			} else if (title === "Recent projects") {
				// Projects heading
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = aiContent.projects?.heading || "";
				}
				// Projects description
				if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
					widgets["text-editor"][0].settings.editor = aiContent.projects?.description || "";
				}
			} else if (title === "Work Process") {
				// Process heading
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = aiContent.process?.heading || "";
				}
				// Icon boxes (4 steps)
				const iconBoxes = widgets["icon-box"] || [];
				const steps = aiContent.process?.steps || [];
				for (let i = 0; i < 4; i++) {
					if (iconBoxes[i] && iconBoxes[i].settings && steps[i]) {
						iconBoxes[i].settings.title_text = steps[i].title;
						iconBoxes[i].settings.description_text = steps[i].description;
					}
				}
			} else if (title === "Client testimonials") {
				// Slideshow background
				const slideshowCol = columns.find((c: any) => c.settings?.background_background === "slideshow");
				if (slideshowCol && slideshowCol.settings && Array.isArray(slideshowCol.settings.background_slideshow_gallery)) {
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
						slideshowCol.settings.background_slideshow_gallery = localSlideshow;
					}
				}
				// Testimonials heading
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = aiContent.testimonials?.heading || "";
				}
				// Testimonial carousel
				if (widgets["testimonial-carousel"]?.[0] && widgets["testimonial-carousel"][0].settings && Array.isArray(widgets["testimonial-carousel"][0].settings.slides)) {
					const slides = widgets["testimonial-carousel"][0].settings.slides;
					const testimonialsItems = aiContent.testimonials?.items || [];
					for (let i = 0; i < Math.min(3, slides.length); i++) {
						if (testimonialsItems[i]) {
							slides[i].content = `“${testimonialsItems[i].content}”`;
							slides[i].name = testimonialsItems[i].name;
							slides[i].title = ""; // clear subtitle
						}
					}
				}
			} else if (title === "Header") {
				// Call Us button
				if (widgets.button?.[0] && widgets.button[0].settings) {
					const btn = widgets.button[0];
					delete btn.settings.__dynamic__;
					btn.settings.text = `Call Us ${businessInfo.phone}`;
					btn.settings.link = {
						url: `tel:${businessInfo.phone.replace(/[^0-9+]/g, "")}`,
						is_external: "",
						nofollow: "",
						custom_attributes: "",
					};
				}
				// Nav menu
				if (widgets["nav-menu"]?.[0] && widgets["nav-menu"][0].settings && menuId) {
					widgets["nav-menu"][0].settings.menu = String(menuId);
				}
			} else if (title === "Let's discuss") {
				// Heading
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					widgets.heading[0].settings.title = `Let’s discuss your project!`;
				}
				// Description
				if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
					widgets["text-editor"][0].settings.editor = `<p>Don’t hesitate to contact us. We’ll be happy to discuss your needs, provide estimates, and answer all your questions.</p>`;
				}
				// Button
				if (widgets.button?.[0] && widgets.button[0].settings) {
					widgets.button[0].settings.text = `Contact Us ➔`;
					widgets.button[0].settings.link = {
						url: "#contact",
						is_external: "",
						nofollow: "",
						custom_attributes: "",
					};
				}
			} else if (title === "Footer") {
				// Copyright heading
				if (widgets.heading?.[0] && widgets.heading[0].settings) {
					const cHeading = widgets.heading[0];
					delete cHeading.settings.__dynamic__;
					cHeading.settings.title = `${businessInfo.name} © ${new Date().getFullYear()} All Rights Reserved.`;
				}
				// Contact info list
				const contactList = (widgets["icon-list"] || []).find((widget: any) =>
					widget.settings?.icon_list?.some((item: any) => String(item.text).includes("@"))
				);
				if (contactList && Array.isArray(contactList.settings.icon_list)) {
					for (const item of contactList.settings.icon_list) {
						const text = String(item.text || "");
						if (text.includes("St Germain") || item.text === "315 St Germain Ave, Canada") {
							item.text = businessInfo.address;
						} else if (text.includes("620-637") || text.match(/[0-9]{3}-[0-9]{3}/)) {
							item.text = businessInfo.phone;
							item.link = { url: `tel:${businessInfo.phone.replace(/[^0-9+]/g, "")}` };
						} else if (text.includes("@")) {
							item.text = businessInfo.email;
							item.link = { url: `mailto:${businessInfo.email}` };
						}
					}
				}
			}
		}
	};

	// Process each of the layout sections
	homeSections.forEach((section: any) => {
		const title = section.settings?._title || "";
		processSection(section, title);
	});

	headerSections.forEach((section: any) => {
		const title = section.settings?._title || "Header";
		processSection(section, title);
	});

	footerSections.forEach((section: any) => {
		const title = section.settings?._title || "Footer";
		processSection(section, title);
	});

	// Concatenate sections into a single array for elementor_canvas layout
	// Header sections first, then home sections, then footer sections
	const combinedSections = [
		...headerSections,
		...homeSections,
		...footerSections,
	];

	// Recursively replace library.elementor.com URLs/IDs with local ones and force object-fit: cover on image widgets to prevent distortion.
	const mapLibraryUrlsAndFixStretch = (obj: any) => {
		if (!obj || typeof obj !== "object") return;

		// Force object-fit: cover on all image widgets
		if (obj.elType === "widget" && obj.widgetType === "image" && obj.settings) {
			obj.settings["object-fit"] = "cover";
		}

		// Handle object structure: { url: "...", id: "..." }
		if (obj.url && typeof obj.url === "string" && obj.url.includes("library.elementor.com")) {
			const local = getLocalMedia(obj.url);
			if (local) {
				obj.url = local.url;
				if (obj.id !== undefined) {
					obj.id = String(local.id);
				}
			}
		}

		// Handle selected_icon/value structure: { value: { url: "...", id: "..." } }
		if (obj.value && typeof obj.value === "object" && obj.value.url && typeof obj.value.url === "string" && obj.value.url.includes("library.elementor.com")) {
			const local = getLocalMedia(obj.value.url);
			if (local) {
				obj.value.url = local.url;
				if (obj.value.id !== undefined) {
					obj.value.id = String(local.id);
				}
			}
		}

		// Recurse for nested fields
		for (const key of Object.keys(obj)) {
			const val = obj[key];
			if (typeof val === "string" && val.includes("library.elementor.com")) {
				const local = getLocalMedia(val);
				if (local) {
					obj[key] = local.url;
				}
			} else if (val && typeof val === "object") {
				mapLibraryUrlsAndFixStretch(val);
			}
		}
	};

	mapLibraryUrlsAndFixStretch(combinedSections);

	return JSON.stringify(combinedSections);
}
