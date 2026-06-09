/** @typedef {'not_started'|'started'|'completed'} ProjectLifecycleStatus */

/** @type {Record<ProjectLifecycleStatus, { colorClass: string, iconBg: string, iconBorder: string, settingsHover: string }>} */
export const PROJECT_LIFECYCLE_PALETTE = {
  not_started: {
    colorClass: "text-blue-300",
    iconBg: "linear-gradient(135deg,rgba(30,58,138,0.35),rgba(15,23,42,0.28))",
    iconBorder: "1px solid rgba(59,130,246,0.32)",
    settingsHover: "hover:bg-blue-500/20",
  },
  started: {
    colorClass: "text-amber-300",
    iconBg: "linear-gradient(135deg,rgba(245,158,11,0.24),rgba(234,179,8,0.14))",
    iconBorder: "1px solid rgba(245,158,11,0.32)",
    settingsHover: "hover:bg-amber-500/20",
  },
  completed: {
    colorClass: "text-emerald-300",
    iconBg: "linear-gradient(135deg,rgba(34,197,94,0.22),rgba(16,185,129,0.14))",
    iconBorder: "1px solid rgba(34,197,94,0.3)",
    settingsHover: "hover:bg-emerald-500/20",
  },
};

/**
 * @param {object|string|null|undefined} project
 * @param {{ projectCompleted?: boolean, microCount?: number }|null} [scopeState]
 * @returns {ProjectLifecycleStatus}
 */
export function resolveProjectLifecycleStatus(project, scopeState = null) {
  if (scopeState?.projectCompleted) return "completed";
  if (typeof project === "object" && project?.status === "completed") {
    return "completed";
  }

  if (scopeState) {
    return (scopeState.microCount ?? 0) > 0 ? "started" : "not_started";
  }

  if (typeof project === "object" && project?.lifecycleStatus) {
    return project.lifecycleStatus;
  }

  return "not_started";
}

/**
 * @param {object|string|null|undefined} project
 * @param {{ projectCompleted?: boolean }|null} [scopeState]
 */
export function getProjectFolderPalette(project, scopeState = null) {
  const status = resolveProjectLifecycleStatus(project, scopeState);
  return PROJECT_LIFECYCLE_PALETTE[status] || PROJECT_LIFECYCLE_PALETTE.not_started;
}
