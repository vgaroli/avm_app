/**
 * Gera src/environments/version.ts a partir do campo "version" do package.json,
 * para que o app exiba a versão publicada sem edição manual do HTML.
 *
 * Uso: node scripts/generate-version.js (roda automaticamente antes de
 * `npm start` e `npm run build` via os hooks prestart/prebuild).
 */
const fs = require('fs');
const path = require('path');

const { version } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

const outPath = path.join(__dirname, '..', 'src', 'environments', 'version.ts');
const content = `// Arquivo gerado automaticamente por scripts/generate-version.js. Não editar manualmente.\nexport const APP_VERSION = '${version}';\n`;

fs.writeFileSync(outPath, content, 'utf8');
console.log(`src/environments/version.ts gerado com versão ${version}`);
