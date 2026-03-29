import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { groupSummariesByCategory } from '../content/loadArticles';
import type { ArticleSummary } from '../types/api';
import { Skeleton } from './ui/Skeleton';

function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
      {label}
    </span>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-8" aria-busy aria-label="加载文章列表">
      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g}>
          <Skeleton className="mb-4 h-5 w-28" />
          <ul className="space-y-4">
            {Array.from({ length: 2 }).map((__, i) => (
              <li
                key={i}
                className="rounded-2xl border border-border bg-surface-elevated/40 p-5"
              >
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 flex-1 max-w-md" />
                </div>
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-[92%]" />
                <Skeleton className="mt-4 h-3 w-24" />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function ArticleList(props: {
  articles: ArticleSummary[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const { articles, loading, error, onRetry } = props;

  if (loading) {
    return <ListSkeleton />;
  }

  if (error) {
    return (
      <div
        className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center"
        role="alert"
      >
        <p className="text-sm text-red-200 dark:text-red-300">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full border border-border px-5 py-2 text-sm transition hover:border-accent/50 hover:text-accent"
        >
          重试
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
        暂无文章。接口返回空列表时会显示此状态。
      </div>
    );
  }

  const groups = groupSummariesByCategory(articles);

  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <section
          key={group.categoryId}
          aria-labelledby={`cat-${group.categoryId}`}
        >
          <h3
            id={`cat-${group.categoryId}`}
            className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-muted"
          >
            {group.label}
          </h3>
          <ul className="space-y-4">
            {group.items.map((article, index) => (
              <motion.li
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.04,
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  to={`/articles/${article.id}`}
                  className="group block rounded-2xl border border-border bg-surface-elevated/35 p-5 transition hover:border-accent/35 hover:bg-surface-elevated/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                      <CategoryBadge label={group.label} />
                      <h2 className="font-display text-lg font-semibold tracking-tight text-zinc-900 group-hover:text-accent dark:text-zinc-50">
                        {article.title}
                      </h2>
                    </div>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="mt-1 h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                    {article.excerpt}
                  </p>
                  <time
                    dateTime={article.publishedAt}
                    className="mt-4 block text-xs text-zinc-500 dark:text-zinc-500"
                  >
                    {article.publishedAt}
                  </time>
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
