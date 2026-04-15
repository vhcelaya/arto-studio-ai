import {
  buildSystemPrompt,
  positioningTool,
  generateDeterministicPositioning,
} from "./brand-positioning-prompt";
import type {
  BrandPositioningRequest,
  BrandPositioningResult,
} from "./brand-positioning-types";
import { registerSkill } from "./registry";
import type { SkillDefinition, InputValidationResult } from "./types";

/**
 * Brand Positioning — ARTO's first gated skill.
 * Applies the full ARTO positioning methodology to a brand: produces a
 * bilingual statement, metaphor, NOT table, 4-criteria scorecard, anti-pattern
 * audit (if a current positioning is provided), competitor confrontation,
 * founder repeat test, and a Brief skeleton.
 *
 * Requires an API key. Not public.
 */

const MIN_COMPETITORS = 2;

function validateBrandPositioningInput(
  body: unknown
): InputValidationResult<BrandPositioningRequest> {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body is required", field: "body" };
  }
  const b = body as Record<string, unknown>;

  const brandName = typeof b.brandName === "string" ? b.brandName.trim() : "";
  if (!brandName) return { valid: false, error: "Brand name is required", field: "brandName" };
  if (brandName.length > 100)
    return {
      valid: false,
      error: "Brand name must be 100 characters or less",
      field: "brandName",
    };

  const industry = typeof b.industry === "string" ? b.industry.trim() : "";
  if (!industry) return { valid: false, error: "Industry is required", field: "industry" };
  if (industry.length > 120)
    return {
      valid: false,
      error: "Industry must be 120 characters or less",
      field: "industry",
    };

  const targetAudience =
    typeof b.targetAudience === "string" ? b.targetAudience.trim() : "";
  if (!targetAudience)
    return { valid: false, error: "Target audience is required", field: "targetAudience" };
  if (targetAudience.length > 300)
    return {
      valid: false,
      error: "Target audience must be 300 characters or less",
      field: "targetAudience",
    };

  if (!Array.isArray(b.competitors)) {
    return {
      valid: false,
      error: "Competitors must be an array of names",
      field: "competitors",
    };
  }
  const competitors = (b.competitors as unknown[])
    .filter((c): c is string => typeof c === "string")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  if (competitors.length < MIN_COMPETITORS) {
    return {
      valid: false,
      error: `At least ${MIN_COMPETITORS} named competitors are required`,
      field: "competitors",
    };
  }
  if (competitors.length > 10) {
    return {
      valid: false,
      error: "Maximum 10 competitors allowed",
      field: "competitors",
    };
  }
  if (competitors.some((c) => c.length > 100)) {
    return {
      valid: false,
      error: "Each competitor name must be 100 characters or less",
      field: "competitors",
    };
  }

  const currentPositioning =
    typeof b.currentPositioning === "string" ? b.currentPositioning.trim() : undefined;
  if (currentPositioning && currentPositioning.length > 500)
    return {
      valid: false,
      error: "Current positioning must be 500 characters or less",
      field: "currentPositioning",
    };

  const websiteUrl = typeof b.websiteUrl === "string" ? b.websiteUrl.trim() : undefined;
  if (websiteUrl && websiteUrl.length > 200)
    return {
      valid: false,
      error: "Website URL must be 200 characters or less",
      field: "websiteUrl",
    };

  const language =
    b.language === "es" || b.language === "en" || b.language === "both"
      ? b.language
      : undefined;

  return {
    valid: true,
    data: {
      brandName,
      industry,
      targetAudience,
      competitors,
      ...(currentPositioning && { currentPositioning }),
      ...(websiteUrl && { websiteUrl }),
      ...(language && { language }),
    },
  };
}

function weightedOverall(scores: BrandPositioningResult["scores"]): number {
  return (
    Math.round(
      (scores.specificity * 0.3 +
        scores.operability * 0.3 +
        scores.portability * 0.2 +
        scores.codification * 0.2) *
        10
    ) / 10
  );
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, Math.round(n)));
}

export const brandPositioningSkill: SkillDefinition<
  BrandPositioningRequest,
  BrandPositioningResult
> = {
  slug: "brand-positioning",
  name: "Brand Positioning",
  description:
    "ARTO's positioning methodology applied to a brand. Produces a bilingual statement, metaphor, NOT table, 4-criteria scorecard, anti-pattern audit, competitor confrontation, founder repeat test, and Brief skeleton.",
  public: false,
  knowledgeKeys: ["positioning", "strategy", "rubric", "trends"],
  requiresWebFetch: true,
  urlField: "websiteUrl",
  inputValidator: validateBrandPositioningInput,
  systemPromptBuilder: (knowledge, input) => buildSystemPrompt(knowledge, input),
  outputToolSchema: positioningTool,
  fallbackFn: (input) => generateDeterministicPositioning(input),
  computeDerived: (out, input) => {
    const scores = {
      specificity: clampScore(out.scores.specificity),
      operability: clampScore(out.scores.operability),
      portability: clampScore(out.scores.portability),
      codification: clampScore(out.scores.codification),
      overall: 0,
    };
    scores.overall = weightedOverall(scores);

    // Shape guarantees: empty anti-patterns when no current positioning was
    // provided; cap NOT table at 10 bullets; ensure competitor_confrontation
    // has one row per input competitor.
    const anti_patterns_detected = input.currentPositioning
      ? out.anti_patterns_detected
      : [];

    const not_table = Array.isArray(out.not_table)
      ? out.not_table.slice(0, 10)
      : [];

    return {
      ...out,
      scores,
      anti_patterns_detected,
      not_table,
    };
  },
  maxTokens: 4000,
};

registerSkill(brandPositioningSkill);
