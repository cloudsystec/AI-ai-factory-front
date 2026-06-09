import React from "react";
import AppModal from "./components/AppModal.jsx";
import ProjectDeliveryActions from "./components/ProjectDeliveryActions.jsx";

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
  const microCount = scope?.microCount ?? scope?.microsApproved ?? 0;
  const completedAt = scope?.projectCompletedAt;

  return (
    <AppModal
      variant="completion"
      panelClassName="modal-panel--completion"
      eyebrow="Projeto finalizado"
      title={projectName || projectSlug}
      titleId="project-completion-title"
      subtitle="Todas as micros e tasks foram executadas com sucesso."
      subtitleClassName="project-completion-modal__subtitle"
      onClose={onClose}
      footer={
        <button type="button" className="toolbar-btn" onClick={onClose}>
          Fechar
        </button>
      }
    >
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
          Os bots foram colocados em stop e a execução automática está desativada.
          Este projeto não pode mais ser executado.
        </p>

        <ProjectDeliveryActions projectSlug={projectSlug} layout="modal" />

        <p className="project-completion-modal__note project-completion-modal__note--muted">
          Publicação privada via DevForLess no Railway. Não precisa de GitHub
          ligado.
        </p>
      </div>
    </AppModal>
  );
}
