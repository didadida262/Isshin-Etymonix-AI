/**
 * 动态加载单元数据
 */

export interface WordItem {
  word: string;
  definition: string;
  root: string;
}

export interface RootGroup {
  root: string;
  meaning: string;
  words: WordItem[];
}

/**
 * 根据单元 ID 加载对应的 JSON 文件
 * @param unitId - 单元 ID (1, 2, 3...)
 * @returns Promise<WordItem[]> 单词列表
 */
export async function loadUnitData(unitId: number): Promise<WordItem[]> {
  try {
    // 动态导入 JSON 文件
    const module = await import(`../data/unite${unitId}.json`);
    return module.default as WordItem[];
  } catch (error) {
    console.error(`Failed to load unit ${unitId} data:`, error);
    return [];
  }
}

/**
 * 将单词列表按词根分组
 * @param words - 单词列表
 * @returns RootGroup[] 按词根分组的数据
 */
export function groupWordsByRoot(words: WordItem[]): RootGroup[] {
  const rootMap = new Map<string, { meaning: string; words: WordItem[] }>();
  
  for (const item of words) {
    // 解析词根行，兼容全角/半角冒号
    const rootMatch = item.root.match(/^([^：:]+)[：:](.*)$/);
    const root = rootMatch ? rootMatch[1].trim() : item.root.trim();
    const meaning = rootMatch ? rootMatch[2].trim() : '';
    
    const existing = rootMap.get(root);
    if (existing) {
      existing.words.push(item);
    } else {
      rootMap.set(root, {
        meaning,
        words: [item],
      });
    }
  }
  
  return Array.from(rootMap.entries()).map(([root, { meaning, words }]) => ({
    root,
    meaning,
    words,
  }));
}

/**
 * 预加载常用单元数据（可选优化）
 */
export async function preloadUnits(unitIds: number[]): Promise<void> {
  await Promise.all(unitIds.map(id => loadUnitData(id)));
}
