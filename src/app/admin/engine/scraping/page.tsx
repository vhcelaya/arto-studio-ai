"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authHeaders, formatDate } from "../../shared";

interface OutreachTarget {
  id: string;
  email: string | null;
  name: string | null;
  company: string | null;
  vertical: string | null;
  country: string | null;
  language: "en" | "es";
  source: string;
  profile_url: string | null;
  legitimate_interest_score: number | null;
  legitimate_interest_reasoning: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  qualified_at: string | null;
  last_contacted_at: string | null;
}

interface TargetsStats {
  total: number;
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
  byLanguage: { language: string; count: number }[];
  byCountry: { country: string | null; count: number }[];
}

const STATUSES = [
  "pending",
  "qualified",
  "rejected",
  "contacted",
  "converted",
  "unsubscribed",
  "exhausted",
  "bounced",
];

const SOURCES = [
  "atlas",
  "signup",
  "power_user",
  "gap_lead",
  "scraped_behance",
  "scraped_dribbble",
  "scraped_linkedin",
  "scraped_producthunt",
  "scraped_creativemarket",
  "scraped_domestika",
  "scraped_twitter",
  "scraped_other",
];

function sourceLabel(source: string): string {
  if (source.startsWith("scraped_")) {
    return source.replace("scraped_", "").replace(/^./, (c) => c.toUpperCase());
  }
  return source.replace(/^./, (c) => c.toUpperCase());
}

function statusColor(status: string): string {
  switch (status) {
    case "qualified":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "contacted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "converted":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "rejected":
    case "bounced":
    case "unsubscribed":
      return "bg-red-50 text-red-700 border-red-200";
    case "exhausted":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case "pending":
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

export default function ScrapingPage() {
  const [apiKey, setApiKey] = useState("");
  const [stats, setStats] = useState<TargetsStats | null>(null);
  const [targets, setTargets] = useState<OutreachTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");

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
      if (filterSource) params.set("source", filterSource);
      if (filterLanguage) params.set("language", filterLanguage);
      params.set("limit", "100");

      const [statsRes, targetsRes] = await Promise.all([
        fetch("/api/admin/engine/targets?view=stats", { headers: authHeaders(apiKey) }),
        fetch(`/api/admin/engine/targets?${params.toString()}`, {
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

      const statsData = (await statsRes.json()) as TargetsStats;
      const targetsData = (await targetsRes.json()) as { targets: OutreachTarget[] };
      setStats(statsData);
      setTargets(targetsData.targets || []);
    } catch {
      setError("Failed to fetch outreach targets.");
    }
    setLoading(false);
  }, [apiKey, filterStatus, filterSource, filterLanguage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sourceCards = useMemo(() => {
    if (!stats) return [];
    const map = new Map<string, number>();
    stats.bySource.forEach((s) => map.set(s.source, s.count));
    return SOURCES.map((source) => ({ source, count: map.get(source) || 0 }));
  }, [stats]);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Scraping</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Outreach targets across all sources. Atlas seeds + scraped leads + signup conversions.
      </p>

      {loading && (
        <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          Loading targets...
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* Top-level stats */}
      {stats && (
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Total targets</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Qualified</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
              {stats.byStatus.find((s) => s.status === "qualified")?.count ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Contacted</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-blue-600">
              {stats.byStatus.find((s) => s.status === "contacted")?.count ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Converted</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-purple-600">
              {stats.byStatus.find((s) => s.status === "converted")?.count ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Platform / source cards */}
      {stats && (
        <>
          <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            By source
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sourceCards.map((card) => (
              <button
                key={card.source}
                onClick={() =>
                  setFilterSource(card.source === filterSource ? "" : card.source)
                }
                className={`rounded-xl border bg-white p-4 text-left transition-colors ${
                  filterSource === card.source
                    ? "border-zinc-900"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <p className="text-xs font-medium text-zinc-500">{sourceLabel(card.source)}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{card.count}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Filters */}
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
        {filterSource && (
          <button
            onClick={() => setFilterSource("")}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 hover:border-zinc-400"
          >
            Source: {sourceLabel(filterSource)} ×
          </button>
        )}
      </div>

      {/* Table */}
      {targets.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-2">Target</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Lang</th>
                <th className="px-4 py-2">LI Score</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2">
                    <div className="font-medium">{t.name || t.company || t.email || "—"}</div>
                    <div className="text-xs text-zinc-500">{t.email || t.profile_url || ""}</div>
                  </td>
                  <td className="px-4 py-2 text-xs">{sourceLabel(t.source)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusColor(t.status)}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs uppercase">{t.language}</td>
                  <td className="px-4 py-2 text-xs">
                    {t.legitimate_interest_score != null
                      ? t.legitimate_interest_score.toFixed(0)
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-zinc-500">
                    {formatDate(t.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && stats && targets.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No targets match the current filters. Once Module 4 (Scraper) and Atlas backfill
          run, this view will populate.
        </div>
      )}
    </>
  );
}
