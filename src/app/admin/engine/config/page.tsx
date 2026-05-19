"use client";

import { useCallback, useEffect, useState } from "react";
import { authHeaders, formatDate } from "../../shared";

interface EngineConfigRow {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function categoryFor(key: string): string {
  if (key.startsWith("budget_")) return "Budget";
  if (key.startsWith("outreach_")) return "Outreach";
  if (key.startsWith("content_")) return "Content";
  if (key.startsWith("banned_")) return "Banned words";
  if (key.endsWith("_domains")) return "Domain lists";
  if (key === "engine_paused" || key === "legitimate_interest_min") return "Engine";
  return "Other";
}

export default function ConfigPage() {
  const [apiKey, setApiKey] = useState("");
  const [rows, setRows] = useState<EngineConfigRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("arto_admin_key");
    if (saved) setApiKey(saved);
  }, []);

  const fetchData = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/engine/config", { headers: authHeaders(apiKey) });
      if (res.status === 503) {
        setError("DATABASE_URL is not configured on the server.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(`Failed to fetch config (HTTP ${res.status}).`);
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { config: EngineConfigRow[] };
      setRows(data.config || []);
    } catch {
      setError("Failed to fetch engine config.");
    }
    setLoading(false);
  }, [apiKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const grouped = rows.reduce<Record<string, EngineConfigRow[]>>((acc, row) => {
    const cat = categoryFor(row.key);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(row);
    return acc;
  }, {});

  const enginePaused = rows.find((r) => r.key === "engine_paused");

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Engine config</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Runtime settings the engine reads each tick. Read-only here — mutations require
        a separate PR with a PATCH endpoint.
      </p>

      {loading && (
        <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          Loading config...
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {enginePaused && (
        <div
          className={`mt-8 rounded-xl border px-5 py-4 ${
            enginePaused.value === true
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                enginePaused.value === true ? "bg-red-500" : "bg-emerald-500"
              }`}
            />
            <strong className="text-sm">
              Engine is {enginePaused.value === true ? "PAUSED" : "RUNNING"}
            </strong>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-8 space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
                {category}
              </h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-widest text-zinc-500">
                    <tr>
                      <th className="px-4 py-2">Key</th>
                      <th className="px-4 py-2">Value</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.key} className="border-b border-zinc-100 last:border-0">
                        <td className="px-4 py-2 font-mono text-xs">{row.key}</td>
                        <td className="px-4 py-2">
                          <pre className="whitespace-pre-wrap break-words text-xs">
                            {formatValue(row.value)}
                          </pre>
                        </td>
                        <td className="px-4 py-2 text-xs text-zinc-500">
                          {row.description || "—"}
                        </td>
                        <td className="px-4 py-2 text-xs text-zinc-400">
                          {formatDate(row.updated_at)}
                          {row.updated_by && (
                            <span className="block">by {row.updated_by}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No engine_config rows found. Seed values are in
          asai-engine/migrations/001_engine.sql.
        </div>
      )}
    </>
  );
}
