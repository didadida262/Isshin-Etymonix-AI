/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        border: 'var(--color-border)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        'accent-dim': 'var(--color-accent-dim)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-dark':
          'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'grid-light':
          'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)',
      },
      animation: {
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        /** 卡片 hover：斜向高光只扫一次 */
        'sheen-sweep-once': 'sheen-sweep-once 0.72s cubic-bezier(0.33, 1, 0.68, 1) 1 both',
        /** 慢移、小幅，减轻网格眩晕感 */
        'grid-drift': 'grid-drift 180s linear infinite',
        'orb-1': 'orb-1 48s ease-in-out infinite',
        'orb-2': 'orb-2 56s ease-in-out infinite',
        'orb-3': 'orb-3 64s ease-in-out infinite',
        sheen: 'sheen 14s ease-in-out infinite',
        /** 主按钮 hover：边缘电光沿轮廓跳变 */
        'lightning-rim': 'lightning-rim 0.44s steps(8, jump-end) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'sheen-sweep-once': {
          '0%': { backgroundPosition: '-200% 0', opacity: '0' },
          '12%': { opacity: '1' },
          '88%': { opacity: '1' },
          '100%': { backgroundPosition: '200% 0', opacity: '0' },
        },
        'grid-drift': {
          '0%': { backgroundPosition: '0 0, 0 0' },
          '100%': { backgroundPosition: '24px 24px, 24px 24px' },
        },
        /** 多段缓移，避免 50% 硬折返带来的晃动感 */
        'orb-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(2.5%, -1.5%) scale(1.015)' },
          '50%': { transform: 'translate(4%, 1%) scale(1.02)' },
          '75%': { transform: 'translate(1.5%, 2%) scale(1.01)' },
        },
        'orb-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(-3%, 2%) scale(1.02)' },
          '50%': { transform: 'translate(-5%, -1%) scale(1.015)' },
          '75%': { transform: 'translate(-1.5%, -2.5%) scale(1.01)' },
        },
        'orb-3': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(2%, 3%) scale(1.02)' },
          '50%': { transform: 'translate(-2.5%, 2%) scale(1.018)' },
          '75%': { transform: 'translate(1%, -1.5%) scale(1.012)' },
        },
        sheen: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.85' },
        },
        'lightning-rim': {
          '0%': {
            boxShadow:
              '0 -4px 18px -3px rgba(34,211,238,0.75), 0 0 0 1px rgba(34,211,238,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
          },
          '12.5%': {
            boxShadow:
              '5px -3px 16px -3px rgba(192,132,252,0.72), 0 0 0 1px rgba(167,139,250,0.32), inset 0 1px 0 rgba(255,255,255,0.06)',
          },
          '25%': {
            boxShadow:
              '6px 0 18px -3px rgba(34,211,238,0.7), 0 0 0 1px rgba(34,211,238,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
          },
          '37.5%': {
            boxShadow:
              '4px 5px 16px -3px rgba(192,132,252,0.68), 0 0 0 1px rgba(192,132,252,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
          },
          '50%': {
            boxShadow:
              '0 6px 18px -3px rgba(34,211,238,0.72), 0 0 0 1px rgba(34,211,238,0.32), inset 0 1px 0 rgba(255,255,255,0.06)',
          },
          '62.5%': {
            boxShadow:
              '-5px 4px 16px -3px rgba(167,139,250,0.7), 0 0 0 1px rgba(167,139,250,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
          },
          '75%': {
            boxShadow:
              '-6px 0 18px -3px rgba(34,211,238,0.7), 0 0 0 1px rgba(34,211,238,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
          },
          '87.5%': {
            boxShadow:
              '-4px -5px 16px -3px rgba(192,132,252,0.68), 0 0 0 1px rgba(192,132,252,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
          },
          '100%': {
            boxShadow:
              '0 -4px 18px -3px rgba(34,211,238,0.75), 0 0 0 1px rgba(34,211,238,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
          },
        },
      },
    },
  },
  plugins: [],
};
