export async function apiJson(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`/api${path}`, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data && data.error ? data.error : `Request failed with status ${response.status}`;
    const details = data && Array.isArray(data.details) ? `: ${data.details.join(', ')}` : '';
    throw new Error(message + details);
  }
  return data;
}
