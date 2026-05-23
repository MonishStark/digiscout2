import fs from "fs";
import path from "path";

const homePath = path.join(process.cwd(), "elementor-kit", "content", "page", "2.json");
const headerPath = path.join(process.cwd(), "elementor-kit", "templates", "15.json");
const footerPath = path.join(process.cwd(), "elementor-kit", "templates", "244.json");

function auditFile(name: string, filePath: string) {
	if (!fs.existsSync(filePath)) {
		console.log(`File not found: ${filePath}`);
		return;
	}
	const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
	const sections = data.content || [];
	console.log(`=== AUDIT FOR: ${name} (${filePath}) ===`);
	console.log(`Total sections: ${sections.length}`);
	
	sections.forEach((section: any, sIdx: number) => {
		const sTitle = section.settings?._title || "No Title";
		console.log(`Section ${sIdx + 1}: [Title: "${sTitle}"] (elType: ${section.elType})`);
		
		// Recursively print widgets in this section
		function printElements(elements: any[], depth = 1) {
			if (!elements || !Array.isArray(elements)) return;
			const indent = "  ".repeat(depth);
			elements.forEach((el: any) => {
				if (el.elType === "column") {
					const colWidth = el.settings?._column_size || "100";
					console.log(`${indent}- Column (${colWidth}%)`);
					if (el.settings?.background_image?.url) {
						console.log(`${indent}  [BG Image: ${el.settings.background_image.url}]`);
					}
					if (el.settings?.background_slideshow_gallery) {
						console.log(`${indent}  [BG Slideshow: ${el.settings.background_slideshow_gallery.length} images]`);
					}
					printElements(el.elements, depth + 1);
				} else if (el.elType === "widget") {
					const widgetType = el.widgetType;
					const settings = el.settings || {};
					let info = "";
					if (widgetType === "heading") {
						info = `title: "${settings.title}"`;
					} else if (widgetType === "text-editor") {
						const truncatedEditor = String(settings.editor || "").substring(0, 60).replace(/\n/g, " ");
						info = `editor: "${truncatedEditor}..."`;
					} else if (widgetType === "button") {
						info = `text: "${settings.text}", link: "${settings.link?.url || ""}"`;
					} else if (widgetType === "image") {
						info = `url: "${settings.image?.url || ""}"`;
					} else if (widgetType === "icon-list") {
						const items = (settings.icon_list || []).map((item: any) => item.text).join(", ");
						info = `items: [${items}]`;
					} else if (widgetType === "icon-box") {
						info = `title_text: "${settings.title_text}", desc: "${String(settings.description_text || "").substring(0, 40)}..."`;
					} else if (widgetType === "testimonial-carousel") {
						const slides = (settings.slides || []).map((s: any) => s.name).join(", ");
						info = `slides: [${slides}]`;
					}
					console.log(`${indent}* Widget: ${widgetType} (${info})`);
					printElements(el.elements, depth + 1);
				} else {
					console.log(`${indent}- Element: ${el.elType}`);
					printElements(el.elements, depth + 1);
				}
			});
		}
		
		printElements(section.elements, 1);
		console.log();
	});
}

auditFile("Home Page", homePath);
auditFile("Header", headerPath);
auditFile("Footer", footerPath);
