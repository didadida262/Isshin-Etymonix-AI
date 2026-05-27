/**
 * Cloudflare Pages 若 Output = dist，需要 index.html 与 assets 在 dist 根目录。
 * @cloudflare/vite-plugin 把前端产物放在 dist/client/，此脚本同步到 dist/。
 */
import fs from 'node:fs';
import path from 'node:path';

const clientDir = path.resolve('dist/client');
const distDir = path.resolve('dist');

if (!fs.existsSync(path.join(clientDir, 'index.html'))) {
  console.error('[sync-dist-root] 请先执行 vite build，确保存在 dist/client/index.html');
  process.exit(1);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

for (const name of fs.readdirSync(clientDir)) {
  const src = path.join(clientDir, name);
  const dest = path.join(distDir, name);
  copyRecursive(src, dest);
}

const assets = path.join(distDir, 'assets');
const jsFiles = fs.existsSync(assets)
  ? fs.readdirSync(assets).filter((f) => f.endsWith('.js'))
  : [];

console.log('[sync-dist-root] 已同步 dist/client → dist/');
console.log('[sync-dist-root] assets:', jsFiles.join(', '));
