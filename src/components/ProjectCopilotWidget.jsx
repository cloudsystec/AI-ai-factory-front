import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useProjectCopilot } from "../hooks/useProjectCopilot.js";
import "../styles/project-copilot.css";

const PANEL_ANIM_MS = 320;

/**
 * @param {{
 *   projectSlug: string,
 *   projectName?: string,
 *   onRefresh?: () => void|Promise<void>,
 * }} props
 */
export default function ProjectCopilotWidget({
  projectSlug,
  projectName = "",
  onRefresh,
}) {
  const copilot = useProjectCopilot(projectSlug, { onRefresh });
  const [input, setInput] = useState("");
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const closeTimerRef = useRef(null);

  const closePanel = useCallback(() => {
    copilot.setOpen(false);
  }, [copilot]);

  useEffect(() => {
    if (copilot.open) {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setPanelMounted(true);
      const raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setPanelVisible(true));
      });
      return () => window.cancelAnimationFrame(raf);
    }

    setPanelVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      setPanelMounted(false);
      closeTimerRef.current = null;
    }, PANEL_ANIM_MS);

    return undefined;
  }, [copilot.open]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [copilot.messages, copilot.pending, copilot.pendingActions]);

  useEffect(() => {
    if (copilot.open && panelVisible) {
      window.setTimeout(() => inputRef.current?.focus(), PANEL_ANIM_MS);
    }
  }, [copilot.open, panelVisible]);

  useEffect(() => {
    if (!copilot.open) return undefined;
    function onKeyDown(e) {
      if (e.key === "Escape" && !copilot.pending) {
        e.stopPropagation();
        closePanel();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copilot.open, copilot.pending, closePanel]);

  const locked = copilot.guard?.locked === true;
  const lockLabel = copilot.guard?.lockedUntil
    ? new Date(copilot.guard.lockedUntil).toLocaleTimeString()
    : "";

  if (!projectSlug || copilot.statusLoading) return null;
  if (!copilot.ready) return null;

  return (
    <div className="project-copilot-root">
      {panelMounted && (
        <div
          className={[
            "project-copilot-panel",
            panelVisible ? "project-copilot-panel--visible" : "project-copilot-panel--closing",
          ].join(" ")}
          role="dialog"
          aria-label="Chat copiloto"
          aria-hidden={!panelVisible}
        >
          <header className="project-copilot-panel__header">
            <div className="project-copilot-panel__header-text">
              <p className="project-copilot-panel__eyebrow">Copiloto</p>
              <h2 className="project-copilot-panel__title">
                {projectName || projectSlug}
              </h2>
            </div>
            <button
              type="button"
              className="project-copilot-panel__close"
              aria-label="Fechar copiloto"
              title="Fechar"
              onClick={closePanel}
            >
              ×
            </button>
          </header>

          <div className="project-copilot-panel__messages custom-scrollbar">
            {copilot.messages.length === 0 && (
              <p className="msg msg--muted project-copilot-panel__empty">
                Peça custos, pare bots, edite tasks em &quot;A fazer&quot;, refine micros ou
                explore o escopo.
              </p>
            )}
            {copilot.messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`project-copilot-bubble project-copilot-bubble--${m.role}`}
              >
                {m.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            ))}

            {copilot.pendingActions.map((action) => (
              <div key={action.id} className="project-copilot-pending">
                <p className="project-copilot-pending__title">Confirmação necessária</p>
                <p className="project-copilot-pending__summary">{action.summary}</p>
                <div className="project-copilot-pending__actions">
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={copilot.confirmingId === action.id}
                    onClick={() => copilot.confirmAction(action.id)}
                  >
                    {copilot.confirmingId === action.id ? "A aplicar…" : "Confirmar"}
                  </button>
                  {action.offerForceStop && action.actionType === "reset_project" && (
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      disabled={copilot.confirmingId === action.id}
                      onClick={() =>
                        copilot.confirmAction(action.id, { forceStop: true })
                      }
                    >
                      Forçar parada e resetar
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => copilot.dismissPending(action.id)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}

            {copilot.pending && (
              <div className="project-copilot-bubble project-copilot-bubble--assistant project-copilot-bubble--typing">
                A pensar…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {copilot.error && (
            <p className="project-copilot-panel__error msg msg--error">{copilot.error}</p>
          )}

          {locked && (
            <p className="project-copilot-panel__lock msg msg--muted">
              Bloqueado por segurança até {lockLabel}
            </p>
          )}

          <form
            className="project-copilot-panel__form"
            onSubmit={(e) => {
              e.preventDefault();
              const text = input.trim();
              if (!text) return;
              setInput("");
              void copilot.sendMessage(text);
            }}
          >
            <textarea
              ref={inputRef}
              className="project-copilot-panel__input"
              rows={2}
              placeholder={
                locked ? "Copiloto bloqueado…" : "Mensagem para o copiloto…"
              }
              value={input}
              disabled={copilot.pending || locked}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button
              type="submit"
              className="btn btn--primary"
              disabled={copilot.pending || locked || !input.trim()}
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`project-copilot-fab${copilot.open ? " project-copilot-fab--open" : ""}`}
        aria-label={copilot.open ? "Fechar copiloto" : "Abrir copiloto do projeto"}
        aria-expanded={copilot.open}
        title="Copiloto do projeto"
        onClick={() => copilot.setOpen((v) => !v)}
      >
        <span className="project-copilot-fab__icon" aria-hidden>
          🤖
        </span>
      </button>
    </div>
  );
}
