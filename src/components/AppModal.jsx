import React, { useEffect } from "react";
import ModalPortal from "./ModalPortal.jsx";

/**
 * @param {{
 *   variant?: string,
 *   panelClassName?: string,
 *   eyebrow?: React.ReactNode,
 *   title?: React.ReactNode,
 *   titleId?: string,
 *   subtitle?: React.ReactNode,
 *   subtitleClassName?: string,
 *   onClose?: () => void,
 *   closeLabel?: string,
 *   closeDisabled?: boolean,
 *   closeOnOverlayClick?: boolean,
 *   closeOnEscape?: boolean,
 *   disableOverlayClose?: boolean,
 *   headerActions?: React.ReactNode,
 *   footer?: React.ReactNode,
 *   children?: React.ReactNode,
 *   ariaLabelledBy?: string,
 *   showHeader?: boolean,
 *   overlayClassName?: string,
 *   companion?: React.ReactNode,
 *   companionOpen?: boolean,
 *   panelDataTutorial?: string,
 * }} props
 */
export default function AppModal({
  variant = "default",
  panelClassName = "",
  eyebrow,
  title,
  titleId,
  subtitle,
  subtitleClassName = "app-modal__context",
  onClose,
  closeLabel = "Fechar",
  closeDisabled = false,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  disableOverlayClose = false,
  headerActions,
  footer,
  children,
  ariaLabelledBy,
  showHeader = true,
  overlayClassName = "",
  companion = null,
  companionOpen = false,
  panelDataTutorial,
}) {
  const labelledBy = ariaLabelledBy || titleId;
  const hasCompanion = companionOpen && companion;

  useEffect(() => {
    if (!closeOnEscape || !onClose) return undefined;
    function onKeyDown(e) {
      if (e.key === "Escape" && !closeDisabled) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOnEscape, onClose, closeDisabled]);

  const panelClasses = [
    "modal-panel",
    "app-modal",
    `app-modal--${variant}`,
    panelClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <ModalPortal>
      <div
        className={[
          "modal-overlay",
          hasCompanion ? "modal-overlay--split" : "",
          overlayClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        role="presentation"
        onClick={(e) => {
          if (
            closeOnOverlayClick &&
            !disableOverlayClose &&
            !closeDisabled &&
            onClose &&
            e.target === e.currentTarget
          ) {
            onClose();
          }
        }}
      >
        <div
          className={[
            "modal-overlay__cluster",
            hasCompanion ? "modal-overlay__cluster--split" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
        <div
          className={panelClasses}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          data-tutorial={panelDataTutorial || undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {showHeader && (title || eyebrow || onClose) && (
            <header className="modal-panel__header">
              <div className="modal-panel__header-text">
                {eyebrow ? <p className="modal-panel__eyebrow">{eyebrow}</p> : null}
                {title ? (
                  <h2 id={titleId} className="modal-panel__title">
                    {title}
                  </h2>
                ) : null}
                {subtitle ? (
                  <p className={subtitleClassName}>{subtitle}</p>
                ) : null}
              </div>
              {headerActions ? (
                <div className="app-modal__header-actions">{headerActions}</div>
              ) : null}
              {onClose ? (
                <button
                  type="button"
                  className="modal-panel__close"
                  onClick={onClose}
                  disabled={closeDisabled}
                >
                  {closeLabel}
                </button>
              ) : null}
            </header>
          )}
          {children}
          {footer ? <footer className="modal-panel__footer">{footer}</footer> : null}
        </div>
        {hasCompanion ? companion : null}
        </div>
      </div>
    </ModalPortal>
  );
}
