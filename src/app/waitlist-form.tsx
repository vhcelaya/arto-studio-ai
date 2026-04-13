"use client";

import { useState } from "react";

export default function WaitlistForm({ source = "landing" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-center">
        <p className="text-sm font-medium text-emerald-800">
          You&apos;re on the list. We&apos;ll email you when we launch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
        placeholder="your@email.com"
        className="rounded-full border border-border px-6 py-3.5 text-sm outline-none focus:border-foreground sm:w-80"
        required
        disabled={status === "loading"}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-foreground px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
      >
        {status === "loading" ? "Joining..." : "Join Waitlist"}
      </button>
      {errorMsg && (
        <p className="w-full text-center text-xs text-red-500 sm:text-left">{errorMsg}</p>
      )}
    </form>
  );
}
