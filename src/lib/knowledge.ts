import fs from "fs";
import path from "path";

let cachedKnowledge: string | null = null;

const KNOWLEDGE_FILES = [
  "knowledge/methodology/strategy.md",
  "knowledge/methodology/narrative.md",
  "knowledge/quality/rubric.md",
  "knowledge/trends/current.md",
];

export function getKnowledgeContext(): string {
  if (cachedKnowledge) return cachedKnowledge;

  const sections: string[] = [];

  for (const file of KNOWLEDGE_FILES) {
    try {
      const fullPath = path.join(/* turbopackIgnore: true */ process.cwd(), file);
      const content = fs.readFileSync(fullPath, "utf-8");
      sections.push(content);
    } catch {
      // Skip missing files gracefully
    }
  }

  cachedKnowledge = sections.join("\n\n---\n\n");
  return cachedKnowledge;
}
