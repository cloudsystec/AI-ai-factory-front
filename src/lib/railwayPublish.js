import { apiFetch } from "../api.js";

/**
 * @param {string} projectSlug
 */
export async function startRailwayPublish(projectSlug) {
  const res = await apiFetch(
    `/api/projects/${encodeURIComponent(projectSlug)}/railway-publish`,
    { method: "POST" }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText || "Falha ao iniciar publicação");
  }
  return res.json();
}

/**
 * @param {string} projectSlug
 */
export async function fetchRailwayPublishStatus(projectSlug) {
  const res = await apiFetch(
    `/api/projects/${encodeURIComponent(projectSlug)}/railway-publish`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText || "Falha ao obter estado");
  }
  return res.json();
}

/**
 * @param {string} status
 */
export function railwayPublishStatusLabel(status) {
  const map = {
    idle: "Pronto para publicar",
    analyzing: "Publicação em andamento",
    syncing: "Publicação em andamento",
    provisioning: "Publicação em andamento",
    verifying: "Publicação em andamento",
    deployed: "Publicado com sucesso",
    failed: "Publicação falhou",
    not_deployable: "Publicação falhou",
  };
  return map[status] || status || "—";
}

const ACTIVE_DEPLOY_STATUSES = new Set([
  "analyzing",
  "syncing",
  "provisioning",
  "verifying",
]);

/**
 * @param {object|null|undefined} data
 */
export function isPublishInProgress(data) {
  if (!data) return false;
  if (data.jobStatus === "queued" || data.jobStatus === "running") return true;
  if (ACTIVE_DEPLOY_STATUSES.has(data.status)) return true;
  return false;
}

/**
 * @param {object|null|undefined} data
 * @returns {"idle"|"waiting"|"progress"|"success"|"error"}
 */
export function publishUiTone(data) {
  if (!data || data.status === "idle") return "idle";
  if (data.jobStatus === "queued") return "waiting";
  if (data.jobStatus === "running" || isPublishInProgress(data)) return "progress";
  if (data.status === "deployed" && data.publicUrl) return "success";
  if (data.status === "failed" || data.jobStatus === "failed") return "error";
  if (data.status === "not_deployable") return "error";
  if (data.status === "deployed") return "success";
  return "idle";
}

/**
 * @param {object|null|undefined} data
 */
export function publishButtonLabel(data, { loading = false } = {}) {
  if (loading) return "A iniciar…";
  if (!data) return "Publicar";
  const tone = publishUiTone(data);
  if (tone === "progress") return "A publicar…";
  if (tone === "waiting") return "Na fila…";
  if (tone === "success") return "Republicar";
  if (tone === "error") return "Tentar novamente";
  return "Publicar";
}
