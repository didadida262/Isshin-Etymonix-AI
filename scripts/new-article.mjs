#!/usr/bin/env node
/**
 * 在 src/content/articles/ 下生成一篇 JSON 文章文件。
 * @see src/content/article-categories.json 中的 categoryId
 */
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const categoriesPath = join(root, 'src/content/article-categories.json');
const articlesDir = join(root, 'src/content/articles');

function loadCategories() {
  const raw = readFileSync(categoriesPath, 'utf8');
  return JSON.parse(raw);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let title = '新文章标题';
  let categoryId = 'notes';
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--help' || a === '-h') {
      return { help: true };
    }
    if (a.startsWith('--title=')) {
      title = a.slice('--title='.length);
      continue;
    }
    if (a === '--title' && args[i + 1]) {
      title = args[++i];
      continue;
    }
    if (a.startsWith('--category=')) {
      categoryId = a.slice('--category='.length);
      continue;
    }
    if (a === '--category' && args[i + 1]) {
      categoryId = args[++i];
      continue;
    }
    if (!a.startsWith('-')) {
      positional.push(a);
    }
  }

  if (positional[0]) title = positional[0];
  if (positional[1]) categoryId = positional[1];

  return { title, categoryId, help: false };
}

function slugify(title) {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fff-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return s || 'draft';
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const parsed = parseArgs();
const categories = loadCategories();

if (parsed.help) {
  console.log(`用法:
  npm run article:new -- [标题] [categoryId]
  npm run article:new -- --title "标题" --category grammar

可用 categoryId:`);
  for (const c of categories) {
    console.log(`  ${c.id}\t${c.label}`);
  }
  process.exit(0);
}

const { title, categoryId } = parsed;
const valid = categories.some((c) => c.id === categoryId);
if (!valid) {
  console.error(`无效的 categoryId: "${categoryId}"`);
  console.error(`请使用: ${categories.map((c) => c.id).join(', ')}`);
  process.exit(1);
}

mkdirSync(articlesDir, { recursive: true });
const id = randomUUID();
const fileBase = `${todayISO()}-${slugify(title)}`;
let finalPath = join(articlesDir, `${fileBase}.json`);
let n = 0;
while (existsSync(finalPath)) {
  n += 1;
  finalPath = join(articlesDir, `${fileBase}-${n}.json`);
}

const article = {
  id,
  categoryId,
  title,
  excerpt: '在此填写摘要……',
  publishedAt: todayISO(),
  body: '正文可以使用 **粗体**，段落之间空一行。\n\n第二段。',
};

writeFileSync(finalPath, `${JSON.stringify(article, null, 2)}\n`, 'utf8');
console.log('已生成:', finalPath);
console.log(
  '提示: Vite 会缓存 glob，新增文件后若列表未更新，请重启 dev 服务器。',
);
