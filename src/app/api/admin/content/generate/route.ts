import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";

/* POST /api/admin/content/generate
 *
 * body { type: "prompt" | "blog_post", count?: number, language?: "en" | "es", brief?: string }
 *
 * Generates `count` (default 3) new drafts of the given type. For
 * each item, Claude returns a strict JSON shape that matches the
 * payload spec for that type (see content_items table comment). We
 * upsert them as content_items rows with status='draft'.
 *
 * If `brief` is provided, it's appended to the system prompt to steer
 * generation (e.g. "focus on fashion vertical", "respond to the
 * recent Meta layoffs signal"). Otherwise we pull recent
 * engine_signals + content_gaps as context.
 */

const MAX_COUNT = 10;
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 0.8, output: 4.0 },
  "claude-opus-4-5": { input: 15.0, output: 75.0 },
};

const SYSTEM_BASE = `You generate ARTO Studio AI content for the Content Factory.

ARTO Studio AI: bilingual prompt library, AI skills (brand positioning, architecture), autonomous creative agents. Built on 15+ years with Google, Nike, Uber. https://creative.artostudio.ai

Tone rules (apply to either language):
- Direct, terse, no marketing fluff. No emoji unless intentional and rare.
- Spanish uses tú-form (Mexico). NEVER vos/che/tenés/acá.
- Banned in either language: leverage, empower, synergy, holistic, ecosystem, disruptive, scalable, optimize, elevate, robust, potenciar, empoderar, sinergia, robusto, holístico, disruptivo, escalable, optimizar.
- Show that ARTO actually does the work — concrete frameworks, methodology, client examples — not motivational fluff.

Output STRICT JSON only, no preamble.`;

const PROMPT_INSTRUCTIONS = `Generate {count} prompt-library entries, ALL in {language}.

Each prompt is a row in the catalog table. Strict shape per item:
{
  "title_en": "...",
  "title_es": "...",
  "body_en": "...",
  "body_es": "...",
  "category": "branding" | "graphic_design" | "copywriting" | "photography" | "video" | "ux_ui" | "illustration" | "marketing" | "music" | "architecture" | "fashion" | "creative_productivity",
  "subcategory": "...",
  "ai_model": "any" | "gpt" | "claude" | "midjourney" | "sora" | "veo" | "suno" | "udio" | "elevenlabs" | "kling" | "runway",
  "difficulty": "beginner" | "intermediate" | "advanced" | "expert",
  "tier": "free" | "pro",
  "tags": ["..."],
  "use_case": "...",
  "expected_output": "..."
}

Constraints:
- title must be under 70 chars
- body must be a full working prompt 120-400 words, ready to paste into the target AI model
- always fill BOTH title_en AND title_es, BOTH body_en AND body_es
- use_case: one sentence describing when an operator picks this prompt
- expected_output: one sentence describing the deliverable
- mark tier "pro" only if the prompt encodes proprietary ARTO methodology; otherwise "free"

Return a JSON object: { "items": [ ... ] }`;

const BLOG_POST_INSTRUCTIONS = `Generate {count} editorial blog posts for /learn/[slug], ALL in {language}.

Each is a vertical guide. Strict shape per item:
{
  "slug": "...",
  "category": "branding" | "graphic_design" | "copywriting" | "photography" | "video" | "ux_ui" | "illustration" | "marketing" | "music" | "architecture" | "fashion" | "creative_productivity",
  "title_en": "...",
  "title_es": "...",
  "meta_description_en": "...",
  "meta_description_es": "...",
  "hero_en": "...",
  "hero_es": "...",
  "intro_en": "...",
  "intro_es": "...",
  "use_cases_en": ["...", "..."],
  "use_cases_es": ["...", "..."]
}

Constraints:
- slug: short lowercase-with-hyphens, unique, no existing learn slug
- title under 60 chars
- meta_description 120-160 chars
- hero: one strong headline (under 80 chars)
- intro: 80-160 words, sets up what the AI can do in this vertical in 2026
- use_cases: 4-6 concrete situations where an operator uses prompts in this vertical

Return a JSON object: { "items": [ ... ] }`;

interface GenerateBody {
  type: "prompt" | "blog_post";
  count?: number;
  language?: "en" | "es";
  brief?: string;
}

async function fetchContextSignals(): Promise<string> {
  try {
    const sb = createAdminClient();
    const { data: signals } = await sb
      .from("engine_signals")
      .select("signal_type, summary, metadata")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(5);
    if (!signals || signals.length === 0) return "";
    const lines = signals.map(
      (s) =>
        `- ${s.signal_type}: ${s.summary}`,
    );
    return `\n\nRecent engine signals to consider (use sparingly, as inspiration):\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as GenerateBody | null;
  const type = body?.type;
  if (type !== "prompt" && type !== "blog_post") {
    return NextResponse.json({ error: "type must be 'prompt' or 'blog_post'" }, { status: 400 });
  }
  const count = Math.max(1, Math.min(MAX_COUNT, body?.count ?? 3));
  const language: "en" | "es" = body?.language === "es" ? "es" : "en";
  const brief = (body?.brief ?? "").trim();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const template = type === "prompt" ? PROMPT_INSTRUCTIONS : BLOG_POST_INSTRUCTIONS;
  const instructions = template.replace("{count}", String(count)).replace("{language}", language);
  const context = await fetchContextSignals();
  const briefBlock = brief ? `\n\nOperator brief: ${brief}` : "";

  const anth = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const resp = await anth.messages.create({
    model: MODEL,
    max_tokens: 8000,
    temperature: 0.7,
    system: SYSTEM_BASE,
    messages: [
      {
        role: "user",
        content: instructions + briefBlock + context,
      },
    ],
  });
  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  let parsed: { items?: unknown[] };
  try {
    const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    parsed = JSON.parse(trimmed);
  } catch (e) {
    return NextResponse.json(
      { error: `Claude returned unparseable JSON: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }
  if (!parsed.items || !Array.isArray(parsed.items)) {
    return NextResponse.json({ error: "Claude returned no items array" }, { status: 502 });
  }

  const pricing = PRICING[MODEL] ?? PRICING["claude-sonnet-4-5"];
  const totalCost =
    (resp.usage.input_tokens / 1_000_000) * pricing.input +
    (resp.usage.output_tokens / 1_000_000) * pricing.output;
  const costPerItem = totalCost / parsed.items.length;

  const sb = createAdminClient();
  const rows = parsed.items.map((payload) => ({
    type,
    status: "draft" as const,
    language,
    payload,
    cost_usd: costPerItem,
  }));
  const { data: inserted, error } = await sb.from("content_items").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    inserted: inserted?.length ?? 0,
    items: inserted,
    cost_usd: totalCost,
  });
}
