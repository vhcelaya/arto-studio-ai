import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import { requireAdminSession } from "@/lib/auth";
import { getConfig } from "@/lib/engine-store";

config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

export const maxDuration = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  if (!(await requireAdminSession(request)).ok) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  const rows = await getConfig();
  return NextResponse.json(
    { config: rows, count: rows.length },
    { headers: corsHeaders }
  );
}
