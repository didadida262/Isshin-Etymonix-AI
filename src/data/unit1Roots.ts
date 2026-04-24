import unite1Data from './unite1.json';

// 定义 JSON 数据的类型
export interface Unite1DataItem {
  root: string;
  rootMeaning: string;
  rootNote: string | null;
  words: {
    word: string;
    definition: string;
  }[];
}

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

// unite1Data 已经是正确的格式，直接转换类型
const unit1Roots: RootGroup[] = unite1Data.map((item) => ({
  root: item.root,
  meaning: item.rootMeaning,
  words: item.words.map((w) => ({
    word: w.word,
    definition: w.definition,
    root: item.root,
  })),
}));

export default unit1Roots;
export const UNIT_1_ROOTS = unit1Roots;
