"use client";

import { useCallback, useEffect, useState } from "react";

interface DynamicAdmin {
  id: string;
  email: string;
  added_by: string | null;
  added_at: string;
  notes: string | null;
}

interface ListResponse {
  bootstrap: string[];
  dynamic: DynamicAdmin[];
}

/* /admin/admins client. Lists current admins and lets you add/remove
 * dynamic ones. Bootstrap admins (ADMIN_EMAILS env var) are listed
 * read-only with a "permanente" badge. The actual session check lives
 * server-side in /admin/layout.tsx — this component just calls the
 * /api/admin/admins endpoint via cookie auth. */
export default function AdminsClient() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/admins");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setData((await res.json()) as ListResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, notes: newNotes.trim() || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setNewEmail("");
      setNewNotes("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(email: string) {
    if (!confirm(`Quitar acceso de admin a ${email}?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/admins?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Agregar administrador</h2>
        <p className="mt-1 text-xs text-zinc-500">
          El email debe estar registrado en Supabase Auth para que pueda entrar (sign-in
          con magic link o Google).
        </p>
        <form onSubmit={handleAdd} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-medium text-zinc-500">Email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nuevo@arto.com"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-medium text-zinc-500">Notas (opcional)</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="rol, contexto, etc."
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !newEmail.trim()}
            className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {busy ? "..." : "Agregar"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Admins activos
        </h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Cargando...</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Origen</th>
                  <th className="px-4 py-2">Agregado por</th>
                  <th className="px-4 py-2">Cuando</th>
                  <th className="px-4 py-2">Notas</th>
                  <th className="px-4 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {data?.bootstrap.map((email) => (
                  <tr key={`b-${email}`} className="border-t border-zinc-100">
                    <td className="px-4 py-2 font-mono text-xs">{email}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        Permanente
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-zinc-400">env var</td>
                    <td className="px-4 py-2 text-xs text-zinc-400">—</td>
                    <td className="px-4 py-2 text-xs text-zinc-400">
                      ADMIN_EMAILS — quita en Vercel para revocar
                    </td>
                    <td className="px-4 py-2"></td>
                  </tr>
                ))}
                {data?.dynamic.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-100">
                    <td className="px-4 py-2 font-mono text-xs">{row.email}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Dinámico
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-zinc-500">{row.added_by ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-zinc-500">
                      {new Date(row.added_at).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2 text-xs text-zinc-500">{row.notes ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRemove(row.email)}
                        disabled={busy}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
                {!data?.bootstrap.length && !data?.dynamic.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-sm text-zinc-500">
                      No hay administradores registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
