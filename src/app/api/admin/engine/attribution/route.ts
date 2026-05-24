import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import { requireAdminSession } from "@/lib/auth";
import { getAttributionEvents, getAttributionStats } from "@/lib/engine-store";

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
  if (!(await requireAdminSession(request)).ok) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  const { searchParams } = request.nextUrl;

  if (searchParams.get("view") === "stats") {
    const stats = await getAttributionStats();
    if (!stats) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 503, headers: corsHeaders }
      );
    }
    return NextResponse.json(stats, { headers: corsHeaders });
  }

  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const event_type = searchParams.get("event_type") || undefined;
  const source = searchParams.get("source") || undefined;
  const utm_campaign = searchParams.get("utm_campaign") || undefined;

  const events = await getAttributionEvents({
    event_type,
    source,
    utm_campaign,
    limit,
    offset,
  });
  return NextResponse.json(
    { events, count: events.length },
    { headers: corsHeaders }
  );
}
