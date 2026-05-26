const fs = require('fs');
const path = require('path');

const homePath = path.join('elementor-kit-2', 'content', 'page', '2.json');
const data = JSON.parse(fs.readFileSync(homePath, 'utf8'));

const heroSection = (data.content || []).find(sec => sec.settings?._title === 'Hero');
if (heroSection) {
  const col2 = heroSection.elements[1];
  const widget = col2.elements[0];
  console.log("Full widget JSON:", JSON.stringify(widget, null, 2));
}
