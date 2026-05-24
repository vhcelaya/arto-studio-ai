"use client";

import Link from "next/link";
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

/* Small client island just for the active-tab highlight that needs to
 * read the current pathname. The parent EngineLayout stays server-side
 * so the auth gate runs before any client JS ships. */
export default function EngineTabs() {
  const pathname = usePathname();
  return (
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
  );
}
