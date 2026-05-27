/**
 * Cloudflare Pages 若 Build output 固定为 `/`（仓库根目录），
 * 需在 CI 里把构建产物复制到根目录，覆盖开发用 index.html（含 /src/main.tsx）。
 */
import fs from 'node:fs';
import path from 'node:path';

const isCi =
  process.env.CI === 'true' ||
  process.env.CF_PAGES === '1' ||
  process.env.CF_PAGES_BRANCH !== undefined;

if (!isCi) {
  console.log('[publish-dist-to-root] 非 Cloudflare/CI 环境，跳过');
  process.exit(0);
}

const distDir = path.resolve('dist');
const allowList = ['index.html', 'favicon.svg', 'assets', '_headers', '_routes.json'];

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('[publish-dist-to-root] 缺少 dist/index.html，请先 vite build');
  process.exit(1);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

for (const name of allowList) {
  const src = path.join(distDir, name);
  if (!fs.existsSync(src)) {
    if (name === '_headers') continue;
    console.error(`[publish-dist-to-root] 缺少 dist/${name}`);
    process.exit(1);
  }
  copyRecursive(src, path.resolve(name));
}

const index = fs.readFileSync(path.resolve('index.html'), 'utf8');
if (index.includes('/src/main.tsx')) {
  console.error('[publish-dist-to-root] 根目录 index.html 仍引用 /src/main.tsx');
  process.exit(1);
}

console.log('[publish-dist-to-root] 已发布:', allowList.filter((n) => fs.existsSync(path.join(distDir, n))).join(', '));
