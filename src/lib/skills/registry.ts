import type { SkillDefinition, SkillCatalogEntry } from "./types";

/**
 * Central registry of all ARTO skills.
 * Skills register themselves at module import time via `registerSkill()`.
 * The registry is queried by the /api/skills/* routes and by alias routes.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry = new Map<string, SkillDefinition<any, any>>();

export function registerSkill<TIn, TOut>(skill: SkillDefinition<TIn, TOut>): void {
  if (registry.has(skill.slug)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[skills/registry] Skill '${skill.slug}' already registered, overwriting.`);
    }
  }
  registry.set(skill.slug, skill as SkillDefinition<unknown, unknown>);
}

export function getSkill(slug: string): SkillDefinition<unknown, unknown> | undefined {
  return registry.get(slug);
}

export function hasSkill(slug: string): boolean {
  return registry.has(slug);
}

export function listSkills(): SkillDefinition<unknown, unknown>[] {
  return Array.from(registry.values());
}

export function listPublicSkills(): SkillDefinition<unknown, unknown>[] {
  return listSkills().filter((s) => s.public);
}

/** Build a public catalog entry from a skill definition. */
export function toCatalogEntry(skill: SkillDefinition<unknown, unknown>): SkillCatalogEntry {
  // Input/output field names are inferred from the tool schema.
  const inputSchemaProps =
    (skill.outputToolSchema.input_schema as { properties?: Record<string, unknown> })
      ?.properties ?? {};
  const outputFields = Object.keys(inputSchemaProps);

  return {
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    public: skill.public,
    requiresWebFetch: skill.requiresWebFetch,
    // We don't expose the input validator internals; callers should check OpenAPI.
    inputFields: [],
    outputFields,
  };
}
