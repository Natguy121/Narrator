// Builds the single self-contained, offline HTML file:
//   the-narrator-says.html
// Three.js is bundled + minified into an IIFE (global THREE) and inlined.
// Game sources in src/js are concatenated (in order) and inlined unminified.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const threeEntry = join(root, 'node_modules/three/build/three.module.js');

const threeBundle = await build({
  stdin: { contents: `export * from ${JSON.stringify(threeEntry)};`, resolveDir: root, loader: 'js' },
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'THREE',
  write: false,
  legalComments: 'none',
  target: ['es2019'],
});
const threeCode = threeBundle.outputFiles[0].text;

const jsDir = join(root, 'src/js');
const files = readdirSync(jsDir).filter((f) => f.endsWith('.js')).sort();
let game = '';
for (const f of files) {
  game += `\n/* ===================== ${f} ===================== */\n`;
  game += readFileSync(join(jsDir, f), 'utf8');
}
game = `(function(){\n'use strict';\n${game}\n})();\n`;

// Syntax check the game code (throws on error).
await build({ stdin: { contents: game, loader: 'js' }, write: false, target: ['es2020'] });

const template = readFileSync(join(root, 'src/template.html'), 'utf8');
const safe = (s) => s.replace(/<\/script/gi, '<\\/script');
const out = template
  .replace('<!--THREE-->', () => `<script>\n/* three.js r170 - MIT License - https://threejs.org */\n${safe(threeCode)}\n</script>`)
  .replace('<!--GAME-->', () => `<script>\n${safe(game)}\n</script>`);

writeFileSync(join(root, 'the-narrator-says.html'), out);
writeFileSync(join(root, 'index.html'), out); // GitHub Pages entry point
console.log(`Built the-narrator-says.html (${(out.length / 1024).toFixed(0)} KB) from ${files.length} source files.`);
