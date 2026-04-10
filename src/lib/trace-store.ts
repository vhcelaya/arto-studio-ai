import { neon } from "@neondatabase/serverless";

export interface RoastTrace {
  id?: number;
  brand_name: string;
  industry: string;
  company_size: string | null;
  website_url: string | null;
  description: string | null;
  overall_score: number;
  strategy_score: number;
  creativity_score: number;
  narrative_score: number;
  digital_score: number;
  strategy_roast: string;
  creativity_roast: string;
  narrative_roast: string;
  digital_roast: string;
  verdict: string;
  improvements: string[];
  source: "ai" | "fallback";
  model: string;
  latency_ms: number;
  email: string | null;
  created_at?: string;
}

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

let schemaInitialized = false;

async function ensureSchema() {
  if (schemaInitialized) return true;

  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS roast_traces (
        id SERIAL PRIMARY KEY,
        brand_name TEXT NOT NULL,
        industry TEXT NOT NULL,
        company_size TEXT,
        website_url TEXT,
        description TEXT,
        overall_score REAL NOT NULL,
        strategy_score REAL NOT NULL,
        creativity_score REAL NOT NULL,
        narrative_score REAL NOT NULL,
        digital_score REAL NOT NULL,
        strategy_roast TEXT NOT NULL,
        creativity_roast TEXT NOT NULL,
        narrative_roast TEXT NOT NULL,
        digital_roast TEXT NOT NULL,
        verdict TEXT NOT NULL,
        improvements JSONB NOT NULL DEFAULT '[]',
        source TEXT NOT NULL DEFAULT 'fallback',
        model TEXT NOT NULL DEFAULT 'none',
        latency_ms INTEGER NOT NULL DEFAULT 0,
        email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    schemaInitialized = true;
    return true;
  } catch (error) {
    console.error("[trace-store] Failed to initialize schema:", error);
    return false;
  }
}

export async function saveTrace(trace: RoastTrace): Promise<boolean> {
  const ready = await ensureSchema();
  if (!ready) return false;

  const sql = getDb()!;

  try {
    await sql`
      INSERT INTO roast_traces (
        brand_name, industry, company_size, website_url, description,
        overall_score, strategy_score, creativity_score, narrative_score, digital_score,
        strategy_roast, creativity_roast, narrative_roast, digital_roast,
        verdict, improvements, source, model, latency_ms, email
      ) VALUES (
        ${trace.brand_name}, ${trace.industry}, ${trace.company_size},
        ${trace.website_url}, ${trace.description},
        ${trace.overall_score}, ${trace.strategy_score}, ${trace.creativity_score},
        ${trace.narrative_score}, ${trace.digital_score},
        ${trace.strategy_roast}, ${trace.creativity_roast},
        ${trace.narrative_roast}, ${trace.digital_roast},
        ${trace.verdict}, ${JSON.stringify(trace.improvements)},
        ${trace.source}, ${trace.model}, ${trace.latency_ms}, ${trace.email}
      )
    `;
    return true;
  } catch (error) {
    console.error("[trace-store] Failed to save trace:", error);
    return false;
  }
}

export async function getTraces(options?: {
  limit?: number;
  offset?: number;
  industry?: string;
}): Promise<RoastTrace[]> {
  const ready = await ensureSchema();
  if (!ready) return [];

  const sql = getDb()!;
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  try {
    if (options?.industry) {
      const rows = await sql`
        SELECT * FROM roast_traces
        WHERE industry = ${options.industry}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      return rows as RoastTrace[];
    }

    const rows = await sql`
      SELECT * FROM roast_traces
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return rows as RoastTrace[];
  } catch (error) {
    console.error("[trace-store] Failed to query traces:", error);
    return [];
  }
}

export async function getTraceStats(): Promise<{
  total: number;
  avgOverall: number;
  bySource: { ai: number; fallback: number };
  byIndustry: { industry: string; count: number; avgScore: number }[];
} | null> {
  const ready = await ensureSchema();
  if (!ready) return null;

  const sql = getDb()!;

  try {
    const [totals] = await sql`
      SELECT
        COUNT(*)::int as total,
        COALESCE(AVG(overall_score), 0) as avg_overall,
        COUNT(*) FILTER (WHERE source = 'ai')::int as ai_count,
        COUNT(*) FILTER (WHERE source = 'fallback')::int as fallback_count
      FROM roast_traces
    `;

    const byIndustry = await sql`
      SELECT
        industry,
        COUNT(*)::int as count,
        ROUND(AVG(overall_score)::numeric, 1) as avg_score
      FROM roast_traces
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 20
    `;

    return {
      total: totals.total,
      avgOverall: Math.round(totals.avg_overall * 10) / 10,
      bySource: { ai: totals.ai_count, fallback: totals.fallback_count },
      byIndustry: byIndustry as { industry: string; count: number; avgScore: number }[],
    };
  } catch (error) {
    console.error("[trace-store] Failed to get stats:", error);
    return null;
  }
}
