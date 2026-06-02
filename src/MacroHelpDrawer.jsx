import React, { useEffect, useRef, useState } from "react";
import { apiFetch } from "./api.js";
import ScopePreviewModal from "./ScopePreviewModal.jsx";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   scopeMd: string,
 *   onScopeChange: (scopeMd: string) => void,
 *   projectName?: string,
 *   projectSlug?: string,
 *   draftSlug?: string,
 * }} props
 */
export default function MacroHelpDrawer({
  open,
  onClose,
  scopeMd,
  onScopeChange,
  projectName = "",
  projectSlug = "",
  draftSlug = "",
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastScopeMd, setLastScopeMd] = useState(scopeMd);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      setLastScopeMd(scopeMd);
      setError(null);
    }
  }, [open, scopeMd]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, pending]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && open && !pending) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, pending]);

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
      const res = await apiFetch("/api/macro-help/chat", {
        method: "POST",
        body: JSON.stringify({
          currentScopeMd: lastScopeMd,
          messages: nextMessages,
          projectName: projectName.trim() || undefined,
          projectSlug: projectSlug.trim() || undefined,
          draftSlug: draftSlug.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const updatedScope = String(data.scopeMd ?? "").trim();
      const assistantText = String(data.assistantMessage ?? "").trim();
      if (updatedScope) {
        setLastScopeMd(updatedScope);
        onScopeChange(updatedScope);
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

  function handleApplyAndClose() {
    if (lastScopeMd.trim()) {
      onScopeChange(lastScopeMd.trim());
    }
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div
        className="macro-help-drawer-backdrop"
        role="presentation"
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <aside className="macro-help-drawer" aria-label="Ajuda com escopo macro">
        <header className="macro-help-drawer__head">
          <div>
            <p className="macro-help-drawer__eyebrow">MacroHelp</p>
            <h2 className="macro-help-drawer__title">Ajuda com o escopo</h2>
          </div>
          <button
            type="button"
            className="modal-panel__close"
            onClick={onClose}
            disabled={pending}
          >
            Fechar
          </button>
        </header>

        <div className="macro-help-drawer__messages">
          {messages.length === 0 && (
            <p className="macro-help-drawer__hint msg msg--muted">
              Descreva o produto ou peça melhorias ao escopo atual. A IA irá
              atualizar o texto na caixa de escopo.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={`macro-help-drawer__bubble macro-help-drawer__bubble--${msg.role}`}
            >
              {msg.content}
            </div>
          ))}
          {pending && (
            <p className="macro-help-drawer__typing msg msg--muted">A pensar…</p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && <p className="macro-help-drawer__error msg msg--error">{error}</p>}

        <form className="macro-help-drawer__form" onSubmit={handleSend}>
          <textarea
            className="form-field__textarea macro-help-drawer__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex.: incluir autenticação, painel admin e API REST…"
            rows={3}
            disabled={pending}
          />
          <div className="macro-help-drawer__actions">
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setPreviewOpen(true)}
              disabled={!lastScopeMd.trim()}
            >
              Preview
            </button>
            <button
              type="button"
              className="toolbar-btn toolbar-btn--primary"
              onClick={handleApplyAndClose}
              disabled={pending || !lastScopeMd.trim()}
            >
              Usar este escopo e fechar
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
        content={lastScopeMd}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
