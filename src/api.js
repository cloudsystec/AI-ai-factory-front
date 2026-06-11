const TOKEN_KEY = "ai-factory-token";

/**
 * Ordem: runtime-config.js (Docker/Railway) → build VITE_API_URL → dev proxy → URLs relativas.
 */
function resolveApiBase() {
  if (typeof window !== "undefined") {
    const runtime = window.__RUNTIME_CONFIG__?.apiUrl;
    if (typeof runtime === "string" && runtime.trim()) {
      return runtime.trim().replace(/\/$/, "");
    }
  }
  const built = import.meta.env.VITE_API_URL?.trim();
  if (built) return built.replace(/\/$/, "");
  if (import.meta.env.DEV) return "";
  return "";
}

const API_BASE = resolveApiBase();

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

let tenantBlockedHandled = false;

export function handleTenantBlocked() {
  if (typeof window === "undefined") return;
  if (tenantBlockedHandled) return;
  tenantBlockedHandled = true;
  clearToken();
  window.location.replace("/login?blocked=1");
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
  if (res.status === 403) {
    try {
      const data = await res.clone().json();
      if (data?.code === "tenant_blocked") {
        handleTenantBlocked();
      }
    } catch {
      /* ignore */
    }
  }
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
