import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import { useSocket } from "./useSocket.jsx";
import UsageEventsModal from "./UsageEventsModal.jsx";

/**
 * @param {{ compact?: boolean, onSummary?: (summary: object|null) => void }} [props]
 */
export default function BillingPanel({ compact = false, onSummary }) {
  const { subscribe } = useSocket();
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
    const unsub = subscribe("billing", () => load());
    return () => { clearInterval(fallback); unsub(); };
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
          <strong>${Number(summary.balanceUsd).toFixed(2)}</strong>
        </div>
        <div>
          <span className="billing-label">Pool</span>
          <strong>${Number(summary.poolCreditCycleUsd).toFixed(2)}</strong>
        </div>
        <div>
          <span className="billing-label">Usado</span>
          <strong>
            ${Number(summary.usedUsd).toFixed(2)} ({summary.usedPercent}%)
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
          onClose={() => setShowEventsModal(false)}
        />
      )}
    </section>
  );
}
