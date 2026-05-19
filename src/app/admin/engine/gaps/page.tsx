"use client";

import { useCallback, useEffect, useState } from "react";
import { authHeaders, formatDate } from "../../shared";

interface ContentGap {
  id: string;
  query_pattern: string;
  frequency: number;
  avg_similarity: number | null;
  suggested_vertical: string | null;
  status: "open" | "in_progress" | "resolved" | "dismissed";
  resolved_by_prompt_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface GapsStats {
  total: number;
  open: number;
  byStatus: { status: string; count: number }[];
  byVertical: { suggested_vertical: string | null; count: number }[];
}

const STATUSES = ["open", "in_progress", "resolved", "dismissed"];

function statusColor(status: string): string {
  switch (status) {
    case "open":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "in_progress":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "resolved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "dismissed":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    default:
      return "bg-zinc-50 text-zinc-600 border-zinc-200";
  }
}

function similarityColor(sim: number | null): string {
  if (sim == null) return "text-zinc-400";
  if (sim < 0.5) return "text-red-600";
  if (sim < 0.75) return "text-amber-600";
  return "text-emerald-600";
}

export default function GapsPage() {
  const [apiKey, setApiKey] = useState("");
  const [stats, setStats] = useState<GapsStats | null>(null);
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [filterVertical, setFilterVertical] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("arto_admin_key");
    if (saved) setApiKey(saved);
  }, []);

  const fetchData = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterVertical) params.set("suggested_vertical", filterVertical);
      params.set("limit", "100");

      const [statsRes, gapsRes] = await Promise.all([
        fetch("/api/admin/engine/gaps?view=stats", { headers: authHeaders(apiKey) }),
        fetch(`/api/admin/engine/gaps?${params.toString()}`, { headers: authHeaders(apiKey) }),
      ]);

      if (statsRes.status === 503) {
        setError("DATABASE_URL is not configured on the server.");
        setLoading(false);
        return;
      }
      if (!statsRes.ok) {
        setError(`Failed to fetch stats (HTTP ${statsRes.status}).`);
        setLoading(false);
        return;
      }

      const statsData = (await statsRes.json()) as GapsStats;
      const gapsData = (await gapsRes.json()) as { gaps: ContentGap[] };
      setStats(statsData);
      setGaps(gapsData.gaps || []);
    } catch {
      setError("Failed to fetch gaps.");
    }
    setLoading(false);
  }, [apiKey, filterStatus, filterVertical]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Content gaps</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Query patterns returning poor results — fuel for the prompt queue + content
        factory.
      </p>

      {loading && (
        <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          Loading gaps...
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Open</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600">
                {stats.open}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Resolved</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
                {stats.byStatus.find((s) => s.status === "resolved")?.count ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">In progress</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-blue-600">
                {stats.byStatus.find((s) => s.status === "in_progress")?.count ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Total</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{stats.total}</p>
            </div>
          </div>

          {stats.byVertical.length > 0 && (
            <>
              <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                Open by suggested vertical
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stats.byVertical.map((v, i) => (
                  <button
                    key={`${v.suggested_vertical}-${i}`}
                    onClick={() =>
                      setFilterVertical(
                        v.suggested_vertical && v.suggested_vertical === filterVertical
                          ? ""
                          : v.suggested_vertical || ""
                      )
                    }
                    className={`rounded-xl border bg-white p-4 text-left transition-colors ${
                      filterVertical === v.suggested_vertical
                        ? "border-zinc-900"
                        : "border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    <p className="text-xs font-medium text-zinc-500">
                      {v.suggested_vertical || "(no vertical)"}
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">{v.count}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {filterVertical && (
          <button
            onClick={() => setFilterVertical("")}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 hover:border-zinc-400"
          >
            Vertical: {filterVertical} ×
          </button>
        )}
      </div>

      {gaps.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-2">Query pattern</th>
                <th className="px-4 py-2">Vertical</th>
                <th className="px-4 py-2">Freq</th>
                <th className="px-4 py-2">Avg similarity</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((g) => (
                <tr key={g.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2 text-xs">{g.query_pattern}</td>
                  <td className="px-4 py-2 text-xs text-zinc-500">
                    {g.suggested_vertical || "—"}
                  </td>
                  <td className="px-4 py-2 text-xs font-medium">{g.frequency}</td>
                  <td className={`px-4 py-2 text-xs ${similarityColor(g.avg_similarity)}`}>
                    {g.avg_similarity != null ? g.avg_similarity.toFixed(3) : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusColor(g.status)}`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-zinc-500">
                    {formatDate(g.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && stats && gaps.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No content gaps in this filter. Module 4 + library search logs feed this view.
        </div>
      )}
    </>
  );
}
