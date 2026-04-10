import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getKnowledgeContext } from "@/lib/knowledge";
import { buildSystemPrompt, roastTool } from "@/lib/roast-prompt";
import { generateDeterministicRoast } from "@/lib/roast-fallback";
import type { RoastRequest, RoastResponse, RoastResult } from "@/lib/roast-types";

// Load .env.local explicitly (workaround for Next.js 16 Turbopack env loading)
config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

export const maxDuration = 30;

/* ── Rate limiter (in-memory, per serverless instance) ── */

const rateMap = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  rateMap.set(ip, recent);

  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  return false;
}

/* ── Input validation ─────────────────────────────────── */

function validateInput(body: unknown): { valid: true; data: RoastRequest } | { valid: false; error: string; field: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body is required", field: "body" };
  }

  const b = body as Record<string, unknown>;

  const brandName = typeof b.brandName === "string" ? b.brandName.trim() : "";
  if (!brandName) {
    return { valid: false, error: "Brand name is required", field: "brandName" };
  }
  if (brandName.length > 100) {
    return { valid: false, error: "Brand name must be 100 characters or less", field: "brandName" };
  }

  const industry = typeof b.industry === "string" ? b.industry.trim() : "";
  if (!industry) {
    return { valid: false, error: "Industry is required", field: "industry" };
  }

  const websiteUrl = typeof b.websiteUrl === "string" ? b.websiteUrl.trim() : undefined;
  if (websiteUrl && websiteUrl.length > 200) {
    return { valid: false, error: "Website URL must be 200 characters or less", field: "websiteUrl" };
  }

  const description = typeof b.description === "string" ? b.description.trim() : undefined;
  if (description && description.length > 500) {
    return { valid: false, error: "Description must be 500 characters or less", field: "description" };
  }

  const companySize = typeof b.companySize === "string" ? b.companySize.trim() : undefined;

  return {
    valid: true,
    data: {
      brandName,
      industry,
      ...(websiteUrl && { websiteUrl }),
      ...(companySize && { companySize }),
      ...(description && { description }),
    },
  };
}

/* ── CORS headers ─────────────────────────────────────── */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/* ── POST handler ─────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Rate limiting
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

  // Parse & validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", field: "body" },
      { status: 400, headers: corsHeaders }
    );
  }

  const validation = validateInput(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error, field: validation.field },
      { status: 400, headers: corsHeaders }
    );
  }

  const { brandName, industry, websiteUrl, companySize, description } = validation.data;

  // If no API key, return deterministic fallback immediately
  if (!process.env.ANTHROPIC_API_KEY) {
    const result = generateDeterministicRoast(brandName, industry, description ?? "");
    const response: RoastResponse = { source: "fallback", result };
    logTrace({ brandName, industry, result, source: "fallback", model: "none", latencyMs: Date.now() - startTime });
    return NextResponse.json(response, { headers: corsHeaders });
  }

  // Call Claude
  try {
    const anthropic = new Anthropic();
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
    const knowledge = getKnowledgeContext();

    const userMessage = [
      `Brand: ${brandName}`,
      `Industry: ${industry}`,
      `Company Size: ${companySize || "Not specified"}`,
      `Website: ${websiteUrl || "Not provided"}`,
      `Description: ${description || "Not provided"}`,
      "",
      "Evaluate this brand using the ARTO methodology and deliver your roast.",
    ].join("\n");

    const response = await anthropic.messages.create({
      model,
      max_tokens: 1500,
      system: buildSystemPrompt(knowledge),
      tools: [roastTool],
      tool_choice: { type: "tool", name: "deliver_roast" },
      messages: [{ role: "user", content: userMessage }],
    });

    // Extract tool_use result
    const toolBlock = response.content.find((block) => block.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      throw new Error("No tool_use block in Claude response");
    }

    const input = toolBlock.input as {
      strategy: { score: number; roast: string };
      creativity: { score: number; roast: string };
      narrative: { score: number; roast: string };
      digital: { score: number; roast: string };
      verdict: string;
      improvements: string[];
    };

    // Compute overall score server-side
    const overall =
      Math.round(
        (input.strategy.score * 0.3 +
          input.creativity.score * 0.25 +
          input.narrative.score * 0.25 +
          input.digital.score * 0.2) *
          10
      ) / 10;

    const result: RoastResult = {
      overall,
      strategy: input.strategy,
      creativity: input.creativity,
      narrative: input.narrative,
      digital: input.digital,
      verdict: input.verdict,
      improvements: input.improvements.slice(0, 5),
    };

    const roastResponse: RoastResponse = { source: "ai", result };
    logTrace({ brandName, industry, result, source: "ai", model, latencyMs: Date.now() - startTime });
    return NextResponse.json(roastResponse, { headers: corsHeaders });
  } catch (error) {
    console.error("[/api/roast] Claude API error:", error);

    // Fallback to deterministic
    const result = generateDeterministicRoast(brandName, industry, description ?? "");
    const response: RoastResponse = { source: "fallback", result };
    logTrace({ brandName, industry, result, source: "fallback", model: "error", latencyMs: Date.now() - startTime });
    return NextResponse.json(response, { headers: corsHeaders });
  }
}

/* ── Structured trace logging ─────────────────────────── */

function logTrace(data: {
  brandName: string;
  industry: string;
  result: RoastResult;
  source: string;
  model: string;
  latencyMs: number;
}) {
  console.log(
    JSON.stringify({
      event: "roast_trace",
      timestamp: new Date().toISOString(),
      brand: data.brandName,
      industry: data.industry,
      overall: data.result.overall,
      strategy: data.result.strategy.score,
      creativity: data.result.creativity.score,
      narrative: data.result.narrative.score,
      digital: data.result.digital.score,
      source: data.source,
      model: data.model,
      latencyMs: data.latencyMs,
    })
  );
}
