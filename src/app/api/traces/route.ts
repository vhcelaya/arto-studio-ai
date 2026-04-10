import { NextRequest, NextResponse } from "next/server";
import { getTraces, getTraceStats } from "@/lib/trace-store";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
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
