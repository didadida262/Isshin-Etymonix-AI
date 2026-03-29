import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { THEME_STORAGE_KEY } from './theme/theme';
import { ThemeProvider } from './theme/ThemeProvider';

config.autoAddCss = false;

const stored = localStorage.getItem(THEME_STORAGE_KEY);
document.documentElement.classList.toggle('dark', stored !== 'light');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
