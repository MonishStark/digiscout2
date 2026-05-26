const fs = require('fs');
const path = require('path');

const homePath = path.join('elementor-kit-2', 'content', 'page', '2.json');
const data = JSON.parse(fs.readFileSync(homePath, 'utf8'));

const heroSection = (data.content || []).find(sec => sec.settings?._title === 'Hero');
if (heroSection) {
  const col2 = heroSection.elements[1];
  const widget = col2.elements[0];
  // Print all alignment related keys
  const keys = Object.keys(widget.settings || {});
  keys.forEach(k => {
    if (k.includes('align') || k.includes('position') || k.includes('justify') || k.includes('content')) {
      console.log(`${k}:`, widget.settings[k]);
    }
  });
}
