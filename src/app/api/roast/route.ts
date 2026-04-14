import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import "@/lib/skills"; // side-effect: register all skills
import { getSkill } from "@/lib/skills/registry";
import { runSkill } from "@/lib/skills/engine";
import type { RoastRequest, RoastResult, RoastResponse } from "@/lib/roast-types";
import type { SkillContext } from "@/lib/skills/types";

/**
 * Legacy alias: /api/roast → brand-roast skill.
 * Preserves the original { source, result } shape so the existing /roast page
 * and any external clients keep working unchanged.
 */

config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

export const maxDuration = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/* ── Rate limiter (per IP) ─────────────────────────────── */

const rateMap = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  rateMap.set(ip, recent);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  return false;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later.", retryAfter: 3600 },
      { status: 429, headers: corsHeaders }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", field: "body" },
      { status: 400, headers: corsHeaders }
    );
  }

  const skill = getSkill("brand-roast");
  if (!skill) {
    return NextResponse.json(
      { error: "Brand Roast skill not registered" },
      { status: 500, headers: corsHeaders }
    );
  }

  const validation = skill.inputValidator(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error, field: validation.field },
      { status: 400, headers: corsHeaders }
    );
  }

  const ctx: SkillContext = { clientId: null, ip };

  try {
    const skillResp = await runSkill<RoastRequest, RoastResult>(
      "brand-roast",
      validation.data as RoastRequest,
      ctx
    );
    const legacy: RoastResponse = {
      source: skillResp.source,
      result: skillResp.output,
    };
    return NextResponse.json(legacy, { headers: corsHeaders });
  } catch (error) {
    console.error("[/api/roast] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
