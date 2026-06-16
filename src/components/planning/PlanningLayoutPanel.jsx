import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlanningLaneChat from "./PlanningLaneChat.jsx";
import { getApiBase, getToken } from "../../api.js";

function HomeIcon() {
  return (
    <svg
      className="planning-preview-nav__icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      className="planning-preview-nav__icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08a5.99 5.99 0 0 1-5.65 4c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
      />
    </svg>
  );
}

function layoutStatusLabel(status) {
  switch (status) {
    case "approved":
      return "Aprovado";
    case "review":
      return "Em revisão";
    case "generating":
      return "A gerar…";
    default:
      return "Pendente";
  }
}

/**
 * @param {string|null} previewUrl
 * @param {number} previewVersion
 * @param {number} iframeKey
 */
function buildPreviewSrc(previewUrl, previewVersion, iframeKey) {
  if (!previewUrl) return null;
  const base = getApiBase();
  const absolute = previewUrl.startsWith("http")
    ? previewUrl
    : `${base}${previewUrl}`;
  const sep = absolute.includes("?") ? "&" : "?";
  const token = getToken();
  const bust = previewVersion || iframeKey;
  if (!token) return null;
  const auth = `&access_token=${encodeURIComponent(token)}`;
  return `${absolute}${sep}v=${bust}${auth}`;
}

/**
 * @param {{
 *   projectSlug: string,
 *   previewUrl: string|null,
 *   previewVersion?: number,
 *   layoutStatus?: string,
 *   canWrite?: boolean,
 *   onApprove?: () => void,
 *   onGenerate?: () => void,
 *   onRefresh?: () => void,
 *   generating?: boolean,
 * }} props
 */
export default function PlanningLayoutPanel({
  projectSlug,
  previewUrl,
  previewVersion = 0,
  layoutStatus = "pending",
  canWrite = false,
  onApprove,
  onGenerate,
  onRefresh,
  generating = false,
}) {
  const [frameMode, setFrameMode] = useState("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeState, setIframeState] = useState("idle");
  const iframeRef = useRef(null);

  const reloadPreview = useCallback(() => {
    setIframeKey((k) => k + 1);
    setIframeState("loading");
    onRefresh?.();
  }, [onRefresh]);

  const src = useMemo(
    () => buildPreviewSrc(previewUrl, previewVersion, iframeKey),
    [previewUrl, previewVersion, iframeKey]
  );

  const iframeSrc = src ? `${src.split("#")[0]}#/` : null;

  const goPreviewHome = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const win = iframe.contentWindow;
      if (win) {
        const base = `${win.location.pathname}${win.location.search}`;
        win.location.replace(`${base}#/`);
        return;
      }
    } catch {
      /* iframe cross-origin — recarrega com hash inicial */
    }
    const baseSrc = iframeSrc?.split("#")[0];
    if (baseSrc) {
      iframe.src = `${baseSrc}#/`;
    }
  }, [iframeSrc]);

  const goPreviewBack = useCallback(() => {
    try {
      const win = iframeRef.current?.contentWindow;
      if (win) {
        win.history.back();
        return;
      }
    } catch {
      /* ignore */
    }
    goPreviewHome();
  }, [goPreviewHome]);

  useEffect(() => {
    if (iframeSrc) setIframeState("loading");
  }, [iframeSrc]);

  const chatDisabled =
    !canWrite ||
    !previewUrl ||
    layoutStatus === "generating" ||
    layoutStatus === "pending" ||
    generating;

  const chatDisabledReason = !previewUrl
    ? "Gere o protótipo para pedir alterações."
    : layoutStatus === "generating" || generating
      ? "Aguarde a conclusão da geração."
      : layoutStatus === "pending"
        ? "O protótipo ainda não está pronto para revisão."
        : "";

  return (
    <div className="planning-layout-panel">
      <div className="planning-layout-panel__toolbar">
        <span
          className={`planning-layout-panel__status planning-layout-panel__status--${layoutStatus}`}
        >
          {layoutStatusLabel(generating ? "generating" : layoutStatus)}
        </span>
        <div className="planning-phase-toggle planning-phase-toggle--inline">
          <button
            type="button"
            className={frameMode === "desktop" ? "is-active" : ""}
            onClick={() => setFrameMode("desktop")}
          >
            Desktop
          </button>
          <button
            type="button"
            className={frameMode === "mobile" ? "is-active" : ""}
            onClick={() => setFrameMode("mobile")}
          >
            Mobile
          </button>
        </div>
        <div className="planning-layout-panel__toolbar-actions">
          <button type="button" className="toolbar-btn" onClick={reloadPreview}>
            Recarregar
          </button>
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="toolbar-btn toolbar-btn--link"
            >
              Nova aba
            </a>
          )}
          {canWrite && onGenerate && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn--primary"
              disabled={generating}
              onClick={onGenerate}
            >
              {generating ? "A gerar…" : previewUrl ? "Regenerar protótipo" : "Gerar protótipo"}
            </button>
          )}
          {canWrite && previewUrl && layoutStatus !== "approved" && onApprove && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn--primary"
              disabled={generating || layoutStatus !== "review"}
              onClick={onApprove}
            >
              Aprovar layout
            </button>
          )}
        </div>
      </div>

      <div className="planning-layout-panel__body">
        <div
          className={`planning-layout-panel__preview planning-layout-panel__preview--${frameMode}`}
        >
          {src ? (
            <div className="planning-layout-panel__frame">
              <nav className="planning-preview-nav" aria-label="Navegação do protótipo">
                <button
                  type="button"
                  className="planning-preview-nav__btn"
                  onClick={goPreviewBack}
                  title="Voltar na navegação do protótipo"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  className="planning-preview-nav__btn planning-preview-nav__btn--home"
                  onClick={goPreviewHome}
                  title="Ir para a página inicial do protótipo"
                >
                  <HomeIcon />
                  <span>Início</span>
                </button>
                <button
                  type="button"
                  className="planning-preview-nav__btn planning-preview-nav__btn--refresh"
                  onClick={reloadPreview}
                  disabled={iframeState === "loading"}
                  title="Recarregar o protótipo (buscar ficheiros atualizados)"
                  aria-label="Recarregar preview"
                >
                  <RefreshIcon />
                  <span>Atualizar</span>
                </button>
              </nav>
              {(generating || layoutStatus === "generating") && (
                <div className="planning-layout-panel__overlay" aria-live="polite">
                  <span className="planning-layout-panel__spinner" aria-hidden />
                  A gerar protótipo…
                </div>
              )}
              {iframeState === "error" && (
                <div className="planning-layout-panel__overlay planning-layout-panel__overlay--error">
                  Não foi possível carregar o preview.
                  <button type="button" className="toolbar-btn" onClick={reloadPreview}>
                    Tentar novamente
                  </button>
                </div>
              )}
              <iframe
                ref={iframeRef}
                key={iframeKey}
                title="Protótipo navegável"
                src={iframeSrc}
                className="planning-layout-panel__iframe"
                onLoad={() => setIframeState("ready")}
                onError={() => setIframeState("error")}
              />
            </div>
          ) : previewUrl && !getToken() ? (
            <div className="planning-layout-panel__empty">
              <p>Sessão expirada. Faça login novamente para ver o protótipo.</p>
            </div>
          ) : (
            <div className="planning-layout-panel__empty">
              <p>Gere o protótipo para visualizar o layout navegável.</p>
              {canWrite && onGenerate && (
                <button
                  type="button"
                  className="toolbar-btn toolbar-btn--primary"
                  disabled={generating}
                  onClick={onGenerate}
                >
                  {generating ? "A gerar…" : "Gerar protótipo"}
                </button>
              )}
            </div>
          )}
        </div>
        <aside className="planning-layout-panel__chat">
          <PlanningLaneChat
            projectSlug={projectSlug}
            lane="layout"
            disabled={chatDisabled}
            disabledReason={chatDisabledReason}
            onRevisionApplied={reloadPreview}
          />
        </aside>
      </div>
    </div>
  );
}
