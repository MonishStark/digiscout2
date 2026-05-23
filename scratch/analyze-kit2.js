const fs = require('fs');
const j = JSON.parse(fs.readFileSync('elementor-kit-2/content/page/2.json', 'utf8'));

function getSections(els, depth) {
  if (!Array.isArray(els)) return;
  els.forEach(el => {
    const t = el.settings && el.settings._title ? el.settings._title : '';
    const wt = el.widgetType || el.elType;
    const pad = '  '.repeat(depth);
    if (wt === 'section' || wt === 'container' || wt === 'column') {
      if (t) console.log(pad + '[' + wt + '] "' + t + '"');
    }
    if (wt === 'widget') {
      console.log(pad + '  widget:' + el.widgetType);
    }
    if (el.elements) getSections(el.elements, depth + 1);
  });
}
getSections(j.content || [], 0);

// Also extract library image URLs
const raw = JSON.stringify(j);
const matches = raw.match(/https?:\/\/library\.elementor\.com\/[^"\\]+/g) || [];
console.log('\n--- Library Image URLs ---');
[...new Set(matches)].slice(0, 20).forEach(u => console.log(u));
