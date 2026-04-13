import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";

// Load .env.local explicitly (workaround for Next.js 16 Turbopack env loading)
config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/roast/email
 * Associates an email with a brand roast for lead capture.
 * Stores in DB if available, always logs to console.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; brandName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const brandName = typeof body.brandName === "string" ? body.brandName.trim() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Log for Vercel logs (always works)
  console.log(
    JSON.stringify({
      event: "roast_email_capture",
      timestamp: new Date().toISOString(),
      email,
      brand: brandName || "unknown",
    })
  );

  // Update the most recent trace for this brand with the email (if DB available)
  if (process.env.DATABASE_URL) {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL);
      await sql`
        UPDATE roast_traces
        SET email = ${email}
        WHERE brand_name = ${brandName}
          AND email IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `;
    } catch (error) {
      console.error("[/api/roast/email] DB update failed:", error);
    }
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}
