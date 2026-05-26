const fs = require('fs');
const path = require('path');

const homePath = path.join('elementor-kit-2', 'content', 'page', '2.json');
const data = JSON.parse(fs.readFileSync(homePath, 'utf8'));

// Find Hero section
const heroSection = (data.content || []).find(sec => sec.settings?._title === 'Hero');
console.log("Hero section columns/containers count:", heroSection?.elements?.length);
if (heroSection) {
  // Let's print the elements tree of the Hero section, showing classes, widths, and widget types
  function printTree(el, indent = "") {
    console.log(`${indent}- elType: ${el.elType}, id: ${el.id}, title: ${el.settings?._title || ''}, widgetType: ${el.widgetType || ''}, width: ${el.settings?.width || el.settings?.width_tablet || el.settings?.width_mobile || ''}`);
    if (el.elements && el.elements.length > 0) {
      el.elements.forEach(child => printTree(child, indent + "  "));
    }
  }
  printTree(heroSection);
}
