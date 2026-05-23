import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  // Use the public site URL from env (configured per Vercel project),
  // NOT url.origin — Vercel rewrite proxies can leak the standalone host.
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || url.origin).replace(/\/+$/, "");
  const target = next === "/" ? `${siteUrl}/` : `${siteUrl}${next}`;

  if (code) {
    const sb = await createClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(target);
    }
    return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${siteUrl}/login?error=missing_code`);
}
