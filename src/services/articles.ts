import { mockArticleById, mockArticleList } from '../mocks/data';
import type { ArticleDetail, ArticleSummary } from '../types/api';
import { api } from './api';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function fetchArticles(): Promise<ArticleSummary[]> {
  if (useMock) {
    await delay(550);
    return mockArticleList();
  }
  const { data } = await api.get<ArticleSummary[]>('/articles');
  return data;
}

export async function fetchArticle(id: string): Promise<ArticleDetail> {
  if (useMock) {
    await delay(500);
    const found = mockArticleById(id);
    if (!found) {
      throw new Error('NOT_FOUND');
    }
    return found;
  }
  const { data } = await api.get<ArticleDetail>(`/articles/${id}`);
  return data;
}
