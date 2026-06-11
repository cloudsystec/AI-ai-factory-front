import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import WorkerRobots from "../WorkerRobots.jsx";
import { useRunnerExecution } from "../context/RunnerExecutionContext.jsx";

/**
 * @param {{ playAllTutorialTarget?: string }} props
 */
export default function MotorSidebar({ playAllTutorialTarget }) {
  const r = useRunnerExecution();
  const poolPct =
    r.slotsMax > 0
      ? Math.round(((r.activeSlots?.length ?? 0) / r.slotsMax) * 100)
      : 0;
  const activeCount = r.activeSlots?.length ?? 0;
  const readyCount = (r.workersStatus ?? []).filter((w) => w.botReady).length;
  const canBulk = r.canExecute && !r.projectCompleted;
  const showPlayAll = canBulk && r.gitReady && readyCount > 0;
  const showPauseAll = canBulk && activeCount > 0;
  const bulkLoading = r.loadingSlot === -1;

  return (
    <aside
      className="sidebar-left rounded-2xl flex-shrink-0 flex flex-col overflow-hidden"
      id="sidebar-left"
    >
      <div className="sidebar-section-header px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,rgba(20,184,166,0.28),rgba(99,102,241,0.18))",
              border: "1px solid rgba(20,184,166,0.32)",
              boxShadow: "0 0 14px rgba(20,184,166,0.2)",
            }}
          >
            <FontAwesomeIcon icon={faBolt} className="text-teal-300 text-dash-caption" />
          </div>
          <span className="dash-section-label text-slate-200 bot-label-text font-display">
            Motor
          </span>
        </div>
        <div className="exec-badge flex items-center gap-1 px-1.5 py-0.5 rounded-md">
          <span className="text-dash-caption font-bold text-teal-300">{activeCount}</span>
          <span className="text-dash-caption" style={{ color: "#475569" }}>
            /{r.slotsMax || 0}
          </span>
        </div>
      </div>

      <div
        className="px-4 py-2 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(20,184,166,0.08)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-dash-caption uppercase tracking-wider" style={{ color: "#64748b" }}>
            Worker pool
          </span>
          <span className="text-dash-caption text-teal-400 font-bold">{poolPct}%</span>
        </div>
        <div className="pool-bar-track">
          <div
            className="pool-bar-fill"
            style={{ width: `${Math.max(poolPct, 4)}%` }}
          />
        </div>
      </div>

      {(showPlayAll || showPauseAll) && (
        <div
          className="motor-bulk-controls px-3 py-2 flex-shrink-0"
          role="toolbar"
          aria-label="Controles globais de execução"
        >
          {showPlayAll && (
            <button
              type="button"
              className="motor-bulk-controls__btn motor-bulk-controls__btn--play"
              disabled={bulkLoading}
              title="Iniciar todos os bots neste projeto"
              onClick={r.handlePlayAll}
              data-tutorial={playAllTutorialTarget || undefined}
            >
              <FontAwesomeIcon icon={faPlay} />
              <span>{bulkLoading ? "…" : "Play all"}</span>
            </button>
          )}
          {showPauseAll && (
            <button
              type="button"
              className="motor-bulk-controls__btn motor-bulk-controls__btn--pause"
              disabled={bulkLoading}
              title="Pausar todos os bots (jobs atuais terminam)"
              onClick={r.handlePauseAll}
            >
              <FontAwesomeIcon icon={faPause} />
              <span>Pause all</span>
            </button>
          )}
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 flex flex-col gap-2"
        id="bots-list"
      >
        <WorkerRobots
          variant="uxpilot-list"
          slotsMax={r.slotsMax}
          slotsInUse={r.slotsInUse}
          activeJobs={r.activeJobs}
          workersStatus={r.workersStatus}
          selectedJobId={r.job?.id ?? null}
          selectedSlot={r.selectedSlot}
          activeSlots={r.activeSlots}
          currentProject={r.selectedProject}
          canControl={r.canExecute && !r.projectCompleted}
          projectCompleted={r.projectCompleted}
          gitReady={r.gitReady}
          workspacePreparing={r.workspacePreparing}
          showGitUi={r.showGitUi}
          loadingSlot={r.loadingSlot}
          onSlotStart={r.handleSlotStart}
          onSlotStop={r.handleSlotStop}
          onSelectSlot={r.handleSelectSlot}
          onPlayAll={r.handlePlayAll}
          onPauseAll={r.handlePauseAll}
          playAllLoading={bulkLoading}
        />
      </div>
    </aside>
  );
}
