import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppLanguageProvider } from './context/AppLanguageContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';

config.autoAddCss = false;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppLanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppLanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);
