import rawData from './unite1.json';

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

export const UNIT_1_ROOTS: RootGroup[] = rawData.map((item) => ({
  id: item.root.replace(/[/\s]/g, '_'),
  root: item.root,
  meaning: item.meaning,
  words: item.words.map((w) => ({
    front: w.word,
    back: w.meaning,
  })),
}));
