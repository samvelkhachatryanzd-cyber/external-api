import { useState } from 'react';
import ApplicationPage from './ApplicationPage.jsx';
import ApplicationsList from './ApplicationsList.jsx';
import NewApplication from './NewApplication.jsx';

export default function App() {
  const [page, setPage] = useState({ name: 'list', status: 'new' });

  const showList = () => setPage({ name: 'list', status: page.status || 'new' });
  const open = (id) => setPage({ name: 'application', id, status: page.status });

  return (
    <main>
      <header>
        <h1>Business onboarding</h1>
        {page.name === 'list' && (
          <button type="button" onClick={() => setPage({ name: 'new', status: page.status })}>
            New application
          </button>
        )}
      </header>
      {page.name === 'list' && (
        <ApplicationsList status={page.status} onStatus={(status) => setPage({ name: 'list', status })} onOpen={open} />
      )}
      {page.name === 'application' && <ApplicationPage id={page.id} onBack={showList} />}
      {page.name === 'new' && <NewApplication onCreated={open} onCancel={showList} />}
    </main>
  );
}
