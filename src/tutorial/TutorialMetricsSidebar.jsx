import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faChartLine,
  faCoins,
  faDiagramProject,
  faGaugeHigh,
} from "@fortawesome/free-solid-svg-icons";
import ProjectStatusList from "../components/ProjectStatusList.jsx";
import RunnerExecutionToggles from "../components/RunnerExecutionToggles.jsx";
import { formatBrl } from "../format-brl.js";
import { MOCK_BILLING_SUMMARY, MOCK_PROJECT_COST } from "./mockData.js";

/**
 * @param {{
 *   tutorialTarget?: string,
 *   clickable?: boolean,
 *   onClick?: () => void,
 *   eventCount?: number,
 *   children: React.ReactNode,
 *   className: string,
 *   id?: string,
 * }} props
 */
function TutorialMetricCardShell({
  tutorialTarget,
  clickable = false,
  onClick,
  children,
  className,
  id,
}) {
  const shellClass = [
    className,
    clickable ? "metric-card-ux--clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleKeyDown(e) {
    if (!clickable || !onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <section
      id={id}
      className={shellClass}
      data-tutorial={tutorialTarget || undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      title={clickable ? "Abrir detalhe de eventos" : undefined}
    >
      {children}
    </section>
  );
}

function TutorialProjectCostCard({ tutorialTarget, clickable, onClick }) {
  const data = MOCK_PROJECT_COST;
  const cotation = Number(data.cotation) || 5.1;
  const real = formatBrl(data.actualCostUsd, cotation);
  const prev = formatBrl(data.forecastCostUsd, cotation);
  const realNum = Number(data.actualCostUsd) || 0;
  const prevNum = Number(data.forecastCostUsd) || 0;
  const barHeights = [40, 60, 35, 75, 50, 90, 65].map((h) =>
    Math.round((h * (prevNum > 0 ? Math.min(1, realNum / prevNum) : 0.5)) / 100 * 100)
  );
  const eventCount = Number(data.usageEventsTotal) || 0;

  return (
    <TutorialMetricCardShell
      id="card-custo"
      className="metric-card-ux metric-card-ux--cost"
      tutorialTarget={tutorialTarget}
      clickable={clickable}
      onClick={onClick}
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
          <button type="button" className="metric-card-ux__chip metric-card-ux__chip--violet" tabIndex={-1}>
            <FontAwesomeIcon icon={faBolt} />
            <span>{eventCount.toLocaleString("pt-BR")}</span>
          </button>
        )}
      </header>

      <div className="metric-card-ux__body metric-card-ux__body--cost">
        <div className="metric-card-ux__stat metric-card-ux__stat--violet">
          <span className="metric-card-ux__stat-label">Real</span>
          <strong className="metric-card-ux__stat-value" title={real}>
            {real}
          </strong>
        </div>
        <div className="metric-card-ux__stat metric-card-ux__stat--indigo">
          <span className="metric-card-ux__stat-label">Previsto</span>
          <strong className="metric-card-ux__stat-value" title={prev}>
            {prev}
          </strong>
        </div>
        <div className="metric-card-ux__sparkline" aria-hidden>
          {barHeights.map((h, i) => (
            <span
              key={i}
              className="metric-card-ux__sparkline-bar"
              style={{ height: `${Math.max(14, h)}%` }}
            />
          ))}
        </div>
      </div>
    </TutorialMetricCardShell>
  );
}

function TutorialBillingPoolCard({ tutorialTarget, clickable, onClick }) {
  const summary = MOCK_BILLING_SUMMARY;
  const cotation = Number(summary.cotation) || 5.1;
  const usedPct = Math.min(100, Math.max(0, Number(summary.usedPercent) || 0));
  const poolLimit = Number(summary.poolCreditCycleUsd) || 0;
  const balanceUsd = Number(summary.balanceUsd) || 0;
  const balanceBrl = formatBrl(balanceUsd, cotation);
  const poolBrl = formatBrl(poolLimit, cotation);
  const strokeOffset = 163.36 * (1 - usedPct / 100);
  const eventCount = Number(summary.usageEventsTotal) || 0;

  return (
    <TutorialMetricCardShell
      id="card-consumo"
      className="metric-card-ux metric-card-ux--pool"
      tutorialTarget={tutorialTarget}
      clickable={clickable}
      onClick={onClick}
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
          <button type="button" className="metric-card-ux__chip metric-card-ux__chip--amber" tabIndex={-1}>
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
          <strong
            className="metric-card-ux__stat-value metric-card-ux__stat-value--green"
            title={balanceBrl}
          >
            {balanceBrl}
          </strong>
        </div>
        <div className="metric-card-ux__stat metric-card-ux__stat--amber">
          <span className="metric-card-ux__stat-label">Limite</span>
          <strong className="metric-card-ux__stat-value" title={poolBrl}>
            {poolBrl}
          </strong>
        </div>
        <div className="metric-card-ux__ring" aria-hidden>
          <svg className="metric-card-ux__ring-svg" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              fill="none"
              r="26"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              fill="none"
              r="26"
              stroke="url(#amberGradTutorialBilling)"
              strokeDasharray="163.36"
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              strokeWidth="6"
            />
            <defs>
              <linearGradient id="amberGradTutorialBilling" x1="0%" x2="100%" y1="0%" y2="0%">
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
    </TutorialMetricCardShell>
  );
}

/**
 * @param {{
 *   scope: object,
 *   currentStepId: string,
 *   onCostCardClick?: () => void,
 *   onPoolCardClick?: () => void,
 * }} props
 */
export default function TutorialMetricsSidebar({
  scope,
  currentStepId,
  onCostCardClick,
  onPoolCardClick,
}) {
  return (
    <aside
      className="sidebar-right metrics-sidebar rounded-2xl flex-shrink-0 flex flex-col overflow-hidden overflow-y-auto custom-scrollbar"
      id="sidebar-right"
      data-tutorial="metrics-sidebar"
    >
      <div className="metrics-sidebar__head sidebar-section-header px-5 py-3.5 flex items-center gap-2 flex-shrink-0">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,rgba(139,92,246,0.26),rgba(99,102,241,0.18))",
            border: "1px solid rgba(139,92,246,0.28)",
          }}
        >
          <FontAwesomeIcon icon={faChartLine} className="text-violet-300 text-dash-caption" />
        </div>
        <span className="dash-section-label text-slate-100 font-display">
          Métricas &amp; Status
        </span>
      </div>

      <div className="metrics-sidebar__cards metric-section">
        <TutorialProjectCostCard
          tutorialTarget={
            currentStepId === "metrics_cost_card" ? "metrics-cost-card" : undefined
          }
          clickable={currentStepId === "metrics_cost_card"}
          onClick={onCostCardClick}
        />
        <TutorialBillingPoolCard
          tutorialTarget={
            currentStepId === "metrics_pool_card" ? "metrics-pool-card" : undefined
          }
          clickable={currentStepId === "metrics_pool_card"}
          onClick={onPoolCardClick}
        />
      </div>

      {scope && (
        <div
          className="metrics-sidebar__status p-5 flex flex-col gap-3 flex-1 min-w-0"
          id="card-status-projeto"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg,rgba(20,184,166,0.22),rgba(6,182,212,0.13))",
                border: "1px solid rgba(20,184,166,0.26)",
              }}
            >
              <FontAwesomeIcon icon={faDiagramProject} className="text-teal-300 text-dash-caption" />
            </div>
            <p className="dash-section-label text-slate-200 font-display">Status do Projeto</p>
          </div>

          <ProjectStatusList
            scope={scope}
            projectCompleted={false}
            onMacroClick={() => {}}
            onMicrosClick={() => {}}
            onTasksClick={() => {}}
            onDevClick={() => {}}
          />

          <RunnerExecutionToggles />
        </div>
      )}
    </aside>
  );
}
