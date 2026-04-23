import unite1Data from './unite1.json';

export type WordItem = {
  word: string;
  definition: string;
  root: string;
};

export type RootGroup = {
  root: string;
  meaning: string;
  words: WordItem[];
};

function parseRoot(raw: string): { root: string; meaning: string } {
  // 兼容全角冒号 和 半角冒号
  const m = raw.match(/^([^：:]+)[：:](.*)$/);
  if (m) return { root: m[1].trim(), meaning: m[2].trim() };
  return { root: raw.trim(), meaning: '' };
}

const unit1Roots: RootGroup[] = (() => {
  const rootMap = new Map<string, { meaning: string; words: WordItem[] }>();
  for (const item of unite1Data) {
    const { root, meaning } = parseRoot(item.root);
    const existing = rootMap.get(root);
    if (existing) {
      existing.words.push({ word: item.word, definition: item.definition, root });
    } else {
      rootMap.set(root, {
        meaning,
        words: [{ word: item.word, definition: item.definition, root }],
      });
    }
  }
  return Array.from(rootMap.entries()).map(([root, { meaning, words }]) => ({
    root,
    meaning,
    words,
  }));
})();

export default unit1Roots;
export const UNIT_1_ROOTS = unit1Roots;
