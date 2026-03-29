export type Profile = {
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
  links?: { label: string; url: string; kind?: 'github' | 'globe' }[];
};

export type ArticleSummary = {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
};

export type ArticleDetail = ArticleSummary & {
  body: string;
};
