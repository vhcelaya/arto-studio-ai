import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEARN_PAGES, type LearnPageConfig } from "@/lib/learn-config";
import { LOCALES, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

// Pre-generate the locale × slug cross-product so /en/learn/branding and
// /es/learn/branding are both built at compile time.
export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    LEARN_PAGES.map((p) => ({ locale, slug: p.slug })),
  );
}

function getPage(slug: string): LearnPageConfig | null {
  return LEARN_PAGES.find((p) => p.slug === slug) ?? null;
}

function pickTitle(page: LearnPageConfig, locale: Locale): string {
  return locale === "es" ? page.title_es : page.title_en;
}
function pickHero(page: LearnPageConfig, locale: Locale): string {
  return locale === "es" ? page.hero_es : page.hero_en;
}
function pickIntro(page: LearnPageConfig, locale: Locale): string {
  return locale === "es" ? page.intro_es : page.intro_en;
}
function pickUseCases(page: LearnPageConfig, locale: Locale): string[] {
  return locale === "es" ? page.use_cases_es : page.use_cases_en;
}
function pickMeta(page: LearnPageConfig, locale: Locale): string {
  return locale === "es" ? page.meta_description_es : page.meta_description_en;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const page = getPage(slug);
  if (!page) return {};
  const locale: Locale = isLocale(localeParam) ? localeParam : "en";
  return {
    title: pickTitle(page, locale),
    description: pickMeta(page, locale),
    alternates: { canonical: `/${locale}/learn/${page.slug}` },
    openGraph: {
      title: pickTitle(page, locale),
      description: pickMeta(page, locale),
    },
  };
}

export default async function LearnSlugPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const page = getPage(slug);
  if (!page) notFound();

  const t = getDictionary(locale).learn;
  const lp = (p: string) => `/${locale}${p.startsWith("/") ? p : "/" + p}`;
  const libraryHref = lp(`/prompts?category=${page.category}`);

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href={lp("/learn")}
        className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
      >
        {t.back_link}
      </Link>

      <h1 className="mt-6 text-4xl font-semibold tracking-tight">{pickHero(page, locale)}</h1>
      <p className="mt-4 text-neutral-700">{pickIntro(page, locale)}</p>

      <h2 className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
        {t.use_cases_h2}
      </h2>
      <ul className="mt-4 space-y-2 text-sm">
        {pickUseCases(page, locale).map((uc) => (
          <li key={uc} className="flex items-start gap-2">
            <span className="mt-1 text-neutral-400">•</span>
            <span className="text-neutral-700">{uc}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-xl border border-neutral-200 bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          {t.catalog_eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight">{t.catalog_h2}</h2>
        <p className="mt-2 text-sm text-neutral-600">{t.catalog_body}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={libraryHref}
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            {t.catalog_browse_prefix} {page.slug.replace("-", " ")} {t.catalog_browse_suffix}
          </Link>
          <Link
            href={lp("/pricing")}
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
          >
            {t.cta_pricing}
          </Link>
        </div>
      </div>

      <div className="mt-16 border-t border-neutral-200 pt-12">
        <h2 className="text-lg font-bold tracking-tight">{t.related_h2}</h2>
        <p className="mt-2 text-sm text-neutral-500">{t.related_body}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {LEARN_PAGES.filter((p) => p.slug !== page.slug).slice(0, 6).map((p) => (
            <Link
              key={p.slug}
              href={lp(`/learn/${p.slug}`)}
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
