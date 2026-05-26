const fs = require('fs');
const path = require('path');

const footerPath = path.join('elementor-kit-2', 'templates', '156.json');
const data = JSON.parse(fs.readFileSync(footerPath, 'utf8'));

// Find all image widgets
function findWidgets(elements, type) {
  let found = [];
  for (const el of elements) {
    if (el.elType === 'widget' && el.widgetType === type) {
      found.push(el);
    }
    if (el.elements && el.elements.length > 0) {
      found = found.concat(findWidgets(el.elements, type));
    }
  }
  return found;
}

const images = findWidgets(data.content || [], 'image');
console.log("Image widgets in footer:");
images.forEach(img => {
  console.log(JSON.stringify({
    id: img.id,
    widgetType: img.widgetType,
    settings: {
      image: img.settings?.image,
      css_class: img.settings?._css_classes
    }
  }, null, 2));
});
