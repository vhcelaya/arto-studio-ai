"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { authHeaders, formatDate } from "../../shared";

interface SocialLog {
  id: string;
  run_date: string;
  prompt_id: string | null;
  platform: "twitter" | "linkedin" | "threads";
  language: "en" | "es";
  post_content: string;
  buffer_post_id: string | null;
  status: "draft" | "scheduled" | "published" | "failed" | "skipped";
  error_message: string | null;
  created_at: string;
}

interface SocialStats {
  total: number;
  byPlatform: { platform: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byLanguage: { language: string; count: number }[];
  last7dPublished: number;
}

const PLATFORMS = ["twitter", "linkedin", "threads"];
const STATUSES = ["draft", "scheduled", "published", "failed", "skipped"];

function statusColor(status: string): string {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "scheduled":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "draft":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    case "skipped":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    default:
      return "bg-zinc-50 text-zinc-600 border-zinc-200";
  }
}

function platformColor(platform: string): string {
  switch (platform) {
    case "linkedin":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "twitter":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "threads":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    default:
      return "bg-zinc-50 text-zinc-600 border-zinc-200";
  }
}

export default function SocialPage() {
  // apiKey is a vestige of the old Bearer-token auth — kept as a
  // const so existing fetch(... { headers: authHeaders(apiKey) }) calls
  // type-check. The layout now session-gates, and authHeaders() returns
  // an empty object so the value is ignored at runtime.
  const apiKey = "session";
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [logs, setLogs] = useState<SocialLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterPlatform) params.set("platform", filterPlatform);
      if (filterStatus) params.set("status", filterStatus);
      if (filterLanguage) params.set("language", filterLanguage);
      params.set("limit", "100");

      const [statsRes, logsRes] = await Promise.all([
        fetch("/api/admin/engine/social?view=stats", { headers: authHeaders(apiKey) }),
        fetch(`/api/admin/engine/social?${params.toString()}`, {
          headers: authHeaders(apiKey),
        }),
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

      const statsData = (await statsRes.json()) as SocialStats;
      const logsData = (await logsRes.json()) as { logs: SocialLog[] };
      setStats(statsData);
      setLogs(logsData.logs || []);
    } catch {
      setError("Failed to fetch social logs.");
    }
    setLoading(false);
  }, [apiKey, filterPlatform, filterStatus, filterLanguage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Social</h1>
      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-sm text-zinc-700">
        <p>
          <strong className="text-zinc-900">Qué es:</strong> posts que genera Module 1
          (Social Publisher) — drafts, scheduled, published, failed. Corre Mon + Thu
          16:00 UTC, 3 posts por plataforma (Twitter / LinkedIn / Threads), basado en
          los prompts top del library.
        </p>
        <p className="mt-1.5">
          <strong className="text-zinc-900">Cómo usarlo:</strong> click platform card
          para filtrar. Click una fila para expandir y ver el post completo, buffer
          post ID, y prompt source.
        </p>
        <p className="mt-1.5">
          <strong className="text-zinc-900">Qué buscar:</strong> &ldquo;Failed&rdquo;
          subiendo = problema con Buffer o con QC (banned words / similarity).
          &ldquo;Drafts&rdquo; acumulando sin publicar = falta aprobación manual.
        </p>
      </div>

      {loading && (
        <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          Loading social logs...
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
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Total posts</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Published 7d</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
                {stats.last7dPublished}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Drafts</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600">
                {stats.byStatus.find((s) => s.status === "draft")?.count ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Failed</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-red-600">
                {stats.byStatus.find((s) => s.status === "failed")?.count ?? 0}
              </p>
            </div>
          </div>

          {stats.byPlatform.length > 0 && (
            <>
              <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                By platform
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {PLATFORMS.map((p) => {
                  const count = stats.byPlatform.find((x) => x.platform === p)?.count ?? 0;
                  return (
                    <button
                      key={p}
                      onClick={() => setFilterPlatform(p === filterPlatform ? "" : p)}
                      className={`rounded-xl border bg-white p-4 text-left transition-colors ${
                        filterPlatform === p
                          ? "border-zinc-900"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <p className="text-xs font-medium capitalize text-zinc-500">{p}</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight">{count}</p>
                    </button>
                  );
                })}
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
        <select
          value={filterLanguage}
          onChange={(e) => setFilterLanguage(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All languages</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
      </div>

      {logs.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-2">Platform</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Lang</th>
                <th className="px-4 py-2">Post preview</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => {
                const expanded = expandedId === l.id;
                return (
                  <Fragment key={l.id}>
                    <tr
                      className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50"
                      onClick={() => setExpandedId(expanded ? null : l.id)}
                    >
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${platformColor(l.platform)}`}
                        >
                          {l.platform}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusColor(l.status)}`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs uppercase">{l.language}</td>
                      <td className="px-4 py-2 text-xs">
                        <span className="line-clamp-1">{l.post_content}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500">
                        {formatDate(l.created_at)}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-zinc-100 bg-zinc-50">
                        <td colSpan={5} className="px-4 py-3 text-xs">
                          {l.error_message && (
                            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                              <strong>Error:</strong> {l.error_message}
                            </div>
                          )}
                          <p className="font-semibold text-zinc-500">Full post</p>
                          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-3 text-xs">
                            {l.post_content}
                          </pre>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="font-semibold text-zinc-500">Prompt ID</p>
                              <p className="mt-1 font-mono text-[10px]">
                                {l.prompt_id || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-500">Buffer post ID</p>
                              <p className="mt-1 font-mono text-[10px]">
                                {l.buffer_post_id || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-500">Run date</p>
                              <p className="mt-1">{l.run_date}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && stats && logs.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No posts match the current filters. Module 1 will populate this view once it runs.
        </div>
      )}
    </>
  );
}
