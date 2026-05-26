"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ContentType = "prompt" | "blog_post" | "social_post" | "newsletter";
type Status = "draft" | "approved" | "published" | "skipped";

interface ContentItem {
  id: string;
  type: ContentType;
  channel: string | null;
  status: Status;
  language: "en" | "es";
  payload: Record<string, unknown>;
  source_signal_id: string | null;
  published_ref: string | null;
  edited_by_human: boolean;
  cost_usd: number | null;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_PILL: Record<Status, string> = {
  draft: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  published: "bg-blue-100 text-blue-800",
  skipped: "bg-zinc-100 text-zinc-500",
};

const TYPE_LABEL: Record<ContentType, string> = {
  prompt: "Prompt",
  blog_post: "Blog /learn",
  social_post: "Social",
  newsletter: "Newsletter",
};

/* Empirically Claude returns ~8-12s for 3 items, ~15-25s for 5, up to
 * ~45s for 10. We surface a "usualmente tarda" leyenda based on the
 * count the operator picked, plus a live elapsed counter so they don't
 * assume the spinner is hung. */
function expectedDurationLabel(count: number): string {
  const min = Math.round(count * 3);
  const max = Math.round(count * 6);
  return `Usualmente tarda ${min}–${max}s para ${count} ítem${count === 1 ? "" : "s"}.`;
}

function previewTitle(it: ContentItem): string {
  const p = it.payload as Record<string, string>;
  return (
    p.title_en ||
    p.title_es ||
    p.subject ||
    p.hero_en ||
    p.hook ||
    (typeof p.copy === "string" ? p.copy.slice(0, 60) : "") ||
    it.id.slice(0, 8)
  );
}

function previewSnippet(it: ContentItem): string {
  const p = it.payload as Record<string, string>;
  const body = p.body_en || p.body_es || p.intro_en || p.intro_es || p.copy || "";
  return body.length > 140 ? body.slice(0, 140) + "…" : body;
}

export default function ContentClient() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<null | { label: string; done: number; total: number }>(null);

  // Generation state
  const [genBusy, setGenBusy] = useState(false);
  const [genElapsed, setGenElapsed] = useState(0);
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [genResult, setGenResult] = useState<null | { inserted: number; rejected: number; cost: number }>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | ContentType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  // Generate form
  const [genType, setGenType] = useState<ContentType>("prompt");
  const [genCount, setGenCount] = useState(3);
  const [genLang, setGenLang] = useState<"en" | "es">("es");
  const [genBrief, setGenBrief] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/content/items");
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      const data = (await res.json()) as { items: ContentItem[] };
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (genTimerRef.current) clearInterval(genTimerRef.current);
    };
  }, []);

  const visible = useMemo(() => {
    return items.filter((it) => {
      if (typeFilter !== "all" && it.type !== typeFilter) return false;
      if (statusFilter !== "all" && it.status !== statusFilter) return false;
      return true;
    });
  }, [items, typeFilter, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: items.length,
      draft: items.filter((i) => i.status === "draft").length,
      approved: items.filter((i) => i.status === "approved").length,
      published: items.filter((i) => i.status === "published").length,
    };
  }, [items]);

  async function generate() {
    setGenBusy(true);
    setGenElapsed(0);
    setGenResult(null);
    setError("");
    const start = Date.now();
    genTimerRef.current = setInterval(() => {
      setGenElapsed((Date.now() - start) / 1000);
    }, 100);
    try {
      const res = await fetch("/api/admin/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: genType,
          count: genCount,
          language: genLang,
          brief: genBrief.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      const r = (await res.json()) as { inserted: number; rejected?: number; cost_usd: number };
      setGenResult({ inserted: r.inserted, rejected: r.rejected ?? 0, cost: r.cost_usd });
      setGenBrief("");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Generation failed");
    } finally {
      if (genTimerRef.current) {
        clearInterval(genTimerRef.current);
        genTimerRef.current = null;
      }
      setGenBusy(false);
    }
  }

  async function patchItem(id: string, updates: Partial<{ status: Status; payload: Record<string, unknown> }>) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/content/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Borrar este item?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/content/items?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      setOpenId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function bulkApprove() {
    const drafts = items.filter((i) => i.status === "draft");
    if (drafts.length === 0) return alert("No hay borradores para aprobar.");
    if (!confirm(`Aprobar ${drafts.length} borradores?`)) return;
    setBulkProgress({ label: "Aprobando", done: 0, total: drafts.length });
    let i = 0,
      failed = 0;
    for (const d of drafts) {
      try {
        const res = await fetch("/api/admin/content/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: d.id, status: "approved" }),
        });
        if (!res.ok) failed += 1;
      } catch {
        failed += 1;
      }
      i += 1;
      setBulkProgress({ label: "Aprobando", done: i, total: drafts.length });
    }
    await load();
    setBulkProgress(null);
    if (failed > 0) alert(`Terminé: ${i - failed} OK, ${failed} fallaron`);
  }

  async function publishApprovedByType(targetType: "prompt" | "blog_post" | "social_post") {
    const approved = items.filter((i) => i.status === "approved" && i.type === targetType);
    const typeLabels: Record<typeof targetType, { plural: string; dest: string }> = {
      prompt: { plural: "prompts", dest: "a la biblioteca" },
      blog_post: { plural: "blog posts", dest: "a /learn" },
      social_post: { plural: "social posts", dest: "a Buffer (LinkedIn + IG + Facebook ARTO)" },
    };
    const label = typeLabels[targetType];
    if (approved.length === 0) {
      return alert(`No hay ${label.plural} aprobados pendientes de publicar.`);
    }
    if (!confirm(`Publicar ${approved.length} ${label.plural} ${label.dest}?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: targetType }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      const r = (await res.json()) as {
        published: number;
        results: Array<{ status: string; prompt_id?: string; slug?: string; buffer_ids?: string[]; error?: string }>;
      };
      const failed = r.results.filter((x) => x.status === "failed").length;
      await load();
      alert(`${r.published} ${label.plural} publicados${failed > 0 ? ` (${failed} fallaron)` : ""}.`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  const openItem = openId ? items.find((i) => i.id === openId) ?? null : null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", val: summary.total },
          { label: "Borradores", val: summary.draft },
          { label: "Aprobados", val: summary.approved },
          { label: "Publicados", val: summary.published },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-zinc-200 bg-white px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{s.label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Generate form */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Generar contenido nuevo</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Claude genera <code className="rounded bg-zinc-100 px-1">count</code> ítems del tipo elegido. Antes
          de generar consulta los títulos ya existentes en la biblioteca para no duplicar. Cae en estado
          "borrador" hasta que apruebes.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-zinc-500">Tipo</label>
            <select
              value={genType}
              onChange={(e) => setGenType(e.target.value as ContentType)}
              disabled={genBusy}
              className="mt-1 rounded-md border border-zinc-300 px-2 py-1 disabled:opacity-50"
            >
              <option value="prompt">Prompt para biblioteca</option>
              <option value="blog_post">Blog /learn</option>
              <option value="social_post">Social post (LinkedIn/IG/FB)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-500">Cantidad</label>
            <input
              type="number"
              min={1}
              max={10}
              value={genCount}
              disabled={genBusy}
              onChange={(e) => setGenCount(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
              className="mt-1 w-16 rounded-md border border-zinc-300 px-2 py-1 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-500">Idioma base</label>
            <select
              value={genLang}
              onChange={(e) => setGenLang(e.target.value as "en" | "es")}
              disabled={genBusy}
              className="mt-1 rounded-md border border-zinc-300 px-2 py-1 disabled:opacity-50"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-medium text-zinc-500">Brief (opcional)</label>
            <input
              value={genBrief}
              onChange={(e) => setGenBrief(e.target.value)}
              disabled={genBusy}
              placeholder="ej: enfoca en branding para clínicas dentales"
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1 disabled:opacity-50"
            />
          </div>
          <button
            onClick={generate}
            disabled={genBusy}
            className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
          >
            {genBusy ? "Generando…" : "Generar"}
          </button>
        </div>

        {/* Live status during generation */}
        {genBusy && (
          <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
            <div className="flex items-center gap-3 text-xs">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
              <span className="font-mono tabular-nums text-zinc-900">
                {genElapsed.toFixed(1)}s
              </span>
              <span className="text-zinc-600">{expectedDurationLabel(genCount)}</span>
              <span className="text-zinc-400">Claude está redactando — no cierres la ventana.</span>
            </div>
          </div>
        )}

        {/* Last result */}
        {!genBusy && genResult && (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
            <div className="font-semibold text-emerald-900">
              Generación completada en {genElapsed.toFixed(1)}s.
            </div>
            <div className="mt-0.5 text-emerald-800">
              {genResult.inserted} ítem{genResult.inserted === 1 ? "" : "s"} insertado{genResult.inserted === 1 ? "" : "s"}
              {genResult.rejected > 0 && (
                <>
                  {" "}· {genResult.rejected} rechazado{genResult.rejected === 1 ? "" : "s"} por duplicado
                </>
              )}{" "}
              · costo ${genResult.cost.toFixed(4)}
            </div>
          </div>
        )}
      </section>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-zinc-700">Acciones masivas:</span>
        <button
          onClick={bulkApprove}
          disabled={busy || bulkProgress !== null}
          className="rounded-md border border-emerald-400 bg-emerald-50 px-2 py-1 font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
        >
          Aprobar todos los borradores
        </button>
        <button
          onClick={() => publishApprovedByType("prompt")}
          disabled={busy}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
        >
          Publicar prompts aprobados → biblioteca
        </button>
        <button
          onClick={() => publishApprovedByType("blog_post")}
          disabled={busy}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
        >
          Publicar blog posts aprobados → /learn
        </button>
        <button
          onClick={() => publishApprovedByType("social_post")}
          disabled={busy}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
        >
          Publicar social posts aprobados → Buffer
        </button>
        {bulkProgress && (
          <span className="text-zinc-500">
            {bulkProgress.label} {bulkProgress.done}/{bulkProgress.total}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-zinc-500">Filtros:</span>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | ContentType)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1"
        >
          <option value="all">Tipo: todos</option>
          <option value="prompt">Prompts</option>
          <option value="blog_post">Blog /learn</option>
          <option value="social_post">Social posts</option>
          <option value="newsletter">Newsletter</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | Status)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1"
        >
          <option value="all">Status: todos</option>
          <option value="draft">Borradores</option>
          <option value="approved">Aprobados</option>
          <option value="published">Publicados</option>
          <option value="skipped">Skipped</option>
        </select>
        <span className="text-zinc-400">·</span>
        <span className="text-zinc-500">
          {visible.length} de {items.length}
        </span>
      </div>

      {/* Items list */}
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay items que coincidan con esos filtros.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((it) => (
            <article
              key={it.id}
              className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-400"
              onClick={() => setOpenId(it.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
                    {TYPE_LABEL[it.type]}
                  </span>
                  <span className={`rounded-full ${STATUS_PILL[it.status]} px-2 py-0.5 font-semibold`}>
                    {it.status}
                    {it.edited_by_human && <span className="ml-1">✎</span>}
                  </span>
                  <span className="text-zinc-400">{it.language.toUpperCase()}</span>
                  {it.published_ref && <span className="text-zinc-400">→ {it.published_ref}</span>}
                </div>
                <h3 className="mt-1.5 truncate text-sm font-semibold text-zinc-900">{previewTitle(it)}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{previewSnippet(it)}</p>
              </div>
              <div className="text-right text-[10px] text-zinc-400">
                {new Date(it.updated_at).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
              </div>
            </article>
          ))}
        </div>
      )}

      {openItem && (
        <ItemDrawer
          item={openItem}
          busy={busy}
          onClose={() => setOpenId(null)}
          onPatch={(updates) => patchItem(openItem.id, updates)}
          onDelete={() => deleteItem(openItem.id)}
        />
      )}
    </div>
  );
}

/* ---------- Drawer ---------- */

type PayloadShape = Record<string, unknown>;

/* Field metadata per content type. Determines how each payload key is
 * rendered in the Lectura tab: single-line input vs multi-line textarea
 * vs array editor. Anything not listed here falls back to a small input
 * at the bottom (so unknown fields are still editable). */
interface FieldSpec {
  key: string;
  label: string;
  kind: "input" | "textarea" | "csv";
  rows?: number;
  optional?: boolean;
}

const FIELDS_PROMPT: FieldSpec[] = [
  { key: "title_en", label: "Title (EN)", kind: "input" },
  { key: "title_es", label: "Título (ES)", kind: "input" },
  { key: "category", label: "Categoría", kind: "input" },
  { key: "subcategory", label: "Subcategoría", kind: "input" },
  { key: "ai_model", label: "AI model", kind: "input" },
  { key: "difficulty", label: "Dificultad", kind: "input" },
  { key: "tier", label: "Tier", kind: "input" },
  { key: "body_en", label: "Body (EN) — el prompt en sí", kind: "textarea", rows: 10 },
  { key: "body_es", label: "Body (ES) — el prompt en sí", kind: "textarea", rows: 10 },
  { key: "use_case", label: "Use case", kind: "input", optional: true },
  { key: "expected_output", label: "Expected output", kind: "input", optional: true },
  { key: "tags", label: "Tags (comma-separated)", kind: "csv", optional: true },
];

const FIELDS_BLOG: FieldSpec[] = [
  { key: "slug", label: "Slug", kind: "input" },
  { key: "category", label: "Categoría", kind: "input" },
  { key: "title_en", label: "Title (EN)", kind: "input" },
  { key: "title_es", label: "Título (ES)", kind: "input" },
  { key: "meta_description_en", label: "Meta description (EN)", kind: "textarea", rows: 2 },
  { key: "meta_description_es", label: "Meta description (ES)", kind: "textarea", rows: 2 },
  { key: "hero_en", label: "Hero (EN)", kind: "input" },
  { key: "hero_es", label: "Hero (ES)", kind: "input" },
  { key: "intro_en", label: "Intro (EN)", kind: "textarea", rows: 6 },
  { key: "intro_es", label: "Intro (ES)", kind: "textarea", rows: 6 },
  { key: "use_cases_en", label: "Use cases (EN, one per line)", kind: "csv", rows: 6 },
  { key: "use_cases_es", label: "Use cases (ES, one per line)", kind: "csv", rows: 6 },
];

const FIELDS_SOCIAL: FieldSpec[] = [
  { key: "network", label: "Network (linkedin / instagram / facebook / all)", kind: "input" },
  { key: "hook", label: "Hook (primeras 5-8 palabras, debe detener el scroll)", kind: "input" },
  { key: "copy", label: "Copy completo (80-600 chars según plataforma)", kind: "textarea", rows: 6 },
  { key: "cta_text", label: "CTA texto (3-5 palabras)", kind: "input" },
  { key: "cta_url", label: "CTA URL (relativo: /prompts, /pricing, etc)", kind: "input" },
];

function fieldsFor(type: ContentType): FieldSpec[] {
  if (type === "prompt") return FIELDS_PROMPT;
  if (type === "blog_post") return FIELDS_BLOG;
  if (type === "social_post") return FIELDS_SOCIAL;
  return [];
}

function ItemDrawer({
  item,
  busy,
  onClose,
  onPatch,
  onDelete,
}: {
  item: ContentItem;
  busy: boolean;
  onClose: () => void;
  onPatch: (updates: { status?: Status; payload?: PayloadShape }) => void;
  onDelete: () => void;
}) {
  /* Single source of truth for the edited payload. Both the Lectura
   * tab and the JSON tab read/write the same `payload` object, so
   * switching tabs preserves edits regardless of which view made
   * them. */
  const [tab, setTab] = useState<"lectura" | "json">("lectura");
  const [payload, setPayload] = useState<PayloadShape>(item.payload);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(item.payload, null, 2));
  const [jsonError, setJsonError] = useState("");

  // When the underlying item changes (e.g. after a save round-trips),
  // reset our local copies.
  useEffect(() => {
    setPayload(item.payload);
    setJsonText(JSON.stringify(item.payload, null, 2));
    setJsonError("");
  }, [item.id, item.updated_at]);

  const dirty = useMemo(() => {
    return JSON.stringify(payload) !== JSON.stringify(item.payload);
  }, [payload, item.payload]);

  function setField(key: string, value: unknown) {
    setPayload((p) => {
      const next = { ...p, [key]: value };
      // Keep JSON tab in sync.
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  }

  function handleJsonChange(text: string) {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setPayload(parsed);
      setJsonError("");
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "JSON inválido");
    }
  }

  function save() {
    if (jsonError) {
      alert("JSON inválido: " + jsonError);
      return;
    }
    onPatch({ payload });
  }

  const fields = fieldsFor(item.type);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-zinc-900/40" onClick={onClose} />
      <div className="flex w-full max-w-3xl flex-col overflow-y-auto bg-white shadow-xl">
        <header className="border-b border-zinc-200 px-5 py-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-zinc-400">
                {TYPE_LABEL[item.type]} · {item.language.toUpperCase()}
              </p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight">{previewTitle(item)}</h2>
              <p className="text-xs text-zinc-500">
                status{" "}
                <span className={`font-semibold ${STATUS_PILL[item.status]} rounded px-1.5`}>
                  {item.status}
                </span>
                {item.edited_by_human && <span className="ml-1 text-emerald-700">✎ editado</span>}
                {item.published_ref && <span className="ml-2">→ {item.published_ref}</span>}
              </p>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900">
              ✕
            </button>
          </div>
          {/* View tabs */}
          <div className="mt-4 flex gap-1 text-xs">
            <button
              onClick={() => setTab("lectura")}
              className={`rounded-t-md px-3 py-1.5 ${
                tab === "lectura"
                  ? "bg-zinc-100 font-semibold text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              Lectura
            </button>
            <button
              onClick={() => setTab("json")}
              className={`rounded-t-md px-3 py-1.5 ${
                tab === "json"
                  ? "bg-zinc-100 font-semibold text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              JSON
            </button>
            {dirty && <span className="ml-2 self-center text-amber-700">●</span>}
          </div>
        </header>

        <div className="flex-1 space-y-4 px-5 py-4">
          {tab === "lectura" ? (
            fields.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Vista de lectura no implementada para este tipo. Usa el tab JSON.
              </p>
            ) : (
              fields.map((f) => {
                const raw = payload[f.key];
                const value =
                  f.kind === "csv"
                    ? Array.isArray(raw)
                      ? (raw as string[]).join("\n")
                      : typeof raw === "string"
                      ? raw
                      : ""
                    : typeof raw === "string"
                    ? raw
                    : raw === undefined || raw === null
                    ? ""
                    : String(raw);
                const isEmpty = !raw || (Array.isArray(raw) && raw.length === 0);
                return (
                  <div key={f.key}>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                      {f.label}
                      {f.optional && isEmpty && <span className="ml-1 text-zinc-300">(opcional)</span>}
                    </label>
                    {f.kind === "input" ? (
                      <input
                        value={value}
                        onChange={(e) => setField(f.key, e.target.value)}
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
                      />
                    ) : f.kind === "textarea" ? (
                      <textarea
                        value={value}
                        onChange={(e) => setField(f.key, e.target.value)}
                        rows={f.rows ?? 4}
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm leading-relaxed outline-none focus:border-zinc-900"
                      />
                    ) : (
                      <textarea
                        value={value}
                        onChange={(e) => {
                          // CSV mode: stored as array internally.
                          const arr = e.target.value
                            .split(/[\n,]/)
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setField(f.key, arr);
                        }}
                        rows={f.rows ?? 3}
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-zinc-900"
                      />
                    )}
                  </div>
                );
              })
            )
          ) : (
            <div>
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={28}
                className={`w-full rounded-md border px-3 py-2 font-mono text-xs leading-relaxed outline-none ${
                  jsonError ? "border-red-400 focus:border-red-600" : "border-zinc-300 focus:border-zinc-900"
                }`}
              />
              {jsonError && (
                <p className="mt-1 text-xs text-red-600">JSON inválido: {jsonError}</p>
              )}
            </div>
          )}
          {item.cost_usd !== null && item.cost_usd !== undefined && (
            <p className="text-[10px] text-zinc-400">
              Generado a costo ${Number(item.cost_usd).toFixed(4)}
            </p>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 px-5 py-3">
          <div className="flex gap-2">
            <button
              onClick={onDelete}
              disabled={busy}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:border-red-500 disabled:opacity-40"
            >
              Eliminar
            </button>
            {dirty && (
              <button
                onClick={save}
                disabled={busy || !!jsonError}
                className="rounded-md border border-emerald-500 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
              >
                Guardar cambios
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPatch({ status: "skipped" })}
              disabled={busy || item.status === "skipped"}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:border-zinc-500 disabled:opacity-40"
            >
              Saltar
            </button>
            {item.status !== "approved" && item.status !== "published" ? (
              <button
                onClick={() => onPatch({ status: "approved" })}
                disabled={busy}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
              >
                Aprobar
              </button>
            ) : item.status === "approved" ? (
              <button
                onClick={() => onPatch({ status: "draft" })}
                disabled={busy}
                className="rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-40"
              >
                Volver a borrador
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
