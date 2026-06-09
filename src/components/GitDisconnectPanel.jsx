import React from "react";
import {
  gitDisconnectPhaseLabel,
  gitDisconnectUiTone,
} from "../lib/gitDisconnect.js";
import { canDisconnectClientGit } from "../lib/projectGit.js";

/**
 * @param {{
 *   projectMeta?: object|null,
 *   status?: object|null,
 *   error?: string|null,
 *   loading?: boolean,
 *   busy?: boolean,
 *   runningCount?: number,
 *   onDisconnect?: () => void | Promise<void>,
 *   showButton?: boolean,
 *   compact?: boolean,
 * }} props
 */
export default function GitDisconnectPanel({
  projectMeta = null,
  status = null,
  error = null,
  loading = false,
  busy = false,
  runningCount = 0,
  onDisconnect,
  showButton = true,
  compact = false,
}) {
  const canDisconnect = canDisconnectClientGit(projectMeta);
  const tone = gitDisconnectUiTone(status);
  const showPanel =
    tone !== "idle" ||
    error ||
    loading ||
    (canDisconnect && status?.phase === "client");

  const buttonDisabled = loading || busy || runningCount > 0;

  if (compact) {
    if (!canDisconnect || !onDisconnect) return null;
    return (
      <button
        type="button"
        className="project-bar__icon-btn project-bar__icon-btn--git-off"
        disabled={buttonDisabled}
        onClick={() => onDisconnect().catch(() => {})}
        title={
          runningCount > 0
            ? "Aguarde o fim das tarefas em execução"
            : "Desconectar GitHub e voltar ao repo da plataforma"
        }
      >
        − Git
      </button>
    );
  }

  if (!canDisconnect && !showPanel) return null;

  const showStatusPanel = showPanel && (tone !== "idle" || error);

  return (
    <div className="git-disconnect-panel">
      {showButton && canDisconnect && onDisconnect && (
        <button
          type="button"
          className="toolbar-btn project-bar__git-disconnect"
          disabled={buttonDisabled}
          onClick={() => onDisconnect().catch(() => {})}
          title={
            runningCount > 0
              ? "Aguarde o fim das tarefas em execução"
              : "Desconectar GitHub e voltar ao repo da plataforma"
          }
        >
          {loading
            ? "A iniciar…"
            : busy
              ? "A desconectar…"
              : "Desconectar Git (repo plataforma)"}
        </button>
      )}

      {showStatusPanel && (
        <div
          className={`publish-status publish-status--${tone} publish-status--compact`}
          role="status"
          aria-live="polite"
        >
          <p className="publish-status__title">
            {tone === "success" && "✓ "}
            {tone === "error" && "✗ "}
            {tone === "waiting" && "⏳ "}
            {tone === "progress" && "↻ "}
            {error
              ? "Erro ao desconectar"
              : gitDisconnectPhaseLabel(status?.phase) || "A processar…"}
          </p>

          {status?.hint && tone !== "success" && (
            <p className="publish-status__hint">{status.hint}</p>
          )}

          {status?.jobId && tone !== "success" && (
            <p className="publish-status__meta">
              Job provision
              {status.jobStatus ? ` · ${status.jobStatus}` : ""}
              {status.jobId ? ` · ${String(status.jobId).slice(0, 8)}…` : ""}
            </p>
          )}

          {(error || status?.lastError) &&
            (tone === "error" || tone === "waiting") && (
              <p className="publish-status__error">
                {error || status?.lastError}
              </p>
            )}
        </div>
      )}
    </div>
  );
}
