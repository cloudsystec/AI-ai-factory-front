import React from "react";
import ProjectDeliveryActions from "./ProjectDeliveryActions.jsx";
import {
  isScopeStateRenderable,
  scopeStepDisplayLabel,
} from "../lib/scopeTimeline.js";

export default function ProjectTimeline({
  scope,
  projectSlug,
  projectCompleted,
  onOpenDetail,
  onMacroClick,
  onMicrosClick,
  onTasksClick,
  onDevClick,
  embedded = true,
  showStatusBanner = false,
}) {
  if (!isScopeStateRenderable(scope)) {
    return (
      <section
        className={`project-timeline project-timeline--loading${
          embedded ? " project-timeline--embedded" : ""
        }`}
      >
        <span className="project-timeline__loading-text">
          Carregando escopo…
        </span>
      </section>
    );
  }

  return (
    <section
      className={`project-timeline${
        projectCompleted ? " project-timeline--completed" : ""
      }${embedded ? " project-timeline--embedded" : ""}`}
      aria-label="Progresso do projeto"
    >
      <div className="project-timeline__toolbar">
        <div className="project-timeline__stepper" role="list">
          {scope.scopeSteps.map((step, i) => {
            const clickable =
              (step.key === "macro" && onMacroClick) ||
              (step.key === "micro" && onMicrosClick) ||
              (step.key === "tasking" && onTasksClick) ||
              (step.key === "dev" && projectCompleted && onDevClick);
            const onStepClick =
              step.key === "macro"
                ? onMacroClick
                : step.key === "micro"
                  ? onMicrosClick
                  : step.key === "tasking"
                    ? onTasksClick
                    : step.key === "dev" && projectCompleted
                      ? onDevClick
                      : undefined;

            const label = scopeStepDisplayLabel(step.key, step.label);
            const prevDone =
              i > 0 && scope.scopeSteps[i - 1].state === "done";

            return (
              <React.Fragment key={step.key}>
                {i > 0 && (
                  <div
                    className={`project-timeline__rail${
                      prevDone ? " project-timeline__rail--done" : ""
                    }${step.state === "active" ? " project-timeline__rail--active" : ""}`}
                    aria-hidden
                  />
                )}
                <div className="project-timeline__node" role="listitem">
                  <button
                    type="button"
                    className={[
                      "timeline-node",
                      `timeline-node--${step.state}`,
                      clickable ? "timeline-node--clickable" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={!clickable}
                    onClick={clickable ? onStepClick : undefined}
                    title={
                      clickable
                        ? step.key === "dev"
                          ? "Ver resumo de finalização"
                          : `Abrir ${label}`
                        : `${label}: ${step.state}`
                    }
                  >
                    <span className="timeline-node__ring">
                      <span className="timeline-node__dot">
                        {step.state === "done" ? (
                          <svg
                            viewBox="0 0 12 12"
                            width="12"
                            height="12"
                            aria-hidden
                          >
                            <path
                              d="M2 6l3 3 5-6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : step.state === "active" ? (
                          <span className="timeline-node__pulse" />
                        ) : null}
                      </span>
                    </span>
                    <span className="timeline-node__label">{label}</span>
                  </button>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {projectCompleted && projectSlug && (
          <ProjectDeliveryActions
            projectSlug={projectSlug}
            layout="timeline"
            showStatus={false}
          />
        )}
      </div>

      {showStatusBanner && projectCompleted && projectSlug && (
        <div className="project-timeline__status-banner">
          <ProjectDeliveryActions
            projectSlug={projectSlug}
            layout="timeline"
            showActions={false}
          />
        </div>
      )}

      {onOpenDetail && !projectCompleted && !embedded && (
        <button
          type="button"
          className="toolbar-btn toolbar-btn--link project-timeline__detail-link"
          onClick={onOpenDetail}
        >
          Detalhes do escopo
        </button>
      )}
    </section>
  );
}
