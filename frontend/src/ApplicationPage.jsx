import { useEffect, useState } from 'react';
import { apiJson } from './api.js';
import { dateTime } from './format.js';

const REGISTER_URL = 'https://find-and-update.company-information.service.gov.uk/company/';

export default function ApplicationPage({ id, onBack }) {
  const [application, setApplication] = useState(null);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiJson(`/applications/${id}`)
      .then((data) => {
        setApplication(data);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  async function decide(action, body) {
    setSaving(true);
    try {
      setApplication(
        await apiJson(`/applications/${id}/${action}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
      );
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function reject(event) {
    event.preventDefault();
    decide('reject', { note });
  }

  if (!application) return <p className="status">{error || 'Loading...'}</p>;

  return (
    <>
      <p>
        <button type="button" className="link" onClick={onBack}>
          Back to all applications
        </button>
      </p>

      <section className="card">
        <h2>
          {application.companyName} <span className={`badge ${application.status}`}>{application.status}</span>
        </h2>
        <dl>
          <dt>Company number</dt>
          <dd>{application.companyNumber}</dd>
          <dt>Registered office</dt>
          <dd>
            {[application.addressLine1, application.addressLine2, application.city, application.postcode]
              .filter(Boolean)
              .join(', ')}
          </dd>
          <dt>Contact</dt>
          <dd>
            {application.contactName}, {application.contactEmail}
          </dd>
          <dt>Submitted</dt>
          <dd>{dateTime(application.createdAt)}</dd>
          {application.decidedAt && (
            <>
              <dt>Decided</dt>
              <dd>{dateTime(application.decidedAt)}</dd>
            </>
          )}
          {application.decisionNote && (
            <>
              <dt>Note</dt>
              <dd>{application.decisionNote}</dd>
            </>
          )}
        </dl>
        <p>
          <a href={REGISTER_URL + encodeURIComponent(application.companyNumber)} target="_blank" rel="noreferrer">
            Look up on Companies House
          </a>
        </p>
      </section>

      {error && <p className="error">{error}</p>}

      {application.status === 'new' && (
        <section className="card row">
          <button type="button" onClick={() => decide('approve')} disabled={saving}>
            Approve
          </button>
          <form onSubmit={reject} className="row">
            <label>
              Reason for rejecting
              <input name="note" value={note} onChange={(e) => setNote(e.target.value)} required maxLength={500} />
            </label>
            <button type="submit" className="danger" disabled={saving}>
              Reject
            </button>
          </form>
        </section>
      )}
    </>
  );
}
