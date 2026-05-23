import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function ownsCollection(sb: Awaited<ReturnType<typeof createClient>>, collectionId: string, userId: string) {
  const { data } = await sb
    .from("collections")
    .select("id, prompt_ids, user_id")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

// PATCH — update name/description/is_public
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const collection = await ownsCollection(sb, id, user.id);
  if (!collection) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string") updates.name = body.name.trim().slice(0, 80);
  if (typeof body.description === "string") updates.description = body.description.slice(0, 500);
  if (typeof body.is_public === "boolean") updates.is_public = body.is_public;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await sb.from("collections").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection: data });
}

// DELETE — remove the collection
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const collection = await ownsCollection(sb, id, user.id);
  if (!collection) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { error } = await sb.from("collections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
