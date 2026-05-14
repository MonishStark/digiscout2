import fs from 'fs';
import { renderWebsiteArtifact } from './src/lib/website-renderer.js';
import { buildRendererVariantLog } from './src/lib/generation-debug.js';

const folder = '2026-05-14T08-10-57-golden-gate-cleaners';
const schema = JSON.parse(fs.readFileSync(`.debug-generation/${folder}/05-normalized-schema.json`, 'utf8'));
const business = JSON.parse(fs.readFileSync(`.debug-generation/${folder}/01-business-input.json`, 'utf8'));

const combinedCode = renderWebsiteArtifact({ schema, html: "", css: "", js: "" });

const variantLog = buildRendererVariantLog({
  traceId: folder,
  schema,
  renderedHtml: combinedCode,
  wordpressBlocks: '',
  debugFallbackUsed: false
});

fs.writeFileSync(`.debug-generation/${folder}/renderer_variant.log`, variantLog);
fs.writeFileSync(`.debug-generation/${folder}/07-rendered-html.html`, combinedCode);

console.log('Rendered');