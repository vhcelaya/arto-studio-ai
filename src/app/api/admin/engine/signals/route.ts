import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import { requireAdminSession } from "@/lib/auth";
import { getSignals, getSignalsStats, resolveSignal } from "@/lib/engine-store";

config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

export const maxDuration = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    const stats = await getSignalsStats();
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
  const severity = searchParams.get("severity") || undefined;
  const signal_type = searchParams.get("signal_type") || undefined;
  const module_ = searchParams.get("module") || undefined;
  const activeParam = searchParams.get("active");
  const active =
    activeParam === "true" ? true : activeParam === "false" ? false : undefined;

  const signals = await getSignals({
    active,
    severity,
    signal_type,
    module: module_,
    limit,
    offset,
  });
  return NextResponse.json(
    { signals, count: signals.length },
    { headers: corsHeaders }
  );
}

interface ResolveBody {
  id?: unknown;
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminSession(request)).ok) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  let body: ResolveBody;
  try {
    body = (await request.json()) as ResolveBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders }
    );
  }

  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  const ok = await resolveSignal(id, "admin");
  return NextResponse.json({ ok }, { headers: corsHeaders });
}
