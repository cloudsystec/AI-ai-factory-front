/**
 * Config injetada em runtime (Docker/Railway) via /runtime-config.js.
 * @returns {Record<string, unknown>}
 */
function readRuntimeConfig() {
  if (typeof window === "undefined") return {};
  const cfg = window.__RUNTIME_CONFIG__;
  return cfg && typeof cfg === "object" ? cfg : {};
}

/**
 * @param {"starter"|"team"|"scale"|"business"} plan
 */
export function runtimeStripeCheckoutUrl(plan) {
  const cfg = readRuntimeConfig();
  const stripe = cfg.stripeCheckout;
  if (!stripe || typeof stripe !== "object") return "";
  const url = /** @type {Record<string, string>} */ (stripe)[plan];
  return typeof url === "string" && url.trim() ? url.trim() : "";
}

export function runtimeSalesEmail() {
  const cfg = readRuntimeConfig();
  const email = cfg.salesEmail;
  return typeof email === "string" && email.trim() ? email.trim() : "";
}
