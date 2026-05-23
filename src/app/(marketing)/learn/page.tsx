import type { Metadata } from "next";
import Link from "next/link";
import { LEARN_PAGES } from "@/lib/learn-config";

export const metadata: Metadata = {
  title: "Learn — AI Prompts by Vertical | ARTO Studio AI",
  description:
    "Twelve guides to the 3,000 AI prompts in ARTO Studio AI Prompt Library, organized by creative vertical: branding, design, copywriting, video, music, and more.",
  alternates: { canonical: "/learn" },
};

export default function LearnIndex() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Learn</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Guides by vertical</h1>
      <p className="mt-3 max-w-2xl text-neutral-700">
        Twelve guides, one per creative vertical. Each is a short overview of
        what AI can do in that domain in 2026, plus where to find the matching
        prompts in the ARTO catalog.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LEARN_PAGES.map((page) => (
          <Link
            key={page.slug}
            href={`/learn/${page.slug}`}
            className="group rounded-xl border border-neutral-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Vertical
            </p>
            <h2 className="mt-2 text-lg font-semibold text-neutral-900">
              {page.hero_en}
            </h2>
            <p className="mt-2 line-clamp-3 text-sm text-neutral-600">
              {page.intro_en}
            </p>
            <p className="mt-4 text-xs font-medium text-neutral-500 group-hover:text-neutral-900">
              Read guide →
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-16 rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <h2 className="text-xl font-bold tracking-tight">
          Ready to use these prompts?
        </h2>
        <p className="mt-2 max-w-xl text-neutral-600 sm:mx-auto">
          The 3,000-prompt catalog is live. Browse free or unlock the full
          library for $9/mo.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/prompts"
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Browse the catalog
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
