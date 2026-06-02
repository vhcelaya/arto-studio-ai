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
- Show that ARTO actually does the work via concrete frameworks, methodology, client examples. Not motivational fluff.

PUNCTUATION — no em-dashes anywhere.
The em-dash character (—) is BANNED. Also banned: en-dashes (–) used in place of em-dashes.
If you would normally write an em-dash, use one of these instead: a period to end the thought, a comma to keep flowing, a colon to introduce an explanation, parentheses to set off an aside, or simply a new sentence. Hyphens (-) inside compound words like "art-design-and-strategy" are fine; replacements for em-dashes are not.

ANTI-PATTERNS — these are AI-tell phrasings. Never use them:
- "Not X. It is Y." / "Not X, but Y." / "X is not Y, X is Z."
  Spanish equivalents: "No es X. Es Y." / "No X. Sino Y." / "X no es Y, X es Z."
  This antithesis trick is the most obvious AI pattern. Just state Y plainly without setting up the negation.
- "It's not about X, it's about Y."
- Triplet build-ups for rhythm: "Bold. Clear. Focused." Avoid the three-staccato-words pattern.
- "We don't just X, we Y." / "More than X, it is Y."
- Opening with "In a world where..." or "In today's..."
- Hollow scale claims like "redefining the future of design".

Write declarative statements. State what is, plainly. The reader will feel the contrast on their own.

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

const SOCIAL_POST_INSTRUCTIONS = `Generate {count} social media posts for ARTO Studio AI, ALL in {language}.

Each item is one post designed to be cross-published to LinkedIn (page), Instagram (business), and Facebook (page). The shape:
{
  "network": "linkedin" | "instagram" | "facebook" | "all",
  "copy": "...",
  "hook": "...",
  "cta_text": "...",
  "cta_url": "..."
}

Constraints:
- network='all' means the same copy works on all 3 channels. Use 'all' when copy is platform-neutral. Otherwise pick the best fit.
- copy: 80-280 characters for Twitter-style brevity; up to 600 chars total if the platform allows (LinkedIn does). Never include hashtag walls (max 3 hashtags). Never use #ai #marketing #branding — too generic.
- hook: the FIRST 5-8 words of the post — must stop the scroll. NOT a question. NOT 'Are you...?'. Direct, concrete, surprising or specific.
- cta_text: 3-5 words. Examples: 'Browse the catalog', 'Try Brand Roast', 'Read the guide'.
- cta_url: must be one of /prompts, /pricing, /work, /roast, /learn, /learn/<slug>. NEVER an external URL.
- Tone rules apply (no banned words, tú-form for Spanish, no fluff).
- Lean into ARTO's concrete identity: 3,000 bilingual prompts, 15+ years with Google/Nike/Uber, methodology not motivation.

Return a JSON object: { "items": [ ... ] }`;

interface GenerateBody {
  type: "prompt" | "blog_post" | "social_post";
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
  if (type !== "prompt" && type !== "blog_post" && type !== "social_post") {
    return NextResponse.json(
      { error: "type must be 'prompt', 'blog_post', or 'social_post'" },
      { status: 400 },
    );
  }
  const count = Math.max(1, Math.min(MAX_COUNT, body?.count ?? 3));
  const language: "en" | "es" = body?.language === "es" ? "es" : "en";
  const brief = (body?.brief ?? "").trim();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const template =
    type === "prompt"
      ? PROMPT_INSTRUCTIONS
      : type === "blog_post"
      ? BLOG_POST_INSTRUCTIONS
      : SOCIAL_POST_INSTRUCTIONS;
  const instructions = template.replace("{count}", String(count)).replace("{language}", language);
  const context = await fetchContextSignals();
  const briefBlock = brief ? `\n\nOperator brief: ${brief}` : "";

  /* Dedup pass 1 — anti-list in the prompt.
   * We hand Claude every existing title (en + es) for prompts, or every
   * existing /learn slug + title for blog posts, so it actively avoids
   * generating something we already have. ~5-15K input tokens depending
   * on catalog size, well within budget for the quality bump. */
  const sb = createAdminClient();
  const antiList = await buildAntiList(sb, type);

  const anth = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const resp = await anth.messages.create({
    model: MODEL,
    max_tokens: 8000,
    temperature: 0.7,
    system: SYSTEM_BASE,
    messages: [
      {
        role: "user",
        content: instructions + briefBlock + context + antiList,
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

  /* Dedup pass 2 — fuzzy match after generation.
   * Claude sometimes ignores the anti-list (~5% of the time). We
   * normalize titles and reject any item whose normalized title appears
   * in the existing catalog (or whose slug already exists for blog
   * posts). Rejected items are NOT inserted; we report them back so the
   * operator can see what happened. */
  const dedup = await dedupCheck(sb, type, parsed.items);

  /* Voice scrub — backstop the prompt-level rules.
   * Auto-fix em-dashes / en-dashes (replace with ". " when at clause
   * boundaries, ", " otherwise). Detect "no es X, es Y" antithesis
   * (en + es) and reject those items into the rejections list so the
   * operator sees what was filtered. */
  const voiced = applyVoiceScrub(type, dedup.kept);

  const rowsToInsert = voiced.kept.map((payload) => ({
    type,
    status: "draft" as const,
    language,
    payload,
    cost_usd: costPerItem,
  }));
  let inserted: unknown[] = [];
  if (rowsToInsert.length > 0) {
    const { data, error } = await sb.from("content_items").insert(rowsToInsert).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    inserted = data ?? [];
  }

  const allRejections = [
    ...dedup.rejected,
    ...voiced.rejected.map((r) => ({ ...r, reason: `voice: ${r.reason}` })),
  ];
  return NextResponse.json({
    inserted: inserted.length,
    rejected: allRejections.length,
    rejections: allRejections,
    items: inserted,
    cost_usd: totalCost,
    voice_fixes: voiced.fixes,
  });
}

/* ---------- voice scrub ---------- */

/* Strings inside payloads that should obey the voice rules. Per-type so we
 * don't touch payload metadata like 'category' or 'tier'. */
const PAYLOAD_TEXT_KEYS: Record<string, string[]> = {
  prompt: ["title_en", "title_es", "body_en", "body_es", "use_case", "expected_output"],
  blog_post: [
    "title_en", "title_es", "meta_description_en", "meta_description_es",
    "hero_en", "hero_es", "intro_en", "intro_es",
  ],
  social_post: ["hook", "copy", "cta_text"],
};

const ANTITHESIS_PATTERNS: RegExp[] = [
  // English
  /\bnot\s+(just\s+)?[\w'’\- ]{1,50}[.,]\s*(it\s+is|it'?s|it\s+is\s+about|we|you)\s+\w/i,
  /\bit'?s\s+not\s+about\s+\w+[.,]\s+it'?s\s+about\s+\w/i,
  /\bmore\s+than\s+[\w ]{1,40}[.,]\s+it\s+is\s+\w/i,
  // Spanish
  /\bno\s+(es|son)\s+[\w'áéíóúñ\- ]{1,50}[.,]\s+(es|son)\s+\w/i,
  /\bno\s+se\s+trata\s+de\s+[\w ]{1,40}[.,]\s+se\s+trata\s+de\s+\w/i,
  /\bm[aá]s\s+que\s+[\w ]{1,40}[.,]\s+es\s+\w/i,
];

/* Replace em-dash + en-dash with the right ASCII punctuation. The em-dash
 * usually wants ". " (sentence break) when surrounded by spaces, or "," when
 * it's mid-clause. Default to ". " which is the safer brand fit for ARTO. */
function scrubDashes(s: string): { out: string; touched: boolean } {
  if (!s) return { out: s, touched: false };
  const original = s;
  // Em-dash with spaces on both sides → sentence break.
  let out = s.replace(/\s+—\s+/g, ". ");
  // Em-dash hugging a word → comma.
  out = out.replace(/—/g, ", ");
  // En-dash used in place of em-dash (same rules).
  out = out.replace(/\s+–\s+/g, ". ");
  out = out.replace(/–/g, ", ");
  // Collapse accidental ", ." or ".." created by the rewrite.
  out = out.replace(/,\s*\./g, ".").replace(/\.{2,}/g, ".");
  return { out, touched: out !== original };
}

interface VoiceResult {
  kept: Record<string, unknown>[];
  rejected: Array<{ payload: Record<string, unknown>; reason: string }>;
  fixes: number;
}

function applyVoiceScrub(type: string, items: Record<string, unknown>[]): VoiceResult {
  const out: VoiceResult = { kept: [], rejected: [], fixes: 0 };
  for (const raw of items) {
    const keys = PAYLOAD_TEXT_KEYS[type] ?? Object.keys(raw).filter((k) => typeof raw[k] === "string");
    let antithesisHit: string | null = null;
    const fixed: Record<string, unknown> = { ...raw };
    for (const k of keys) {
      const v = raw[k];
      if (typeof v !== "string") continue;
      // Antithesis check first — if found, reject the whole item; auto-fix
      // is too risky for ARTO's brand voice.
      for (const re of ANTITHESIS_PATTERNS) {
        if (re.test(v)) {
          antithesisHit = `field '${k}' uses an antithesis anti-pattern: "${v.slice(0, 80)}..."`;
          break;
        }
      }
      if (antithesisHit) break;
      // Otherwise scrub dashes in place.
      const { out: scrubbed, touched } = scrubDashes(v);
      if (touched) {
        fixed[k] = scrubbed;
        out.fixes += 1;
      }
    }
    if (antithesisHit) {
      out.rejected.push({ payload: raw, reason: antithesisHit });
    } else {
      out.kept.push(fixed);
    }
  }
  return out;
}

/* ---------- dedup helpers ---------- */

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function buildAntiList(
  sb: ReturnType<typeof createAdminClient>,
  type: "prompt" | "blog_post" | "social_post",
): Promise<string> {
  if (type === "social_post") {
    // Pull the last 30 published social posts so Claude doesn't recycle
    // hooks or copy. Lighter dedup than prompts/blogs because social posts
    // are intentionally repeatable — but we don't want word-for-word copies.
    const { data } = await sb
      .from("content_items")
      .select("payload")
      .eq("type", "social_post")
      .in("status", ["published", "approved", "draft"])
      .order("updated_at", { ascending: false })
      .limit(30);
    if (!data || data.length === 0) return "";
    const lines = data
      .map((row) => {
        const p = row.payload as Record<string, string>;
        return `- ${p.hook ?? "(no hook)"} | ${(p.copy ?? "").slice(0, 80)}`;
      })
      .join("\n");
    return `\n\nRecent ARTO social posts — DO NOT repeat the same hook or angle:\n${lines}`;
  }
  if (type === "prompt") {
    const { data } = await sb.from("prompts").select("id, title_en, title_es").limit(5000);
    if (!data || data.length === 0) return "";
    const lines = data
      .map((p) => `- ${p.id}: ${p.title_en ?? ""} | ${p.title_es ?? ""}`)
      .join("\n");
    return `\n\nDO NOT generate anything similar to these prompts already in the ARTO catalog. The new prompts MUST cover different angles, use-cases, or methodologies:\n${lines}`;
  }
  // blog_post: pull existing /learn slugs + titles from content_items too.
  const { data: existing } = await sb
    .from("content_items")
    .select("payload")
    .eq("type", "blog_post");
  const taken = new Set<string>();
  for (const row of existing ?? []) {
    const p = row.payload as Record<string, string>;
    if (p.slug) taken.add(p.slug);
  }
  // Also exclude the 12 hardcoded /learn/[slug] vertical guides.
  const HARDCODED_LEARN_SLUGS = [
    "branding",
    "graphic-design",
    "copywriting",
    "photography",
    "video",
    "ux-ui",
    "illustration",
    "marketing",
    "music",
    "architecture",
    "fashion",
    "creative-productivity",
  ];
  for (const slug of HARDCODED_LEARN_SLUGS) taken.add(slug);
  const list = Array.from(taken).sort().join(", ");
  return `\n\nDO NOT use any of these slugs (already taken): ${list}. Pick a fresh slug for each blog post.`;
}

interface DedupResult {
  kept: Array<Record<string, unknown>>;
  rejected: Array<{ payload: Record<string, unknown>; reason: string }>;
}

async function dedupCheck(
  sb: ReturnType<typeof createAdminClient>,
  type: "prompt" | "blog_post" | "social_post",
  items: unknown[],
): Promise<DedupResult> {
  const result: DedupResult = { kept: [], rejected: [] };

  if (type === "social_post") {
    // Light dedup for social: only reject if the FIRST 40 chars of copy
    // match an existing post verbatim. Social hooks can intentionally
    // riff on each other; we just block exact-clone laziness.
    const { data: existing } = await sb
      .from("content_items")
      .select("payload")
      .eq("type", "social_post")
      .limit(200);
    const taken = new Set<string>();
    for (const row of existing ?? []) {
      const p = row.payload as Record<string, string>;
      if (p.copy) taken.add(normalizeTitle(String(p.copy).slice(0, 40)));
    }
    for (const raw of items) {
      const payload = raw as Record<string, string>;
      const key = payload.copy ? normalizeTitle(String(payload.copy).slice(0, 40)) : "";
      if (key && taken.has(key)) {
        result.rejected.push({ payload: raw as Record<string, unknown>, reason: "near-duplicate copy" });
        continue;
      }
      if (key) taken.add(key);
      result.kept.push(raw as Record<string, unknown>);
    }
    return result;
  }

  if (type === "prompt") {
    const { data: existing } = await sb.from("prompts").select("title_en, title_es");
    const taken = new Set<string>();
    for (const r of existing ?? []) {
      if (r.title_en) taken.add(normalizeTitle(r.title_en));
      if (r.title_es) taken.add(normalizeTitle(r.title_es));
    }
    for (const raw of items) {
      const payload = raw as Record<string, string>;
      const enKey = payload.title_en ? normalizeTitle(payload.title_en) : "";
      const esKey = payload.title_es ? normalizeTitle(payload.title_es) : "";
      if ((enKey && taken.has(enKey)) || (esKey && taken.has(esKey))) {
        result.rejected.push({ payload: raw as Record<string, unknown>, reason: "duplicate title" });
        continue;
      }
      // Reject obvious within-batch dupes too.
      if (enKey) taken.add(enKey);
      if (esKey) taken.add(esKey);
      result.kept.push(raw as Record<string, unknown>);
    }
    return result;
  }

  // blog_post: dedup by slug.
  const { data: existing } = await sb
    .from("content_items")
    .select("payload")
    .eq("type", "blog_post");
  const takenSlugs = new Set<string>();
  for (const row of existing ?? []) {
    const p = row.payload as Record<string, string>;
    if (p.slug) takenSlugs.add(p.slug.toLowerCase());
  }
  const HARDCODED = [
    "branding",
    "graphic-design",
    "copywriting",
    "photography",
    "video",
    "ux-ui",
    "illustration",
    "marketing",
    "music",
    "architecture",
    "fashion",
    "creative-productivity",
  ];
  for (const s of HARDCODED) takenSlugs.add(s);

  for (const raw of items) {
    const payload = raw as Record<string, string>;
    const slug = (payload.slug ?? "").toLowerCase().trim();
    if (!slug) {
      result.rejected.push({ payload: raw as Record<string, unknown>, reason: "missing slug" });
      continue;
    }
    if (takenSlugs.has(slug)) {
      result.rejected.push({
        payload: raw as Record<string, unknown>,
        reason: `slug already exists: ${slug}`,
      });
      continue;
    }
    takenSlugs.add(slug);
    result.kept.push(raw as Record<string, unknown>);
  }
  return result;
}
