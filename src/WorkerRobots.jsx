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
 *   selectedSlot: number|null,
 *   activeSlots: number[],
 *   currentProject?: string|null,
 *   canControl?: boolean,
 *   gitReady?: boolean,
 *   workersStatus?: Array<{ slot: number, botReady: boolean }>,
 *   loadingSlot?: number|null,
 *   onSlotStart: (slotIndex: number) => void,
 *   onSlotStop: (slotIndex: number) => void,
 *   onSelectSlot: (jobId: string|null, slotIndex: number) => void,
 *   onPlayAll?: () => void,
 *   onPauseAll?: () => void,
 *   playAllLoading?: boolean,
 * }} props
 */
export default function WorkerRobots({
  slotsMax,
  slotsInUse,
  activeJobs,
  selectedJobId,
  selectedSlot,
  activeSlots,
  currentProject = null,
  canControl = false,
  gitReady = true,
  workersStatus = [],
  loadingSlot = null,
  onSlotStart,
  onSlotStop,
  onSelectSlot,
  onPlayAll,
  onPauseAll,
  playAllLoading = false,
}) {
  const max = Math.max(1, Number(slotsMax) || 1);
  const activeSet = new Set(activeSlots);
  const readyCount = workersStatus.filter((w) => w.botReady).length;
  const showBulkPlay =
    canControl && gitReady && readyCount > 0 && typeof onPlayAll === "function";
  const showBulkPause =
    canControl && activeSet.size > 0 && typeof onPauseAll === "function";
  const botReadyBySlot = new Map(
    workersStatus.map((w) => [w.slot, w.botReady === true])
  );
  const slots = Array.from({ length: max }, (_, i) => {
    const slotIndex = i + 1;
    const job =
      activeJobs.find((j) => Number(j.workerSlot) === slotIndex) ?? null;
    const busy = Boolean(job);
    const botReady =
      workersStatus.length === 0
        ? true
        : botReadyBySlot.get(slotIndex) === true;
    const running = activeSet.has(slotIndex);
    const otherProject = busy && currentProject && job.project !== currentProject;
    return {
      slotIndex,
      job,
      busy,
      botReady,
      running,
      otherProject,
    };
  });

  return (
    <div className="worker-robots" aria-label="Workers da conta">
      <div className="worker-robots__head">
        <p className="worker-robots__label">
          Bots{" "}
          <span className="worker-robots__count">
            {activeSet.size} em Play · {slotsInUse}/{max} jobs · {readyCount}{" "}
            configurados
          </span>
        </p>
        {(showBulkPlay || showBulkPause) && (
          <div className="worker-robots__bulk">
            {showBulkPlay && (
              <button
                type="button"
                className="worker-robots__bulk-btn worker-robots__bulk-btn--play"
                disabled={playAllLoading}
                title="Dar Play em todos os bots configurados neste projecto"
                onClick={onPlayAll}
              >
                {playAllLoading ? "…" : "▶ Todos"}
              </button>
            )}
            {showBulkPause && (
              <button
                type="button"
                className="worker-robots__bulk-btn worker-robots__bulk-btn--pause"
                disabled={playAllLoading}
                title="Parar todos os bots (jobs actuais terminam)"
                onClick={onPauseAll}
              >
                ⏸ Todos
              </button>
            )}
          </div>
        )}
      </div>
      <div className="worker-robots__row" role="list">
        {slots.map(
          ({ slotIndex, job, busy, botReady, running, otherProject }) => {
            const selected =
              selectedSlot === slotIndex
              || (job?.id && job.id === selectedJobId);
            const loading = loadingSlot === slotIndex;

            if (!botReady) {
              return (
                <div
                  key={slotIndex}
                  role="listitem"
                  className="worker-robot worker-robot--disabled"
                  title="Bot não configurado. Contacte o administrador da plataforma."
                >
                  <span className="worker-robot__sprite" aria-hidden>
                    <span className="worker-robot__head" />
                    <span className="worker-robot__body" />
                  </span>
                  <span className="worker-robot__slot">#{slotIndex}</span>
                  <span className="worker-robot__meta">Off</span>
                </div>
              );
            }

            const showStop = running;
            const showPlay = !running && canControl && gitReady;
            const gitBlocked = canControl && !gitReady && !running;

            return (
              <div
                key={slotIndex}
                role="listitem"
                className={[
                  "worker-robot",
                  "worker-robot--card",
                  busy ? "worker-robot--busy" : "worker-robot--free",
                  running ? "worker-robot--pool" : "",
                  selected ? "worker-robot--selected" : "",
                  otherProject ? "worker-robot--other-project" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  type="button"
                  className={`worker-robot__play${running ? " worker-robot__play--stop" : ""}`}
                  disabled={loading || (!showPlay && !showStop)}
                  title={
                    running
                      ? "Parar este bot (não pega novas tasks; job atual termina)"
                      : gitBlocked
                        ? "Git ainda não está pronto — o CLI provisiona o repo em background (não precisa de Play)"
                        : "Iniciar este bot neste projecto"
                  }
                  aria-label={
                    running
                      ? `Parar worker ${slotIndex}`
                      : `Iniciar worker ${slotIndex}`
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (running) onSlotStop(slotIndex);
                    else onSlotStart(slotIndex);
                  }}
                >
                  {loading ? "…" : running ? "⏸" : "▶"}
                </button>

                <button
                  type="button"
                  className="worker-robot__body-btn"
                  title={
                    busy
                      ? `${kindLabel(job.kind)} · ${job.project}${
                          job.taskId ? ` · ${job.taskId}` : ""
                        } — ver registo`
                      : running
                        ? "À espera de task — ver último registo deste bot"
                        : "Ver registo deste bot"
                  }
                  aria-label={`Registo do bot ${slotIndex}`}
                  aria-pressed={selected}
                  onClick={() => onSelectSlot(job?.id ?? null, slotIndex)}
                >
                  <span className="worker-robot__sprite" aria-hidden>
                    <span className="worker-robot__head" />
                    <span className="worker-robot__body" />
                    {busy && (
                      <>
                        <span className="worker-robot__arm worker-robot__arm--l" />
                        <span className="worker-robot__arm worker-robot__arm--r" />
                        <span className="worker-robot__pulse" />
                      </>
                    )}
                  </span>
                  <span className="worker-robot__slot">#{slotIndex}</span>
                  {busy && (
                    <span className="worker-robot__meta">
                      {kindLabel(job.kind)}
                    </span>
                  )}
                  {!busy && running && (
                    <span className="worker-robot__meta">À espera</span>
                  )}
                  {!busy && !running && (
                    <span className="worker-robot__meta">Parado</span>
                  )}
                </button>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
