import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { requireAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/* POST /api/admin/content/generate-image
 *
 * body { item_id: string, prompt?: string, size?: "1024x1024" | "1024x1536" | "1536x1024" }
 *
 * Generates an image for the given content_item via OpenAI gpt-image-1.
 * If `prompt` is not provided, derives one from the item's payload
 * (hook + copy for social posts, hero + intro for blog posts, title for
 * prompts). Uploads the resulting PNG to Supabase Storage bucket
 * 'content-images' and writes back the public URL + the prompt used
 * into payload.image_url and payload.image_prompt. */

const MODEL = "gpt-image-1";
const DEFAULT_SIZE = "1024x1024";
const PRICING = {
  "1024x1024": 0.04,
  "1024x1536": 0.06,
  "1536x1024": 0.06,
} as const;
type ImageSize = keyof typeof PRICING;

function derivePromptFromPayload(type: string, payload: Record<string, unknown>): string {
  const p = payload as Record<string, string>;
  const arto = "ARTO Studio AI — bilingual creative studio. Style: minimal, editorial, high-contrast. NOT cartoon, NOT 3D render, NOT corporate stock. Brand palette: black, off-white, with one accent color per image.";
  if (type === "social_post") {
    const hook = p.hook || (p.copy ?? "").slice(0, 80);
    return `Editorial visual for a social post about: "${hook}". ${arto} No text overlays. Composition leaves the lower-third open for a caption overlay added later.`;
  }
  if (type === "blog_post") {
    return `Editorial hero image for a /learn article titled "${p.title_en || p.title_es}". Topic: ${p.intro_en || p.intro_es || ""}. ${arto} Horizontal composition. No text in the image.`;
  }
  if (type === "prompt") {
    return `Conceptual card art for a creative-AI prompt titled "${p.title_en || p.title_es}". Category: ${p.category}. ${arto} Square composition. No text in the image.`;
  }
  return arto;
}

function bucketPath(itemId: string): string {
  return `${itemId}.png`;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const itemId = String(body?.item_id ?? "").trim();
  if (!itemId) return NextResponse.json({ error: "item_id required" }, { status: 400 });

  const size: ImageSize = (body?.size as ImageSize) || DEFAULT_SIZE;
  if (!PRICING[size]) {
    return NextResponse.json({ error: "size must be 1024x1024, 1024x1536, or 1536x1024" }, { status: 400 });
  }

  const sb = createAdminClient();

  // Fetch the item.
  const { data: item, error: itemErr } = await sb
    .from("content_items")
    .select("id, type, payload")
    .eq("id", itemId)
    .maybeSingle();
  if (itemErr || !item) {
    return NextResponse.json({ error: itemErr?.message ?? "item not found" }, { status: 404 });
  }

  const promptOverride = (body?.prompt ?? "").trim();
  const prompt = promptOverride || derivePromptFromPayload(item.type, item.payload as Record<string, unknown>);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let pngBuffer: Buffer;
  try {
    const result = await openai.images.generate({
      model: MODEL,
      prompt,
      n: 1,
      size,
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      // Some accounts get URL responses instead of b64. Fall back to fetching the URL.
      const url = result.data?.[0]?.url;
      if (!url) {
        return NextResponse.json({ error: "OpenAI returned no image data" }, { status: 502 });
      }
      const r = await fetch(url);
      if (!r.ok) return NextResponse.json({ error: `Failed to download generated image: ${r.status}` }, { status: 502 });
      pngBuffer = Buffer.from(await r.arrayBuffer());
    } else {
      pngBuffer = Buffer.from(b64, "base64");
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }

  // Upload to Supabase Storage (overwrite so regenerations replace).
  const path = bucketPath(itemId);
  const { error: uploadErr } = await sb.storage.from("content-images").upload(path, pngBuffer, {
    contentType: "image/png",
    upsert: true,
  });
  if (uploadErr) {
    return NextResponse.json({ error: `storage upload failed: ${uploadErr.message}` }, { status: 500 });
  }
  const { data: publicData } = sb.storage.from("content-images").getPublicUrl(path);
  const imageUrl = publicData.publicUrl;

  // Write back into payload + cost.
  const payload = { ...(item.payload as Record<string, unknown>), image_url: imageUrl, image_prompt: prompt };
  const costUsd = PRICING[size];
  const { data: updated, error: updErr } = await sb
    .from("content_items")
    .update({
      payload,
      edited_by_human: false,
      updated_at: new Date().toISOString(),
      // Track image cost separately by appending to existing cost.
      cost_usd: ((item as { cost_usd?: number }).cost_usd ?? 0) + costUsd,
    })
    .eq("id", itemId)
    .select()
    .single();
  if (updErr) {
    return NextResponse.json(
      { error: `image uploaded but payload update failed: ${updErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    item: updated,
    image_url: imageUrl,
    cost_usd: costUsd,
  });
}
