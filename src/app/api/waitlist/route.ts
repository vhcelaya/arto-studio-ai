import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";

config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

async function ensureWaitlistTable() {
  if (!process.env.DATABASE_URL) return false;
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        source TEXT NOT NULL DEFAULT 'landing',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const source = typeof body.source === "string" ? body.source.trim() : "landing";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Always log
  console.log(
    JSON.stringify({
      event: "waitlist_signup",
      timestamp: new Date().toISOString(),
      email,
      source,
    })
  );

  // Store in DB if available
  if (process.env.DATABASE_URL) {
    try {
      const ready = await ensureWaitlistTable();
      if (ready) {
        const { neon } = await import("@neondatabase/serverless");
        const sql = neon(process.env.DATABASE_URL!);
        await sql`
          INSERT INTO waitlist (email, source)
          VALUES (${email}, ${source})
          ON CONFLICT (email) DO NOTHING
        `;
      }
    } catch (error) {
      console.error("[/api/waitlist] DB error:", error);
    }
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  // Admin-only: check auth
  const { isAdminAuthorized } = await import("@/lib/auth");
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503, headers: corsHeaders }
    );
  }

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT id, email, source, created_at
      FROM waitlist
      ORDER BY created_at DESC
      LIMIT 200
    `;
    const [countResult] = await sql`SELECT COUNT(*)::int as total FROM waitlist`;
    return NextResponse.json(
      { signups: rows, total: countResult.total },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[/api/waitlist] Query error:", error);
    return NextResponse.json(
      { error: "Failed to query waitlist" },
      { status: 500, headers: corsHeaders }
    );
  }
}
