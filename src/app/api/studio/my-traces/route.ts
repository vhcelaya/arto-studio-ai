import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import { verifyApiKey } from "@/lib/clients/store";
import { getSkillTraces } from "@/lib/trace-store";

// Load .env.local explicitly (workaround for Next.js 16 Turbopack env loading)
config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

export const maxDuration = 10;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-arto-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/* ── GET /api/studio/my-traces ──
 * Auth: x-arto-api-key (client key, NOT admin bearer)
 * Returns: the authenticated client's own skill_traces, newest first.
 * Query params:
 *   limit=N (default 20, max 50)
 *   slug=<skill>  optional filter
 */
export async function GET(request: NextRequest) {
  const rawKey =
    request.headers.get("x-arto-api-key") ||
    request.headers.get("X-Arto-Api-Key") ||
    "";
  if (!rawKey) {
    return NextResponse.json(
      { error: "Missing API key. Include x-arto-api-key header." },
      { status: 401, headers: corsHeaders }
    );
  }

  const client = await verifyApiKey(rawKey);
  if (!client) {
    return NextResponse.json(
      { error: "Invalid or revoked API key." },
      { status: 401, headers: corsHeaders }
    );
  }

  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
  const slug = searchParams.get("slug") || undefined;

  const traces = await getSkillTraces({
    clientId: client.id,
    skillSlug: slug,
    limit,
    offset: 0,
  });

  return NextResponse.json(
    {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        tier: client.tier,
        allowed_skills: client.allowed_skills,
        rate_limit_per_hour: client.rate_limit_per_hour,
        trial_calls_limit: client.trial_calls_limit,
        trial_calls_used: client.trial_calls_used,
      },
      traces,
      count: traces.length,
    },
    { headers: corsHeaders }
  );
}
