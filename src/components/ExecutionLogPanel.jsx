import React, { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTerminal,
  faEraser,
  faDownload,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import AnsiPre, { lineMatchesLogFilter } from "./AnsiPre.jsx";
import { useRunnerExecution } from "../context/RunnerExecutionContext.jsx";
import { isLogNearBottom, scrollLogToBottom } from "../lib/scrollLogToBottom.js";

const FILTER_CHIPS = [
  { id: "all", label: "Tempo real", style: null },
  { id: "ok", label: "[OK]", bg: "rgba(20,184,166,0.09)", border: "rgba(20,184,166,0.18)", color: "#2dd4bf" },
  { id: "done", label: "[DONE]", bg: "rgba(20,184,166,0.09)", border: "rgba(20,184,166,0.18)", color: "#2dd4bf" },
  { id: "warn", label: "[WARN]", bg: "rgba(251,191,36,0.09)", border: "rgba(245,158,11,0.18)", color: "#fbbf24" },
  { id: "err", label: "[ERR]", bg: "rgba(239,68,68,0.09)", border: "rgba(239,68,68,0.18)", color: "#f87171" },
  { id: "inf", label: "[INFO]", bg: "rgba(99,102,241,0.09)", border: "rgba(99,102,241,0.18)", color: "#818cf8" },
];

export default function ExecutionLogPanel() {
  const r = useRunnerExecution();
  const [filter, setFilter] = useState("all");
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    setCleared(false);
    setFilter("all");
  }, [r.selectedSlot, r.job?.id]);

  const displayText = useMemo(() => {
    if (cleared) return "";
    const raw = r.logText || "";
    if (filter === "all") return raw;
    return raw
      .split("\n")
      .filter((line) => lineMatchesLogFilter(line, filter))
      .join("\n");
  }, [r.logText, filter, cleared]);

  const lineCount = displayText ? displayText.split("\n").filter(Boolean).length : 0;
  const prevNavRef = useRef("");
  const prevDisplayRef = useRef("");
  const followNavRef = useRef(false);

  useEffect(() => {
    const el = r.logScrollRef.current;
    if (!el) return;

    const navKey = `${r.selectedSlot ?? ""}:${r.job?.id ?? ""}`;
    if (navKey !== prevNavRef.current) {
      prevNavRef.current = navKey;
      prevDisplayRef.current = "";
      followNavRef.current = true;
      scrollLogToBottom(el, { behavior: "smooth" });
      const stopFollow = window.setTimeout(() => {
        followNavRef.current = false;
      }, 900);
      return () => window.clearTimeout(stopFollow);
    }
    return undefined;
  }, [r.selectedSlot, r.job?.id, r.logScrollRef]);

  useEffect(() => {
    const el = r.logScrollRef.current;
    const inner = el?.firstElementChild;
    if (!el || !inner) return;

    const ro = new ResizeObserver(() => {
      if (!followNavRef.current) return;
      scrollLogToBottom(el, { behavior: "smooth" });
    });
    ro.observe(inner);
    return () => ro.disconnect();
  }, [r.selectedSlot, r.job?.id, r.logScrollRef]);

  useEffect(() => {
    const el = r.logScrollRef.current;
    if (!el) return;

    const prev = prevDisplayRef.current;
    prevDisplayRef.current = displayText;

    const append =
      prev &&
      displayText &&
      displayText.startsWith(prev) &&
      displayText.length > prev.length;

    if (followNavRef.current) {
      scrollLogToBottom(el, { behavior: "smooth" });
      return;
    }

    if (append && r.isBusy) {
      if (isLogNearBottom(el)) {
        scrollLogToBottom(el, { behavior: "auto" });
      }
      return;
    }

    scrollLogToBottom(el, { behavior: "smooth" });
  }, [displayText, r.isBusy, r.logScrollRef]);

  function handleExport() {
    const blob = new Blob([displayText || r.logText || ""], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exec-log-${r.selectedProject || "project"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const placeholder = r.isBusy
    ? "…"
    : r.hasLog
      ? ""
      : r.selectedSlot
        ? `Sem registo para o bot #${r.selectedSlot} neste projeto.`
        : "Clique num bot para ver o registo, ou use ▶ para iniciar.";

  return (
    <section
      className="console-panel-inline flex-1 flex flex-col overflow-hidden"
      id="console-section"
      style={{ minWidth: 0 }}
    >
      <div
        className="flex items-center justify-between px-5 py-2 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(20,184,166,0.08)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,rgba(20,184,166,0.18),rgba(6,182,212,0.1))",
                border: "1px solid rgba(20,184,166,0.22)",
              }}
            >
              <FontAwesomeIcon icon={faTerminal} className="text-teal-400 text-dash-caption" />
            </div>
            <span className="dash-section-label text-slate-200 font-display">
              Log de Execução
              {r.selectedSlot ? ` · #${String(r.selectedSlot).padStart(2, "0")}` : ""}
            </span>
          </div>
          <div className="w-px h-4 hidden sm:block" style={{ background: "rgba(20,184,166,0.14)" }} />
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            <span
              className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block"
              style={{ animation: "blink 1.1s step-end infinite", boxShadow: "0 0 6px #14b8a6" }}
            />
            <span className="text-dash-caption text-teal-400 font-medium">{r.status.label}</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto">
            {FILTER_CHIPS.filter((f) => f.id !== "all").map((f) => (
              <button
                key={f.id}
                type="button"
                className="px-2 py-0.5 rounded-md text-dash-caption font-semibold flex-shrink-0"
                style={{
                  background: f.bg,
                  border: `1px solid ${f.border}`,
                  color: f.color,
                  opacity: filter === f.id ? 1 : 0.65,
                }}
                onClick={() => {
                  setCleared(false);
                  setFilter(f.id);
                }}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              className="px-2 py-0.5 rounded-md text-dash-caption font-semibold flex-shrink-0"
              style={{
                background: filter === "all" ? "rgba(20,184,166,0.15)" : "rgba(20,184,166,0.09)",
                border: "1px solid rgba(20,184,166,0.18)",
                color: "#2dd4bf",
              }}
              onClick={() => {
                setCleared(false);
                setFilter("all");
              }}
            >
              Tempo real
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="flex items-center gap-1 text-dash-caption px-2 py-1 rounded-lg"
            style={{ border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}
          >
            <FontAwesomeIcon
              icon={faCircle}
              className="text-teal-500 text-dash-caption"
              style={{ animation: "blink 1.4s step-end infinite" }}
            />
            <span>
              {lineCount} {lineCount === 1 ? "linha" : "linhas"}
            </span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 text-dash-caption hover:text-slate-300 transition-colors px-2 py-1 rounded-lg"
            style={{ border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}
            onClick={() => setCleared(true)}
          >
            <FontAwesomeIcon icon={faEraser} className="text-dash-caption" />
            Limpar
          </button>
          <button
            type="button"
            className="flex items-center gap-1 text-dash-caption hover:text-slate-300 transition-colors px-2 py-1 rounded-lg"
            style={{ border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}
            onClick={handleExport}
          >
            <FontAwesomeIcon icon={faDownload} className="text-dash-caption" />
            Export
          </button>
        </div>
      </div>

      {(r.error || r.execError) && (
        <p className="px-5 py-1 text-dash-caption text-red-400">{r.error || r.execError}</p>
      )}

      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <div
          ref={r.logScrollRef}
          className="h-full px-5 py-2.5 font-mono text-dash-caption overflow-y-auto custom-scrollbar log-area-scroll"
          id="log-area"
          style={{ background: "transparent", color: "#94a3b8" }}
        >
          <div className="min-h-full flex flex-col justify-end">
            {displayText ? (
              <AnsiPre text={displayText} className="m-0 whitespace-pre-wrap" />
            ) : (
              <pre className="m-0 whitespace-pre-wrap">
                {placeholder}
                {!displayText && !r.hasLog && <span className="log-cursor" />}
              </pre>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
