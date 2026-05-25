import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/* GET    /api/admin/outreach/targets              — list with draft + last_log
 * PATCH  /api/admin/outreach/targets              — body { id, email?, include_in_send? }
 *                                                   (POST-style update keyed by id)
 *
 * Bulk operations (toggle by priority, etc) call PATCH per row from the
 * client — small batches, fine for 30-200 targets. */

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createAdminClient();
  // Targets + their current draft (left join via two queries — simpler than embedded select).
  const { data: targets, error: tErr } = await sb
    .from("outreach_targets")
    .select(
      "id, email, name, company, vertical, country, language, legitimate_interest_score, legitimate_interest_reasoning, metadata, status, include_in_send, last_contacted_at",
    )
    .order("legitimate_interest_score", { ascending: false, nullsFirst: false });
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  const { data: drafts } = await sb
    .from("outreach_drafts")
    .select("id, target_id, subject, body, language, status, edited_by_human, cost_usd, updated_at");

  const draftByTarget = new Map<string, NonNullable<typeof drafts>[number]>();
  for (const d of drafts ?? []) draftByTarget.set(d.target_id, d);

  const enriched = (targets ?? []).map((t) => ({
    ...t,
    draft: draftByTarget.get(t.id) ?? null,
  }));

  return NextResponse.json({ targets: enriched });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.include_in_send === "boolean") updates.include_in_send = body.include_in_send;
  if (typeof body.email === "string") {
    const e = body.email.trim().toLowerCase();
    if (!e) {
      updates.email = null;
    } else if (!EMAIL_RE.test(e)) {
      return NextResponse.json({ error: "invalid email" }, { status: 400 });
    } else {
      updates.email = e;
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no updatable fields" }, { status: 400 });
  }

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("outreach_targets")
    .update(updates)
    .eq("id", id)
    .select("id, email, include_in_send")
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email already in use by another target." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ target: data });
}
