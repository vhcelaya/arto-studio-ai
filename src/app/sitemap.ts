import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { LEARN_PAGES } from "@/lib/learn-config";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: SitemapEntry[] = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/skills`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/agents`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/work`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/prompts`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/learn`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/roast`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const learnEntries: SitemapEntry[] = LEARN_PAGES.map((page) => ({
    url: `${SITE_URL}/learn/${page.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Pull live prompt IDs from Supabase (anon key, public select).
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
        promptEntries = data.map((p: { id: string; updated_at: string | null }) => ({
          url: `${SITE_URL}/prompts/${p.id}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : now,
          changeFrequency: "monthly" as ChangeFreq,
          priority: 0.5,
        }));
      }
    }
  } catch {
    // Supabase not reachable at sitemap-gen time — ship the static slice and try again on the next revalidation.
  }

  return [...staticEntries, ...learnEntries, ...promptEntries];
}
