import React, { createContext, useContext } from "react";
import { useRunnerExecutionState } from "../hooks/useRunnerExecutionState.js";

/** @type {React.Context<ReturnType<typeof useRunnerExecutionState>|null>} */
const RunnerExecutionContext = createContext(null);

/** @param {Parameters<typeof useRunnerExecutionState>[0] & { children: React.ReactNode }} props */
function RunnerExecutionProviderLive({ children, ...props }) {
  const value = useRunnerExecutionState(props);
  return (
    <RunnerExecutionContext.Provider value={value}>
      {children}
    </RunnerExecutionContext.Provider>
  );
}

/**
 * @param {Parameters<typeof useRunnerExecutionState>[0] & {
 *   children: React.ReactNode,
 *   overrideValue?: ReturnType<typeof useRunnerExecutionState>|null,
 * }} props
 */
export function RunnerExecutionProvider({ children, overrideValue, ...props }) {
  if (overrideValue != null) {
    return (
      <RunnerExecutionContext.Provider value={overrideValue}>
        {children}
      </RunnerExecutionContext.Provider>
    );
  }
  return (
    <RunnerExecutionProviderLive {...props}>{children}</RunnerExecutionProviderLive>
  );
}
export function useRunnerExecution() {
  const ctx = useContext(RunnerExecutionContext);
  if (!ctx) {
    throw new Error("useRunnerExecution requires RunnerExecutionProvider");
  }
  return ctx;
}
