"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface TraceEntry {
  id: number;
  brand_name: string;
  industry: string;
  company_size: string | null;
  overall_score: number;
  strategy_score: number;
  creativity_score: number;
  narrative_score: number;
  digital_score: number;
  source: "ai" | "fallback";
  model: string;
  latency_ms: number;
  email: string | null;
  created_at: string;
}

interface TraceStats {
  total: number;
  avgOverall: number;
  bySource: { ai: number; fallback: number };
  byIndustry: { industry: string; count: number; avg_score: number }[];
}

function scoreColor(score: number): string {
  if (score >= 7) return "text-emerald-600";
  if (score >= 5) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(score: number): string {
  if (score >= 7) return "bg-emerald-50 border-emerald-200";
  if (score >= 5) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

export default function AdminDashboard() {
  const [apiKey, setApiKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const [stats, setStats] = useState<TraceStats | null>(null);
  const [traces, setTraces] = useState<TraceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (key: string) => {
    setLoading(true);
    setError("");

    const headers = { Authorization: `Bearer ${key}` };

    try {
      const [statsRes, tracesRes] = await Promise.all([
        fetch("/api/traces?view=stats", { headers }),
        fetch("/api/traces?limit=50", { headers }),
      ]);

      if (statsRes.status === 401 || tracesRes.status === 401) {
        setAuthenticated(false);
        setAuthError("Invalid API key.");
        setLoading(false);
        return;
      }

      if (statsRes.status === 503) {
        setError("Database not configured. Add DATABASE_URL to enable trace storage.");
        setLoading(false);
        return;
      }

      const statsData = await statsRes.json();
      const tracesData = await tracesRes.json();

      setStats(statsData);
      setTraces(tracesData.traces || []);
    } catch {
      setError("Failed to fetch data. Check your connection.");
    }

    setLoading(false);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setAuthenticated(true);
    setAuthError("");
    localStorage.setItem("arto_admin_key", apiKey.trim());
    fetchData(apiKey.trim());
  }

  // Try to restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("arto_admin_key");
    if (saved) {
      setApiKey(saved);
      setAuthenticated(true);
      fetchData(saved);
    }
  }, [fetchData]);

  function handleLogout() {
    setAuthenticated(false);
    setApiKey("");
    setStats(null);
    setTraces([]);
    localStorage.removeItem("arto_admin_key");
  }

  // Auth gate
  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <nav className="border-b border-zinc-200 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/brand/arto-logo-black.png" alt="ARTO" width={80} height={24} className="h-6 w-auto" />
            <span className="text-sm font-medium tracking-wide text-zinc-500">ADMIN</span>
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-zinc-500">Enter your admin API key to access trace data.</p>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setAuthError(""); }}
                placeholder="Admin API Key"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-900"
              />
              {authError && <p className="text-xs text-red-500">{authError}</p>}
              <button
                type="submit"
                className="w-full rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/brand/arto-logo-black.png" alt="ARTO" width={80} height={24} className="h-6 w-auto" />
            <span className="text-sm font-medium tracking-wide text-zinc-500">ADMIN</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchData(apiKey)}
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-500 hover:text-red-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Roast Traces</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Every brand roast is a trace — input + output + metadata = learning signal.
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

        {/* Stats cards */}
        {stats && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Total Roasts</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Avg Score</p>
              <p className={`mt-2 text-3xl font-bold tracking-tight ${scoreColor(stats.avgOverall)}`}>
                {stats.avgOverall}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">AI Powered</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">{stats.bySource.ai}</p>
              <p className="mt-1 text-xs text-zinc-400">{stats.bySource.fallback} fallback</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Top Industry</p>
              <p className="mt-2 text-lg font-bold tracking-tight">
                {stats.byIndustry?.[0]?.industry ?? "—"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {stats.byIndustry?.[0]?.count ?? 0} roasts
              </p>
            </div>
          </div>
        )}

        {/* Industry breakdown */}
        {stats && stats.byIndustry.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">By Industry</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {stats.byIndustry.map((ind) => (
                <div
                  key={ind.industry}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 ${scoreBg(ind.avg_score)}`}
                >
                  <div>
                    <p className="text-sm font-medium">{ind.industry}</p>
                    <p className="text-xs text-zinc-500">{ind.count} roasts</p>
                  </div>
                  <p className={`text-lg font-bold ${scoreColor(ind.avg_score)}`}>
                    {ind.avg_score}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent traces table */}
        {traces.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent Roasts</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-widest text-zinc-400">
                    <th className="pb-3 pr-4">Brand</th>
                    <th className="pb-3 pr-4">Industry</th>
                    <th className="pb-3 pr-4 text-center">Overall</th>
                    <th className="pb-3 pr-4 text-center">S</th>
                    <th className="pb-3 pr-4 text-center">C</th>
                    <th className="pb-3 pr-4 text-center">N</th>
                    <th className="pb-3 pr-4 text-center">D</th>
                    <th className="pb-3 pr-4">Source</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {traces.map((trace) => (
                    <tr key={trace.id} className="border-b border-zinc-100 hover:bg-white transition-colors">
                      <td className="py-3 pr-4 font-medium">{trace.brand_name}</td>
                      <td className="py-3 pr-4 text-zinc-500">{trace.industry}</td>
                      <td className={`py-3 pr-4 text-center font-bold ${scoreColor(trace.overall_score)}`}>
                        {trace.overall_score}
                      </td>
                      <td className="py-3 pr-4 text-center">{trace.strategy_score}</td>
                      <td className="py-3 pr-4 text-center">{trace.creativity_score}</td>
                      <td className="py-3 pr-4 text-center">{trace.narrative_score}</td>
                      <td className="py-3 pr-4 text-center">{trace.digital_score}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            trace.source === "ai"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {trace.source}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-zinc-500 text-xs">
                        {trace.email || "—"}
                      </td>
                      <td className="py-3 text-zinc-400 text-xs whitespace-nowrap">
                        {new Date(trace.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && traces.length === 0 && stats?.total === 0 && (
          <div className="mt-12 text-center">
            <p className="text-lg font-medium text-zinc-400">No roasts yet</p>
            <p className="mt-2 text-sm text-zinc-400">
              Traces will appear here once brands start getting roasted.
            </p>
            <Link
              href="/roast"
              className="mt-6 inline-flex rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              Run a test roast
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
