import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { apiJson } from './api.js';
import { dateTime } from './format.js';

const REGISTER_URL = 'https://find-and-update.company-information.service.gov.uk/company/';

const FIELD_LABELS = {
  companyNumber: 'Company number',
  companyName: 'Company name',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  city: 'City',
  postcode: 'Postcode',
  status: 'Company status',
};

function shown(value) {
  return value === null || value === undefined ? '(empty)' : `"${value}"`;
}

function warningText({ field, applicant, register }) {
  const label = FIELD_LABELS[field] || field;
  if (field === 'status') return `${label} is ${shown(register)} on Companies House, not "active"`;
  return `${label} does not match: the application has ${shown(applicant)}, Companies House has ${shown(register)}`;
}

export default function ApplicationPage() {
  const { id } = useParams();
  const listUrl = `/applications${useLocation().state?.from || ''}`;
  const [application, setApplication] = useState(null);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState(null);

  useEffect(() => {
    setComparison(null);
    setCompareError(null);
    apiJson(`/applications/${id}`)
      .then((data) => {
        setApplication(data);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  async function compare() {
    setComparing(true);
    setComparison(null);
    setCompareError(null);
    try {
      setComparison(await apiJson(`/applications/${id}/compare`));
    } catch (err) {
      setCompareError(err.message);
    } finally {
      setComparing(false);
    }
  }

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
        <Link to={listUrl}>Back to all applications</Link>
      </p>

      <section className="card">
        <h2>
          {application.companyName} <span className={`badge ${application.status}`}>{application.status}</span>
        </h2>
        <div className={comparison ? 'columns' : undefined}>
        <div>
        {comparison && <h3>Application</h3>}
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
        </div>
        {comparison && (
          <div>
            <h3>Companies House</h3>
            <dl>
              <dt>Company number</dt>
              <dd>{comparison.company.number}</dd>
              <dt>Company name</dt>
              <dd>{comparison.company.name}</dd>
              <dt>Status</dt>
              <dd>{comparison.company.status}</dd>
              <dt>Type</dt>
              <dd>{comparison.company.type}</dd>
              <dt>Created</dt>
              <dd>{comparison.company.dateOfCreation}</dd>
              <dt>Registered office</dt>
              <dd>
                {[
                  comparison.company.registeredOffice.addressLine1,
                  comparison.company.registeredOffice.addressLine2,
                  comparison.company.registeredOffice.city,
                  comparison.company.registeredOffice.region,
                  comparison.company.registeredOffice.postcode,
                  comparison.company.registeredOffice.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </dd>
              <dt>Current directors</dt>
              <dd>
                {comparison.company.directors.length ? (
                  <ul className="plain">
                    {comparison.company.directors.map((director, index) => (
                      <li key={index}>
                        {director.name}
                        {director.appointedOn ? ` (appointed ${director.appointedOn})` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  'None'
                )}
              </dd>
            </dl>
          </div>
        )}
        </div>
        <p>
          <a href={REGISTER_URL + encodeURIComponent(application.companyNumber)} target="_blank" rel="noreferrer">
            Look up on Companies House
          </a>
        </p>
        {application.status === 'new' && (
          <p>
            <button type="button" onClick={compare} disabled={comparing}>
              {comparing ? 'Comparing...' : 'Compare'}
            </button>
          </p>
        )}
        {compareError && <p className="error">{compareError}</p>}
        {comparison &&
          (comparison.mismatches.length ? (
            <ul className="warnings">
              {comparison.mismatches.map((mismatch) => (
                <li key={mismatch.field}>{warningText(mismatch)}</li>
              ))}
            </ul>
          ) : (
            <p className="status">Everything matches the register.</p>
          ))}
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
