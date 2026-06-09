import React, { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheck,
  faSpinner,
  faTriangleExclamation,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { useRailwayPublishContextOptional } from "../context/RailwayPublishContext.jsx";
import {
  isPublishInProgress,
  publishUiTone,
  railwayPublishStatusLabel,
} from "../lib/railwayPublish.js";

/**
 * @param {{
 *   projectSlug?: string|null,
 *   projectName?: string|null,
 * }} props
 */
export default function NotificationBell({ projectSlug, projectName }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const ctx = useRailwayPublishContextOptional();

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
    return undefined;
  }, [open]);

  const notifications = useMemo(() => {
    if (!projectSlug || !ctx) return [];

    const tone = publishUiTone(ctx.publishStatus);
    const inProgress =
      ctx.publishLoading ||
      ctx.isPublishing ||
      isPublishInProgress(ctx.publishStatus);

    const visible = inProgress || tone === "success" || tone === "error";
    if (!visible) return [];

    const label = projectName || projectSlug;
    let title = "Publicação em andamento";
    let body =
      ctx.publishStatus?.hint ||
      "Estamos a preparar, publicar e verificar a aplicação. Isto pode levar vários minutos.";
    let icon = faSpinner;
    let spin = true;
    let itemTone = "progress";

    if (tone === "success") {
      title = "Publicado com sucesso";
      body = ctx.publishStatus?.publicUrl
        ? "A aplicação está disponível online."
        : "Deploy concluído.";
      icon = faCheck;
      spin = false;
      itemTone = "success";
    } else if (tone === "error") {
      title = "Publicação falhou";
      body =
        ctx.publishError ||
        ctx.publishStatus?.lastError ||
        "Ocorreu um erro durante a publicação.";
      icon = faTriangleExclamation;
      spin = false;
      itemTone = "error";
    } else if (tone === "waiting") {
      title = "Publicação na fila";
      body = "O job de publicação foi enfileirado e iniciará em breve.";
      icon = faClock;
      spin = false;
      itemTone = "waiting";
    } else if (ctx.publishStatus?.status) {
      title = railwayPublishStatusLabel(ctx.publishStatus.status);
    }

    return [
      {
        id: "railway-publish",
        tone: itemTone,
        title,
        body,
        projectLabel: label,
        publicUrl: ctx.publishStatus?.publicUrl || null,
        icon,
        spin,
        canRetry: tone === "error" && typeof ctx.handlePublish === "function",
      },
    ];
  }, [projectSlug, projectName, ctx]);

  const count = notifications.length;

  return (
    <div className="relative flex-shrink-0 z-[60]" ref={wrapRef}>
      <button
        type="button"
        className="notification-bell btn-glass w-9 h-9 rounded-xl flex items-center justify-center relative transition-all duration-200"
        aria-label={`Notificações${count ? ` (${count} activas)` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <FontAwesomeIcon icon={faBell} className="text-teal-300 text-dash-body" />
        {count > 0 && (
          <span className="notification-bell__badge" aria-hidden>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <div
        className={`notification-dropdown project-dropdown${open ? " open" : ""}`}
        style={{ top: "calc(100% + 8px)", right: 0, minWidth: "320px" }}
      >
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="dash-section-label" style={{ color: "#475569" }}>
              Notificações
            </span>
            {count > 0 && (
              <span className="text-dash-caption text-teal-400 font-semibold">
                {count} activa{count !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {count === 0 ? (
            <div className="notification-empty py-6 px-2 text-center">
              <FontAwesomeIcon
                icon={faBell}
                className="text-slate-600 text-dash-title mb-2"
              />
              <p className="text-dash-caption" style={{ color: "#64748b" }}>
                Sem notificações por agora
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto custom-scrollbar">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item notification-item--${n.tone} rounded-xl px-3 py-3`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`notification-item__icon notification-item__icon--${n.tone}`}>
                      <FontAwesomeIcon icon={n.icon} spin={n.spin} className="text-dash-caption" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-dash-body font-semibold text-slate-100 leading-tight">
                        {n.title}
                      </p>
                      <p className="text-dash-caption mt-0.5" style={{ color: "#64748b" }}>
                        {n.projectLabel}
                      </p>
                      <p className="text-dash-caption mt-1.5 leading-snug" style={{ color: "#94a3b8" }}>
                        {n.body}
                      </p>
                      {n.publicUrl && (
                        <a
                          href={n.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-dash-caption text-teal-400 hover:text-teal-300 font-medium"
                        >
                          Abrir aplicação →
                        </a>
                      )}
                      {n.canRetry && (
                        <button
                          type="button"
                          className="mt-2 text-dash-caption text-amber-400 hover:text-amber-300 font-semibold"
                          onClick={() => {
                            ctx.handlePublish().catch(() => {});
                          }}
                        >
                          Tentar novamente
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
