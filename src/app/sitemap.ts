import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getAllLearnSlugs } from "@/lib/learn-pages";
import { LOCALES } from "@/i18n/config";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://creative.artostudio.ai").replace(/\/+$/, "");

// Refresh the sitemap once an hour so new prompts get indexed without rebuilding.
export const revalidate = 3600;

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: ChangeFreq;
  priority?: number;
}

const STATIC_MARKETING_PATHS = [
  { path: "/", changeFrequency: "weekly" as ChangeFreq, priority: 1.0 },
  { path: "/pricing", changeFrequency: "monthly" as ChangeFreq, priority: 0.9 },
  { path: "/skills", changeFrequency: "monthly" as ChangeFreq, priority: 0.7 },
  { path: "/agents", changeFrequency: "monthly" as ChangeFreq, priority: 0.7 },
  { path: "/work", changeFrequency: "monthly" as ChangeFreq, priority: 0.7 },
  { path: "/prompts", changeFrequency: "daily" as ChangeFreq, priority: 0.9 },
  { path: "/learn", changeFrequency: "weekly" as ChangeFreq, priority: 0.8 },
  { path: "/tools", changeFrequency: "monthly" as ChangeFreq, priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly" as ChangeFreq, priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly" as ChangeFreq, priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Marketing pages: cross-product of LOCALES × paths.
  const localized: SitemapEntry[] = LOCALES.flatMap((loc) =>
    STATIC_MARKETING_PATHS.map((entry) => ({
      url: `${SITE_URL}/${loc}${entry.path === "/" ? "" : entry.path}`,
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
  );

  // /roast stays outside the locale tree (own design + flow).
  const standalone: SitemapEntry[] = [
    { url: `${SITE_URL}/roast`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // /learn/[slug] — 12 hardcoded SEO landings + any Content Factory
  // blog posts that have been published, × 2 locales.
  const learnSlugs = await getAllLearnSlugs();
  const learnEntries: SitemapEntry[] = LOCALES.flatMap((loc) =>
    learnSlugs.map((slug) => ({
      url: `${SITE_URL}/${loc}/learn/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as ChangeFreq,
      priority: 0.7,
    })),
  );

  // /prompts/[id] — pull list from Supabase, emit both locale variants.
  let promptEntries: SitemapEntry[] = [];
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const supabase = createClient(url, key);
      const { data } = await supabase
        .from("prompts")
        .select("id, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5000);
      if (data) {
        promptEntries = data.flatMap((p: { id: string; updated_at: string | null }) =>
          LOCALES.map((loc) => ({
            url: `${SITE_URL}/${loc}/prompts/${p.id}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : now,
            changeFrequency: "monthly" as ChangeFreq,
            priority: 0.5,
          })),
        );
      }
    }
  } catch {
    // Supabase not reachable at sitemap-gen time — ship the static slice and try again on the next revalidation.
  }

  return [...localized, ...standalone, ...learnEntries, ...promptEntries];
}
