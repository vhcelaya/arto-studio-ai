import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import { getTraces, getTraceStats } from "@/lib/trace-store";
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

export async function GET(request: NextRequest) {
  // Admin-only endpoint
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid Bearer token in the Authorization header." },
      { status: 401, headers: corsHeaders }
    );
  }

  const { searchParams } = request.nextUrl;
  const view = searchParams.get("view"); // "stats" for aggregate stats

  if (view === "stats") {
    const stats = await getTraceStats();
    if (!stats) {
      return NextResponse.json(
        { error: "Trace storage not configured. Set DATABASE_URL to enable." },
        { status: 503, headers: corsHeaders }
      );
    }
    return NextResponse.json(stats, { headers: corsHeaders });
  }

  // Default: list traces
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const industry = searchParams.get("industry") || undefined;

  const traces = await getTraces({ limit, offset, industry });

  return NextResponse.json({ traces, count: traces.length }, { headers: corsHeaders });
}
