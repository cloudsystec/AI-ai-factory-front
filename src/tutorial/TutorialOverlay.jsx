import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTutorial } from "./TutorialContext.jsx";

function getTargetEl(target) {
  if (!target) return null;
  return document.querySelector(`[data-tutorial="${target}"]`);
}

function getTargetRect(target) {
  const el = getTargetEl(target);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function computeTooltipStyle(rect, placement) {
  const gap = 14;
  const maxW = Math.min(420, window.innerWidth - 32);
  let top;
  let left;
  let transform;

  switch (placement) {
    case "top":
      top = rect.top - gap;
      left = rect.left + rect.width / 2;
      transform = "translate(-50%, -100%)";
      left = Math.max(16 + maxW / 2, Math.min(left, window.innerWidth - 16 - maxW / 2));
      break;
    case "left":
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
      transform = "translate(-100%, -50%)";
      left = Math.max(16 + maxW, Math.min(left, window.innerWidth - 16));
      break;
    case "right":
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
      transform = "translateY(-50%)";
      left = Math.max(16, Math.min(left, window.innerWidth - 16 - maxW));
      break;
    case "bottom":
    default:
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2;
      transform = "translateX(-50%)";
      left = Math.max(16 + maxW / 2, Math.min(left, window.innerWidth - 16 - maxW / 2));
      break;
  }

  return { top, left, transform, maxWidth: maxW };
}

export default function TutorialOverlay() {
  const {
    steps,
    stepIndex,
    currentStep,
    transitionDir,
    canGoBack,
    nextStep,
    advanceStep,
    prevStep,
    skipTutorial,
    finishTutorial,
    finishing,
  } = useTutorial();
  const [rect, setRect] = useState(null);
  const [backdropPulse, setBackdropPulse] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const isCenter = !currentStep.target || currentStep.placement === "center";
  const hasTarget = Boolean(currentStep.target);

  useEffect(() => {
    setBackdropPulse(true);
    const id = window.setTimeout(() => setBackdropPulse(false), 480);
    return () => window.clearTimeout(id);
  }, [currentStep.id]);

  useLayoutEffect(() => {
    function update() {
      if (isCenter) {
        setRect(null);
        return;
      }
      setRect(getTargetRect(currentStep.target));
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const id = window.setInterval(update, 300);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearInterval(id);
    };
  }, [currentStep.id, currentStep.target, isCenter]);

  useEffect(() => {
    if (isCenter || !rect) return;
    getTargetEl(currentStep.target)?.scrollIntoView?.({
      block: "nearest",
      behavior: "smooth",
    });
  }, [currentStep.id, currentStep.target, isCenter, rect]);

  useEffect(() => {
    const el = hasTarget ? getTargetEl(currentStep.target) : null;
    if (!el) return undefined;
    el.classList.add("tutorial-spotlight-target");
    return () => {
      el.classList.remove("tutorial-spotlight-target");
    };
  }, [currentStep.id, currentStep.target, hasTarget]);

  const padding = 10;
  const spotlight =
    rect && !isCenter
      ? {
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        }
      : null;

  const tooltipStyle = useMemo(() => {
    if (isCenter) return {};
    if (!rect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: Math.min(420, window.innerWidth - 32),
      };
    }
    return computeTooltipStyle(rect, currentStep.placement || "bottom");
  }, [isCenter, rect, currentStep.placement]);

  const overlayClass = [
    "tutorial-overlay",
    isCenter ? "tutorial-overlay--center" : "",
    spotlight ? "tutorial-overlay--spotlight" : "",
    hasTarget && !rect ? "tutorial-overlay--missing-target" : "",
    backdropPulse ? "tutorial-overlay--pulse" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const tooltipClass = [
    "tutorial-tooltip",
    isCenter ? "tutorial-tooltip--center" : "tutorial-tooltip--anchored",
  ]
    .filter(Boolean)
    .join(" ");

  const innerClass = [
    "tutorial-tooltip__inner",
    transitionDir >= 0 ? "tutorial-tooltip__inner--forward" : "tutorial-tooltip__inner--back",
  ].join(" ");

  return (
    <div className={overlayClass} aria-live="polite">
      {spotlight && (
        <>
          <div
            className="tutorial-spotlight-hole"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
          />
          <div
            className="tutorial-spotlight-ring"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
            aria-hidden
          />
        </>
      )}

      <div
        className={tooltipClass}
        style={tooltipStyle}
        role="dialog"
        aria-labelledby="tutorial-title"
      >
        <div key={currentStep.id} className={innerClass}>
          <p className="tutorial-tooltip__eyebrow">
            Tour guiado · passo {stepIndex + 1} de {steps.length}
          </p>
          <h2 id="tutorial-title" className="tutorial-tooltip__title">
            {currentStep.title}
          </h2>
          <p className="tutorial-tooltip__body">{currentStep.body}</p>
          {hasTarget && !rect && !isCenter && (
            <p className="tutorial-tooltip__hint">
              Elemento não visível — siga as instruções ou use Voltar / Próximo.
            </p>
          )}
          {currentStep.waitForAction && !currentStep.hideNext && (
            <p className="tutorial-tooltip__hint tutorial-tooltip__hint--action">
              Faça a ação indicada para continuar.
            </p>
          )}
          {currentStep.waitForAction && currentStep.hideNext && (
            <p className="tutorial-tooltip__hint tutorial-tooltip__hint--action">
              Clique no botão destacado para continuar.
            </p>
          )}

          <div className="tutorial-tooltip__actions">
            <div className="tutorial-tooltip__actions-start">
              {canGoBack && (
                <button
                  type="button"
                  className="tutorial-btn tutorial-btn--back"
                  onClick={() => prevStep()}
                  disabled={finishing}
                >
                  Voltar
                </button>
              )}
            </div>
            <div className="tutorial-tooltip__actions-end">
              {currentStep.isFinish ? (
                <button
                  type="button"
                  className="tutorial-btn tutorial-btn--primary"
                  onClick={() => void finishTutorial()}
                  disabled={finishing}
                >
                  {finishing ? "Salvando…" : "Começar a usar"}
                </button>
              ) : !currentStep.hideNext ? (
                <button
                  type="button"
                  className="tutorial-btn tutorial-btn--primary"
                  onClick={() => {
                    setAdvancing(true);
                    void advanceStep().finally(() => setAdvancing(false));
                  }}
                  disabled={finishing || advancing}
                >
                  {advancing ? "Aguarde…" : "Próximo"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="tutorial-skip-fixed"
        onClick={() => void skipTutorial()}
        disabled={finishing}
        title="Encerrar o tour guiado"
      >
        Pular tour
      </button>
    </div>
  );
}
