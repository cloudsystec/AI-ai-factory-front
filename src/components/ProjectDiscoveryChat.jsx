import React, { useEffect, useRef } from "react";

/**
 * @param {{
 *   messages: Array<{ role: string, content: string }>,
 *   pending: boolean,
 *   error: string | null,
 *   onSend: (text: string) => void,
 *   disabled?: boolean,
 *   tutorialInputTarget?: string,
 *   tutorialSendTarget?: string,
 *   tutorialAutoTypeSignal?: number,
 *   onTutorialAutoTypeComplete?: () => void,
 *   demoInput?: string,
 * }} props
 */
export default function ProjectDiscoveryChat({
  messages,
  pending,
  error,
  onSend,
  disabled = false,
  tutorialInputTarget,
  tutorialSendTarget,
  tutorialAutoTypeSignal = 0,
  onTutorialAutoTypeComplete,
  demoInput = "",
}) {
  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (!tutorialAutoTypeSignal || !demoInput) return undefined;
    let cancelled = false;
    let timeoutId = null;
    let index = 0;
    setInput("");

    function tick() {
      if (cancelled) return;
      if (index <= demoInput.length) {
        setInput(demoInput.slice(0, index));
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
  }, [demoInput, onTutorialAutoTypeComplete, tutorialAutoTypeSignal]);

  useEffect(() => {
    if (!tutorialInputTarget) return undefined;
    const id = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(id);
  }, [tutorialInputTarget]);

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending || disabled) return;
    onSend(text);
    setInput("");
  }

  return (
    <div className="project-discovery-chat">
      <header className="project-discovery-chat__head">
        <div>
          <p className="macro-help-drawer__eyebrow">Descoberta PO/SM</p>
          <h2 className="macro-help-drawer__title">Brainstorm do projeto</h2>
        </div>
      </header>

      <p className="project-discovery-chat__hint msg msg--muted">
        Descreva ou cole o escopo — o assistente extrai o checklist e só
        pergunta o que faltar.
      </p>

      <div className="project-discovery-chat__body">
        <div className="project-discovery-chat__messages custom-scrollbar">
          {messages.length === 0 && !pending && (
            <p className="macro-help-drawer__hint msg msg--muted">
              A iniciar sessão de descoberta…
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
      </div>

      <footer className="project-discovery-chat__composer">
        {error && <p className="msg msg--error project-discovery-chat__error">{error}</p>}
        <form className="project-discovery-chat__form" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className="form-field__textarea project-discovery-chat__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Descreva ou cole o escopo do projeto…"
            rows={3}
            disabled={disabled || pending}
            data-tutorial={tutorialInputTarget || undefined}
          />
          <button
            type="submit"
            className="toolbar-btn toolbar-btn--primary project-discovery-chat__send"
            disabled={disabled || pending || !input.trim()}
            data-tutorial={tutorialSendTarget || undefined}
          >
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}
