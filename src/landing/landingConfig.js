/** URLs de teste (Stripe Payment Links) — só usadas em `npm run dev` se a env não estiver definida. */
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

/** Payment Links Stripe por plano — configure via VITE_STRIPE_CHECKOUT_* (.env / build). */
export const STRIPE_CHECKOUT = {
  starter: stripeCheckoutUrl("starter"),
  team: stripeCheckoutUrl("team"),
  scale: stripeCheckoutUrl("scale"),
  business: stripeCheckoutUrl("business"),
};

const salesEmail =
  (typeof import.meta.env.VITE_SALES_EMAIL === "string" &&
    import.meta.env.VITE_SALES_EMAIL.trim()) ||
  "daniel.espindola.l195@gmail.com";

export const SALES_EMAIL = salesEmail;

export const CUSTOM_PLAN_MAILTO = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent("Plano Custom AI Factory")}`;
