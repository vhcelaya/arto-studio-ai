// Locale configuration for the marketing surface.
//
// Two locales are first-class: English (US) and Spanish (Mexico). Each is
// represented by its country flag in the UI. The site is built with
// locale-prefixed routes: every marketing page lives under /[locale]/...,
// and the middleware redirects locale-less URLs to the best match for the
// visitor.
//
// Anything added here propagates to:
//   - middleware.ts (Accept-Language detection)
//   - LangSwitcher component
//   - dictionaries.ts entries
//   - generateStaticParams for [locale] segments
//
// Keep it tight. Don't add a locale unless we've shipped translations.

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Country flag emoji + display name shown in the LangSwitcher.
export const LOCALE_META: Record<Locale, { flag: string; label: string; nativeName: string }> = {
  en: { flag: "🇺🇸", label: "English", nativeName: "English" },
  es: { flag: "🇲🇽", label: "Español", nativeName: "Español (México)" },
};
