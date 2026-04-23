/**
 * 解析 docs/unit1-*.txt 词根文件，生成 src/data/unit1Roots.ts
 *
 * 用法：node scripts/generate-root-data.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DOCS_DIR = resolve(ROOT, 'docs');
const OUT_FILE = resolve(ROOT, 'src/data/unit1Roots.ts');

/* ── 读取并按文件名排序 ── */
const files = readdirSync(DOCS_DIR)
  .filter((f) => /^unit\d+-\d+\.txt$/.test(f))
  .sort((a, b) => {
    const [ua, ia] = a.replace('.txt', '').split('-').map(Number);
    const [ub, ib] = b.replace('.txt', '').split('-').map(Number);
    return ua - ub || ia - ib;
  });

/* ── 解析单个文件 ── */
function parseFile(filePath) {
  const content = readFileSync(filePath, 'utf-8').trim();
  const lines = content.split(/\r?\n/).filter((l) => l.trim());

  // 首行：词根 + 含义，如 "1.  dict   说，指出"
  const headerLine = lines[0];
  const headerMatch = headerLine.match(/^\d+\.\s+([\w/]+)\s+(.+)$/);
  if (!headerMatch) {
    console.warn(`⚠ 无法解析文件头: ${filePath} → "${headerLine}"`);
    return null;
  }
  const root = headerMatch[1].trim();
  const meaning = headerMatch[2].trim();

  // 后续行：序号+英文单词+中文释义，如 "1. predict  预言，预告"
  const words = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // 支持 "1. predict  预言，预告" 或 "1.predict 预言，预告"
    const wordMatch = line.match(/^\d+\.\s*([\w-]+)\s+(.+)$/);
    if (wordMatch) {
      words.push({
        front: wordMatch[1].trim(),
        back: wordMatch[2].trim(),
      });
    }
  }

  if (words.length === 0) {
    console.warn(`⚠ 文件无单词: ${filePath}`);
    return null;
  }

  return {
    id: root.replace(/\//g, '_'),
    root,
    meaning,
    words,
  };
}

/* ── 汇总 ── */
const roots = [];
for (const file of files) {
  const parsed = parseFile(resolve(DOCS_DIR, file));
  if (parsed) roots.push(parsed);
}

console.log(`✅ 解析完成：${files.length} 个文件 → ${roots.length} 个词根`);
roots.forEach((r) => console.log(`   ${r.root} (${r.meaning}) → ${r.words.length} 词`));

/* ── 输出 TypeScript 文件 ── */
const ts = `/* eslint-disable */
/* 由 scripts/generate-root-data.mjs 自动生成，勿手动编辑 */

export type RootWord = {
  front: string;
  back: string;
};

export type RootGroup = {
  id: string;
  root: string;
  meaning: string;
  words: RootWord[];
};

export const UNIT_1_ROOTS: RootGroup[] = ${JSON.stringify(roots, null, 2)};
`;

writeFileSync(OUT_FILE, ts, 'utf-8');
console.log(`📝 已写入: ${OUT_FILE}`);
