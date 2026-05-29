import { runtimeSalesEmail, runtimeStripeCheckoutUrl } from "./runtimeConfig.js";

/** URLs de teste — só em `npm run dev` se nem runtime nem VITE_* estiverem definidos. */
const DEV_STRIPE_CHECKOUT = {
  starter: "https://buy.stripe.com/test_aFacN4gKf3SH6ff6MW5Ne00",
  team: "https://buy.stripe.com/test_6oU14m79Fbl99rrc7g5Ne01",
  scale: "https://buy.stripe.com/test_8x2bJ00Lh74T9rr3AK5Ne02",
  business: "https://buy.stripe.com/test_bJe28q51x3SH6ff3AK5Ne03",
};

/**
 * @param {"starter"|"team"|"scale"|"business"} plan
 */
function stripeCheckoutUrl(plan) {
  const fromRuntime = runtimeStripeCheckoutUrl(plan);
  if (fromRuntime) return fromRuntime;

  const envKey = `VITE_STRIPE_CHECKOUT_${plan.toUpperCase()}`;
  const fromEnv = import.meta.env[envKey];
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.trim();
  }
  if (import.meta.env.DEV) {
    return DEV_STRIPE_CHECKOUT[plan] || "";
  }
  return "";
}

/** Payment Links Stripe — runtime (Railway) > VITE_* (build) > test (só dev). */
export const STRIPE_CHECKOUT = {
  starter: stripeCheckoutUrl("starter"),
  team: stripeCheckoutUrl("team"),
  scale: stripeCheckoutUrl("scale"),
  business: stripeCheckoutUrl("business"),
};

const salesEmail =
  runtimeSalesEmail() ||
  (typeof import.meta.env.VITE_SALES_EMAIL === "string" &&
    import.meta.env.VITE_SALES_EMAIL.trim()) ||
  "daniel.espindola.l195@gmail.com";

export const SALES_EMAIL = salesEmail;

export const CUSTOM_PLAN_MAILTO = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent("Plano Custom AI Factory")}`;
