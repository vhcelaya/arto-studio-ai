/* ARTO brand voice helpers.
 *
 * The Content Factory generator embeds the voice rules in its system
 * prompt, but model output isn't 100% obedient and operators can edit
 * payloads by hand or call the publisher with externally-authored copy.
 * So the rules are also enforced at the data layer via this module —
 * defense in depth.
 *
 * Two operations:
 *   - `scrubDashes(s)`: replace em-dashes (—) and en-dashes (–) used as
 *     em-dashes with ASCII punctuation (sentence break when spaced,
 *     comma when hugging a word). Cleanup of accidental `,.` artifacts.
 *   - `hasAntithesisPattern(s)`: detect "Not X. It is Y." / "No es X. Es
 *     Y." style AI-tell rhythms. Returns true if any pattern matches.
 *     Auto-fixing is too risky; callers reject offending items.
 *
 * Plus a high-level helper for content_items payloads:
 *   - `applyVoiceScrub(type, items)`: iterate over the text fields of
 *     each payload (per content-item type), scrub dashes, reject items
 *     with antithesis. Used by /api/admin/content/generate after dedup.
 *
 * And a low-level helper for the publisher:
 *   - `scrubCopy(s)`: scrub dashes on a single piece of copy without
 *     antithesis detection. Used by the social publisher right before
 *     sending text to Buffer so even hand-edited copy lands clean. */

export const ANTITHESIS_PATTERNS: RegExp[] = [
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
export function scrubDashes(s: string): { out: string; touched: boolean } {
  if (!s) return { out: s, touched: false };
  const original = s;
  let out = s.replace(/\s+—\s+/g, ". ");
  out = out.replace(/—/g, ", ");
  out = out.replace(/\s+–\s+/g, ". ");
  out = out.replace(/–/g, ", ");
  out = out.replace(/,\s*\./g, ".").replace(/\.{2,}/g, ".");
  return { out, touched: out !== original };
}

/* Convenience: just return the scrubbed string. No-op for falsy / non-string
 * input so callers can pass `payload.copy` without pre-validating. */
export function scrubCopy(s: unknown): string {
  if (typeof s !== "string" || !s) return typeof s === "string" ? s : "";
  return scrubDashes(s).out;
}

export function hasAntithesisPattern(s: unknown): string | null {
  if (typeof s !== "string" || !s) return null;
  for (const re of ANTITHESIS_PATTERNS) {
    if (re.test(s)) return s.slice(0, 80);
  }
  return null;
}

/* Per-type field allowlist. Anything not listed is left untouched. For
 * social_post we walk into nested per-network objects too — see
 * SOCIAL_NETWORK_KEYS. */
export const PAYLOAD_TEXT_KEYS: Record<string, string[]> = {
  prompt: ["title_en", "title_es", "body_en", "body_es", "use_case", "expected_output"],
  blog_post: [
    "title_en", "title_es", "meta_description_en", "meta_description_es",
    "hero_en", "hero_es", "intro_en", "intro_es", "body_en", "body_es",
  ],
  social_post: ["cta_text", "hook", "copy"],
};

/* social_post payloads may be either the new shape (one object per
 * network: { linkedin: {hook, copy}, instagram: {...}, facebook: {...} })
 * or the legacy shape (single top-level { hook, copy, network }). The
 * scrubber handles both. */
const SOCIAL_NETWORK_KEYS = ["linkedin", "instagram", "facebook"] as const;
const SOCIAL_NETWORK_TEXT_KEYS = ["hook", "copy"] as const;

export interface VoiceResult {
  kept: Record<string, unknown>[];
  rejected: Array<{ payload: Record<string, unknown>; reason: string }>;
  fixes: number;
}

export function applyVoiceScrub(
  type: string,
  items: Record<string, unknown>[],
): VoiceResult {
  const out: VoiceResult = { kept: [], rejected: [], fixes: 0 };
  for (const raw of items) {
    const keys = PAYLOAD_TEXT_KEYS[type] ?? Object.keys(raw).filter((k) => typeof raw[k] === "string");
    let antithesisHit: string | null = null;
    const fixed: Record<string, unknown> = { ...raw };

    // Top-level text fields.
    for (const k of keys) {
      const v = raw[k];
      if (typeof v !== "string") continue;
      const sample = hasAntithesisPattern(v);
      if (sample) {
        antithesisHit = `field '${k}' uses an antithesis anti-pattern: "${sample}..."`;
        break;
      }
      const { out: scrubbed, touched } = scrubDashes(v);
      if (touched) {
        fixed[k] = scrubbed;
        out.fixes += 1;
      }
    }

    // Nested per-network text fields for social_post.
    if (!antithesisHit && type === "social_post") {
      for (const net of SOCIAL_NETWORK_KEYS) {
        const sub = raw[net];
        if (!sub || typeof sub !== "object") continue;
        const subRaw = sub as Record<string, unknown>;
        const subFixed: Record<string, unknown> = { ...subRaw };
        for (const k of SOCIAL_NETWORK_TEXT_KEYS) {
          const v = subRaw[k];
          if (typeof v !== "string") continue;
          const sample = hasAntithesisPattern(v);
          if (sample) {
            antithesisHit = `field '${net}.${k}' uses an antithesis anti-pattern: "${sample}..."`;
            break;
          }
          const { out: scrubbed, touched } = scrubDashes(v);
          if (touched) {
            subFixed[k] = scrubbed;
            out.fixes += 1;
          }
        }
        if (antithesisHit) break;
        fixed[net] = subFixed;
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
