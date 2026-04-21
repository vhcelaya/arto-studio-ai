"use client";

import { useState } from "react";

interface SignupSuccess {
  client_id: string;
  api_key: string;
  email: string;
  trial_calls_remaining: number;
  upgrade_url: string;
}

export default function SignupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SignupSuccess | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed. Try again.");
        setLoading(false);
        return;
      }
      setResult(data as SignupSuccess);
    } catch {
      setError("Network error. Check your connection.");
    }
    setLoading(false);
  }

  function handleClose() {
    // If there's a result (key visible), require confirm — key is only shown once.
    if (result && !confirm("Did you copy your API key? It won't be shown again.")) return;
    setEmail("");
    setName("");
    setError("");
    setResult(null);
    setCopied(false);
    onClose();
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {!result ? (
          <>
            <h2 className="text-2xl font-bold tracking-tight">Start free trial</h2>
            <p className="mt-2 text-sm text-zinc-500">
              5 free calls to Brand Positioning. No card required, no expiration.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-zinc-600">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@company.com"
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-900"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-zinc-600">Name (optional)</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Victor Celaya"
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-900"
                />
              </label>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex-1 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40"
                >
                  {loading ? "Creating account…" : "Start trial"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-sm text-zinc-500 hover:text-zinc-900"
                >
                  Cancel
                </button>
              </div>
            </form>
            <p className="mt-4 text-xs text-zinc-400">
              By signing up you agree to receive your API key via email.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold tracking-tight">Your API key</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Copy this now — it will NOT be shown again. We also emailed it to{" "}
              <strong>{result.email}</strong>.
            </p>
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <code className="block break-all font-mono text-xs text-zinc-900">
                {result.api_key}
              </code>
              <button
                onClick={handleCopy}
                className="mt-3 text-xs font-medium text-emerald-700 hover:text-emerald-900"
              >
                {copied ? "✓ Copied" : "Copy to clipboard"}
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Quick start
              </p>
              <pre className="mt-2 overflow-x-auto rounded bg-white p-3 font-mono text-[11px] leading-relaxed text-zinc-700">
{`curl -X POST https://arto-studio-ai.vercel.app/api/skills/brand-positioning \\
  -H "Content-Type: application/json" \\
  -H "x-arto-api-key: ${result.api_key.slice(0, 20)}…" \\
  -d '{"brandName":"Your Brand","industry":"…","targetAudience":"…","competitors":["a","b"]}'`}
              </pre>
            </div>

            <p className="mt-6 text-xs text-zinc-500">
              You have <strong>{result.trial_calls_remaining} free calls</strong>. When
              you run out, upgrade to Starter ($99/mo, unlimited).
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href={result.upgrade_url}
                className="flex-1 rounded-full bg-zinc-900 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Upgrade to Starter
              </a>
              <button
                onClick={handleClose}
                className="text-sm text-zinc-500 hover:text-zinc-900"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
