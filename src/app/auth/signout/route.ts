import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const sb = await createClient();
  await sb.auth.signOut();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/+$/, "");
  return NextResponse.redirect(`${siteUrl}/`, { status: 303 });
}
