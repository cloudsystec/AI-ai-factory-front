import { apiFetch } from "../api.js";

/**
 * @param {string} projectSlug
 */
export async function startGitDisconnect(projectSlug) {
  const res = await apiFetch(
    `/api/projects/${encodeURIComponent(projectSlug)}/disconnect-git`,
    { method: "POST" }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || res.statusText || "Falha ao desconectar Git");
  }
  return body;
}

/**
 * @param {string} projectSlug
 */
export async function fetchGitDisconnectStatus(projectSlug) {
  const res = await apiFetch(
    `/api/projects/${encodeURIComponent(projectSlug)}/disconnect-git`,
    { cache: "no-store" }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || res.statusText || "Falha ao obter estado");
  }
  return body;
}

/**
 * @param {string} phase
 */
export function gitDisconnectPhaseLabel(phase) {
  const map = {
    idle: "",
    client: "",
    provisioning: "A reprovisionar repo da plataforma…",
    ready: "Git da plataforma ativo",
    failed: "Desconexão / provision falhou",
  };
  return map[phase] || phase || "";
}

/**
 * @param {object|null|undefined} data
 */
export function isGitDisconnectBusy(data) {
  if (!data) return false;
  return data.phase === "provisioning";
}

/**
 * @param {object|null|undefined} data
 * @returns {"idle"|"waiting"|"progress"|"success"|"error"}
 */
export function gitDisconnectUiTone(data) {
  if (!data) return "idle";
  if (data.phase === "ready") return "success";
  if (data.phase === "failed") return "error";
  if (data.phase === "provisioning" && data.jobStatus === "queued") return "waiting";
  if (data.phase === "provisioning") return "progress";
  return "idle";
}
