import { useMemo } from 'react';
import { ArticleList } from '../components/ArticleList';
import { getArticleSummaries } from '../content/loadArticles';

export function HomePage() {
  const articles = useMemo(() => getArticleSummaries(), []);

  return (
    <>
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          文章
        </h1>
        <p className="text-sm text-muted">学习过程中的记录与想法</p>
      </header>
      <ArticleList
        articles={articles}
        loading={false}
        error={null}
        grouped={false}
      />
    </>
  );
}
