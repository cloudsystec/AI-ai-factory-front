import React from "react";
import AppModal from "../components/AppModal.jsx";
import { TUTORIAL_PROJECT_NAME, TUTORIAL_PROJECT_SLUG } from "./mockData.js";
import { TUTORIAL_SAMPLE_SCOPE } from "./mockMacroHelpResponses.js";

/**
 * Modal de escopo macro preenchida — demo do tour, sem API.
 */
export default function TutorialMacroDetailModal({ onClose }) {
  return (
    <AppModal
      variant="macro"
      panelClassName="modal-panel--wide macro-detail-modal"
      eyebrow="Escopo macro"
      title={TUTORIAL_PROJECT_NAME}
      titleId="macro-detail-title"
      subtitle={`${TUTORIAL_PROJECT_SLUG} · gerado a partir da sua ideia inicial`}
      subtitleClassName="macro-detail-modal__hint msg msg--muted"
      onClose={onClose}
      disableOverlayClose
      closeOnOverlayClick={false}
    >
      <div
        className="modal-panel__body macro-detail-modal__body"
        data-tutorial="macro-detail-modal"
      >
        <p className="msg msg--muted macro-detail-modal__hint">
          3 microescopos já criados — apenas visualização.
        </p>
        <pre className="macro-detail-modal__preview custom-scrollbar">{TUTORIAL_SAMPLE_SCOPE}</pre>
        <div className="macro-detail-modal__actions">
          <button type="button" className="toolbar-btn" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </AppModal>
  );
}
