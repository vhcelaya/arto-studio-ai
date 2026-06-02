import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildArtoImagePrompt,
  generateAndStoreImage,
  IMAGE_PRICING,
  type ImageSize,
} from "@/lib/content-image";

/* POST /api/admin/content/generate-image
 *
 * body { item_id: string, prompt?: string, size?: "1024x1024" | "1024x1536" | "1536x1024" }
 *
 * Generates an image for the given content_item via OpenAI gpt-image-1
 * using the ARTO Design System brand preamble (see lib/content-image.ts).
 * If `prompt` is provided it overrides the auto-derived brand prompt
 * (still uploaded + tracked). Returns the updated item + public URL +
 * marginal cost. */

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const itemId = String(body?.item_id ?? "").trim();
  if (!itemId) return NextResponse.json({ error: "item_id required" }, { status: 400 });

  const size: ImageSize = (body?.size as ImageSize) || "1024x1024";
  if (!IMAGE_PRICING[size]) {
    return NextResponse.json(
      { error: "size must be 1024x1024, 1024x1536, or 1536x1024" },
      { status: 400 },
    );
  }

  const sb = createAdminClient();

  const { data: item, error: itemErr } = await sb
    .from("content_items")
    .select("id, type, payload")
    .eq("id", itemId)
    .maybeSingle();
  if (itemErr || !item) {
    return NextResponse.json(
      { error: itemErr?.message ?? "item not found" },
      { status: 404 },
    );
  }

  const promptOverride = String(body?.prompt ?? "").trim();
  // For the response surface we want callers (the drawer's image panel) to
  // see the exact prompt used, so we resolve it here even though
  // generateAndStoreImage does the same internally.
  const promptUsed =
    promptOverride ||
    buildArtoImagePrompt(item.type, item.payload as Record<string, unknown>);

  try {
    const { image_url, cost_usd } = await generateAndStoreImage(sb, {
      item_id: item.id,
      type: item.type,
      payload: item.payload as Record<string, unknown>,
      size,
      promptOverride: promptUsed,
    });
    // Re-fetch the row so the client gets the merged payload back.
    const { data: updated } = await sb
      .from("content_items")
      .select("*")
      .eq("id", item.id)
      .maybeSingle();
    return NextResponse.json({
      item: updated,
      image_url,
      cost_usd,
      prompt: promptUsed,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // 502 for upstream (OpenAI / storage), 500 for our own bookkeeping —
    // we can't easily tell here, so use 500 generically. Frontend just
    // surfaces the message.
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
