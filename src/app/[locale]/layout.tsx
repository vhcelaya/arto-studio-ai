import { notFound } from "next/navigation";
import { LOCALES, isLocale, type Locale } from "@/i18n/config";

/* Locale gate: validate that the [locale] segment is one we actually ship.
 * Anything outside LOCALES 404s here rather than rendering a half-broken
 * page. We also pre-generate the static params so /en and /es are rendered
 * at build time (per-segment caching).
 */

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  // Cast for downstream type narrowing (not used directly here).
  void (locale as Locale);
  return <>{children}</>;
}
