import { LEARN_PAGES, type LearnPageConfig, type Category } from "@/lib/learn-config";
import { createAdminClient } from "@/lib/supabase/admin";

/* /learn data layer.
 *
 * The 12 vertical guides live as hardcoded TypeScript in learn-config.ts
 * (curated content, immutable from the UI). The Content Factory adds
 * more pages dynamically by inserting blog_post rows into
 * content_items; once an operator approves a row and the publisher
 * flips it to status='published', this module exposes it through the
 * same shape as the hardcoded ones.
 *
 * The reader functions below are what /learn and /learn/[slug] call.
 * They merge both sources and dedupe by slug (hardcoded wins if a
 * collision somehow makes it through — the publisher pre-checks for
 * this but defense-in-depth).
 *
 * Cached briefly because /learn is mostly-static and the publisher
 * triggers a revalidate when needed.
 */

const REVALIDATE_SECONDS = 60;

interface DynamicPage {
  slug: string;
  category: Category;
  title_en: string;
  title_es: string;
  meta_description_en: string;
  meta_description_es: string;
  hero_en: string;
  hero_es: string;
  intro_en: string;
  intro_es: string;
  use_cases_en: string[];
  use_cases_es: string[];
}

async function fetchPublishedBlogPosts(): Promise<DynamicPage[]> {
  try {
    const sb = createAdminClient();
    const { data } = await sb
      .from("content_items")
      .select("payload")
      .eq("type", "blog_post")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (!data) return [];
    const out: DynamicPage[] = [];
    for (const row of data) {
      const p = row.payload as Record<string, unknown>;
      if (
        typeof p.slug !== "string" ||
        typeof p.title_en !== "string" ||
        typeof p.title_es !== "string" ||
        typeof p.intro_en !== "string" ||
        typeof p.intro_es !== "string"
      ) {
        continue;
      }
      out.push({
        slug: p.slug,
        category: (typeof p.category === "string" ? (p.category as Category) : "creative_productivity"),
        title_en: p.title_en,
        title_es: p.title_es,
        meta_description_en: typeof p.meta_description_en === "string" ? p.meta_description_en : "",
        meta_description_es: typeof p.meta_description_es === "string" ? p.meta_description_es : "",
        hero_en: typeof p.hero_en === "string" ? p.hero_en : "",
        hero_es: typeof p.hero_es === "string" ? p.hero_es : "",
        intro_en: p.intro_en,
        intro_es: p.intro_es,
        use_cases_en: Array.isArray(p.use_cases_en) ? (p.use_cases_en as string[]) : [],
        use_cases_es: Array.isArray(p.use_cases_es) ? (p.use_cases_es as string[]) : [],
      });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Returns ALL /learn pages — hardcoded vertical guides + dynamic
 * blog_post items that the Content Factory has published. Hardcoded
 * wins on slug collision (shouldn't happen because the publisher
 * pre-checks, but the deduper guarantees it).
 */
export async function getAllLearnPages(): Promise<LearnPageConfig[]> {
  const dynamic = await fetchPublishedBlogPosts();
  const seen = new Set(LEARN_PAGES.map((p) => p.slug));
  const merged: LearnPageConfig[] = [...LEARN_PAGES];
  for (const d of dynamic) {
    if (seen.has(d.slug)) continue;
    merged.push(d as LearnPageConfig);
    seen.add(d.slug);
  }
  return merged;
}

/**
 * Returns one page by slug. Tries the hardcoded list first (faster, no
 * DB hit), then falls back to dynamic.
 */
export async function getLearnPageBySlug(slug: string): Promise<LearnPageConfig | null> {
  const hardcoded = LEARN_PAGES.find((p) => p.slug === slug);
  if (hardcoded) return hardcoded;
  const dynamic = await fetchPublishedBlogPosts();
  return (dynamic.find((p) => p.slug === slug) as LearnPageConfig | undefined) ?? null;
}

/**
 * Just the slugs, for generateStaticParams + sitemap.
 */
export async function getAllLearnSlugs(): Promise<string[]> {
  const pages = await getAllLearnPages();
  return pages.map((p) => p.slug);
}

export { REVALIDATE_SECONDS };

/* Recent published blog_posts with their brand image_url + meta —
 * used by the homepage "Latest from /learn" section so visitors see the
 * fresh content the operator just approved.
 *
 * Returns the N most recent rows ordered by published_at desc. Each
 * entry includes the image_url + image_provider written by the
 * Content Factory's generateAndStoreImage helper. Image is REQUIRED:
 * rows missing image_url are filtered out so the home grid never
 * shows a broken thumbnail. */
export interface RecentBlogPost {
  slug: string;
  title_en: string;
  title_es: string;
  meta_description_en: string;
  meta_description_es: string;
  image_url: string;
  published_at: string | null;
  category: Category | null;
}

export async function getRecentBlogPosts(limit = 6): Promise<RecentBlogPost[]> {
  try {
    const sb = createAdminClient();
    const { data } = await sb
      .from("content_items")
      .select("payload, published_at")
      .eq("type", "blog_post")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit * 3); // pull a few extras in case some lack images
    if (!data) return [];
    const out: RecentBlogPost[] = [];
    for (const row of data) {
      const p = row.payload as Record<string, unknown>;
      if (
        typeof p.slug !== "string" ||
        typeof p.image_url !== "string" ||
        !p.image_url ||
        typeof p.title_en !== "string" ||
        typeof p.title_es !== "string"
      ) continue;
      out.push({
        slug: p.slug,
        title_en: p.title_en,
        title_es: p.title_es,
        meta_description_en: typeof p.meta_description_en === "string" ? p.meta_description_en : "",
        meta_description_es: typeof p.meta_description_es === "string" ? p.meta_description_es : "",
        image_url: p.image_url,
        published_at: (row.published_at as string) ?? null,
        category: (typeof p.category === "string" ? (p.category as Category) : null),
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}
