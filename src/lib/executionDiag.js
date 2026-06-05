/**
 * Rótulos e helpers para o painel de diagnóstico da execução.
 */

const GIT_STATUS_LABELS = {
  not_connected: "Sem Git — Play cria repo managed",
  pending: "Repo criado — aguarda provision",
  provisioning: "Provision Git em curso (worker)",
  migrating: "A migrar para Git do cliente",
  ready: "Git pronto",
  failed: "Git falhou",
};

/**
 * @param {string|null|undefined} status
 */
export function gitStatusLabel(status) {
  const s = String(status || "").trim();
  return GIT_STATUS_LABELS[s] || s || "—";
}

/**
 * @param {object|null|undefined} meta
 */
export function describeGitPipeline(meta) {
  if (!meta || typeof meta !== "object") {
    return { step: "—", detail: "Projecto não seleccionado" };
  }
  const status = String(meta.gitStatus || "");
  const mode = String(meta.repoMode || "");
  const step = gitStatusLabel(status);

  if (status === "not_connected") {
    return {
      step,
      detail: "Play → back cria repo na org (GitHub App + PEM no Railway)",
    };
  }
  if (status === "pending" || status === "provisioning") {
    return {
      step,
      detail: "Worker CLI faz clone/push (.git-cache) — precisa BACK_URL + token do back",
    };
  }
  if (status === "ready" && mode === "managed") {
    return { step, detail: "Pode enfileirar scope / tasks" };
  }
  if (status === "ready") {
    return { step, detail: "Git do cliente ligado" };
  }
  if (status === "failed" && meta.gitLastError) {
    return { step, detail: String(meta.gitLastError) };
  }
  return { step, detail: mode ? `Modo: ${mode}` : "—" };
}

/**
 * @param {Response} res
 * @param {object} data
 */
export function formatApiFailure(res, data) {
  const parts = [];
  if (data?.error) parts.push(String(data.error));
  else if (!res.ok) parts.push(res.statusText || `HTTP ${res.status}`);
  if (data?.code) parts.push(`[${data.code}]`);
  if (data?.hint && data.hint !== data?.error) parts.push(`hint: ${data.hint}`);
  return parts.filter(Boolean).join(" · ") || `HTTP ${res.status}`;
}

/**
 * @param {Date} at
 */
export function formatDiagTime(at) {
  try {
    return at.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}
