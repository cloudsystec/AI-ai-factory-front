/**
 * UI do pipeline de tasks (cópia de orchestrator/task-pipeline-state.js — sem depender do CLI).
 */
export const PIPELINE_STEPS = [
  { key: "planning", label: "Plano", short: "📋" },
  { key: "development", label: "Dev", short: "⚙" },
  { key: "test_run", label: "Testes", short: "🧪" },
  { key: "qa", label: "QA", short: "✅" },
  { key: "review", label: "Revisão", short: "👁" },
  { key: "done", label: "Entrega", short: "🚀" },
];

const INTERMEDIATE_HIDDEN_KEYS = new Set(["test_run", "qa"]);

/**
 * @param {{ isMicroCloser?: boolean } | null | undefined} task
 */
export function getPipelineStepsForTask(task) {
  if (task?.isMicroCloser) return PIPELINE_STEPS;
  return PIPELINE_STEPS.filter((s) => !INTERMEDIATE_HIDDEN_KEYS.has(s.key));
}

/**
 * @param {{ status?: string, currentAgent?: string, isMicroCloser?: boolean, lastCompletedStep?: string } | null | undefined} task
 */
export function getActiveStepIndex(task) {
  if (!task || task.status === "blocked") return -1;
  const steps = getPipelineStepsForTask(task);
  const { status, currentAgent } = task;
  const agent = String(currentAgent || "");
  const isCloser = task.isMicroCloser === true;

  if (status === "done") return steps.length - 1;
  if (status === "review") {
    const idx = steps.findIndex((s) => s.key === "review");
    return idx >= 0 ? idx : steps.length - 2;
  }
  if (status === "running" || status === "in_progress") {
    if (isCloser && agent.includes("QA")) {
      return steps.findIndex((s) => s.key === "qa");
    }
    if (agent.includes("Dev") || agent.includes("Planner")) {
      return steps.findIndex((s) => s.key === "development");
    }
    if (isCloser && task.lastCompletedStep === "qa") {
      return steps.findIndex((s) => s.key === "review");
    }
    if (isCloser && task.lastCompletedStep === "dev") {
      return steps.findIndex((s) => s.key === "test_run");
    }
    return steps.findIndex((s) => s.key === "development");
  }
  if (status === "testing") {
    if (isCloser && agent.includes("QA")) {
      return steps.findIndex((s) => s.key === "qa");
    }
    if (isCloser) return steps.findIndex((s) => s.key === "test_run");
    return steps.findIndex((s) => s.key === "development");
  }
  if (status === "development") return steps.findIndex((s) => s.key === "development");
  if (status === "planning") return steps.findIndex((s) => s.key === "planning");
  return -2;
}

/**
 * @param {{ status?: string, currentAgent?: string, isMicroCloser?: boolean } | null | undefined} task
 * @param {number} stepIndex
 */
export function getStepVisualState(task, stepIndex) {
  if (!task) return "pending";

  if (task.status === "blocked") {
    return "pending";
  }

  const active = getActiveStepIndex(task);

  if (task.status === "done") {
    return "completed";
  }

  if (active === -2) {
    return "pending";
  }

  if (stepIndex < active) return "completed";
  if (stepIndex === active) return "active";
  return "pending";
}

/**
 * @param {{ status?: string } | null | undefined} task
 */
export function isPipelineRunning(task) {
  if (!task || task.status === "blocked") return false;
  return [
    "in_progress",
    "running",
    "planning",
    "development",
    "testing",
    "review",
  ].includes(task.status);
}

/**
 * @param {{ status?: string, currentAgent?: string, isMicroCloser?: boolean } | null | undefined} runtime
 */
export function buildPipelineSummary(runtime) {
  const stepsDef = getPipelineStepsForTask(runtime);
  const activeStepIndex = runtime ? getActiveStepIndex(runtime) : -2;
  const steps = stepsDef.map((step, i) => ({
    key: step.key,
    label: step.label,
    short: step.short,
    state: getStepVisualState(runtime, i),
  }));
  const activeStep =
    activeStepIndex >= 0 && activeStepIndex < stepsDef.length
      ? stepsDef[activeStepIndex]
      : null;
  return {
    activeStepIndex,
    activeLabel: activeStep?.label ?? null,
    steps,
  };
}
