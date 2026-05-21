import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import { AGENT_ROLE_KEYS } from "./agentRoleKeys.js";

/**
 * @param {{ projectSlug: string, onClose: () => void }} props
 */
export default function AgentsPage({ projectSlug, onClose }) {
  const [roleKey, setRoleKey] = useState("global");
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    if (!projectSlug) return;
    const res = await apiFetch(
      `/api/projects/${encodeURIComponent(projectSlug)}/agents`
    );
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const row = (data.overrides || []).find((r) => r.role_key === roleKey);
    setContent(row?.content || "");
  }, [projectSlug, roleKey]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function handleSave() {
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/agents/${roleKey}`,
        {
          method: "PUT",
          body: JSON.stringify({ content }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      setMessage("Agente guardado.");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleReset() {
    if (!window.confirm("Repor agentes deste projeto a partir dos templates?")) {
      return;
    }
    setError(null);
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/agents/reset`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(await res.text());
      setMessage("Agentes repostos.");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!projectSlug) {
    return (
      <div className="admin-page">
        <p className="msg msg--muted">Selecione um projeto no dashboard.</p>
        <button type="button" className="toolbar-btn" onClick={onClose}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Agentes — {projectSlug}</h1>
        <button type="button" className="toolbar-btn" onClick={onClose}>
          Voltar
        </button>
      </header>
      {error && <p className="msg msg--error">{error}</p>}
      {message && <p className="msg msg--ok">{message}</p>}
      <div className="admin-page__toolbar">
        <label>
          Papel
          <select value={roleKey} onChange={(e) => setRoleKey(e.target.value)}>
            {AGENT_ROLE_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="toolbar-btn" onClick={handleReset}>
          Repor templates
        </button>
      </div>
      <div className="admin-editor">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={24}
          spellCheck={false}
        />
      </div>
      <button
        type="button"
        className="toolbar-btn toolbar-btn--primary"
        onClick={handleSave}
      >
        Guardar
      </button>
    </div>
  );
}
