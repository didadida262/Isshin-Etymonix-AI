/**
 * 动态加载单元数据
 */

export interface WordItem {
  word: string;
  definition: string;
  root?: string;
}

export interface RootGroup {
  root: string;
  meaning: string;
  words: WordItem[];
}

/**
 * 获取所有可用的单元 ID（根据实际存在的 JSON 文件）
 * @returns Promise<number[]> 可用的单元 ID 列表
 */
export async function getAvailableUnitIds(): Promise<number[]> {
  const availableIds: number[] = [];
  
  // 检查 unite1.json 到 unite30.json
  for (let i = 1; i <= 30; i++) {
    try {
      // 尝试导入，如果成功则说明文件存在
      await Promise.resolve().then(() => import(`../data/unite${i}.json`));
      availableIds.push(i);
    } catch {
      // 文件不存在，跳过
    }
  }
  
  return availableIds;
}

/**
 * 根据单元 ID 加载对应的 JSON 文件
 * @param unitId - 单元 ID (1, 2, 3...)
 * @returns Promise<RootGroup[]> 按词根分组的数据
 */
export async function loadUnitData(unitId: number): Promise<RootGroup[]> {
  try {
    // 动态导入 JSON 文件
    const module = await import(`../data/unite${unitId}.json`);
    const data = module.default;
    
    // JSON 文件的格式是：{ root, rootMeaning, rootNote, words: [{word, definition}] }
    // 转换为 RootGroup 格式：{ root, meaning, words: [{word, definition, root}] }
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item: any) => ({
        root: item.root,
        meaning: item.rootMeaning,
        words: item.words.map((w: any) => ({
          word: w.word,
          definition: w.definition,
          root: item.root,
        })),
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Failed to load unit ${unitId} data:`, error);
    return [];
  }
}

/**
 * 将单词列表按词根分组（兼容旧格式）
 * @param words - 单词列表
 * @returns RootGroup[] 按词根分组的数据
 */
export function groupWordsByRoot(words: WordItem[]): RootGroup[] {
  const rootMap = new Map<string, { meaning: string; words: WordItem[] }>();
  
  for (const item of words) {
    // 解析词根行，兼容全角/半角冒号
    const rootMatch = item.root?.match(/^([^：:]+)[：:](.*)$/);
    const root = rootMatch ? rootMatch[1].trim() : (item.root?.trim() || '');
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
