let inMemoryToken: string | null = null;
const STORAGE_KEY = 'auth_token';

export function setToken(token: string | null) {
  inMemoryToken = token;
  if (token) {
    try { localStorage.setItem(STORAGE_KEY, token); } catch (_) {}
  } else {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }
  // notify application of auth changes
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: { token } }));
}

export function getToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    inMemoryToken = t;
    return t;
  } catch (_) {
    return null;
  }
}

export function clearToken() {
  setToken(null);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function authHeaders(existing?: Record<string, string> | HeadersInit): HeadersInit {
  const token = getToken();
  const base: Record<string, string> = {};
  if (token) base['Authorization'] = `Bearer ${token}`;
  if (!existing) return base;
  // merge existing headers (string map or Headers)
  if (existing instanceof Headers) {
    const h = new Headers(existing);
    Object.entries(base).forEach(([k, v]) => h.set(k, v));
    return h;
  }
  return { ...(existing as Record<string, string>), ...base };
}

export default {
  setToken,
  getToken,
  clearToken,
  isAuthenticated,
  authHeaders,
};
