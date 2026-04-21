import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import { isAdminAuthorized } from "@/lib/auth";
import {
  createClient,
  listClients,
  revokeClient,
  updateClient,
  type Client,
} from "@/lib/clients/store";

// Load .env.local explicitly (workaround for Next.js 16 Turbopack env loading)
config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

export const maxDuration = 30;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/* ── GET /api/admin/clients ─ list all clients ─────────── */

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) return unauthorized();

  const clients = await listClients();
  return NextResponse.json({ clients });
}

/* ── POST /api/admin/clients ─ create a new client ─────── */

interface CreateBody {
  name?: unknown;
  email?: unknown;
  tier?: unknown;
  allowed_skills?: unknown;
  rate_limit_per_hour?: unknown;
  trial_calls_limit?: unknown;
  notes?: unknown;
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) return unauthorized();

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!name || !email) {
    return NextResponse.json(
      { error: "name and email are required" },
      { status: 400 }
    );
  }

  const tier =
    typeof body.tier === "string" &&
    ["trial", "starter", "agency", "enterprise", "internal"].includes(body.tier)
      ? (body.tier as Client["tier"])
      : "trial";

  const allowed_skills = Array.isArray(body.allowed_skills)
    ? (body.allowed_skills as unknown[]).filter((s): s is string => typeof s === "string")
    : ["*"];

  const rate_limit_per_hour =
    typeof body.rate_limit_per_hour === "number" && body.rate_limit_per_hour > 0
      ? Math.floor(body.rate_limit_per_hour)
      : 100;

  const notes = typeof body.notes === "string" ? body.notes : undefined;

  const trial_calls_limit =
    typeof body.trial_calls_limit === "number" && body.trial_calls_limit > 0
      ? Math.floor(body.trial_calls_limit)
      : body.trial_calls_limit === null
        ? null
        : undefined;

  const created = await createClient({
    name,
    email,
    tier,
    allowed_skills,
    rate_limit_per_hour,
    ...(trial_calls_limit !== undefined && { trial_calls_limit }),
    notes,
  });

  if (!created) {
    return NextResponse.json(
      { error: "Failed to create client. Is DATABASE_URL configured?" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      client: created,
      message:
        "Client created. Store the api_key securely — it will NOT be shown again.",
    },
    { status: 201 }
  );
}

/* ── PATCH /api/admin/clients?id=... ─ update a client ── */

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthorized(request)) return unauthorized();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Query param 'id' is required" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Parameters<typeof updateClient>[1] = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.email === "string") updates.email = body.email;
  if (
    typeof body.tier === "string" &&
    ["trial", "starter", "agency", "enterprise", "internal"].includes(body.tier)
  ) {
    updates.tier = body.tier as Client["tier"];
  }
  if (Array.isArray(body.allowed_skills)) {
    updates.allowed_skills = (body.allowed_skills as unknown[]).filter(
      (s): s is string => typeof s === "string"
    );
  }
  if (typeof body.rate_limit_per_hour === "number") {
    updates.rate_limit_per_hour = Math.floor(body.rate_limit_per_hour);
  }
  if (typeof body.trial_calls_limit === "number") {
    updates.trial_calls_limit = Math.floor(body.trial_calls_limit);
  } else if (body.trial_calls_limit === null) {
    updates.trial_calls_limit = null;
  }
  if (typeof body.trial_calls_used === "number") {
    updates.trial_calls_used = Math.max(0, Math.floor(body.trial_calls_used));
  }
  if (typeof body.active === "boolean") updates.active = body.active;
  if (typeof body.notes === "string") updates.notes = body.notes;

  const ok = await updateClient(id, updates);
  return NextResponse.json({ ok });
}

/* ── DELETE /api/admin/clients?id=... ─ revoke (soft) ── */

export async function DELETE(request: NextRequest) {
  if (!isAdminAuthorized(request)) return unauthorized();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Query param 'id' is required" }, { status: 400 });
  }

  const ok = await revokeClient(id);
  return NextResponse.json({ ok });
}
