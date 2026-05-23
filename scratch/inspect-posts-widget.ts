import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "elementor-kit", "content", "page", "2.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
const homeSections = data.content || [];

const section = homeSections.find((s: any) => s.settings?._title === "Recent projects");
if (section) {
	const traverse = (els: any[]) => {
		if (!els || !Array.isArray(els)) return;
		for (const el of els) {
			if (el.id === "59acbfe5" || el.widgetType === "posts") {
				console.log("Found posts widget settings:");
				console.log(JSON.stringify(el.settings, null, 2));
			}
			if (el.elements && Array.isArray(el.elements)) {
				traverse(el.elements);
			}
		}
	};
	traverse(section.elements);
}
