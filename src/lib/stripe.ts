import Stripe from "stripe";

/**
 * Lazy Stripe client. Returns null if STRIPE_SECRET_KEY isn't set,
 * so routes can render a friendly message instead of crashing in local dev
 * or preview deploys without full env.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Use the SDK default apiVersion to avoid pinning mismatches
  // between the SDK, account, and types.
  return new Stripe(key);
}

export const STRIPE_PRICE_ID_STARTER = process.env.STRIPE_PRICE_ID_STARTER || "";
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";
