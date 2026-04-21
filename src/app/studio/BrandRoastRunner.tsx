"use client";

import { useState } from "react";
import { keyHeadersWithJson, scoreColor } from "./shared";

interface RoastInput {
  brandName: string;
  industry: string;
  description?: string;
  websiteUrl?: string;
  companySize?: string;
}

interface RoastPillar {
  score: number;
  roast: string;
}

interface RoastOutput {
  strategy: RoastPillar;
  creativity: RoastPillar;
  narrative: RoastPillar;
  digital: RoastPillar;
  verdict: string;
  improvements: string[];
  overall: number;
}

interface RoastResponse {
  skill: string;
  source: "ai" | "fallback";
  output: RoastOutput;
  latencyMs: number;
  model: string;
}

export default function BrandRoastRunner({
  apiKey,
  onDone,
}: {
  apiKey: string;
  onDone: () => void;
}) {
  const [input, setInput] = useState<RoastInput>({
    brandName: "",
    industry: "",
    description: "",
    websiteUrl: "",
    companySize: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RoastResponse | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!input.brandName.trim() || !input.industry.trim()) {
      setError("Brand name and industry are required.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const body: RoastInput = {
        brandName: input.brandName.trim(),
        industry: input.industry.trim(),
      };
      if (input.description?.trim()) body.description = input.description.trim();
      if (input.websiteUrl?.trim()) body.websiteUrl = input.websiteUrl.trim();
      if (input.companySize?.trim()) body.companySize = input.companySize.trim();

      const res = await fetch("/api/skills/brand-roast", {
        method: "POST",
        headers: keyHeadersWithJson(apiKey),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
      } else {
        setResult(data as RoastResponse);
        onDone();
      }
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight">Brand Roast</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Brutally honest brand evaluation across 4 ARTO pillars. Takes ~15-25s.
      </p>

      <form onSubmit={run} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-xs">
          <span className="font-medium text-zinc-600">Brand name *</span>
          <input
            required
            value={input.brandName}
            onChange={(e) => setInput({ ...input, brandName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Acme Co"
          />
        </label>
        <label className="text-xs">
          <span className="font-medium text-zinc-600">Industry *</span>
          <input
            required
            value={input.industry}
            onChange={(e) => setInput({ ...input, industry: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="SaaS, direct-to-consumer, fintech…"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          <span className="font-medium text-zinc-600">Description (optional)</span>
          <textarea
            rows={2}
            maxLength={500}
            value={input.description}
            onChange={(e) => setInput({ ...input, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="What the brand does, key claims, tagline"
          />
        </label>
        <label className="text-xs">
          <span className="font-medium text-zinc-600">Website URL (optional)</span>
          <input
            type="url"
            maxLength={200}
            value={input.websiteUrl}
            onChange={(e) => setInput({ ...input, websiteUrl: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="https://acme.com"
          />
        </label>
        <label className="text-xs">
          <span className="font-medium text-zinc-600">Company size (optional)</span>
          <select
            value={input.companySize}
            onChange={(e) => setInput({ ...input, companySize: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            <option value="solo founder">solo founder</option>
            <option value="startup (1-10)">startup (1-10)</option>
            <option value="scaleup (10-100)">scaleup (10-100)</option>
            <option value="enterprise (100+)">enterprise (100+)</option>
          </select>
        </label>

        <div className="sm:col-span-2 flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !input.brandName.trim() || !input.industry.trim()}
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
          >
            {loading ? "Running roast…" : "Run roast"}
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </form>

      {loading && (
        <div className="mt-10 flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          ARTO is thinking…
        </div>
      )}

      {result && (
        <div className="mt-10 space-y-6">
          <div className="flex items-baseline gap-4">
            <h3 className="text-2xl font-bold tracking-tight">{input.brandName}</h3>
            <span className={`text-3xl font-bold tracking-tight ${scoreColor(result.output.overall)}`}>
              {result.output.overall}/10
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                result.source === "ai"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {result.source}
            </span>
            <span className="text-xs text-zinc-400">
              {(result.latencyMs / 1000).toFixed(1)}s · {result.model}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(["strategy", "creativity", "narrative", "digital"] as const).map((p) => (
              <div key={p} className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    {p}
                  </p>
                  <p className={`text-2xl font-bold ${scoreColor(result.output[p].score)}`}>
                    {result.output[p].score}/10
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                  {result.output[p].roast}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-zinc-50 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Verdict</p>
            <p className="mt-2 text-base leading-relaxed text-zinc-900">{result.output.verdict}</p>
          </div>

          <div className="rounded-xl border border-border bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Where to start
            </p>
            <ol className="mt-3 space-y-2">
              {(Array.isArray(result.output.improvements) ? result.output.improvements : []).map(
                (imp, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-zinc-700">{imp}</span>
                  </li>
                )
              )}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
