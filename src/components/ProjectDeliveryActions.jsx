import React from "react";
import { downloadProjectCode } from "../lib/downloadProjectCode.js";
import {
  publishButtonLabel,
  publishUiTone,
  railwayPublishStatusLabel,
  isPublishInProgress,
} from "../lib/railwayPublish.js";
import { useRailwayPublish } from "../hooks/useRailwayPublish.js";

/**
 * Acções de entrega para projecto concluído (ZIP + publicação Railway).
 * @param {{
 *   projectSlug: string,
 *   layout?: "bar" | "modal",
 *   showStatus?: boolean,
 * }} props
 */
export default function ProjectDeliveryActions({
  projectSlug,
  layout = "bar",
  showStatus = true,
}) {
  const {
    publishStatus,
    publishError,
    publishLoading,
    isPublishing,
    handlePublish,
  } = useRailwayPublish(projectSlug);

  const isBar = layout === "bar";
  const tone = publishUiTone(publishStatus);
  const inProgress =
    publishLoading || isPublishing || isPublishInProgress(publishStatus);
  const showBanner =
    showStatus && (inProgress || tone === "success" || tone === "error");

  const buttonDisabled =
    publishLoading ||
    (isPublishing && tone !== "error" && tone !== "success");

  const statusTitle =
    tone === "success"
      ? "Publicado com sucesso"
      : tone === "error"
        ? "Publicação falhou"
        : inProgress
          ? "Publicação em andamento"
          : publishStatus?.status
            ? railwayPublishStatusLabel(publishStatus.status)
            : publishError
              ? "Erro ao publicar"
              : "A iniciar publicação…";

  const progressHint =
    publishStatus?.hint ||
    "Estamos a preparar, publicar e verificar a aplicação. " +
      "Isto pode levar vários minutos — aguarde.";

  return (
    <div
      className={
        isBar
          ? "project-bar__delivery"
          : "project-completion-modal__delivery"
      }
    >
      <div
        className={
          isBar
            ? "project-bar__delivery-actions"
            : "project-completion-modal__delivery-actions"
        }
      >
        <button
          type="button"
          className={
            isBar
              ? "toolbar-btn project-bar__delivery-btn"
              : "toolbar-btn"
          }
          onClick={() =>
            downloadProjectCode(projectSlug).catch((e) => alert(e.message))
          }
        >
          Baixar código (ZIP)
        </button>
        <button
          type="button"
          className={
            isBar
              ? "toolbar-btn toolbar-btn--primary project-bar__delivery-btn"
              : "toolbar-btn toolbar-btn--primary"
          }
          disabled={buttonDisabled}
          onClick={() => handlePublish().catch(() => {})}
        >
          {publishButtonLabel(publishStatus, { loading: publishLoading })}
        </button>
      </div>

      {showBanner && (
        <div
          className={`publish-status publish-status--${tone}${
            isBar ? " publish-status--compact" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          <p className="publish-status__title">
            {tone === "success" && "✓ "}
            {tone === "error" && "✗ "}
            {(inProgress || tone === "waiting") && "↻ "}
            {statusTitle}
          </p>

          {inProgress && tone !== "error" && (
            <p className="publish-status__hint">{progressHint}</p>
          )}

          {tone === "success" && publishStatus?.publicUrl && (
            <p className="publish-status__link">
              <a
                href={publishStatus.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir aplicação publicada
              </a>
            </p>
          )}

          {tone === "error" && (publishStatus?.lastError || publishError) && (
            <p className="publish-status__error">
              {publishError || publishStatus?.lastError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
