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

interface Props {
  email: string;
}

/* Tab UI for the admin panel. The parent Server Component guarantees
 * the visitor is an admin — this client only renders the panel chrome
 * and delegates to per-tab components.
 *
 * Auth note: api calls below use cookie-based Supabase session auth.
 * No API key, no Authorization header. The empty string we pass to each
 * tab's `apiKey` prop is a transitional shim until the tab components
 * are refactored to stop accepting that prop entirely. */
export default function AdminClient({ email }: Props) {
  const [tab, setTab] = useState<Tab>("roast-traces");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedTab = localStorage.getItem("arto_admin_tab") as Tab | null;
    if (savedTab && TABS.some((t) => t.id === savedTab)) setTab(savedTab);
    // Wipe the legacy API key from any browser that still has it cached.
    localStorage.removeItem("arto_admin_key");
  }, []);

  useEffect(() => {
    localStorage.setItem("arto_admin_tab", tab);
  }, [tab]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/brand/arto-logo-black.png" alt="ARTO" width={80} height={24} className="h-6 w-auto" />
            <span className="text-sm font-medium tracking-wide text-zinc-500">ADMIN</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-zinc-400 sm:inline" title={email}>
              {email}
            </span>
            <Link
              href="/admin/engine"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Engine →
            </Link>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Refresh
            </button>
            <Link
              href="/auth/signout"
              className="text-sm text-zinc-500 hover:text-red-600 transition-colors"
            >
              Sign out
            </Link>
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
        {tab === "roast-traces" && <RoastTracesTab apiKey="" refreshKey={refreshKey} />}
        {tab === "clients" && <ClientsTab apiKey="" refreshKey={refreshKey} />}
        {tab === "skill-traces" && <SkillTracesTab apiKey="" refreshKey={refreshKey} />}
      </main>
    </div>
  );
}
