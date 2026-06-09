import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { statusMeta, streamStatusLabel, truncate } from "../hooks/useRunnerExecutionState.js";
import {
  MOCK_WORKERS_STATUS,
  TUTORIAL_PROJECT_SLUG,
} from "./mockData.js";

/** @type {{ id: string, steps: { at: number, patch: object }[] }[]} */
const TASK_SCHEDULES = [
  {
    id: "T-001",
    steps: [
      { at: 700, patch: { status: "planning", currentAgent: "Dev Agent" } },
      { at: 1900, patch: { status: "review", currentAgent: "QA Agent" } },
      { at: 3200, patch: { status: "done", currentAgent: "Done" } },
    ],
  },
  {
    id: "T-002",
    steps: [
      { at: 1000, patch: { status: "planning", currentAgent: "Dev Agent" } },
      { at: 2400, patch: { status: "review", currentAgent: "QA Agent" } },
      {
        at: 3900,
        patch: { status: "review", currentAgent: "Human Approval Pending" },
      },
      { at: 5200, patch: { status: "done", currentAgent: "Done" } },
    ],
  },
  {
    id: "T-003",
    steps: [
      { at: 1300, patch: { status: "planning", currentAgent: "Dev Agent" } },
      { at: 2700, patch: { status: "review", currentAgent: "QA Agent" } },
      { at: 4100, patch: { status: "done", currentAgent: "Done" } },
    ],
  },
  {
    id: "T-004",
    steps: [
      { at: 1600, patch: { status: "planning", currentAgent: "Dev Agent" } },
      { at: 3000, patch: { status: "review", currentAgent: "QA Agent" } },
      {
        at: 4500,
        patch: { status: "review", currentAgent: "Human Approval Pending" },
      },
      { at: 6000, patch: { status: "done", currentAgent: "Done" } },
    ],
  },
];

const SIMULATION_END_MS = Math.max(
  ...TASK_SCHEDULES.flatMap((s) => s.steps.map((step) => step.at))
);

/**
 * @param {{
 *   onPlayStarted?: () => void,
 *   onKanbanTick?: (updater: (tasks: object[]) => object[]) => void,
 *   autoPlayAll?: boolean,
 * }} opts
 */
export function useMockRunnerExecution(opts = {}) {
  const { onPlayStarted, onKanbanTick, autoPlayAll = false } = opts;
  const logScrollRef = useRef(null);
  const simulationTimeoutsRef = useRef([]);
  const autoPlayFiredRef = useRef(false);
  const simulationRunningRef = useRef(false);
  const [logText, setLogText] = useState("");
  const [activeSlots, setActiveSlots] = useState([]);
  const [loadingSlot, setLoadingSlot] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [job, setJob] = useState(null);

  const clearSimulationTimeouts = useCallback(() => {
    for (const id of simulationTimeoutsRef.current) {
      window.clearTimeout(id);
    }
    simulationTimeoutsRef.current = [];
  }, []);

  const appendLog = useCallback((line) => {
    setLogText((prev) => (prev ? `${prev}\n${line}` : line));
  }, []);

  const scheduleTimeout = useCallback((fn, delay) => {
    const id = window.setTimeout(fn, delay);
    simulationTimeoutsRef.current.push(id);
    return id;
  }, []);

  const simulatePlayAll = useCallback(() => {
    if (simulationRunningRef.current) return;
    simulationRunningRef.current = true;
    clearSimulationTimeouts();

    onPlayStarted?.();
    setActiveSlots([1, 2]);
    setSelectedSlot(1);
    setJob({
      id: "tutorial-job-1",
      kind: "task",
      status: "running",
      taskId: "T-001",
      workerSlot: 1,
      project: TUTORIAL_PROJECT_SLUG,
    });
    appendLog("[INFO] Play all · 4 tarefas em paralelo");
    appendLog("[INFO] Workers #1 e #2 ativos");

    const applyTaskPatch = (taskId, patch) => {
      onKanbanTick?.((tasks) =>
        tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
      );
    };

    for (const schedule of TASK_SCHEDULES) {
      for (const step of schedule.steps) {
        scheduleTimeout(() => applyTaskPatch(schedule.id, step.patch), step.at);
      }
    }

    scheduleTimeout(() => {
      appendLog("[DONE] Todas as tarefas demo concluídas");
      setJob((j) => (j ? { ...j, status: "succeeded" } : j));
      setActiveSlots([]);
      simulationRunningRef.current = false;
    }, SIMULATION_END_MS + 500);
  }, [appendLog, clearSimulationTimeouts, onKanbanTick, onPlayStarted, scheduleTimeout]);

  const startPlayAll = useCallback(() => {
    if (loadingSlot != null || simulationRunningRef.current) return;
    setLoadingSlot(-1);
    scheduleTimeout(() => {
      setLoadingSlot(null);
      simulatePlayAll();
    }, 400);
  }, [loadingSlot, scheduleTimeout, simulatePlayAll]);

  useEffect(() => {
    return () => {
      clearSimulationTimeouts();
      simulationRunningRef.current = false;
    };
  }, [clearSimulationTimeouts]);

  useEffect(() => {
    if (!autoPlayAll) {
      autoPlayFiredRef.current = false;
      return undefined;
    }
    if (autoPlayFiredRef.current) return undefined;
    autoPlayFiredRef.current = true;

    clearSimulationTimeouts();
    simulationRunningRef.current = false;
    setActiveSlots([]);
    setJob(null);

    const id = window.setTimeout(() => startPlayAll(), 750);
    return () => window.clearTimeout(id);
  }, [autoPlayAll, clearSimulationTimeouts, startPlayAll]);

  const handleSlotStart = useCallback(
    (slotIndex) => {
      if (loadingSlot != null || simulationRunningRef.current) return;
      setLoadingSlot(slotIndex);
      scheduleTimeout(() => {
        setLoadingSlot(null);
        simulatePlayAll();
      }, 400);
    },
    [loadingSlot, scheduleTimeout, simulatePlayAll]
  );

  const handlePlayAll = useCallback(() => {
    startPlayAll();
  }, [startPlayAll]);

  const handleSlotStop = useCallback(() => {
    clearSimulationTimeouts();
    simulationRunningRef.current = false;
    setActiveSlots([]);
    setJob(null);
    appendLog("[WARN] Execução demo pausada");
  }, [appendLog, clearSimulationTimeouts]);

  const handlePauseAll = useCallback(() => {
    handleSlotStop();
  }, [handleSlotStop]);

  const handleSelectSlot = useCallback((_jobId, slotIndex) => {
    setSelectedSlot(slotIndex);
  }, []);

  const status = job ? statusMeta(job.status) : statusMeta(null);
  const hasLog = Boolean(logText?.trim());
  const anyActive = activeSlots.length > 0;

  return useMemo(
    () => ({
      selectedProject: TUTORIAL_PROJECT_SLUG,
      projectCompleted: false,
      canExecute: true,
      canWrite: true,
      autorun: false,
      skipHumanApproval: true,
      onAutorunChange: () => {},
      onSkipHumanChange: () => {},
      gitReady: true,
      workspacePreparing: false,
      showGitUi: true,
      slotsMax: 2,
      slotsInUse: activeSlots.length,
      activeJobs: job ? [job] : [],
      workersStatus: MOCK_WORKERS_STATUS,
      job,
      logText,
      error: null,
      execError: null,
      isBusy: anyActive,
      logScrollRef,
      logStreamStatus: "connected",
      selectedSlot,
      activeSlots,
      loadingSlot,
      pauseAfterCurrent: false,
      status,
      execLine: anyActive
        ? `${activeSlots.length} workers ativos`
        : "Nenhum worker ativo — use ▶ para começar",
      hasLog,
      handleSlotStart,
      handleSlotStop,
      handleSelectSlot,
      handlePlayAll,
      handlePauseAll,
      streamStatusLabel,
      truncate,
    }),
    [
      activeSlots,
      anyActive,
      handlePauseAll,
      handlePlayAll,
      handleSelectSlot,
      handleSlotStart,
      handleSlotStop,
      hasLog,
      job,
      loadingSlot,
      logText,
      selectedSlot,
      status,
    ]
  );
}
