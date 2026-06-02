import React, { useEffect } from "react";
import { formatBrl, formatCostBaseUsd, usdToBrl } from "./format-brl.js";

/**
 * @param {{
 *   events: object[],
 *   cotation?: number,
 *   showUsdForAdmin?: boolean,
 *   eyebrow?: string,
 *   title?: string,
 *   subtitle?: string,
 *   onClose: () => void,
 * }} props
 */
export default function UsageEventsModal({
  events,
  cotation = 5.1,
  showUsdForAdmin = false,
  eyebrow = "Consumo",
  title = "Últimos eventos",
  subtitle,
  onClose,
}) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const rate = Number(cotation) || 5.1;
  const eventCostUsd = (ev) => Number(ev.cost_base_usd ?? ev.charge_usd) || 0;
  const totalChargeBrl = events.reduce(
    (sum, ev) => sum + (usdToBrl(eventCostUsd(ev), rate) || 0),
    0
  );

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel--usage-events"
        role="dialog"
        aria-modal="true"
        aria-labelledby="usage-events-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-panel__header">
          <div>
            <p className="modal-panel__eyebrow">{eyebrow}</p>
            <h2 id="usage-events-title" className="modal-panel__title">
              {title}
            </h2>
            <p className="usage-events-modal__subtitle">
              {subtitle ? (
                <>
                  {subtitle}
                  <br />
                </>
              ) : null}
              {events.length} registo{events.length !== 1 ? "s" : ""} · cobrança
              total{" "}
              {totalChargeBrl.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <button
            type="button"
            className="modal-panel__close"
            onClick={onClose}
          >
            Fechar
          </button>
        </header>

        <div className="modal-panel__body usage-events-modal__body">
          <div className="usage-events-table-wrap">
            <table className="usage-events-table">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Executado por</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="usage-events-table__num">
                    Cobrança (R$)
                  </th>
                  <th scope="col">Job</th>
                  <th scope="col">Execução</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  // Esmaecer só por metadado da API — nunca pelo valor (evita falso positivo em $0.01 real).
                  const confirmed = ev.charge_confirmed === true;
                  return (
                    <tr
                      key={ev.execution_id}
                      className={
                        confirmed
                          ? undefined
                          : "usage-events-table__row--estimated"
                      }
                      title={
                        confirmed
                          ? undefined
                          : "Cobrança não confirmada pela Cursor (estimativa, pendente ou taxa mínima)"
                      }
                    >
                      <td className="usage-events-table__date">
                        <time dateTime={ev.created_at}>
                          {formatDateTime(ev.created_at)}
                        </time>
                      </td>
                      <td
                        className="usage-events-table__executor"
                        title={ev.executor_email || ""}
                      >
                        {ev.executor_email || "—"}
                      </td>
                      <td>
                        <span
                          className={`usage-events-status usage-events-status--${statusClass(ev.status)}`}
                        >
                          {formatStatus(ev.status)}
                          {!confirmed && (
                            <span className="usage-events-status__hint">
                              {" "}
                              · est.
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="usage-events-table__num usage-events-table__charge">
                        <span className="usage-events-table__charge-brl">
                          {formatBrl(eventCostUsd(ev), rate)}
                        </span>
                        {showUsdForAdmin && (
                          <span className="usage-events-table__charge-usd">
                            {formatCostBaseUsd(eventCostUsd(ev))}
                          </span>
                        )}
                      </td>
                      <td
                        className="usage-events-table__id"
                        title={ev.job_id || ""}
                      >
                        {shortId(ev.job_id)}
                      </td>
                      <td
                        className="usage-events-table__id usage-events-table__id--muted"
                        title={ev.execution_id}
                      >
                        {shortId(ev.execution_id)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status) {
  const map = {
    completed: "Concluído",
    estimated: "Estimativa",
    cancelled: "Cancelado",
    failed: "Falhou",
  };
  return map[status] || status || "—";
}

function statusClass(status) {
  if (status === "completed") return "ok";
  if (status === "estimated") return "pending";
  if (status === "cancelled") return "muted";
  if (status === "failed") return "error";
  return "default";
}

function shortId(id) {
  if (!id) return "—";
  const s = String(id);
  if (s.length <= 12) return s;
  return `${s.slice(0, 8)}…`;
}
