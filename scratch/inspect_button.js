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

const button = findElement(data.content, '7c6a7a2');
console.log(JSON.stringify(button, null, 2));
