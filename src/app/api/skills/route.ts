import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import path from "path";
import "@/lib/skills"; // side-effect: register all skills
import { listPublicSkills, listSkills, toCatalogEntry } from "@/lib/skills/registry";
import { verifyApiKey } from "@/lib/clients/store";

config({
  path: path.join(/* turbopackIgnore: true */ process.cwd(), ".env.local"),
  override: true,
});

export const maxDuration = 10;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-arto-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/* ── GET /api/skills ─ list catalog ────────────────────── */

export async function GET(request: NextRequest) {
  const rawKey = request.headers.get("x-arto-api-key") || "";

  // No key → only public skills
  if (!rawKey) {
    const skills = listPublicSkills().map(toCatalogEntry);
    return NextResponse.json({ skills }, { headers: corsHeaders });
  }

  // With valid key → public + whatever that client is allowed to use
  const client = await verifyApiKey(rawKey);
  if (!client) {
    const skills = listPublicSkills().map(toCatalogEntry);
    return NextResponse.json({ skills }, { headers: corsHeaders });
  }

  const wildcard = client.allowed_skills.includes("*");
  const all = listSkills();
  const visible = all.filter(
    (s) => s.public || wildcard || client.allowed_skills.includes(s.slug)
  );
  return NextResponse.json(
    { skills: visible.map(toCatalogEntry), client: { id: client.id, name: client.name } },
    { headers: corsHeaders }
  );
}
