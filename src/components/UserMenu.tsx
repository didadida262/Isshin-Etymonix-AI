import {
  faRightFromBracket,
  faSpinner,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppLanguage } from '../context/AppLanguageContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';

interface UserMenuProps {
  className?: string;
}

const TRANSLATIONS = {
  zh: {
    account: '账户信息',
    email: '邮箱',
    userId: '用户 ID',
    registered: '注册时间',
    lastLogin: '上次登录',
    signOut: '退出登录',
    menuLabel: '用户菜单',
  },
  en: {
    account: 'Account',
    email: 'Email',
    userId: 'User ID',
    registered: 'Registered',
    lastLogin: 'Last sign-in',
    signOut: 'Sign out',
    menuLabel: 'User menu',
  },
} as const;

function formatDate(value: string | undefined, lang: 'zh' | 'en'): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function UserAvatar({
  size = 'sm',
  className,
}: {
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const dim = size === 'lg' ? 'h-14 w-14' : 'h-9 w-9';
  const icon = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border border-cyan-500/25 bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-indigo-600/20 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.12)]',
        dim,
        className
      )}
    >
      <FontAwesomeIcon icon={faUser} className={icon} />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-zinc-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-zinc-200" title={value}>
        {value}
      </dd>
    </div>
  );
}

export function UserMenu({ className = '' }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const { lang } = useAppLanguage();
  const t = TRANSLATIONS[lang];
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  if (!user) return null;

  const email = user.email ?? '—';
  const userId = user.id;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setOpen(false);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t.menuLabel}
        title={email}
        className={cn(
          'rounded-full transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/60',
          open && 'ring-2 ring-cyan-400/40 ring-offset-2 ring-offset-zinc-950'
        )}
      >
        <UserAvatar />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={t.account}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,280px)] rounded-2xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-md"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
              <UserAvatar size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{t.account}</p>
                <p className="truncate text-xs text-zinc-400" title={email}>
                  {email}
                </p>
              </div>
            </div>

            <dl className="mt-3 space-y-2.5">
              <DetailRow label={t.email} value={email} />
              <DetailRow label={t.userId} value={userId} />
              <DetailRow
                label={t.registered}
                value={formatDate(user.created_at, lang)}
              />
              <DetailRow
                label={t.lastLogin}
                value={formatDate(user.last_sign_in_at, lang)}
              />
            </dl>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition-colors hover:border-red-500/40 hover:bg-red-500/15 disabled:opacity-60"
            >
              <FontAwesomeIcon
                icon={signingOut ? faSpinner : faRightFromBracket}
                spin={signingOut}
                className="h-3.5 w-3.5"
              />
              {t.signOut}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
