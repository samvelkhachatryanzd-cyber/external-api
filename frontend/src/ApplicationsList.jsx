import { useEffect, useState } from 'react';
import { apiJson } from './api.js';
import { dateTime } from './format.js';

const TABS = [
  { status: 'new', label: 'Waiting' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
  { status: 'all', label: 'All' },
];

export default function ApplicationsList({ status, onStatus, onOpen }) {
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setApplications(null);
    apiJson(status === 'all' ? '/applications' : `/applications?status=${status}`)
      .then((data) => {
        if (active) {
          setApplications(data);
          setError(null);
        }
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [status]);

  return (
    <>
      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            className={tab.status === status ? 'tab active' : 'tab'}
            onClick={() => onStatus(tab.status)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && <p className="error">{error}</p>}
      {!applications && !error && <p className="status">Loading...</p>}

      {applications && (
        <>
          <p className="status">{applications.length} applications</p>
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
              {applications.map((application) => (
                <tr key={application.id} className="clickable" onClick={() => onOpen(application.id)}>
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
        </>
      )}
    </>
  );
}
