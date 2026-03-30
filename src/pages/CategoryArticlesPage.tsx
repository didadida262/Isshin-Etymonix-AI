import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArticleList } from '../components/ArticleList';
import { CategoriesTextLink } from '../components/CategoriesTextLink';
import {
  ARTICLE_CATEGORIES,
  getCategoryLabel,
} from '../content/categories';
import { mapErrorMessage } from '../lib/errors';
import { fetchArticles } from '../services/articles';
import type { ArticleSummary } from '../types/api';

export function CategoryArticlesPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const valid =
    categoryId &&
    ARTICLE_CATEGORIES.some((c) => c.id === categoryId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticles();
      setArticles(data);
    } catch (e) {
      setError(mapErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!categoryId || !valid) return [];
    return articles.filter(
      (a) => (a.categoryId || 'notes') === categoryId,
    );
  }, [articles, categoryId, valid]);

  if (!categoryId) {
    return null;
  }

  if (!valid) {
    return (
      <div className="rounded-2xl border border-border bg-surface-elevated/40 p-8 text-center text-sm text-muted">
        <p>未找到该类别。</p>
        <CategoriesTextLink to="/categories" className="mt-4 inline-block">
          返回 Categories
        </CategoriesTextLink>
      </div>
    );
  }

  const label = getCategoryLabel(categoryId);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <CategoriesTextLink to="/categories" className="text-sm">
          Categories
        </CategoriesTextLink>
        <span className="text-sm text-muted" aria-hidden>
          /
        </span>
        <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {label}
        </h1>
      </div>
      <p className="mb-8 text-sm text-muted">
        共 {filtered.length} 篇
        <Link
          to="/"
          className="ml-3 text-accent underline-offset-4 hover:underline"
        >
          查看全部文章
        </Link>
      </p>
      <ArticleList
        articles={filtered}
        loading={loading}
        error={error}
        onRetry={load}
        grouped={false}
      />
    </>
  );
}
