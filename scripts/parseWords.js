import fs from 'fs';
import path from 'path';

const docsDir = path.join(process.cwd(), 'docs');
const outputDir = path.join(process.cwd(), 'src/data');

function parseTxtFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const words = [];
  let currentRoot = '';

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('Unite')) continue;

    // 匹配词根行，例如 BENE：meaning “well” 或 AM: meaning "to love"
    if (line.match(/^[A-Z]+\s*[:：]/)) {
      currentRoot = line;
      continue;
    }

    // 匹配单词行
    if (line.startsWith('-')) {
      const parts = line.substring(1).split(/[:：]/);
      if (parts.length >= 2) {
        const word = parts[0].trim();
        const definition = parts.slice(1).join(':').trim();
        words.push({ word, definition, root: currentRoot });
      }
    } else if (line.includes(':')) {
      const parts = line.split(/[:：]/);
      if (parts.length >= 2 && !line.includes('meaning')) {
         const word = parts[0].trim();
         const definition = parts.slice(1).join(':').trim();
         words.push({ word, definition, root: currentRoot });
      }
    }
  }
  return words;
}

function processAllFiles() {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.txt'));
    
    for (const file of files) {
      const inputPath = path.join(docsDir, file);
      const outputName = file.replace('.txt', '.json').toLowerCase();
      const outputPath = path.join(outputDir, outputName);
      
      const words = parseTxtFile(inputPath);
      fs.writeFileSync(outputPath, JSON.stringify(words, null, 2), 'utf-8');
      console.log(`✅ 成功解析: ${file} -> ${outputName} (${words.length} 个单词)`);
    }
    
    console.log('\n✨ 所有文件转换完成！');
  } catch (error) {
    console.error('❌ 转换失败:', error);
  }
}

processAllFiles();
