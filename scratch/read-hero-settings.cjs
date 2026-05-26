const fs = require('fs');
const path = require('path');

const homePath = path.join('elementor-kit-2', 'content', 'page', '2.json');
const data = JSON.parse(fs.readFileSync(homePath, 'utf8'));

const heroSection = (data.content || []).find(sec => sec.settings?._title === 'Hero');
if (heroSection) {
  console.log("Hero Container Settings:", JSON.stringify(heroSection.settings, null, 2));
  
  heroSection.elements.forEach((col, i) => {
    console.log(`\nChild Container ${i + 1} (${col.id}) Settings:`, JSON.stringify(col.settings, null, 2));
    if (col.elements) {
      col.elements.forEach((child) => {
        console.log(`  Widget (${child.id}, type: ${child.widgetType}) Settings:`, JSON.stringify(child.settings, null, 2));
      });
    }
  });
}
