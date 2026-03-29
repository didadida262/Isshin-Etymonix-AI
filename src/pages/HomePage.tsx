import { useCallback, useEffect, useState } from 'react';
import { ArticleList } from '../components/ArticleList';
import { ProfilePanel } from '../components/ProfilePanel';
import { fetchArticles } from '../services/articles';
import { fetchProfile } from '../services/profile';
import type { ArticleSummary, Profile } from '../types/api';

function mapErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = String((err as { message?: string }).message);
    if (m === 'Network Error' || m.includes('ECONNREFUSED')) {
      return '网络异常或接口未就绪，请检查后端或开启 Mock。';
    }
    return m || '加载失败';
  }
  return '加载失败';
}

export function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch (e) {
      setProfileError(mapErrorMessage(e));
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadArticles = useCallback(async () => {
    setArticlesLoading(true);
    setArticlesError(null);
    try {
      const data = await fetchArticles();
      setArticles(data);
    } catch (e) {
      setArticlesError(mapErrorMessage(e));
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    void loadArticles();
  }, [loadProfile, loadArticles]);

  return (
    <div className="relative min-h-screen bg-[length:24px_24px] bg-grid-light dark:bg-grid-dark">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent dark:from-accent/10" />
      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 md:px-8 md:pb-24 md:pt-24">
        <div className="flex flex-col gap-10 md:flex-row md:gap-12 lg:gap-16">
          <aside className="shrink-0 md:w-72 lg:w-80">
            <div className="sticky top-24 rounded-3xl border border-border bg-surface-elevated/50 p-6 backdrop-blur-md md:p-8">
              <ProfilePanel
                profile={profile}
                loading={profileLoading}
                error={profileError}
                onRetry={loadProfile}
              />
            </div>
          </aside>
          <section className="min-w-0 flex-1">
            <header className="mb-8 flex flex-col gap-1">
              <h2 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                文章
              </h2>
              <p className="text-sm text-muted">学习过程中的记录与想法</p>
            </header>
            <ArticleList
              articles={articles}
              loading={articlesLoading}
              error={articlesError}
              onRetry={loadArticles}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
