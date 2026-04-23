import { useEffect, useState } from 'react';
import { BombardPage } from './pages/BombardPage';
import { RootBombardPage } from './pages/RootBombardPage';

function getPageFromHash(): 'home' | 'bombard' {
  const hash = window.location.hash.replace('#', '');
  return hash === 'bombard' ? 'bombard' : 'home';
}

function navigateTo(page: 'home' | 'bombard') {
  if (page === 'bombard') {
    window.location.hash = 'bombard';
  } else {
    window.location.hash = '';
  }
}

export default function App() {
  const [page, setPage] = useState<'home' | 'bombard'>(() => getPageFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPageFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (page === 'bombard') {
    return <BombardPage onBack={() => navigateTo('home')} />;
  }

  return <RootBombardPage onStartBombard={() => navigateTo('bombard')} />;
}
