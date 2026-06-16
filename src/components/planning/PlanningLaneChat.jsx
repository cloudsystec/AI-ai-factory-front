import React, { useEffect, useRef, useState } from "react";
import { usePlanningChat } from "../../hooks/usePlanningState.js";

/**
 * @param {{
 *   projectSlug: string,
 *   lane: "layout"|"infra",
 *   onRevisionApplied?: () => void,
 *   disabled?: boolean,
 *   disabledReason?: string,
 * }} props
 */
export default function PlanningLaneChat({
  projectSlug,
  lane,
  onRevisionApplied,
  disabled = false,
  disabledReason = "",
}) {
  const [input, setInput] = useState("");
  const [attachmentIds, setAttachmentIds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const {
    messages,
    pending,
    resetting,
    error,
    sendMessage,
    uploadAttachment,
    resetSession,
  } = usePlanningChat(projectSlug, lane);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending || disabled) return;
    const result = await sendMessage(text, attachmentIds);
    if (result) {
      setInput("");
      setAttachmentIds([]);
      onRevisionApplied?.();
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const att = await uploadAttachment(file);
      if (att?.id) {
        setAttachmentIds((prev) => [...prev, att.id]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const composerLocked = disabled || pending || uploading || resetting;

  async function handleReset() {
    if (composerLocked) return;
    if (
      messages.length > 0 &&
      !window.confirm(
        "Limpar o histórico da revisão ao vivo? A IA deixa de ver mensagens anteriores (o protótipo/diagrama actual mantém-se)."
      )
    ) {
      return;
    }
    const ok = await resetSession();
    if (ok) {
      setInput("");
      setAttachmentIds([]);
    }
  }

  return (
    <div className="planning-lane-chat">
      <header className="planning-lane-chat__head">
        <div className="planning-lane-chat__head-text">
          <p className="planning-lane-chat__eyebrow">Revisão ao vivo</p>
          <p className="planning-lane-chat__hint">
            Descreva alterações; o {lane === "layout" ? "protótipo" : "diagrama"}{" "}
            será atualizado.
          </p>
        </div>
        <button
          type="button"
          className="toolbar-btn planning-lane-chat__reset"
          disabled={composerLocked}
          onClick={handleReset}
          title="Limpar histórico do chat (contexto IA)"
        >
          {resetting ? "A limpar…" : "Reset"}
        </button>
      </header>

      <div className="planning-lane-chat__body">
        <div className="planning-lane-chat__messages custom-scrollbar">
          {messages.length === 0 && !pending && (
            <p className="planning-lane-chat__empty">
              Ex.: &quot;Muda a sidebar para escuro&quot; ou &quot;Adiciona tela de
              relatórios&quot;
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${m.at || i}-${m.role}`}
              className={`planning-lane-chat__bubble planning-lane-chat__bubble--${
                m.role === "assistant" ? "assistant" : "user"
              }`}
            >
              {m.content}
            </div>
          ))}
          {pending && (
            <p className="planning-lane-chat__typing" aria-live="polite">
              A aplicar alterações…
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {attachmentIds.length > 0 && (
          <p className="planning-lane-chat__attachments" role="status">
            {attachmentIds.length} anexo(s) na próxima mensagem
          </p>
        )}
        {error && (
          <p className="planning-lane-chat__error msg msg--error" role="alert">
            {error}
          </p>
        )}
        {disabled && disabledReason && (
          <p className="planning-lane-chat__locked msg msg--muted">{disabledReason}</p>
        )}

        <form className="planning-lane-chat__composer" onSubmit={handleSubmit}>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            className="sr-only"
            onChange={handleFileChange}
          />
          <div className="planning-lane-chat__composer-row">
            <button
              type="button"
              className="toolbar-btn planning-lane-chat__clip"
              disabled={composerLocked}
              onClick={() => fileRef.current?.click()}
              title="Anexar ficheiro (máx. 15MB)"
              aria-label="Anexar ficheiro"
            >
              Anexar
            </button>
            <textarea
              ref={inputRef}
              className="planning-lane-chat__input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={
                disabled
                  ? "Chat indisponível"
                  : "Pedir alteração… (Enter envia, Shift+Enter nova linha)"
              }
              disabled={composerLocked}
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="toolbar-btn toolbar-btn--primary planning-lane-chat__send"
            disabled={composerLocked || !input.trim()}
          >
            {pending ? "A aplicar…" : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}
