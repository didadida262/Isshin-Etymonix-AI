import type { ArticleDetail, ArticleSummary, Profile } from '../types/api';

export const mockProfile: Profile = {
  name: 'Miles',
  title: '语言学写 · 记录与思考',
  bio: '在这里整理学习语言时的笔记、对比与零碎想法。偏个人向，欢迎随手翻阅。',
  links: [
    { label: 'GitHub', url: 'https://github.com', kind: 'github' },
    { label: '站点', url: 'https://example.com', kind: 'globe' },
  ],
};

const articles: ArticleDetail[] = [
  {
    id: '1',
    title: '英语时态：完成体到底在「完成」什么？',
    excerpt: '现在完成与过去完成的语义差别，试着用时间轴画清楚。',
    publishedAt: '2026-03-20',
    body:
      '完成体常常让人困惑，因为它不只在说「做完了」，还在锚定一个**观察点**。\n\n' +
      '过去完成时把参照点放在过去的某一时刻之前；现在完成则把参照点放在「现在」。试着把每个句子画在时间轴上，会直观很多。',
  },
  {
    id: '2',
    title: '日语助词「は」と「が」：信息结构视角',
    excerpt: '不是死记规则，而是从「旧信息 / 新信息」去看句子在说什么。',
    publishedAt: '2026-03-12',
    body:
      '「は」常常标记主题，把听话人已经知道或语境里明显的那块拎到句首。「が」则更常标记焦点，回答「谁 / 什么」的问题。\n\n' +
      '同一个名词用は或が，整句话的预设与重点会完全不同。',
  },
  {
    id: '3',
    title: '背单词：间隔重复之外，我还做的一件事',
    excerpt: '把词放进自己写过的句子里，比只看例句更记得住。',
    publishedAt: '2026-02-28',
    body:
      'Anki 很有用，但我发现最容易忘的，是那些「认得但从来没用过的词」。\n\n' +
      '每周选几个词，强行写进日记或短段落里，哪怕很生硬。几次之后，这个词会从「识别」变成「可用」。',
  },
];

export function mockArticleById(id: string): ArticleDetail | undefined {
  return articles.find((a) => a.id === id);
}

export function mockArticleList(): ArticleSummary[] {
  return articles.map(({ id, title, excerpt, publishedAt }) => ({
    id,
    title,
    excerpt,
    publishedAt,
  }));
}
