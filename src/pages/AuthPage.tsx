import { faEye, faEyeSlash, faGlobe, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, type FormEvent, type ReactNode } from 'react';
import { AuthThemeCard } from '../components/AuthThemeCard';
import { ParticleBackdrop } from '../components/ParticleBackdrop';
import { SiteBrand } from '../components/SiteBrand';
import { useAppLanguage, type AppLanguage } from '../context/AppLanguageContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';

type AuthMode = 'login' | 'register';

const COPY = {
  zh: {
    brand: 'Isshin 英文词根斩',
    login: '登录',
    register: '注册',
    email: '邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    submitLogin: '登录',
    submitRegister: '创建账号',
    switchToRegister: '还没有账号？注册',
    switchToLogin: '已有账号？登录',
    emailConfirm: '注册成功，请查收邮件并点击确认链接后再登录。',
    passwordMismatch: '两次输入的密码不一致',
    passwordTooShort: '密码至少 6 位',
    emailRequired: '请填写邮箱',
    configMissing: 'Supabase 未配置',
    configHint: '请在 .env 中设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY',
    lang: 'EN',
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
    authInvalidCredentials: '邮箱或密码错误',
    authEmailTaken: '该邮箱已被注册',
    authPasswordShort: '密码至少 6 位',
    authEmailDisabled: 'Supabase 未开启邮箱注册，请在控制台 Authentication → Sign In / Providers → Email 中开启',
  },
  en: {
    brand: 'Isshin English Root Zhan',
    login: 'Sign in',
    register: 'Sign up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    submitLogin: 'Sign in',
    submitRegister: 'Create account',
    switchToRegister: 'No account? Sign up',
    switchToLogin: 'Already have an account? Sign in',
    emailConfirm: 'Check your email and confirm your account before signing in.',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    emailRequired: 'Email is required',
    configMissing: 'Supabase is not configured',
    configHint: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
    lang: '中',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    authInvalidCredentials: 'Invalid email or password',
    authEmailTaken: 'This email is already registered',
    authPasswordShort: 'Password must be at least 6 characters',
    authEmailDisabled:
      'Email signups are disabled in Supabase. Enable Email under Sign In / Providers.',
  },
} as const;

const inputClass =
  'w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-cyan-400/50 focus:bg-black/35 focus:ring-1 focus:ring-cyan-400/25 focus:shadow-[0_0_20px_-8px_rgba(34,211,238,0.45)]';

function localizeAuthError(message: string, lang: AppLanguage): string {
  if (lang === 'en') return message;
  const t = COPY.zh;
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid email or password')) {
    return t.authInvalidCredentials;
  }
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return t.authEmailTaken;
  }
  if (lower.includes('password')) {
    return t.authPasswordShort;
  }
  if (lower.includes('email signups are disabled') || lower.includes('email_provider_disabled')) {
    return t.authEmailDisabled;
  }
  return message;
}

function LangToggleButton() {
  const { lang, toggleLang } = useAppLanguage();
  const t = COPY[lang];

  return (
    <button
      type="button"
      onClick={toggleLang}
      title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
      aria-label={lang === 'zh' ? `Switch to English (${t.lang})` : `切换到中文 (${t.lang})`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 backdrop-blur-md transition-colors hover:border-cyan-500/30 hover:bg-white/10 hover:text-cyan-300"
    >
      <FontAwesomeIcon icon={faGlobe} className="h-4 w-4 text-cyan-400" />
    </button>
  );
}

export function AuthPage() {
  const { lang } = useAppLanguage();
  const t = COPY[lang];
  const { signIn, signUp, configured } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const resetMessages = () => {
    setError('');
    setInfo('');
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    resetMessages();
    setConfirmPassword('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t.emailRequired);
      return;
    }
    if (password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(trimmedEmail, password);
        if (signInError) {
          setError(localizeAuthError(signInError, lang));
        }
      } else {
        const { error: signUpError, needsEmailConfirmation } = await signUp(
          trimmedEmail,
          password
        );
        if (signUpError) {
          setError(localizeAuthError(signUpError, lang));
        } else if (needsEmailConfirmation) {
          setInfo(t.emailConfirm);
          switchMode('login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const pageShell = (content: ReactNode) => (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <ParticleBackdrop />
      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <LangToggleButton />
      </div>
      <div className="relative z-10 w-full max-w-md">{content}</div>
    </div>
  );

  if (!configured) {
    return pageShell(
      <AuthThemeCard className="p-8 text-center">
        <h1 className="text-lg font-semibold text-white">{t.configMissing}</h1>
        <p className="mt-3 text-sm text-zinc-400">{t.configHint}</p>
      </AuthThemeCard>
    );
  }

  return pageShell(
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mb-8 flex justify-center">
        <SiteBrand title={t.brand} logoSize={52} />
      </div>

      <AuthThemeCard className="p-6 sm:p-8">
        <div className="mb-6 flex rounded-xl border border-white/10 bg-black/20 p-1 backdrop-blur-sm">
          {(['login', 'register'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => switchMode(tab)}
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300',
                mode === tab
                  ? 'border border-cyan-400/35 bg-gradient-to-b from-zinc-700/90 via-zinc-900/95 to-black text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_-8px_rgba(34,211,238,0.35)]'
                  : 'border border-transparent text-zinc-500 hover:text-zinc-200'
              )}
            >
              {tab === 'login' ? t.login : t.register}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-400">{t.email}</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-400">{t.password}</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(inputClass, 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-zinc-500 transition-colors hover:text-cyan-300"
                aria-label={showPassword ? t.hidePassword : t.showPassword}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-4 w-4" />
              </button>
            </div>
          </label>

          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.label
                key="confirm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="block overflow-hidden"
              >
                <span className="mb-1.5 block text-sm font-medium text-zinc-400">
                  {t.confirmPassword}
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </motion.label>
            )}
          </AnimatePresence>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-3 py-2 text-sm text-cyan-200">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'group flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-300',
              'border-zinc-600/90 bg-gradient-to-b from-zinc-700/95 via-zinc-900 to-black text-zinc-100',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-12px_24px_-12px_rgba(0,0,0,0.5)]',
              'hover:border-cyan-500/25 hover:text-cyan-50 hover:animate-lightning-rim',
              'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:animate-none'
            )}
          >
            {loading && <FontAwesomeIcon icon={faSpinner} spin className="h-4 w-4 text-cyan-400" />}
            {mode === 'login' ? t.submitLogin : t.submitRegister}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="text-cyan-400 transition-colors hover:text-cyan-200"
            >
              {t.switchToRegister}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-cyan-400 transition-colors hover:text-cyan-200"
            >
              {t.switchToLogin}
            </button>
          )}
        </p>
      </AuthThemeCard>
    </motion.div>
  );
}
