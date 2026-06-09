import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { EXECUTOR_TUTORIAL_STEPS } from "./steps.executor.js";

const TutorialContext = createContext(null);

/**
 * @param {{
 *   children: React.ReactNode,
 *   onFinish: () => Promise<void>,
 *   stepHandlers?: Record<string, (advance: () => void) => void | Promise<void>>,
 * }} props
 */
export function TutorialProvider({ children, onFinish, stepHandlers = {} }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [transitionDir, setTransitionDir] = useState(1);

  const steps = EXECUTOR_TUTORIAL_STEPS;
  const currentStep = steps[stepIndex] ?? steps[steps.length - 1];
  const isLastStep = stepIndex >= steps.length - 1;
  const canGoBack = stepIndex > 0;

  const nextStep = useCallback(() => {
    setTransitionDir(1);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const advanceStep = useCallback(async () => {
    const handler = stepHandlers[currentStep?.id];
    if (handler) {
      await handler(nextStep);
      return;
    }
    nextStep();
  }, [currentStep?.id, stepHandlers, nextStep]);

  const prevStep = useCallback(() => {
    setTransitionDir(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToStep = useCallback(
    (stepId) => {
      const idx = steps.findIndex((s) => s.id === stepId);
      if (idx >= 0) {
        setTransitionDir(idx >= stepIndex ? 1 : -1);
        setStepIndex(idx);
      }
    },
    [steps, stepIndex]
  );

  const advanceOnAction = useCallback(() => {
    if (currentStep?.waitForAction) {
      nextStep();
    }
  }, [currentStep?.waitForAction, nextStep]);

  const skipTutorial = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      await onFinish();
    } finally {
      setFinishing(false);
    }
  }, [finishing, onFinish]);

  const finishTutorial = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      await onFinish();
    } finally {
      setFinishing(false);
    }
  }, [finishing, onFinish]);

  const value = useMemo(
    () => ({
      steps,
      stepIndex,
      currentStep,
      isLastStep,
      finishing,
      transitionDir,
      canGoBack,
      nextStep,
      advanceStep,
      prevStep,
      goToStep,
      advanceOnAction,
      skipTutorial,
      finishTutorial,
    }),
    [
      steps,
      stepIndex,
      currentStep,
      isLastStep,
      finishing,
      transitionDir,
      canGoBack,
      nextStep,
      advanceStep,
      prevStep,
      goToStep,
      advanceOnAction,
      skipTutorial,
      finishTutorial,
    ]
  );

  return (
    <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error("useTutorial fora de TutorialProvider");
  }
  return ctx;
}
