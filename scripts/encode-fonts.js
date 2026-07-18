const fs = require('fs');
const path = require('path');

const ttfBold = fs.readFileSync(path.join(__dirname, '../public/fonts/Roboto-Bold.ttf')).toString('base64');
const ttfReg = fs.readFileSync(path.join(__dirname, '../public/fonts/Roboto-Regular.ttf')).toString('base64');

const output = `export const robotoBoldBase64 = "${ttfBold}";\nexport const robotoRegularBase64 = "${ttfReg}";\n`;

fs.writeFileSync(path.join(__dirname, '../src/services/layout/fonts.js'), output);
console.log('Fonts encoded successfully.');
