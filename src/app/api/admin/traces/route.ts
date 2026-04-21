import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import { getSkillTraces, getSkillStats } from "@/lib/trace-store";
import { isAdminAuthorized } from "@/lib/auth";

// Load .env.local explicitly (workaround for Next.js 16 Turbopack env loading)
config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

export const maxDuration = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/* ── GET /api/admin/traces ─ list skill_traces or stats ──
 * Query params:
 *   view=stats   → aggregate stats per skill + source
 *   slug=<slug>  → filter by skill_slug
 *   client_id=…  → filter by client
 *   limit=N      → default 50, max 100
 *   offset=N     → default 0
 */
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid Bearer token in the Authorization header." },
      { status: 401, headers: corsHeaders }
    );
  }

  const { searchParams } = request.nextUrl;

  if (searchParams.get("view") === "stats") {
    const stats = await getSkillStats();
    if (!stats) {
      return NextResponse.json(
        { error: "Trace storage not configured. Set DATABASE_URL to enable." },
        { status: 503, headers: corsHeaders }
      );
    }
    return NextResponse.json(stats, { headers: corsHeaders });
  }

  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const skillSlug = searchParams.get("slug") || undefined;
  const clientId = searchParams.get("client_id") || undefined;

  const traces = await getSkillTraces({ skillSlug, clientId, limit, offset });
  return NextResponse.json(
    { traces, count: traces.length },
    { headers: corsHeaders }
  );
}
