import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import postgres from "postgres";

config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

let cached: ReturnType<typeof postgres> | null = null;
function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  cached = postgres(url, { ssl: "require", max: 1, prepare: false });
  return cached;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
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

  console.log(
    JSON.stringify({
      event: "waitlist_signup",
      timestamp: new Date().toISOString(),
      email,
      source,
    })
  );

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        INSERT INTO waitlist (email, source)
        VALUES (${email}, ${source})
        ON CONFLICT (email) DO NOTHING
      `;
    } catch (error) {
      console.error("[/api/waitlist] DB error:", error);
    }
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { isAdminAuthorized } = await import("@/lib/auth");
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503, headers: corsHeaders }
    );
  }

  try {
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
