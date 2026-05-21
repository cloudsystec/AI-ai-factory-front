import React, { useEffect } from "react";

/**
 * @param {{ events: object[], onClose: () => void }} props
 */
export default function UsageEventsModal({ events, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const totalCharge = events.reduce(
    (sum, ev) => sum + (Number(ev.charge_usd) || 0),
    0
  );
  const totalBase = events.reduce(
    (sum, ev) => sum + (Number(ev.cost_base_usd) || 0),
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
            <p className="modal-panel__eyebrow">Consumo</p>
            <h2 id="usage-events-title" className="modal-panel__title">
              Últimos eventos
            </h2>
            <p className="usage-events-modal__subtitle">
              {events.length} registo{events.length !== 1 ? "s" : ""} · cobrança
              total ${totalCharge.toFixed(2)} · base ${totalBase.toFixed(2)}
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
                  <th scope="col">Estado</th>
                  <th scope="col" className="usage-events-table__num">
                    Base (USD)
                  </th>
                  <th scope="col" className="usage-events-table__num">
                    Cobrança (USD)
                  </th>
                  <th scope="col">Job</th>
                  <th scope="col">Execução</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.execution_id}>
                    <td className="usage-events-table__date">
                      <time dateTime={ev.created_at}>
                        {formatDateTime(ev.created_at)}
                      </time>
                    </td>
                    <td>
                      <span
                        className={`usage-events-status usage-events-status--${statusClass(ev.status)}`}
                      >
                        {formatStatus(ev.status)}
                      </span>
                    </td>
                    <td className="usage-events-table__num">
                      {formatUsd(ev.cost_base_usd)}
                    </td>
                    <td className="usage-events-table__num usage-events-table__charge">
                      {formatUsd(ev.charge_usd)}
                    </td>
                    <td className="usage-events-table__id" title={ev.job_id || ""}>
                      {shortId(ev.job_id)}
                    </td>
                    <td
                      className="usage-events-table__id usage-events-table__id--muted"
                      title={ev.execution_id}
                    >
                      {shortId(ev.execution_id)}
                    </td>
                  </tr>
                ))}
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

function formatUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function formatStatus(status) {
  const map = {
    completed: "Concluído",
    cancelled: "Cancelado",
    failed: "Falhou",
  };
  return map[status] || status || "—";
}

function statusClass(status) {
  if (status === "completed") return "ok";
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
