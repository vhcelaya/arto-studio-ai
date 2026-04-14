import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

/**
 * Client management + API key persistence for ARTO Studio AI.
 * Clients hold the API keys that unlock gated skills.
 * Brand Roast is public (no client required).
 */

export interface Client {
  id: string;
  name: string;
  email: string;
  api_key_prefix: string; // first 8 chars of raw key, for display only
  tier: "trial" | "agency" | "enterprise" | "internal";
  allowed_skills: string[]; // slugs or ["*"] for all
  rate_limit_per_hour: number;
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
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_hash ON clients (api_key_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_active ON clients (active)`;
    schemaInitialized = true;
    return true;
  } catch (error) {
    console.error("[clients/store] Failed to init schema:", error);
    return false;
  }
}

export async function createClient(params: {
  name: string;
  email: string;
  tier?: Client["tier"];
  allowed_skills?: string[];
  rate_limit_per_hour?: number;
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
        tier, allowed_skills, rate_limit_per_hour, notes
      ) VALUES (
        ${params.name}, ${params.email}, ${hash}, ${prefix},
        ${params.tier ?? "trial"},
        ${JSON.stringify(params.allowed_skills ?? ["*"])},
        ${params.rate_limit_per_hour ?? 100},
        ${params.notes ?? null}
      )
      RETURNING id, name, email, api_key_prefix, tier, allowed_skills,
                rate_limit_per_hour, active, notes, created_at
    `;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      api_key_prefix: row.api_key_prefix,
      tier: row.tier,
      allowed_skills: row.allowed_skills,
      rate_limit_per_hour: row.rate_limit_per_hour,
      active: row.active,
      notes: row.notes,
      created_at: row.created_at,
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
             rate_limit_per_hour, active, notes, created_at
      FROM clients
      WHERE api_key_hash = ${hash} AND active = TRUE
      LIMIT 1
    `;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      api_key_prefix: row.api_key_prefix,
      tier: row.tier,
      allowed_skills: row.allowed_skills,
      rate_limit_per_hour: row.rate_limit_per_hour,
      active: row.active,
      notes: row.notes,
      created_at: row.created_at,
    };
  } catch (error) {
    console.error("[clients/store] verifyApiKey failed:", error);
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
             rate_limit_per_hour, active, notes, created_at
      FROM clients
      ORDER BY created_at DESC
    `;
    return rows as unknown as Client[];
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
  updates: Partial<Pick<Client, "name" | "email" | "tier" | "allowed_skills" | "rate_limit_per_hour" | "active" | "notes">>
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
    if (updates.active !== undefined) await sql`UPDATE clients SET active = ${updates.active} WHERE id = ${id}`;
    if (updates.notes !== undefined) await sql`UPDATE clients SET notes = ${updates.notes} WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error("[clients/store] updateClient failed:", error);
    return false;
  }
}
