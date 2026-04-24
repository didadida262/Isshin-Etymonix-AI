import { useEffect, useState } from 'react';
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

  if (page === 'bombard') {
    return <BombardPage onBack={() => navigateTo('home')} unitId={unitId} />;
  }

  return <RootBombardPage onStartBombard={(id) => { setUnitId(id); navigateTo('bombard', id); }} />;
}
