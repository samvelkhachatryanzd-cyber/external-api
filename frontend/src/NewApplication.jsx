import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { apiJson } from './api.js';

const FIELDS = [
  { name: 'companyNumber', label: 'Company number' },
  { name: 'companyName', label: 'Company name' },
  { name: 'addressLine1', label: 'Address line 1' },
  { name: 'addressLine2', label: 'Address line 2', optional: true },
  { name: 'city', label: 'City' },
  { name: 'postcode', label: 'Postcode' },
  { name: 'contactName', label: 'Contact name' },
  { name: 'contactEmail', label: 'Contact email', type: 'email' },
];

export default function NewApplication() {
  const navigate = useNavigate();
  const from = useLocation().state?.from || '';
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((field) => [field.name, ''])));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const application = await apiJson('/applications', { method: 'POST', body: JSON.stringify(form) });
      navigate(`/applications/${application.id}`, { replace: true, state: { from } });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <>
      <p>
        <Link to={`/applications${from}`}>Back to all applications</Link>
      </p>
      <form onSubmit={submit} className="card">
        <h2>New application</h2>
        <div className="fields">
          {FIELDS.map((field) => (
            <label key={field.name}>
              {field.label}
              {field.optional ? ' (optional)' : ''}
              <input
                name={field.name}
                type={field.type || 'text'}
                value={form[field.name]}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                required={!field.optional}
              />
            </label>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? 'Submitting...' : 'Submit application'}
        </button>
      </form>
    </>
  );
}
