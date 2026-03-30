import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getCategoryLabel } from '../content/categories';
import { groupSummariesByCategory } from '../content/loadArticles';
import type { ArticleSummary } from '../types/api';
import { Skeleton } from './ui/Skeleton';

function CategoryTag({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-border bg-surface-elevated/80 px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-white/5 dark:ring-white/10">
      {label}
    </span>
  );
}

function ArticleRow({
  article,
  categoryLabel,
  index,
}: {
  article: ArticleSummary;
  categoryLabel: string;
  index: number;
}) {
  return (
    <motion.li
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
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 font-display text-lg font-semibold tracking-tight text-zinc-900 group-hover:text-accent dark:text-zinc-50">
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
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CategoryTag label={categoryLabel} />
          <time
            dateTime={article.publishedAt}
            className="text-xs tabular-nums text-zinc-500 dark:text-zinc-500"
          >
            {article.publishedAt}
          </time>
        </div>
      </Link>
    </motion.li>
  );
}

function ListSkeleton({ grouped }: { grouped: boolean }) {
  const card = (i: number) => (
    <li
      key={i}
      className="rounded-2xl border border-border bg-surface-elevated/40 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 flex-1 max-w-md" />
        <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
      </div>
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-[92%]" />
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-3 w-24" />
      </div>
    </li>
  );

  if (!grouped) {
    return (
      <ul className="space-y-4" aria-busy aria-label="加载文章列表">
        {Array.from({ length: 4 }).map((_, i) => card(i))}
      </ul>
    );
  }

  return (
    <div className="space-y-8" aria-busy aria-label="加载文章列表">
      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g}>
          <Skeleton className="mb-4 h-5 w-28" />
          <ul className="space-y-4">
            {Array.from({ length: 2 }).map((__, i) => card(i + g * 10))}
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
  onRetry?: () => void;
  /** 为 false 时不显示类别分组标题，适合单类别列表页 */
  grouped?: boolean;
}) {
  const {
    articles,
    loading,
    error,
    onRetry,
    grouped = true,
  } = props;

  if (loading) {
    return <ListSkeleton grouped={grouped} />;
  }

  if (error) {
    return (
      <div
        className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center"
        role="alert"
      >
        <p className="text-sm text-red-200 dark:text-red-300">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-full border border-border px-5 py-2 text-sm transition hover:border-accent/50 hover:text-accent"
          >
            重试
          </button>
        ) : null}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
        暂无文章。
      </div>
    );
  }

  if (!grouped) {
    const sorted = [...articles].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt),
    );
    return (
      <ul className="space-y-4">
        {sorted.map((article, index) => (
          <ArticleRow
            key={article.id}
            article={article}
            categoryLabel={getCategoryLabel(article.categoryId)}
            index={index}
          />
        ))}
      </ul>
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
              <ArticleRow
                key={article.id}
                article={article}
                categoryLabel={group.label}
                index={index}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
