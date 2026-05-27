import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api.js";
import { useJobRunner } from "./useJobRunner.js";
import { useSocket } from "./useSocket.jsx";
import WorkerRobots from "./WorkerRobots.jsx";

const ANSI_COLORS = {
  "30": "#1a1a1a", "31": "#e74c3c", "32": "#2ecc71", "33": "#f1c40f",
  "34": "#3498db", "35": "#9b59b6", "36": "#1abc9c", "37": "#ecf0f1",
  "90": "#7f8c8d", "91": "#e74c3c", "92": "#2ecc71", "93": "#f1c40f",
  "94": "#3498db", "95": "#9b59b6", "96": "#1abc9c", "97": "#ecf0f1",
};

function ansiToSpans(text) {
  if (!text) return null;
  const parts = text.split(/(\x1b\[[0-9;]*m)/);
  const result = [];
  let style = {};
  let key = 0;
  for (const part of parts) {
    const m = part.match(/^\x1b\[([0-9;]*)m$/);
    if (m) {
      const codes = m[1].split(";");
      for (const c of codes) {
        if (c === "0" || c === "") { style = {}; }
        else if (c === "1") { style = { ...style, fontWeight: "bold" }; }
        else if (c === "2") { style = { ...style, opacity: 0.7 }; }
        else if (ANSI_COLORS[c]) { style = { ...style, color: ANSI_COLORS[c] }; }
      }
    } else if (part) {
      result.push(
        Object.keys(style).length > 0
          ? <span key={key++} style={style}>{part}</span>
          : part
      );
    }
  }
  return result;
}

function AnsiPre({ text, innerRef, className }) {
  const rendered = useMemo(() => {
    if (!text) return null;
    return text.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {i > 0 && "\n"}
        {ansiToSpans(line)}
      </React.Fragment>
    ));
  }, [text]);

  return (
    <pre ref={innerRef} className={className}>
      {rendered}
    </pre>
  );
}

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
  provision: "Provision",
  "tech-lead-review": "TL review",
  "micro-integration-qa": "QA micro",
  "micro-release": "Release",
};

/**
 * @param {{
 *   selectedProject: string,
 *   macroId: string|null|undefined,
 *   autorun: boolean,
 *   skipHumanApproval: boolean,
 *   canExecute?: boolean,
 *   canWrite?: boolean,
 *   gitReady?: boolean,
 *   onAutorunChange: (checked: boolean) => void,
 *   onSkipHumanChange: (checked: boolean) => void,
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
  skipHumanApproval,
  canExecute = false,
  canWrite = false,
  gitReady = false,
  onAutorunChange,
  onSkipHumanChange,
  tasks,
  detailTaskId,
  onDashboardRefresh,
  billingSummary,
}) {
  const { subscribe } = useSocket();
  const {
    job,
    logText,
    error,
    starting,
    isBusy,
    logScrollRef,
    logStreamStatus,
    selectJob,
  } = useJobRunner(selectedProject, { onDashboardRefresh });

  const [continuousActive, setContinuousActive] = useState(false);
  const [pauseAfterCurrent, setPauseAfterCurrent] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([1]);
  const [execError, setExecError] = useState(null);
  const [togglingPlay, setTogglingPlay] = useState(false);

  const slotsMax = billingSummary?.agentSlotsMax ?? 1;
  const slotsInUse = billingSummary?.agentSlotsInUse ?? 0;
  const activeJobs = billingSummary?.activeJobs ?? [];

  const loadExecutionState = useCallback(async () => {
    if (!selectedProject) {
      setContinuousActive(false);
      setPauseAfterCurrent(false);
      setSelectedSlots([1]);
      return;
    }
    try {
      const res = await apiFetch(
        `/api/execution/${encodeURIComponent(selectedProject)}/state`
      );
      if (!res.ok) return;
      const data = await res.json();
      setContinuousActive(data.continuousActive === true);
      setPauseAfterCurrent(data.pauseAfterCurrent === true);
      if (Array.isArray(data.selectedWorkerSlots) && data.selectedWorkerSlots.length) {
        setSelectedSlots(data.selectedWorkerSlots);
      } else {
        setSelectedSlots((prev) => (prev.length ? prev : [1]));
      }
    } catch {
      /* ignore */
    }
  }, [selectedProject]);

  useEffect(() => {
    loadExecutionState();
    const fallback = setInterval(loadExecutionState, 30_000);
    const unsub = subscribe("execution", (ev) => {
      setContinuousActive(ev.continuousActive === true);
      setPauseAfterCurrent(ev.pauseAfterCurrent === true);
    });
    return () => { clearInterval(fallback); unsub(); };
  }, [loadExecutionState, subscribe]);

  const handleToggleSlot = useCallback((slotIndex, selected) => {
    setSelectedSlots((prev) => {
      const set = new Set(prev);
      if (selected) set.add(slotIndex);
      else set.delete(slotIndex);
      return [...set].sort((a, b) => a - b);
    });
  }, []);

  const handlePlayToggle = useCallback(async () => {
    if (!selectedProject || !canExecute || togglingPlay) return;
    setExecError(null);
    setTogglingPlay(true);
    try {
      if (continuousActive) {
        const res = await apiFetch(
          `/api/execution/${encodeURIComponent(selectedProject)}/pause`,
          { method: "POST" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.statusText);
        setContinuousActive(false);
        setPauseAfterCurrent(data.pauseAfterCurrent === true);
      } else {
        if (selectedSlots.length === 0) {
          throw new Error("Selecione pelo menos um worker livre (checkbox).");
        }
        const res = await apiFetch(
          `/api/execution/${encodeURIComponent(selectedProject)}/start`,
          {
            method: "POST",
            body: JSON.stringify({
              macroId: macroId || selectedProject,
              workerSlots: selectedSlots,
            }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.statusText);
        setContinuousActive(true);
        setPauseAfterCurrent(false);
        setSelectedSlots([]);
        const n = Array.isArray(data.enqueued) ? data.enqueued.length : 0;
        if (n === 0 && data.hint) {
          throw new Error(data.hint);
        }
      }
      await loadExecutionState();
      if (onDashboardRefresh) await onDashboardRefresh();
    } catch (e) {
      setExecError(e.message || String(e));
    } finally {
      setTogglingPlay(false);
    }
  }, [
    selectedProject,
    canExecute,
    togglingPlay,
    continuousActive,
    selectedSlots,
    macroId,
    loadExecutionState,
    onDashboardRefresh,
  ]);

  const [addingWorkers, setAddingWorkers] = useState(false);

  const handleAddWorkers = useCallback(async () => {
    if (!selectedProject || !canExecute || addingWorkers || selectedSlots.length === 0) return;
    setExecError(null);
    setAddingWorkers(true);
    try {
      const res = await apiFetch(
        `/api/execution/${encodeURIComponent(selectedProject)}/add-workers`,
        {
          method: "POST",
          body: JSON.stringify({ workerSlots: selectedSlots }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setSelectedSlots([]);
      const n = Array.isArray(data.enqueued) ? data.enqueued.length : 0;
      if (n === 0 && data.hint) {
        setExecError(data.hint);
      }
      await loadExecutionState();
      if (onDashboardRefresh) await onDashboardRefresh();
    } catch (e) {
      setExecError(e.message || String(e));
    } finally {
      setAddingWorkers(false);
    }
  }, [selectedProject, canExecute, addingWorkers, selectedSlots, loadExecutionState, onDashboardRefresh]);

  const status = job ? statusMeta(job.status) : statusMeta(null);
  const hasLog = Boolean(logText?.trim());
  const playLabel = continuousActive
    ? pauseAfterCurrent
      ? "A parar…"
      : "Pausar"
    : "Play";

  const execLine = job
    ? `${KIND_SHORT[job.kind] || job.kind} · ${status.label}${
        job.taskId ? ` · ${truncate(job.taskId, 16)}` : ""
      }`
    : continuousActive
      ? "Execução contínua ativa"
      : "Nenhuma execução ativa";

  return (
    <aside className="runner-sidebar" aria-label="Controlo de execução">
      <header className="runner-sidebar__head runner-sidebar__head--compact">
        <div className="runner-sidebar__head-row">
          <h2 className="runner-sidebar__title">Execução</h2>
          {canExecute && selectedProject && (
            <div className="runner-sidebar__actions">
              <button
                type="button"
                className={`runner-play-btn${continuousActive ? " runner-play-btn--active" : ""}`}
                disabled={!gitReady || togglingPlay || starting}
                onClick={handlePlayToggle}
                title={
                  !gitReady
                    ? "Conecte o Git primeiro para executar"
                    : continuousActive
                    ? "Pausa após o trabalho atual — não cancela jobs em curso"
                    : "Agents em paralelo a partir do A fazer; Tech Lead integra ao fechar o micro"
                }
              >
                {playLabel}
              </button>
              {continuousActive && selectedSlots.length > 0 && (
                <button
                  type="button"
                  className="runner-play-btn runner-play-btn--add"
                  disabled={addingWorkers}
                  onClick={handleAddWorkers}
                  title="Adicionar workers seleccionados ao pool sem parar a execução"
                >
                  {addingWorkers ? "…" : `+ ${selectedSlots.length} Worker${selectedSlots.length > 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          )}
        </div>
        {selectedProject && (canWrite || canExecute) && (
          <div className="runner-sidebar__toggles">
            {canWrite && (
              <label
                className="runner-autorun"
                title="Com Play ativo, repõe workers com tasks do A fazer em paralelo (após cada conclusão)"
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
            {canWrite && (
              <label
                className="runner-autorun"
                title="Tasks passam da revisão diretamente para Concluído"
              >
                <input
                  type="checkbox"
                  className="runner-autorun__input"
                  checked={skipHumanApproval}
                  onChange={(e) => onSkipHumanChange(e.target.checked)}
                />
                <span className="runner-autorun__label">Pular validação humana</span>
              </label>
            )}
          </div>
        )}
      </header>

      <WorkerRobots
        slotsMax={slotsMax}
        slotsInUse={slotsInUse}
        activeJobs={activeJobs}
        selectedJobId={job?.id ?? null}
        selectedSlots={selectedSlots}
        currentProject={selectedProject}
        continuousActive={continuousActive}
        onToggleSlot={handleToggleSlot}
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
      </div>

      {continuousActive && pauseAfterCurrent && (
        <p className="runner-sidebar__pause-hint msg msg--muted">
          Pausa pedida: os workers terminam o trabalho atual e deixam de aceitar trabalho
          novo.
        </p>
      )}

      {(error || execError) && (
        <p className="runner-sidebar__error">{error || execError}</p>
      )}

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
        {logText ? (
          <AnsiPre
            innerRef={logScrollRef}
            className="runner-sidebar__log"
            text={logText}
          />
        ) : (
          <pre ref={logScrollRef} className="runner-sidebar__log">
            {isBusy
              ? "…"
              : hasLog
                ? ""
                : "Marque workers livres e prima Play, ou clique num worker ocupado para ver o registo."}
          </pre>
        )}
      </section>
    </aside>
  );
}
