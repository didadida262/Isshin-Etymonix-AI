import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { fetchArticle } from '../services/articles';
import type { ArticleDetail } from '../types/api';

function ArticleSkeleton() {
  return (
    <article className="space-y-6" aria-busy aria-label="加载文章">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-4/5 max-w-xl" />
      <Skeleton className="h-3 w-40" />
      <div className="space-y-3 pt-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </article>
  );
}

function ArticleBody({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/).filter(Boolean);
  return (
    <div className="space-y-4 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
      {blocks.map((block, i) => (
        <p key={i}>{block.replace(/\*\*(.+?)\*\*/g, '$1')}</p>
      ))}
    </div>
  );
}

function mapError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = String((err as { message?: string }).message);
    if (m === 'NOT_FOUND') return '未找到该文章。';
    return m || '加载失败';
  }
  return '加载失败';
}

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticle(id);
      setArticle(data);
    } catch (e) {
      setArticle(null);
      setError(mapError(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="relative min-h-screen bg-[length:24px_24px] bg-grid-light dark:bg-grid-dark">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent dark:from-accent/10" />
      <main className="relative mx-auto max-w-3xl px-4 pb-20 pt-20 md:px-8 md:pb-28 md:pt-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
          返回首页
        </Link>

        <div className="mt-10 rounded-3xl border border-border bg-surface-elevated/50 p-6 backdrop-blur-md md:p-10">
          {loading && <ArticleSkeleton />}
          {!loading && error && (
            <div
              className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center"
              role="alert"
            >
              <p className="text-sm text-red-200 dark:text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 rounded-full border border-border px-5 py-2 text-sm transition hover:border-accent/50 hover:text-accent"
              >
                重试
              </button>
            </div>
          )}
          {!loading && !error && article && (
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="font-display text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl">
                {article.title}
              </h1>
              <time
                dateTime={article.publishedAt}
                className="mt-4 block text-sm text-muted"
              >
                {article.publishedAt}
              </time>
              <div className="mt-10 border-t border-border pt-10">
                <ArticleBody text={article.body} />
              </div>
            </motion.article>
          )}
        </div>
      </main>
    </div>
  );
}
