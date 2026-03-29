import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { ArticleSummary } from '../types/api';
import { Skeleton } from './ui/Skeleton';

function ListSkeleton() {
  return (
    <ul className="space-y-4" aria-busy aria-label="加载文章列表">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="rounded-2xl border border-border bg-surface-elevated/40 p-5"
        >
          <Skeleton className="h-5 w-3/5 max-w-md" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-[92%]" />
          <Skeleton className="mt-4 h-3 w-24" />
        </li>
      ))}
    </ul>
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

  return (
    <ul className="space-y-4">
      {articles.map((article, index) => (
        <motion.li
          key={article.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.05,
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Link
            to={`/articles/${article.id}`}
            className="group block rounded-2xl border border-border bg-surface-elevated/35 p-5 transition hover:border-accent/35 hover:bg-surface-elevated/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-semibold tracking-tight text-zinc-900 group-hover:text-accent dark:text-zinc-50">
                {article.title}
              </h2>
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
  );
}
