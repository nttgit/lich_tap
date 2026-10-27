// Gộp bản build demo thành 1 file HTML duy nhất (để xem thử, không cần server).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-demo';
let html = readFileSync(join(dir, 'index.html'), 'utf8');

html = html.replace(/<script type="module" crossorigin src="\/(assets\/[^"]+\.js)"><\/script>/, (_, p) => {
  const js = readFileSync(join(dir, p), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="stylesheet" crossorigin href="\/(assets\/[^"]+\.css)">/, (_, p) => `<style>${readFileSync(join(dir, p), 'utf8')}</style>`);
// bỏ manifest / icon (file rời, bản 1-file không có)
html = html.replace(/\s*<link rel="(manifest|apple-touch-icon|icon)"[^>]*>/g, '');

writeFileSync(join(dir, 'demo.html'), html);
console.log('→ dist-demo/demo.html', (html.length / 1024).toFixed(1), 'KB');
