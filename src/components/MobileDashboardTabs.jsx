import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faChartLine,
  faTableColumns,
} from "@fortawesome/free-solid-svg-icons";

const TABS = [
  { id: "kanban", label: "Kanban", icon: faTableColumns },
  { id: "motor", label: "Motor", icon: faBolt },
  { id: "metrics", label: "Métricas", icon: faChartLine },
];

/**
 * @param {{
 *   activePanel: "kanban" | "motor" | "metrics",
 *   onPanelChange: (panel: "kanban" | "motor" | "metrics") => void,
 * }} props
 */
export default function MobileDashboardTabs({ activePanel, onPanelChange }) {
  return (
    <nav className="mobile-dashboard-tabs" aria-label="Navegação do dashboard">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`mobile-dashboard-tabs__btn${activePanel === tab.id ? " mobile-dashboard-tabs__btn--active" : ""}`}
          aria-current={activePanel === tab.id ? "page" : undefined}
          onClick={() => onPanelChange(tab.id)}
        >
          <FontAwesomeIcon icon={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
