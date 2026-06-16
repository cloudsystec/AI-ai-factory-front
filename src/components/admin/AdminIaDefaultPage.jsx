import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api.js";
import WorkerRoutingEditor from "./WorkerRoutingEditor.jsx";
import PortalRoutingTable, { routeFromEffective } from "./PortalRoutingTable.jsx";
import { workerDraftFromEffective } from "../../lib/workerRoutingDraft.js";

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
 * Configuração IA default global (portal + worker).
 */
export default function AdminIaDefaultPage() {
  const [tab, setTab] = useState("portal");
  const [catalog, setCatalog] = useState(null);
  const [portalDraft, setPortalDraft] = useState({});
  const [workerDraft, setWorkerDraft] = useState({});
  const [meta, setMeta] = useState(null);
  const [mtkDraft, setMtkDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const lunaProfiles = catalog?.lunaProfiles || [
    "general",
    "planning",
    "coding",
    "fast",
  ];

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [featRes, defaultRes, platformRes] = await Promise.all([
        apiFetch("/admin/ai-features"),
        apiFetch("/admin/ai-default"),
        apiFetch("/admin/platform-config"),
      ]);
      if (!featRes.ok) throw new Error(await featRes.text());
      if (!defaultRes.ok) throw new Error(await defaultRes.text());
      if (!platformRes.ok) throw new Error(await platformRes.text());
      const featData = await featRes.json();
      const defaultData = await defaultRes.json();
      const platformData = await platformRes.json();
      setCatalog(featData);
      setMeta(defaultData.meta || null);
      const portal = {};
      for (const f of featData.portal || []) {
        portal[f.key] = routeFromEffective(defaultData.portal?.[f.key]);
      }
      setPortalDraft(portal);
      setWorkerDraft(workerDraftFromEffective(defaultData.worker || {}));
      const mtk = platformData.config?.luna_usd_per_million_tokens?.value;
      setMtkDraft(mtk != null ? String(mtk) : "0.2");
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const portalRows = useMemo(() => {
    return (catalog?.portal || []).map((f) => ({
      ...f,
      route: portalDraft[f.key] || { provider: "cursor" },
    }));
  }, [catalog, portalDraft]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch("/admin/ai-default", {
        method: "PATCH",
        body: JSON.stringify({
          config: {
            portal: portalDraft,
            worker: workerDraft,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || res.statusText);
      }

      const mtk = Number(mtkDraft);
      if (Number.isFinite(mtk) && mtk > 0) {
        const mtkRes = await apiFetch("/admin/platform-config", {
          method: "PATCH",
          body: JSON.stringify({
            luna_usd_per_million_tokens: mtk,
          }),
        });
        if (!mtkRes.ok) {
          const body = await mtkRes.json().catch(() => ({}));
          throw new Error(body.error || mtkRes.statusText);
        }
      }

      setMessage("Default IA guardado.");
      await loadAll();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  function updatePortalRow(key, patch) {
    setPortalDraft((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  }

  return (
    <div className="admin-ia admin-mgmt-page">
      <div className="admin-ia__head">
        <div>
          <p className="app-subpage__eyebrow">Plataforma</p>
          <h2 className="admin-ia__title">IA — Default</h2>
          <p className="admin-ia__subtitle">
            Configuração global. Tenants sem override herdam estes valores
            automaticamente.
          </p>
        </div>
        <button
          type="button"
          className="btn-glass btn-glass--primary px-4 py-2 rounded-xl"
          disabled={saving || loading}
          onClick={handleSave}
        >
          {saving ? "A guardar…" : "Guardar"}
        </button>
      </div>

      {(error || message) && (
        <div className="admin-mgmt__alerts" role="status">
          {error && <p className="msg msg--error">{error}</p>}
          {message && <p className="msg msg--ok">{message}</p>}
        </div>
      )}

      <section className="admin-ia__worker-section admin-mgmt__panel">
        <p className="admin-mgmt__hint">
          {meta?.stored
            ? "Default gravado em ai_default_config."
            : "Default derivado de bot_mode / luna_model_routing (legado). Guarde para persistir."}
          {meta?.botMode != null && (
            <>
              {" "}
              · bot_mode efectivo: <strong>{meta.botMode}</strong>
            </>
          )}
        </p>
        <label className="admin-mgmt__field">
          <span className="admin-mgmt__label">MTK Luna (USD / 1M tokens)</span>
          <input
            className="admin-mgmt__input"
            type="number"
            step="0.0001"
            min="0.0001"
            value={mtkDraft}
            onChange={(e) => setMtkDraft(e.target.value)}
          />
        </label>
      </section>

      <IaTabs tab={tab} onTabChange={setTab} />

      {loading ? (
        <p className="msg msg--muted">Carregando…</p>
      ) : tab === "portal" ? (
        <PortalRoutingTable
          rows={portalRows}
          lunaProfiles={lunaProfiles}
          onUpdateRow={updatePortalRow}
        />
      ) : (
        <WorkerRoutingEditor
          value={workerDraft}
          onChange={setWorkerDraft}
          lunaProfiles={lunaProfiles}
          catalog={catalog}
          rawWorker={{}}
          globalRouting={{}}
          editMode="default"
        />
      )}
    </div>
  );
}
