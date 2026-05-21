import React from "react";

const KIND_LABELS = {
  scope: "Escopo",
  "scope-tasks-only": "Onda",
  develop: "Fila",
  task: "Task",
  provision: "Provision",
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
 *   onSelectSlot: (jobId: string|null, slotIndex: number) => void,
 * }} props
 */
export default function WorkerRobots({
  slotsMax,
  slotsInUse,
  activeJobs,
  selectedJobId,
  onSelectSlot,
}) {
  const max = Math.max(1, Number(slotsMax) || 1);
  const slots = Array.from({ length: max }, (_, i) => {
    const job = activeJobs[i] ?? null;
    const busy =
      Boolean(job) ||
      (activeJobs.length === 0 && i < (Number(slotsInUse) || 0));
    return { index: i, job, busy };
  });

  return (
    <div className="worker-robots" aria-label="Workers da conta">
      <p className="worker-robots__label">
        Workers{" "}
        <span className="worker-robots__count">
          {slotsInUse}/{max}
        </span>
      </p>
      <div className="worker-robots__row" role="list">
        {slots.map(({ index, job, busy }) => {
          const selected = job?.id && job.id === selectedJobId;
          const title = job
            ? `${kindLabel(job.kind)} · ${job.project}${
                job.executorEmail ? ` · ${job.executorEmail}` : ""
              }${job.taskId ? ` · ${job.taskId}` : ""}`
            : busy
              ? "Slot em uso"
              : "Livre";

          return (
            <button
              key={index}
              type="button"
              role="listitem"
              className={[
                "worker-robot",
                busy ? "worker-robot--busy" : "",
                selected ? "worker-robot--selected" : "",
                job ? "worker-robot--has-job" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              title={title}
              aria-pressed={selected}
              aria-label={`Worker ${index + 1}${busy ? ", em execução" : ", livre"}${job ? `, job ${job.id}` : ""}`}
              onClick={() => onSelectSlot(job?.id ?? null, index)}
              disabled={!job}
            >
              <span className="worker-robot__sprite" aria-hidden>
                <span className="worker-robot__head" />
                <span className="worker-robot__body" />
                <span className="worker-robot__arm worker-robot__arm--l" />
                <span className="worker-robot__arm worker-robot__arm--r" />
                {busy && <span className="worker-robot__pulse" />}
              </span>
              <span className="worker-robot__slot">#{index + 1}</span>
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
