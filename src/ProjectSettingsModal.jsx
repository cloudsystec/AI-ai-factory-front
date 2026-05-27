import React, { useEffect, useState } from "react";
import { apiFetch } from "./api.js";

/**
 * @param {{ projectSlug: string, onClose: () => void, onSaved: () => void }} props
 */
export default function ProjectSettingsModal({ projectSlug, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/projects/${encodeURIComponent(projectSlug)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        if (!cancelled) {
          setName(data.name || projectSlug);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectSlug]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/projects/${encodeURIComponent(projectSlug)}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || res.statusText);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel modal-panel--form"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-panel__header">
          <h2 className="modal-panel__title">Editar projeto</h2>
          <button type="button" className="modal-panel__close" onClick={onClose}>
            Fechar
          </button>
        </header>
        <form className="modal-panel__body" onSubmit={handleSave}>
          {error && <p className="msg msg--error">{error}</p>}
          {loading ? (
            <p className="msg msg--muted">A carregar…</p>
          ) : (
            <label className="form-field">
              <span className="form-field__label">Nome</span>
              <input
                className="form-field__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <div className="new-project-form__actions">
            <button type="button" className="toolbar-btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="toolbar-btn toolbar-btn--primary"
              disabled={saving || loading}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
