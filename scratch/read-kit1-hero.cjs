const fs = require('fs');
const path = require('path');

const homePath = path.join('elementor-kit', 'content', 'page', '2.json');
if (fs.existsSync(homePath)) {
  const data = JSON.parse(fs.readFileSync(homePath, 'utf8'));
  console.log("Kit 1 Home Sections:");
  (data.content || []).forEach((sec, i) => {
    console.log(`[Section ${i}] Title: ${sec.settings?._title || 'None'}, elType: ${sec.elType}`);
  });
}
