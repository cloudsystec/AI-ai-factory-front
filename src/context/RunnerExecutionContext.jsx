import React, { createContext, useContext } from "react";
import { useRunnerExecutionState } from "../hooks/useRunnerExecutionState.js";

/** @type {React.Context<ReturnType<typeof useRunnerExecutionState>|null>} */
const RunnerExecutionContext = createContext(null);

/**
 * @param {Parameters<typeof useRunnerExecutionState>[0] & { children: React.ReactNode }} props
 */
export function RunnerExecutionProvider({ children, ...props }) {
  const value = useRunnerExecutionState(props);
  return (
    <RunnerExecutionContext.Provider value={value}>
      {children}
    </RunnerExecutionContext.Provider>
  );
}

export function useRunnerExecution() {
  const ctx = useContext(RunnerExecutionContext);
  if (!ctx) {
    throw new Error("useRunnerExecution requires RunnerExecutionProvider");
  }
  return ctx;
}
