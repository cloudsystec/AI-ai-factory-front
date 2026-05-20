import React, { useEffect, useMemo, useState } from "react";
import { useJobRunner } from "./useJobRunner.js";

function statusMeta(status) {
  switch (status) {
    case "queued":
      return { label: "Na fila", className: "runner-pill--running" };
    case "running":
      return { label: "Em curso", className: "runner-pill--running" };
    case "waiting_input":
      return { label: "Aguarda confirmação", className: "runner-pill--waiting" };
    case "succeeded":
      return { label: "Concluído", className: "runner-pill--ok" };
    case "failed":
      return { label: "Falhou", className: "runner-pill--fail" };
    case "cancelled":
      return { label: "Interrompido", className: "runner-pill--muted" };
    default:
      return { label: "Inativo", className: "runner-pill--muted" };
  }
}

function truncate(str, max) {
  const s = String(str || "");
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function streamStatusLabel(status) {
  switch (status) {
    case "connected":
      return "Log em tempo real";
    case "reconnecting":
      return "A reconectar… (polling ativo)";
    default:
      return "Log offline";
  }
}

/**
 * @param {{
 *   selectedProject: string,
 *   macroId: string|null|undefined,
 *   autorun: boolean,
 *   onAutorunChange: (checked: boolean) => void,
 *   tasks: object[],
 *   detailTaskId: string|null,
 * }} props
 */
export default function RunnerSidebar({
  selectedProject,
  macroId,
  autorun,
  onAutorunChange,
  tasks,
  detailTaskId,
}) {
  const {
    job,
    logText,
    error,
    starting,
    isBusy,
    logScrollRef,
    logStreamStatus,
    startJob,
    sendInput,
    cancelJob,
  } = useJobRunner(selectedProject);

  const eligibleTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.backlogReady === true ||
          (t.status === "todo" && t.validationStatus === "approved")
      ),
    [tasks]
  );

  const [selectedTaskId, setSelectedTaskId] = useState("");

  useEffect(() => {
    if (detailTaskId) {
      setSelectedTaskId(detailTaskId);
    }
  }, [detailTaskId]);

  useEffect(() => {
    if (!selectedTaskId && eligibleTasks.length > 0) {
      setSelectedTaskId(eligibleTasks[0].id);
    }
  }, [eligibleTasks, selectedTaskId]);

  const disabled = !selectedProject || isBusy || starting;
  const status = job ? statusMeta(job.status) : statusMeta(null);
  const hasLog = Boolean(logText?.trim());

  const scopeTitle = macroId
    ? `Projeto ${selectedProject} · macro ${macroId}`
    : "Selecione um projeto com escopo definido";

  return (
    <aside className="runner-sidebar" aria-label="Controlo de execução">
      <header className="runner-sidebar__head">
        <div className="runner-sidebar__head-row">
          <h2 className="runner-sidebar__title">Controlo</h2>
          <span className={`runner-pill ${status.className}`} aria-live="polite">
            {status.label}
          </span>
        </div>
        {selectedProject && (
          <label className="runner-autorun" title="Avançar automaticamente para a próxima tarefa após cada entrega">
            <input
              type="checkbox"
              className="runner-autorun__input"
              checked={autorun}
              onChange={(e) => onAutorunChange(e.target.checked)}
            />
            <span className="runner-autorun__label">Automático</span>
          </label>
        )}
      </header>

      <section className="runner-sidebar__actions">
        <p className="runner-group__label">Planeamento</p>
        <div className="runner-btn-grid">
          <button
            type="button"
            className="runner-btn"
            disabled={disabled || !macroId}
            onClick={() => startJob({ kind: "scope" })}
            title={scopeTitle}
          >
            Gerar escopo
          </button>
          <button
            type="button"
            className="runner-btn"
            disabled={disabled || !macroId}
            onClick={() => startJob({ kind: "scope-tasks-only" })}
            title="Planeia apenas as tarefas da fase atual"
          >
            Nova onda
          </button>
        </div>

        <p className="runner-group__label">Desenvolvimento</p>
        <button
          type="button"
          className="runner-btn runner-btn--primary"
          disabled={disabled || !macroId}
          onClick={() => startJob({ kind: "develop" })}
          title="Executa a fila de tarefas aprovadas da fase atual"
        >
          Iniciar fila
        </button>

        <p className="runner-group__label">Tarefa pontual</p>
        <div className="runner-sidebar__task-row">
          <select
            id="runner-task-select"
            className="runner-sidebar__select"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
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
            onClick={() => startJob({ kind: "task", taskId: selectedTaskId })}
          >
            Executar
          </button>
        </div>

        {isBusy && (
          <button
            type="button"
            className="runner-btn runner-btn--danger"
            onClick={() => cancelJob()}
          >
            Interromper
          </button>
        )}

        {job?.status === "waiting_input" && (
          <div
            className="runner-sidebar__prompt"
            role="group"
            aria-label="Continuar fila de desenvolvimento"
          >
            <p className="runner-sidebar__prompt-text">Continuar com a próxima tarefa?</p>
            <div className="runner-sidebar__prompt-btns">
              <button
                type="button"
                className="runner-btn runner-btn--primary"
                onClick={() => sendInput("S")}
              >
                Sim, continuar
              </button>
              <button type="button" className="runner-btn" onClick={() => sendInput("N")}>
                Parar
              </button>
            </div>
          </div>
        )}
      </section>

      {error && <p className="runner-sidebar__error">{error}</p>}

      {job?.command && (
        <details className="runner-sidebar__tech">
          <summary>Detalhe técnico</summary>
          <code className="runner-sidebar__cmd">{job.command}</code>
        </details>
      )}

      <section className="runner-sidebar__log-wrap">
        <div className="runner-sidebar__log-head">
          <h3 className="runner-sidebar__log-title">Registo</h3>
          {job?.id && (
            <span className="runner-sidebar__log-meta" title={job.id}>
              {truncate(job.id, 14)}
            </span>
          )}
          {job && !isBusy && (
            <span className="runner-sidebar__stream runner-sidebar__stream--offline">
              Último job
            </span>
          )}
          {isBusy && (
            <span
              className={`runner-sidebar__stream runner-sidebar__stream--${logStreamStatus}`}
              title={streamStatusLabel(logStreamStatus)}
            >
              {streamStatusLabel(logStreamStatus)}
            </span>
          )}
        </div>
        <pre ref={logScrollRef} className="runner-sidebar__log">
          {logText ||
            (isBusy ? "…" : hasLog ? "" : "Nenhuma execução para este projeto.")}
        </pre>
      </section>
    </aside>
  );
}
