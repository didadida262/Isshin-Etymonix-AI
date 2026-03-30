import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import type { Profile } from '../types/api';
import { CategoriesTextLink } from './CategoriesTextLink';
import { Skeleton } from './ui/Skeleton';

function ProfileSkeleton() {
  return (
    <div className="space-y-5" aria-busy aria-label="加载个人资料">
      <Skeleton className="mx-auto h-24 w-24 rounded-full md:mx-0" />
      <div className="space-y-2 text-center md:text-left">
        <Skeleton className="mx-auto h-7 w-40 md:mx-0" />
        <Skeleton className="mx-auto h-4 w-56 md:mx-0" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex justify-center gap-2 md:justify-start">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </div>
  );
}

function LinkIcon({ kind }: { kind?: string }) {
  if (kind === 'github') {
    return <FontAwesomeIcon icon={faGithub} className="h-4 w-4" />;
  }
  return <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />;
}

export function ProfilePanel(props: {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const { profile, loading, error, onRetry } = props;

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div
        className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center md:text-left"
        role="alert"
      >
        <p className="text-sm text-red-200 dark:text-red-300">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full border border-border px-4 py-2 text-sm text-zinc-200 transition hover:border-accent/50 hover:text-accent"
        >
          重试
        </button>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-col items-center gap-4 md:items-start">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-gradient-to-br from-accent/20 to-transparent text-2xl font-display font-semibold text-accent shadow-[0_0_48px_rgba(139,92,246,0.2)] dark:shadow-[0_0_48px_rgba(167,139,250,0.22)]">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-full w-full rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            (profile.name?.slice(0, 1) ?? '?').toUpperCase()
          )}
        </div>
        <div className="text-center md:text-left">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {profile.name}
          </h1>
          <p className="mt-1 text-sm text-muted">{profile.title}</p>
          <div className="mt-3 flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2 md:justify-start">
            <CategoriesTextLink to="/">Home</CategoriesTextLink>
            <CategoriesTextLink to="/categories">Categories</CategoriesTextLink>
          </div>
        </div>
      </div>
      <p className="text-center text-sm leading-relaxed text-muted md:text-left">
        {profile.bio}
      </p>
      {profile.links && profile.links.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          {profile.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/60 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-accent/40 hover:text-accent dark:text-zinc-200"
            >
              <LinkIcon kind={link.kind} />
              {link.label}
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );
}
