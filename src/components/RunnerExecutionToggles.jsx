import React from "react";
import { useRunnerExecution } from "../context/RunnerExecutionContext.jsx";

/** Toggles Auto-run / Skip human — rodapé da sidebar de métricas (UX Pilot). */
export default function RunnerExecutionToggles() {
  const r = useRunnerExecution();

  if (!r.selectedProject || r.projectCompleted) return null;
  if (!r.canWrite && !r.canExecute) return null;

  return (
    <div className="flex flex-col gap-2 mt-auto pt-2">
      <div
        className="h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(20,184,166,0.15),transparent)" }}
      />
      <div className="flex items-center gap-3">
        {r.canWrite && (
          <label className="flex items-center justify-between text-dash-caption cursor-pointer select-none flex-1" style={{ color: "#64748b" }}>
            <span>Auto-run</span>
            <button
              type="button"
              role="switch"
              aria-checked={r.autorun}
              className="w-7 h-4 rounded-full relative flex-shrink-0"
              style={{
                background: r.autorun
                  ? "linear-gradient(135deg,rgba(20,184,166,0.28),rgba(6,182,212,0.18))"
                  : "rgba(15,25,55,0.95)",
                border: r.autorun
                  ? "1px solid rgba(20,184,166,0.35)"
                  : "1px solid rgba(255,255,255,0.08)",
                boxShadow: r.autorun ? "0 0 9px rgba(20,184,166,0.22)" : undefined,
              }}
              onClick={() => r.onAutorunChange(!r.autorun)}
            >
              <span
                className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                style={{
                  left: r.autorun ? "auto" : "2px",
                  right: r.autorun ? "2px" : "auto",
                  background: r.autorun
                    ? "linear-gradient(135deg,#14b8a6,#2dd4bf)"
                    : "rgba(51,65,85,0.9)",
                  boxShadow: r.autorun ? "0 0 7px rgba(20,184,166,0.75)" : undefined,
                }}
              />
            </button>
          </label>
        )}
        {r.canWrite && (
          <label className="flex items-center justify-between text-dash-caption text-teal-300 cursor-pointer select-none flex-1">
            <span>Skip val.</span>
            <button
              type="button"
              role="switch"
              aria-checked={r.skipHumanApproval}
              className="w-7 h-4 rounded-full relative flex-shrink-0"
              style={{
                background: r.skipHumanApproval
                  ? "linear-gradient(135deg,rgba(20,184,166,0.28),rgba(6,182,212,0.18))"
                  : "rgba(15,25,55,0.95)",
                border: r.skipHumanApproval
                  ? "1px solid rgba(20,184,166,0.35)"
                  : "1px solid rgba(255,255,255,0.08)",
                boxShadow: r.skipHumanApproval ? "0 0 9px rgba(20,184,166,0.22)" : undefined,
              }}
              onClick={() => r.onSkipHumanChange(!r.skipHumanApproval)}
            >
              <span
                className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                style={{
                  left: r.skipHumanApproval ? "auto" : "2px",
                  right: r.skipHumanApproval ? "2px" : "auto",
                  background: r.skipHumanApproval
                    ? "linear-gradient(135deg,#14b8a6,#2dd4bf)"
                    : "rgba(51,65,85,0.9)",
                  boxShadow: r.skipHumanApproval ? "0 0 7px rgba(20,184,166,0.75)" : undefined,
                }}
              />
            </button>
          </label>
        )}
      </div>
    </div>
  );
}
