import OpenAI from "openai";
import type { createAdminClient } from "@/lib/supabase/admin";

/* Shared helpers for generating brand-faithful images for content_items.
 *
 * The "look" is derived from the ARTO Design System (claude.ai/design,
 * 2026-06-01 export): bold monochrome, Manrope Bold display caps, paper +
 * black surfaces, warm browns ONLY inside pleated/frosted-glass texture
 * plates, six silhouette characters (eye-in-hand etc), glass-bubble
 * accents, no emoji, no rounded corners, no soft drop-shadows, hairline
 * borders, editorial photographic warmth. Every prompt we send to DALL-E
 * gets this style preamble — that's why anyone using these helpers can
 * stop worrying about "what does an ARTO image look like." */

const MODEL = "gpt-image-1";

export const IMAGE_PRICING = {
  "1024x1024": 0.04,
  "1024x1536": 0.06,
  "1536x1024": 0.06,
} as const;
export type ImageSize = keyof typeof IMAGE_PRICING;

/* The core brand preamble. Lifted from README.md "Visual foundations" and
 * "Content fundamentals" plus the colors_and_type.css tokens (paper
 * #F4F2EE, ink #0A0A0A, warm browns #3D2B1F / #5A4030 / #8B6A4F / #B8A088
 * / #D4C4B0). We never name the color hex codes to DALL-E — it doesn't
 * parse those reliably — but we describe them in plain-English brand
 * vocabulary that maps to the same palette. */
const ARTO_STYLE_PREAMBLE = `
ARTO brand image — art, design and digital strategy group out of New York / Toronto / Mexico City / Madrid.

Visual rules (mandatory):
- Aggressively monochrome. Pure black (#000), warm off-white "paper" (#F4F2EE), and a grayscale ramp. Warm browns (umber, walnut, bronze, sand, dust) appear ONLY inside pleated motion-blur or frosted-glass texture plates — never as flat fills.
- Editorial, gallery-quality, broadsheet-poster register. NOT corporate stock, NOT 3D render, NOT cartoon, NOT illustration in any commercial-vector style. Think art-book spread or a Massimo Vignelli / Pentagram editorial layout.
- Photography is warm, slightly desaturated, sepia-leaning. Skin tones lean sepia. Tight crops. Faces and hands can be cut by the frame.
- The signature illustration motif: a bold solid-black silhouette figure with an eye where its hand or head would be (eye-in-hand, eye-in-hat, person-with-eye-headed-shape). Pure black silhouette, no outline, no shading, no color, sits on paper or on black. Use this sparingly — only when a human/figure element fits the post topic.
- A secondary motif: liquid / mercury / glass bubbles that crop into the frame from an edge, partially covering type or imagery. They cast soft photographic shadows, never UI drop-shadows.
- Textures: pleated vertical motion-blur stripes in warm browns work as full-bleed hero backgrounds. Frosted-glass plates work as subtle tinted overlays.
- No emoji. No rounded corners (radii are essentially zero). No soft UI drop-shadows. No glow. No gradients beyond pleated browns. No neon. No cool-blue stock photography. No cheerful or "friendly agency" mood.
- Hairline borders only — 1px black on paper, 1px light on black.

Composition rules:
- Anchor visual mass to bottom-left or top-right of the frame, never dead-center cluttered. Leave generous outer margins.
- Geographic tags pin to corners ("NEW YORK / TORONTO" top-left style), if any tags appear at all.
- The image must be SAFE FOR A CAPTION OVERLAY added later: lower-third must stay visually quiet (low contrast, no detail).

Type rules (if any glyphs appear in the image at all):
- Display headlines: Manrope Bold or visually equivalent — uppercase, tight tracking, set in pure black on paper or pure white on black. Headlines can break across multiple lines mid-word as a deliberate design device.
- Body / metadata: a clean geometric sans (Geist / Inter Tight). Uppercase + wide tracking for tags, captions, and credits.
- The "arto" wordmark is a slightly-italic editorial serif (Romana-style), always lowercase.

DO NOT write headline copy into the image unless the prompt explicitly asks for it — the caller is composing copy separately for social platforms. Default to imagery-only.
`.trim();

/* ImageBrief drives visual variety. Generator emits one of these per
 * social_post item; the operator can override any field from the drawer
 * before regenerating. */
export type ImageTreatment =
  | "silhouette"        // bold black silhouette character (eye-in-hand etc) on paper
  | "pleated_warm"      // full-bleed warm-brown pleated motion-blur field
  | "frosted_glass"     // frosted glass plate over warm-brown ground
  | "photographic_crop" // sepia-warm tight photographic crop, hands or objects
  | "poster_headline"   // poster-scale Manrope Bold ALL-CAPS headline on paper
  | "bubbles_overlay"   // liquid/mercury/glass bubbles cropping into the frame
  | "geographic_card"   // "NEW YORK / TORONTO / MEXICO CITY / MADRID" corner tag composition
  | "architectural";    // editorial grid with hairlines + black planes + tight type

export interface ImageBrief {
  treatment: ImageTreatment;
  text_overlay?: string | null; // short phrase (4-8 words) rendered in the image; null/undefined = no text
  wordmark?: boolean;           // small italic-serif "arto" wordmark in a corner
  geo_tags?: boolean;           // corner-pinned "NEW YORK / TORONTO / MEXICO CITY / MADRID"
}

const TREATMENT_DESCRIPTIONS: Record<ImageTreatment, string> = {
  silhouette:
    "A SINGLE bold solid-black silhouette character with the ARTO eye motif (eye-in-hand, eye-in-chest, or eye-headed figure). Pure black, no outline, no shading, no color. Sitting on warm off-white paper background (#F4F2EE). The character is the dominant element; the rest of the frame is empty paper. NO photographic textures, NO pleated stripes, NO glass overlays — silhouette + paper only.",
  pleated_warm:
    "Full-bleed vertical pleated motion-blur field in warm browns (umber, walnut, bronze, sand, dust). The pleats run vertical, creating a layered curtain feel. NO silhouette figure, NO photography. The texture IS the image. Composition is editorial and quiet.",
  frosted_glass:
    "A frosted-glass plate (semi-transparent, blurred) positioned over a warm-brown pleated motion-blur ground. The glass plate is rectangular with hairline borders, slightly tilted or grid-aligned. Composition reads as architectural / editorial layering.",
  photographic_crop:
    "An editorial sepia-warm photograph, tight crop. Hands holding a small object, OR a face partially cropped by the frame, OR an architectural/material detail. Slightly desaturated, warm cast. NO neon, NO cool blues. Tight composition with editorial restraint.",
  poster_headline:
    "Poster-scale composition on warm off-white paper. A short headline phrase rendered in Manrope Bold (or visually equivalent geometric sans), ALL CAPS, tight letter-spacing. The type is the dominant element. Headlines can break across multiple lines mid-word as a design device. The phrase must read large and decisive at thumbnail scale.",
  bubbles_overlay:
    "Liquid / mercury / glass bubble shapes (one or two) cropping into the frame from an edge, partially covering whatever is behind them. Bubbles cast soft photographic shadows. Background can be warm-brown pleated or warm off-white paper. The bubbles are the focal point.",
  geographic_card:
    "Editorial composition on warm off-white paper. Corner-pinned all-caps geographic tags: 'NEW YORK / TORONTO' top-left, 'MEXICO CITY / MADRID' top-right OR vice versa, in small tracked sans. A single quiet visual element (silhouette, frosted plate, or pleated field) lives in the center or bottom. The geo tags ARE part of the design.",
  architectural:
    "Editorial gallery layout: hairline borders dividing the frame into 2-3 planes, mixing pure black blocks and warm paper. Tight geometric sans typography may appear as labels. Reads as the spread of a design monograph or art-book. Restrained, architectural, no photography.",
};

interface PayloadLike {
  // social_post
  hook?: string;
  copy?: string;
  network?: string;
  cta_text?: string;
  linkedin?: { hook?: string; copy?: string };
  instagram?: { hook?: string; copy?: string; hashtags?: string[] };
  facebook?: { hook?: string; copy?: string };
  // blog_post / prompt
  title_en?: string;
  title_es?: string;
  intro_en?: string;
  intro_es?: string;
  category?: string;
  subcategory?: string;
  // image override
  image_prompt?: string;
  image_brief?: ImageBrief;
}

/* Default brief when payload doesn't carry one. Random-ish weighted choice
 * so a batch of generations without explicit briefs still get varied
 * treatments. The generator should set image_brief explicitly for every
 * social_post; this default exists for blog_post / prompt and for legacy
 * social_post drafts that pre-date this schema. */
function defaultBriefFor(type: string, payload: PayloadLike): ImageBrief {
  // Deterministic-ish: pick from a per-type rotation by hashing the post
  // topic. Same item always regenerates with the same default; calling
  // with override changes the result.
  const POOL_SOCIAL: ImageTreatment[] = [
    "silhouette", "silhouette",
    "pleated_warm",
    "photographic_crop",
    "frosted_glass",
    "poster_headline",
    "bubbles_overlay",
    "geographic_card",
  ];
  const POOL_BLOG: ImageTreatment[] = [
    "silhouette",
    "pleated_warm",
    "architectural",
    "photographic_crop",
  ];
  const POOL_PROMPT: ImageTreatment[] = [
    "silhouette",
    "frosted_glass",
    "pleated_warm",
    "architectural",
  ];
  const pool = type === "social_post" ? POOL_SOCIAL : type === "blog_post" ? POOL_BLOG : POOL_PROMPT;

  const topic = (payload.hook || payload.linkedin?.hook || payload.title_en || payload.title_es || payload.copy || "arto").slice(0, 50);
  let h = 0;
  for (let i = 0; i < topic.length; i++) h = (h * 31 + topic.charCodeAt(i)) >>> 0;
  return {
    treatment: pool[h % pool.length],
    text_overlay: null,
    wordmark: true,
    geo_tags: false,
  };
}

function renderBriefInstructions(brief: ImageBrief): string[] {
  const parts: string[] = [];
  parts.push(`TREATMENT: ${brief.treatment}.`);
  parts.push(TREATMENT_DESCRIPTIONS[brief.treatment]);
  if (brief.text_overlay && brief.text_overlay.trim().length > 0) {
    const phrase = brief.text_overlay.trim();
    if (brief.treatment === "poster_headline") {
      parts.push(`The headline rendered in the image is exactly: "${phrase}". All caps, Manrope Bold or visually equivalent, tight tracking. Can break across multiple lines mid-word as a deliberate design device.`);
    } else {
      parts.push(`Render a SHORT phrase in the image: "${phrase}". Set in geometric sans, all caps, tight tracking, positioned in the lower-left or top-right corner area. The phrase complements (not competes with) the main treatment.`);
    }
  } else {
    parts.push("NO text rendered in the image at all. No headlines, no captions, no platform watermarks.");
  }
  if (brief.wordmark) {
    parts.push("INCLUDE a small lowercase italic-serif wordmark reading 'arto' (Romana-style serif, lowercase, slight italic feel). Position in a corner. Small scale, not dominant.");
  } else {
    parts.push("NO wordmark in this image.");
  }
  if (brief.geo_tags) {
    parts.push("INCLUDE corner-pinned geographic tags: 'NEW YORK / TORONTO' on one corner and 'MEXICO CITY / MADRID' on the other, set in small tracked all-caps geometric sans. These tags are quiet, structural, not decorative.");
  } else {
    parts.push("NO geographic tags in this image.");
  }
  return parts;
}

export function buildArtoImagePrompt(
  type: string,
  payload: PayloadLike,
): string {
  const brief = payload.image_brief ?? defaultBriefFor(type, payload);

  if (type === "social_post") {
    const topic = payload.hook || payload.linkedin?.hook || (payload.copy ?? "").slice(0, 120);
    return [
      ARTO_STYLE_PREAMBLE,
      "",
      "TASK: Editorial square (1:1) cover image for an ARTO social post.",
      `Post topic: "${topic}".`,
      "",
      ...renderBriefInstructions(brief),
      "",
      "Output is the IMAGE ONLY. Do not invent a fake ARTO logo lockup beyond the small italic-serif 'arto' wordmark if requested above. Composition must read at thumbnail scale.",
    ].join("\n");
  }

  if (type === "blog_post") {
    const title = payload.title_en || payload.title_es || "ARTO /learn article";
    const intro = (payload.intro_en || payload.intro_es || "").slice(0, 220);
    return [
      ARTO_STYLE_PREAMBLE,
      "",
      "TASK: Editorial horizontal hero image for an ARTO /learn article.",
      `Article title: "${title}".`,
      intro ? `Article opens with: "${intro}".` : "",
      "",
      ...renderBriefInstructions(brief),
      "",
      "Horizontal composition. Leave a margin at the right or bottom-left where a title overlay could be added in HTML.",
    ].join("\n");
  }

  if (type === "prompt") {
    const title = payload.title_en || payload.title_es || "ARTO prompt";
    const category = payload.category ?? "creative";
    return [
      ARTO_STYLE_PREAMBLE,
      "",
      "TASK: Conceptual square card art for an ARTO prompt-library entry.",
      `Prompt title: "${title}". Category: ${category}.`,
      "",
      ...renderBriefInstructions(brief),
      "",
      "Square composition. Reads as ARTO at thumbnail size.",
    ].join("\n");
  }

  // Generic fallback.
  return [
    ARTO_STYLE_PREAMBLE,
    "",
    "TASK: Editorial square brand image for ARTO.",
    "",
    ...renderBriefInstructions(brief),
  ].join("\n");
}

export interface GenerateImageResult {
  image_url: string;
  image_prompt: string;
  cost_usd: number;
}

/* Generates an image via gpt-image-1, uploads it to Supabase Storage
 * bucket 'content-images', writes payload.image_url + payload.image_prompt
 * back into the row, and bumps content_items.cost_usd. Returns the public
 * URL + the exact prompt used + the marginal cost. Throws on any failure
 * — callers should try/catch.
 *
 * Why no side-effect-free split: every content_item has a stable id, and
 * the storage path is `<item_id>.png`, so this is idempotent — calling it
 * twice for the same item simply overwrites. Cost-tracking adds twice,
 * which is correct since each call really does cost $0.04. */
export async function generateAndStoreImage(
  sb: ReturnType<typeof createAdminClient>,
  args: {
    item_id: string;
    type: string;
    payload: Record<string, unknown>;
    size?: ImageSize;
    promptOverride?: string;
    /* If provided, overrides any image_brief already on the payload
     * (used by the drawer "Regenerar imagen" action with control changes). */
    briefOverride?: ImageBrief;
  },
): Promise<GenerateImageResult> {
  const { item_id, type, payload, size = "1024x1024", promptOverride, briefOverride } = args;

  if (!IMAGE_PRICING[size]) {
    throw new Error(`unsupported size: ${size}`);
  }

  /* Resolve the brief we'll persist alongside the image. Priority:
   * 1. briefOverride from caller (operator-edited drawer controls)
   * 2. payload.image_brief (set by the generator or a prior write)
   * 3. defaultBriefFor (deterministic per-topic fallback) */
  const effectivePayload: PayloadLike = { ...(payload as PayloadLike) };
  if (briefOverride) {
    effectivePayload.image_brief = briefOverride;
  } else if (!effectivePayload.image_brief) {
    effectivePayload.image_brief = defaultBriefFor(type, effectivePayload);
  }

  const prompt =
    (promptOverride ?? "").trim() ||
    buildArtoImagePrompt(type, effectivePayload);

  /* Two-tier provider strategy:
   *  1. Higgsfield via the Mac Mini service (ARTO_IMAGE_SERVICE_URL +
   *     shared bearer). Better quality models, no per-image USD cost
   *     because the credits live in Victor's Ultimate plan.
   *  2. OpenAI gpt-image-1 fallback (the original path) if the Mac Mini
   *     is unreachable, returns 5xx, or times out. Vercel-resident, $0.04
   *     per 1024x1024, always-on safety net.
   *
   * The provider that succeeds writes its result into payload.image_url
   * + payload.image_prompt and bumps cost_usd appropriately. */
  let pngBuffer: Buffer;
  let providerUsed: "higgsfield" | "openai" = "higgsfield";
  let costUsd = 0;
  const higgsUrl = process.env.ARTO_IMAGE_SERVICE_URL;
  const higgsSecret = process.env.ARTO_IMAGE_SHARED_SECRET;
  let higgsfieldImageUrl: string | undefined;

  if (higgsUrl && higgsSecret) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 90_000);
      const r = await fetch(`${higgsUrl.replace(/\/$/, "")}/generate-image`, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          Authorization: `Bearer ${higgsSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item_id, prompt }),
      }).finally(() => clearTimeout(timer));
      if (!r.ok) {
        const body = (await r.text()).slice(0, 200);
        throw new Error(`Mac Mini ${r.status}: ${body}`);
      }
      const data = await r.json();
      higgsfieldImageUrl = data?.image_url;
      if (!higgsfieldImageUrl) throw new Error("Mac Mini returned no image_url");
      // Mac Mini already uploaded to Supabase Storage at <item_id>.png.
      // We don't need to fetch the bytes; we just need to update the row
      // with the new payload. Skip the OpenAI branch entirely.
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Bubble down to OpenAI fallback. We log to console so the Vercel
      // build logs show the partial failure for debugging.
      console.warn(`[content-image] Higgsfield failed, falling back to OpenAI: ${msg}`);
      higgsfieldImageUrl = undefined;
    }
  }

  if (!higgsfieldImageUrl) {
    // OpenAI fallback path.
    providerUsed = "openai";
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY not configured and Mac Mini image service unavailable",
      );
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await openai.images.generate({
      model: MODEL,
      prompt,
      n: 1,
      size,
    });
    const b64 = result.data?.[0]?.b64_json;
    if (b64) {
      pngBuffer = Buffer.from(b64, "base64");
    } else {
      const url = result.data?.[0]?.url;
      if (!url) throw new Error("OpenAI returned no image data");
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Failed to download generated image: ${r.status}`);
      pngBuffer = Buffer.from(await r.arrayBuffer());
    }
    costUsd = IMAGE_PRICING[size];

    const sPath = `${item_id}.png`;
    const { error: uploadErr } = await sb.storage
      .from("content-images")
      .upload(sPath, pngBuffer, {
        contentType: "image/png",
        upsert: true,
      });
    if (uploadErr) throw new Error(`storage upload failed: ${uploadErr.message}`);
    const { data: publicData } = sb.storage.from("content-images").getPublicUrl(sPath);
    higgsfieldImageUrl = publicData.publicUrl;
  }

  const image_url = higgsfieldImageUrl;

  // Pull the current row so we can preserve other payload keys + bump cost.
  const { data: existing, error: fetchErr } = await sb
    .from("content_items")
    .select("payload, cost_usd")
    .eq("id", item_id)
    .maybeSingle();
  if (fetchErr) throw new Error(`fetch existing failed: ${fetchErr.message}`);

  const merged = {
    ...((existing?.payload as Record<string, unknown>) ?? payload),
    image_url,
    image_prompt: prompt,
    image_provider: providerUsed,
    image_brief: effectivePayload.image_brief,
  };
  const newCost = ((existing?.cost_usd as number | null) ?? 0) + costUsd;

  const { error: updErr } = await sb
    .from("content_items")
    .update({
      payload: merged,
      edited_by_human: false,
      cost_usd: newCost,
      updated_at: new Date().toISOString(),
    })
    .eq("id", item_id);
  if (updErr) throw new Error(`payload update failed: ${updErr.message}`);

  return { image_url, image_prompt: prompt, cost_usd: costUsd };
}
