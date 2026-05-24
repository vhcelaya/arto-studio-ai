import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEARN_PAGES, type LearnPageConfig } from "@/lib/learn-config";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LEARN_PAGES.map((p) => ({ slug: p.slug }));
}

function getPage(slug: string): LearnPageConfig | null {
  return LEARN_PAGES.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) return {};
  return {
    title: page.title_en,
    description: page.meta_description_en,
    alternates: { canonical: `/learn/${page.slug}` },
    openGraph: {
      title: page.title_en,
      description: page.meta_description_en,
    },
  };
}

const LIBRARY_BASE = "/prompts";

export default async function LearnSlugPage({ params }: Props) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();

  // category enum value maps loosely to library filter param (snake_case match)
  const libraryHref = `${LIBRARY_BASE}?category=${page.category}`;

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/learn"
        className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
      >
        ← All guides
      </Link>

      <h1 className="mt-6 text-4xl font-semibold tracking-tight">{page.hero_en}</h1>
      <p className="mt-4 text-neutral-700">{page.intro_en}</p>

      <h2 className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Common use cases
      </h2>
      <ul className="mt-4 space-y-2 text-sm">
        {page.use_cases_en.map((uc) => (
          <li key={uc} className="flex items-start gap-2">
            <span className="mt-1 text-neutral-400">•</span>
            <span className="text-neutral-700">{uc}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-xl border border-neutral-200 bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Catalog
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight">
          250 prompts in this vertical
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Each one is production-grade, bilingual (EN / ES), with a tested
          workflow. Browse the catalog for the full list or unlock the Pro tier
          for unlimited access.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={libraryHref}
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Browse {page.slug.replace("-", " ")} prompts →
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
          >
            See pricing
          </Link>
        </div>
      </div>

      <div className="mt-16 border-t border-neutral-200 pt-12">
        <h2 className="text-lg font-bold tracking-tight">Related</h2>
        <p className="mt-2 text-sm text-neutral-500">More vertical guides:</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {LEARN_PAGES.filter((p) => p.slug !== page.slug).slice(0, 6).map((p) => (
            <Link
              key={p.slug}
              href={`/learn/${p.slug}`}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 hover:border-neutral-400"
            >
              {p.slug.replace("-", " ")}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
