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

/**
 * @param {{ children: React.ReactNode, onLogout?: () => void }} props
 */
export function SessionProvider({ children, onLogout, initialLogin = null }) {
  const [session, setSession] = useState(
    initialLogin
      ? {
          email: initialLogin.email,
          userId: initialLogin.userId,
          tenantId: initialLogin.tenantId,
          role: initialLogin.role,
          capabilities: initialLogin.capabilities || DEFAULT_CAPS,
        }
      : null
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
        throw new Error(await res.text());
      }
      const data = await res.json();
      setSession({
        email: data.email,
        userId: data.userId,
        tenantId: data.tenantId,
        role: data.role,
        planId: data.planId,
        capabilities: data.capabilities || DEFAULT_CAPS,
      });
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
    setSession({
      email: loginPayload.email,
      userId: loginPayload.userId,
      tenantId: loginPayload.tenantId,
      role: loginPayload.role,
      capabilities: loginPayload.capabilities || DEFAULT_CAPS,
    });
    setLoading(false);
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
