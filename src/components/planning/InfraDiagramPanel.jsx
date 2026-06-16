import React, { useState } from "react";
import PlanningLaneChat from "./PlanningLaneChat.jsx";
import {
  infraIconFallbackLetter,
  resolveInfraIconUrl,
} from "./infra-icons.js";

const NODE_COLORS = {
  frontend: "#14b8a6",
  backend: "#6366f1",
  database: "#f59e0b",
  cache: "#ef4444",
  queue: "#a855f7",
  external: "#64748b",
  storage: "#0ea5e9",
  cdn: "#22c55e",
};

/**
 * @param {{ infra: object|null, width?: number, height?: number }} props
 */
function InfraSvgDiagram({ infra, width = 760, height = 400 }) {
  if (!infra?.nodes?.length) return null;

  const nodes = infra.nodes;
  const edges = infra.edges || [];
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(nodes.length))));
  const rows = Math.ceil(nodes.length / cols);
  const cellW = width / cols;
  const cellH = Math.max(120, height / rows);

  const positions = new Map();
  nodes.forEach((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(n.id, {
      x: col * cellW + cellW / 2,
      y: row * cellH + cellH / 2,
    });
  });

  const svgHeight = rows * cellH;

  return (
    <svg
      viewBox={`0 0 ${width} ${svgHeight}`}
      className="infra-diagram-svg"
      role="img"
      aria-label="Diagrama de infraestrutura"
    >
      <defs>
        <marker
          id="infra-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const from = positions.get(e.from);
        const to = positions.get(e.to);
        if (!from || !to) return null;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        return (
          <g key={`edge-${i}`}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#475569"
              strokeWidth="1.5"
              markerEnd="url(#infra-arrow)"
            />
            {e.label && (
              <text
                x={mx}
                y={my - 8}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
              >
                {e.label}
              </text>
            )}
          </g>
        );
      })}
      {nodes.map((n) => {
        const p = positions.get(n.id);
        if (!p) return null;
        const accent = NODE_COLORS[n.type] || "#334155";
        const iconUrl = resolveInfraIconUrl(n);
        const cardW = 88;
        const cardH = 88;
        const x = p.x - cardW / 2;
        const y = p.y - cardH / 2;
        return (
          <g key={n.id}>
            <rect
              x={x}
              y={y}
              width={cardW}
              height={cardH}
              rx="14"
              fill="#0f172a"
              stroke={accent}
              strokeWidth="2"
            />
            {iconUrl ? (
              <image
                href={iconUrl}
                x={p.x - 20}
                y={p.y - 30}
                width="40"
                height="40"
              />
            ) : (
              <>
                <circle cx={p.x} cy={p.y - 10} r="20" fill={accent} fillOpacity="0.25" />
                <text
                  x={p.x}
                  y={p.y - 5}
                  fill="#e2e8f0"
                  fontSize="14"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {infraIconFallbackLetter(n.label)}
                </text>
              </>
            )}
            <text
              x={p.x}
              y={p.y + 28}
              fill="#e2e8f0"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
            >
              {truncateLabel(n.label, 14)}
            </text>
            <title>{n.label}</title>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * @param {string} label
 * @param {number} max
 */
function truncateLabel(label, max) {
  const t = String(label || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Legenda com ícone + descrição abaixo do diagrama.
 * @param {{ infra: object }} props
 */
function InfraNodeLegend({ infra }) {
  const nodes = infra?.nodes || [];
  if (!nodes.length) return null;

  return (
    <div className="infra-diagram-legend" role="list">
      {nodes.map((n) => (
        <InfraLegendItem key={n.id} node={n} />
      ))}
    </div>
  );
}

/**
 * @param {{ node: object }} props
 */
function InfraLegendItem({ node }) {
  const [iconFailed, setIconFailed] = useState(false);
  const accent = NODE_COLORS[node.type] || "#334155";
  const iconUrl = resolveInfraIconUrl(node);

  return (
    <article className="infra-legend-item" role="listitem">
      <div
        className="infra-legend-item__icon-wrap"
        style={{ borderColor: accent }}
      >
        {iconUrl && !iconFailed ? (
          <img
            src={iconUrl}
            alt=""
            className="infra-legend-item__icon"
            loading="lazy"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <span className="infra-legend-item__fallback" style={{ color: accent }}>
            {infraIconFallbackLetter(node.label)}
          </span>
        )}
      </div>
      <div className="infra-legend-item__text">
        <h4 className="infra-legend-item__title">{node.label}</h4>
        {node.description && (
          <p className="infra-legend-item__desc">{node.description}</p>
        )}
      </div>
    </article>
  );
}

/**
 * @param {{
 *   projectSlug: string,
 *   infra: object|null,
 *   infraStatus?: string,
 *   canWrite?: boolean,
 *   onApprove?: () => void,
 *   onGenerate?: () => void,
 *   onRefresh?: () => void,
 *   generating?: boolean,
 * }} props
 */
export default function InfraDiagramPanel({
  projectSlug,
  infra,
  infraStatus = "pending",
  canWrite = false,
  onApprove,
  onGenerate,
  onRefresh,
  generating = false,
}) {
  return (
    <div className="planning-infra-panel">
      <div className="planning-layout-panel__toolbar">
        {canWrite && onGenerate && (
          <button
            type="button"
            className="toolbar-btn toolbar-btn--primary"
            disabled={generating}
            onClick={onGenerate}
          >
            {generating ? "A gerar…" : infra ? "Regenerar infra" : "Gerar diagrama"}
          </button>
        )}
        {canWrite && infra && infraStatus !== "approved" && onApprove && (
          <button
            type="button"
            className="toolbar-btn toolbar-btn--primary"
            onClick={onApprove}
          >
            Aprovar infra
          </button>
        )}
        {infraStatus === "approved" && (
          <span className="planning-lane-card__badge planning-lane-card__badge--done">
            Aprovado
          </span>
        )}
      </div>

      <div className="planning-infra-panel__body">
        <div className="planning-infra-panel__diagram">
          {infra ? (
            <>
              <InfraSvgDiagram infra={infra} />
              <InfraNodeLegend infra={infra} />
              {Array.isArray(infra.notes) && infra.notes.length > 0 && (
                <ul className="planning-infra-panel__notes">
                  {infra.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="planning-layout-panel__empty">
              <p>Gere o diagrama de infraestrutura do app.</p>
            </div>
          )}
        </div>
        <aside className="planning-layout-panel__chat">
          <PlanningLaneChat
            projectSlug={projectSlug}
            lane="infra"
            disabled={!canWrite || !infra || generating || infraStatus === "generating"}
            disabledReason={
              !infra
                ? "Gere o diagrama para pedir alterações."
                : generating || infraStatus === "generating"
                  ? "Aguarde a conclusão da geração."
                  : ""
            }
            onRevisionApplied={onRefresh}
          />
        </aside>
      </div>
    </div>
  );
}
