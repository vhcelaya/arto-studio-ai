"use client";

/**
 * Fallback runner for skills the Studio UI doesn't have a custom form
 * or renderer for yet. Shows a JSON input and a raw JSON output so the
 * team can at least invoke new skills the day they ship.
 */

import { useState } from "react";
import { keyHeadersWithJson } from "./shared";

export default function UnknownSkillRunner({
  apiKey,
  slug,
  name,
  description,
  onDone,
}: {
  apiKey: string;
  slug: string;
  name: string;
  description: string;
  onDone: () => void;
}) {
  const [input, setInput] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState<unknown>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    let body: unknown;
    try {
      body = JSON.parse(input);
    } catch {
      setError("Input must be valid JSON.");
      return;
    }
    setLoading(true);
    setError("");
    setOutput(null);
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: keyHeadersWithJson(apiKey),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || `HTTP ${res.status}`);
      setOutput(data);
      onDone();
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight">{name}</h2>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
      <p className="mt-2 text-xs text-amber-700">
        No custom form built yet for this skill. Send JSON directly.
      </p>
      <form onSubmit={run} className="mt-6 space-y-3">
        <label className="block text-xs">
          <span className="font-medium text-zinc-600">Request body (JSON)</span>
          <textarea
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
        >
          {loading ? "Running…" : "Run"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
      {output !== null && (
        <pre className="mt-6 max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs">
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}
