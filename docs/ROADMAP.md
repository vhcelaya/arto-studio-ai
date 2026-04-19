# ARTO Studio AI — Roadmap & session handoff

This document is the source of truth for what's done, what's in progress, and what comes next. Any new Claude session (local, Dispatch, Mac Mini) should read this first to get oriented without needing the previous conversation.

Last updated: 2026-04-19

---

## The strategic frame

ARTO Studio AI is not just an app. It is a software-native brand strategy firm operated by agents. Each skill in the skills library is an "employee." Brand Roast is the public funnel; every other skill is gated behind a client API key and monetized. Every call writes a trace to `skill_traces` — the knowledge base gets smarter over time because traces feed quarterly reviews of `/knowledge/`.

Read these three memory files for full strategic context:
- `memory/project_agentic_company_vision.md` — ARTO as an agentic company (north star)
- `memory/project_agent_skills_strategy.md` — agent skills as distribution strategy
- `memory/project_continual_learning.md` — 3-layer learning architecture

Authoring docs live in-repo:
- `docs/ADDING_A_SKILL.md` — 4-step playbook for adding a new skill
- `docs/KNOWLEDGE_INTAKE.md` — 6-question methodology for building `/knowledge/*.md`

---

## Current state (2026-04-19)

### Infrastructure ✅
- Next.js 16.2.1 app deployed to Vercel: https://arto-studio-ai.vercel.app
- Neon Postgres with live tables: `clients`, `skill_traces`, `roast_traces`, `waitlist`
- Env vars in Vercel prod: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ADMIN_API_KEY`, `DATABASE_URL`, `ARTO_API_KEY_SALT`
- Skills engine stable (`src/lib/skills/engine.ts`, `registry.ts`, `types.ts`) — do NOT modify when adding skills
- Client auth + gating (`src/lib/clients/store.ts`, `auth.ts`)
- Routes: `/api/skills`, `/api/skills/[slug]`, `/api/roast`, `/api/admin/clients`, `/api/traces`

### Registered skills
| Slug | Public | Knowledge keys | Status |
|---|---|---|---|
| `brand-roast` | ✅ yes | strategy, narrative, rubric, trends | Live. Funnel/marketing. |
| `brand-positioning` | ❌ no (gated) | positioning, strategy, rubric, trends | Live. First gated skill. |

### Knowledge base (`/knowledge/`)
| Slice key | File | Owner |
|---|---|---|
| `strategy` | `knowledge/methodology/strategy.md` | victor |
| `narrative` | `knowledge/methodology/narrative.md` | victor |
| `positioning` | `knowledge/methodology/positioning.md` | victor |
| `rubric` | `knowledge/quality/rubric.md` | victor |
| `trends` | `knowledge/trends/current.md` | victor |

All slices have frontmatter with `last_reviewed` + `owner`. Canonical source of truth for these docs lives outside the repo at `Shared drives/CLAUDE DRIVE/CC Project Folders/CC ARTO ARTO Studio AI Project/knowledge/` — the repo is a consumer. Updates flow canonical → repo (never the reverse).

---

## Session roadmap (7 sessions)

| # | Session | Status | Scope |
|---|---|---|---|
| 1 | Knowledge intake (Brand Positioning) | ✅ done | `positioning.md` authored and registered in `KNOWLEDGE_MAP`. Commit `25332cf`. |
| 2 | First gated skill (`brand-positioning`) | ✅ done | 3 files, 581 lines, gating tested end-to-end (401/401/403/200), trace confirmed in DB. Commit `914c15d`. |
| — | Bug fix: Brand Roast ErrorBoundary | ✅ done | Prompt + schema hardened, maxTokens 4000→4500, `normalizeRoastResult` helper, defense-in-depth render. Commit `e3c46ca`. |
| 3 | **Admin UI for clients + traces** | ⏳ next | Extend `/admin` with tabs to create/revoke clients and view `skill_traces` without curl. Zero engine changes. |
| 4 | Packaging as Claude Agent Skills | ⏳ | Create `.claude/skills/arto-*` packages following Anthropic spec for viral distribution. |
| 5 | Internal ARTO interface | ⏳ | Dashboard at `/studio` or `/internal` for the team consuming `/api/skills/{slug}` with an internal key. |
| 6 | Trial flow + Stripe | ⏳ | Landing with pricing, signup creates `tier: trial`, Stripe checkout, webhook updates `allowed_skills`. |
| 7 | Brand Roast polish | 🟡 partial | Critical crash fixed. Remaining: Story OG, iOS native share, Spanish translation, industry variants, more download options. |

### Recommended order

3 (admin UI) → 6 (Stripe) → 4 (packaging) → 5 (internal UI) → 7 (roast polish finalization).

Rationale: sessions 3 and 6 are commercial (reduce operational friction, enable monetization). Session 4 is viral distribution. Session 5 is internal productivity. Session 7 is marketing polish — important but not blocking anything.

---

## Loose quick wins (not full sessions)

| # | Task | Size | Notes |
|---|---|---|---|
| QW1 | Add `"positioning"` to `brand-roast.ts` `knowledgeKeys` | 1 line | Anchors Brand Roast in real ARTO positioning methodology instead of "sounds good in general." Risk: tone may become too technical for casual funnel visitors. A/B test 2 roasts before committing. |
| QW2 | Clean up test clients | 5 min | Two clients created during Session 2 testing live in Neon: Full Access (`9d2a5703...`) and Limited (`7c3660f4...`). Revoke or re-label if they're not going to be reused. |
| QW3 | Commit `.env.local` template | 5 min | Create `.env.example` with the required vars (no secrets) so anyone cloning the repo knows what to fill in. |
| QW4 | Add `vercel.json` `maxDuration` for skills route | 2 min | Current default is 30s, but Brand Roast + Brand Positioning can take 15-25s with web_fetch. A 60s cap is safer. |

---

## How to add a new skill (cheat sheet)

Read `docs/ADDING_A_SKILL.md` for the full version. The ~50-line summary:

1. Create `src/lib/skills/<slug>-types.ts` — `Request` and `Result` interfaces.
2. Create `src/lib/skills/<slug>-prompt.ts` — `buildSystemPrompt`, `outputTool: Tool`, `generateDeterministicFallback()`.
3. Create `src/lib/skills/<slug>.ts` — `validate<Slug>Input`, the `SkillDefinition` object, `registerSkill(...)` at the bottom.
4. Add `import "./<slug>";` to `src/lib/skills/index.ts`.
5. If it needs a new knowledge slice, add an entry to `KNOWLEDGE_MAP` in `src/lib/knowledge.ts` and drop the .md in `knowledge/methodology/<slug>.md` with the standard frontmatter.

No changes needed to `engine.ts`, `registry.ts`, `types.ts`, `clients/*`, or routes — the engine and routing are generic over any `SkillDefinition`.

---

## Verification commands

```bash
# Build + type-check
npm run build

# Registry smoke test (confirms skill loaded correctly)
npx tsx -e "import './src/lib/skills'; import { listSkills } from './src/lib/skills/registry'; console.log(listSkills().map(s => s.slug));"

# Create a gated client
curl -X POST http://localhost:3000/api/admin/clients \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"X","email":"x@y.com","tier":"trial","allowed_skills":["brand-positioning"]}'

# Call a gated skill
curl -X POST http://localhost:3000/api/skills/brand-positioning \
  -H "x-arto-api-key: arto_live_..." \
  -H "Content-Type: application/json" \
  -d '{"brandName":"X","industry":"Y","targetAudience":"Z","competitors":["A","B"]}'
```

---

## Open questions / to revisit

- **Brand Roast language**: UI is English, but ~60% of inbound traffic is Spanish-speaking. Session 7 should decide: detect via browser locale, manual toggle, or skip.
- **Rate limit tuning**: currently 10/hour per IP on public Brand Roast and per-client limits on gated skills. No data yet on whether these are right.
- **Pricing model**: tiers exist in code (`trial`, `agency`, `enterprise`, `internal`) but the economic meaning of each tier hasn't been set. Session 6 pins this down.
- **Knowledge sync**: canonical → repo is manual today. Worth a small script to diff and copy when the canonical updates, to avoid drift.
