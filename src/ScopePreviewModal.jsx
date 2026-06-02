import React from "react";
import MarkdownPreview from "./MarkdownPreview.jsx";

/**
 * @param {{
 *   open: boolean,
 *   content: string,
 *   onClose: () => void,
 * }} props
 */
export default function ScopePreviewModal({ open, content, onClose }) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay scope-preview-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel--wide scope-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scope-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-panel__header">
          <div>
            <p className="modal-panel__eyebrow">Preview</p>
            <h2 id="scope-preview-title" className="modal-panel__title">
              Escopo (markdown)
            </h2>
          </div>
          <button type="button" className="modal-panel__close" onClick={onClose}>
            Fechar
          </button>
        </header>
        <div className="modal-panel__body scope-preview-modal__body">
          {content.trim() ? (
            <MarkdownPreview content={content} />
          ) : (
            <p className="msg msg--muted">Nenhum conteúdo para pré-visualizar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
