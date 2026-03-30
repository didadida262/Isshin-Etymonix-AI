import { useCallback, useEffect, useMemo, useState } from 'react';
import { CategoriesTextLink } from '../components/CategoriesTextLink';
import { ARTICLE_CATEGORIES } from '../content/categories';
import { mapErrorMessage } from '../lib/errors';
import { fetchArticles } from '../services/articles';
import type { ArticleSummary } from '../types/api';

export function CategoriesPage() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of ARTICLE_CATEGORIES) {
      m.set(c.id, 0);
    }
    for (const a of articles) {
      const id = a.categoryId || 'notes';
      m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  }, [articles]);

  return (
    <>
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Categories
        </h1>
        <p className="text-sm text-muted">按类别浏览全部文章</p>
      </header>

      {loading && (
        <p className="text-sm text-muted" aria-busy>
          加载中…
        </p>
      )}
      {!loading && error && (
        <div
          className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-200 dark:text-red-300"
          role="alert"
        >
          {error}
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 block rounded-full border border-border px-4 py-1.5 text-xs text-zinc-200 transition hover:border-accent/50 hover:text-accent"
          >
            重试
          </button>
        </div>
      )}
      {!loading && !error && (
        <nav aria-label="文章类别">
          <ul className="flex flex-col gap-1">
            {ARTICLE_CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <CategoriesTextLink
                  to={`/categories/${cat.id}`}
                  className="py-1 text-base text-zinc-800 dark:text-zinc-200"
                >
                  {cat.label}
                  <span className="ml-2 text-xs font-normal tabular-nums text-muted">
                    {counts.get(cat.id) ?? 0}
                  </span>
                </CategoriesTextLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
