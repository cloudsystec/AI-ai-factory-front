import React, { useCallback, useEffect, useState } from "react";
import MarkdownPreview from "./MarkdownPreview.jsx";
import AppModal from "./components/AppModal.jsx";
import { buildPipelineSummary, isPipelineRunning } from "./pipeline.js";
import { apiFetch } from "./api.js";
import { useSocket } from "./useSocket.jsx";

function formatUpdated(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

/** @param {unknown} value */
function formatMarkdownField(value) {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) {
    const lines = value
      .map((item) => (typeof item === "string" ? item.trim() : String(item)))
      .filter(Boolean);
    return lines.length > 0 ? lines.map((line) => `- ${line}`).join("\n") : null;
  }
  return String(value);
}

function pipelineStepIcon(state) {
  if (state === "completed") return "✓";
  if (state === "active") return "●";
  return "○";
}

function ArtifactRow({ artifact }) {
  return (
    <li className="task-detail-artifact">
      <span className="task-detail-artifact__status" aria-hidden>
        {artifact.exists ? "✓" : "—"}
      </span>
      <div className="task-detail-artifact__body">
        <div className="task-detail-artifact__head">
          <span className="task-detail-artifact__label">{artifact.label}</span>
          <code className="task-detail-artifact__path">{artifact.path}</code>
        </div>
        {artifact.kind === "qaVerdict" && artifact.exists && (
          <p className="task-detail-artifact__verdict">
            Veredito: <strong>{artifact.verdict ?? "?"}</strong>
            {artifact.summary ? ` — ${artifact.summary}` : ""}
          </p>
        )}
        {artifact.preview && (
          <details className="task-detail-artifact__preview">
            <summary>Pré-visualização</summary>
            {artifact.kind === "testEvidence" ? (
              <pre className="task-detail-plain">{artifact.preview}</pre>
            ) : (
              <MarkdownPreview content={artifact.preview} className="md-preview--compact" />
            )}
          </details>
        )}
      </div>
    </li>
  );
}

/** @param {{ project: string, taskId: string, runtimeSnapshot: object|null, onClose: () => void }} props */
export default function TaskDetailModal({
  project,
  taskId,
  runtimeSnapshot,
  onClose,
}) {
  const { subscribe } = useSocket();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    const q = new URLSearchParams({ project, taskId });
    const response = await apiFetch(`/api/task-detail?${q}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || response.statusText);
    }
    return response.json();
  }, [project, taskId]);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const data = await fetchDetail();
        if (!cancelled) {
          setDetail(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          if (!runtimeSnapshot) {
            setError(e.message || String(e));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchDetail, taskId, project]);

  const running =
    isPipelineRunning(runtimeSnapshot) ||
    (detail?.runtime && isPipelineRunning(detail.runtime));

  useEffect(() => {
    const unsub = subscribe("dashboard", () => {
      fetchDetail()
        .then((data) => { setDetail(data); setError(null); })
        .catch(() => {});
    });
    const fallback = running
      ? setInterval(() => {
          fetchDetail()
            .then((data) => { setDetail(data); setError(null); })
            .catch(() => {});
        }, 30_000)
      : null;
    return () => { unsub(); if (fallback) clearInterval(fallback); };
  }, [subscribe, fetchDetail, running]);

  useEffect(() => {
    const snap = runtimeSnapshot;
    if (!snap?.updatedAt && !snap?.status && !snap?.currentAgent) return;
    fetchDetail()
      .then((data) => { setDetail(data); setError(null); })
      .catch(() => {});
  }, [
    runtimeSnapshot?.updatedAt,
    runtimeSnapshot?.status,
    runtimeSnapshot?.currentAgent,
    fetchDetail,
    taskId,
  ]);

  const runtime = detail?.runtime ?? runtimeSnapshot;
  const title =
    detail?.backlog?.title ?? runtime?.title ?? runtimeSnapshot?.title ?? taskId;
  const pipeline =
    detail?.pipeline ??
    (runtime ? buildPipelineSummary(runtime) : null);
  const partialOnly = !detail && Boolean(runtimeSnapshot);

  return (
    <AppModal
      variant="task"
      eyebrow={taskId}
      title={title}
      titleId="task-detail-title"
      onClose={onClose}
    >
      <div className="modal-panel__body">
          {loading && !detail && !runtimeSnapshot && (
            <p className="msg msg--muted">Carregando detalhe…</p>
          )}
          {error && !detail && !runtimeSnapshot && (
            <p className="msg msg--error">{error}</p>
          )}
          {partialOnly && !loading && (
            <p className="msg msg--muted">
              Visão parcial do Kanban — sincronizando descrição e artefatos…
            </p>
          )}

          {(detail || runtimeSnapshot) && (
            <>
              <section className="task-detail-section">
                <h3 className="task-detail-section__title">Execução</h3>
                {!runtime ? (
                  <p className="msg msg--muted">
                    Sem entrada em <code>tasks-state.json</code> — task ainda não executada
                    pelo <code>run-task</code>.
                  </p>
                ) : (
                  <dl className="task-detail-dl">
                    <div>
                      <dt>Status</dt>
                      <dd>
                        <code>{runtime.status}</code>
                        {running && (
                          <span className="pipeline-live-badge task-detail-live">
                            <span className="pipeline-live-badge__dot" aria-hidden />
                            Em execução
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Agente atual</dt>
                      <dd>{runtime.currentAgent || "—"}</dd>
                    </div>
                    <div>
                      <dt>Atualizado</dt>
                      <dd>{formatUpdated(runtime.updatedAt)}</dd>
                    </div>
                  </dl>
                )}

                {pipeline?.steps?.length > 0 && (
                  <ul className="task-detail-pipeline-list" aria-label="Passos do pipeline">
                    {pipeline.steps.map((step) => (
                      <li
                        key={step.key}
                        className={`task-detail-pipeline-step task-detail-pipeline-step--${step.state}`}
                      >
                        <span aria-hidden>{pipelineStepIcon(step.state)}</span>
                        {step.label}
                        {step.state === "active" && (
                          <span className="task-detail-pipeline-step__now"> (agora)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {detail?.backlog && (
                <section className="task-detail-section">
                  <h3 className="task-detail-section__title">Backlog</h3>
                  <dl className="task-detail-dl">
                    <div>
                      <dt>Micro</dt>
                      <dd>
                        <code>{detail.backlog.sourceMicroId ?? "—"}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Status backlog</dt>
                      <dd>
                        <code>{detail.backlog.status ?? "—"}</code>
                        {detail.backlog.approved != null && (
                          <> · approved={String(detail.backlog.approved)}</>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Validação TL</dt>
                      <dd>{detail.backlog.validationStatus ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Prioridade</dt>
                      <dd>{detail.backlog.priority ?? "—"}</dd>
                    </div>
                    {detail.backlog.dependencies?.length > 0 && (
                      <div>
                        <dt>Dependências</dt>
                        <dd>{detail.backlog.dependencies.join(", ")}</dd>
                      </div>
                    )}
                  </dl>
                  {formatMarkdownField(detail.backlog.description) && (
                    <div className="task-detail-block">
                      <h4>Descrição</h4>
                      <MarkdownPreview
                        content={formatMarkdownField(detail.backlog.description)}
                      />
                    </div>
                  )}
                  {formatMarkdownField(detail.backlog.acceptance) && (
                    <div className="task-detail-block">
                      <h4>Critérios de aceite</h4>
                      <MarkdownPreview
                        content={formatMarkdownField(detail.backlog.acceptance)}
                      />
                    </div>
                  )}
                  {formatMarkdownField(detail.backlog.testStrategy) && (
                    <div className="task-detail-block">
                      <h4>Estratégia de teste</h4>
                      <MarkdownPreview
                        content={formatMarkdownField(detail.backlog.testStrategy)}
                      />
                    </div>
                  )}
                </section>
              )}

              {detail?.artifacts?.length > 0 && (
                <section className="task-detail-section">
                  <h3 className="task-detail-section__title">Artefatos</h3>
                  <ul className="task-detail-artifacts">
                    {detail.artifacts.map((a) => (
                      <ArtifactRow key={`${a.kind}-${a.path}`} artifact={a} />
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
    </AppModal>
  );
}
