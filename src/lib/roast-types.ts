export interface RoastResult {
  overall: number;
  strategy: { score: number; roast: string };
  creativity: { score: number; roast: string };
  narrative: { score: number; roast: string };
  digital: { score: number; roast: string };
  verdict: string;
  improvements: string[];
}

export interface RoastRequest {
  brandName: string;
  websiteUrl?: string;
  industry: string;
  companySize?: string;
  description?: string;
}

export interface RoastResponse {
  source: "ai" | "fallback";
  result: RoastResult;
}
