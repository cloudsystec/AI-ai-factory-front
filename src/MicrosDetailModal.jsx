import React, { useEffect } from "react";

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

export default function MicrosDetailModal({ micros, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const list = Array.isArray(micros) ? micros : [];

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="micros-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-panel__header">
          <h2 id="micros-detail-title" className="modal-panel__title">
            Microescopos
          </h2>
          <button type="button" className="modal-panel__close" onClick={onClose}>
            Fechar
          </button>
        </header>

        <div className="modal-panel__body micros-detail__list">
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
                      <span className="micro-card__task-title">{t.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
