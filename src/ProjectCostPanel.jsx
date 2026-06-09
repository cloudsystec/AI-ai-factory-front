import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faCoins } from "@fortawesome/free-solid-svg-icons";
import { apiFetch } from "./api.js";
import { useSocket } from "./useSocket.jsx";
import { useSession } from "./SessionContext.jsx";
import UsageEventsModal from "./UsageEventsModal.jsx";
import { formatBrl } from "./format-brl.js";

/**
 * @param {{ projectSlug: string|null, cotation?: number, visual?: "default" | "sidebar" | "uxpilot" }} props
 */
export default function ProjectCostPanel({
  projectSlug,
  cotation: cotationProp,
  visual = "default",
}) {
  const { subscribe } = useSocket();
  const { isPlatformAdmin } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showEventsModal, setShowEventsModal] = useState(false);

  const load = useCallback(async () => {
    if (!projectSlug) {
      setData(null);
      setError(null);
      return;
    }
    try {
      const res = await apiFetch(
        `/api/billing/projects/${encodeURIComponent(projectSlug)}`
      );
      if (!res.ok) {
        if (res.status === 404) {
          setData(null);
          setError(null);
          return;
        }
        throw new Error(await res.text());
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
      setData(null);
    }
  }, [projectSlug]);

  useEffect(() => {
    load();
    if (!projectSlug) return undefined;

    const fallback = setInterval(load, 60_000);
    let debounceTimer = null;
    const scheduleLoad = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => load(), 250);
    };
    const unsubs = [
      subscribe("billing", scheduleLoad),
      subscribe("dashboard", scheduleLoad),
      subscribe("job:status", scheduleLoad),
    ];
    return () => {
      clearInterval(fallback);
      clearTimeout(debounceTimer);
      unsubs.forEach((fn) => fn());
    };
  }, [load, projectSlug, subscribe]);

  if (!projectSlug) {
    if (visual === "sidebar" || visual === "uxpilot") {
      return (
        <section className="metric-card-ux metric-card-ux--cost metric-card-ux--empty">
          <p className="metric-card-ux__empty-msg">Selecione um projeto.</p>
        </section>
      );
    }
    return (
      <section className="project-cost-panel billing-panel billing-panel--compact">
        <h2 className="billing-panel__title">Custo projeto</h2>
        <p className="msg msg--muted">Selecione um projeto.</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="project-cost-panel billing-panel billing-panel--compact">
        <p className="msg msg--error">Custo projeto: {error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="project-cost-panel billing-panel billing-panel--compact">
        <p className="msg msg--muted">Carregando custo do projeto…</p>
      </section>
    );
  }

  const cotation = Number(cotationProp ?? data.cotation) || 5.1;
  const eventCount = data.usageEventsTotal ?? data.recentUsage?.length ?? 0;
  const real = formatBrl(data.actualCostUsd, cotation);
  const prev = formatBrl(data.forecastCostUsd, cotation);
  const realNum = Number(data.actualCostUsd) || 0;
  const prevNum = Number(data.forecastCostUsd) || 0;
  const barHeights = [40, 60, 35, 75, 50, 90, 65].map((h) =>
    Math.round(h * (prevNum > 0 ? Math.min(1, realNum / prevNum) : 0.5) / 100 * 100)
  );

  if (visual === "uxpilot") {
    return (
      <>
      <section
        className={`metric-card-ux metric-card-ux--cost${eventCount > 0 ? " metric-card-ux--clickable" : ""}`}
        id="card-custo"
        role={eventCount > 0 ? "button" : undefined}
        tabIndex={eventCount > 0 ? 0 : undefined}
        onClick={eventCount > 0 ? () => setShowEventsModal(true) : undefined}
        onKeyDown={
          eventCount > 0
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowEventsModal(true);
                }
              }
            : undefined
        }
        title={eventCount > 0 ? "Ver eventos de custo" : undefined}
      >
        <div className="metric-card-ux__glow metric-card-ux__glow--violet" aria-hidden />

        <header className="metric-card-ux__head">
          <div className="metric-card-ux__title-wrap">
            <div className="metric-icon metric-icon--sm metric-icon--violet">
              <FontAwesomeIcon icon={faCoins} className="text-violet-300" />
            </div>
            <div className="metric-card-ux__titles min-w-0">
              <p className="metric-card-ux__eyebrow metric-card-ux__eyebrow--violet">Custo do</p>
              <p className="metric-card-ux__title">Projeto</p>
            </div>
          </div>
          {eventCount > 0 && (
            <button
              type="button"
              className="metric-card-ux__chip metric-card-ux__chip--violet"
              onClick={(e) => {
                e.stopPropagation();
                setShowEventsModal(true);
              }}
              title="Ver eventos de custo"
            >
              <FontAwesomeIcon icon={faBolt} />
              <span>{eventCount.toLocaleString("pt-BR")}</span>
            </button>
          )}
        </header>

        <div className="metric-card-ux__body metric-card-ux__body--cost">
          <div className="metric-card-ux__stat metric-card-ux__stat--violet">
            <span className="metric-card-ux__stat-label">Real</span>
            <strong className="metric-card-ux__stat-value" title={real}>{real}</strong>
          </div>
          <div className="metric-card-ux__stat metric-card-ux__stat--indigo">
            <span className="metric-card-ux__stat-label">Previsto</span>
            <strong className="metric-card-ux__stat-value" title={prev}>{prev}</strong>
          </div>
          <div className="metric-card-ux__sparkline" aria-hidden>
            {barHeights.map((h, i) => (
              <span key={i} className="metric-card-ux__sparkline-bar" style={{ height: `${Math.max(14, h)}%` }} />
            ))}
          </div>
        </div>
      </section>
      {showEventsModal && (
        <UsageEventsModal
          scope="project"
          projectSlug={projectSlug}
          cotation={cotation}
          showUsdForAdmin={isPlatformAdmin}
          variant="cost"
          eyebrow="Custo projeto"
          title="Eventos do projeto"
          subtitle={projectSlug}
          onClose={() => setShowEventsModal(false)}
        />
      )}
      </>
    );
  }

  if (visual === "sidebar") {
    return (
      <section className="metrics-card metrics-card--cost">
        <div className="metrics-card__head">
          <span className="metrics-card__head-icon" aria-hidden>
            💰
          </span>
          <h3 className="metrics-card__head-title">Custo do Projeto</h3>
        </div>
        <div className="metrics-card__dual">
          <div className="metrics-card__dual-item">
            <span className="metrics-card__dual-label">REAL</span>
            <strong className="metrics-card__dual-value">{real}</strong>
          </div>
          <div className="metrics-card__dual-item">
            <span className="metrics-card__dual-label">PREV</span>
            <strong className="metrics-card__dual-value metrics-card__dual-value--muted">
              {prev}
            </strong>
          </div>
        </div>
        <div className="metrics-card__sparkline" aria-hidden>
          {barHeights.map((h, i) => (
            <span
              key={i}
              className="metrics-card__sparkline-bar"
              style={{ height: `${Math.max(12, h)}%` }}
            />
          ))}
        </div>
        {showEventsModal && (
          <UsageEventsModal
            scope="project"
            projectSlug={projectSlug}
            cotation={cotation}
            showUsdForAdmin={isPlatformAdmin}
            variant="cost"
            eyebrow="Custo projeto"
            title="Eventos do projeto"
            subtitle={projectSlug}
            onClose={() => setShowEventsModal(false)}
          />
        )}
      </section>
    );
  }

  return (
    <section className="project-cost-panel billing-panel billing-panel--compact">
      <div className="billing-panel__head">
        <h2 className="billing-panel__title">Custo projeto</h2>
        {eventCount > 0 && (
          <button
            type="button"
            className="billing-panel__events-btn billing-panel__events-btn--inline"
            onClick={() => setShowEventsModal(true)}
          >
            Eventos
            <span className="billing-panel__events-count">
              {eventCount.toLocaleString("pt-BR")}
            </span>
          </button>
        )}
      </div>

      <div className="billing-panel__grid project-cost-panel__grid">
        <div>
          <span className="billing-label">Real</span>
          <strong>{formatBrl(data.actualCostUsd, cotation)}</strong>
        </div>
        <div>
          <span className="billing-label">Previsto final</span>
          <strong>{formatBrl(data.forecastCostUsd, cotation)}</strong>
        </div>
      </div>

      {showEventsModal && (
        <UsageEventsModal
          scope="project"
          projectSlug={projectSlug}
          cotation={cotation}
          showUsdForAdmin={isPlatformAdmin}
          variant="cost"
          eyebrow="Custo projeto"
          title="Eventos do projeto"
          subtitle={projectSlug}
          onClose={() => setShowEventsModal(false)}
        />
      )}
    </section>
  );
}
