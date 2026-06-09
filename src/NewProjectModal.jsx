import React, { useEffect, useState } from "react";
import { suggestSlugFromName } from "./projectSlug.js";
import { apiFetch } from "./api.js";
import AppModal from "./components/AppModal.jsx";
import MacroHelpTrigger from "./MacroHelpTrigger.jsx";
import MacroHelpPanel from "./MacroHelpPanel.jsx";
import ScopePreviewModal from "./ScopePreviewModal.jsx";

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
  const [macroHelpReady, setMacroHelpReady] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      setStatusLoading(true);
      try {
        const res = await apiFetch("/api/macro-help/status");
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setMacroHelpReady(Boolean(data.ready));
        }
      } catch {
        if (!cancelled) setMacroHelpReady(false);
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const canSubmit =
    macroHelpReady && !statusLoading && name.trim() && scope.trim() && slug.trim();

  return (
    <>
      <AppModal
        variant="form"
        panelClassName="modal-panel--form"
        eyebrow="Projeto"
        title="Criar projeto"
        titleId="new-project-title"
        onClose={onClose}
        closeDisabled={submitting}
        disableOverlayClose={submitting}
        closeOnEscape={!drawerOpen && !previewOpen}
        closeOnOverlayClick={!drawerOpen}
        companionOpen={drawerOpen}
        companion={
          drawerOpen ? (
            <MacroHelpPanel
              onClose={() => setDrawerOpen(false)}
              scopeMd={scope}
              onScopeChange={setScope}
              projectName={name}
              draftSlug={slug}
            />
          ) : null
        }
      >
        <form className="modal-panel__body new-project-form" onSubmit={handleSubmit}>
            {statusLoading ? (
              <p className="msg msg--muted">A verificar configuração…</p>
            ) : !macroHelpReady ? (
              <p className="msg msg--error">
                Configure pelo menos um bot e a chave Admin Cursor do tenant antes de
                criar projetos. Contacte o administrador da plataforma.
              </p>
            ) : null}

            {error && <p className="msg msg--error">{error}</p>}

            <label className="form-field">
              <span className="form-field__label">Nome do projeto</span>
              <input
                className="form-field__input"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
                disabled={!macroHelpReady || statusLoading}
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
                disabled={!macroHelpReady || statusLoading}
              />
            </label>
            <label className="form-field">
              <div className="form-field__label-row">
                <span className="form-field__label">Escopo (markdown)</span>
                {macroHelpReady && (
                  <div className="form-field__label-actions">
                    <button
                      type="button"
                      className="toolbar-btn toolbar-btn--link"
                      onClick={() => setPreviewOpen(true)}
                      disabled={!scope.trim()}
                    >
                      Preview
                    </button>
                    <MacroHelpTrigger
                      onClick={() => setDrawerOpen((open) => !open)}
                      disabled={submitting}
                    />
                  </div>
                )}
              </div>
              <textarea
                className="form-field__textarea"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                required
                rows={10}
                disabled={!macroHelpReady || statusLoading}
              />
            </label>
            <div className="new-project-form__actions">
              <button type="button" className="toolbar-btn" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="toolbar-btn toolbar-btn--primary"
                disabled={submitting || !canSubmit}
              >
                {submitting ? "Criando…" : "Criar projeto"}
              </button>
            </div>
          </form>
      </AppModal>

      <ScopePreviewModal
        open={previewOpen}
        content={scope}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
