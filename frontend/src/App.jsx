import { Navigate, Route, Routes, useLocation, useMatch, useNavigate } from 'react-router';
import ApplicationPage from './ApplicationPage.jsx';
import ApplicationsList from './ApplicationsList.jsx';
import NewApplication from './NewApplication.jsx';
import NotFound from './NotFound.jsx';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const onList = useMatch('/applications') !== null;

  return (
    <main>
      <header>
        <h1>Business onboarding</h1>
        {onList && (
          <button type="button" onClick={() => navigate('/applications/new', { state: { from: location.search } })}>
            New application
          </button>
        )}
      </header>
      <Routes>
        <Route path="/" element={<Navigate to="/applications" replace />} />
        <Route path="/applications" element={<ApplicationsList />} />
        <Route path="/applications/new" element={<NewApplication />} />
        <Route path="/applications/:id" element={<ApplicationPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  );
}
