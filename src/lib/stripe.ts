import Stripe from "stripe";

/**
 * Lazy Stripe client. Returns null if STRIPE_SECRET_KEY isn't set,
 * so routes can render a friendly message instead of crashing in local dev
 * or preview deploys without full env.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, {
    // Pin API version — matches the types bundled with the SDK we installed.
    // Bump when Stripe types bump.
    apiVersion: "2026-03-25.dahlia",
  });
}

export const STRIPE_PRICE_ID_STARTER = process.env.STRIPE_PRICE_ID_STARTER || "";
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";
