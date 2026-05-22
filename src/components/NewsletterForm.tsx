"use client";

import { useState } from "react";

/* Lightweight newsletter signup. POSTs to /api/waitlist (already exists in
   arto-studio-ai). The waitlist table accepts arbitrary tier/source labels,
   so the same table holds both "skills" and "agents" waitlist sign-ups. */

interface Props {
  source?: "skills" | "agents" | "general";
  cta?: string;
}

export default function NewsletterForm({ source = "general", cta = "Notify me" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (res.ok) {
        setStatus("ok");
        setMessage("You're on the list. We'll be in touch.");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(data.error || "Something went wrong. Try again?");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again?");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="flex-1 rounded-md border border-neutral-300 px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
        disabled={status === "loading" || status === "ok"}
      />
      <button
        type="submit"
        disabled={status === "loading" || status === "ok"}
        className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {status === "loading" ? "Adding..." : status === "ok" ? "Added" : cta}
      </button>
      {message && (
        <p
          className={`text-xs ${
            status === "ok" ? "text-green-600" : status === "error" ? "text-red-600" : "text-neutral-500"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
