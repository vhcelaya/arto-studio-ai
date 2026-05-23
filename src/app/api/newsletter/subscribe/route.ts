import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const source = (body.source ?? "footer").toString().slice(0, 40);

    if (!VALID_EMAIL.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const admin = createAdminClient();
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();

    const { error } = await admin
      .from("newsletter_subscribers")
      .upsert(
        {
          email,
          source,
          user_id: user?.id ?? null,
          status: "active",
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: "email" },
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
