"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Draft {
  id: string;
  subject: string;
  body: string;
  language: "en" | "es";
  status: "draft" | "approved" | "sent" | "skipped";
  edited_by_human: boolean;
  cost_usd: number | null;
  updated_at: string;
}

interface Target {
  id: string;
  email: string | null;
  name: string | null;
  company: string | null;
  vertical: string | null;
  country: string | null;
  language: "en" | "es";
  legitimate_interest_score: number | null;
  legitimate_interest_reasoning: string | null;
  metadata: Record<string, unknown> | null;
  status: string;
  include_in_send: boolean;
  last_contacted_at: string | null;
  draft: Draft | null;
}

const STATUS_PILL: Record<string, string> = {
  qualified: "bg-zinc-100 text-zinc-700",
  contacted: "bg-blue-100 text-blue-800",
  converted: "bg-emerald-100 text-emerald-800",
  bounced: "bg-red-100 text-red-800",
  unsubscribed: "bg-red-100 text-red-800",
  rejected: "bg-zinc-100 text-zinc-500",
};

const DRAFT_PILL: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  sent: "bg-blue-100 text-blue-800",
  skipped: "bg-zinc-100 text-zinc-500",
};

function priorityOf(t: Target): string | null {
  const m = t.metadata as Record<string, unknown> | null;
  return (m?.priority as string) ?? null;
}

export default function OutreachClient() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openTargetId, setOpenTargetId] = useState<string | null>(null);
  // Bulk operation progress (Claude draft generation / approval loops).
  const [bulkRunning, setBulkRunning] = useState<null | { label: string; done: number; total: number }>(
    null,
  );
  // Filter UI state.
  const [filterIncluded, setFilterIncluded] = useState<"all" | "in" | "out">("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterDraft, setFilterDraft] = useState<"all" | "missing" | "draft" | "approved" | "sent">(
    "all",
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/outreach/targets");
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { targets: Target[] };
      setTargets(data.targets);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const total = targets.length;
    const included = targets.filter((t) => t.include_in_send).length;
    const withEmail = targets.filter((t) => !!t.email).length;
    const drafted = targets.filter((t) => t.draft && t.draft.status === "draft").length;
    const approved = targets.filter((t) => t.draft && t.draft.status === "approved").length;
    const sent = targets.filter((t) => t.draft && t.draft.status === "sent").length;
    return { total, included, withEmail, drafted, approved, sent };
  }, [targets]);

  const priorities = useMemo(() => {
    const set = new Set<string>();
    for (const t of targets) {
      const p = priorityOf(t);
      if (p) set.add(p);
    }
    return Array.from(set).sort();
  }, [targets]);

  const visible = useMemo(() => {
    return targets.filter((t) => {
      if (filterIncluded === "in" && !t.include_in_send) return false;
      if (filterIncluded === "out" && t.include_in_send) return false;
      if (filterPriority !== "all" && priorityOf(t) !== filterPriority) return false;
      if (filterDraft === "missing" && t.draft) return false;
      if (filterDraft === "draft" && (!t.draft || t.draft.status !== "draft")) return false;
      if (filterDraft === "approved" && (!t.draft || t.draft.status !== "approved")) return false;
      if (filterDraft === "sent" && (!t.draft || t.draft.status !== "sent")) return false;
      return true;
    });
  }, [targets, filterIncluded, filterPriority, filterDraft]);

  async function toggleInclude(t: Target) {
    setBusyId(t.id);
    // Optimistic
    setTargets((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, include_in_send: !x.include_in_send } : x)),
    );
    try {
      const res = await fetch("/api/admin/outreach/targets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, include_in_send: !t.include_in_send }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
    } catch (e) {
      // Roll back.
      setTargets((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, include_in_send: t.include_in_send } : x)),
      );
      alert(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      setBusyId(null);
    }
  }

  async function setEmail(t: Target) {
    const next = prompt(`Email para ${t.company ?? t.id}:`, t.email ?? "");
    if (next === null) return;
    setBusyId(t.id);
    try {
      const res = await fetch("/api/admin/outreach/targets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, email: next.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Email update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function generateDraft(t: Target, regenerate = false) {
    setBusyId(t.id);
    try {
      const res = await fetch("/api/admin/outreach/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: t.id, regenerate }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      await load();
      setOpenTargetId(t.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Draft generation failed");
    } finally {
      setBusyId(null);
    }
  }

  async function patchDraft(d: Draft, updates: Partial<Pick<Draft, "subject" | "body" | "status">>) {
    setBusyId(d.id);
    try {
      const res = await fetch("/api/admin/outreach/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: d.id, ...updates }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Draft update failed");
    } finally {
      setBusyId(null);
    }
  }

  /* ----- Bulk actions ----- */

  async function bulkInclude(mode: "include" | "exclude", priority: "P1" | "P2" | "P3" | "any") {
    const label =
      mode === "include"
        ? priority === "any"
          ? "Incluyendo todos"
          : `Incluyendo todos ${priority}`
        : priority === "any"
        ? "Excluyendo todos"
        : `Excluyendo todos ${priority}`;
    setBulkRunning({ label, done: 0, total: 1 });
    try {
      const res = await fetch("/api/admin/outreach/targets/bulk-include", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, priority }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      setBulkRunning(null);
    }
  }

  /* Generate drafts for every target that is included AND has no draft.
   * Sequential to keep API/Claude pressure low (each draft is ~1.5s). */
  async function bulkGenerateMissingDrafts() {
    const candidates = targets.filter((t) => t.include_in_send && !t.draft);
    if (candidates.length === 0) {
      alert("No hay targets incluidos sin draft.");
      return;
    }
    if (!confirm(`Generar ${candidates.length} drafts? Esto llama a Claude y tarda ~${Math.ceil(candidates.length * 1.5)}s.`)) {
      return;
    }
    setBulkRunning({ label: "Generando drafts", done: 0, total: candidates.length });
    let i = 0;
    let failed = 0;
    for (const t of candidates) {
      try {
        const res = await fetch("/api/admin/outreach/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_id: t.id }),
        });
        if (!res.ok) failed += 1;
      } catch {
        failed += 1;
      }
      i += 1;
      setBulkRunning({ label: "Generando drafts", done: i, total: candidates.length });
    }
    await load();
    setBulkRunning(null);
    if (failed > 0) alert(`Terminé: ${i - failed} OK, ${failed} fallaron. Revisa la tabla.`);
  }

  /* Approve every current draft (status='draft' → 'approved'). */
  async function bulkApproveAllDrafts() {
    const drafts = targets
      .map((t) => t.draft)
      .filter((d): d is Draft => !!d && d.status === "draft");
    if (drafts.length === 0) {
      alert("No hay drafts en estado borrador para aprobar.");
      return;
    }
    if (!confirm(`Aprobar ${drafts.length} drafts? Después podrás disparar el envío con dry-run/trigger.`)) {
      return;
    }
    setBulkRunning({ label: "Aprobando drafts", done: 0, total: drafts.length });
    let i = 0;
    let failed = 0;
    for (const d of drafts) {
      try {
        const res = await fetch("/api/admin/outreach/drafts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: d.id, status: "approved" }),
        });
        if (!res.ok) failed += 1;
      } catch {
        failed += 1;
      }
      i += 1;
      setBulkRunning({ label: "Aprobando drafts", done: i, total: drafts.length });
    }
    await load();
    setBulkRunning(null);
    if (failed > 0) alert(`Terminé: ${i - failed} aprobados, ${failed} fallaron.`);
  }

  const openTarget = openTargetId ? targets.find((t) => t.id === openTargetId) ?? null : null;
  const bulkBusy = bulkRunning !== null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total", val: summary.total },
          { label: "Incluidos", val: summary.included },
          { label: "Con email", val: summary.withEmail },
          { label: "Drafts", val: summary.drafted },
          { label: "Aprobados", val: summary.approved },
          { label: "Enviados", val: summary.sent },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-zinc-200 bg-white px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              {s.label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Bulk actions */}
      <div className="rounded-lg border border-zinc-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-zinc-700">Acciones masivas:</span>
          {priorities.length > 0 && (
            <>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-500">Inclusión:</span>
              {priorities.map((p) => (
                <button
                  key={`inc-${p}`}
                  disabled={bulkBusy}
                  onClick={() =>
                    bulkInclude("include", p as "P1" | "P2" | "P3" | "any")
                  }
                  className="rounded-md border border-zinc-300 px-2 py-1 hover:border-zinc-500 disabled:opacity-40"
                >
                  Incluir {p}
                </button>
              ))}
              {priorities.map((p) => (
                <button
                  key={`exc-${p}`}
                  disabled={bulkBusy}
                  onClick={() =>
                    bulkInclude("exclude", p as "P1" | "P2" | "P3" | "any")
                  }
                  className="rounded-md border border-zinc-300 px-2 py-1 hover:border-zinc-500 disabled:opacity-40"
                >
                  Excluir {p}
                </button>
              ))}
              <button
                disabled={bulkBusy}
                onClick={() => bulkInclude("include", "any")}
                className="rounded-md border border-zinc-300 px-2 py-1 hover:border-zinc-500 disabled:opacity-40"
              >
                Reset (incluir todos)
              </button>
            </>
          )}
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-500">Drafts:</span>
          <button
            disabled={bulkBusy}
            onClick={bulkGenerateMissingDrafts}
            className="rounded-md border border-emerald-400 bg-emerald-50 px-2 py-1 font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
          >
            Generar faltantes
          </button>
          <button
            disabled={bulkBusy}
            onClick={bulkApproveAllDrafts}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
          >
            Aprobar todos los drafts
          </button>
        </div>
        {bulkRunning && (
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
            <span>{bulkRunning.label}…</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full bg-zinc-900 transition-all"
                style={{
                  width: `${Math.round((bulkRunning.done / Math.max(bulkRunning.total, 1)) * 100)}%`,
                }}
              />
            </div>
            <span className="tabular-nums">
              {bulkRunning.done}/{bulkRunning.total}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-zinc-500">Filtros:</span>
        <select
          value={filterIncluded}
          onChange={(e) => setFilterIncluded(e.target.value as "all" | "in" | "out")}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1"
        >
          <option value="all">Incluir/excluir: todos</option>
          <option value="in">Solo incluidos</option>
          <option value="out">Solo excluidos</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1"
        >
          <option value="all">Prioridad: todas</option>
          {priorities.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={filterDraft}
          onChange={(e) =>
            setFilterDraft(e.target.value as "all" | "missing" | "draft" | "approved" | "sent")
          }
          className="rounded-md border border-zinc-300 bg-white px-2 py-1"
        >
          <option value="all">Draft: todos</option>
          <option value="missing">Sin draft</option>
          <option value="draft">Borrador</option>
          <option value="approved">Aprobado</option>
          <option value="sent">Enviado</option>
        </select>
        <span className="text-zinc-400">·</span>
        <span className="text-zinc-500">{visible.length} de {targets.length}</span>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-3 py-2 w-10"></th>
                <th className="px-3 py-2">Empresa</th>
                <th className="px-3 py-2">Contacto</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Pri</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Idioma</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Draft</th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => {
                const pri = priorityOf(t);
                const draftStatus = t.draft?.status ?? null;
                return (
                  <tr
                    key={t.id}
                    className={`border-t border-zinc-100 ${
                      !t.include_in_send ? "bg-zinc-50/40 text-zinc-400" : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={t.include_in_send}
                        disabled={busyId === t.id}
                        onChange={() => toggleInclude(t)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-zinc-900">
                      <span className={!t.include_in_send ? "text-zinc-400" : ""}>
                        {t.company ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{t.name ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">
                      {t.email ? (
                        <span className="font-mono">{t.email}</span>
                      ) : (
                        <button
                          onClick={() => setEmail(t)}
                          className="text-amber-700 underline decoration-dotted hover:text-amber-900"
                        >
                          + agregar
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">{pri ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {t.legitimate_interest_score ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs uppercase">{t.language}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full ${STATUS_PILL[t.status] ?? "bg-zinc-100 text-zinc-600"} px-2 py-0.5 text-[10px] font-semibold`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {draftStatus ? (
                        <span
                          className={`rounded-full ${DRAFT_PILL[draftStatus]} px-2 py-0.5 text-[10px] font-semibold`}
                        >
                          {draftStatus}
                          {t.draft?.edited_by_human && (
                            <span className="ml-1" title="Edited by human">
                              ✎
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {t.draft ? (
                        <button
                          onClick={() => setOpenTargetId(t.id)}
                          className="text-xs text-zinc-700 hover:underline"
                          disabled={busyId === t.id}
                        >
                          Ver draft
                        </button>
                      ) : (
                        <button
                          onClick={() => generateDraft(t, false)}
                          disabled={busyId === t.id || !t.include_in_send}
                          className="text-xs font-medium text-zinc-700 underline decoration-dotted hover:text-zinc-900 disabled:opacity-40 disabled:no-underline"
                        >
                          {busyId === t.id ? "..." : "Generar"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-sm text-zinc-500">
                    No hay targets con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Draft drawer */}
      {openTarget && openTarget.draft && (
        <DraftDrawer
          target={openTarget}
          draft={openTarget.draft}
          busy={busyId === openTarget.draft.id}
          onClose={() => setOpenTargetId(null)}
          onRegenerate={() => generateDraft(openTarget, true)}
          onPatch={(updates) => patchDraft(openTarget.draft!, updates)}
        />
      )}
    </div>
  );
}

function DraftDrawer({
  target,
  draft,
  busy,
  onClose,
  onRegenerate,
  onPatch,
}: {
  target: Target;
  draft: Draft;
  busy: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  onPatch: (updates: Partial<Pick<Draft, "subject" | "body" | "status">>) => void;
}) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  // Reset state when draft changes (e.g. after regenerate).
  useEffect(() => {
    setSubject(draft.subject);
    setBody(draft.body);
  }, [draft.id, draft.updated_at, draft.subject, draft.body]);

  const dirty = subject !== draft.subject || body !== draft.body;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-zinc-900/40" onClick={onClose} />
      <div className="flex w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-xl">
        <header className="border-b border-zinc-200 px-5 py-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-zinc-400">Draft</p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight">
                {target.company ?? "Target"}
              </h2>
              <p className="text-xs text-zinc-500">
                {target.name ?? "—"} · {target.email ?? "(sin email)"} · lang {draft.language} · status{" "}
                <span className="font-semibold">{draft.status}</span>
                {draft.edited_by_human && <span className="ml-1 text-emerald-700">✎ editado</span>}
              </p>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900">
              ✕
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-4 px-5 py-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium outline-none focus:border-zinc-900"
            />
            <p className="mt-1 text-[10px] text-zinc-400">
              {subject.length} caracteres {subject.length > 60 && "· over 60 char target"}
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm leading-relaxed outline-none focus:border-zinc-900"
            />
            <p className="mt-1 text-[10px] text-zinc-400">
              {body.split(/\s+/).filter(Boolean).length} palabras
            </p>
          </div>
          {target.legitimate_interest_reasoning && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Razón del legitimate interest
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                {target.legitimate_interest_reasoning}
              </p>
            </div>
          )}
          {draft.cost_usd !== null && draft.cost_usd !== undefined && (
            <p className="text-[10px] text-zinc-400">
              Generado a costo ${Number(draft.cost_usd).toFixed(4)}
            </p>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 px-5 py-3">
          <div className="flex gap-2">
            <button
              onClick={onRegenerate}
              disabled={busy}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:border-zinc-500 disabled:opacity-40"
            >
              {busy ? "..." : "Regenerar"}
            </button>
            {dirty && (
              <button
                onClick={() => onPatch({ subject, body })}
                disabled={busy}
                className="rounded-md border border-emerald-500 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
              >
                Guardar cambios
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPatch({ status: "skipped" })}
              disabled={busy || draft.status === "skipped"}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:border-zinc-500 disabled:opacity-40"
            >
              Saltar
            </button>
            {draft.status !== "approved" ? (
              <button
                onClick={() => onPatch({ status: "approved" })}
                disabled={busy}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
              >
                Aprobar
              </button>
            ) : (
              <button
                onClick={() => onPatch({ status: "draft" })}
                disabled={busy}
                className="rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-40"
              >
                Volver a borrador
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
