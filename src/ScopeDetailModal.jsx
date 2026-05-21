import React, { useEffect } from "react";

function scopeStepIcon(state) {
  if (state === "done") return "✓";
  if (state === "active") return "●";
  return "○";
}

/**
 * @param {{ scope: object, onClose: () => void }} props
 */
export default function ScopeDetailModal({ scope, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const waveStats = scope.waveTaskStats ?? {
    total: 0,
    pendingTl: 0,
    todoApproved: 0,
  };
  const paths = scope.paths ?? { macro: "", micro: "", backlog: "" };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel--scope-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scope-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-panel__header">
          <div>
            <p className="modal-panel__eyebrow">Planeamento</p>
            <h2 id="scope-detail-title" className="modal-panel__title">
              {scope.current?.label ?? "Escopo"}
            </h2>
            {scope.current?.hint && (
              <p className="scope-detail-modal__hint">{scope.current.hint}</p>
            )}
          </div>
          <button type="button" className="modal-panel__close" onClick={onClose}>
            Fechar
          </button>
        </header>

        <div className="modal-panel__body">
          <div className="scope-strip__steps scope-strip__steps--modal" role="list">
            {scope.scopeSteps?.map((step, i) => (
              <React.Fragment key={step.key}>
                {i > 0 && (
                  <div
                    className={
                      scope.scopeSteps[i - 1].state === "done"
                        ? "scope-strip__conn scope-strip__conn--done"
                        : "scope-strip__conn"
                    }
                    aria-hidden
                  />
                )}
                <div
                  role="listitem"
                  className={`scope-strip__step scope-strip__step--${step.state}${
                    step.state === "active" ? " scope-strip__step--pulse" : ""
                  }`}
                >
                  <div className="scope-strip__ring">
                    <span aria-hidden>{scopeStepIcon(step.state)}</span>
                  </div>
                  <span className="scope-strip__step-label">{step.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          <dl className="scope-strip__stats scope-strip__stats--modal">
            <div>
              <dt>Produto</dt>
              <dd>{scope.macroId}</dd>
            </div>
            <div>
              <dt>Fases</dt>
              <dd>
                {scope.microCount ?? 0} no total · {scope.microsApproved ?? 0}{" "}
                validadas
                {(scope.microsPendingPo ?? 0) > 0
                  ? ` · ${scope.microsPendingPo} em revisão`
                  : ""}
              </dd>
            </div>
            <div>
              <dt>Fase atual</dt>
              <dd>
                {scope.openMicro ? (
                  <span className="scope-strip__micro-title">
                    {scope.openMicro.title}
                  </span>
                ) : scope.wavesCompleteScenario ? (
                  "Todas as fases concluídas"
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt>Tarefas na fase</dt>
              <dd>
                {waveStats.total} planejadas · {waveStats.pendingTl} em revisão ·{" "}
                {waveStats.todoApproved} prontas para executar
              </dd>
            </div>
          </dl>

          {(paths.macro || paths.micro || paths.backlog) && (
            <div className="scope-detail-modal__paths">
              <h3 className="task-detail-section__title">Ficheiros</h3>
              <ul>
                {paths.macro && (
                  <li>
                    <code>{paths.macro}</code>
                  </li>
                )}
                {paths.micro && (
                  <li>
                    <code>{paths.micro}</code>
                  </li>
                )}
                {paths.backlog && (
                  <li>
                    <code>{paths.backlog}</code>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
