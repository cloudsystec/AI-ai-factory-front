import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import { AGENT_ROLE_KEYS } from "./agentRoleKeys.js";

/**
 * @param {{ onClose: () => void }} props
 */
export default function AdminPage({ onClose }) {
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState("");
  const [mode, setMode] = useState("templates");
  const [roleKey, setRoleKey] = useState("global");
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const loadTenants = useCallback(async () => {
    const res = await apiFetch("/admin/tenants");
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setTenants(data.tenants || []);
    if (data.tenants?.[0]) {
      setTenantId((prev) => prev || data.tenants[0].id);
    }
  }, []);

  const loadContent = useCallback(async () => {
    setError(null);
    setMessage(null);
    const path =
      mode === "templates"
        ? `/admin/agent-templates`
        : `/admin/tenants/${tenantId}/agents`;
    const res = await apiFetch(path);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const list = mode === "templates" ? data.templates : data.overrides;
    const row = (list || []).find((r) => r.role_key === roleKey);
    setContent(row?.content || "");
  }, [mode, tenantId, roleKey]);

  useEffect(() => {
    loadTenants().catch((e) => setError(e.message));
  }, [loadTenants]);

  useEffect(() => {
    if (mode === "tenant" && !tenantId) return;
    loadContent().catch((e) => setError(e.message));
  }, [loadContent, mode, tenantId]);

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const url =
        mode === "templates"
          ? `/admin/agent-templates/${roleKey}`
          : `/admin/tenants/${tenantId}/agents/${roleKey}`;
      const res = await apiFetch(url, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || res.statusText);
      }
      setMessage(
        "Guardado. Reinicie o worker CLI do tenant (ou AGENT_SYNC_EACH_CLAIM=true) para aplicar no disco."
      );
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  async function handleReset() {
    if (!tenantId) return;
    setError(null);
    const res = await apiFetch(`/admin/tenants/${tenantId}/agents/reset`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(await res.text());
    setMessage("Overrides repostos aos templates.");
    await loadContent();
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Admin — Agentes</h1>
        <button type="button" className="toolbar-btn" onClick={onClose}>
          Voltar ao dashboard
        </button>
      </header>

      <div className="admin-page__toolbar">
        <label>
          Modo
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="templates">Templates plataforma</option>
            <option value="tenant">Overrides por cliente</option>
          </select>
        </label>
        {mode === "tenant" && (
          <label>
            Tenant
            <select value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.email}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Role
          <select value={roleKey} onChange={(e) => setRoleKey(e.target.value)}>
            {AGENT_ROLE_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        {mode === "tenant" && (
          <button type="button" className="toolbar-btn" onClick={handleReset}>
            Repor defaults
          </button>
        )}
      </div>

      {error && <p className="msg msg--error">{error}</p>}
      {message && <p className="msg msg--muted">{message}</p>}

      <form className="admin-editor" onSubmit={handleSave}>
        <label className="form-field__label" htmlFor="admin-agent-content">
          Conteúdo do prompt ({roleKey})
        </label>
        <textarea
          id="admin-agent-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={24}
          spellCheck={false}
          placeholder="Markdown do agente…"
        />
        <div className="new-project-form__actions">
          <button type="submit" className="toolbar-btn toolbar-btn--primary">
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
