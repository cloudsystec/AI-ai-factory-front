import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faGaugeHigh } from "@fortawesome/free-solid-svg-icons";
import { apiFetch } from "./api.js";
import { useSocket } from "./useSocket.jsx";
import { useSession } from "./SessionContext.jsx";
import UsageEventsModal from "./UsageEventsModal.jsx";
import { formatBrl } from "./format-brl.js";

/**
 * @param {{ compact?: boolean, visual?: "default" | "sidebar" | "uxpilot", onSummary?: (summary: object|null) => void }} [props]
 */
export default function BillingPanel({ compact = false, visual = "default", onSummary }) {
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
        <p className="msg msg--muted">Carregando consumo…</p>
      </section>
    );
  }

  const cotation = Number(summary.cotation) || 5.1;
  const eventCount = summary.usageEventsTotal ?? summary.recentUsage?.length ?? 0;
  const usedPct = Math.min(100, Math.max(0, Number(summary.usedPercent) || 0));
  const poolLimit = Number(summary.poolCreditCycleUsd) || 0;
  const usedUsd = Number(summary.usedUsd) || 0;
  const balanceUsd = Number(summary.balanceUsd) || 0;
  const strokeOffset = 163.36 * (1 - usedPct / 100);

  if (visual === "uxpilot") {
    const balanceBrl = formatBrl(balanceUsd, cotation);
    const poolBrl = formatBrl(poolLimit, cotation);
    return (
      <>
      <section
        className={`metric-card-ux metric-card-ux--pool${eventCount > 0 ? " metric-card-ux--clickable" : ""}`}
        id="card-consumo"
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
        title={eventCount > 0 ? "Ver eventos de consumo" : undefined}
      >
        <div className="metric-card-ux__glow metric-card-ux__glow--amber" aria-hidden />

        <header className="metric-card-ux__head">
          <div className="metric-card-ux__title-wrap">
            <div className="metric-icon metric-icon--sm metric-icon--amber">
              <FontAwesomeIcon icon={faGaugeHigh} className="text-amber-300" />
            </div>
            <div className="metric-card-ux__titles min-w-0">
              <p className="metric-card-ux__eyebrow metric-card-ux__eyebrow--amber">Consumo</p>
              <p className="metric-card-ux__title">Pool</p>
            </div>
          </div>
          {eventCount > 0 && (
            <button
              type="button"
              className="metric-card-ux__chip metric-card-ux__chip--amber"
              onClick={(e) => {
                e.stopPropagation();
                setShowEventsModal(true);
              }}
              title="Ver eventos de consumo"
            >
              <FontAwesomeIcon icon={faBolt} />
              <span>{eventCount.toLocaleString("pt-BR")}</span>
            </button>
          )}
        </header>

        <div className="metric-card-ux__progress">
          <div className="metric-card-ux__progress-meta">
            <span className="metric-card-ux__progress-label">Uso do pool</span>
            <span className="metric-card-ux__progress-pct">{usedPct}%</span>
          </div>
          <div className="metric-card-ux__progress-track">
            <div className="metric-card-ux__progress-fill" style={{ width: `${usedPct}%` }} />
          </div>
        </div>

        <div className="metric-card-ux__body metric-card-ux__body--pool">
          <div className="metric-card-ux__stat metric-card-ux__stat--green">
            <span className="metric-card-ux__stat-label">Saldo</span>
            <strong className="metric-card-ux__stat-value metric-card-ux__stat-value--green" title={balanceBrl}>
              {balanceBrl}
            </strong>
          </div>
          <div className="metric-card-ux__stat metric-card-ux__stat--amber">
            <span className="metric-card-ux__stat-label">Limite</span>
            <strong className="metric-card-ux__stat-value" title={poolBrl}>{poolBrl}</strong>
          </div>
          <div className="metric-card-ux__ring" aria-hidden>
            <svg className="metric-card-ux__ring-svg" viewBox="0 0 64 64">
              <circle cx="32" cy="32" fill="none" r="26" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="32"
                cy="32"
                fill="none"
                r="26"
                stroke="url(#amberGradBilling)"
                strokeDasharray="163.36"
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                strokeWidth="6"
              />
              <defs>
                <linearGradient id="amberGradBilling" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#fcd34d" />
                </linearGradient>
              </defs>
            </svg>
            <div className="metric-card-ux__ring-label">
              <span>{usedPct}%</span>
              <small>usado</small>
            </div>
          </div>
        </div>
      </section>
      {showEventsModal && (
        <UsageEventsModal
          scope="pool"
          cotation={cotation}
          showUsdForAdmin={isPlatformAdmin}
          variant="pool"
          eyebrow="Consumo"
          title="Eventos do pool"
          subtitle={summary.planId ? `Plano ${summary.planId}` : undefined}
          onClose={() => setShowEventsModal(false)}
        />
      )}
      </>
    );
  }

  if (visual === "sidebar") {
    return (
      <section className="metrics-card metrics-card--pool">
        <div className="metrics-card__head">
          <span className="metrics-card__head-icon" aria-hidden>
            ⚡
          </span>
          <h3 className="metrics-card__head-title">Consumo Pool</h3>
          <span className="metrics-card__head-pct">{usedPct}%</span>
        </div>
        <p className="metrics-card__amount">
          {formatBrl(usedUsd, cotation)}
        </p>
        <div className="metrics-card__progress">
          <div
            className="metrics-card__progress-fill"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="metrics-card__progress-meta">
          <span>Limite {formatBrl(poolLimit, cotation)}</span>
        </div>
        <div
          className="metrics-card__gauge"
          style={{ "--gauge-pct": `${usedPct}%` }}
          aria-hidden
        >
          <svg viewBox="0 0 36 36" className="metrics-card__gauge-svg">
            <path
              className="metrics-card__gauge-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="metrics-card__gauge-fill"
              strokeDasharray={`${usedPct}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="metrics-card__gauge-label">{usedPct}%</span>
        </div>

        {showEventsModal && (
          <UsageEventsModal
            scope="pool"
            cotation={cotation}
            showUsdForAdmin={isPlatformAdmin}
            variant="pool"
            onClose={() => setShowEventsModal(false)}
          />
        )}
      </section>
    );
  }

  return (
    <section className={`billing-panel${compact ? " billing-panel--compact" : ""}`}>
      <div className="billing-panel__head">
        <h2 className="billing-panel__title">Consumo</h2>
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

      {showEventsModal && (
        <UsageEventsModal
          scope="pool"
          cotation={cotation}
          showUsdForAdmin={isPlatformAdmin}
          variant="pool"
          onClose={() => setShowEventsModal(false)}
        />
      )}
    </section>
  );
}
