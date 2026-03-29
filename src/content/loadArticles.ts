import type { ArticleDetail, ArticleSummary } from '../types/api';
import {
  ARTICLE_CATEGORIES,
  getCategoryLabel,
  getCategorySortIndex,
} from './categories';

const modules = import.meta.glob<{ default: ArticleDetail }>(
  './articles/*.json',
  { eager: true },
);

function normalize(detail: ArticleDetail): ArticleDetail {
  if (!detail.categoryId?.trim()) {
    console.warn('[articles] categoryId 缺失，已回退为 notes:', detail.id);
    return { ...detail, categoryId: 'notes' };
  }
  return detail;
}

export function getAllArticleDetails(): ArticleDetail[] {
  const list = Object.values(modules).map((m) => normalize(m.default));
  return list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getArticleSummaries(): ArticleSummary[] {
  return getAllArticleDetails().map(
    ({ id, categoryId, title, excerpt, publishedAt }) => ({
      id,
      categoryId,
      title,
      excerpt,
      publishedAt,
    }),
  );
}

export function getArticleById(id: string): ArticleDetail | undefined {
  return getAllArticleDetails().find((a) => a.id === id);
}

/** 按类别分组：先按配置中的类别顺序，组内按日期倒序 */
export function groupSummariesByCategory(
  summaries: ArticleSummary[],
): { categoryId: string; label: string; items: ArticleSummary[] }[] {
  const byCat = new Map<string, ArticleSummary[]>();
  for (const s of summaries) {
    const cid = s.categoryId || 'notes';
    const arr = byCat.get(cid) ?? [];
    arr.push(s);
    byCat.set(cid, arr);
  }
  for (const arr of byCat.values()) {
    arr.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }
  const seen = new Set<string>();
  const ordered: {
    categoryId: string;
    label: string;
    items: ArticleSummary[];
  }[] = [];
  for (const c of ARTICLE_CATEGORIES) {
    const items = byCat.get(c.id);
    if (items?.length) {
      ordered.push({ categoryId: c.id, label: c.label, items });
      seen.add(c.id);
    }
  }
  for (const [categoryId, items] of byCat) {
    if (!seen.has(categoryId) && items.length) {
      ordered.push({
        categoryId,
        label: getCategoryLabel(categoryId),
        items,
      });
    }
  }
  return ordered.sort(
    (a, b) =>
      getCategorySortIndex(a.categoryId) - getCategorySortIndex(b.categoryId),
  );
}
