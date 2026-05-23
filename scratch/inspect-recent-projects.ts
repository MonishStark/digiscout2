import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "elementor-kit", "content", "page", "2.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
const homeSections = data.content || [];

const section = homeSections.find((s: any) => s.settings?._title === "Recent projects");
if (section) {
	console.log("Found Recent projects section!");
	console.log(JSON.stringify(section, null, 2).substring(0, 4000));
	if (JSON.stringify(section).length > 4000) {
		console.log("\n... [TRUNCATED] ...\n");
		console.log(JSON.stringify(section, null, 2).substring(4000, 8000));
	}
} else {
	console.log("Recent projects section not found!");
}
