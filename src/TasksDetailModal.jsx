import React from "react";
import AppModal from "./components/AppModal.jsx";

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
  in_progress: "Em curso",
};

function statusLabel(status) {
  return TASK_STATUS_LABELS[status] || status || "—";
}

function displayStatus(task) {
  if (task.effectiveStatus) return statusLabel(task.effectiveStatus);
  if (task.runtimeStatus) return statusLabel(task.runtimeStatus);
  return statusLabel(task.backlogStatus);
}

/**
 * @param {{
 *   openMicro?: { id?: string, title?: string } | null,
 *   detail?: object | null,
 *   onClose: () => void,
 * }} props
 */
export default function TasksDetailModal({ openMicro, detail, onClose }) {
  const tasks = Array.isArray(detail?.tasks) ? detail.tasks : [];
  const eligibleCount = detail?.eligibleCount ?? 0;

  return (
    <AppModal
      variant="task"
      panelClassName="modal-panel--wide tasks-detail-modal"
      eyebrow="Micro atual · tasks"
      title={openMicro?.title || openMicro?.id || "Tasks da onda"}
      titleId="tasks-detail-title"
      subtitle={openMicro?.id || undefined}
      subtitleClassName="tasks-detail-modal__micro-id msg msg--muted"
      onClose={onClose}
    >
      <div className="modal-panel__body tasks-detail-modal__body">
          {!openMicro?.id ? (
            <p className="msg msg--muted">Nenhum micro aberto neste projeto.</p>
          ) : tasks.length === 0 ? (
            <p className="msg msg--muted">
              Ainda não há tasks para este micro — rode scope (Onda) para gerar.
            </p>
          ) : (
            <>
              <div className="tasks-detail-modal__summary">
                <span className="tasks-detail-modal__stat tasks-detail-modal__stat--ok">
                  {eligibleCount} elegível(eis) para dispatch
                </span>
                <span className="tasks-detail-modal__stat">
                  {tasks.length} no micro
                </span>
              </div>
              {detail?.parallelHint && (
                <p className="tasks-detail-modal__hint msg msg--muted">
                  {detail.parallelHint}
                </p>
              )}

              <ul className="tasks-detail-modal__list">
                {tasks.map((task) => (
                  <li key={task.id} className="tasks-detail-card">
                    <div className="tasks-detail-card__head">
                      <span className="tasks-detail-card__priority">
                        #{task.priority ?? "—"}
                      </span>
                      <h3 className="tasks-detail-card__title">{task.title}</h3>
                      <span
                        className={`tasks-detail-card__eligible${
                          task.dispatchEligible
                            ? " tasks-detail-card__eligible--yes"
                            : " tasks-detail-card__eligible--no"
                        }`}
                      >
                        {task.dispatchEligible ? "Elegível" : "Bloqueada"}
                      </span>
                    </div>
                    <p className="tasks-detail-card__id">
                      <code>{task.id}</code>
                    </p>
                    <div className="tasks-detail-card__status-row">
                      <span className="tasks-detail-card__label">Estado</span>
                      <span
                        className={`micro-card__task-status micro-card__task-status--${task.effectiveStatus || task.runtimeStatus || task.backlogStatus || "todo"}`}
                      >
                        {displayStatus(task)}
                      </span>
                      {task.runtimeStatus && (
                        <span className="tasks-detail-card__backlog-hint">
                          runtime: {statusLabel(task.runtimeStatus)}
                        </span>
                      )}
                      <span className="tasks-detail-card__backlog-hint">
                        backlog: {statusLabel(task.backlogStatus)}
                      </span>
                      {!task.statusInSync && task.syncWarning && (
                        <p className="tasks-detail-card__sync-warn msg msg--warn">
                          {task.syncWarning}
                        </p>
                      )}
                      {!task.approved && (
                        <span className="tasks-detail-card__warn">
                          TL não aprovou
                        </span>
                      )}
                    </div>
                    {task.dependencies?.length > 0 ? (
                      <div className="tasks-detail-card__deps">
                        <span className="tasks-detail-card__label">Dependências</span>
                        <ul className="tasks-detail-card__dep-list">
                          {task.dependencies.map((dep) => (
                            <li
                              key={dep.id}
                              className={
                                dep.done
                                  ? "tasks-detail-card__dep tasks-detail-card__dep--done"
                                  : "tasks-detail-card__dep tasks-detail-card__dep--pending"
                              }
                            >
                              <span className="tasks-detail-card__dep-mark" aria-hidden>
                                {dep.done ? "✓" : "○"}
                              </span>
                              <span className="tasks-detail-card__dep-title">
                                {dep.title}
                              </span>
                              <code className="tasks-detail-card__dep-id">{dep.id}</code>
                              {!dep.done && (
                                <span className="tasks-detail-card__dep-status">
                                  {statusLabel(dep.status)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="tasks-detail-card__no-deps msg msg--muted">
                        Sem dependências
                      </p>
                    )}
                    {!task.dispatchEligible && task.dispatchBlockReason && (
                      <p className="tasks-detail-card__block-reason">
                        {task.dispatchBlockReason}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
    </AppModal>
  );
}
