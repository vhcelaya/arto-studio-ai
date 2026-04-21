"use client";

import { useState } from "react";
import { keyHeadersWithJson, scoreColor } from "./shared";

interface PosInput {
  brandName: string;
  industry: string;
  targetAudience: string;
  competitorsRaw: string; // comma-separated in the UI, split on submit
  currentPositioning?: string;
  websiteUrl?: string;
  language: "es" | "en" | "both";
}

interface PositioningOutput {
  proposed_statement: { es: string; en: string };
  metaphor: { x_of_y: string; rationale: string };
  not_table: string[];
  scores: {
    specificity: number;
    operability: number;
    portability: number;
    codification: number;
    overall: number;
  };
  anti_patterns_detected: { pattern: string; evidence: string }[];
  competitor_confrontation: { competitor: string; their_angle: string; our_wedge: string }[];
  founder_repeat_test: string;
  brief_skeleton: {
    contexto: string;
    objetivo: string;
    concepto_estrategico: string;
    target_insight: string;
    posicionamiento: string;
    diferenciadores_clave: string[];
  };
  verdict: string;
}

interface PosResponse {
  skill: string;
  source: "ai" | "fallback";
  output: PositioningOutput;
  latencyMs: number;
  model: string;
}

export default function BrandPositioningRunner({
  apiKey,
  onDone,
}: {
  apiKey: string;
  onDone: () => void;
}) {
  const [input, setInput] = useState<PosInput>({
    brandName: "",
    industry: "",
    targetAudience: "",
    competitorsRaw: "",
    currentPositioning: "",
    websiteUrl: "",
    language: "both",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgradeUrl, setUpgradeUrl] = useState("");
  const [result, setResult] = useState<PosResponse | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const competitors = input.competitorsRaw
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (!input.brandName.trim() || !input.industry.trim() || !input.targetAudience.trim()) {
      setError("Brand name, industry, and target audience are required.");
      return;
    }
    if (competitors.length < 2) {
      setError("At least 2 named competitors are required (comma-separated).");
      return;
    }

    setLoading(true);
    setError("");
    setUpgradeUrl("");
    setResult(null);

    const body: Record<string, unknown> = {
      brandName: input.brandName.trim(),
      industry: input.industry.trim(),
      targetAudience: input.targetAudience.trim(),
      competitors,
      language: input.language,
    };
    if (input.currentPositioning?.trim()) body.currentPositioning = input.currentPositioning.trim();
    if (input.websiteUrl?.trim()) body.websiteUrl = input.websiteUrl.trim();

    try {
      const controller = new AbortController();
      const timeoutMs = 90_000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch("/api/skills/brand-positioning", {
        method: "POST",
        headers: keyHeadersWithJson(apiKey),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        if (data.upgrade_url) setUpgradeUrl(data.upgrade_url);
      } else {
        setResult(data as PosResponse);
        onDone();
      }
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "AbortError";
      if (aborted) {
        setError("Request timed out after 90s. Try again — usually resolves on the second attempt.");
      } else {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(`Network error: ${message}. The call may still be running on the server; check /admin → Skill Traces.`);
      }
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight">Brand Positioning</h2>
      <p className="mt-1 text-sm text-zinc-500">
        ARTO's positioning methodology applied to the brand. Takes ~20-30s. Produces a
        statement in ES/EN, metaphor, NOT table, 4-criteria scorecard, competitor wedges,
        and Brief skeleton.
      </p>

      <form onSubmit={run} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-xs">
          <span className="font-medium text-zinc-600">Brand name *</span>
          <input
            required
            value={input.brandName}
            onChange={(e) => setInput({ ...input, brandName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="font-medium text-zinc-600">Industry *</span>
          <input
            required
            value={input.industry}
            onChange={(e) => setInput({ ...input, industry: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="e.g. laundry services, developer tools"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          <span className="font-medium text-zinc-600">Target audience *</span>
          <input
            required
            value={input.targetAudience}
            onChange={(e) => setInput({ ...input, targetAudience: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="urban professionals 25-40 in Madrid"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          <span className="font-medium text-zinc-600">
            Competitors * (comma-separated, min 2)
          </span>
          <input
            required
            value={input.competitorsRaw}
            onChange={(e) => setInput({ ...input, competitorsRaw: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Cursor, GitHub Copilot, Continue"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          <span className="font-medium text-zinc-600">
            Current positioning (optional, audits anti-patterns if given)
          </span>
          <textarea
            rows={2}
            maxLength={500}
            value={input.currentPositioning}
            onChange={(e) => setInput({ ...input, currentPositioning: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
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
          />
        </label>
        <label className="text-xs">
          <span className="font-medium text-zinc-600">Language</span>
          <select
            value={input.language}
            onChange={(e) =>
              setInput({ ...input, language: e.target.value as PosInput["language"] })
            }
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="both">Both (ES + EN)</option>
            <option value="es">Español only</option>
            <option value="en">English only</option>
          </select>
        </label>
        <div className="sm:col-span-2 flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
          >
            {loading ? "Running positioning…" : "Run positioning"}
          </button>
          {error && (
            <span className="text-xs text-red-600">
              {error}
              {upgradeUrl && (
                <>
                  {" "}
                  <a className="underline" href={upgradeUrl}>
                    Upgrade →
                  </a>
                </>
              )}
            </span>
          )}
        </div>
      </form>

      {loading && (
        <div className="mt-10 flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          ARTO is positioning…
        </div>
      )}

      {result && <PositioningOutputView out={result.output} meta={result} />}
    </div>
  );
}

function PositioningOutputView({
  out,
  meta,
}: {
  out: PositioningOutput;
  meta: PosResponse;
}) {
  return (
    <div className="mt-10 space-y-8">
      <div className="flex items-baseline gap-4">
        <h3 className="text-2xl font-bold tracking-tight">Result</h3>
        <span className={`text-3xl font-bold ${scoreColor(out.scores.overall)}`}>
          {out.scores.overall}/10
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            meta.source === "ai"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {meta.source}
        </span>
        <span className="text-xs text-zinc-400">
          {(meta.latencyMs / 1000).toFixed(1)}s · {meta.model}
        </span>
      </div>

      <Section title="Proposed statement">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">ES</p>
            <p className="mt-1 text-base leading-relaxed">{out.proposed_statement.es}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">EN</p>
            <p className="mt-1 text-base leading-relaxed">{out.proposed_statement.en}</p>
          </div>
        </div>
      </Section>

      <Section title="Metaphor">
        <p className="text-xl font-semibold">{out.metaphor.x_of_y}</p>
        <p className="mt-2 text-sm text-zinc-600">{out.metaphor.rationale}</p>
      </Section>

      <Section title="Founder repeat test">
        <blockquote className="border-l-4 border-zinc-300 pl-4 text-base italic text-zinc-700">
          &ldquo;{out.founder_repeat_test}&rdquo;
        </blockquote>
      </Section>

      <Section title="Scorecard (ARTO 4-criteria rubric)">
        <div className="grid gap-3 sm:grid-cols-4">
          {(["specificity", "operability", "portability", "codification"] as const).map((k) => (
            <div key={k} className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{k}</p>
              <p className={`mt-1 text-2xl font-bold ${scoreColor(out.scores[k])}`}>
                {out.scores[k]}/10
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="What this brand is NOT">
        <ul className="space-y-2">
          {out.not_table.map((n, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="text-zinc-400">✕</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Competitor confrontation">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-widest text-zinc-400">
                <th className="pb-3 pr-4">Competitor</th>
                <th className="pb-3 pr-4">Their angle</th>
                <th className="pb-3">Our wedge</th>
              </tr>
            </thead>
            <tbody>
              {out.competitor_confrontation.map((c, i) => (
                <tr key={i} className="border-b border-zinc-100">
                  <td className="py-3 pr-4 font-medium">{c.competitor}</td>
                  <td className="py-3 pr-4 text-zinc-600">{c.their_angle}</td>
                  <td className="py-3 text-zinc-900">{c.our_wedge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {out.anti_patterns_detected.length > 0 && (
        <Section title="Anti-patterns in current positioning">
          <ul className="space-y-2">
            {out.anti_patterns_detected.map((a, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{a.pattern}</span>
                <span className="text-zinc-500"> — “{a.evidence}”</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Brief skeleton">
        <dl className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["Contexto", out.brief_skeleton.contexto],
              ["Objetivo", out.brief_skeleton.objetivo],
              ["Concepto estratégico", out.brief_skeleton.concepto_estrategico],
              ["Target insight", out.brief_skeleton.target_insight],
              ["Posicionamiento", out.brief_skeleton.posicionamiento],
            ] as const
          ).map(([label, text]) => (
            <div key={label}>
              <dt className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                {label}
              </dt>
              <dd className="mt-1 text-sm text-zinc-700">{text}</dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Diferenciadores clave
            </dt>
            <dd className="mt-1 space-y-1 text-sm text-zinc-700">
              {out.brief_skeleton.diferenciadores_clave.map((d, i) => (
                <p key={i}>— {d}</p>
              ))}
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="Verdict">
        <p className="text-base leading-relaxed text-zinc-900">{out.verdict}</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h4>
      <div className="mt-3">{children}</div>
    </div>
  );
}
