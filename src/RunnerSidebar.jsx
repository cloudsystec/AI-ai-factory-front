import React, { useEffect, useMemo, useState } from "react";
import { useJobRunner } from "./useJobRunner.js";
import WorkerRobots from "./WorkerRobots.jsx";
import RunnerControlsModal from "./RunnerControlsModal.jsx";

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
      return "A reconectar…";
    default:
      return "Log offline";
  }
}

const KIND_SHORT = {
  scope: "Escopo",
  "scope-tasks-only": "Onda",
  develop: "Fila",
  task: "Task",
};

/**
 * @param {{
 *   selectedProject: string,
 *   macroId: string|null|undefined,
 *   autorun: boolean,
 *   onAutorunChange: (checked: boolean) => void,
 *   tasks: object[],
 *   detailTaskId: string|null,
 *   onDashboardRefresh?: () => void | Promise<void>,
 *   billingSummary: object|null,
 * }} props
 */
export default function RunnerSidebar({
  selectedProject,
  macroId,
  autorun,
  onAutorunChange,
  tasks,
  detailTaskId,
  onDashboardRefresh,
  billingSummary,
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
    selectJob,
    sendInput,
    cancelJob,
  } = useJobRunner(selectedProject, { onDashboardRefresh });

  const [showControls, setShowControls] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  const eligibleTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.backlogReady === true ||
          (t.status === "todo" && t.validationStatus === "approved")
      ),
    [tasks]
  );

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

  const slotsMax = billingSummary?.agentSlotsMax ?? 1;
  const slotsInUse = billingSummary?.agentSlotsInUse ?? 0;
  const activeJobs = billingSummary?.activeJobs ?? [];

  const execLine = job
    ? `${KIND_SHORT[job.kind] || job.kind} · ${status.label}${
        job.taskId ? ` · ${truncate(job.taskId, 16)}` : ""
      }`
    : "Nenhuma execução ativa";

  return (
    <aside className="runner-sidebar" aria-label="Controlo de execução">
      <header className="runner-sidebar__head runner-sidebar__head--compact">
        <div className="runner-sidebar__head-row">
          <h2 className="runner-sidebar__title">Execução</h2>
          {selectedProject && (
            <label
              className="runner-autorun"
              title="Avançar automaticamente para a próxima tarefa"
            >
              <input
                type="checkbox"
                className="runner-autorun__input"
                checked={autorun}
                onChange={(e) => onAutorunChange(e.target.checked)}
              />
              <span className="runner-autorun__label">Auto</span>
            </label>
          )}
        </div>
      </header>

      <WorkerRobots
        slotsMax={slotsMax}
        slotsInUse={slotsInUse}
        activeJobs={activeJobs}
        selectedJobId={job?.id ?? null}
        onSelectSlot={(jobId) => {
          if (jobId) void selectJob(jobId);
        }}
      />

      <div className="runner-sidebar__exec-bar">
        <span className={`runner-pill ${status.className}`} aria-live="polite">
          {status.label}
        </span>
        <p className="runner-sidebar__exec-line" title={job?.id}>
          {execLine}
        </p>
        <button
          type="button"
          className="runner-sidebar__detail-btn"
          disabled={!selectedProject}
          onClick={() => setShowControls(true)}
        >
          Controlo
        </button>
      </div>

      {error && <p className="runner-sidebar__error">{error}</p>}

      <section className="runner-sidebar__log-wrap runner-sidebar__log-wrap--tall">
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
            >
              {streamStatusLabel(logStreamStatus)}
            </span>
          )}
        </div>
        <pre ref={logScrollRef} className="runner-sidebar__log">
          {logText ||
            (isBusy ? "…" : hasLog ? "" : "Selecione um worker ou inicie um job.")}
        </pre>
      </section>

      {showControls && (
        <RunnerControlsModal
          onClose={() => setShowControls(false)}
          scopeTitle={scopeTitle}
          disabled={disabled}
          macroId={macroId}
          isBusy={isBusy}
          jobWaitingInput={job?.status === "waiting_input"}
          eligibleTasks={eligibleTasks}
          selectedTaskId={selectedTaskId}
          onTaskIdChange={setSelectedTaskId}
          onStartScope={() => startJob({ kind: "scope" })}
          onStartScopeTasksOnly={() => startJob({ kind: "scope-tasks-only" })}
          onStartDevelop={() => startJob({ kind: "develop" })}
          onStartTask={() => startJob({ kind: "task", taskId: selectedTaskId })}
          onCancel={() => cancelJob()}
          onSendInput={sendInput}
          jobCommand={job?.command}
        />
      )}
    </aside>
  );
}
