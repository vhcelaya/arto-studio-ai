import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Verify admin access via Bearer token.
 *
 * Kept for back-compat with external scripts, cron jobs, and any
 * integration that hits /api/admin/* without a browser session. The
 * token is set as ADMIN_API_KEY in environment variables.
 *
 * For UI flows (clicking around /admin in a browser) the preferred
 * check is requireAdminSession() below — session-only, no shared key
 * to leak.
 */
export function isAdminAuthorized(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  return token === adminKey;
}

/**
 * Check whether a Supabase-authenticated email is on the admin allowlist.
 *
 * ADMIN_EMAILS is a comma-separated list of lowercase email addresses set
 * as a Vercel env var (e.g. "vhcelaya@artogroup.com,other@arto.com").
 * Used by Server Components to decide whether the visitor can see and
 * use admin UI. The /admin pages and /api/admin/* routes both gate on
 * the result of requireAdminSession(), which composes Supabase auth +
 * this email check.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return false;
  const allowlist = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.trim().toLowerCase());
}

export type AdminAuthResult =
  | { ok: true; email: string; userId: string; via: "session" | "bearer" }
  | { ok: false; reason: "unauthenticated" | "not_admin" | "no_allowlist" };

/**
 * Compose Supabase session + admin allowlist into a single gate.
 *
 * This is the canonical admin check for the app's server surface —
 * Server Components, route handlers, anywhere we can read cookies.
 *
 * Resolution order:
 *   1. Supabase session present and user.email is on the allowlist
 *      → ok via "session"
 *   2. Authorization: Bearer <ADMIN_API_KEY> matches → ok via "bearer"
 *      (kept for cron/scripts/external callers; not used by UI)
 *   3. otherwise → not_admin / unauthenticated / no_allowlist (config bug)
 *
 * Always pass the NextRequest when calling from an API route so the
 * Bearer fallback works. Server Components can omit it.
 */
export async function requireAdminSession(
  request?: NextRequest,
): Promise<AdminAuthResult> {
  try {
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user?.email) {
      if (!process.env.ADMIN_EMAILS) {
        return { ok: false, reason: "no_allowlist" };
      }
      if (isAdminEmail(user.email)) {
        return { ok: true, email: user.email, userId: user.id, via: "session" };
      }
      return { ok: false, reason: "not_admin" };
    }
  } catch {
    // Supabase env missing or cookie unreadable — fall through to Bearer.
  }

  if (request && isAdminAuthorized(request)) {
    return { ok: true, email: "bearer", userId: "bearer", via: "bearer" };
  }

  return { ok: false, reason: "unauthenticated" };
}
