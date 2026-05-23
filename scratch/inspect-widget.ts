import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "elementor-kit", "content", "page", "2.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

function findWidget(elements: any[], id: string): any {
	for (const el of elements) {
		if (el.id === id) return el;
		if (el.elements) {
			const found = findWidget(el.elements, id);
			if (found) return found;
		}
	}
	return null;
}

const widget = findWidget(data.content, "41484f27");
console.log(JSON.stringify(widget, null, 2));
