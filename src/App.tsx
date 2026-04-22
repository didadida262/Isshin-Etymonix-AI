import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { RootBombardPage } from './pages/RootBombardPage';
import { BombardModule, getMockWords } from './pages/BombardModule';

function BombardWrapper() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/" element={<RootBombardPage onStartBombard={(id) => navigate(`/bombard/${id}`)} />} />
      <Route
        path="/bombard/:id"
        element={
          <BombardModuleWrapper />
        }
      />
    </Routes>
  );
}

function BombardModuleWrapper() {
  const { id } = useParams();
  const unitId = parseInt(id || '1');
  return <BombardModule unitId={unitId} words={getMockWords(unitId)} />;
}

export default function App() {
  return <BombardWrapper />;
}