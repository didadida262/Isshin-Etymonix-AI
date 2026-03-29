import { getArticleById, getArticleSummaries } from '../mocks/data';
import type { ArticleDetail, ArticleSummary } from '../types/api';
import { api } from './api';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function fetchArticles(): Promise<ArticleSummary[]> {
  if (useMock) {
    await delay(550);
    return getArticleSummaries();
  }
  const { data } = await api.get<ArticleSummary[]>('/articles');
  return data.map((a) => ({
    ...a,
    categoryId: a.categoryId?.trim() || 'notes',
  }));
}

export async function fetchArticle(id: string): Promise<ArticleDetail> {
  if (useMock) {
    await delay(500);
    const found = getArticleById(id);
    if (!found) {
      throw new Error('NOT_FOUND');
    }
    return found;
  }
  const { data } = await api.get<ArticleDetail>(`/articles/${id}`);
  return {
    ...data,
    categoryId: data.categoryId?.trim() || 'notes',
  };
}
