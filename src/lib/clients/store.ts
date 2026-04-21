import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

/**
 * Client management + API key persistence for ARTO Studio AI.
 * Clients hold the API keys that unlock gated skills.
 * Brand Roast is public (no client required).
 */

export type ClientTier = "trial" | "starter" | "agency" | "enterprise" | "internal";

export const CLIENT_TIERS: ClientTier[] = [
  "trial",
  "starter",
  "agency",
  "enterprise",
  "internal",
];

export interface Client {
  id: string;
  name: string;
  email: string;
  api_key_prefix: string; // first 8 chars of raw key, for display only
  tier: ClientTier;
  allowed_skills: string[]; // slugs or ["*"] for all
  rate_limit_per_hour: number;
  /**
   * Total lifetime calls allowed on gated skills. NULL = unlimited.
   * Used for trial clients: typically set to 5 on signup.
   */
  trial_calls_limit: number | null;
  /** Lifetime count of gated-skill calls this client has made. */
  trial_calls_used: number;
  active: boolean;
  notes: string | null;
  created_at?: string;
}

export interface ClientWithSecret extends Client {
  api_key: string; // raw — only returned once on creation
}

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

function getSalt() {
  return process.env.ARTO_API_KEY_SALT || "arto-dev-salt-v1-change-me";
}

function hashKey(rawKey: string): string {
  return crypto
    .createHmac("sha256", getSalt())
    .update(rawKey)
    .digest("hex");
}

function generateApiKey(): { raw: string; prefix: string } {
  const bytes = crypto.randomBytes(24).toString("base64url");
  const raw = `arto_live_${bytes}`;
  const prefix = raw.slice(0, 14); // "arto_live_XXXX"
  return { raw, prefix };
}

let schemaInitialized = false;

async function ensureSchema() {
  if (schemaInitialized) return true;

  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        api_key_hash TEXT NOT NULL UNIQUE,
        api_key_prefix TEXT NOT NULL,
        tier TEXT NOT NULL DEFAULT 'trial',
        allowed_skills JSONB NOT NULL DEFAULT '["*"]',
        rate_limit_per_hour INTEGER NOT NULL DEFAULT 100,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    // Session 6 additions — idempotent migrations.
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS trial_calls_limit INTEGER`;
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS trial_calls_used INTEGER NOT NULL DEFAULT 0`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_hash ON clients (api_key_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_active ON clients (active)`;
    schemaInitialized = true;
    return true;
  } catch (error) {
    console.error("[clients/store] Failed to init schema:", error);
    return false;
  }
}

function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    api_key_prefix: row.api_key_prefix as string,
    tier: row.tier as ClientTier,
    allowed_skills: row.allowed_skills as string[],
    rate_limit_per_hour: row.rate_limit_per_hour as number,
    trial_calls_limit:
      row.trial_calls_limit === null || row.trial_calls_limit === undefined
        ? null
        : (row.trial_calls_limit as number),
    trial_calls_used: (row.trial_calls_used as number) ?? 0,
    active: row.active as boolean,
    notes: (row.notes as string | null) ?? null,
    created_at: row.created_at as string | undefined,
  };
}

export async function createClient(params: {
  name: string;
  email: string;
  tier?: ClientTier;
  allowed_skills?: string[];
  rate_limit_per_hour?: number;
  trial_calls_limit?: number | null;
  notes?: string;
}): Promise<ClientWithSecret | null> {
  const ready = await ensureSchema();
  if (!ready) return null;

  const sql = getDb()!;
  const { raw, prefix } = generateApiKey();
  const hash = hashKey(raw);

  try {
    const [row] = await sql`
      INSERT INTO clients (
        name, email, api_key_hash, api_key_prefix,
        tier, allowed_skills, rate_limit_per_hour, trial_calls_limit, notes
      ) VALUES (
        ${params.name}, ${params.email}, ${hash}, ${prefix},
        ${params.tier ?? "trial"},
        ${JSON.stringify(params.allowed_skills ?? ["*"])},
        ${params.rate_limit_per_hour ?? 100},
        ${params.trial_calls_limit ?? null},
        ${params.notes ?? null}
      )
      RETURNING id, name, email, api_key_prefix, tier, allowed_skills,
                rate_limit_per_hour, trial_calls_limit, trial_calls_used,
                active, notes, created_at
    `;

    return {
      ...rowToClient(row),
      api_key: raw,
    };
  } catch (error) {
    console.error("[clients/store] createClient failed:", error);
    return null;
  }
}

export async function verifyApiKey(rawKey: string): Promise<Client | null> {
  if (!rawKey || !rawKey.startsWith("arto_live_")) return null;

  const ready = await ensureSchema();
  if (!ready) return null;

  const sql = getDb()!;
  const hash = hashKey(rawKey);

  try {
    const [row] = await sql`
      SELECT id, name, email, api_key_prefix, tier, allowed_skills,
             rate_limit_per_hour, trial_calls_limit, trial_calls_used,
             active, notes, created_at
      FROM clients
      WHERE api_key_hash = ${hash} AND active = TRUE
      LIMIT 1
    `;
    if (!row) return null;
    return rowToClient(row);
  } catch (error) {
    console.error("[clients/store] verifyApiKey failed:", error);
    return null;
  }
}

export async function getClientById(id: string): Promise<Client | null> {
  const ready = await ensureSchema();
  if (!ready) return null;
  const sql = getDb()!;
  try {
    const [row] = await sql`
      SELECT id, name, email, api_key_prefix, tier, allowed_skills,
             rate_limit_per_hour, trial_calls_limit, trial_calls_used,
             active, notes, created_at
      FROM clients
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!row) return null;
    return rowToClient(row);
  } catch (error) {
    console.error("[clients/store] getClientById failed:", error);
    return null;
  }
}

export async function listClients(): Promise<Client[]> {
  const ready = await ensureSchema();
  if (!ready) return [];

  const sql = getDb()!;
  try {
    const rows = await sql`
      SELECT id, name, email, api_key_prefix, tier, allowed_skills,
             rate_limit_per_hour, trial_calls_limit, trial_calls_used,
             active, notes, created_at
      FROM clients
      ORDER BY created_at DESC
    `;
    return rows.map((r) => rowToClient(r as Record<string, unknown>));
  } catch (error) {
    console.error("[clients/store] listClients failed:", error);
    return [];
  }
}

export async function revokeClient(id: string): Promise<boolean> {
  const ready = await ensureSchema();
  if (!ready) return false;

  const sql = getDb()!;
  try {
    await sql`UPDATE clients SET active = FALSE WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error("[clients/store] revokeClient failed:", error);
    return false;
  }
}

export async function updateClient(
  id: string,
  updates: Partial<
    Pick<
      Client,
      | "name"
      | "email"
      | "tier"
      | "allowed_skills"
      | "rate_limit_per_hour"
      | "trial_calls_limit"
      | "trial_calls_used"
      | "active"
      | "notes"
    >
  >
): Promise<boolean> {
  const ready = await ensureSchema();
  if (!ready) return false;

  const sql = getDb()!;
  try {
    // Neon serverless doesn't support dynamic SET clauses nicely; do per-field
    if (updates.name !== undefined) await sql`UPDATE clients SET name = ${updates.name} WHERE id = ${id}`;
    if (updates.email !== undefined) await sql`UPDATE clients SET email = ${updates.email} WHERE id = ${id}`;
    if (updates.tier !== undefined) await sql`UPDATE clients SET tier = ${updates.tier} WHERE id = ${id}`;
    if (updates.allowed_skills !== undefined)
      await sql`UPDATE clients SET allowed_skills = ${JSON.stringify(updates.allowed_skills)} WHERE id = ${id}`;
    if (updates.rate_limit_per_hour !== undefined)
      await sql`UPDATE clients SET rate_limit_per_hour = ${updates.rate_limit_per_hour} WHERE id = ${id}`;
    if (updates.trial_calls_limit !== undefined)
      await sql`UPDATE clients SET trial_calls_limit = ${updates.trial_calls_limit} WHERE id = ${id}`;
    if (updates.trial_calls_used !== undefined)
      await sql`UPDATE clients SET trial_calls_used = ${updates.trial_calls_used} WHERE id = ${id}`;
    if (updates.active !== undefined) await sql`UPDATE clients SET active = ${updates.active} WHERE id = ${id}`;
    if (updates.notes !== undefined) await sql`UPDATE clients SET notes = ${updates.notes} WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error("[clients/store] updateClient failed:", error);
    return false;
  }
}

/**
 * Atomically increment trial_calls_used for a client. Returns the new value,
 * or null on failure. Used by the skills engine after a successful gated call.
 */
export async function incrementTrialCallsUsed(id: string): Promise<number | null> {
  const ready = await ensureSchema();
  if (!ready) return null;

  const sql = getDb()!;
  try {
    const [row] = await sql`
      UPDATE clients
      SET trial_calls_used = trial_calls_used + 1
      WHERE id = ${id}
      RETURNING trial_calls_used
    `;
    return row ? (row.trial_calls_used as number) : null;
  } catch (error) {
    console.error("[clients/store] incrementTrialCallsUsed failed:", error);
    return null;
  }
}
