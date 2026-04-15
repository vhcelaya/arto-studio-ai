import fs from "fs";
import path from "path";

/**
 * ARTO knowledge loader.
 * Reads methodology files from /knowledge/ at runtime and caches them
 * per-key so each skill can load only the slices it needs.
 *
 * Adding new knowledge:
 *   1. Drop a .md file somewhere in /knowledge/
 *   2. Register it in KNOWLEDGE_MAP below under a short key
 *   3. Reference the key from a skill's `knowledgeKeys` array
 */

const KNOWLEDGE_MAP: Record<string, string> = {
  strategy: "knowledge/methodology/strategy.md",
  narrative: "knowledge/methodology/narrative.md",
  positioning: "knowledge/methodology/positioning.md",
  rubric: "knowledge/quality/rubric.md",
  trends: "knowledge/trends/current.md",
  // Future keys — placeholders, will resolve to empty string until files exist:
  // creativity: "knowledge/methodology/creativity.md",
  // production: "knowledge/methodology/production.md",
  // digital: "knowledge/methodology/digital.md",
};

const cache = new Map<string, string>();

function readFile(relPath: string): string {
  try {
    const fullPath = path.join(/* turbopackIgnore: true */ process.cwd(), relPath);
    return fs.readFileSync(fullPath, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Load a specific set of knowledge slices by key.
 * Unknown keys are silently skipped so skills remain robust as knowledge grows.
 */
export function loadKnowledge(keys: string[]): string {
  const sections: string[] = [];

  for (const key of keys) {
    if (cache.has(key)) {
      const cached = cache.get(key)!;
      if (cached) sections.push(cached);
      continue;
    }

    const relPath = KNOWLEDGE_MAP[key];
    if (!relPath) {
      cache.set(key, "");
      continue;
    }

    const content = readFile(relPath);
    cache.set(key, content);
    if (content) sections.push(content);
  }

  return sections.join("\n\n---\n\n");
}

/**
 * Legacy wrapper: loads the default set used by the Brand Roast skill
 * (strategy + narrative + rubric + trends). Retained for backward compat
 * with code that imports getKnowledgeContext() directly.
 */
export function getKnowledgeContext(): string {
  return loadKnowledge(["strategy", "narrative", "rubric", "trends"]);
}

/**
 * List every registered knowledge key (for debugging / admin).
 */
export function listKnowledgeKeys(): string[] {
  return Object.keys(KNOWLEDGE_MAP);
}
