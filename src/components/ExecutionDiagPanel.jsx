import React, { useState } from "react";
import { getApiBase } from "../api.js";
import {
  describeGitPipeline,
  formatDiagTime,
  gitStatusLabel,
} from "../lib/executionDiag.js";

/**
 * @param {{
 *   projectMeta?: object|null,
 *   entries: Array<{
 *     at: Date,
 *     label: string,
 *     method?: string,
 *     path?: string,
 *     status?: number,
 *     ok?: boolean,
 *     message?: string,
 *     extra?: string,
 *     phase?: string,
 *     code?: string,
 *   }>,
 *   wsConnected?: boolean,
 *   activeSlots?: number[],
 *   execError?: string|null,
 * }} props
 */
export default function ExecutionDiagPanel({
  projectMeta = null,
  entries = [],
  wsConnected = false,
  activeSlots = [],
  execError = null,
}) {
  const [open, setOpen] = useState(true);
  const pipeline = describeGitPipeline(projectMeta);
  const apiBase = getApiBase();
  const apiLabel = apiBase || "(mesmo host — proxy /api)";

  return (
    <section className="runner-sidebar__diag" aria-label="Diagnóstico execução">
      <button
        type="button"
        className="runner-sidebar__diag-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Diagnóstico {open ? "▾" : "▸"}
      </button>

      {open && (
        <div className="runner-sidebar__diag-body">
          <dl className="runner-sidebar__diag-kv">
            <div>
              <dt>API</dt>
              <dd title={apiBase || window.location.origin}>{apiLabel}</dd>
            </div>
            <div>
              <dt>WebSocket</dt>
              <dd className={wsConnected ? "runner-sidebar__diag-ok" : "runner-sidebar__diag-warn"}>
                {wsConnected ? "ligado" : "offline"}
              </dd>
            </div>
            <div>
              <dt>Git</dt>
              <dd>
                {gitStatusLabel(projectMeta?.gitStatus)}
                {projectMeta?.repoMode ? ` (${projectMeta.repoMode})` : ""}
              </dd>
            </div>
            <div>
              <dt>Passo</dt>
              <dd>{pipeline.detail}</dd>
            </div>
            {projectMeta?.gitLastError && (
              <div>
                <dt>Erro Git</dt>
                <dd className="runner-sidebar__diag-err">{projectMeta.gitLastError}</dd>
              </div>
            )}
            {projectMeta?.repoFullName && (
              <div>
                <dt>Repo</dt>
                <dd>{projectMeta.repoFullName}</dd>
              </div>
            )}
            <div>
              <dt>Slots Play</dt>
              <dd>
                {activeSlots.length > 0
                  ? activeSlots.map((s) => `#${s}`).join(", ")
                  : "nenhum"}
              </dd>
            </div>
          </dl>

          {execError && (
            <p className="runner-sidebar__diag-last-err">
              Último erro UI: {execError}
            </p>
          )}

          {entries.length > 0 ? (
            <ol className="runner-sidebar__diag-log" reversed>
              {entries.map((e, i) => (
                <li
                  key={`${e.at?.getTime?.() ?? i}-${e.label}`}
                  className={
                    e.ok === false
                      ? "runner-sidebar__diag-log-item--fail"
                      : e.ok === true
                        ? "runner-sidebar__diag-log-item--ok"
                        : ""
                  }
                >
                  <span className="runner-sidebar__diag-log-time">
                    {formatDiagTime(e.at)}
                  </span>{" "}
                  <strong>{e.label}</strong>
                  {e.method && e.path && (
                    <span className="runner-sidebar__diag-log-req">
                      {" "}
                      {e.method} {e.path}
                      {e.status != null ? ` → ${e.status}` : ""}
                    </span>
                  )}
                  {e.message && (
                    <span className="runner-sidebar__diag-log-msg"> — {e.message}</span>
                  )}
                  {(e.phase || e.code || e.extra) && (
                    <span className="runner-sidebar__diag-log-extra">
                      {" "}
                      (
                      {[e.phase && `fase ${e.phase}`, e.code, e.extra]
                        .filter(Boolean)
                        .join(" · ")}
                      )
                    </span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="runner-sidebar__diag-empty msg msg--muted">
              Sem eventos ainda — use Play ou ▶ num bot.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
