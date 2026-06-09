/** @param {string} state */
export function scopeStepIcon(state) {
  if (state === "done") return "✓";
  if (state === "active") return "●";
  return "○";
}

/** @param {string} key */
export function scopeStepDisplayLabel(key, label) {
  const map = {
    macro: "Macros",
    micro: "Micros",
    tasking: "Tasks",
    dev: "Deploy",
  };
  return map[key] || label;
}

/**
 * @param {object|null|undefined} scope
 */
export function isScopeStateRenderable(scope) {
  return (
    scope &&
    scope.current &&
    typeof scope.current.label === "string" &&
    Array.isArray(scope.scopeSteps) &&
    scope.scopeSteps.length > 0
  );
}

/** @param {object|null|undefined} scope */
export function scopeProgressPercent(scope) {
  if (!isScopeStateRenderable(scope)) return "0%";
  const steps = scope.scopeSteps;
  const n = steps.length;
  let pct = 0;
  for (const step of steps) {
    if (step.state === "done") pct += 100 / n;
    else if (step.state === "active") pct += (100 / n) * 0.55;
  }
  return `${Math.min(100, Math.round(pct))}%`;
}
