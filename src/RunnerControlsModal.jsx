import React, { useEffect } from "react";

/**
 * @param {{
 *   onClose: () => void,
 *   scopeTitle: string,
 *   disabled: boolean,
 *   macroId: string|null|undefined,
 *   isBusy: boolean,
 *   jobWaitingInput: boolean,
 *   eligibleTasks: object[],
 *   selectedTaskId: string,
 *   onTaskIdChange: (id: string) => void,
 *   onStartScope: () => void,
 *   onStartScopeTasksOnly: () => void,
 *   onStartDevelop: () => void,
 *   onStartTask: () => void,
 *   onCancel: () => void,
 *   onSendInput: (answer: "S" | "N") => void,
 *   jobCommand?: string|null,
 * }} props
 */
export default function RunnerControlsModal({
  onClose,
  scopeTitle,
  disabled,
  macroId,
  isBusy,
  jobWaitingInput,
  eligibleTasks,
  selectedTaskId,
  onTaskIdChange,
  onStartScope,
  onStartScopeTasksOnly,
  onStartDevelop,
  onStartTask,
  onCancel,
  onSendInput,
  jobCommand,
}) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function truncate(str, max) {
    const s = String(str || "");
    return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel--runner-controls"
        role="dialog"
        aria-modal="true"
        aria-labelledby="runner-controls-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-panel__header">
          <div>
            <p className="modal-panel__eyebrow">Controlo</p>
            <h2 id="runner-controls-title" className="modal-panel__title">
              Execução
            </h2>
            <p className="runner-controls-modal__sub">{scopeTitle}</p>
          </div>
          <button type="button" className="modal-panel__close" onClick={onClose}>
            Fechar
          </button>
        </header>

        <div className="modal-panel__body runner-controls-modal__body">
          <p className="runner-group__label">Planeamento</p>
          <div className="runner-btn-grid runner-btn-grid--modal">
            <button
              type="button"
              className="runner-btn"
              disabled={disabled || !macroId}
              onClick={() => {
                onStartScope();
                onClose();
              }}
              title={scopeTitle}
            >
              Gerar escopo
            </button>
            <button
              type="button"
              className="runner-btn"
              disabled={disabled || !macroId}
              onClick={() => {
                onStartScopeTasksOnly();
                onClose();
              }}
            >
              Nova onda
            </button>
          </div>

          <p className="runner-group__label">Desenvolvimento</p>
          <button
            type="button"
            className="runner-btn runner-btn--primary"
            disabled={disabled || !macroId}
            onClick={() => {
              onStartDevelop();
              onClose();
            }}
          >
            Iniciar fila
          </button>

          <p className="runner-group__label">Tarefa pontual</p>
          <div className="runner-sidebar__task-row">
            <select
              className="runner-sidebar__select"
              value={selectedTaskId}
              onChange={(e) => onTaskIdChange(e.target.value)}
              disabled={disabled}
              aria-label="Tarefa"
            >
              <option value="">Escolher tarefa…</option>
              {eligibleTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {truncate(t.title || t.id, 42)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="runner-btn"
              disabled={disabled || !selectedTaskId}
              onClick={() => {
                onStartTask();
                onClose();
              }}
            >
              Executar
            </button>
          </div>

          {isBusy && (
            <button
              type="button"
              className="runner-btn runner-btn--danger"
              onClick={onCancel}
            >
              Interromper
            </button>
          )}

          {jobWaitingInput && (
            <div className="runner-sidebar__prompt" role="group">
              <p className="runner-sidebar__prompt-text">
                Continuar com a próxima tarefa?
              </p>
              <div className="runner-sidebar__prompt-btns">
                <button
                  type="button"
                  className="runner-btn runner-btn--primary"
                  onClick={() => onSendInput("S")}
                >
                  Sim, continuar
                </button>
                <button
                  type="button"
                  className="runner-btn"
                  onClick={() => onSendInput("N")}
                >
                  Parar
                </button>
              </div>
            </div>
          )}

          {jobCommand && (
            <details className="runner-sidebar__tech">
              <summary>Detalhe técnico</summary>
              <code className="runner-sidebar__cmd">{jobCommand}</code>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
