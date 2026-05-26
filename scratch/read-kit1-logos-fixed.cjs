const fs = require('fs');
const path = require('path');

// Helper to find widgets recursively
function findWidgets(elements) {
  let found = [];
  for (const el of elements) {
    if (el.elType === 'widget' && (el.widgetType === 'theme-site-logo' || el.widgetType === 'image')) {
      found.push(el);
    }
    if (el.elements && el.elements.length > 0) {
      found = found.concat(findWidgets(el.elements));
    }
  }
  return found;
}

// Check header of kit 1
const headerPath1 = path.join('elementor-kit', 'templates', '15.json');
if (fs.existsSync(headerPath1)) {
  const headerData = JSON.parse(fs.readFileSync(headerPath1, 'utf8'));
  console.log("Kit 1 Header Widgets:");
  findWidgets(headerData.content || []).forEach(w => {
    console.log(`ID: ${w.id}, type: ${w.widgetType}`);
  });
}

// Check footer of kit 1
const footerPath1 = path.join('elementor-kit', 'templates', '244.json');
if (fs.existsSync(footerPath1)) {
  const footerData = JSON.parse(fs.readFileSync(footerPath1, 'utf8'));
  console.log("Kit 1 Footer Widgets:");
  findWidgets(footerData.content || []).forEach(w => {
    console.log(`ID: ${w.id}, type: ${w.widgetType}`);
  });
}
