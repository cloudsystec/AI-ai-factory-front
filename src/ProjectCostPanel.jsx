import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import { useSocket } from "./useSocket.jsx";
import { useSession } from "./SessionContext.jsx";
import UsageEventsModal from "./UsageEventsModal.jsx";
import { formatBrl } from "./format-brl.js";

/**
 * @param {{ projectSlug: string|null, cotation?: number }} props
 */
export default function ProjectCostPanel({ projectSlug, cotation: cotationProp }) {
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
        <p className="msg msg--muted">A carregar custo do projeto…</p>
      </section>
    );
  }

  const cotation = Number(cotationProp ?? data.cotation) || 5.1;

  return (
    <section className="project-cost-panel billing-panel billing-panel--compact">
      <div className="billing-panel__head">
        <h2 className="billing-panel__title">Custo projeto</h2>
        {data.recentUsage?.length > 0 && (
          <button
            type="button"
            className="billing-panel__events-btn billing-panel__events-btn--inline"
            onClick={() => setShowEventsModal(true)}
          >
            Eventos
            <span className="billing-panel__events-count">
              {data.recentUsage.length}
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

      {showEventsModal && data.recentUsage?.length > 0 && (
        <UsageEventsModal
          events={data.recentUsage}
          cotation={cotation}
          showUsdForAdmin={isPlatformAdmin}
          eyebrow="Custo projeto"
          title="Eventos do projeto"
          subtitle={projectSlug}
          onClose={() => setShowEventsModal(false)}
        />
      )}
    </section>
  );
}
