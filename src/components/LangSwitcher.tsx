"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LOCALES, LOCALE_META, type Locale, isLocale } from "@/i18n/config";

/* Flag-based language switcher.
 *
 * Renders the currently active locale's flag in the Nav. Clicking opens a
 * dropdown with the other locale(s). Selecting a locale links to the same
 * pathname under the new locale prefix and also sets a NEXT_LOCALE cookie
 * via document.cookie so subsequent root-level visits remember the choice.
 *
 * Locale derivation is deterministic from the URL: the proxy guarantees
 * every public path starts with /<locale>/, so we strip the first segment
 * and replace it. If the URL has no locale prefix (e.g. /api, /admin,
 * /studio), we fall back to the DEFAULT_LOCALE and link to /<new>/.
 */

interface Props {
  current: Locale;
}

function swapLocale(pathname: string, current: Locale, next: Locale): string {
  // Strip the leading slash, split into segments.
  const segs = pathname.replace(/^\/+/, "").split("/");
  if (segs.length > 0 && isLocale(segs[0])) {
    segs[0] = next;
    return "/" + segs.join("/");
  }
  // Pathname had no locale prefix — anchor to the new locale root.
  // Avoid double-slash and keep query/hash off (Link handles those).
  const cleaned = pathname.replace(new RegExp(`^/${current}(?=/|$)`), "");
  return `/${next}${cleaned || "/"}`.replace(/\/+$/, "") || `/${next}`;
}

export default function LangSwitcher({ current }: Props) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  const setCookie = () => {
    // The locale being selected is the OTHER one — the click handler reads
    // it from the link's data-locale. We just bump the cookie for whichever
    // gets clicked; the Link does the navigation.
  };

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-sm text-neutral-700 transition hover:border-neutral-400"
        aria-label={`Language: ${LOCALE_META[current].label}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="text-base leading-none" aria-hidden>
          {LOCALE_META[current].flag}
        </span>
        <span className="text-xs font-medium uppercase">{current}</span>
        <svg
          className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {LOCALES.map((loc) => {
            const meta = LOCALE_META[loc];
            const active = loc === current;
            return (
              <Link
                key={loc}
                role="menuitem"
                href={swapLocale(pathname, current, loc)}
                onClick={() => {
                  // Remember the choice for 1 year. Both the proxy and any
                  // root-level redirect honor this cookie.
                  document.cookie = `NEXT_LOCALE=${loc}; path=/; max-age=31536000; samesite=lax`;
                  setOpen(false);
                  setCookie();
                }}
                data-locale={loc}
                className={`flex items-center gap-2 px-3 py-2 text-sm ${
                  active ? "bg-neutral-50 font-semibold text-neutral-900" : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span className="text-base leading-none" aria-hidden>
                  {meta.flag}
                </span>
                <span>{meta.nativeName}</span>
                {active && <span className="ml-auto text-xs text-neutral-400">●</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
