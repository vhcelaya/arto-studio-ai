import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface Body {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("collections")
    .select("id, name, description, prompt_ids, is_public, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collections: data ?? [] });
}

export async function POST(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json()) as Body;
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: "name too long" }, { status: 400 });

  const { data, error } = await sb
    .from("collections")
    .insert({
      user_id: user.id,
      name,
      description: (body.description ?? "").slice(0, 500) || null,
      is_public: !!body.is_public,
    })
    .select("id, name, description, prompt_ids, is_public, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection: data });
}
