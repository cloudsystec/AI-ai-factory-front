/** Modos em que o GitHub do cliente está ligado (UI Git/PR visível). */
const CLIENT_REPO_MODES = new Set(["client", "existing", "created"]);

/**
 * @param {object|null|undefined} meta
 */
export function isClientGitConnected(meta) {
  if (!meta || typeof meta !== "object") return false;
  return CLIENT_REPO_MODES.has(String(meta.repoMode || ""));
}

/**
 * Play permitido: sem Git ainda ou workspace pronto.
 * @param {object|null|undefined} meta
 */
export function isGitReadyForPlay(meta) {
  if (!meta || typeof meta !== "object") return false;
  const s = meta.gitStatus;
  if (s === "ready" || s === "not_connected") return true;
  return false;
}

/**
 * @param {object|null|undefined} meta
 */
export function isWorkspacePreparing(meta) {
  if (!meta || typeof meta !== "object") return false;
  return ["pending", "provisioning", "migrating"].includes(
    String(meta.gitStatus || "")
  );
}

/**
 * @param {object|null|undefined} meta
 */
export function canDisconnectClientGit(meta) {
  if (!meta || typeof meta !== "object") return false;
  if (!isClientGitConnected(meta)) return false;
  if (isWorkspacePreparing(meta)) return false;
  return meta.gitStatus === "ready";
}

/**
 * @param {object|null|undefined} meta
 */
export function canConnectClientGit(meta) {
  if (!meta || typeof meta !== "object") return false;
  if (meta.status === "completed") return false;
  const mode = String(meta.repoMode || "");
  return mode === "managed" || meta.gitStatus === "not_connected";
}

/**
 * @param {string|null|undefined} kind
 * @param {boolean} showGitUi
 */
export function jobKindLabel(kind, showGitUi = true) {
  if (!showGitUi) {
    if (kind === "tech-lead-review") return "Revisão";
    if (kind === "micro-release") return "Integração";
  }
  const labels = {
    scope: "Escopo",
    "scope-tasks-only": "Onda",
    develop: "Fila",
    task: "Task",
    provision: "Provision",
    "git-migrate": "Migração",
    "tech-lead-review": "TL review",
    "micro-integration-qa": "QA micro",
    "micro-release": "Release",
  };
  return labels[kind] || kind || "Job";
}
