const fs = require('fs');
const path = require('path');

function searchJson(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchJson(filePath);
    } else if (file.endsWith('.json')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('call-to-action')) {
        const data = JSON.parse(content);
        function findCta(elements) {
          if (!elements || !Array.isArray(elements)) return;
          for (const el of elements) {
            if (el.widgetType === 'call-to-action') {
              console.log(`Found CTA in Kit 1 ${file}:`);
              const keys = Object.keys(el.settings || {});
              keys.forEach(k => {
                if (k.includes('align') || k.includes('position')) {
                  console.log(`  ${k}: ${JSON.stringify(el.settings[k])}`);
                }
              });
            }
            findCta(el.elements);
          }
        }
        findCta(data.content || []);
      }
    }
  }
}

searchJson('elementor-kit');
