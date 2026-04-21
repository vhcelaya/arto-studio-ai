"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function UpgradeInner() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client_id") || "";
  const canceled = searchParams.get("canceled") === "true";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade() {
    if (!clientId) {
      setError("No client_id in URL. Sign up first from the landing page.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to start checkout (HTTP ${res.status})`);
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Stripe did not return a checkout URL.");
    } catch {
      setError("Network error. Check your connection.");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto mt-16 max-w-2xl px-6">
      <h1 className="text-3xl font-bold tracking-tight">Upgrade to Starter</h1>
      <p className="mt-3 text-lg text-muted">
        You've used your 5 free trial calls. Starter unlocks unlimited Brand
        Positioning for $99/month.
      </p>

      {canceled && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout was canceled. You can upgrade anytime.
        </div>
      )}

      {!clientId && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          No <code>client_id</code> in the URL. Go back to <Link href="/#pricing" className="underline">the landing page</Link> and sign up first.
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-border bg-white p-8">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight">$99</span>
          <span className="text-muted">/month</span>
        </div>
        <p className="mt-2 text-sm text-muted">
          Cancel anytime. No long-term contract.
        </p>

        <ul className="mt-6 space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Unlimited Brand Positioning calls
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Same API key you got on signup — no switch needed
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Access to future gated skills as they ship
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Email support
          </li>
        </ul>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading || !clientId}
          className="mt-8 w-full rounded-full bg-foreground py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40"
        >
          {loading ? "Opening Stripe checkout…" : "Upgrade to Starter — $99/mo"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          Secure payment by Stripe. We never see your card details.
        </p>
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        Questions? Email <a className="underline" href="mailto:hello@artogroup.com">hello@artogroup.com</a>.
      </p>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <nav className="border-b border-border px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/arto-logo-black.png" alt="ARTO" width={80} height={24} className="h-6 w-auto" />
          <span className="text-sm font-medium tracking-wide text-muted">STUDIO AI</span>
        </Link>
      </nav>
      <Suspense fallback={null}>
        <UpgradeInner />
      </Suspense>
    </div>
  );
}
