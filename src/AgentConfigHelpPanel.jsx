import React, { useEffect, useRef, useState } from "react";
import { apiFetch } from "./api.js";
import ScopePreviewModal from "./ScopePreviewModal.jsx";
import { getAgentRoleMeta } from "./lib/agentRoleMeta.js";

/**
 * Painel de chat ao lado do editor (não sobrepõe a tela).
 * @param {{
 *   onClose: () => void,
 *   projectSlug: string,
 *   projectName?: string,
 *   roleKey: string,
 *   content: string,
 *   onContentChange: (content: string) => void,
 * }} props
 */
export default function AgentConfigHelpPanel({
  onClose,
  projectSlug,
  projectName = "",
  roleKey,
  content,
  onContentChange,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastContent, setLastContent] = useState(content);
  const messagesEndRef = useRef(null);
  const roleMeta = getAgentRoleMeta(roleKey);

  useEffect(() => {
    setLastContent(content);
    setError(null);
  }, [content, roleKey]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, pending]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, pending]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    const userMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/agents/help/chat`,
        {
          method: "POST",
          body: JSON.stringify({
            roleKey,
            currentContent: lastContent,
            messages: nextMessages,
            projectName: projectName.trim() || undefined,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const updated = String(data.agentContent ?? "").trim();
      const assistantText = String(data.assistantMessage ?? "").trim();
      if (updated) {
        setLastContent(updated);
        onContentChange(updated);
      }
      if (assistantText) {
        setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
      }
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <aside
        className="agent-config-help-panel"
        aria-label="Ajuda com configuração de agentes"
      >
        <header className="agent-config-help-panel__head">
          <div className="agent-config-help-panel__head-text">
            <p className="agent-config-help-panel__eyebrow">AgentConfig</p>
            <h2 className="agent-config-help-panel__title">Ajuda com a configuração</h2>
            <p className="agent-config-help-panel__role">
              Papel: <strong>{roleMeta.label}</strong>
            </p>
          </div>
          <button
            type="button"
            className="agent-config-help-panel__close"
            onClick={onClose}
            disabled={pending}
            aria-label="Fechar painel de ajuda"
          >
            ×
          </button>
        </header>

        <p className="agent-config-help-panel__live-hint">
          O editor principal atualiza em tempo real conforme a IA sugere alterações.
        </p>

        <div className="agent-config-help-panel__messages custom-scrollbar">
          {messages.length === 0 && (
            <p className="agent-config-help-panel__hint msg msg--muted">
              Peça sugestões para melhorar o prompt do agente{" "}
              <strong>{roleMeta.label}</strong>.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={`agent-config-help-panel__bubble agent-config-help-panel__bubble--${msg.role}`}
            >
              {msg.content}
            </div>
          ))}
          {pending && (
            <p className="agent-config-help-panel__typing msg msg--muted">A pensar…</p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <p className="agent-config-help-panel__error msg msg--error">{error}</p>
        )}

        <form className="agent-config-help-panel__form" onSubmit={handleSend}>
          <textarea
            className="agent-config-help-panel__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex.: tornar o reviewer mais rigoroso com testes e segurança…"
            rows={3}
            disabled={pending}
          />
          <div className="agent-config-help-panel__actions">
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setPreviewOpen(true)}
              disabled={!lastContent.trim()}
            >
              Preview
            </button>
            <button
              type="submit"
              className="toolbar-btn toolbar-btn--primary"
              disabled={pending || !input.trim()}
            >
              Enviar
            </button>
          </div>
        </form>
      </aside>

      <ScopePreviewModal
        open={previewOpen}
        content={lastContent}
        eyebrow="Preview"
        title={`Prompt — ${roleMeta.label}`}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
