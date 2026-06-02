import React, { useEffect } from "react";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

/**
 * @param {{
 *   projectSlug: string,
 *   projectName?: string,
 *   scope: object,
 *   taskCount?: number,
 *   onClose: () => void,
 * }} props
 */
export default function ProjectCompletionModal({
  projectSlug,
  projectName,
  scope,
  taskCount = 0,
  onClose,
}) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const microCount = scope?.microCount ?? scope?.microsApproved ?? 0;
  const completedAt = scope?.projectCompletedAt;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel--completion"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-completion-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-panel__header">
          <div>
            <p className="modal-panel__eyebrow">Projeto finalizado</p>
            <h2 id="project-completion-title" className="modal-panel__title">
              {projectName || projectSlug}
            </h2>
            <p className="project-completion-modal__subtitle">
              Todas as micros e tasks foram executadas com sucesso.
            </p>
          </div>
          <button type="button" className="modal-panel__close" onClick={onClose}>
            Fechar
          </button>
        </header>

        <div className="modal-panel__body project-completion-modal__body">
          <ul className="project-completion-modal__stats">
            <li>
              <strong>{microCount}</strong>
              <span>micros concluídas</span>
            </li>
            <li>
              <strong>{taskCount}</strong>
              <span>tasks concluídas</span>
            </li>
            <li>
              <strong>{formatDate(completedAt)}</strong>
              <span>data de conclusão</span>
            </li>
          </ul>
          <p className="project-completion-modal__note">
            Os bots foram colocados em stop e a execução automática está desactivada.
            Este projeto não pode mais ser executado.
          </p>
        </div>

        <footer className="modal-panel__footer">
          <button type="button" className="toolbar-btn toolbar-btn--primary" onClick={onClose}>
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
