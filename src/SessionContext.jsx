import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, clearToken } from "./api.js";

const SessionContext = createContext(null);

const DEFAULT_CAPS = {
  role: "viewer",
  canExecute: false,
  canWrite: false,
  canManageUsers: false,
  canViewCursorKeys: false,
  usersUsed: 0,
  usersMax: 5,
  canAddUser: false,
};

function buildSession(data) {
  return {
    email: data.email,
    userId: data.userId,
    tenantId: data.tenantId,
    tenantName: data.tenantName || "",
    role: data.role,
    planId: data.planId,
    tutorialPending: Boolean(data.tutorialPending),
    mustChangePassword: Boolean(data.mustChangePassword),
    capabilities: data.capabilities || DEFAULT_CAPS,
  };
}

/**
 * @param {{ children: React.ReactNode, onLogout?: () => void }} props
 */
export function SessionProvider({ children, onLogout, initialLogin = null }) {
  const [session, setSession] = useState(
    initialLogin ? buildSession(initialLogin) : null
  );
  const [loading, setLoading] = useState(!initialLogin);
  const [error, setError] = useState(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch("/api/auth/me");
      if (!res.ok) {
        if (res.status === 401) {
          clearToken();
          onLogout?.();
          return;
        }
        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          if (data.code === "tenant_blocked") {
            clearToken();
            onLogout?.();
            return;
          }
        }
        throw new Error(await res.text());
      }
      const data = await res.json();
      setSession(buildSession(data));
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    if (!initialLogin) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [refresh, initialLogin]);

  useEffect(() => {
    apiFetch("/admin/tenants")
      .then((res) => setIsPlatformAdmin(res.ok))
      .catch(() => setIsPlatformAdmin(false));
  }, [session?.email]);

  const setFromLogin = useCallback((loginPayload) => {
    setSession(buildSession(loginPayload));
    setLoading(false);
  }, []);

  const completeTutorial = useCallback(async () => {
    const res = await apiFetch("/api/auth/tutorial/complete", { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || res.statusText);
    }
    setSession((prev) => (prev ? { ...prev, tutorialPending: false } : prev));
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        capabilities: session?.capabilities ?? DEFAULT_CAPS,
        loading,
        error,
        refresh,
        setFromLogin,
        completeTutorial,
        isPlatformAdmin,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession fora de SessionProvider");
  }
  return ctx;
}

export function useCapabilities() {
  return useSession().capabilities;
}
