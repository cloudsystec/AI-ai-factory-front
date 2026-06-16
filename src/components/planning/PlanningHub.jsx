import React, { useState } from "react";
import PlanningLayoutPanel from "./PlanningLayoutPanel.jsx";
import InfraDiagramPanel from "./InfraDiagramPanel.jsx";

function laneStatusLabel(status) {
  switch (status) {
    case "approved":
    case "done":
      return "Concluído";
    case "review":
    case "active":
      return "Em revisão";
    case "generating":
      return "A gerar…";
    default:
      return "Pendente";
  }
}

/**
 * @param {{
 *   projectSlug: string,
 *   planningState: object|null,
 *   planningError?: string | null,
 *   canWrite?: boolean,
 *   generatingKind?: string|null,
 *   onGenerate: (kind: string) => void,
 *   onApprove: (lane: string) => void,
 *   onRefresh: () => void,
 *   onOpenMacro?: () => void,
 *   onOpenMicros?: () => void,
 *   onOpenTasks?: () => void,
 * }} props
 */
export default function PlanningHub({
  projectSlug,
  planningState,
  planningError = null,
  canWrite = false,
  generatingKind = null,
  onGenerate,
  onApprove,
  onRefresh,
  onOpenMacro,
  onOpenMicros,
  onOpenTasks,
}) {
  const lanes = planningState?.lanes ?? [];
  const [activeLane, setActiveLane] = useState("layout");

  const planning = planningState?.planning ?? {};
  const selected = lanes.find((l) => l.key === activeLane) ?? lanes[0];

  function handleLaneClick(lane) {
    setActiveLane(lane.key);
    if (lane.key === "macro") onOpenMacro?.();
    else if (lane.key === "micro") onOpenMicros?.();
    else if (lane.key === "tasks") onOpenTasks?.();
  }

  return (
    <div className="planning-hub">
      {planningError && (
        <p className="planning-hub__error msg msg--error" role="alert">
          {planningError}
        </p>
      )}
      <aside className="planning-hub__lanes" aria-label="Lanes de planejamento">
        {lanes.map((lane) => (
          <button
            key={lane.key}
            type="button"
            className={`planning-lane-card${
              activeLane === lane.key ? " planning-lane-card--active" : ""
            }${lane.approved ? " planning-lane-card--approved" : ""}`}
            onClick={() => handleLaneClick(lane)}
          >
            <span className="planning-lane-card__label">{lane.label}</span>
            <span className="planning-lane-card__status">
              {laneStatusLabel(lane.status)}
            </span>
          </button>
        ))}
        {planningState?.executionUnlocked ? (
          <p className="planning-hub__unlock msg msg--ok">
            Planejamento aprovado — pode alternar para Execução.
          </p>
        ) : (
          <p className="planning-hub__unlock msg msg--muted">
            Aprove Layout e Infra para liberar a execução de tasks.
          </p>
        )}
      </aside>

      <div className="planning-hub__panel">
        {activeLane === "layout" && (
          <PlanningLayoutPanel
            projectSlug={projectSlug}
            previewUrl={planningState?.previewUrl}
            previewVersion={planning?.layoutVersion}
            layoutStatus={planning?.layoutStatus}
            canWrite={canWrite}
            generating={generatingKind === "design-preview"}
            onGenerate={() => onGenerate("design-preview")}
            onApprove={() => onApprove("layout")}
            onRefresh={onRefresh}
          />
        )}
        {activeLane === "infra" && (
          <InfraDiagramPanel
            projectSlug={projectSlug}
            infra={planningState?.infra}
            infraStatus={planning?.infraStatus}
            canWrite={canWrite}
            generating={generatingKind === "design-infra"}
            onGenerate={() => onGenerate("design-infra")}
            onApprove={() => onApprove("infra")}
            onRefresh={onRefresh}
          />
        )}
        {activeLane === "discovery" && (
          <div className="planning-hub__placeholder">
            <h2>Discovery</h2>
            <p>Concluído na criação do projeto (chat PO/SM).</p>
          </div>
        )}
        {activeLane === "macro" && (
          <div className="planning-hub__placeholder">
            <h2>Macro</h2>
            <p>Escopo macro de alto nível.</p>
            {onOpenMacro && (
              <button type="button" className="toolbar-btn toolbar-btn--primary" onClick={onOpenMacro}>
                Abrir editor de macro
              </button>
            )}
          </div>
        )}
        {activeLane === "micro" && (
          <div className="planning-hub__placeholder">
            <h2>Micros</h2>
            <p>Microescopos validados pelo PO.</p>
            {onOpenMicros && (
              <button type="button" className="toolbar-btn toolbar-btn--primary" onClick={onOpenMicros}>
                Ver microescopos
              </button>
            )}
          </div>
        )}
        {activeLane === "tasks" && (
          <div className="planning-hub__placeholder">
            <h2>Tasks</h2>
            <p>Backlog da onda actual.</p>
            {onOpenTasks && (
              <button type="button" className="toolbar-btn toolbar-btn--primary" onClick={onOpenTasks}>
                Ver tasks
              </button>
            )}
          </div>
        )}
        {!selected && (
          <div className="planning-hub__placeholder">
            <p>Selecione uma lane de planejamento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
