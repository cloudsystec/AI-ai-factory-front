import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableColumns,
  faInbox,
  faCode,
  faFlaskVial,
  faUserCheck,
  faCheckDouble,
  faTriangleExclamation,
  faTerminal,
  faVial,
  faBan,
} from "@fortawesome/free-solid-svg-icons";
import ExecutionLogPanel from "./ExecutionLogPanel.jsx";

const COLUMN_STYLE = {
  todo: {
    sober: "col-todo-sober",
    icon: faInbox,
    iconClass: "text-teal-400",
    emptyIcon: faInbox,
    emptyBorder: "rgba(20,184,166,0.2)",
    emptyBg: "linear-gradient(135deg,rgba(20,184,166,0.1),rgba(99,102,241,0.06))",
    countBg: "rgba(20,184,166,0.14)",
    countColor: "#2dd4bf",
    countBorder: "rgba(20,184,166,0.25)",
    emptyText: "Sem tarefas pendentes",
  },
  development: {
    sober: "col-dev-sober",
    icon: faCode,
    iconClass: "text-violet-400",
    emptyIcon: faTerminal,
    emptyBorder: "rgba(139,92,246,0.2)",
    emptyBg: "linear-gradient(135deg,rgba(139,92,246,0.1),rgba(99,102,241,0.06))",
    countBg: "rgba(139,92,246,0.12)",
    countColor: "#a78bfa",
    countBorder: "rgba(139,92,246,0.22)",
    emptyText: "Automação em processo",
  },
  testing: {
    sober: "col-qa-sober",
    icon: faFlaskVial,
    iconClass: "text-amber-400",
    emptyIcon: faVial,
    emptyBorder: "rgba(245,158,11,0.18)",
    emptyBg: "linear-gradient(135deg,rgba(245,158,11,0.09),rgba(234,179,8,0.05))",
    countBg: "rgba(245,158,11,0.1)",
    countColor: "#fbbf24",
    countBorder: "rgba(245,158,11,0.2)",
    emptyText: "Aguardando testes",
  },
  human_approval: {
    sober: "col-review-sober",
    icon: faUserCheck,
    iconClass: "text-indigo-400",
    emptyIcon: faUserCheck,
    emptyBorder: "rgba(99,102,241,0.18)",
    emptyBg: "linear-gradient(135deg,rgba(99,102,241,0.09),rgba(139,92,246,0.05))",
    countBg: "rgba(99,102,241,0.1)",
    countColor: "#818cf8",
    countBorder: "rgba(99,102,241,0.2)",
    emptyText: "Aguardando revisão",
  },
  done: {
    sober: "col-done-sober",
    icon: faCheckDouble,
    iconClass: "text-emerald-400",
    emptyIcon: faCheckDouble,
    emptyBorder: "rgba(34,197,94,0.18)",
    emptyBg: "linear-gradient(135deg,rgba(34,197,94,0.09),rgba(16,185,129,0.05))",
    countBg: "rgba(34,197,94,0.1)",
    countColor: "#4ade80",
    countBorder: "rgba(34,197,94,0.2)",
    emptyText: "Nenhuma tarefa concluída",
  },
  blocked: {
    sober: "col-blocked-sober",
    icon: faBan,
    iconClass: "text-red-400",
    emptyIcon: faTriangleExclamation,
    emptyBorder: "rgba(239,68,68,0.18)",
    emptyBg: "linear-gradient(135deg,rgba(239,68,68,0.09),rgba(220,38,38,0.05))",
    countBg: "rgba(239,68,68,0.1)",
    countColor: "#f87171",
    countBorder: "rgba(239,68,68,0.2)",
    emptyText: "Sem bloqueios",
  },
};

/**
 * @param {{
 *   columns: Array<{ key: string, title: string, icon: string }>,
 *   tasks: object[],
 *   getKanbanColumn: (task: object) => string,
 *   renderTaskCard: (task: object) => React.ReactNode,
 *   disabled?: boolean,
 *   emptyHint?: string|null,
 * }} props
 */
export default function CommandCenter({
  columns,
  tasks,
  getKanbanColumn,
  renderTaskCard,
  disabled,
  emptyHint,
}) {
  const activeCount = tasks.filter(
    (t) => getKanbanColumn(t) !== "done" && getKanbanColumn(t) !== "blocked"
  ).length;

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 h-full gap-3${
        disabled ? " opacity-60 pointer-events-none" : ""
      }`}
    >
      {emptyHint && (
        <p className="text-dash-caption mb-2 px-1" style={{ color: "#64748b" }}>
          {emptyHint}
        </p>
      )}

      <div className="flex items-center justify-between flex-shrink-0" id="section-1">
        <h2 className="text-dash-title font-bold text-slate-100 flex items-center gap-2 font-display">
          <FontAwesomeIcon icon={faTableColumns} className="text-teal-400 text-dash-caption" />
          Tarefas
        </h2>
        <span className="text-dash-caption flex items-center gap-1.5" style={{ color: "#64748b" }}>
          <span
            className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block"
            style={{ boxShadow: "0 0 7px #14b8a6", animation: "blink 2s step-end infinite" }}
          />
          {activeCount} tarefa{activeCount !== 1 ? "s" : ""} ativa{activeCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div
        className="kanban-board flex gap-2 overflow-x-auto custom-scrollbar flex-1 min-h-0"
        id="section-2"
      >
        {columns.map((column) => {
          const colTasks = tasks.filter(
            (task) => getKanbanColumn(task) === column.key
          );
          const style = COLUMN_STYLE[column.key] || COLUMN_STYLE.todo;

          return (
            <div
              key={column.key}
              className="kanban-lane flex flex-col gap-2"
            >
              <div
                className={`glass-card rounded-xl px-3 py-2.5 flex items-center justify-between kanban-col-header ${style.sober} flex-shrink-0`}
              >
                <div className="flex items-center gap-1.5 text-dash-body font-bold text-slate-200 min-w-0">
                  <FontAwesomeIcon icon={style.icon} className={`${style.iconClass} text-dash-caption flex-shrink-0`} />
                  <span className="truncate">{column.title}</span>
                </div>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-dash-caption font-bold"
                  style={{
                    background: style.countBg,
                    color: style.countColor,
                    border: `1px solid ${style.countBorder}`,
                  }}
                >
                  {colTasks.length}
                </span>
              </div>

              {colTasks.length === 0 ? (
                <div
                  className="flex-1 rounded-xl flex flex-col items-center justify-center gap-2 py-6 kanban-empty"
                  style={{ border: `1px dashed ${style.emptyBorder}` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: style.emptyBg,
                      border: `1px solid ${style.emptyBorder}`,
                    }}
                  >
                    <FontAwesomeIcon icon={style.emptyIcon} className={`${style.iconClass} opacity-60 text-dash-title`} />
                  </div>
                  <span className="text-dash-caption text-center px-3" style={{ color: "#64748b" }}>
                    {style.emptyText}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1">
                  {colTasks.map((task) => renderTaskCard(task))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="flex gap-3 overflow-hidden flex-shrink-0 mt-auto"
        id="center-lower"
      >
        <ExecutionLogPanel />
      </div>
    </div>
  );
}
