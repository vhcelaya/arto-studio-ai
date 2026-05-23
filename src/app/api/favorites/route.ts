import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { promptId } = await request.json();
  if (!promptId || typeof promptId !== "string") {
    return NextResponse.json({ error: "promptId required" }, { status: 400 });
  }

  const { error } = await sb
    .from("favorites")
    .insert({ user_id: user.id, prompt_id: promptId });

  // Unique violation = already favorited, treat as idempotent success
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, favorited: true });
}

export async function DELETE(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { promptId } = await request.json();
  if (!promptId || typeof promptId !== "string") {
    return NextResponse.json({ error: "promptId required" }, { status: 400 });
  }

  const { error } = await sb
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("prompt_id", promptId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, favorited: false });
}
