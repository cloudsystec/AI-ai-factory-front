import React, { useState } from "react";
import { suggestSlugFromName } from "./projectSlug.js";
import { apiFetch } from "./api.js";

/**
 * @param {{ onClose: () => void, onCreated: (slug: string) => void }} props
 */
export default function NewProjectModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [scope, setScope] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleNameChange(value) {
    setName(value);
    if (!slugTouched) setSlug(suggestSlugFromName(value));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          scope: scope.trim(),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || response.statusText);
      onCreated(body.project || slug.trim());
      onClose();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (!submitting && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel--form"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-panel__header">
          <div>
            <h2 className="modal-panel__title">Criar projeto</h2>
          </div>
          <button type="button" className="modal-panel__close" onClick={onClose} disabled={submitting}>
            Fechar
          </button>
        </header>

        <form className="modal-panel__body new-project-form" onSubmit={handleSubmit}>
          {error && <p className="msg msg--error">{error}</p>}

          <label className="form-field">
            <span className="form-field__label">Nome do projeto</span>
            <input
              className="form-field__input"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">Slug</span>
            <input
              className="form-field__input form-field__input--mono"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              required
              pattern="[a-zA-Z0-9_-]+"
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">Escopo (markdown)</span>
            <textarea
              className="form-field__textarea"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              required
              rows={10}
            />
          </label>
          <div className="new-project-form__actions">
            <button type="button" className="toolbar-btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="toolbar-btn toolbar-btn--primary"
              disabled={submitting || !name || !scope || !slug}
            >
              {submitting ? "A criar…" : "Criar projeto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
