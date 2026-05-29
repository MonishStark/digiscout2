import fs from 'fs';

const data = JSON.parse(fs.readFileSync('c:/Users/Dhanush/Downloads/digitalscout2/zip/elementor-kit-2/content/page/2.json', 'utf8'));

function findElement(elements, id) {
    for (const el of elements) {
        if (el.id === id) return el;
        if (el.elements) {
            const found = findElement(el.elements, id);
            if (found) return found;
        }
    }
    return null;
}

const container = findElement(data.content, '3acf57f7');
console.log("Container:", JSON.stringify({ id: container.id, settings: container.settings }, null, 2));

for (const child of container.elements) {
    console.log("Child:", JSON.stringify({ id: child.id, widgetType: child.widgetType, settings: child.settings }, null, 2));
}
