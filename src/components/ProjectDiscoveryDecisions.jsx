import React from "react";
import {
  DISCOVERY_TOPIC_KEYS,
  DISCOVERY_TOPIC_LABELS,
} from "../tutorial/mockProjectDiscoveryResponses.js";

/**
 * @param {{
 *   decisions: Record<string, { value?: string, resolved?: boolean }>,
 *   progress: { resolved: number, total: number },
 *   topicLabels?: Record<string, string>,
 *   openTopics?: string[],
 *   readyToCreate: boolean,
 *   proposedName?: string | null,
 *   proposedSlug?: string | null,
 * }} props
 */
export default function ProjectDiscoveryDecisions({
  decisions,
  progress,
  topicLabels = DISCOVERY_TOPIC_LABELS,
  openTopics = [],
  readyToCreate,
  proposedName,
  proposedSlug,
}) {
  const labels = { ...DISCOVERY_TOPIC_LABELS, ...topicLabels };
  const currentTopic = openTopics[0] ?? null;

  return (
    <div className="project-discovery-decisions" aria-label="Decisões do projeto">
      <header className="project-discovery-decisions__head">
        <p className="project-discovery-decisions__eyebrow">Checklist PO/SM</p>
        <p className="project-discovery-decisions__progress">
          {progress.resolved}/{progress.total} decisões fechadas
        </p>
      </header>

      <div className="project-discovery-decisions__scroll custom-scrollbar">
        <ul className="project-discovery-decisions__list">
          {DISCOVERY_TOPIC_KEYS.map((key) => {
            const entry = decisions[key];
            const resolved = entry?.resolved === true;
            const isCurrent = !resolved && key === currentTopic;
            return (
              <li
                key={key}
                className={`project-discovery-decisions__item${
                  resolved ? " project-discovery-decisions__item--done" : ""
                }${isCurrent ? " project-discovery-decisions__item--current" : ""}`}
              >
                <span className="project-discovery-decisions__check" aria-hidden>
                  {resolved ? "✓" : "○"}
                </span>
                <div>
                  <strong>{labels[key] || key}</strong>
                  {resolved && entry?.value && (
                    <p className="project-discovery-decisions__value">{entry.value}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {readyToCreate && (
          <div className="project-discovery-decisions__summary">
            <p className="project-discovery-decisions__ready">Pronto para criar</p>
            {proposedName && (
              <p>
                <strong>Nome:</strong> {proposedName}
              </p>
            )}
            {proposedSlug && (
              <p>
                <strong>Slug:</strong>{" "}
                <code>{proposedSlug}</code>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
