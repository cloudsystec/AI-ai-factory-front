import React from "react";
import AppModal from "./components/AppModal.jsx";

const DELIVERY_LABELS = {
  open: "Em curso",
  locked: "Bloqueado",
  closed: "Concluído",
};

const TASK_STATUS_LABELS = {
  todo: "A fazer",
  pending_validation: "Pendente",
  needs_refinement: "Refino",
  planning: "Planejando",
  development: "Dev",
  testing: "Testando",
  review: "Revisão",
  done: "Concluído",
  blocked: "Bloqueado",
  paused: "Pausado",
};

function taskStatusLabel(status) {
  return TASK_STATUS_LABELS[status] || status || "—";
}

function deliveryBadge(status) {
  const label = DELIVERY_LABELS[status] || status || "—";
  const cls =
    status === "open"
      ? "micro-card__badge--open"
      : status === "closed"
        ? "micro-card__badge--closed"
        : "micro-card__badge--locked";
  return <span className={`micro-card__badge ${cls}`}>{label}</span>;
}

export default function MicrosDetailModal({
  micros,
  onClose,
  bodyTutorialTarget,
  disableOverlayClose = false,
}) {
  const list = Array.isArray(micros) ? micros : [];

  return (
    <AppModal
      variant="macro"
      panelClassName="modal-panel--wide"
      eyebrow="Escopo"
      title="Microescopos"
      titleId="micros-detail-title"
      onClose={onClose}
      disableOverlayClose={disableOverlayClose}
      closeOnOverlayClick={!disableOverlayClose}
    >
      <div
        className="modal-panel__body micros-detail__list"
        data-tutorial={bodyTutorialTarget || undefined}
      >
          {list.length === 0 && (
            <p className="msg msg--muted">Nenhum micro aprovado.</p>
          )}
          {list.map((m) => (
            <article key={m.id} className="micro-card">
              <div className="micro-card__head">
                <span className="micro-card__priority">#{m.priority ?? "—"}</span>
                <h3 className="micro-card__title">{m.title}</h3>
                {deliveryBadge(m.taskDeliveryStatus)}
              </div>

              {m.description && (
                <p className="micro-card__desc">{m.description}</p>
              )}

              {m.risks && (
                <p className="micro-card__risks">
                  <strong>Riscos:</strong> {m.risks}
                </p>
              )}

              {(m.acceptance?.length > 0 || m.testStrategy) && (
                <div className="micro-card__qa">
                  <strong>Critérios QA</strong>
                  {m.acceptance?.length > 0 && (
                    <ul className="micro-card__acceptance">
                      {m.acceptance.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {m.testStrategy && (
                    <p className="micro-card__test-strategy">
                      <strong>Testes:</strong>{" "}
                      <code>{m.testStrategy}</code>
                    </p>
                  )}
                </div>
              )}

              <div className="micro-card__meta">
                {m.poScore != null && (
                  <span className="micro-card__score">PO Score: {m.poScore}</span>
                )}
                {m.dependencies?.length > 0 && (
                  <span className="micro-card__deps">
                    Depende de: {m.dependencies.join(", ")}
                  </span>
                )}
              </div>

              {m.tasks?.length > 0 && (
                <ul className="micro-card__tasks">
                  {m.tasks.map((t) => (
                    <li key={t.id} className="micro-card__task-item">
                      <span className={`micro-card__task-status micro-card__task-status--${t.status}`}>
                        {taskStatusLabel(t.status)}
                      </span>
                      {t.isMicroCloser && (
                        <span className="micro-card__task-closer" title="Task de fechamento (QA do micro)">
                          Fechamento
                        </span>
                      )}
                      <span className="micro-card__task-title">{t.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
    </AppModal>
  );
}
