"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { authHeaders, formatDate } from "../../shared";

interface EngineRun {
  id: string;
  module: string;
  run_type: string;
  status: string;
  summary: Record<string, unknown>;
  items_processed: number;
  items_succeeded: number;
  items_failed: number;
  cost_usd: number;
  tokens_input: number;
  tokens_output: number;
  duration_ms: number | null;
  error_message: string | null;
  session_id: string | null;
  started_at: string;
  completed_at: string | null;
}

interface RunsStats {
  total: number;
  byModule: { module: string; count: number; total_cost: number }[];
  byStatus: { status: string; count: number }[];
  last24hRuns: number;
  last24hCost: number;
}

const MODULES = ["social", "outreach", "content", "intelligence", "scraper", "prompt_queue"];
const STATUSES = ["running", "success", "partial", "failed", "paused"];
const RUN_TYPES = ["scheduled", "manual", "triggered", "dry_run"];

function statusColor(status: string): string {
  switch (status) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "partial":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    case "running":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "paused":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    default:
      return "bg-zinc-50 text-zinc-600 border-zinc-200";
  }
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatCost(usd: number): string {
  if (usd === 0) return "$0";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}

export default function RunsPage() {
  const [apiKey, setApiKey] = useState("");
  const [stats, setStats] = useState<RunsStats | null>(null);
  const [runs, setRuns] = useState<EngineRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterModule, setFilterModule] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRunType, setFilterRunType] = useState("");

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
      if (filterModule) params.set("module", filterModule);
      if (filterStatus) params.set("status", filterStatus);
      if (filterRunType) params.set("run_type", filterRunType);
      params.set("limit", "50");

      const [statsRes, runsRes] = await Promise.all([
        fetch("/api/admin/engine/runs?view=stats", { headers: authHeaders(apiKey) }),
        fetch(`/api/admin/engine/runs?${params.toString()}`, { headers: authHeaders(apiKey) }),
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

      const statsData = (await statsRes.json()) as RunsStats;
      const runsData = (await runsRes.json()) as { runs: EngineRun[] };
      setStats(statsData);
      setRuns(runsData.runs || []);
    } catch {
      setError("Failed to fetch runs.");
    }
    setLoading(false);
  }, [apiKey, filterModule, filterStatus, filterRunType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Runs</h1>
      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-sm text-zinc-700">
        <p>
          <strong className="text-zinc-900">Qué es:</strong> auditoría de cada ejecución
          de cualquier módulo del engine (social, outreach, content, intelligence,
          scraper). Cada run tiene cost en USD, tokens consumidos, duración, status y un
          summary JSON con el detalle.
        </p>
        <p className="mt-1.5">
          <strong className="text-zinc-900">Cómo usarlo:</strong> click un module card
          para filtrar por módulo. Click una fila para expandir y ver el JSON.
          &ldquo;Last 24h&rdquo; es tu indicador de actividad — si está en 0, el engine
          no está corriendo.
        </p>
        <p className="mt-1.5">
          <strong className="text-zinc-900">Qué buscar:</strong> Failed &gt; 0 → ir a
          Signals para ver detalles. Cost 24h subiendo agresivo → revisar caps en Config.
        </p>
      </div>

      {loading && (
        <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          Loading runs...
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
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                Total runs
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                Last 24h
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{stats.last24hRuns}</p>
              <p className="mt-1 text-xs text-zinc-400">{formatCost(stats.last24hCost)} spent</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                Failed
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-red-600">
                {stats.byStatus.find((s) => s.status === "failed")?.count ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                Running
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-blue-600">
                {stats.byStatus.find((s) => s.status === "running")?.count ?? 0}
              </p>
            </div>
          </div>

          <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            By module
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stats.byModule.map((m) => (
              <button
                key={m.module}
                onClick={() =>
                  setFilterModule(m.module === filterModule ? "" : m.module)
                }
                className={`rounded-xl border bg-white p-4 text-left transition-colors ${
                  filterModule === m.module
                    ? "border-zinc-900"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <p className="text-xs font-medium text-zinc-500">{m.module}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-2xl font-bold tracking-tight">{m.count}</p>
                  <p className="text-xs text-zinc-400">{formatCost(m.total_cost)}</p>
                </div>
              </button>
            ))}
            {stats.byModule.length === 0 && (
              <p className="col-span-full text-sm text-zinc-500">
                No runs yet. Modules report here as soon as they execute.
              </p>
            )}
          </div>
        </>
      )}

      {/* Filters */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All modules</option>
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
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
          value={filterRunType}
          onChange={(e) => setFilterRunType(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {RUN_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {runs.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-2">Module</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Items</th>
                <th className="px-4 py-2">Cost</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const expanded = expandedId === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr
                      className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50"
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                    >
                      <td className="px-4 py-2 font-medium">{r.module}</td>
                      <td className="px-4 py-2 text-xs text-zinc-500">{r.run_type}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusColor(r.status)}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <span className="text-emerald-600">{r.items_succeeded}</span>
                        {r.items_failed > 0 && (
                          <span className="text-red-600"> / {r.items_failed}f</span>
                        )}
                        <span className="text-zinc-400"> · {r.items_processed}</span>
                      </td>
                      <td className="px-4 py-2 text-xs">{formatCost(r.cost_usd)}</td>
                      <td className="px-4 py-2 text-xs text-zinc-500">
                        {formatDuration(r.duration_ms)}
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500">
                        {formatDate(r.started_at)}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-zinc-100 bg-zinc-50">
                        <td colSpan={7} className="px-4 py-3 text-xs">
                          {r.error_message && (
                            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                              <strong>Error:</strong> {r.error_message}
                            </div>
                          )}
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="font-semibold text-zinc-500">Tokens</p>
                              <p className="mt-1">
                                in: {r.tokens_input.toLocaleString()} · out:{" "}
                                {r.tokens_output.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-500">Session</p>
                              <p className="mt-1 font-mono text-[10px]">
                                {r.session_id || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-500">Completed</p>
                              <p className="mt-1">
                                {r.completed_at ? formatDate(r.completed_at) : "—"}
                              </p>
                            </div>
                          </div>
                          {r.summary && Object.keys(r.summary).length > 0 && (
                            <details className="mt-3">
                              <summary className="cursor-pointer font-semibold text-zinc-500">
                                Summary JSON
                              </summary>
                              <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-[11px] text-zinc-100">
                                {JSON.stringify(r.summary, null, 2)}
                              </pre>
                            </details>
                          )}
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

      {!loading && !error && stats && runs.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No runs match the current filters.
        </div>
      )}
    </>
  );
}
