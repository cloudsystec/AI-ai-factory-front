import React from "react";
import MarkdownPreview from "./MarkdownPreview.jsx";
import AppModal from "./components/AppModal.jsx";

/**
 * @param {{
 *   open: boolean,
 *   content: string,
 *   overlayClassName?: string,
 *   onClose: () => void,
 *   eyebrow?: string,
 *   title?: string,
 * }} props
 */
export default function ScopePreviewModal({
  open,
  content,
  onClose,
  overlayClassName = "",
  eyebrow = "Preview",
  title = "Escopo (markdown)",
}) {
  if (!open) return null;

  return (
    <AppModal
      variant="scope"
      panelClassName="modal-panel--wide scope-preview-modal"
      overlayClassName={overlayClassName}
      eyebrow={eyebrow}
      title={title}
      titleId="scope-preview-title"
      onClose={onClose}
    >
      <div className="modal-panel__body scope-preview-modal__body">
        {content.trim() ? (
          <MarkdownPreview content={content} />
        ) : (
          <p className="msg msg--muted">Nenhum conteúdo para pré-visualizar.</p>
        )}
      </div>
    </AppModal>
  );
}
