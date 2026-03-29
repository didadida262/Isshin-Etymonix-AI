export type Profile = {
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
  links?: { label: string; url: string; kind?: 'github' | 'globe' }[];
};

export type ArticleSummary = {
  id: string;
  /** 与 `src/content/article-categories.json` 中的 id 对应 */
  categoryId: string;
  title: string;
  excerpt: string;
  publishedAt: string;
};

export type ArticleDetail = ArticleSummary & {
  body: string;
};
