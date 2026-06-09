import React, { useEffect, useRef, useState } from "react";
import { apiFetch } from "./api.js";
import ScopePreviewModal from "./ScopePreviewModal.jsx";
import { getMockMacroHelpResponse, TUTORIAL_MACRO_HELP_DEMO_INPUT } from "./tutorial/mockMacroHelpResponses.js";

/**
 * Painel de chat ao lado da modal de escopo (sem overlay próprio).
 * @param {{
 *   onClose: () => void,
 *   scopeMd: string,
 *   onScopeChange: (scopeMd: string) => void,
 *   projectName?: string,
 *   projectSlug?: string,
 *   draftSlug?: string,
 *   tutorialMode?: boolean,
 *   tutorialInputTarget?: string,
 *   tutorialSendTarget?: string,
 *   tutorialAutoTypeSignal?: number,
 *   onTutorialAutoTypeComplete?: () => void,
 *   onTutorialMessageSent?: () => void,
 * }} props
 */
export default function MacroHelpPanel({
  onClose,
  scopeMd,
  onScopeChange,
  projectName = "",
  projectSlug = "",
  draftSlug = "",
  tutorialMode = false,
  tutorialInputTarget,
  tutorialSendTarget,
  tutorialAutoTypeSignal = 0,
  onTutorialAutoTypeComplete,
  onTutorialMessageSent,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastScopeMd, setLastScopeMd] = useState(scopeMd);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const tutorialNotifiedRef = useRef(false);

  useEffect(() => {
    setLastScopeMd(scopeMd);
    setError(null);
  }, [scopeMd]);

  useEffect(() => {
    if (!tutorialInputTarget) return undefined;
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => window.clearTimeout(id);
  }, [tutorialInputTarget]);

  useEffect(() => {
    if (!tutorialAutoTypeSignal) return undefined;
    let cancelled = false;
    let timeoutId = null;
    const text = TUTORIAL_MACRO_HELP_DEMO_INPUT;
    setInput("");
    let index = 0;

    function tick() {
      if (cancelled) return;
      if (index <= text.length) {
        setInput(text.slice(0, index));
        index += 1;
        timeoutId = window.setTimeout(tick, 32);
        return;
      }
      onTutorialAutoTypeComplete?.();
    }

    timeoutId = window.setTimeout(tick, 180);
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [tutorialAutoTypeSignal, onTutorialAutoTypeComplete]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, pending]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && !pending) {
        e.stopPropagation();
        onClose();
      }
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
      if (tutorialMode) {
        await new Promise((r) => window.setTimeout(r, 800));
        const mock = getMockMacroHelpResponse(text);
        setLastScopeMd(mock.scopeMd);
        onScopeChange(mock.scopeMd);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: mock.assistantMessage },
        ]);
        if (!tutorialNotifiedRef.current) {
          tutorialNotifiedRef.current = true;
          onTutorialMessageSent?.();
        }
        return;
      }

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

  return (
    <>
      <aside
        className="macro-help-companion-panel"
        aria-label="Ajuda com escopo macro"
      >
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
            aria-label="Fechar painel de ajuda"
          >
            Fechar
          </button>
        </header>

        <p className="macro-help-companion-panel__hint">
          {tutorialMode
            ? "Descreva sua ideia — o texto do escopo à esquerda é atualizado enquanto você conversa."
            : "O escopo à esquerda atualiza em tempo real — pode copiar, colar e editar enquanto conversa."}
        </p>

        <div className="macro-help-drawer__messages custom-scrollbar">
          {messages.length === 0 && (
            <p className="macro-help-drawer__hint msg msg--muted">
              Descreva o produto ou peça melhorias ao escopo atual.
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
            ref={inputRef}
            className="form-field__textarea macro-help-drawer__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex.: incluir autenticação, painel admin e API REST…"
            rows={3}
            disabled={pending}
            data-tutorial={tutorialInputTarget || undefined}
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
              type="submit"
              className="toolbar-btn toolbar-btn--primary"
              disabled={pending || !input.trim()}
              data-tutorial={tutorialSendTarget || undefined}
            >
              Enviar
            </button>
          </div>
        </form>
      </aside>

      <ScopePreviewModal
        open={previewOpen}
        content={lastScopeMd}
        overlayClassName="modal-overlay--above-drawer"
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
