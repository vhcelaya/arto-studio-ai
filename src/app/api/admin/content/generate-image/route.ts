import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildArtoImagePrompt,
  generateAndStoreImage,
  IMAGE_PRICING,
  type ImageBrief,
  type ImageSize,
  type ImageTreatment,
} from "@/lib/content-image";

/* POST /api/admin/content/generate-image
 *
 * body {
 *   item_id: string,
 *   prompt?: string,
 *   size?: "1024x1024" | "1024x1536" | "1536x1024",
 *   image_brief?: { treatment, text_overlay?, wordmark?, geo_tags? }
 * }
 *
 * Generates a brand-faithful image for the given content_item.
 * If `image_brief` is provided, it overrides whatever brief was on the
 * payload (used by the drawer "Regenerar imagen" when the operator
 * changed treatment / text / wordmark controls). If `prompt` is
 * provided, it overrides the entire prompt builder (escape hatch). */

const VALID_TREATMENTS: ImageTreatment[] = [
  "silhouette", "pleated_warm", "frosted_glass", "photographic_crop",
  "poster_headline", "bubbles_overlay", "geographic_card", "architectural",
];

function parseImageBrief(raw: unknown): ImageBrief | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const t = r.treatment;
  if (typeof t !== "string" || !VALID_TREATMENTS.includes(t as ImageTreatment)) {
    return undefined;
  }
  return {
    treatment: t as ImageTreatment,
    text_overlay: typeof r.text_overlay === "string" ? r.text_overlay : null,
    wordmark: typeof r.wordmark === "boolean" ? r.wordmark : true,
    geo_tags: typeof r.geo_tags === "boolean" ? r.geo_tags : false,
  };
}

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
  const briefOverride = parseImageBrief(body?.image_brief);

  // Resolve the prompt actually sent to the generator so we can return it.
  // generateAndStoreImage applies the same brief resolution internally, so
  // we mirror it here just to make the prompt visible in the response.
  const payloadForPrompt = briefOverride
    ? { ...(item.payload as Record<string, unknown>), image_brief: briefOverride }
    : (item.payload as Record<string, unknown>);
  const promptUsed = promptOverride || buildArtoImagePrompt(item.type, payloadForPrompt);

  try {
    const { image_url, cost_usd } = await generateAndStoreImage(sb, {
      item_id: item.id,
      type: item.type,
      payload: item.payload as Record<string, unknown>,
      size,
      promptOverride: promptUsed,
      briefOverride,
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
