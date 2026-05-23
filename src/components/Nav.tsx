"use client";

import Link from "next/link";
import { useState } from "react";

/* Unified ARTO Studio AI Navigation. Products dropdown shows the 4-product
   structure. Auth-aware: server passes the user prop so the right-side
   button is "Sign in" (anon) or initials → /account (signed in). */

const LIBRARY_HREF = "https://library.artostudio.ai/prompts";

interface NavUser {
  email?: string | null;
}

interface Props {
  user: NavUser | null;
}

function initialsOf(email?: string | null): string {
  if (!email) return "U";
  const local = email.split("@")[0] ?? "";
  if (local.length === 0) return "U";
  const parts = local.split(/[.\-_]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export default function Nav({ user }: Props) {
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const signedIn = Boolean(user);

  return (
    <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <Link href="/" className="flex items-baseline gap-2">
        <img src="/brand/arto-logo-black.png" alt="ARTO Studio AI" className="h-6 w-auto" />
        <span className="hidden text-sm font-medium tracking-tight text-neutral-500 sm:inline">
          / Studio AI
        </span>
      </Link>

      <div className="hidden items-center gap-6 text-sm md:flex">
        <div
          className="relative"
          onMouseEnter={() => setProductsOpen(true)}
          onMouseLeave={() => setProductsOpen(false)}
        >
          <button
            className="flex items-center gap-1 text-neutral-700 hover:text-neutral-900"
            onClick={() => setProductsOpen(!productsOpen)}
          >
            Products
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
              <a
                href={LIBRARY_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md px-3 py-2.5 hover:bg-neutral-50"
                onClick={() => setProductsOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">Prompt Library</span>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                    Live
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  3,000 bilingual prompts across 12 creative verticals
                </p>
              </a>
              <Link
                href="/skills"
                className="block rounded-md px-3 py-2.5 hover:bg-neutral-50"
                onClick={() => setProductsOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">Skills Studio</span>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                    Soon
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  AI-powered brand positioning, architecture, and creative tools
                </p>
              </Link>
              <Link
                href="/agents"
                className="block rounded-md px-3 py-2.5 hover:bg-neutral-50"
                onClick={() => setProductsOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">AI Agents</span>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                    Soon
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Autonomous creative workflows that run on your behalf
                </p>
              </Link>
              <div className="mt-1 border-t border-neutral-100 pt-1">
                <Link
                  href="/roast"
                  className="block rounded-md px-3 py-2.5 hover:bg-neutral-50"
                  onClick={() => setProductsOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">Brand Roast</span>
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                      Free
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Get an honest analysis of your brand. No signup required.
                  </p>
                </Link>
              </div>
            </div>
          )}
        </div>

        <Link href="/pricing" className="text-neutral-700 hover:text-neutral-900">
          Pricing
        </Link>
        {signedIn ? (
          <Link
            href="/account"
            className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-neutral-700 transition hover:border-neutral-400"
            title={user?.email || undefined}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
              {initialsOf(user?.email)}
            </span>
            <span className="text-xs">Account</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-white transition hover:bg-neutral-700"
          >
            Sign in
          </Link>
        )}
      </div>

      <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
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
            <p className="text-xs font-semibold uppercase text-neutral-400">Products</p>
            <a
              href={LIBRARY_HREF}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-neutral-700"
            >
              Prompt Library
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                Live
              </span>
            </a>
            <Link
              href="/skills"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-neutral-700"
            >
              Skills Studio
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                Soon
              </span>
            </Link>
            <Link
              href="/agents"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-neutral-700"
            >
              AI Agents
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                Soon
              </span>
            </Link>
            <Link
              href="/roast"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-neutral-700"
            >
              Brand Roast
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                Free
              </span>
            </Link>
            <div className="my-1 border-t border-neutral-100" />
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="text-neutral-700">
              Pricing
            </Link>
            {signedIn ? (
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-center text-neutral-700"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
                  {initialsOf(user?.email)}
                </span>
                <span>Account</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-1 rounded-md bg-neutral-900 px-3 py-2 text-center text-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
