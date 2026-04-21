"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import RoastTracesTab from "./RoastTracesTab";
import ClientsTab from "./ClientsTab";
import SkillTracesTab from "./SkillTracesTab";

type Tab = "roast-traces" | "clients" | "skill-traces";

const TABS: { id: Tab; label: string }[] = [
  { id: "roast-traces", label: "Roast Traces" },
  { id: "clients", label: "Clients" },
  { id: "skill-traces", label: "Skill Traces" },
];

export default function AdminDashboard() {
  const [apiKey, setApiKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("roast-traces");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setAuthenticated(true);
    setAuthError("");
    localStorage.setItem("arto_admin_key", apiKey.trim());
  }

  useEffect(() => {
    const saved = localStorage.getItem("arto_admin_key");
    if (saved) {
      setApiKey(saved);
      setAuthenticated(true);
    }
    const savedTab = localStorage.getItem("arto_admin_tab") as Tab | null;
    if (savedTab && TABS.some((t) => t.id === savedTab)) setTab(savedTab);
  }, []);

  useEffect(() => {
    if (authenticated) localStorage.setItem("arto_admin_tab", tab);
  }, [tab, authenticated]);

  function handleLogout() {
    setAuthenticated(false);
    setApiKey("");
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
            <p className="mt-2 text-sm text-zinc-500">
              Enter your admin API key to manage clients and view traces.
            </p>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setAuthError("");
                }}
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
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/brand/arto-logo-black.png" alt="ARTO" width={80} height={24} className="h-6 w-auto" />
            <span className="text-sm font-medium tracking-wide text-zinc-500">ADMIN</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
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
        {/* Tab bar */}
        <div className="mx-auto flex max-w-6xl gap-1 px-6 pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        {tab === "roast-traces" && (
          <RoastTracesTab apiKey={apiKey} refreshKey={refreshKey} />
        )}
        {tab === "clients" && <ClientsTab apiKey={apiKey} refreshKey={refreshKey} />}
        {tab === "skill-traces" && (
          <SkillTracesTab apiKey={apiKey} refreshKey={refreshKey} />
        )}
      </main>
    </div>
  );
}
