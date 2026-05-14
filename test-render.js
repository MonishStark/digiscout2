/** @format */

const fs = require("fs");
const path = require("path");

// Load the schema
const schemaPath = path.join(
	__dirname,
	".debug-generation",
	"2026-05-14T08-38-11-debug-bistro",
	"05-normalized-schema.json",
);
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

// Import the renderer (assuming it's compiled to JS)
const { renderWebsite } = require("./dist/lib/website-renderer.js");

const html = renderWebsite(schema);

console.log("Rendered HTML length:", html.length);

// Save to file
const outputPath = path.join(
	__dirname,
	".debug-generation",
	"2026-05-14T08-38-11-debug-bistro",
	"rendered.html",
);
fs.writeFileSync(outputPath, html);

console.log("Saved to:", outputPath);
