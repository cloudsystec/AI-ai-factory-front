const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "" : "http://localhost:4000");

const TOKEN_KEY = "ai-factory-token";

export function getApiBase() {
  return API_BASE;
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return Boolean(getToken());
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 */
export async function apiFetch(path, init = {}) {
  const headers = {
    ...(init.headers || {}),
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  return res;
}

/**
 * @param {string} jobId
 */
export function jobEventsUrl(jobId) {
  const token = getToken();
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  const base = API_BASE || "";
  return `${base}/api/jobs/${jobId}/events${q}`;
}
