import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "elementor-kit", "content", "page", "2.json");
const content = fs.readFileSync(filePath, "utf8");

const regex = /https?:\/\/library\.elementor\.com\/[^\s"'}]+/g;
const matches = content.match(regex);
console.log("Original regex matches count:", matches ? matches.length : 0);

// Let's try matching with backslashes allowed in the regex
const regexWithBackslashes = /https?(?:\\)?:\/\/(?:\\)?\/library\.elementor\.com\/[^\s"'}]+/g; // Wait, let's write a clean regex
const cleanContent = content.replace(/\\/g, "");
const cleanMatches = cleanContent.match(regex);
console.log("Clean content regex matches count:", cleanMatches ? cleanMatches.length : 0);
if (cleanMatches) {
	console.log("First 5 clean matches:", cleanMatches.slice(0, 5));
}
