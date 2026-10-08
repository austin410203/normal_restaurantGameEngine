// Single-file-bundle build (models inlined as data URLs) for hosts that can't serve .glb
// files, e.g. a claude.ai artifact. Output: dist-single/ (index.html + assets/*.js|css).
import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync, rmSync } from 'node:fs';
execSync('node tools/inline-models.mjs', { stdio: 'inherit' });
rmSync('dist-single', { recursive: true, force: true });
execSync('npx vite build --base=./ --outDir dist-single', { stdio: 'inherit', env: { ...process.env, INLINE_MODELS: '1' } });
rmSync('dist-single/models', { recursive: true, force: true });
const assets = readdirSync('dist-single/assets');
const js = assets.find((f) => f.endsWith('.js')), css = assets.find((f) => f.endsWith('.css'));
writeFileSync('dist-single/index.html', `<title>Game</title>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Noto+Sans+TC:wght@500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/${css}">
<style>html,body{height:100%;background:#f6ecd9}</style>
<div id="root"></div>
<script type="module" src="assets/${js}"></script>
`);
console.log('dist-single ready:', js, css);
