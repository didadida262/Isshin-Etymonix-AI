export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'lingua-write-theme';

export const themeAccent = {
  dark: {
    accent: '#a78bfa',
    accentDim: '#8b5cf6',
    glow: 'rgba(167, 139, 250, 0.15)',
  },
  light: {
    accent: '#6366f1',
    accentDim: '#4f46e5',
    glow: 'rgba(99, 102, 241, 0.12)',
  },
} as const;
