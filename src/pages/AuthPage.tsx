import { faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { AmbientBackdrop } from '../components/AmbientBackdrop';
import { SiteBrand } from '../components/SiteBrand';
import { useAppLanguage } from '../context/AppLanguageContext';
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
  },
} as const;

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
          setError(signInError);
        }
      } else {
        const { error: signUpError, needsEmailConfirmation } = await signUp(
          trimmedEmail,
          password
        );
        if (signUpError) {
          setError(signUpError);
        } else if (needsEmailConfirmation) {
          setInfo(t.emailConfirm);
          switchMode('login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <AmbientBackdrop />
        <div className="relative z-10 max-w-md rounded-2xl border border-white/10 bg-zinc-950/80 p-8 text-center backdrop-blur-xl">
          <h1 className="text-lg font-semibold text-white">{t.configMissing}</h1>
          <p className="mt-3 text-sm text-zinc-400">{t.configHint}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <AmbientBackdrop />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <SiteBrand title={t.brand} logoSize={48} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchMode(tab)}
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  mode === tab
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {tab === 'login' ? t.login : t.register}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">{t.email}</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">{t.password}</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 pr-10 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-zinc-500 hover:text-zinc-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  <span className="mb-1.5 block text-sm text-zinc-400">{t.confirmPassword}</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30"
                  />
                </motion.label>
              )}
            </AnimatePresence>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <FontAwesomeIcon icon={faSpinner} spin className="h-4 w-4" />}
              {mode === 'login' ? t.submitLogin : t.submitRegister}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-500">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-cyan-400 hover:text-cyan-300"
              >
                {t.switchToRegister}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-cyan-400 hover:text-cyan-300"
              >
                {t.switchToLogin}
              </button>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
