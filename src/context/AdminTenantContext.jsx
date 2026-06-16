import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "../api.js";

const STORAGE_KEY = "admin-selected-tenant-id";

const AdminTenantContext = createContext(null);

export function AdminTenantProvider({ children }) {
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantIdState] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setTenantId = useCallback((id) => {
    setTenantIdState(id);
    try {
      if (id) sessionStorage.setItem(STORAGE_KEY, id);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/tenants");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = data.tenants || [];
      setTenants(list);
      setTenantIdState((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev;
        const stored = (() => {
          try {
            return sessionStorage.getItem(STORAGE_KEY) || "";
          } catch {
            return "";
          }
        })();
        if (stored && list.some((t) => t.id === stored)) return stored;
        return list[0]?.id || "";
      });
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const selectedTenant = useMemo(
    () => tenants.find((t) => t.id === tenantId) || null,
    [tenants, tenantId]
  );

  const value = useMemo(
    () => ({
      tenants,
      tenantId,
      setTenantId,
      selectedTenant,
      loading,
      error,
      reloadTenants: loadTenants,
    }),
    [tenants, tenantId, setTenantId, selectedTenant, loading, error, loadTenants]
  );

  return (
    <AdminTenantContext.Provider value={value}>
      {children}
    </AdminTenantContext.Provider>
  );
}

export function useAdminTenant() {
  const ctx = useContext(AdminTenantContext);
  if (!ctx) {
    throw new Error("useAdminTenant deve ser usado dentro de AdminTenantProvider");
  }
  return ctx;
}

export function useOptionalAdminTenant() {
  return useContext(AdminTenantContext);
}
