"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LangSwitcher from "@/components/LangSwitcher";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/* Unified ARTO Studio AI Navigation. Products dropdown shows the 4-product
 * structure. Auth-aware: server passes the user prop so the right-side
 * button is "Sign in" (anon) or initials → /account (signed in).
 *
 * Locale-aware: every internal link is prefixed with /<locale>. The
 * marketing layout passes the active locale + dictionary slice (nav) so we
 * never have to thread strings through manually. The LangSwitcher
 * component handles toggling between locales. */

interface NavUser {
  email?: string | null;
}

interface Props {
  user: NavUser | null;
  locale: Locale;
  nav: Dictionary["nav"];
  /* Server-derived from ADMIN_EMAILS allowlist. Controls visibility of the
   * "Admin" link in the auth area — the /admin page itself still has its
   * own API-key gate, this is just to surface the entry point to admins. */
  isAdmin?: boolean;
}

function initialsOf(email?: string | null): string {
  if (!email) return "U";
  const local = email.split("@")[0] ?? "";
  if (local.length === 0) return "U";
  const parts = local.split(/[.\-_]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export default function Nav({ user, locale, nav, isAdmin = false }: Props) {
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const signedIn = Boolean(user);
  const lp = (p: string) => `/${locale}${p.startsWith("/") ? p : "/" + p}`;
  const LIBRARY_HREF = lp("/prompts");
  // /roast lives outside [locale] so we link to it directly.
  const ROAST_HREF = "/roast";

  // Click-outside + Escape close for the Products dropdown. Hover was the
  // original model but the 8px gap between trigger and menu sat outside
  // the relative wrapper, so moving the mouse down to click an option
  // fired onMouseLeave and closed the menu before the click landed.
  const productsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!productsOpen) return;
    function onClick(e: MouseEvent) {
      if (productsRef.current && !productsRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setProductsOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [productsOpen]);

  return (
    <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <Link href={lp("/")} className="flex items-baseline gap-2">
        <img src="/brand/arto-logo-black.png" alt="ARTO Creative 24/7" className="h-6 w-auto" />
        <span className="hidden text-sm font-medium tracking-tight text-neutral-500 sm:inline">
          {nav.tagline}
        </span>
      </Link>

      <div className="hidden items-center gap-6 text-sm md:flex">
        <div className="relative" ref={productsRef}>
          <button
            type="button"
            className="flex items-center gap-1 text-neutral-700 hover:text-neutral-900"
            onClick={() => setProductsOpen(!productsOpen)}
            aria-haspopup="menu"
            aria-expanded={productsOpen}
          >
            {nav.products}
            <svg
              className={`h-3 w-3 transition ${productsOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {productsOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
              <Link
                href={LIBRARY_HREF}
                className="block rounded-md px-3 py-2.5 hover:bg-neutral-50"
                onClick={() => setProductsOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">{nav.prompt_library}</span>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                    {nav.badge_live}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">{nav.prompt_library_blurb}</p>
              </Link>
              <Link
                href={lp("/skills")}
                className="block rounded-md px-3 py-2.5 hover:bg-neutral-50"
                onClick={() => setProductsOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">{nav.skills_studio}</span>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                    {nav.badge_soon}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">{nav.skills_studio_blurb}</p>
              </Link>
              <Link
                href={lp("/agents")}
                className="block rounded-md px-3 py-2.5 hover:bg-neutral-50"
                onClick={() => setProductsOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">{nav.ai_agents}</span>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                    {nav.badge_soon}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">{nav.ai_agents_blurb}</p>
              </Link>
              <div className="mt-1 border-t border-neutral-100 pt-1">
                <Link
                  href={ROAST_HREF}
                  className="block rounded-md px-3 py-2.5 hover:bg-neutral-50"
                  onClick={() => setProductsOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">{nav.brand_roast}</span>
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                      {nav.badge_free}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">{nav.brand_roast_blurb}</p>
                </Link>
              </div>
            </div>
          )}
        </div>

        <Link href={lp("/work")} className="text-neutral-700 hover:text-neutral-900">
          {nav.work}
        </Link>
        <Link href={lp("/pricing")} className="text-neutral-700 hover:text-neutral-900">
          {nav.pricing}
        </Link>
        <LangSwitcher current={locale} />
        {isAdmin && signedIn && (
          <Link
            href="/admin"
            className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 transition hover:border-amber-400"
            title="Admin panel"
          >
            Admin
          </Link>
        )}
        {signedIn ? (
          <Link
            href={lp("/account")}
            className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-neutral-700 transition hover:border-neutral-400"
            title={user?.email || undefined}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
              {initialsOf(user?.email)}
            </span>
            <span className="text-xs">{nav.account}</span>
          </Link>
        ) : (
          <Link
            href={lp("/login")}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-white transition hover:bg-neutral-700"
          >
            {nav.sign_in}
          </Link>
        )}
      </div>

      <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label={nav.menu}>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {mobileOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-neutral-200 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-xs font-semibold uppercase text-neutral-400">{nav.products}</p>
            <Link
              href={LIBRARY_HREF}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-neutral-700"
            >
              {nav.prompt_library}
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                {nav.badge_live}
              </span>
            </Link>
            <Link
              href={lp("/skills")}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-neutral-700"
            >
              {nav.skills_studio}
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                {nav.badge_soon}
              </span>
            </Link>
            <Link
              href={lp("/agents")}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-neutral-700"
            >
              {nav.ai_agents}
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                {nav.badge_soon}
              </span>
            </Link>
            <Link
              href={ROAST_HREF}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-neutral-700"
            >
              {nav.brand_roast}
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                {nav.badge_free}
              </span>
            </Link>
            <div className="my-1 border-t border-neutral-100" />
            <Link href={lp("/work")} onClick={() => setMobileOpen(false)} className="text-neutral-700">
              {nav.work}
            </Link>
            <Link href={lp("/pricing")} onClick={() => setMobileOpen(false)} className="text-neutral-700">
              {nav.pricing}
            </Link>
            <div className="my-1 border-t border-neutral-100" />
            <LangSwitcher current={locale} />
            {isAdmin && signedIn && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="mt-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800"
              >
                Admin
              </Link>
            )}
            {signedIn ? (
              <Link
                href={lp("/account")}
                onClick={() => setMobileOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-center text-neutral-700"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
                  {initialsOf(user?.email)}
                </span>
                <span>{nav.account}</span>
              </Link>
            ) : (
              <Link
                href={lp("/login")}
                onClick={() => setMobileOpen(false)}
                className="mt-1 rounded-md bg-neutral-900 px-3 py-2 text-center text-white"
              >
                {nav.sign_in}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
