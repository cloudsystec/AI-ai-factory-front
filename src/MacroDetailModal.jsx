import React, { useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import AppModal from "./components/AppModal.jsx";
import MacroHelpTrigger from "./MacroHelpTrigger.jsx";
import MacroHelpPanel from "./MacroHelpPanel.jsx";
import ScopePreviewModal from "./ScopePreviewModal.jsx";

/**
 * @param {{
 *   projectSlug: string,
 *   macroId?: string,
 *   initialScopeMd?: string,
 *   microCount?: number,
 *   macroEditable?: boolean,
 *   canWrite?: boolean,
 *   onClose: () => void,
 *   onSaved?: () => void | Promise<void>,
 * }} props
 */
export default function MacroDetailModal({
  projectSlug,
  macroId,
  initialScopeMd = "",
  microCount = 0,
  macroEditable,
  canWrite = false,
  onClose,
  onSaved,
}) {
  const editable =
    macroEditable !== undefined ? macroEditable : microCount === 0;
  const [text, setText] = useState(initialScopeMd);
  const [loading, setLoading] = useState(!initialScopeMd.trim());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [macroHelpReady, setMacroHelpReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const showMacroHelp = editable && canWrite && macroHelpReady;

  useEffect(() => {
    if (!editable || !canWrite) return;
    let cancelled = false;
    async function loadStatus() {
      try {
        const res = await apiFetch("/api/macro-help/status");
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setMacroHelpReady(Boolean(data.ready));
      } catch {
        if (!cancelled) setMacroHelpReady(false);
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [editable, canWrite]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (initialScopeMd.trim()) {
        setText(initialScopeMd);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(
          `/api/projects/${encodeURIComponent(projectSlug)}/macro-scope`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        if (!cancelled) {
          setText(data.scopeMd || "");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectSlug, initialScopeMd]);

  async function handleSave(e) {
    e.preventDefault();
    if (!editable || !canWrite) return;
    const trimmed = text.trim();
    if (!trimmed) {
      setError("O escopo macro não pode estar vazio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/macro-scope`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scopeMd: trimmed }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (onSaved) await onSaved();
      onClose();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  const lockedHint =
    microCount > 0
      ? `${microCount} microescopo(s) já criado(s) — apenas visualização.`
      : null;

  return (
    <>
      <AppModal
        variant="macro"
        panelClassName="modal-panel--wide macro-detail-modal"
        eyebrow="Escopo macro"
        title={macroId || projectSlug}
        titleId="macro-detail-title"
        subtitle={
          lockedHint ||
          (editable && canWrite
            ? "Edite o escopo antes de gerar microescopos (job scope no CLI)."
            : undefined)
        }
        subtitleClassName="macro-detail-modal__hint msg msg--muted"
        onClose={onClose}
        closeDisabled={saving}
        disableOverlayClose={saving}
        closeOnEscape={!drawerOpen && !previewOpen}
        closeOnOverlayClick={!drawerOpen}
        companionOpen={drawerOpen}
        companion={
          showMacroHelp && drawerOpen ? (
            <MacroHelpPanel
              onClose={() => setDrawerOpen(false)}
              scopeMd={text}
              onScopeChange={setText}
              projectName={macroId || projectSlug}
              projectSlug={projectSlug}
            />
          ) : null
        }
        headerActions={
          !loading && text.trim() ? (
            <button
              type="button"
              className="toolbar-btn toolbar-btn--link"
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </button>
          ) : null
        }
      >
        <form className="modal-panel__body macro-detail-modal__body" onSubmit={handleSave}>
            {loading ? (
              <p className="msg msg--muted">Carregando escopo…</p>
            ) : editable && canWrite ? (
              <label className="form-field macro-detail-modal__field">
                <div className="form-field__label-row">
                  <span className="form-field__label">Conteúdo (markdown)</span>
                  {showMacroHelp && (
                    <div className="form-field__label-actions">
                      <MacroHelpTrigger
                        onClick={() => setDrawerOpen((open) => !open)}
                        disabled={saving}
                      />
                    </div>
                  )}
                </div>
                <textarea
                  className="form-field__textarea macro-detail-modal__textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={18}
                  disabled={saving}
                  spellCheck={false}
                />
              </label>
            ) : (
              <pre className="macro-detail-modal__preview">{text || "—"}</pre>
            )}

            {error && <p className="msg msg--error">{error}</p>}

            <div className="macro-detail-modal__actions">
              <button type="button" className="toolbar-btn" onClick={onClose} disabled={saving}>
                Fechar
              </button>
              {editable && canWrite && (
                <button
                  type="submit"
                  className="toolbar-btn toolbar-btn--primary"
                  disabled={saving || loading || !text.trim()}
                >
                  {saving ? "Salvando…" : "Salvar escopo"}
                </button>
              )}
            </div>
          </form>
      </AppModal>

      <ScopePreviewModal
        open={previewOpen}
        content={text}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
