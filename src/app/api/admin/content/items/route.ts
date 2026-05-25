import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/* GET  /api/admin/content/items?type=&status=
 *   - List content_items, newest first. Optional filters.
 * PATCH /api/admin/content/items  body { id, payload?, status?, scheduled_for? }
 *   - Edit payload (sets edited_by_human=true) or move status
 *     (draft↔approved, →skipped). Status='published' is set by the
 *     publisher only. */

const ALLOWED_STATUSES = new Set(["draft", "approved", "skipped"]);

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");

  const sb = createAdminClient();
  let q = sb
    .from("content_items")
    .select(
      "id, type, channel, status, language, payload, source_signal_id, published_ref, edited_by_human, cost_usd, scheduled_for, published_at, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });
  if (type) q = q.eq("type", type);
  if (status) q = q.eq("status", status);

  const { data, error } = await q.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.payload && typeof body.payload === "object") {
    updates.payload = body.payload;
    updates.edited_by_human = true;
  }
  if (typeof body.status === "string") {
    if (!ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (typeof body.scheduled_for === "string" || body.scheduled_for === null) {
    updates.scheduled_for = body.scheduled_for;
  }
  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "no updatable fields" }, { status: 400 });
  }

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("content_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = (url.searchParams.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sb = createAdminClient();
  const { error } = await sb.from("content_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
