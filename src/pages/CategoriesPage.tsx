import { useMemo } from 'react';
import { CategoriesTextLink } from '../components/CategoriesTextLink';
import { ARTICLE_CATEGORIES } from '../content/categories';
import { getArticleSummaries } from '../content/loadArticles';

export function CategoriesPage() {
  const articles = useMemo(() => getArticleSummaries(), []);

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
    </>
  );
}
