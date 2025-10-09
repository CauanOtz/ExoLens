import type { Exoplanet } from '../types/exoplanet';
import type { ViewPrediction } from '../types/prediction';
import authService from './authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

function buildUrl(path: string) {
  if (!API_BASE) return path;
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

async function fetchWithAuth(path: string, options?: RequestInit) {
  const url = path.startsWith('http') ? path : buildUrl(path);
  const headers = authService.authHeaders(options?.headers as any);
  const opts = { ...(options || {}), headers } as RequestInit;
  return fetch(url, opts);
}

export async function fetchExoplanets(): Promise<Exoplanet[]> {
  let response: Response;
  try {
    response = await fetchWithAuth(buildUrl('/api/exoplanets'));
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
  const response = await fetchWithAuth(buildUrl(`/api/exoplanets/${encodeURIComponent(id)}`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
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

export type PredictionResponse = {
  finalProbability: number;
  featureContributions: {
    contribuicoes: number[];
    features: string[];
  };
  inputData?: any;
};

/**
 * Send a CSV (string) to the backend prediction endpoint and receive explainable output.
 * The backend endpoint is expected at /api/predictions/predict/csv?isRealData=true
 */
export async function predictFromCsv(
  csvString: string,
  isRealData = true,
  meta?: Record<string, string | number | boolean | null | undefined>
): Promise<PredictionResponse[]> {
  const qs = isRealData ? '?isRealData=true' : '';
  const url = buildUrl(`/api/predictions/predict/csv${qs}`);
  let res: Response;
  try {
    // The backend expects a multipart/form-data upload with field 'predictionFile' (multer).
    // Create a Blob/File and send as FormData so multer picks it up.
    const form = new FormData();
    const blob = new Blob([csvString], { type: 'text/csv' });
    // filename 'predictions.csv' is arbitrary
    form.append('predictionFile', blob, 'predictions.csv');
    // Append optional meta fields (e.g., kepid) so backend can log/associate the run
    if (meta) {
      for (const [k, v] of Object.entries(meta)) {
        if (v !== undefined) form.append(k, v === null ? '' : String(v));
      }
    }

    // Use fetchWithAuth so Authorization header is included. Do NOT set Content-Type; browser will add boundary.
    res = await fetchWithAuth(url, {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
  } catch (err: any) {
    const msg = `Network error calling prediction endpoint: ${err?.message ?? err}`;
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: msg } }));
    throw err;
  }

  if (!res.ok) {
    let message = `Prediction endpoint returned ${res.status}`;
    try {
      const j = await res.json();
      if (j?.message) message = j.message;
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message } }));
    throw new Error(message);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Unexpected response content-type from prediction endpoint: ${contentType}. Snippet: ${text.slice(0, 512)}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? (data as PredictionResponse[]) : [];
}

// Add registerPrediction so TransitPage can import it
export async function registerPrediction(payload: any): Promise<any> {
  const url = buildUrl('/api/predictions/register');
  let res: Response;
  try {
    res = await fetchWithAuth(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    const msg = `Network error registering prediction: ${err?.message ?? err}`;
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: msg } }));
    throw err;
  }

  if (!res.ok) {
    let message = `Register endpoint returned ${res.status}`;
    try {
      const j = await res.json();
      if (j?.message) message = j.message;
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message } }));
    throw new Error(message);
  }

  const data = await res.json();
  window.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Prediction registered' } }));
  return data;
}

// New: list and delete predictions for current user
export async function listMyPredictions(): Promise<ViewPrediction[]> {
  const res = await fetchWithAuth(buildUrl('/api/predictions'), { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to list predictions: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data as ViewPrediction[] : [];
}

export async function deletePrediction(id: string): Promise<void> {
  const res = await fetchWithAuth(buildUrl(`/api/predictions/${encodeURIComponent(id)}`), { method: 'DELETE', credentials: 'include' });
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete prediction: ${res.status}`);
}
