import React, { useMemo, useState } from "react";
import AppModal from "../components/AppModal.jsx";
import GlassSelect from "../components/GlassSelect.jsx";
import { formatBrl } from "../format-brl.js";
import { MOCK_USAGE_EVENTS, TUTORIAL_PROJECT_SLUG } from "./mockData.js";

const PAGE_SIZE = 10;
const ALL_AGENTS = "";

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

/**
 * @param {{
 *   scope: "pool" | "project",
 *   variant?: "cost" | "pool",
 *   onClose: () => void,
 *   tutorialTarget?: string,
 * }} props
 */
export default function TutorialUsageEventsModal({
  scope,
  variant = "pool",
  onClose,
  tutorialTarget = "metrics-events-modal",
}) {
  const [page, setPage] = useState(1);
  const [agentFilter, setAgentFilter] = useState(ALL_AGENTS);

  const payload = MOCK_USAGE_EVENTS;
  const cotation = Number(payload.cotation) || 5.1;
  const events = useMemo(() => {
    if (!agentFilter || agentFilter === ALL_AGENTS) return payload.events;
    const label =
      payload.agents.find((a) => a.agentKey === agentFilter)?.agentName || agentFilter;
    return payload.events.filter((ev) => ev.agent_name === label);
  }, [agentFilter, payload.agents, payload.events]);

  const stats = payload.stats;
  const agents = payload.agents;
  const eventCostUsd = (ev) => Number(ev.cost_base_usd) || 0;
  const totalCostLabel = formatBrl(stats.totalCostUsd, cotation);
  const pageCount = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEvents = events.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = events.length === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(pageStart + PAGE_SIZE, events.length);
  const selectedAgentLabel =
    agentFilter === ALL_AGENTS
      ? "Todos os agentes"
      : agents.find((a) => a.agentKey === agentFilter)?.agentName || agentFilter;

  const eyebrow = scope === "project" ? "Custo projeto" : "Consumo";
  const title = scope === "project" ? "Eventos do projeto" : "Eventos do pool";
  const subtitle =
    scope === "project" ? TUTORIAL_PROJECT_SLUG : "Plano starter · demo";

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
      disableOverlayClose
      closeOnOverlayClick={false}
    >
      <div
        className="modal-panel__body usage-events-modal__body"
        data-tutorial={tutorialTarget}
      >
        <div className="usage-events-modal__toolbar">
          <label className="usage-events-modal__filter">
            <span className="usage-events-modal__filter-label">Agente</span>
            <GlassSelect
              wrapClassName="glass-select-wrap--auto"
              className="usage-events-modal__filter-select"
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value={ALL_AGENTS}>Todos</option>
              {agents.map((agent) => (
                <option key={agent.agentKey} value={agent.agentKey}>
                  {agent.agentName} ({agent.count.toLocaleString("pt-BR")})
                </option>
              ))}
            </GlassSelect>
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
              {agentFilter === ALL_AGENTS ? "soma integral" : `soma · ${selectedAgentLabel}`}
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
              {pageEvents.map((ev) => {
                const confirmed = ev.charge_confirmed === true;
                const chargeBrl = formatBrl(eventCostUsd(ev), cotation);
                return (
                  <tr
                    key={ev.execution_id}
                    className={
                      confirmed ? undefined : "usage-events-table__row--estimated"
                    }
                  >
                    <td className="usage-events-table__date">
                      <time dateTime={ev.created_at}>{formatDateTime(ev.created_at)}</time>
                    </td>
                    <td className="usage-events-table__agent">{ev.agent_name}</td>
                    <td className="usage-events-table__executor">{ev.executor_email}</td>
                    <td>
                      <span
                        className={`usage-events-status usage-events-status--${statusClass(ev.status)}`}
                      >
                        {formatStatus(ev.status)}
                        {!confirmed && (
                          <span className="usage-events-status__hint"> · est.</span>
                        )}
                      </span>
                    </td>
                    <td className="usage-events-table__num">
                      <span className="usage-events-table__charge-brl">{chargeBrl}</span>
                    </td>
                    <td className="usage-events-table__refs">
                      Job {shortId(ev.job_id)} · Exec {shortId(ev.execution_id)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="usage-events-modal__footer">
          <p className="usage-events-modal__range">
            Mostrando{" "}
            <strong>
              {showingFrom}–{showingTo}
            </strong>{" "}
            de <strong>{events.length.toLocaleString("pt-BR")}</strong> listados
          </p>
          {pageCount > 1 && (
            <nav className="usage-events-pagination" aria-label="Paginação de eventos">
              <button
                type="button"
                className="usage-events-pagination__btn"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <div className="usage-events-pagination__pages">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`usage-events-pagination__page${
                      n === safePage ? " usage-events-pagination__page--active" : ""
                    }`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="usage-events-pagination__btn"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Próxima
              </button>
            </nav>
          )}
        </footer>
      </div>
    </AppModal>
  );
}
