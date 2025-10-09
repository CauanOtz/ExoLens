import type { Exoplanet } from '../types/exoplanet';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

function buildUrl(path: string) {
  if (!API_BASE) return path;
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

export async function fetchExoplanets(): Promise<Exoplanet[]> {
  let response: Response;
  try {
    response = await fetch(buildUrl('/api/exoplanets'));
  } catch (err: any) {
    const msg = `Network error loading exoplanets: ${err?.message ?? err}`;
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: msg } }));
    throw err;
  }
  if (!response.ok) {
    const msg = `Failed to load exoplanets: ${response.status}`;
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: msg } }));
    throw new Error(msg);
  }
  const contentType = response.headers.get('content-type') || '';
  // If the server returned HTML (often an index.html or an error page) flag it clearly
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    // keep returned HTML truncated to avoid huge messages
    const snippet = text.slice(0, 512).replace(/\s+/g, ' ');
    throw new Error(`Unexpected response content-type: ${contentType || 'unknown'}. Response snippet: ${snippet}`);
  }
  const data = await response.json();
  // no notify for successful fetch by default
  return Array.isArray(data) ? data : [];
}

export async function saveExoplanetPrediction(id: string): Promise<void> {
  const response = await fetch(buildUrl(`/api/exoplanets/${encodeURIComponent(id)}`), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let message = 'Unable to save prediction';
    try {
      const errorData = await response.json();
      if (typeof errorData?.message === 'string') {
        message = errorData.message;
      }
    } catch (_) {
      // ignore JSON parse errors
    }
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message } }));
    throw new Error(message);
  }
  window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Prediction saved' } }));
}
