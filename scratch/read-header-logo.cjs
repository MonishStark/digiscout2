const fs = require('fs');
const path = require('path');

const headerPath = path.join('elementor-kit-2', 'templates', '49.json');
const data = JSON.parse(fs.readFileSync(headerPath, 'utf8'));

// Find all logo widgets
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

const widgets = findWidgets(data.content || []);
console.log("Widgets in header:");
widgets.forEach(w => {
  console.log(JSON.stringify({
    id: w.id,
    widgetType: w.widgetType,
    settings: {
      image: w.settings?.image,
      css_class: w.settings?._css_classes
    }
  }, null, 2));
});
