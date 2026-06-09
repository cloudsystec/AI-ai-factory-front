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
    return { step: "—", detail: "Projeto não selecionado" };
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
  if (data?.hint && data.hint !== data?.error) parts.push(String(data.hint));
  return parts.filter(Boolean).join(" · ") || `HTTP ${res.status}`;
}

/**
 * Respostas de execução devolvem 200 mesmo quando nada foi enfileirado (hint no body).
 * @param {Response} res
 * @param {object} data
 */
export function summarizeExecutionResponse(res, data) {
  const enqueued = Array.isArray(data?.enqueued) ? data.enqueued.length : null;
  const hint = data?.hint ? String(data.hint).trim() : "";
  const err = data?.error ? String(data.error).trim() : "";
  const phase = data?.phase ? String(data.phase) : "";
  const code = data?.code ? String(data.code) : "";
  const gitStatus = data?.gitStatus ?? data?.git_status ?? null;
  const gitLastError = data?.gitLastError ?? data?.git_last_error ?? null;

  const extraParts = [];
  if (phase) extraParts.push(`fase: ${phase}`);
  if (code) extraParts.push(code);
  if (gitStatus) extraParts.push(`git=${gitStatus}`);
  if (gitLastError && gitLastError !== hint) {
    extraParts.push(String(gitLastError));
  }
  if (Array.isArray(data?.enqueued) && data.enqueued.length) {
    const kinds = data.enqueued.map((j) => j.kind || "?").join(", ");
    extraParts.push(`jobs: ${kinds}`);
  }
  if (Array.isArray(data?.workerSlots) && data.workerSlots.length) {
    extraParts.push(`slots ${data.workerSlots.join(",")}`);
  }

  if (!res.ok) {
    return {
      ok: false,
      message: formatApiFailure(res, data),
      extra: extraParts.join(" · ") || undefined,
      gitStatus,
      gitLastError,
      phase,
      code,
    };
  }

  if (hint && (enqueued === 0 || enqueued == null)) {
    return {
      ok: false,
      message: hint,
      extra: extraParts.filter(Boolean).join(" · ") || undefined,
      gitStatus,
      gitLastError,
      phase,
      code,
    };
  }

  if (err && enqueued === 0) {
    return {
      ok: false,
      message: err,
      extra: extraParts.join(" · ") || undefined,
      gitStatus,
      gitLastError,
      phase,
      code,
    };
  }

  const message =
    enqueued != null
      ? `${enqueued} job(s) enfileirado(s)${hint ? ` — ${hint}` : ""}`
      : hint || "ok";

  return {
    ok: true,
    message,
    extra: extraParts.length ? extraParts.join(" · ") : undefined,
    gitStatus,
    gitLastError,
    phase,
    code,
  };
}

/**
 * @param {object} data
 */
export function executionGitHint(data) {
  if (!data || typeof data !== "object") return null;
  const hint = data.hint || data.gitLastError || data.git_last_error;
  if (!hint) return null;
  const enqueued = Array.isArray(data.enqueued) ? data.enqueued.length : 0;
  if (enqueued > 0) return null;
  return String(hint);
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
