import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faPause, faPlay, faRobot } from "@fortawesome/free-solid-svg-icons";

import { jobKindLabel } from "./lib/projectGit.js";

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
 *   projectCompleted?: boolean,
 *   gitReady?: boolean,
 *   workspacePreparing?: boolean,
 *   showGitUi?: boolean,
 *   workersStatus?: Array<{ slot: number, botReady: boolean }>,
 *   loadingSlot?: number|null,
 *   onSlotStart: (slotIndex: number) => void,
 *   onSlotStop: (slotIndex: number) => void,
 *   onSelectSlot: (jobId: string|null, slotIndex: number) => void,
 *   onPlayAll?: () => void,
 *   onPauseAll?: () => void,
 *   playAllLoading?: boolean,
 *   variant?: "grid" | "motor-list" | "uxpilot-list",
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
  projectCompleted = false,
  gitReady = true,
  workspacePreparing = false,
  showGitUi = true,
  workersStatus = [],
  loadingSlot = null,
  onSlotStart,
  onSlotStop,
  onSelectSlot,
  onPlayAll,
  onPauseAll,
  playAllLoading = false,
  variant = "grid",
}) {
  const max = Math.max(1, Number(slotsMax) || 1);
  const activeSet = new Set(activeSlots);
  const readyCount = workersStatus.filter((w) => w.botReady).length;
  const effectiveControl = canControl && !projectCompleted;
  const showBulkPlay =
    effectiveControl && gitReady && readyCount > 0 && typeof onPlayAll === "function";
  const showBulkPause =
    effectiveControl && activeSet.size > 0 && typeof onPauseAll === "function";
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

  const isUxpilot = variant === "uxpilot-list";
  const isList = variant === "motor-list";

  function statusLabel({ busy, running, botReady }) {
    if (!botReady) return "Off";
    if (busy) return "Executando";
    if (running) return "Ativo";
    return "Parado";
  }

  function statusClass({ busy, running, botReady }) {
    if (!botReady) return "worker-list-item__status--off";
    if (busy) return "worker-list-item__status--busy";
    if (running) return "worker-list-item__status--ready";
    return "worker-list-item__status--idle";
  }

  if (isUxpilot) {
    return (
      <>
        {projectCompleted && (
          <p className="text-dash-caption text-center px-2 py-1" style={{ color: "#64748b" }} role="status">
            Projeto finalizado — bots desativados
          </p>
        )}
        {slots.map(({ slotIndex, job, busy, botReady, running, otherProject }) => {
          const selected =
            selectedSlot === slotIndex || (job?.id && job.id === selectedJobId);
          const loading = loadingSlot === slotIndex;
          const active = running || busy;
          const showStop = running && effectiveControl;
          const showPlay = !running && effectiveControl && gitReady && botReady;
          const gitBlocked = effectiveControl && !gitReady && !running;

          function handleSelectBot() {
            if (!botReady) return;
            onSelectSlot(job?.id ?? null, slotIndex);
          }

          return (
            <div
              key={slotIndex}
              role="listitem"
              className={[
                "bot-sidebar-card glass-card rounded-xl px-2.5 py-2 flex items-center gap-2 relative",
                active ? "active" : "",
                selected ? "ring-1 ring-teal-400/40" : "",
                !botReady ? "opacity-50" : "cursor-pointer",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ border: "1px solid rgba(20,184,166,0.15)" }}
              onClick={handleSelectBot}
              onKeyDown={(e) => {
                if (!botReady) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectBot();
                }
              }}
              tabIndex={botReady ? 0 : undefined}
              aria-pressed={botReady ? selected : undefined}
              title={
                busy
                  ? `${jobKindLabel(job.kind, showGitUi)} · ${job.project}`
                  : "Ver registo deste bot"
              }
            >
              <span className="bot-corner-tl" aria-hidden />
              <span className="bot-corner-br" aria-hidden />
              <div className="bot-scan-wrap" aria-hidden>
                <div className="bot-scan-line" />
              </div>

              <div
                className="bot-avatar w-8 h-8 rounded-lg flex-shrink-0"
                aria-hidden
              >
                <div className="bot-avatar-glow" aria-hidden />
                <FontAwesomeIcon icon={faRobot} className="bot-avatar-icon text-dash-body" />
                <FontAwesomeIcon icon={faGear} className="bot-gear-a" style={{ top: 2, right: 2 }} />
                <FontAwesomeIcon icon={faGear} className="bot-gear-b" style={{ bottom: 2, left: 2 }} />
              </div>

              <div className="flex-1 min-w-0 z-[2]">
                <p className="bot-num-label text-dash-caption uppercase tracking-wider truncate">
                  Worker #{String(slotIndex).padStart(2, "0")}
                </p>
                <p className="bot-status-text text-dash-caption truncate" style={{ color: "#64748b" }}>
                  {otherProject
                    ? `Outro: ${job?.project}`
                    : statusLabel({ busy, running, botReady })}
                </p>
              </div>

              <span className="bot-status-dot flex-shrink-0" aria-hidden />

              {effectiveControl && botReady && (
                <button
                  type="button"
                  className={[
                    "bot-ctrl-btn",
                    running ? "bot-ctrl-btn--pause" : "bot-ctrl-btn--play",
                    loading ? "bot-ctrl-btn--loading" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={loading || (!showPlay && !showStop)}
                  title={
                    running
                      ? "Pausar este bot"
                      : gitBlocked
                        ? workspacePreparing
                          ? "Preparando workspace…"
                          : "Aguarde o workspace"
                        : "Iniciar este bot"
                  }
                  aria-label={
                    running
                      ? `Pausar worker ${slotIndex}`
                      : `Iniciar worker ${slotIndex}`
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (running) onSlotStop(slotIndex);
                    else onSlotStart(slotIndex);
                  }}
                >
                  {loading ? (
                    <span className="bot-ctrl-btn__spinner" aria-hidden />
                  ) : (
                    <FontAwesomeIcon
                      icon={running ? faPause : faPlay}
                      className="bot-ctrl-btn__icon"
                    />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div
      className={`worker-robots${isList ? " worker-robots--list" : ""}`}
      aria-label="Workers da conta"
    >
      {!isList && (
      <div className="worker-robots__head">
        <p className="worker-robots__label">
          Bots{" "}
          <span className="worker-robots__count">
            {activeSet.size} em Play · {slotsInUse}/{max} jobs · {readyCount}{" "}
            configurados
          </span>
        </p>
        {projectCompleted && (
          <p className="worker-robots__completed-hint" role="status">
            Projeto finalizado — bots desativados
          </p>
        )}
        {(showBulkPlay || showBulkPause) && (
          <div className="worker-robots__bulk">
            {showBulkPlay && (
              <button
                type="button"
                className="worker-robots__bulk-btn worker-robots__bulk-btn--play"
                disabled={playAllLoading}
                title="Dar Play em todos os bots configurados neste projeto"
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
      )}
      {isList && projectCompleted && (
        <p className="worker-robots__completed-hint" role="status">
          Projeto finalizado — bots desativados
        </p>
      )}
      <div className="worker-robots__row" role="list">
        {slots.map(
          ({ slotIndex, job, busy, botReady, running, otherProject }) => {
            const selected =
              selectedSlot === slotIndex
              || (job?.id && job.id === selectedJobId);
            const loading = loadingSlot === slotIndex;

            if (isList) {
              const showStop = running && effectiveControl;
              const showPlay = !running && effectiveControl && gitReady;
              const gitBlocked = effectiveControl && !gitReady && !running;

              return (
                <div
                  key={slotIndex}
                  role="listitem"
                  className={[
                    "worker-list-item",
                    !botReady ? "worker-list-item--disabled" : "",
                    busy ? "worker-list-item--busy" : "",
                    running ? "worker-list-item--running" : "",
                    selected ? "worker-list-item--selected" : "",
                    otherProject ? "worker-list-item--other" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {effectiveControl && botReady && (
                    <button
                      type="button"
                      className={`worker-list-item__play${
                        running ? " worker-list-item__play--stop" : ""
                      }`}
                      disabled={loading || (!showPlay && !showStop)}
                      title={
                        running
                          ? "Parar este bot"
                          : gitBlocked
                            ? workspacePreparing
                              ? "A preparar workspace…"
                              : "Aguarde o workspace"
                            : "Iniciar bot"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (running) onSlotStop(slotIndex);
                        else onSlotStart(slotIndex);
                      }}
                    >
                      {loading ? "…" : running ? "⏸" : "▶"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="worker-list-item__main"
                    disabled={!botReady}
                    aria-pressed={selected}
                    onClick={() =>
                      botReady && onSelectSlot(job?.id ?? null, slotIndex)
                    }
                  >
                    <span className="worker-list-item__avatar" aria-hidden>
                      🤖
                    </span>
                    <span className="worker-list-item__info">
                      <span className="worker-list-item__name">
                        Worker #{String(slotIndex).padStart(2, "0")}
                      </span>
                      <span
                        className={`worker-list-item__status ${statusClass({
                          busy,
                          running,
                          botReady,
                        })}`}
                      >
                        {statusLabel({ busy, running, botReady })}
                      </span>
                    </span>
                  </button>
                  <span className="worker-list-item__sparkline" aria-hidden>
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              );
            }

            if (!botReady) {
              return (
                <div
                  key={slotIndex}
                  role="listitem"
                  className="worker-robot worker-robot--disabled"
                  title="Bot não configurado. Contate o administrador da plataforma."
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

            const showStop = running && effectiveControl;
            const showPlay = !running && effectiveControl && gitReady;
            const gitBlocked = effectiveControl && !gitReady && !running;

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
                {effectiveControl && (
                  <button
                    type="button"
                    className={`worker-robot__play${running ? " worker-robot__play--stop" : ""}`}
                    disabled={loading || (!showPlay && !showStop)}
                    title={
                      running
                        ? "Parar este bot (não pega novas tasks; job atual termina)"
                        : gitBlocked
                          ? workspacePreparing
                            ? "A preparar workspace…"
                            : "Aguarde o workspace ficar pronto"
                          : "Iniciar este bot neste projeto"
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
                )}

                <button
                  type="button"
                  className="worker-robot__body-btn"
                  title={
                    busy
                      ? `${jobKindLabel(job.kind, showGitUi)} · ${job.project}${
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
                      {jobKindLabel(job.kind, showGitUi)}
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
