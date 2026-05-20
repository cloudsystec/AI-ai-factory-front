import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api.js";

export default function BillingPanel() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/billing/summary");
      if (!res.ok) throw new Error(await res.text());
      setSummary(await res.json());
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [load]);

  if (error) {
    return <p className="msg msg--error">Consumo: {error}</p>;
  }
  if (!summary) {
    return <p className="msg msg--muted">A carregar consumo…</p>;
  }

  return (
    <section className="billing-panel">
      <h2 className="billing-panel__title">Consumo</h2>
      <div className="billing-panel__grid">
        <div>
          <span className="billing-label">Plano</span>
          <strong>{summary.planId}</strong>
        </div>
        <div>
          <span className="billing-label">Saldo (USD)</span>
          <strong>{Number(summary.balanceUsd).toFixed(2)}</strong>
        </div>
        <div>
          <span className="billing-label">Pool ciclo</span>
          <strong>{Number(summary.poolCreditCycleUsd).toFixed(2)}</strong>
        </div>
        <div>
          <span className="billing-label">Usado</span>
          <strong>
            {Number(summary.usedUsd).toFixed(2)} ({summary.usedPercent}%)
          </strong>
        </div>
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
      </div>
      {summary.recentUsage?.length > 0 && (
        <details className="billing-panel__events">
          <summary>Últimos eventos</summary>
          <ul>
            {summary.recentUsage.map((ev) => (
              <li key={ev.execution_id}>
                {ev.status} — ${Number(ev.charge_usd).toFixed(2)} —{" "}
                {new Date(ev.created_at).toLocaleString("pt-BR")}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
