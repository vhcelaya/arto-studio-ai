import { NextRequest } from "next/server";

/**
 * Verify admin access via Bearer token.
 * The token is set as ADMIN_API_KEY in environment variables.
 * Returns true if authorized, false otherwise.
 */
export function isAdminAuthorized(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  return token === adminKey;
}
