#!/usr/bin/env node

/**
 * 将 docs 文件夹中的 txt 文件转换为 JSON 格式
 * 每个 txt 文件对应一个单元，转换为对应的 json 文件保存到 src/data 目录
 * 
 * 使用方法：
 *   node convert-txt-to-json.js
 *   或：npm run convert (如果在 package.json 中配置了脚本)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, 'docs');
const outputDir = path.join(__dirname, 'src', 'data');

/**
 * 解析 txt 文件，提取单词信息
 * @param {string} txtPath - txt 文件路径
 * @returns {Array} 格式化后的单词列表
 */
function parseTxtFile(txtPath) {
    const content = fs.readFileSync(txtPath, 'utf-8');
    const lines = content.split('\n');
    const words = [];
    let currentRoot = '';

    for (const line of lines) {
        const trimmedLine = line.trim();

        // 跳过空行和标题行
        if (!trimmedLine || /^unite\s*\d+/i.test(trimmedLine) || /^unit\s*\d+/i.test(trimmedLine)) {
            continue;
        }

        // 检测是否是 root 行（不以 - 开头的行）
        if (!trimmedLine.startsWith('-')) {
            currentRoot = trimmedLine;
            continue;
        }

        // 检测是否是单词行（以 - 开头）
        if (trimmedLine.startsWith('-')) {
            // 移除开头的 "- " 或 "-"
            let wordLine = trimmedLine.substring(1).trim();
            if (wordLine.startsWith('-')) {
                wordLine = wordLine.substring(1).trim();
            }

            // 解析单词和定义，支持多种分隔符：：、:
            const match = wordLine.match(/^([^:：\s]+)[\s:：]+(.*)$/);

            if (match) {
                const word = match[1].trim();
                const definition = match[2].trim();

                // 跳过空单词
                if (!word) {
                    continue;
                }

                const wordEntry = {
                    word: word,
                    definition: definition,
                    root: currentRoot || ''
                };
                words.push(wordEntry);
            }
        }
    }

    return words;
}

/**
 * 转换单个 txt 文件为 json
 * @param {string} txtPath - txt 文件路径
 * @param {string} outputPath - 输出 json 文件路径
 * @returns {string} 生成的 json 文件路径
 */
function convertFile(txtPath, outputPath) {
    // 获取文件名（不含扩展名）
    const fileName = path.basename(txtPath, '.txt');

    // 生成输出文件名（统一小写 unite + 数字）
    let jsonFilename;
    const match = fileName.match(/unite?\s*(\d+)/i);
    if (match) {
        const unitNum = match[1];
        jsonFilename = `unite${unitNum}.json`;
    } else {
        // 如果没有数字，保持原文件名（小写）
        jsonFilename = `${fileName.toLowerCase()}.json`;
    }

    const finalOutputPath = path.join(outputPath, jsonFilename);

    // 解析 txt 文件
    const words = parseTxtFile(txtPath);

    // 写入 JSON 文件
    fs.writeFileSync(finalOutputPath, JSON.stringify(words, null, 2), 'utf-8');

    console.log(`✓ 已转换：${path.basename(txtPath)} -> ${jsonFilename} (${words.length} 个单词)`);

    return finalOutputPath;
}

/**
 * 转换 docs 目录下的所有 txt 文件
 */
function convertAllTxtFiles() {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`创建输出目录：${outputDir}`);
    }

    // 查找所有 txt 文件
    const txtFiles = [];
    if (fs.existsSync(docsDir)) {
        const files = fs.readdirSync(docsDir);
        for (const file of files) {
            if (file.endsWith('.txt')) {
                txtFiles.push(path.join(docsDir, file));
            }
        }
    }

    if (txtFiles.length === 0) {
        console.log(`在 ${docsDir} 目录下没有找到 txt 文件`);
        return;
    }

    console.log('='.repeat(50));
    console.log('TXT to JSON 转换器');
    console.log('='.repeat(50));
    console.log(`源目录：${docsDir}`);
    console.log(`输出目录：${outputDir}`);
    console.log('='.repeat(50));
    console.log(`\n找到 ${txtFiles.length} 个 txt 文件，开始转换...\n`);

    // 转换每个文件
    let successCount = 0;
    for (const txtPath of txtFiles.sort()) {
        try {
            convertFile(txtPath, outputDir);
            successCount++;
        } catch (error) {
            console.log(`✗ 转换失败 ${path.basename(txtPath)}: ${error.message}`);
        }
    }

    console.log(`\n✓ 转换完成！共处理 ${successCount}/${txtFiles.length} 个文件`);
}

// 执行转换
convertAllTxtFiles();
