import React, { useCallback, useEffect, useState } from "react";

import { apiFetch } from "../api.js";
import {
  executionGitHint,
  summarizeExecutionResponse,
} from "../lib/executionDiag.js";
import { useJobRunner } from "../useJobRunner.js";
import { useSocket } from "../useSocket.jsx";

export function statusMeta(status) {

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



export function truncate(str, max) {

  const s = String(str || "");

  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;

}



export function streamStatusLabel(status) {

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

 *   onProjectsRefresh?: () => void | Promise<void>,

 *   onProjectCompleted?: () => void | Promise<void>,

 *   billingSummary: object|null,

 *   projectMeta?: object|null,

 * }} props

 */

export function useRunnerExecutionState({
  selectedProject,

  projectMeta = null,

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

  onProjectsRefresh,

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

  const apiCall = useCallback(
    async (label, path, init = {}) => {
      try {
        const res = await apiFetch(path, init);
        const data = await res.json().catch(() => ({}));
        const summary = summarizeExecutionResponse(res, data);
        if (import.meta.env.DEV) {
          console.warn("[exec]", label, init.method || "GET", path, res.status, summary.message);
        }
        return { res, data, summary };
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn("[exec]", label, init.method || "GET", path, e.message);
        }
        throw e;
      }
    },
    [],
  );

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

      const { res, data } = await apiCall(

        "Sync estado",

        `/api/execution/${encodeURIComponent(selectedProject)}/state`

      );

      if (!res.ok) return;

      applyExecutionPayload(data);

    } catch {

      /* ignore */

    }

  }, [selectedProject, applyExecutionPayload, apiCall]);



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
    (_jobId, slotIndex) => {
      setSelectedSlot(slotIndex);
      void selectSlot(slotIndex);
    },
    [selectSlot]
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

        const { res, data } = await apiCall(

          `Play bot #${slotIndex}`,

          `/api/execution/${encodeURIComponent(selectedProject)}/workers/${slotIndex}/start`,

          {

            method: "POST",

            body: JSON.stringify({ macroId: macroId || selectedProject }),

          }

        );

        if (!res.ok) throw new Error(data.error || res.statusText);

        if (Array.isArray(data.workerSlots)) {

          setActiveSlots(data.workerSlots);

        } else {

          setActiveSlots((prev) =>

            [...new Set([...prev, slotIndex])].sort((a, b) => a - b)

          );

        }

        setPauseAfterCurrent(false);

        const gitHint = executionGitHint(data);

        if (data.projectCompleted) {
          setActiveSlots([]);
          setExecError(null);
          await loadExecutionState();
          if (onDashboardRefresh) await onDashboardRefresh();
          if (onProjectCompleted) await onProjectCompleted();
          return;
        }

        if (gitHint) {
          setExecError(gitHint);
          if (onProjectsRefresh) await onProjectsRefresh();
        } else if (Array.isArray(data.enqueued) && data.enqueued.length > 0) {
          setExecError(null);
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

      apiCall,

      loadExecutionState,

      onDashboardRefresh,

      onProjectsRefresh,

      onProjectCompleted,

    ]

  );



  const handleSlotStop = useCallback(

    async (slotIndex) => {

      if (!selectedProject || !canExecute || loadingSlot != null) return;

      setExecError(null);

      setLoadingSlot(slotIndex);

      try {

        const { res, data } = await apiCall(

          `Parar bot #${slotIndex}`,

          `/api/execution/${encodeURIComponent(selectedProject)}/workers/${slotIndex}/stop`,

          { method: "POST" }

        );

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

    [selectedProject, canExecute, loadingSlot, apiCall, loadExecutionState, onDashboardRefresh]

  );

  const handlePlayAll = useCallback(async () => {
    if (!selectedProject || !canExecute || loadingSlot != null) return;
    setExecError(null);
    setLoadingSlot(-1);
    try {
      const { res, data } = await apiCall(
        "Play all",
        `/api/execution/${encodeURIComponent(selectedProject)}/play-all`,
        {
          method: "POST",
          body: JSON.stringify({ macroId: macroId || selectedProject }),
        }
      );
      if (!res.ok) throw new Error(data.error || res.statusText);
      if (Array.isArray(data.workerSlots)) {
        setActiveSlots(data.workerSlots);
      }
      setPauseAfterCurrent(false);
      const gitHint = executionGitHint(data);
      if (data.projectCompleted) {
        setActiveSlots([]);
        setExecError(null);
        await loadExecutionState();
        if (onDashboardRefresh) await onDashboardRefresh();
        if (onProjectCompleted) await onProjectCompleted();
        return;
      }
      if (gitHint) {
        setExecError(gitHint);
        if (onProjectsRefresh) await onProjectsRefresh();
      } else if (Array.isArray(data.enqueued) && data.enqueued.length > 0) {
        setExecError(null);
      }
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
    apiCall,
    loadExecutionState,
    onDashboardRefresh,
    onProjectsRefresh,
    onProjectCompleted,
  ]);

  const handlePauseAll = useCallback(async () => {
    if (!selectedProject || !canExecute || loadingSlot != null) return;
    setExecError(null);
    setLoadingSlot(-1);
    try {
      const { res, data } = await apiCall(
        "Pause all",
        `/api/execution/${encodeURIComponent(selectedProject)}/pause`,
        { method: "POST" }
      );
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
    apiCall,
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



  return {
    selectedProject,
    projectCompleted,
    canExecute,
    canWrite,
    autorun,
    skipHumanApproval,
    onAutorunChange,
    onSkipHumanChange,
    gitReady,
    workspacePreparing,
    showGitUi,
    slotsMax,
    slotsInUse,
    activeJobs,
    workersStatus,
    job,
    logText,
    error,
    execError,
    isBusy,
    logScrollRef,
    logStreamStatus,
    selectedSlot,
    activeSlots,
    loadingSlot,
    pauseAfterCurrent,
    status,
    execLine,
    hasLog,
    handleSlotStart,
    handleSlotStop,
    handleSelectSlot,
    handlePlayAll,
    handlePauseAll,
    streamStatusLabel,
    truncate,
  };
}


