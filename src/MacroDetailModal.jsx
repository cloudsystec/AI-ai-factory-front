import React, { useEffect, useState } from "react";
import { apiFetch } from "./api.js";

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

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

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
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel--wide macro-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="macro-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-panel__header">
          <div>
            <p className="modal-panel__eyebrow">Escopo macro</p>
            <h2 id="macro-detail-title" className="modal-panel__title">
              {macroId || projectSlug}
            </h2>
            {lockedHint && (
              <p className="macro-detail-modal__hint msg msg--muted">{lockedHint}</p>
            )}
            {editable && canWrite && (
              <p className="macro-detail-modal__hint msg msg--muted">
                Edite o escopo antes de gerar microescopos (job scope no CLI).
              </p>
            )}
          </div>
          <button
            type="button"
            className="modal-panel__close"
            onClick={onClose}
            disabled={saving}
          >
            Fechar
          </button>
        </header>

        <form className="modal-panel__body macro-detail-modal__body" onSubmit={handleSave}>
          {loading ? (
            <p className="msg msg--muted">A carregar escopo…</p>
          ) : editable && canWrite ? (
            <label className="form-field macro-detail-modal__field">
              <span className="form-field__label">Conteúdo (markdown)</span>
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
                {saving ? "A guardar…" : "Guardar escopo"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
