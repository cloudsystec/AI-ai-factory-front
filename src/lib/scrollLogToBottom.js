/**
 * @param {HTMLElement|null|undefined} el
 * @param {{ behavior?: ScrollBehavior }} [options]
 */
export function scrollLogToBottom(el, options = {}) {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior =
    options.behavior ?? (prefersReduced ? "auto" : "smooth");
  if (!el || behavior === "auto") {
    if (el) el.scrollTop = el.scrollHeight;
    return;
  }

  const run = () => {
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  run();
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
}

/**
 * @param {HTMLElement|null|undefined} el
 * @param {number} [thresholdPx]
 */
export function isLogNearBottom(el, thresholdPx = 64) {
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx;
}
