import React from "react";
import ProjectDeliveryActions from "./ProjectDeliveryActions.jsx";
import { useRailwayPublishContextOptional } from "../context/RailwayPublishContext.jsx";
import {
  publishUiTone,
  isPublishInProgress,
} from "../lib/railwayPublish.js";

/** Faixa entre header e body quando há publicação activa ou resultado */
export default function DashboardPublishStrip({ projectSlug }) {
  const ctx = useRailwayPublishContextOptional();
  if (!projectSlug || !ctx) return null;

  const tone = publishUiTone(ctx.publishStatus);
  const inProgress =
    ctx.publishLoading ||
    ctx.isPublishing ||
    isPublishInProgress(ctx.publishStatus);
  const visible =
    inProgress || tone === "success" || tone === "error";

  if (!visible) return null;

  return (
    <div className="mx-4 mb-2 flex-shrink-0">
      <div className="glass-panel rounded-xl px-5 py-2">
        <ProjectDeliveryActions
          projectSlug={projectSlug}
          layout="timeline"
          showActions={false}
        />
      </div>
    </div>
  );
}
