import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api.js";
import AppModal from "./components/AppModal.jsx";
import { formatBrl, formatCostBaseUsd, usdToBrl } from "./format-brl.js";

const PAGE_SIZE = 10;
const ALL_AGENTS = "";

/**
 * @param {{
 *   scope: "pool" | "project",
 *   projectSlug?: string|null,
 *   cotation?: number,
 *   showUsdForAdmin?: boolean,
 *   variant?: "cost" | "pool",
 *   eyebrow?: string,
 *   title?: string,
 *   subtitle?: string,
 *   onClose: () => void,
 * }} props
 */
export default function UsageEventsModal({
  scope,
  projectSlug,
  cotation: cotationProp = 5.1,
  showUsdForAdmin = false,
  variant = "pool",
  eyebrow = "Consumo",
  title = "Eventos de consumo",
  subtitle,
  onClose,
}) {
  const [page, setPage] = useState(1);
  const [agentFilter, setAgentFilter] = useState(ALL_AGENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

  const cotation = Number(payload?.cotation ?? cotationProp) || 5.1;
  const events = payload?.events ?? [];
  const stats = payload?.stats ?? {
    totalCount: 0,
    totalCostUsd: 0,
    confirmedCount: 0,
    estimatedCount: 0,
  };
  const agents = payload?.agents ?? [];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs =
        agentFilter && agentFilter !== ALL_AGENTS
          ? `?agent=${encodeURIComponent(agentFilter)}`
          : "";
      const url =
        scope === "project"
          ? `/api/billing/projects/${encodeURIComponent(String(projectSlug))}/usage-events${qs}`
          : `/api/billing/usage-events${qs}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error(await res.text());
      setPayload(await res.json());
    } catch (e) {
      setError(e.message || String(e));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [scope, projectSlug, agentFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [agentFilter, payload?.events?.length]);

  const rate = cotation;
  const eventCostUsd = (ev) => Number(ev.cost_base_usd ?? ev.charge_usd) || 0;

  const totalCostLabel = useMemo(
    () =>
      formatBrl(stats.totalCostUsd, rate),
    [stats.totalCostUsd, rate]
  );

  const pageCount = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEvents = events.slice(pageStart, pageStart + PAGE_SIZE);

  const pageSliceTotalBrl = pageEvents.reduce(
    (sum, ev) => sum + (usdToBrl(eventCostUsd(ev), rate) || 0),
    0
  );
  const pageSliceLabel = pageSliceTotalBrl.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const showingFrom = events.length === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(pageStart + PAGE_SIZE, events.length);

  const selectedAgentLabel =
    agentFilter === ALL_AGENTS
      ? "Todos os agentes"
      : agents.find((a) => a.agentKey === agentFilter)?.agentName ||
        agentFilter;

  return (
    <AppModal
      variant={variant}
      panelClassName={`modal-panel--usage-events usage-events-modal usage-events-modal--${variant}`}
      eyebrow={eyebrow}
      title={title}
      titleId="usage-events-title"
      subtitle={subtitle}
      subtitleClassName="usage-events-modal__context"
      onClose={onClose}
    >
      <div className="modal-panel__body usage-events-modal__body">
            <div className="usage-events-modal__toolbar">
              <label className="usage-events-modal__filter">
                <span className="usage-events-modal__filter-label">Agente</span>
                <select
                  className="usage-events-modal__filter-select"
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  disabled={loading}
                >
                  <option value={ALL_AGENTS}>Todos</option>
                  {agents.map((agent) => (
                    <option key={agent.agentKey} value={agent.agentKey}>
                      {agent.agentName} ({agent.count.toLocaleString("pt-BR")})
                    </option>
                  ))}
                </select>
              </label>
              {agentFilter !== ALL_AGENTS && (
                <span className="usage-events-modal__filter-active">
                  Filtrando: <strong>{selectedAgentLabel}</strong>
                </span>
              )}
            </div>

            <div className="usage-events-modal__kpi-row">
              <div className="usage-events-kpi">
                <span className="usage-events-kpi__label">Execuções</span>
                <strong className="usage-events-kpi__value">
                  {stats.totalCount.toLocaleString("pt-BR")}
                </strong>
                <span className="usage-events-kpi__hint">
                  {agentFilter === ALL_AGENTS ? "total histórico" : "no filtro"}
                </span>
              </div>
              <div className="usage-events-kpi">
                <span className="usage-events-kpi__label">Custo total</span>
                <strong className="usage-events-kpi__value">{totalCostLabel}</strong>
                <span className="usage-events-kpi__hint">
                  {agentFilter === ALL_AGENTS
                    ? "soma integral"
                    : `soma · ${selectedAgentLabel}`}
                </span>
              </div>
              <div className="usage-events-kpi">
                <span className="usage-events-kpi__label">Confirmados</span>
                <strong className="usage-events-kpi__value">
                  {stats.confirmedCount.toLocaleString("pt-BR")}
                  <span className="usage-events-kpi__sub">
                    {" "}
                    / {stats.estimatedCount.toLocaleString("pt-BR")} est.
                  </span>
                </strong>
                <span className="usage-events-kpi__hint">valores absolutos</span>
              </div>
            </div>

            {loading && (
              <p className="usage-events-modal__empty msg msg--muted">
                Carregando eventos…
              </p>
            )}

            {!loading && error && (
              <p className="usage-events-modal__empty msg msg--error">
                {error}
              </p>
            )}

            {!loading && !error && stats.totalCount === 0 && (
              <p className="usage-events-modal__empty msg msg--muted">
                Sem eventos registrados
                {agentFilter !== ALL_AGENTS ? " para este agente." : "."}
              </p>
            )}

            {!loading && !error && stats.totalCount > 0 && (
              <>
                {payload?.eventsTruncated && (
                  <p className="usage-events-modal__truncate-hint">
                    Exibindo os {payload.eventsLimit?.toLocaleString("pt-BR")}{" "}
                    eventos mais recentes. Totais acima refletem{" "}
                    {agentFilter === ALL_AGENTS ? "o histórico completo" : "o filtro completo"}.
                  </p>
                )}

                <div className="usage-events-table-wrap">
                  <table className="usage-events-table">
                    <thead>
                      <tr>
                        <th>Data / hora</th>
                        <th>Agente</th>
                        <th>Executor</th>
                        <th>Status</th>
                        <th className="usage-events-table__num">Cobrança</th>
                        <th>Referências</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="usage-events-table__empty-row">
                            Nenhum evento nesta página.
                          </td>
                        </tr>
                      ) : (
                        pageEvents.map((ev) => {
                          const confirmed = ev.charge_confirmed === true;
                          const chargeBrl = formatBrl(eventCostUsd(ev), rate);
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
                                  : "Cobrança estimada — pendente de confirmação"
                              }
                            >
                              <td className="usage-events-table__date">
                                <time dateTime={ev.created_at}>
                                  {formatDateTime(ev.created_at)}
                                </time>
                              </td>
                              <td className="usage-events-table__agent">
                                {ev.agent_name || "Sem agente"}
                              </td>
                              <td
                                className="usage-events-table__executor"
                                title={ev.executor_email || undefined}
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
                              <td className="usage-events-table__num">
                                <div className="usage-events-table__charge">
                                  <span className="usage-events-table__charge-brl">
                                    {chargeBrl}
                                  </span>
                                  {showUsdForAdmin && (
                                    <span className="usage-events-table__charge-usd">
                                      {formatCostBaseUsd(eventCostUsd(ev))}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="usage-events-table__refs">
                                {ev.job_id && (
                                  <span title={ev.job_id}>
                                    Job {shortId(ev.job_id)}
                                  </span>
                                )}
                                {ev.job_id && ev.execution_id && " · "}
                                {ev.execution_id && (
                                  <span title={ev.execution_id}>
                                    Exec {shortId(ev.execution_id)}
                                  </span>
                                )}
                                {!ev.job_id && !ev.execution_id && "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <footer className="usage-events-modal__footer">
                  <p className="usage-events-modal__range">
                    Mostrando{" "}
                    <strong>
                      {showingFrom}–{showingTo}
                    </strong>{" "}
                    de <strong>{events.length.toLocaleString("pt-BR")}</strong>{" "}
                    listados
                    {stats.totalCount > events.length && (
                      <>
                        {" "}
                        ·{" "}
                        <strong>{stats.totalCount.toLocaleString("pt-BR")}</strong>{" "}
                        no total
                      </>
                    )}
                    {pageEvents.length > 0 && (
                      <>
                        {" "}
                        · página <strong>{pageSliceLabel}</strong>
                      </>
                    )}
                  </p>

                  {pageCount > 1 && (
                    <nav
                      className="usage-events-pagination"
                      aria-label="Paginação de eventos"
                    >
                      <button
                        type="button"
                        className="usage-events-pagination__btn"
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </button>
                      <div className="usage-events-pagination__pages">
                        {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                          (n) => (
                            <button
                              key={n}
                              type="button"
                              className={`usage-events-pagination__page${
                                n === safePage
                                  ? " usage-events-pagination__page--active"
                                  : ""
                              }`}
                              aria-current={n === safePage ? "page" : undefined}
                              onClick={() => setPage(n)}
                            >
                              {n}
                            </button>
                          )
                        )}
                      </div>
                      <button
                        type="button"
                        className="usage-events-pagination__btn"
                        disabled={safePage >= pageCount}
                        onClick={() =>
                          setPage((p) => Math.min(pageCount, p + 1))
                        }
                      >
                        Próxima
                      </button>
                    </nav>
                  )}
                </footer>
              </>
            )}
          </div>
    </AppModal>
  );
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
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
