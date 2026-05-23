import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// POST — add a prompt id to the collection
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { prompt_id } = await request.json();
  if (!prompt_id || typeof prompt_id !== "string") {
    return NextResponse.json({ error: "prompt_id required" }, { status: 400 });
  }

  const { data: collection } = await sb
    .from("collections")
    .select("prompt_ids")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!collection) return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing: string[] = (collection.prompt_ids as string[]) ?? [];
  if (existing.includes(prompt_id)) {
    return NextResponse.json({ ok: true, alreadyIn: true });
  }
  const updated = [...existing, prompt_id];

  const { error } = await sb
    .from("collections")
    .update({ prompt_ids: updated, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a prompt id from the collection
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const prompt_id = url.searchParams.get("prompt_id");
  if (!prompt_id) return NextResponse.json({ error: "prompt_id required" }, { status: 400 });

  const { data: collection } = await sb
    .from("collections")
    .select("prompt_ids")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!collection) return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing: string[] = (collection.prompt_ids as string[]) ?? [];
  const updated = existing.filter((pid) => pid !== prompt_id);

  const { error } = await sb
    .from("collections")
    .update({ prompt_ids: updated, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
