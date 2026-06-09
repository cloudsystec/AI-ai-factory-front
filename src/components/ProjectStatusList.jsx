import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faClock, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { scopeStepDisplayLabel } from "../lib/scopeTimeline.js";

const STATUS_COPY = {
  macro: {
    desc: "Planejamento macro concluído",
    done: "Concluído",
    active: "Em execução",
    pending: "Pendente",
  },
  micro: {
    desc: "Micro-tarefas mapeadas",
    done: "Concluído",
    active: "Em execução",
    pending: "Pendente",
  },
  tasking: {
    desc: "Execução em andamento",
    done: "Concluído",
    active: "Em execução",
    pending: "Pendente",
  },
  dev: {
    desc: "Aguardando aprovação final",
    label: "Deploy",
    done: "Concluído",
    active: "Pronto",
    pending: "Pendente",
  },
};

const DOT_CLASS = {
  done: "status-dot-green",
  active: "status-dot-amber",
  pending: "status-dot-red",
};

const BADGE_COLOR = {
  done: "text-emerald-300",
  active: "text-amber-300",
  pending: "text-red-300",
};

/**
 * @param {{
 *   scope: object,
 *   projectCompleted: boolean,
 *   onMacroClick?: () => void,
 *   onMicrosClick?: () => void,
 *   onTasksClick?: () => void,
 *   onDevClick?: () => void,
 * }} props
 */
export default function ProjectStatusList({
  scope,
  projectCompleted,
  onMacroClick,
  onMicrosClick,
  onTasksClick,
  onDevClick,
}) {
  if (!scope?.scopeSteps?.length) return null;

  const handlers = {
    macro: onMacroClick,
    micro: onMicrosClick,
    tasking: onTasksClick,
    dev: projectCompleted ? onDevClick : undefined,
  };

  return (
    <div className="project-status-list">
      {scope.scopeSteps.map((step) => {
        const copy = STATUS_COPY[step.key] || {
          desc: step.label,
          done: "Concluído",
          active: "Em execução",
          pending: "Pendente",
        };
        const state = step.state === "done" ? "done" : step.state === "active" ? "active" : "pending";
        const onClick = handlers[step.key];
        const Tag = onClick ? "button" : "div";
        const label =
          step.key === "dev"
            ? copy.label || scopeStepDisplayLabel(step.key, step.label)
            : scopeStepDisplayLabel(step.key, step.label);

        return (
          <Tag
            key={step.key}
            type={onClick ? "button" : undefined}
            className={`project-status-row project-status-row--${state}${onClick ? " project-status-row--clickable" : ""}`}
            onClick={onClick}
          >
            <div className="project-status-row__main">
              <span className={`project-status-row__dot ${DOT_CLASS[state]}`} aria-hidden />
              <div className="project-status-row__text min-w-0">
                <p className="project-status-row__title" title={label}>
                  {label}
                </p>
                <p className={`project-status-row__desc project-status-row__desc--${state}`}>
                  {copy.desc}
                </p>
              </div>
            </div>
            <div className="project-status-row__aside">
              <span className={`project-status-row__badge ${BADGE_COLOR[state]}`}>
                {copy[state]}
              </span>
              <div className={`project-status-row__icon project-status-row__icon--${state}`}>
                {state === "done" && (
                  <FontAwesomeIcon icon={faCheck} className="text-emerald-300" />
                )}
                {state === "active" && (
                  <FontAwesomeIcon icon={faSpinner} className="text-amber-300" spin />
                )}
                {state === "pending" && (
                  <FontAwesomeIcon icon={faClock} className="text-red-300" />
                )}
              </div>
            </div>
          </Tag>
        );
      })}
    </div>
  );
}
