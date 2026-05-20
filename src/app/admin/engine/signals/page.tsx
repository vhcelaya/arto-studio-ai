"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { authHeaders, formatDate } from "../../shared";

interface EngineSignal {
  id: string;
  signal_type: string;
  severity: "info" | "warning" | "critical";
  module: string | null;
  payload: Record<string, unknown>;
  message: string | null;
  active: boolean;
  snoozed_until: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  expires_at: string | null;
}

interface SignalsStats {
  total: number;
  active: number;
  byType: { signal_type: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
}

const SIGNAL_TYPES = [
  "trending_vertical",
  "social_insight",
  "growth_anomaly",
  "churn_risk",
  "bounce_alert",
  "complaint_alert",
  "scrape_blocked",
  "budget_warning",
  "qc_reject_spike",
  "conversion_dip",
  "manual_pause",
  "module_error",
];

const SEVERITIES = ["info", "warning", "critical"];

function severityColor(sev: string): string {
  switch (sev) {
    case "critical":
      return "bg-red-50 text-red-700 border-red-200";
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "info":
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

export default function SignalsPage() {
  const [apiKey, setApiKey] = useState("");
  const [stats, setStats] = useState<SignalsStats | null>(null);
  const [signals, setSignals] = useState<EngineSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const [filterActive, setFilterActive] = useState<"true" | "false" | "">("true");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterType, setFilterType] = useState("");

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
      if (filterActive) params.set("active", filterActive);
      if (filterSeverity) params.set("severity", filterSeverity);
      if (filterType) params.set("signal_type", filterType);
      params.set("limit", "100");

      const [statsRes, signalsRes] = await Promise.all([
        fetch("/api/admin/engine/signals?view=stats", { headers: authHeaders(apiKey) }),
        fetch(`/api/admin/engine/signals?${params.toString()}`, {
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

      const statsData = (await statsRes.json()) as SignalsStats;
      const signalsData = (await signalsRes.json()) as { signals: EngineSignal[] };
      setStats(statsData);
      setSignals(signalsData.signals || []);
    } catch {
      setError("Failed to fetch signals.");
    }
    setLoading(false);
  }, [apiKey, filterActive, filterSeverity, filterType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleResolve(id: string) {
    if (!apiKey) return;
    setResolving(id);
    try {
      const res = await fetch("/api/admin/engine/signals", {
        method: "POST",
        headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchData();
      } else {
        setError(`Failed to resolve (HTTP ${res.status}).`);
      }
    } catch {
      setError("Failed to resolve signal.");
    }
    setResolving(null);
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Signals</h1>
      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-sm text-zinc-700">
        <p>
          <strong className="text-zinc-900">Qué es:</strong> alertas, anomalías y
          escalaciones que los módulos del engine emiten. Bounce alto, scraper
          bloqueado, conversion dip, churn risk, budget warning, etc.
        </p>
        <p className="mt-1.5">
          <strong className="text-zinc-900">Cómo usarlo:</strong> default filter es
          &ldquo;Active only&rdquo;. Click una type card para filtrar por tipo. Botón
          &ldquo;Resolve&rdquo; marca la señal como atendida (active=false).
        </p>
        <p className="mt-1.5">
          <strong className="text-zinc-900">Qué buscar:</strong> Active = 0 → engine
          sano. Critical aparece → pausa decisiones hasta entender qué pasó.
        </p>
      </div>

      {loading && (
        <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          Loading signals...
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
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Active</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{stats.active}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Critical</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-red-600">
                {stats.bySeverity.find((s) => s.severity === "critical")?.count ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Warning</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600">
                {stats.bySeverity.find((s) => s.severity === "warning")?.count ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">All-time</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{stats.total}</p>
            </div>
          </div>

          {stats.byType.length > 0 && (
            <>
              <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                Active by type
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stats.byType.map((t) => (
                  <button
                    key={t.signal_type}
                    onClick={() =>
                      setFilterType(t.signal_type === filterType ? "" : t.signal_type)
                    }
                    className={`rounded-xl border bg-white p-4 text-left transition-colors ${
                      filterType === t.signal_type
                        ? "border-zinc-900"
                        : "border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    <p className="text-xs font-medium text-zinc-500">{t.signal_type}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">{t.count}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Filters */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as "true" | "false" | "")}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        >
          <option value="true">Active only</option>
          <option value="false">Resolved only</option>
          <option value="">All</option>
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {SIGNAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {signals.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Module</th>
                <th className="px-4 py-2">Message</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s) => {
                const expanded = expandedId === s.id;
                return (
                  <Fragment key={s.id}>
                    <tr
                      className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50"
                      onClick={() => setExpandedId(expanded ? null : s.id)}
                    >
                      <td className="px-4 py-2 font-medium">{s.signal_type}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${severityColor(s.severity)}`}
                        >
                          {s.severity}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500">{s.module || "—"}</td>
                      <td className="px-4 py-2 text-xs">
                        <span className="line-clamp-1">{s.message || "—"}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500">
                        {formatDate(s.created_at)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {s.active && (
                          <button
                            disabled={resolving === s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolve(s.id);
                            }}
                            className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-50"
                          >
                            {resolving === s.id ? "..." : "Resolve"}
                          </button>
                        )}
                        {!s.active && s.resolved_at && (
                          <span className="text-xs text-zinc-400">
                            resolved {formatDate(s.resolved_at)}
                          </span>
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-zinc-100 bg-zinc-50">
                        <td colSpan={6} className="px-4 py-3 text-xs">
                          {s.payload && Object.keys(s.payload).length > 0 ? (
                            <details open>
                              <summary className="cursor-pointer font-semibold text-zinc-500">
                                Payload
                              </summary>
                              <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-[11px] text-zinc-100">
                                {JSON.stringify(s.payload, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <p className="text-zinc-500">No payload.</p>
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

      {!loading && !error && stats && signals.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No signals match the current filters. Quiet means modules are healthy.
        </div>
      )}
    </>
  );
}
