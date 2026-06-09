import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine, faDiagramProject } from "@fortawesome/free-solid-svg-icons";
import ProjectCostPanel from "../ProjectCostPanel.jsx";
import BillingPanel from "../BillingPanel.jsx";
import ProjectStatusList from "./ProjectStatusList.jsx";
import RunnerExecutionToggles from "./RunnerExecutionToggles.jsx";

/**
 * @param {{
 *   projectSlug: string,
 *   cotation: object|null|undefined,
 *   scope: object|null,
 *   projectCompleted: boolean,
 *   onBillingSummary: (s: object) => void,
 *   onMacroClick?: () => void,
 *   onMicrosClick?: () => void,
 *   onTasksClick?: () => void,
 *   onDevClick?: () => void,
 * }} props
 */
export default function MetricsSidebar({
  projectSlug,
  cotation,
  scope,
  projectCompleted,
  onBillingSummary,
  onMacroClick,
  onMicrosClick,
  onTasksClick,
  onDevClick,
}) {
  return (
    <aside
      className="sidebar-right metrics-sidebar rounded-2xl flex-shrink-0 flex flex-col overflow-hidden overflow-y-auto custom-scrollbar"
      id="sidebar-right"
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
        <ProjectCostPanel
          projectSlug={projectSlug}
          cotation={cotation}
          visual="uxpilot"
        />
        <BillingPanel compact visual="uxpilot" onSummary={onBillingSummary} />
      </div>

      {scope && (
        <div className="metrics-sidebar__status p-5 flex flex-col gap-3 flex-1 min-w-0" id="card-status-projeto">
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
            <p className="dash-section-label text-slate-200 font-display">
              Status do Projeto
            </p>
          </div>

          <ProjectStatusList
            scope={scope}
            projectCompleted={projectCompleted}
            onMacroClick={onMacroClick}
            onMicrosClick={onMicrosClick}
            onTasksClick={onTasksClick}
            onDevClick={onDevClick}
          />

          <RunnerExecutionToggles />
        </div>
      )}
    </aside>
  );
}
