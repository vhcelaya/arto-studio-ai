import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/* POST /api/admin/outreach/targets/bulk-include
 *
 * body:
 *   { mode: "include" | "exclude", priority?: "P1" | "P2" | "P3" | "any" }
 *
 * Sets include_in_send=true (mode=include) or false (mode=exclude) on
 * all targets matching the priority filter. `priority="any"` matches
 * every target — used for "Reset all to included" or "Exclude all".
 *
 * Returns { updated: <int> }. Single SQL UPDATE so 30+ targets flip in
 * one round-trip. */

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const mode = body?.mode;
  const priority = body?.priority ?? "any";

  if (mode !== "include" && mode !== "exclude") {
    return NextResponse.json({ error: "mode must be 'include' or 'exclude'" }, { status: 400 });
  }
  if (priority !== "any" && !["P1", "P2", "P3"].includes(priority)) {
    return NextResponse.json({ error: "priority must be P1, P2, P3, or any" }, { status: 400 });
  }

  const sb = createAdminClient();
  let query = sb
    .from("outreach_targets")
    .update({ include_in_send: mode === "include" });

  if (priority !== "any") {
    // metadata->>'priority' = '<P1|P2|P3>'
    query = query.filter("metadata->>priority", "eq", priority);
  } else {
    // unconditional update needs a where clause — use status != 'nope'
    // (sentinel that doesn't exist) to match every row safely.
    query = query.not("id", "is", null);
  }

  const { data, error } = await query.select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: data?.length ?? 0 });
}
