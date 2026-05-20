/** Estados em que o job ainda aceita cancelamento / bloqueia novas execuções. */
export const ACTIVE_JOB_STATUSES = new Set([
  "queued",
  "running",
  "waiting_input",
]);

/**
 * @param {string|null|undefined} status
 */
export function isJobActive(status) {
  return Boolean(status && ACTIVE_JOB_STATUSES.has(status));
}
