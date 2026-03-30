#!/usr/bin/env node
/**
 * 在 src/content/articles/ 下生成一篇 Markdown 文章文件。
 * 用法:
 *   npm run new -- "文章标题" "类别名或 categoryId"
 * 类别可为已有 id / 中文 label；若不存在则自动写入 article-categories.json 并创建该类别。
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

function saveCategories(categories) {
  writeFileSync(
    categoriesPath,
    `${JSON.stringify(categories, null, 2)}\n`,
    'utf8',
  );
}

/**
 * 从未知类别字符串生成唯一 id（仅 [a-z0-9_-]；纯中文等会生成 cat_xxxxxxxx）。
 * @param {string} raw
 * @param {{ id: string, label: string }[]} categories
 */
function allocateNewCategoryId(raw, categories) {
  const trimmed = raw.trim();
  let base = trimmed
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^-+|-+$/g, '');
  if (!base) {
    base = `cat_${randomUUID().slice(0, 8)}`;
  }
  let id = base;
  let n = 0;
  while (categories.some((c) => c.id === id)) {
    n += 1;
    id = `${base}_${n}`;
  }
  return id;
}

/**
 * @param {string} raw
 * @param {{ id: string, label: string }[]} categories
 * @returns {{ categoryId: string, matchedBy: 'id' | 'label' } | null}
 */
function resolveCategory(raw, categories) {
  const input = raw.trim();
  if (!input) return null;

  const byId = categories.find((c) => c.id === input);
  if (byId) return { categoryId: byId.id, matchedBy: 'id' };

  const byLabel = categories.find((c) => c.label === input);
  if (byLabel) return { categoryId: byLabel.id, matchedBy: 'label' };

  const lower = input.toLowerCase();
  const byIdLoose = categories.find((c) => c.id.toLowerCase() === lower);
  if (byIdLoose) return { categoryId: byIdLoose.id, matchedBy: 'id' };

  return null;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let title = '新文章标题';
  let categoryInput = 'notes';
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
      categoryInput = a.slice('--category='.length);
      continue;
    }
    if (a === '--category' && args[i + 1]) {
      categoryInput = args[++i];
      continue;
    }
    if (!a.startsWith('-')) {
      positional.push(a);
    }
  }

  if (positional[0] !== undefined) title = positional[0];
  if (positional[1] !== undefined) categoryInput = positional[1];

  return { title, categoryInput, help: false };
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
  npm run new -- "文章标题" "类别"
  npm run article:new -- "文章标题" "语法"

说明: npm 自定义命令需加 run，中间用 -- 把参数交给脚本。
  第二个参数可以是已有类别的中文名称或 id；若没有匹配项，会自动在
  src/content/article-categories.json 中新增该类别后再写文章。

仍支持:
  npm run new -- --title "标题" --category grammar

可用类别:`);
  for (const c of categories) {
    console.log(`  ${c.label}\t(${c.id})`);
  }
  process.exit(0);
}

const { title, categoryInput } = parsed;
let categoryId;
let createdCategory = false;

const resolved = resolveCategory(categoryInput, categories);
if (resolved) {
  categoryId = resolved.categoryId;
} else {
  const trimmed = categoryInput.trim();
  if (!trimmed) {
    console.error('类别不能为空。');
    process.exit(1);
  }
  categoryId = allocateNewCategoryId(trimmed, categories);
  categories.push({ id: categoryId, label: trimmed });
  saveCategories(categories);
  createdCategory = true;
  console.log(
    `已新建类别并写入 article-categories.json: ${trimmed} → id「${categoryId}」`,
  );
}

mkdirSync(articlesDir, { recursive: true });
const id = randomUUID();
const fileBase = slugify(title);
let finalPath = join(articlesDir, `${fileBase}.md`);
let n = 0;
while (existsSync(finalPath)) {
  n += 1;
  finalPath = join(articlesDir, `${fileBase}-${n}.md`);
}

const article = `---
id: ${id}
categoryId: ${categoryId}
title: ${title}
excerpt: 在此填写摘要……
publishedAt: ${todayISO()}
---

正文可以使用 **粗体**，段落之间空一行。

第二段。
`;

writeFileSync(finalPath, article, 'utf8');
console.log('已生成:', finalPath);
const catMeta = categories.find((c) => c.id === categoryId);
console.log(`类别: ${categoryId}（${catMeta?.label ?? ''}）`);
if (createdCategory) {
  console.log(
    '提示: 已修改类别配置，请重启 dev；新增文章 Markdown 后若列表未更新也请重启。',
  );
} else {
  console.log(
    '提示: Vite 会缓存 glob，新增文件后若列表未更新，请重启 dev 服务器。',
  );
}
