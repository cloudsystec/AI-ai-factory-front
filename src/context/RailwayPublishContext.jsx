import React, { createContext, useContext, useMemo } from "react";
import { useRailwayPublish } from "../hooks/useRailwayPublish.js";

/** @type {React.Context<ReturnType<typeof useRailwayPublish>|null>} */
const RailwayPublishContext = createContext(null);

/**
 * @param {{ projectSlug: string|null|undefined, children: React.ReactNode }} props
 */
export function RailwayPublishProvider({ projectSlug, children }) {
  const value = useRailwayPublish(projectSlug);
  const memo = useMemo(() => value, [
    value.publishStatus,
    value.publishError,
    value.publishLoading,
    value.isPublishing,
    value.handlePublish,
    value.loadPublishStatus,
  ]);
  return (
    <RailwayPublishContext.Provider value={memo}>
      {children}
    </RailwayPublishContext.Provider>
  );
}

export function useRailwayPublishContext() {
  const ctx = useContext(RailwayPublishContext);
  if (!ctx) {
    throw new Error("useRailwayPublishContext requires RailwayPublishProvider");
  }
  return ctx;
}

/** Safe for optional use outside provider (returns null). */
export function useRailwayPublishContextOptional() {
  return useContext(RailwayPublishContext);
}
