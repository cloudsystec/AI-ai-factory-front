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

 *   projectCompleted?: boolean,

 *   canWrite?: boolean,

 *   gitReady?: boolean,

 *   onAutorunChange: (checked: boolean) => void,

 *   onSkipHumanChange: (checked: boolean) => void,

 *   tasks: object[],

 *   detailTaskId: string|null,

 *   onDashboardRefresh?: () => void | Promise<void>,

 *   onProjectCompleted?: () => void | Promise<void>,

 *   billingSummary: object|null,

 * }} props

 */

export default function RunnerSidebar({

  selectedProject,

  macroId,

  autorun,

  skipHumanApproval,

  canExecute = false,

  projectCompleted = false,

  canWrite = false,

  gitReady = false,

  workspacePreparing = false,

  showGitUi = true,

  onAutorunChange,

  onSkipHumanChange,

  tasks,

  detailTaskId,

  onDashboardRefresh,

  onProjectCompleted,

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

    selectSlot,

  } = useJobRunner(selectedProject, { onDashboardRefresh });



  const [activeSlots, setActiveSlots] = useState([]);

  const [pauseAfterCurrent, setPauseAfterCurrent] = useState(false);

  const [execError, setExecError] = useState(null);

  const [loadingSlot, setLoadingSlot] = useState(null);

  const [selectedSlot, setSelectedSlot] = useState(null);



  const slotsMax = billingSummary?.agentSlotsMax ?? billingSummary?.slotsMax ?? 1;

  const slotsInUse = billingSummary?.agentSlotsInUse ?? 0;

  const activeJobs = billingSummary?.activeJobs ?? [];

  const workersStatus = billingSummary?.workersStatus ?? [];



  const applyExecutionPayload = useCallback((data) => {

    if (Array.isArray(data.selectedWorkerSlots)) {

      setActiveSlots(data.selectedWorkerSlots);

    }

    if (typeof data.continuousActive === "boolean") {

      if (!data.continuousActive) {

        setPauseAfterCurrent(data.pauseAfterCurrent === true);

      } else {

        setPauseAfterCurrent(false);

      }

    } else if (data.pauseAfterCurrent === true) {

      setPauseAfterCurrent(true);

    }

  }, []);



  const loadExecutionState = useCallback(async () => {

    if (!selectedProject) {

      setActiveSlots([]);

      setPauseAfterCurrent(false);

      return;

    }

    try {

      const res = await apiFetch(

        `/api/execution/${encodeURIComponent(selectedProject)}/state`

      );

      if (!res.ok) return;

      const data = await res.json();

      applyExecutionPayload(data);

    } catch {

      /* ignore */

    }

  }, [selectedProject, applyExecutionPayload]);



  useEffect(() => {

    loadExecutionState();

    const fallback = setInterval(loadExecutionState, 30_000);

    const unsub = subscribe("execution", (ev) => {

      if (ev.project && selectedProject && ev.project !== selectedProject) return;

      applyExecutionPayload(ev);

    });

    return () => { clearInterval(fallback); unsub(); };

  }, [loadExecutionState, subscribe, selectedProject, applyExecutionPayload]);



  useEffect(() => {

    setSelectedSlot(null);

  }, [selectedProject]);



  useEffect(() => {

    if (!selectedSlot) return;

    const active = activeJobs.find(

      (j) => Number(j.workerSlot) === selectedSlot

    );

    if (!active?.id || active.id === job?.id) return;

    void selectJob(active.id);

  }, [activeJobs, selectedSlot, job?.id, selectJob]);



  const handleSelectSlot = useCallback(

    (jobId, slotIndex) => {

      setSelectedSlot(slotIndex);

      if (jobId) void selectJob(jobId);

      else void selectSlot(slotIndex);

    },

    [selectJob, selectSlot]

  );



  const handleSlotStart = useCallback(

    async (slotIndex) => {

      if (!selectedProject || !canExecute || loadingSlot != null) return;

      const w = workersStatus.find((x) => x.slot === slotIndex);

      if (w && !w.botReady) {

        setExecError(

          "Worker não configurado. Contacte o administrador da plataforma."

        );

        return;

      }

      setExecError(null);

      setLoadingSlot(slotIndex);

      try {

        const res = await apiFetch(

          `/api/execution/${encodeURIComponent(selectedProject)}/workers/${slotIndex}/start`,

          {

            method: "POST",

            body: JSON.stringify({ macroId: macroId || selectedProject }),

          }

        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.error || res.statusText);

        if (Array.isArray(data.workerSlots)) {

          setActiveSlots(data.workerSlots);

        } else {

          setActiveSlots((prev) =>

            [...new Set([...prev, slotIndex])].sort((a, b) => a - b)

          );

        }

        setPauseAfterCurrent(false);

        const n = Array.isArray(data.enqueued) ? data.enqueued.length : 0;

        if (data.projectCompleted) {
          setActiveSlots([]);
          setExecError(null);
          await loadExecutionState();
          if (onDashboardRefresh) await onDashboardRefresh();
          if (onProjectCompleted) await onProjectCompleted();
          return;
        }

        if (n === 0 && data.hint) {

          setExecError(data.hint);

        }

        await loadExecutionState();

        if (onDashboardRefresh) await onDashboardRefresh();

      } catch (e) {

        setExecError(e.message || String(e));

      } finally {

        setLoadingSlot(null);

      }

    },

    [

      selectedProject,

      canExecute,

      loadingSlot,

      workersStatus,

      macroId,

      loadExecutionState,

      onDashboardRefresh,

      onProjectCompleted,

    ]

  );



  const handleSlotStop = useCallback(

    async (slotIndex) => {

      if (!selectedProject || !canExecute || loadingSlot != null) return;

      setExecError(null);

      setLoadingSlot(slotIndex);

      try {

        const res = await apiFetch(

          `/api/execution/${encodeURIComponent(selectedProject)}/workers/${slotIndex}/stop`,

          { method: "POST" }

        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.error || res.statusText);

        if (Array.isArray(data.workerSlots)) {

          setActiveSlots(data.workerSlots);

        } else {

          setActiveSlots((prev) => prev.filter((s) => s !== slotIndex));

        }

        if (data.continuousActive === false) {

          setPauseAfterCurrent(data.pauseAfterCurrent === true);

        }

        await loadExecutionState();

        if (onDashboardRefresh) await onDashboardRefresh();

      } catch (e) {

        setExecError(e.message || String(e));

      } finally {

        setLoadingSlot(null);

      }

    },

    [selectedProject, canExecute, loadingSlot, loadExecutionState, onDashboardRefresh]

  );

  const handlePlayAll = useCallback(async () => {
    if (!selectedProject || !canExecute || loadingSlot != null) return;
    setExecError(null);
    setLoadingSlot(-1);
    try {
      const res = await apiFetch(
        `/api/execution/${encodeURIComponent(selectedProject)}/play-all`,
        {
          method: "POST",
          body: JSON.stringify({ macroId: macroId || selectedProject }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      if (Array.isArray(data.workerSlots)) {
        setActiveSlots(data.workerSlots);
      }
      setPauseAfterCurrent(false);
      const n = Array.isArray(data.enqueued) ? data.enqueued.length : 0;
      if (data.projectCompleted) {
        setActiveSlots([]);
        setExecError(null);
        await loadExecutionState();
        if (onDashboardRefresh) await onDashboardRefresh();
        if (onProjectCompleted) await onProjectCompleted();
        return;
      }
      if (n === 0 && data.hint) setExecError(data.hint);
      await loadExecutionState();
      if (onDashboardRefresh) await onDashboardRefresh();
    } catch (e) {
      setExecError(e.message || String(e));
    } finally {
      setLoadingSlot(null);
    }
  }, [
    selectedProject,
    canExecute,
    loadingSlot,
    macroId,
    loadExecutionState,
    onDashboardRefresh,
    onProjectCompleted,
  ]);

  const handlePauseAll = useCallback(async () => {
    if (!selectedProject || !canExecute || loadingSlot != null) return;
    setExecError(null);
    setLoadingSlot(-1);
    try {
      const res = await apiFetch(
        `/api/execution/${encodeURIComponent(selectedProject)}/pause`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setActiveSlots([]);
      setPauseAfterCurrent(data.pauseAfterCurrent === true);
      await loadExecutionState();
      if (onDashboardRefresh) await onDashboardRefresh();
    } catch (e) {
      setExecError(e.message || String(e));
    } finally {
      setLoadingSlot(null);
    }
  }, [
    selectedProject,
    canExecute,
    loadingSlot,
    loadExecutionState,
    onDashboardRefresh,
  ]);

  const status = job ? statusMeta(job.status) : statusMeta(null);

  const hasLog = Boolean(logText?.trim());

  const anyActive = activeSlots.length > 0;



  const execLine = job

    ? `${KIND_SHORT[job.kind] || job.kind} · ${status.label}${

        job.taskId ? ` · ${truncate(job.taskId, 16)}` : ""

      }`

    : anyActive

      ? `${activeSlots.length} bot(s) activo(s) neste projecto`

      : projectCompleted
        ? "Projeto finalizado — execução desactivada"
        : "Nenhum bot activo — use ▶ em cada worker";



  return (

    <aside className="runner-sidebar" aria-label="Controlo de execução">

      <header className="runner-sidebar__head runner-sidebar__head--compact">
        <div className="runner-sidebar__head-row">
          <h2 className="runner-sidebar__title">Execução</h2>
          {selectedProject && (canWrite || canExecute) && !projectCompleted && (
          <div className="runner-sidebar__toggles runner-sidebar__toggles--inline">

            {canWrite && (

              <label

                className="runner-autorun"

                title="Com bots activos, repõe workers com tasks do A fazer em paralelo (após cada conclusão)"

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
        </div>
      </header>

      <WorkerRobots

        slotsMax={slotsMax}

        slotsInUse={slotsInUse}

        activeJobs={activeJobs}

        workersStatus={workersStatus}

        selectedJobId={job?.id ?? null}

        selectedSlot={selectedSlot}

        activeSlots={activeSlots}

        currentProject={selectedProject}

        canControl={canExecute && !projectCompleted}

        projectCompleted={projectCompleted}

        gitReady={gitReady}

        workspacePreparing={workspacePreparing}

        showGitUi={showGitUi}

        loadingSlot={loadingSlot}

        onSlotStart={handleSlotStart}

        onSlotStop={handleSlotStop}

        onSelectSlot={handleSelectSlot}

        onPlayAll={handlePlayAll}

        onPauseAll={handlePauseAll}

        playAllLoading={loadingSlot === -1}

      />

      <div className="runner-sidebar__workspace">
        <div className="runner-sidebar__exec-bar">
          <span className={`runner-pill ${status.className}`} aria-live="polite">
            {status.label}
          </span>
          <p className="runner-sidebar__exec-line" title={job?.id}>
            {execLine}
          </p>
        </div>

        {pauseAfterCurrent && activeSlots.length === 0 && (
          <p className="runner-sidebar__pause-hint msg msg--muted">
            Todos os bots parados: jobs em curso terminam; não há novos trabalhos
            enfileirados.
          </p>
        )}

        {(error || execError) && (
          <p className="runner-sidebar__error">{error || execError}</p>
        )}

        <section className="runner-sidebar__log-wrap runner-sidebar__log-wrap--fill">

        <div className="runner-sidebar__log-head">

          <h3 className="runner-sidebar__log-title">

            Registo{selectedSlot ? ` · Bot #${selectedSlot}` : ""}

          </h3>

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

                : selectedSlot

                  ? `Sem registo para o bot #${selectedSlot} neste projecto.`

                  : "Clique num bot para ver o registo, ou use ▶ para iniciar."}

          </pre>

        )}

      </section>
      </div>

    </aside>

  );

}


