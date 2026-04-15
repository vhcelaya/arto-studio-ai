/**
 * Types for the `brand-positioning` skill.
 *
 * Input: the brand, its industry, target audience, a short list of named
 * competitors, and optionally the brand's current positioning statement.
 * Output: ARTO's structured positioning response — spine statement in ES/EN,
 * metaphor, NOT table, 4-criteria scorecard, anti-patterns (if applicable),
 * competitor confrontation, founder repeat test, and a Brief skeleton.
 */

export interface BrandPositioningRequest {
  brandName: string;
  industry: string;
  targetAudience: string;
  competitors: string[];
  currentPositioning?: string;
  websiteUrl?: string;
  language?: "es" | "en" | "both";
}

export interface PositioningStatement {
  es: string;
  en: string;
}

export interface PositioningMetaphor {
  x_of_y: string;
  rationale: string;
}

export interface PositioningScores {
  specificity: number;
  operability: number;
  portability: number;
  codification: number;
  overall: number;
}

export interface AntiPatternHit {
  pattern: string;
  evidence: string;
}

export interface CompetitorConfrontation {
  competitor: string;
  their_angle: string;
  our_wedge: string;
}

export interface BriefSkeleton {
  contexto: string;
  objetivo: string;
  concepto_estrategico: string;
  target_insight: string;
  posicionamiento: string;
  diferenciadores_clave: string[];
}

export interface BrandPositioningResult {
  proposed_statement: PositioningStatement;
  metaphor: PositioningMetaphor;
  not_table: string[];
  scores: PositioningScores;
  anti_patterns_detected: AntiPatternHit[];
  competitor_confrontation: CompetitorConfrontation[];
  founder_repeat_test: string;
  brief_skeleton: BriefSkeleton;
  verdict: string;
}
