const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Use indexOf and substring to safely remove the block
const startIndex = code.indexOf('async function proxyLocalWordPressRequest(req: Request, res: Response) {');
const endString = '}\n';
const ifBlock = 'if (process.env.NODE_ENV !== "production") {\n\tapp.all("/api/local-wordpress/:siteSlug", proxyLocalWordPressRequest);\n\tapp.all("/api/local-wordpress/:siteSlug/*", proxyLocalWordPressRequest);\n}\n';

if (startIndex !== -1) {
    const nextCode = code.substring(startIndex);
    const endIndex = startIndex + nextCode.indexOf(ifBlock) + ifBlock.length;
    
    code = code.substring(0, startIndex) + code.substring(endIndex);
    fs.writeFileSync('server.ts', code);
    console.log("Successfully removed proxyLocalWordPressRequest");
} else {
    console.log("Could not find proxyLocalWordPressRequest");
}
