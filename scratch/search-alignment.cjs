const fs = require('fs');
const path = require('path');

const homePath = path.join('elementor-kit-2', 'content', 'page', '2.json');
const data = JSON.parse(fs.readFileSync(homePath, 'utf8'));

function traverse(elements) {
  if (!elements || !Array.isArray(elements)) return;
  for (const el of elements) {
    if (el.settings) {
      const keys = Object.keys(el.settings);
      keys.forEach(k => {
        if (k.toLowerCase().includes('align')) {
          console.log(`El: ${el.elType} (${el.id}, widget: ${el.widgetType || 'none'}), setting: ${k} = ${JSON.stringify(el.settings[k])}`);
        }
      });
    }
    traverse(el.elements);
  }
}

traverse(data.content || []);
