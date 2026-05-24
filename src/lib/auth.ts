import { NextRequest } from "next/server";

/**
 * Verify admin access via Bearer token.
 * The token is set as ADMIN_API_KEY in environment variables.
 * Returns true if authorized, false otherwise.
 *
 * Used by API routes (e.g. /api/admin/*, /api/traces) that accept the
 * raw admin API key in an Authorization header. See isAdminEmail() below
 * for the parallel check against an allowlist of signed-in admin emails.
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
 * Used by Server Components to decide whether to surface admin UI (the
 * /admin link in Nav, the "Admin" card on /account, etc).
 *
 * The /admin page itself still validates with the ADMIN_API_KEY token for
 * its data calls — this helper only controls *visibility* of the entry
 * point. A non-admin who somehow navigates to /admin will see the API key
 * gate and be unable to proceed without the token.
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
