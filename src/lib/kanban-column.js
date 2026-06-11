export const KANBAN_COLUMN_KEYS = [
  "todo",
  "development",
  "testing",
  "human_approval",
  "done",
  "blocked",
];

const KANBAN_COLUMN_SET = new Set(KANBAN_COLUMN_KEYS);

const PAUSE_STEP_TO_COLUMN = {
  dev: "testing",
  qa: "done",
};

const STATUS_TO_COLUMN = {
  todo: "todo",
  in_progress: "development",
  pending_validation: "todo",
  needs_refinement: "todo",
  planning: "development",
  development: "development",
  testing: "testing",
  review: "testing",
  done: "done",
  blocked: "blocked",
  paused: "development",
  running: "development",
};

function normalizeAgent(agent) {
  return String(agent || "").trim();
}

function inferColumnFromAgent(task) {
  const agent = normalizeAgent(task.currentAgent);
  if (agent === "Human Approval Pending") return "human_approval";
  if (agent.includes("Planner")) return "development";
  if (agent.includes("Dev")) return "development";
  if (task.isMicroCloser && (agent.includes("QA") || agent.includes("Test"))) {
    return "testing";
  }
  if (task.isMicroCloser && agent.includes("Reviewer")) return "testing";
  if (agent === "Done") return "done";
  return null;
}

function inferColumnFromLastStep(task) {
  const step = task.lastCompletedStep;
  if (step === "dev" && !task.isMicroCloser) return "development";
  if (step && task.isMicroCloser && PAUSE_STEP_TO_COLUMN[step]) {
    return PAUSE_STEP_TO_COLUMN[step];
  }
  if (step === "dev") return "development";
  if (step === "qa") return "testing";
  if (step === "finalize") return "testing";
  return null;
}

/** Coluna Kanban (pode divergir de `status` quando `status` é done). */
export function getKanbanColumn(task) {
  if (!task || typeof task !== "object") return "todo";

  if (task.blockReason === "infra" && task.failedStep === "finalize") {
    return "testing";
  }
  if (task.status === "blocked" || task.blockReason) {
    return "blocked";
  }
  if (task.status === "paused") {
    return (
      PAUSE_STEP_TO_COLUMN[task.lastCompletedStep] ||
      inferColumnFromLastStep(task) ||
      "development"
    );
  }
  if (normalizeAgent(task.currentAgent) === "Human Approval Pending") {
    return "human_approval";
  }
  if (task.status === "done") {
    return "done";
  }
  if (task.status === "running") {
    return (
      inferColumnFromLastStep(task) ||
      inferColumnFromAgent(task) ||
      STATUS_TO_COLUMN.running
    );
  }

  const mapped = STATUS_TO_COLUMN[task.status];
  if (mapped) return mapped;

  const fromAgent = inferColumnFromAgent(task);
  if (fromAgent) return fromAgent;

  return "development";
}

/**
 * Garante coluna válida para render no quadro (nunca deixa card órfão).
 * @param {object} task
 * @param {string[]} [columnKeys]
 */
export function resolveKanbanColumn(task, columnKeys = KANBAN_COLUMN_KEYS) {
  const col = getKanbanColumn(task);
  const allowed = columnKeys?.length
    ? new Set(columnKeys)
    : KANBAN_COLUMN_SET;
  return allowed.has(col) ? col : "development";
}
