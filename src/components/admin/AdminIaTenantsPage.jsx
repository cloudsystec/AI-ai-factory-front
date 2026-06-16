import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api.js";
import { useAdminTenant } from "../../context/AdminTenantContext.jsx";
import WorkerRoutingEditor from "./WorkerRoutingEditor.jsx";
import PortalRoutingTable, { routeFromEffective } from "./PortalRoutingTable.jsx";
import {
  buildWorkerTenantPatch,
  workerDraftFromRaw,
} from "../../lib/workerRoutingDraft.js";

function IaTabs({ tab, onTabChange }) {
  return (
    <div className="admin-ia__tabs" role="tablist" aria-label="Secções IA">
      <button
        type="button"
        role="tab"
        aria-selected={tab === "portal"}
        className={tab === "portal" ? "is-active" : ""}
        onClick={() => onTabChange("portal")}
      >
        Portal
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "worker"}
        className={tab === "worker" ? "is-active" : ""}
        onClick={() => onTabChange("worker")}
      >
        Worker / CLI
      </button>
    </div>
  );
}

/**
 * Overrides IA por tenant (portal + worker).
 */
export default function AdminIaTenantsPage() {
  const { tenantId } = useAdminTenant();
  const [tab, setTab] = useState("portal");
  const [catalog, setCatalog] = useState(null);
  const [effective, setEffective] = useState(null);
  const [rawConfig, setRawConfig] = useState({});
  const [portalDraft, setPortalDraft] = useState({});
  const [workerDraft, setWorkerDraft] = useState({});
  const [defaultConfig, setDefaultConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const lunaProfiles = catalog?.lunaProfiles || [
    "general",
    "planning",
    "coding",
    "fast",
  ];

  const defaultRouting = useMemo(
    () => defaultConfig?.worker || {},
    [defaultConfig]
  );

  const rawWorker = rawConfig?.worker || {};

  const loadAll = useCallback(async () => {
    if (!tenantId) {
      setEffective(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [featRes, cfgRes, defaultRes] = await Promise.all([
        apiFetch("/admin/ai-features"),
        apiFetch(`/admin/tenants/${tenantId}/ai-config`),
        apiFetch("/admin/ai-default"),
      ]);
      if (!featRes.ok) throw new Error(await featRes.text());
      if (!cfgRes.ok) throw new Error(await cfgRes.text());
      if (!defaultRes.ok) throw new Error(await defaultRes.text());
      const featData = await featRes.json();
      const cfgData = await cfgRes.json();
      const defaultData = await defaultRes.json();
      setCatalog(featData);
      setEffective(cfgData);
      setRawConfig(cfgData.raw || {});
      setDefaultConfig(defaultData);
      const portal = {};
      for (const f of featData.portal || []) {
        if (cfgData.raw?.portal?.[f.key]) {
          portal[f.key] = routeFromEffective(cfgData.raw.portal[f.key]);
        }
      }
      setPortalDraft(portal);
      setWorkerDraft(workerDraftFromRaw(cfgData.raw?.worker || {}));
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const portalRows = useMemo(() => {
    return (catalog?.portal || []).map((f) => {
      const effectiveRoute = effective?.portal?.[f.key];
      const defaultRoute = defaultConfig?.portal?.[f.key];
      const route =
        portalDraft[f.key] != null
          ? portalDraft[f.key]
          : routeFromEffective(effectiveRoute || defaultRoute);
      return {
        ...f,
        route,
        source: effectiveRoute?.source || "default",
      };
    });
  }, [catalog, portalDraft, effective, defaultConfig]);

  function routesEqual(a, b) {
    if (!a || !b) return false;
    if (a.provider !== b.provider) return false;
    if (a.provider === "cursor") return true;
    return (a.lunaProfile || "planning") === (b.lunaProfile || "planning");
  }

  function updatePortalRow(key, patch) {
    setPortalDraft((prev) => {
      const next = { ...prev };
      const merged = { ...(portalRows.find((r) => r.key === key)?.route || {}), ...patch };
      const defaultRoute = routeFromEffective(defaultConfig?.portal?.[key]);
      if (routesEqual(merged, defaultRoute)) {
        delete next[key];
      } else {
        next[key] = merged;
      }
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const workerPatch = buildWorkerTenantPatch(
        workerDraft,
        defaultRouting,
        rawWorker
      );
      const res = await apiFetch(`/admin/tenants/${tenantId}/ai-config`, {
        method: "PATCH",
        body: JSON.stringify({
          config: {
            portal: portalDraft,
            worker: workerPatch,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || res.statusText);
      }
      setMessage("Configuração IA do tenant guardada.");
      await loadAll();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyDefault() {
    if (!tenantId) return;
    if (
      !window.confirm(
        "Copiar o default global para este tenant? Isto grava um snapshot explícito — alterações futuras no default não afectarão este tenant até remover overrides."
      )
    ) {
      return;
    }
    setBusyAction("copy");
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch(
        `/admin/tenants/${tenantId}/ai-config/copy-default`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || res.statusText);
      }
      setMessage("Default copiado para o tenant.");
      await loadAll();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleResetToDefault() {
    if (!tenantId) return;
    if (
      !window.confirm(
        "Limpar todos os overrides deste tenant e voltar a herdar o default global?"
      )
    ) {
      return;
    }
    setBusyAction("reset");
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch(
        `/admin/tenants/${tenantId}/ai-config/reset-to-default`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || res.statusText);
      }
      setMessage("Tenant configurado para usar o default global.");
      await loadAll();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusyAction(null);
    }
  }

  const hasRawOverrides =
    rawConfig &&
    typeof rawConfig === "object" &&
    (Object.keys(rawConfig.portal || {}).length > 0 ||
      Object.keys(rawConfig.worker || {}).length > 0);

  return (
    <div className="admin-ia admin-mgmt-page">
      <div className="admin-ia__head">
        <div>
          <p className="app-subpage__eyebrow">Plataforma</p>
          <h2 className="admin-ia__title">IA — Tenants</h2>
          <p className="admin-ia__subtitle">
            Overrides por empresa. Valores em branco herdam o default global.
          </p>
        </div>
        <div className="admin-ia__head-actions">
          <button
            type="button"
            className="btn-glass px-3 py-2 rounded-xl text-dash-body"
            disabled={loading || busyAction || !tenantId}
            onClick={handleCopyDefault}
          >
            {busyAction === "copy" ? "A copiar…" : "Copiar default"}
          </button>
          <button
            type="button"
            className="btn-glass px-3 py-2 rounded-xl text-dash-body"
            disabled={loading || busyAction || !tenantId || !hasRawOverrides}
            onClick={handleResetToDefault}
          >
            {busyAction === "reset" ? "A limpar…" : "Usar default"}
          </button>
          <button
            type="button"
            className="btn-glass btn-glass--primary px-4 py-2 rounded-xl"
            disabled={saving || loading || !tenantId}
            onClick={handleSave}
          >
            {saving ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </div>

      {(error || message) && (
        <div className="admin-mgmt__alerts" role="status">
          {error && <p className="msg msg--error">{error}</p>}
          {message && <p className="msg msg--ok">{message}</p>}
        </div>
      )}

      <IaTabs tab={tab} onTabChange={setTab} />

      {loading ? (
        <p className="msg msg--muted">Carregando…</p>
      ) : !tenantId ? (
        <p className="msg msg--muted">Selecione uma empresa no header.</p>
      ) : tab === "portal" ? (
        <PortalRoutingTable
          rows={portalRows}
          lunaProfiles={lunaProfiles}
          onUpdateRow={updatePortalRow}
          showSource
        />
      ) : (
        <WorkerRoutingEditor
          value={workerDraft}
          onChange={setWorkerDraft}
          lunaProfiles={lunaProfiles}
          catalog={catalog}
          rawWorker={rawWorker}
          globalRouting={defaultRouting}
        />
      )}
    </div>
  );
}
