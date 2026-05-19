import postgres from "postgres";

/**
 * Engine table read helpers for /admin/engine/* views.
 * Schema lives in asai-engine/migrations/001_engine.sql.
 * All queries hit the same Supabase Postgres as clients + traces.
 */

let cached: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  cached = postgres(url, { ssl: "require", max: 5, prepare: false });
  return cached;
}

/* ───────────────────────────── outreach_targets ───────────────────────────── */

export interface OutreachTarget {
  id: string;
  email: string | null;
  name: string | null;
  company: string | null;
  vertical: string | null;
  country: string | null;
  language: "en" | "es";
  source: string;
  profile_url: string | null;
  legitimate_interest_score: number | null;
  legitimate_interest_reasoning: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  qualified_at: string | null;
  last_contacted_at: string | null;
}

export interface TargetsStats {
  total: number;
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
  byLanguage: { language: string; count: number }[];
  byCountry: { country: string | null; count: number }[];
}

export async function getTargetsStats(): Promise<TargetsStats | null> {
  const sql = getDb();
  if (!sql) return null;
  try {
    const [totalRow] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM outreach_targets
    `;
    const byStatus = await sql<{ status: string; count: string }[]>`
      SELECT status, COUNT(*)::text AS count
      FROM outreach_targets
      GROUP BY status
      ORDER BY COUNT(*) DESC
    `;
    const bySource = await sql<{ source: string; count: string }[]>`
      SELECT source, COUNT(*)::text AS count
      FROM outreach_targets
      GROUP BY source
      ORDER BY COUNT(*) DESC
    `;
    const byLanguage = await sql<{ language: string; count: string }[]>`
      SELECT language, COUNT(*)::text AS count
      FROM outreach_targets
      GROUP BY language
      ORDER BY COUNT(*) DESC
    `;
    const byCountry = await sql<{ country: string | null; count: string }[]>`
      SELECT country, COUNT(*)::text AS count
      FROM outreach_targets
      GROUP BY country
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `;
    return {
      total: Number(totalRow?.count ?? 0),
      byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
      bySource: bySource.map((r) => ({ source: r.source, count: Number(r.count) })),
      byLanguage: byLanguage.map((r) => ({ language: r.language, count: Number(r.count) })),
      byCountry: byCountry.map((r) => ({ country: r.country, count: Number(r.count) })),
    };
  } catch (error) {
    console.error("[engine-store] getTargetsStats failed:", error);
    return null;
  }
}

export async function getTargets(options?: {
  status?: string;
  source?: string;
  language?: string;
  country?: string;
  limit?: number;
  offset?: number;
}): Promise<OutreachTarget[]> {
  const sql = getDb();
  if (!sql) return [];
  const limit = Math.min(options?.limit ?? 50, 200);
  const offset = Math.max(options?.offset ?? 0, 0);

  const filters: string[] = [];
  const values: unknown[] = [];
  function add(clause: string, value: unknown) {
    values.push(value);
    filters.push(clause.replace("$$", `$${values.length}`));
  }
  if (options?.status) add("status = $$", options.status);
  if (options?.source) add("source = $$", options.source);
  if (options?.language) add("language = $$", options.language);
  if (options?.country) add("country = $$", options.country);

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const rows = await sql.unsafe<OutreachTarget[]>(
      `SELECT * FROM outreach_targets ${where}
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      values as never[]
    );
    return rows;
  } catch (error) {
    console.error("[engine-store] getTargets failed:", error);
    return [];
  }
}

/* ───────────────────────────── engine_runs ───────────────────────────── */

export interface EngineRun {
  id: string;
  module: string;
  run_type: string;
  status: string;
  summary: Record<string, unknown>;
  items_processed: number;
  items_succeeded: number;
  items_failed: number;
  cost_usd: number;
  tokens_input: number;
  tokens_output: number;
  duration_ms: number | null;
  error_message: string | null;
  session_id: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface RunsStats {
  total: number;
  byModule: { module: string; count: number; total_cost: number }[];
  byStatus: { status: string; count: number }[];
  last24hCost: number;
  last24hRuns: number;
}

export async function getRunsStats(): Promise<RunsStats | null> {
  const sql = getDb();
  if (!sql) return null;
  try {
    const [totalRow] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM engine_runs
    `;
    const byModule = await sql<{ module: string; count: string; total_cost: string | null }[]>`
      SELECT module, COUNT(*)::text AS count, COALESCE(SUM(cost_usd), 0)::text AS total_cost
      FROM engine_runs
      GROUP BY module
      ORDER BY COUNT(*) DESC
    `;
    const byStatus = await sql<{ status: string; count: string }[]>`
      SELECT status, COUNT(*)::text AS count
      FROM engine_runs
      GROUP BY status
      ORDER BY COUNT(*) DESC
    `;
    const [last24h] = await sql<{ count: string; total_cost: string | null }[]>`
      SELECT
        COUNT(*)::text AS count,
        COALESCE(SUM(cost_usd), 0)::text AS total_cost
      FROM engine_runs
      WHERE started_at > NOW() - INTERVAL '24 hours'
    `;
    return {
      total: Number(totalRow?.count ?? 0),
      byModule: byModule.map((r) => ({
        module: r.module,
        count: Number(r.count),
        total_cost: Number(r.total_cost ?? 0),
      })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
      last24hRuns: Number(last24h?.count ?? 0),
      last24hCost: Number(last24h?.total_cost ?? 0),
    };
  } catch (error) {
    console.error("[engine-store] getRunsStats failed:", error);
    return null;
  }
}

export async function getRuns(options?: {
  module?: string;
  status?: string;
  run_type?: string;
  limit?: number;
  offset?: number;
}): Promise<EngineRun[]> {
  const sql = getDb();
  if (!sql) return [];
  const limit = Math.min(options?.limit ?? 50, 200);
  const offset = Math.max(options?.offset ?? 0, 0);

  const filters: string[] = [];
  const values: unknown[] = [];
  function add(clause: string, value: unknown) {
    values.push(value);
    filters.push(clause.replace("$$", `$${values.length}`));
  }
  if (options?.module) add("module = $$", options.module);
  if (options?.status) add("status = $$", options.status);
  if (options?.run_type) add("run_type = $$", options.run_type);

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const rows = await sql.unsafe<EngineRun[]>(
      `SELECT * FROM engine_runs ${where}
       ORDER BY started_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      values as never[]
    );
    return rows;
  } catch (error) {
    console.error("[engine-store] getRuns failed:", error);
    return [];
  }
}

/* ───────────────────────────── engine_signals ───────────────────────────── */

export interface EngineSignal {
  id: string;
  signal_type: string;
  severity: "info" | "warning" | "critical";
  module: string | null;
  payload: Record<string, unknown>;
  message: string | null;
  active: boolean;
  snoozed_until: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface SignalsStats {
  total: number;
  active: number;
  byType: { signal_type: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
}

export async function getSignalsStats(): Promise<SignalsStats | null> {
  const sql = getDb();
  if (!sql) return null;
  try {
    const [totalRow] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM engine_signals
    `;
    const [activeRow] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM engine_signals
      WHERE active = true AND resolved_at IS NULL
    `;
    const byType = await sql<{ signal_type: string; count: string }[]>`
      SELECT signal_type, COUNT(*)::text AS count
      FROM engine_signals
      WHERE active = true
      GROUP BY signal_type
      ORDER BY COUNT(*) DESC
    `;
    const bySeverity = await sql<{ severity: string; count: string }[]>`
      SELECT severity, COUNT(*)::text AS count
      FROM engine_signals
      WHERE active = true
      GROUP BY severity
      ORDER BY COUNT(*) DESC
    `;
    return {
      total: Number(totalRow?.count ?? 0),
      active: Number(activeRow?.count ?? 0),
      byType: byType.map((r) => ({ signal_type: r.signal_type, count: Number(r.count) })),
      bySeverity: bySeverity.map((r) => ({ severity: r.severity, count: Number(r.count) })),
    };
  } catch (error) {
    console.error("[engine-store] getSignalsStats failed:", error);
    return null;
  }
}

export async function getSignals(options?: {
  active?: boolean;
  severity?: string;
  signal_type?: string;
  module?: string;
  limit?: number;
  offset?: number;
}): Promise<EngineSignal[]> {
  const sql = getDb();
  if (!sql) return [];
  const limit = Math.min(options?.limit ?? 50, 200);
  const offset = Math.max(options?.offset ?? 0, 0);

  const filters: string[] = [];
  const values: unknown[] = [];
  function add(clause: string, value: unknown) {
    values.push(value);
    filters.push(clause.replace("$$", `$${values.length}`));
  }
  if (options?.active !== undefined) add("active = $$", options.active);
  if (options?.severity) add("severity = $$", options.severity);
  if (options?.signal_type) add("signal_type = $$", options.signal_type);
  if (options?.module) add("module = $$", options.module);

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const rows = await sql.unsafe<EngineSignal[]>(
      `SELECT * FROM engine_signals ${where}
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      values as never[]
    );
    return rows;
  } catch (error) {
    console.error("[engine-store] getSignals failed:", error);
    return [];
  }
}

export async function resolveSignal(id: string, resolvedBy: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;
  try {
    await sql`
      UPDATE engine_signals
      SET active = false,
          resolved_at = NOW(),
          resolved_by = ${resolvedBy}
      WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    console.error("[engine-store] resolveSignal failed:", error);
    return false;
  }
}
