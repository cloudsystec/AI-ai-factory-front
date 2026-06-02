import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import { useSocket } from "./useSocket.jsx";
import { useSession } from "./SessionContext.jsx";
import UsageEventsModal from "./UsageEventsModal.jsx";
import { formatBrl } from "./format-brl.js";

/**
 * @param {{ compact?: boolean, onSummary?: (summary: object|null) => void }} [props]
 */
export default function BillingPanel({ compact = false, onSummary }) {
  const { subscribe } = useSocket();
  const { isPlatformAdmin } = useSession();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [showEventsModal, setShowEventsModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/billing/summary");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSummary(data);
      onSummary?.(data);
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
      onSummary?.(null);
    }
  }, [onSummary]);

  useEffect(() => {
    load();
    const fallback = setInterval(load, 60_000);
    let debounceTimer = null;
    const scheduleLoad = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => load(), 250);
    };
    const unsubs = [
      subscribe("billing", scheduleLoad),
      subscribe("job:status", scheduleLoad),
      subscribe("execution", scheduleLoad),
      subscribe("workers", scheduleLoad),
    ];
    return () => {
      clearInterval(fallback);
      clearTimeout(debounceTimer);
      unsubs.forEach((fn) => fn());
    };
  }, [load, subscribe]);

  if (error) {
    return (
      <section className={`billing-panel${compact ? " billing-panel--compact" : ""}`}>
        <p className="msg msg--error">Consumo: {error}</p>
      </section>
    );
  }
  if (!summary) {
    return (
      <section className={`billing-panel${compact ? " billing-panel--compact" : ""}`}>
        <p className="msg msg--muted">A carregar consumo…</p>
      </section>
    );
  }

  const cotation = Number(summary.cotation) || 5.1;

  return (
    <section className={`billing-panel${compact ? " billing-panel--compact" : ""}`}>
      <div className="billing-panel__head">
        <h2 className="billing-panel__title">Consumo</h2>
        {summary.recentUsage?.length > 0 && (
          <button
            type="button"
            className="billing-panel__events-btn billing-panel__events-btn--inline"
            onClick={() => setShowEventsModal(true)}
          >
            Eventos
            <span className="billing-panel__events-count">
              {summary.recentUsage.length}
            </span>
          </button>
        )}
      </div>
      <div className="billing-panel__grid">
        <div>
          <span className="billing-label">Plano</span>
          <strong>{summary.planId}</strong>
        </div>
        <div>
          <span className="billing-label">Saldo</span>
          <strong>{formatBrl(summary.balanceUsd, cotation)}</strong>
        </div>
        <div>
          <span className="billing-label">Pool</span>
          <strong>{formatBrl(summary.poolCreditCycleUsd, cotation)}</strong>
        </div>
        <div>
          <span className="billing-label">Usado</span>
          <strong>
            {formatBrl(summary.usedUsd, cotation)} ({summary.usedPercent}%)
          </strong>
        </div>
        {!compact && (
          <>
            <div>
              <span className="billing-label">Worker</span>
              <strong>{summary.workerStatus}</strong>
            </div>
            <div>
              <span className="billing-label">Slots</span>
              <strong>
                {summary.agentSlotsInUse}/{summary.agentSlotsMax}
              </strong>
            </div>
          </>
        )}
      </div>

      {showEventsModal && summary.recentUsage?.length > 0 && (
        <UsageEventsModal
          events={summary.recentUsage}
          cotation={cotation}
          showUsdForAdmin={isPlatformAdmin}
          onClose={() => setShowEventsModal(false)}
        />
      )}
    </section>
  );
}
