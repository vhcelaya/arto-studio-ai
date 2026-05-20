"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/engine/scraping", label: "Scraping" },
  { href: "/admin/engine/runs", label: "Runs" },
  { href: "/admin/engine/signals", label: "Signals" },
  { href: "/admin/engine/social", label: "Social" },
  { href: "/admin/engine/attribution", label: "Attribution" },
  { href: "/admin/engine/gaps", label: "Gaps" },
  { href: "/admin/engine/config", label: "Config" },
];

export default function EngineLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [apiKey, setApiKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("arto_admin_key");
    if (saved) {
      setApiKey(saved);
      setAuthenticated(true);
    }
    setHydrated(true);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    localStorage.setItem("arto_admin_key", apiKey.trim());
    setAuthenticated(true);
  }

  function handleLogout() {
    localStorage.removeItem("arto_admin_key");
    setAuthenticated(false);
    setApiKey("");
  }

  if (!hydrated) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <nav className="border-b border-zinc-200 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/arto-logo-black.png"
              alt="ARTO"
              width={80}
              height={24}
              className="h-6 w-auto"
            />
            <span className="text-sm font-medium tracking-wide text-zinc-500">
              ADMIN · ENGINE
            </span>
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight">Engine Dashboard</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Enter your admin API key to see engine state.
            </p>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Admin API Key"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-900"
              />
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
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/arto-logo-black.png"
              alt="ARTO"
              width={80}
              height={24}
              className="h-6 w-auto"
            />
            <span className="text-sm font-medium tracking-wide text-zinc-500">
              ADMIN · ENGINE
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              ← Back to Admin
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-500 hover:text-red-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 px-6 pb-0">
          {TABS.map((t) => {
            const active = pathname === t.href || pathname?.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
