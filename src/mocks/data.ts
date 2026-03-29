import type { Profile } from '../types/api';

export const mockProfile: Profile = {
  name: 'Miles',
  title: '语言学写 · 记录与思考',
  bio: '在这里整理学习语言时的笔记、对比与零碎想法。偏个人向，欢迎随手翻阅。',
  links: [
    { label: 'GitHub', url: 'https://github.com', kind: 'github' },
    { label: '站点', url: 'https://example.com', kind: 'globe' },
  ],
};

export {
  getAllArticleDetails,
  getArticleById,
  getArticleSummaries,
} from '../content/loadArticles';
