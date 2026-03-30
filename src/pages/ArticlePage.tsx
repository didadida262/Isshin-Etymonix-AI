import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCategoryLabel } from '../content/categories';
import { getArticleById } from '../content/loadArticles';

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

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();

  const article = useMemo(
    () => (id ? getArticleById(id) : undefined),
    [id],
  );

  return (
    <>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
        返回文章列表
      </Link>

      <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-border bg-surface-elevated/50 p-6 backdrop-blur-md md:mt-10 md:p-10">
        {!id || !article ? (
          <div
            className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center"
            role="alert"
          >
            <p className="text-sm text-red-200 dark:text-red-300">
              {!id ? '无效链接。' : '未找到该文章。'}
            </p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-full border border-border px-5 py-2 text-sm transition hover:border-accent/50 hover:text-accent"
            >
              返回首页
            </Link>
          </div>
        ) : (
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs font-medium text-accent">
              {getCategoryLabel(article.categoryId)}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl">
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
    </>
  );
}
