#!/usr/bin/env node

/**
 * 将 docs 文件夹中的 TXT 文件转换为 JSON 格式
 * 输出到 src/data 目录
 * 
 * 使用方法：
 *   npm run gen
 *   或：node convert-pages-to-json.js
 * 
 * 完整工作流程：
 * 1. 在 Pages 应用中打开 .pages 文件
 * 2. 导出为 TXT：文件 → 导出为 → 文本
 * 3. 保存到 docs 目录：Unite1.txt, Unite2.txt 等
 * 4. 运行转换：npm run gen
 * 5. 在页面中点击对应单元，自动加载 JSON 数据展示单词卡片
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 固定配置
const DOCS_DIR = path.join(__dirname, 'docs');
const OUTPUT_DIR = path.join(__dirname, 'src', 'data');

/**
 * 从 TXT 文件中读取文本内容
 * @param {string} txtPath - .txt 文件路径
 * @returns {string} 文本内容
 */
function readTxtFile(txtPath) {
  return fs.readFileSync(txtPath, 'utf-8');
}

/**
 * 解析文本内容，提取结构化数据
 * 格式分析：
 * Unite 1                          <- 标题行
 * 
 * BENE: meaning "well"             <- 词根行：大写字母 + 冒号/中文冒号 + meaning + 含义
 * - benediction: well + speaking   <- 单词行：短横线 + 空格 + 单词 + 冒号/中文冒号 + 定义
 * - benefactor: someone who helps...
 * 
 * @param {string} text - 文本内容
 * @param {string} fileName - 原始文件名
 * @returns {object} 结构化数据
 */
function parseContent(text, fileName) {
  // 按行分割，保留空行用于识别段落
  const lines = text.split('\n');
  
  const roots = [];
  let currentRoot = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳过空行、标题行
    if (!trimmed || /^unite\s*\d+/i.test(trimmed) || /^小绿/i.test(trimmed)) {
      continue;
    }
    
    // 检测是否是词根行：大写字母 + 冒号/中文冒号
    // 格式 1: BENE: meaning "well"
    // 格式 2: CRIM: fault or crime
    // 格式 3: BELL: meaning 'war',Bellona is the roman godness of war...
    const rootMatch = trimmed.match(/^([A-Z]{2,})\s*[:：]\s*(.+)$/);
    if (rootMatch) {
      // 保存上一个词根
      if (currentRoot) {
        roots.push(currentRoot);
      }
      
      const rootName = rootMatch[1].trim().toUpperCase();
      const fullContent = rootMatch[2].trim();
      
      // 提取 meaning 部分
      const meaningMatch = fullContent.match(/.*?meaning\s+["']?([^"',;]+)["']?/i);
      let rootMeaning = meaningMatch 
        ? meaningMatch[1].trim() 
        : fullContent.split(/[;,]/)[0].trim();
      // 清理各种引号（英文引号"'/和中文引号""""\u201c\u201d）
      rootMeaning = rootMeaning.replace(/["'\u201c\u201d']/g, '');
      
      // 检查是否有额外说明（在 meaning 之后的内容）
      let rootNote = null;
      const meaningPartMatch = fullContent.match(/.*?meaning\s+["']?[^"',;]+["']?\s*,\s*/i);
      if (meaningPartMatch && meaningPartMatch[0]) {
        const note = fullContent.substring(meaningPartMatch[0].length).trim();
        if (note && note.length > 5) {
          rootNote = note.replace(/["'\u201c\u201d']/g, '');
        }
      }
      
      currentRoot = {
        root: rootName,
        rootMeaning: rootMeaning,
        rootNote: rootNote,
        words: []
      };
      continue;
    }
    
    // 检测是否是单词行：短横线 + 空格 + 单词 + 冒号/中文冒号 + 定义
    // 例如：- benediction: well + speaking
    const wordMatch = trimmed.match(/^-\s*([a-zA-Z]+)\s*[:：]\s*(.+)$/);
    if (wordMatch && currentRoot) {
      const word = wordMatch[1].trim().toLowerCase();
      const definition = wordMatch[2].trim();
      
      // 只添加有效的定义（至少 2 个字符）
      if (definition.length >= 2) {
        currentRoot.words.push({
          word: word,
          definition: definition
        });
      }
    }
  }
  
  // 保存最后一个词根
  if (currentRoot) {
    roots.push(currentRoot);
  }
  
  // 如果无法解析出结构化数据，返回纯文本
  if (roots.length === 0) {
    return {
      fileName: fileName,
      content: text.substring(0, 500),
      raw: true
    };
  }
  
  return roots;
}

/**
 * 转换单个 TXT 文件
 * @param {string} txtPath - .txt 文件路径
 */
function convertFile(txtPath) {
  const fileName = path.basename(txtPath, '.txt');
  
  try {
    console.log(`正在处理：${fileName}.txt`);
    
    // 读取文本
    const text = readTxtFile(txtPath);
    
    // 解析内容
    const data = parseContent(text, fileName);
    
    // 确定输出文件名
    let outputFileName;
    const match = fileName.match(/unite?\s*(\d+)/i);
    if (match) {
      outputFileName = `unite${match[1]}.json`;
    } else {
      outputFileName = `${fileName.toLowerCase()}.json`;
    }
    
    const outputPath = path.join(OUTPUT_DIR, outputFileName);
    
    // 写入 JSON 文件
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    
    const count = Array.isArray(data) ? data.length : 1;
    console.log(`✓ 已转换：${outputFileName} (${count} 条数据)`);
    
  } catch (error) {
    console.log(`✗ 转换失败 ${fileName}.txt: ${error.message}`);
  }
}

/**
 * 转换 docs 目录下所有 TXT 文件
 */
function convertAllFiles() {
  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // 查找所有 .txt 文件
  const txtFiles = [];
  if (fs.existsSync(DOCS_DIR)) {
    const files = fs.readdirSync(DOCS_DIR);
    for (const file of files) {
      if (file.endsWith('.txt')) {
        txtFiles.push(path.join(DOCS_DIR, file));
      }
    }
  }
  
  if (txtFiles.length === 0) {
    console.log('\n⚠️  在 docs 目录下没有找到 .txt 文件');
    console.log('\n💡 操作流程：');
    console.log('   1. 打开 Pages 应用中的 .pages 文件');
    console.log('   2. 选择 "文件" → "导出为" → "文本"');
    console.log('   3. 保存为 .txt 文件到 docs 目录');
    console.log('   4. 然后运行：npm run gen\n');
    return;
  }
  
  console.log('='.repeat(50));
  console.log('TXT 文件 → JSON 转换器');
  console.log('='.repeat(50));
  console.log(`源目录：${DOCS_DIR}`);
  console.log(`输出目录：${OUTPUT_DIR}`);
  console.log('='.repeat(50));
  console.log(`\n找到 ${txtFiles.length} 个 .txt 文件，开始转换...\n`);
  
  // 转换每个文件
  let successCount = 0;
  for (const txtPath of txtFiles.sort()) {
    convertFile(txtPath);
    successCount++;
  }
  
  console.log(`\n✓ 转换完成！共处理 ${successCount}/${txtFiles.length} 个文件`);
}

// 执行
convertAllFiles();
