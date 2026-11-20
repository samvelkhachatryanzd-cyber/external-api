import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { apiJson } from './api.js';
import { dateTime } from './format.js';

const TABS = [
  { status: 'new', label: 'Waiting' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
  { status: 'all', label: 'All' },
];

export default function ApplicationsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get('status');
  const status = TABS.some((tab) => tab.status === requestedStatus) ? requestedStatus : 'new';
  const listPage = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setResult(null);
    const query = status === 'all' ? `?page=${listPage}` : `?status=${status}&page=${listPage}`;
    apiJson(`/applications${query}`)
      .then((data) => {
        if (active) {
          setResult(data);
          setError(null);
        }
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [status, listPage]);

  const open = (id) => navigate(`/applications/${id}`, { state: { from: location.search } });
  const showPage = (number) => setSearchParams(number > 1 ? { status, page: number } : { status });
  const pages = result ? Math.max(1, Math.ceil(result.total / result.limit)) : 1;

  return (
    <>
      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            className={tab.status === status ? 'tab active' : 'tab'}
            onClick={() => setSearchParams({ status: tab.status })}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && <p className="error">{error}</p>}
      {!result && !error && <p className="status">Loading...</p>}

      {result && (
        <>
          <p className="status">{result.total} applications</p>
          <table>
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Company number</th>
                <th>Company name</th>
                <th>City</th>
                <th>Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((application) => (
                <tr key={application.id} className="clickable" onClick={() => open(application.id)}>
                  <td>{dateTime(application.createdAt)}</td>
                  <td>{application.companyNumber}</td>
                  <td>{application.companyName}</td>
                  <td>{application.city}</td>
                  <td>{application.contactName}</td>
                  <td>
                    <span className={`badge ${application.status}`}>{application.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pages > 1 && (
            <div className="pager">
              <button type="button" onClick={() => showPage(listPage - 1)} disabled={listPage <= 1}>
                Previous
              </button>
              <span className="status">
                Page {result.page} of {pages}
              </span>
              <button type="button" onClick={() => showPage(listPage + 1)} disabled={listPage >= pages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
