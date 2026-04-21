import { NextRequest } from "next/server";
import { verifyApiKey, type Client } from "./store";

/**
 * Client authentication + rate limiting for gated skill endpoints.
 * Public skills (e.g. brand-roast) bypass this.
 */

export type AuthResult =
  | { ok: true; client: Client }
  | {
      ok: false;
      status: 401 | 403 | 429;
      error: string;
      /** Present on 429 when the limit is a lifetime trial exhaustion, not an hourly rate limit. */
      upgrade_url?: string;
    };

/* In-memory rate limiter, per client. Resets on serverless instance restart.
 * TODO: move to Redis/DB when we need accurate global limits. */
const clientRateMap = new Map<string, number[]>();
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(clientId: string, limit: number): boolean {
  const now = Date.now();
  const timestamps = clientRateMap.get(clientId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  clientRateMap.set(clientId, recent);

  if (recent.length >= limit) return true;
  recent.push(now);
  return false;
}

export async function requireClientAuth(
  request: NextRequest,
  skillSlug: string
): Promise<AuthResult> {
  const rawKey =
    request.headers.get("x-arto-api-key") ||
    request.headers.get("X-Arto-Api-Key") ||
    "";

  if (!rawKey) {
    return {
      ok: false,
      status: 401,
      error:
        "Missing API key. Include the header 'x-arto-api-key: arto_live_...' to call gated skills.",
    };
  }

  const client = await verifyApiKey(rawKey);
  if (!client) {
    return {
      ok: false,
      status: 401,
      error: "Invalid or revoked API key.",
    };
  }

  // Check skill access
  const allowed =
    client.allowed_skills.includes("*") || client.allowed_skills.includes(skillSlug);
  if (!allowed) {
    return {
      ok: false,
      status: 403,
      error: `This API key does not have access to skill '${skillSlug}'. Contact your ARTO account manager to upgrade.`,
    };
  }

  // Lifetime trial-call cap check (takes precedence over hourly rate limit).
  if (
    client.trial_calls_limit !== null &&
    client.trial_calls_used >= client.trial_calls_limit
  ) {
    return {
      ok: false,
      status: 429,
      error: `Trial exhausted — you've used all ${client.trial_calls_limit} free calls. Upgrade to continue.`,
      upgrade_url: `/upgrade?client_id=${client.id}`,
    };
  }

  // Rate limit per client (hourly).
  if (isRateLimited(client.id, client.rate_limit_per_hour)) {
    return {
      ok: false,
      status: 429,
      error: `Rate limit exceeded (${client.rate_limit_per_hour}/hour). Try again later.`,
    };
  }

  return { ok: true, client };
}
