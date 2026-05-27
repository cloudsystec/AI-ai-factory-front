import React from "react";

const KIND_LABELS = {
  scope: "Escopo",
  "scope-tasks-only": "Onda",
  develop: "Fila",
  task: "Task",
  provision: "Provision",
  "tech-lead-review": "TL review",
  "micro-integration-qa": "QA micro",
  "micro-release": "Release",
};

function kindLabel(kind) {
  return KIND_LABELS[kind] || kind || "Job";
}

/**
 * @param {{
 *   slotsMax: number,
 *   slotsInUse: number,
 *   activeJobs: object[],
 *   selectedJobId: string|null,
 *   selectedSlots: number[],
 *   currentProject?: string|null,
 *   continuousActive?: boolean,
 *   onToggleSlot: (slotIndex: number, selected: boolean) => void,
 *   onSelectSlot: (jobId: string|null, slotIndex: number) => void,
 * }} props
 */
export default function WorkerRobots({
  slotsMax,
  slotsInUse,
  activeJobs,
  selectedJobId,
  selectedSlots,
  currentProject = null,
  continuousActive = false,
  onToggleSlot,
  onSelectSlot,
}) {
  const max = Math.max(1, Number(slotsMax) || 1);
  const selectedSet = new Set(selectedSlots);
  const slots = Array.from({ length: max }, (_, i) => {
    const slotIndex = i + 1;
    const job = activeJobs.find((j) => j.workerSlot === slotIndex) ?? activeJobs[i] ?? null;
    const busy = Boolean(job);
    const free = !busy;
    const mine = busy && currentProject && job.project === currentProject;
    const otherProject = busy && currentProject && job.project !== currentProject;
    return { index: i, slotIndex, job, busy, free, mine, otherProject };
  });

  return (
    <div
      className={`worker-robots${continuousActive ? " worker-robots--continuous" : ""}`}
      aria-label="Workers da conta"
    >
      <p className="worker-robots__label">
        Workers{" "}
        <span className="worker-robots__count">
          {slotsInUse}/{max}
        </span>
      </p>
      <div className="worker-robots__row" role="list">
        {slots.map(({ slotIndex, job, free, mine, otherProject }) => {
          const selected = job?.id && job.id === selectedJobId;
          const inPool = selectedSet.has(slotIndex);

          if (free) {
            return (
              <div
                key={slotIndex}
                role="listitem"
                className={[
                  "worker-robot",
                  "worker-robot--free",
                  inPool ? "worker-robot--pool" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={
                  inPool
                    ? "Incluído no pool de execução"
                    : "Livre — marque para incluir no Play"
                }
              >
                <label className="worker-robot__check-label">
                  <input
                    type="checkbox"
                    className="worker-robot__check"
                    checked={inPool}
                    onChange={(e) => onToggleSlot(slotIndex, e.target.checked)}
                    aria-label={`Worker ${slotIndex}, incluir no pool`}
                  />
                  <span className="worker-robot__sprite" aria-hidden>
                    <span className="worker-robot__head" />
                    <span className="worker-robot__body" />
                    <span className="worker-robot__arm worker-robot__arm--l" />
                    <span className="worker-robot__arm worker-robot__arm--r" />
                  </span>
                </label>
                <span className="worker-robot__slot">#{slotIndex}</span>
              </div>
            );
          }

          if (otherProject) {
            return (
              <div
                key={slotIndex}
                role="listitem"
                className="worker-robot worker-robot--busy worker-robot--other-project"
                title={`Ocupado em ${job.project}`}
                aria-label={`Worker ${slotIndex}, ocupado no projecto ${job.project}`}
              >
                <span className="worker-robot__sprite" aria-hidden>
                  <span className="worker-robot__head" />
                  <span className="worker-robot__body" />
                  <span className="worker-robot__arm worker-robot__arm--l" />
                  <span className="worker-robot__arm worker-robot__arm--r" />
                </span>
                <span className="worker-robot__slot">#{slotIndex}</span>
                <span className="worker-robot__meta">{job.project}</span>
              </div>
            );
          }

          return (
            <button
              key={slotIndex}
              type="button"
              role="listitem"
              className={[
                "worker-robot",
                "worker-robot--busy",
                selected ? "worker-robot--selected" : "",
                job ? "worker-robot--has-job" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              title={`${kindLabel(job.kind)} · ${job.project}${
                job.executorEmail ? ` · ${job.executorEmail}` : ""
              }${job.taskId ? ` · ${job.taskId}` : ""}`}
              aria-pressed={selected}
              aria-label={`Worker ${slotIndex}, em execução${job ? `, job ${job.id}` : ""}`}
              onClick={() => onSelectSlot(job?.id ?? null, slotIndex)}
              disabled={!job}
            >
              <span className="worker-robot__sprite" aria-hidden>
                <span className="worker-robot__head" />
                <span className="worker-robot__body" />
                <span className="worker-robot__arm worker-robot__arm--l" />
                <span className="worker-robot__arm worker-robot__arm--r" />
                <span className="worker-robot__pulse" />
              </span>
              <span className="worker-robot__slot">#{slotIndex}</span>
              {job && (
                <span className="worker-robot__meta">{kindLabel(job.kind)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
