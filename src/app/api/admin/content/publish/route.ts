import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/* POST /api/admin/content/publish  body { item_id?: string, type?: "prompt" }
 *
 * If item_id is given, publish that one. If type is given (no id), publish
 * all approved items of that type. Currently 'prompt' is the only type
 * with a publisher implemented; blog_post / social_post / newsletter land
 * in Phase 3c.
 *
 * For type='prompt' the payload becomes a row in the public.prompts
 * catalog table. The content_item flips to status='published' with
 * published_ref = the new prompts.id, and published_at set. */

interface PromptPayload {
  title_en: string;
  title_es: string;
  body_en: string;
  body_es: string;
  category: string;
  subcategory: string;
  ai_model: string;
  difficulty: string;
  tier: string;
  tags?: string[];
  use_case?: string;
  expected_output?: string;
}

function nextPromptId(category: string, lastSeq: number): string {
  // Existing convention from the catalog: BR-0001, DG-0001, etc.
  const prefix: Record<string, string> = {
    branding: "BR",
    graphic_design: "DG",
    copywriting: "CW",
    photography: "FT",
    video: "VD",
    ux_ui: "UX",
    illustration: "IL",
    marketing: "MK",
    music: "MU",
    architecture: "AR",
    fashion: "FA",
    creative_productivity: "CP",
  };
  const p = prefix[category] ?? "XX";
  return `${p}-${String(lastSeq + 1).padStart(4, "0")}`;
}

async function publishOnePrompt(
  sb: ReturnType<typeof createAdminClient>,
  item: { id: string; payload: PromptPayload },
): Promise<{ ok: true; promptId: string } | { ok: false; error: string }> {
  const p = item.payload;
  // Validate required keys.
  for (const k of ["title_en", "title_es", "body_en", "body_es", "category", "subcategory", "ai_model", "difficulty", "tier"] as const) {
    if (!p[k]) return { ok: false, error: `missing payload.${k}` };
  }
  // Find next sequence for this category.
  const { data: existing } = await sb
    .from("prompts")
    .select("id")
    .ilike("id", `${p.category[0].toUpperCase()}%`)
    .order("id", { ascending: false })
    .limit(1);
  let seq = 0;
  if (existing && existing.length > 0) {
    const m = (existing[0].id as string).match(/-(\d+)$/);
    if (m) seq = parseInt(m[1], 10);
  }
  const promptId = nextPromptId(p.category, seq);

  const { error: insErr } = await sb.from("prompts").insert({
    id: promptId,
    title_en: p.title_en,
    title_es: p.title_es,
    prompt_en: p.body_en,
    prompt_es: p.body_es,
    category: p.category,
    subcategory: p.subcategory,
    ai_model: p.ai_model,
    difficulty: p.difficulty,
    tier: p.tier,
    tags: p.tags ?? [],
    use_case: p.use_case ?? null,
    expected_output: p.expected_output ?? null,
    is_featured: false,
  });
  if (insErr) return { ok: false, error: insErr.message };

  const { error: updErr } = await sb
    .from("content_items")
    .update({
      status: "published",
      published_ref: promptId,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);
  if (updErr) return { ok: false, error: `prompts inserted but content_items update failed: ${updErr.message}` };

  return { ok: true, promptId };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const itemId = body?.item_id as string | undefined;
  const type = body?.type as string | undefined;

  if (!itemId && type !== "prompt" && type !== "blog_post" && type !== "social_post") {
    return NextResponse.json(
      { error: "must specify item_id, or type='prompt'|'blog_post'|'social_post' to bulk-publish" },
      { status: 400 },
    );
  }

  const sb = createAdminClient();

  // Build the worklist.
  let q = sb
    .from("content_items")
    .select("id, type, payload")
    .eq("status", "approved");
  if (itemId) q = q.eq("id", itemId);
  if (!itemId && type) q = q.eq("type", type);
  const { data: items, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!items || items.length === 0) {
    return NextResponse.json({ published: 0, results: [] });
  }

  const results: Array<{
    item_id: string;
    status: "published" | "skipped" | "failed";
    prompt_id?: string;
    slug?: string;
    buffer_ids?: string[];
    error?: string;
  }> = [];

  for (const item of items) {
    if (item.type === "prompt") {
      const r = await publishOnePrompt(sb, { id: item.id, payload: item.payload as PromptPayload });
      if (r.ok) {
        results.push({ item_id: item.id, status: "published", prompt_id: r.promptId });
      } else {
        results.push({ item_id: item.id, status: "failed", error: r.error });
      }
    } else if (item.type === "blog_post") {
      const r = await publishOneBlogPost(sb, { id: item.id, payload: item.payload as BlogPostPayload });
      if (r.ok) {
        results.push({ item_id: item.id, status: "published", slug: r.slug });
      } else {
        results.push({ item_id: item.id, status: "failed", error: r.error });
      }
    } else if (item.type === "social_post") {
      const r = await publishOneSocialPost(sb, {
        id: item.id,
        payload: item.payload as SocialPostPayload,
      });
      if (r.ok) {
        results.push({ item_id: item.id, status: "published", buffer_ids: r.bufferIds });
      } else {
        results.push({ item_id: item.id, status: "failed", error: r.error });
      }
    } else {
      results.push({
        item_id: item.id,
        status: "skipped",
        error: `publisher not implemented for type='${item.type}' yet`,
      });
    }
  }

  const published = results.filter((r) => r.status === "published").length;
  return NextResponse.json({ published, results });
}

/* blog_post publisher
 * Flow for blog posts is simpler than prompts because /learn reads
 * directly from content_items (status='published') via
 * src/lib/learn-pages.ts. So 'publish' means: validate the payload
 * has the required fields, dedup-check the slug against the hardcoded
 * LEARN_PAGES and any other published blog_post, then flip
 * status='published' + set published_at + published_ref to the slug. */

interface BlogPostPayload {
  slug: string;
  category: string;
  title_en: string;
  title_es: string;
  meta_description_en?: string;
  meta_description_es?: string;
  hero_en?: string;
  hero_es?: string;
  intro_en: string;
  intro_es: string;
  use_cases_en?: string[];
  use_cases_es?: string[];
}

const HARDCODED_LEARN_SLUGS = new Set([
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
]);

async function publishOneBlogPost(
  sb: ReturnType<typeof createAdminClient>,
  item: { id: string; payload: BlogPostPayload },
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const p = item.payload;
  for (const k of ["slug", "category", "title_en", "title_es", "intro_en", "intro_es"] as const) {
    if (!p[k]) return { ok: false, error: `missing payload.${k}` };
  }

  const slug = String(p.slug).toLowerCase().trim();
  if (HARDCODED_LEARN_SLUGS.has(slug)) {
    return { ok: false, error: `slug '${slug}' collides with a hardcoded /learn vertical guide` };
  }

  // Check against already-published blog posts (excluding this row).
  const { data: clash } = await sb
    .from("content_items")
    .select("id")
    .eq("type", "blog_post")
    .eq("status", "published")
    .neq("id", item.id)
    .filter("payload->>slug", "eq", slug)
    .limit(1);
  if (clash && clash.length > 0) {
    return { ok: false, error: `slug '${slug}' already published` };
  }

  const { error } = await sb
    .from("content_items")
    .update({
      status: "published",
      published_ref: slug,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true, slug };
}

/* social_post publisher
 *
 * Pushes the post to ARTO's Buffer queue across LinkedIn, Instagram, and
 * Facebook (defaults). 'network' in the payload controls which subset of
 * channels gets the post. Buffer queues the items for the next slot in
 * each channel's posting schedule — the operator can still cancel from
 * Buffer's own UI before they go out.
 *
 * Buffer auth: BUFFER_TOKEN env var (Personal Access Token).
 *
 * Channel IDs are hardcoded here because they don't rotate and aren't
 * secrets. If a new ARTO social account gets connected to Buffer, add
 * it to ARTO_BUFFER_CHANNELS below + redeploy. */

interface SocialPostPayload {
  network: "linkedin" | "instagram" | "facebook" | "all";
  copy: string;
  hook?: string;
  cta_text?: string;
  cta_url?: string;
}

/* ARTO-brand Buffer channels. IDs refreshed 2026-06-01 after Victor
 * reconnected ARTO channels post-billing reactivation. Buffer assigns a
 * NEW id per reconnection, so any channel re-link → bump these. */
const ARTO_BUFFER_CHANNELS = {
  linkedin: "6a1dde94c687a22dd44cf11a", // ARTO (page) — arto-design-culture-technology
  instagram: "6a1dddcbc687a22dd44cedad", // arto.group
  facebook: "6a1dde71c687a22dd44cf087", // ARTO Group
} as const;

const BUFFER_GRAPHQL = "https://api.buffer.com/graphql";

/* Buffer GraphQL response shape varies per mutation. createPost returns
 * either PostActionSuccess (which has { post: { id } }) or one of the
 * MutationError types. The union resolves at runtime via __typename. */
interface BufferPostResponse {
  data?: {
    createPost?: {
      __typename?: string;
      post?: { id: string };
      message?: string;
    };
  };
  errors?: Array<{ message: string }>;
}

async function queueOnBuffer(
  channelId: string,
  text: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const token = process.env.BUFFER_TOKEN;
  if (!token) return { ok: false, error: "BUFFER_TOKEN not set" };

  // createPost with saveToDraft=true lands the post in Buffer's Drafts
  // tab for that channel. It DOES NOT enter the publishing queue — Victor
  // has to open Buffer, review, and click publish/schedule for it to go
  // live. This adds a fourth approval gate after our 3 (generate, edit,
  // approve in /admin/content). Same safety model as outreach drafts but
  // even tighter: the operator can still bail at the very last click.
  //
  // To flip this back to auto-queue behavior later, swap saveToDraft:true
  // for mode: addToQueue (and drop saveToDraft).
  const mutation = `
    mutation CreatePost(
      $channelId: ChannelId!
      $text: String!
    ) {
      createPost(input: {
        channelId: $channelId
        text: $text
        schedulingType: automatic
        mode: addToQueue
        assets: []
        source: "asai-engine"
        saveToDraft: true
      }) {
        __typename
        ... on PostActionSuccess { post { id } }
        ... on NotFoundError    { message }
        ... on UnauthorizedError { message }
        ... on UnexpectedError   { message }
        ... on RestProxyError    { message }
        ... on LimitReachedError { message }
        ... on InvalidInputError { message }
      }
    }
  `;
  try {
    const r = await fetch(BUFFER_GRAPHQL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: mutation,
        variables: { channelId, text },
      }),
    });
    if (!r.ok) {
      const body = (await r.text()).slice(0, 200);
      return { ok: false, error: `Buffer HTTP ${r.status}: ${body}` };
    }
    const json = (await r.json()) as BufferPostResponse;
    if (json.errors && json.errors.length > 0) {
      return { ok: false, error: json.errors.map((e) => e.message).join("; ") };
    }
    const cp = json.data?.createPost;
    if (!cp) return { ok: false, error: "Buffer returned no createPost payload" };
    if (cp.__typename === "PostActionSuccess" && cp.post?.id) {
      return { ok: true, id: cp.post.id };
    }
    return { ok: false, error: cp.message ?? `createPost returned ${cp.__typename ?? "unknown"}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function composeSocialText(payload: SocialPostPayload): string {
  const parts: string[] = [];
  if (payload.hook) parts.push(payload.hook);
  if (payload.copy && payload.copy !== payload.hook) parts.push(payload.copy);
  if (payload.cta_text && payload.cta_url) {
    const url = payload.cta_url.startsWith("/")
      ? `https://creative.artostudio.ai${payload.cta_url}`
      : payload.cta_url;
    parts.push(`${payload.cta_text} → ${url}`);
  }
  return parts.filter(Boolean).join("\n\n");
}

async function publishOneSocialPost(
  sb: ReturnType<typeof createAdminClient>,
  item: { id: string; payload: SocialPostPayload },
): Promise<{ ok: true; bufferIds: string[] } | { ok: false; error: string }> {
  const p = item.payload;
  if (!p.copy || typeof p.copy !== "string") {
    return { ok: false, error: "missing payload.copy" };
  }
  const text = composeSocialText(p);
  // Decide channels.
  const network = p.network ?? "all";
  const channelIds: string[] = [];
  if (network === "all" || network === "linkedin") channelIds.push(ARTO_BUFFER_CHANNELS.linkedin);
  if (network === "all" || network === "instagram") channelIds.push(ARTO_BUFFER_CHANNELS.instagram);
  if (network === "all" || network === "facebook") channelIds.push(ARTO_BUFFER_CHANNELS.facebook);
  if (channelIds.length === 0) {
    return { ok: false, error: `unknown network: ${network}` };
  }
  const bufferIds: string[] = [];
  const errors: string[] = [];
  for (const ch of channelIds) {
    const r = await queueOnBuffer(ch, text);
    if (r.ok) bufferIds.push(r.id);
    else errors.push(`${ch}: ${r.error}`);
  }
  if (bufferIds.length === 0) {
    return { ok: false, error: errors.join("; ") };
  }
  // Mark item published with the buffer ids as ref.
  const { error } = await sb
    .from("content_items")
    .update({
      status: "published",
      published_ref: bufferIds.join(","),
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);
  if (error) {
    return { ok: false, error: `pushed to Buffer (${bufferIds.length}) but DB update failed: ${error.message}` };
  }
  // Partial success: some channels succeeded, some didn't.
  if (errors.length > 0) {
    return { ok: true, bufferIds }; // still mark ok, partial errors logged below
  }
  return { ok: true, bufferIds };
}
