import { useEffect, useState } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { AuthLoadingScreen } from './components/AuthLoadingScreen';
import { useAuth } from './context/AuthContext';
import { GameSessionProvider } from './context/GameSessionContext';
import { LlmSettingsProvider } from './context/LlmSettingsContext';
import { SettingsModalProvider } from './context/SettingsModalContext';
import { AuthPage } from './pages/AuthPage';
import { BombardPage } from './pages/BombardPage';
import { RootBombardPage } from './pages/RootBombardPage';

function getPageFromHash(): 'home' | 'bombard' {
  const hash = window.location.hash.replace('#', '');
  // 支持 #bombard 或 #bombard?unit=1 格式
  return hash.startsWith('bombard') ? 'bombard' : 'home';
}

function getUnitIdFromHash(): number {
  const hash = window.location.hash;
  const match = hash.match(/unit=(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

function navigateTo(page: 'home' | 'bombard', unitId?: number) {
  if (page === 'bombard' && unitId) {
    window.location.hash = `bombard?unit=${unitId}`;
  } else if (page === 'bombard') {
    window.location.hash = 'bombard';
  } else {
    window.location.hash = '';
  }
}

export default function App() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<'home' | 'bombard'>(() => getPageFromHash());
  const [unitId, setUnitId] = useState<number>(() => getUnitIdFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPageFromHash());
      setUnitId(getUnitIdFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <LlmSettingsProvider>
        <SettingsModalProvider>
          {page === 'bombard' ? (
            <GameSessionProvider>
              <BombardPage onBack={() => navigateTo('home')} unitId={unitId} />
              <ChatPanel />
            </GameSessionProvider>
          ) : (
            <>
              <RootBombardPage onStartBombard={(id) => { setUnitId(id); navigateTo('bombard', id); }} />
              <ChatPanel />
            </>
          )}
        </SettingsModalProvider>
    </LlmSettingsProvider>
  );
}
