"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { authHeaders, formatDate } from "./shared";

interface SkillTrace {
  id: number;
  skill_slug: string;
  client_id: string | null;
  input: unknown;
  output: unknown;
  source: "ai" | "fallback";
  model: string;
  latency_ms: number;
  email: string | null;
  created_at: string;
}

interface SkillStats {
  total: number;
  bySkill: { skill_slug: string; count: number; avg_latency?: number }[];
  bySource: { ai: number; fallback: number };
}

interface ClientLite {
  id: string;
  name: string;
  email: string;
}

export default function SkillTracesTab({
  apiKey,
  refreshKey,
}: {
  apiKey: string;
  refreshKey: number;
}) {
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [traces, setTraces] = useState<SkillTrace[]>([]);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterSlug, setFilterSlug] = useState<string>("");
  const [filterClient, setFilterClient] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterSlug) params.set("slug", filterSlug);
      if (filterClient) params.set("client_id", filterClient);
      params.set("limit", "50");

      const [statsRes, tracesRes, clientsRes] = await Promise.all([
        fetch("/api/admin/traces?view=stats", { headers: authHeaders(apiKey) }),
        fetch(`/api/admin/traces?${params.toString()}`, { headers: authHeaders(apiKey) }),
        fetch("/api/admin/clients", { headers: authHeaders(apiKey) }),
      ]);

      if (statsRes.status === 503) {
        setError("Database not configured. Add DATABASE_URL to enable trace storage.");
        setLoading(false);
        return;
      }

      const statsData = await statsRes.json();
      const tracesData = await tracesRes.json();
      const clientsData = await clientsRes.json();

      setStats(statsData);
      setTraces(tracesData.traces || []);
      setClients(
        (clientsData.clients || []).map((c: ClientLite) => ({
          id: c.id,
          name: c.name,
          email: c.email,
        }))
      );
    } catch {
      setError("Failed to fetch skill traces.");
    }
    setLoading(false);
  }, [apiKey, filterSlug, filterClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const clientName = useCallback(
    (id: string | null) => {
      if (!id) return "—";
      const c = clients.find((c) => c.id === id);
      return c ? c.name : id.slice(0, 8);
    },
    [clients]
  );

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Skill Traces</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Every gated-skill call is a trace — input, output, client, latency. Feeds continual learning.
      </p>

      {loading && (
        <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          Loading traces...
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Total calls</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">AI Powered</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
                {stats.bySource.ai}
              </p>
              <p className="mt-1 text-xs text-zinc-400">{stats.bySource.fallback} fallback</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Top skill</p>
              <p className="mt-2 text-lg font-bold tracking-tight">
                {stats.bySkill?.[0]?.skill_slug ?? "—"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {stats.bySkill?.[0]?.count ?? 0} calls
              </p>
            </div>
          </div>

          {stats.bySkill.length > 0 && (
            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {stats.bySkill.map((s) => (
                <div
                  key={s.skill_slug}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-mono text-sm font-medium">{s.skill_slug}</p>
                    <p className="text-xs text-zinc-400">
                      {s.count} calls · ~{s.avg_latency ?? 0}ms avg
                    </p>
                  </div>
                  <button
                    onClick={() => setFilterSlug(s.skill_slug)}
                    className="text-xs text-zinc-500 hover:text-zinc-900"
                  >
                    Filter →
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <label className="text-xs">
          <span className="mr-2 font-medium text-zinc-500">Skill</span>
          <select
            value={filterSlug}
            onChange={(e) => setFilterSlug(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {stats?.bySkill.map((s) => (
              <option key={s.skill_slug} value={s.skill_slug}>
                {s.skill_slug}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="mr-2 font-medium text-zinc-500">Client</span>
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {(filterSlug || filterClient) && (
          <button
            onClick={() => {
              setFilterSlug("");
              setFilterClient("");
            }}
            className="text-xs text-zinc-500 hover:text-zinc-900"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Traces table */}
      {traces.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-widest text-zinc-400">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Skill</th>
                <th className="pb-3 pr-4">Client</th>
                <th className="pb-3 pr-4">Source</th>
                <th className="pb-3 pr-4">Model</th>
                <th className="pb-3 pr-4 text-right">Latency</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {traces.map((t) => (
                <Fragment key={t.id}>
                  <tr
                    className="cursor-pointer border-b border-zinc-100 hover:bg-white transition-colors"
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-zinc-500">{t.id}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700">
                        {t.skill_slug}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-zinc-500">{clientName(t.client_id)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.source === "ai"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {t.source}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-zinc-500">{t.model}</td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-zinc-600">
                      {(t.latency_ms / 1000).toFixed(1)}s
                    </td>
                    <td className="py-3 pr-4 text-zinc-400 text-xs whitespace-nowrap">
                      {formatDate(t.created_at)}
                    </td>
                    <td className="py-3 text-right text-xs text-zinc-400">
                      {expandedId === t.id ? "▴" : "▾"}
                    </td>
                  </tr>
                  {expandedId === t.id && (
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                              Input
                            </p>
                            <pre className="mt-2 max-h-80 overflow-auto rounded-lg border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-700">
                              {JSON.stringify(t.input, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                              Output
                            </p>
                            <pre className="mt-2 max-h-80 overflow-auto rounded-lg border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-700">
                              {JSON.stringify(t.output, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && traces.length === 0 && !error && (
        <div className="mt-12 rounded-xl border border-dashed border-zinc-300 bg-white py-12 text-center">
          <p className="text-sm font-medium text-zinc-500">No skill traces yet</p>
          <p className="mt-2 text-xs text-zinc-400">
            Gated skill calls will appear here as clients start using their API keys.
          </p>
        </div>
      )}
    </>
  );
}
