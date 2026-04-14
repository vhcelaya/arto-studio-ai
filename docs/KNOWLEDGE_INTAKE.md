# Knowledge Intake Methodology

How to convert real ARTO work (client decks, cases, internal frameworks, brand guidelines, critiques) into reusable knowledge slices that power the skills library.

The north star: **every skill should get measurably sharper every time ARTO finishes a real engagement.** This doc is the process that makes that happen — it's not code.

## What we want in `/knowledge/`

Living methodology files, not marketing copy. Each file answers one of:

- **What is the framework?** Named, stepwise, with inputs and outputs. ("The ARTO Positioning Canvas: 6 questions, in order, each one gates the next.")
- **When do you apply it?** Conditions, industries, brand sizes, typical triggers.
- **What does good look like?** Examples (anonymized if needed), scored against the rubric.
- **What are the anti-patterns?** The specific language, visuals, or decisions that earn a score penalty.
- **What is the current context?** Trends, cultural shifts, audience behaviors that change how the framework is applied today vs. 5 years ago.

What we do **not** want: hero sections, team bios, generic "why brand matters" essays, client logos. That's website content. Knowledge files are for the engine.

## Folder structure

```
/knowledge/
  methodology/          ← reusable frameworks
    strategy.md
    narrative.md
    creativity.md       ← future
    positioning.md      ← future
    content.md          ← future
  quality/
    rubric.md           ← scoring scale & anti-pattern list
  trends/
    current.md          ← refreshed quarterly
  industries/           ← future; slice by sector
    finance.md
    saas.md
  case-studies/         ← future; anonymized real work
    fintech-latam-01.md
```

Each new file must be registered in `src/lib/knowledge.ts → KNOWLEDGE_MAP` with a short key. Unregistered files are invisible to skills.

## The intake session (how to run one with Victor)

A 60–90 minute session with Victor focused on **one framework**. Output: one new `.md` file (plus updates to existing files if gaps are found).

### Before the session
- Pick the framework. Usually driven by a skill we want to build next. Example: "We want a Brand Positioning skill → we need `methodology/positioning.md`."
- Ask Victor to pull 2–3 real examples of ARTO doing this well (past decks, strategy documents, client work). Anonymization happens later.

### During the session — the 6 questions

Ask these in order. Record audio or transcribe as you go. Do not let Victor generalize — push for specifics.

1. **"Walk me through the last time ARTO did this for a real client. Step by step. What did you do on day 1, day 2, day 3?"** → captures the actual process, not the idealized one.
2. **"What's the one question you always ask first that most agencies skip?"** → captures the proprietary angle. This is what makes ARTO ARTO.
3. **"When you see [deliverable] from another agency, what's the tell that it's mediocre?"** → becomes the anti-pattern list. Specific phrases, visual patterns, structural mistakes.
4. **"If a junior had to do this without you, what 5 rules would you tape to their wall?"** → distills the framework into rule-of-thumb form, which is what the Claude prompt actually uses.
5. **"What scores a 9 on this? What scores a 3?"** → calibrates the rubric. Needs concrete anchors, not adjectives.
6. **"What's changed in the last 12 months that makes your old answer wrong?"** → feeds `trends/current.md`. Run this every quarter.

### After the session

- Draft the file using Victor's actual wording. Keep the voice — if Victor says "don't be the hero, be the mirror," that goes in verbatim.
- Structure the file as:

```md
# [Framework Name]

## The ARTO take (one paragraph, the core insight)

## When to apply (triggers, industries, brand sizes)

## The process (numbered steps, each with inputs → action → output)

## What good looks like (3 anchored examples, each scored)

## Anti-patterns (bulleted list of specific things to penalize)

## Edge cases (what to do when the default breaks)

## Recent shifts (what changed in the last 12 months, dated)
```

- Show Victor the draft. Ask: "Would you sign your name to this if a client saw it?" Iterate until yes.
- Register the file in `KNOWLEDGE_MAP`, deploy, smoke-test the skill that consumes it.

## Versioning

- Each knowledge file starts with a frontmatter block: `last_reviewed: 2026-04-14` and `owner: victor`.
- Quarterly review: re-run question 6 on every methodology file. Update `trends/current.md` aggressively — it's the most time-sensitive.
- Case studies accumulate, they don't replace each other. Add `case-studies/fintech-latam-02.md` next time, don't overwrite the first one.

## Continual learning loop

Every Brand Roast (and every future skill call) writes a trace to `skill_traces` in Neon. Traces contain input + output + latency + source. Once we have a few hundred, we can:

1. Sample low-scoring brands and read what Claude actually said — does it match Victor's critique instinct? If not, the knowledge is missing something.
2. Sample high-scoring brands — are they actually good, or is the rubric too generous?
3. Feed the patterns back into `/knowledge/quality/rubric.md` during the next intake session.

The knowledge base is never "done." It's an operating discipline. Sessions happen on a cadence — typically one per new skill, plus a quarterly review of existing slices.

## What this unlocks

When the knowledge base is alive and growing, adding a new skill becomes cheaper every time — you're composing from existing slices rather than writing from scratch. And the existing skills get sharper automatically, without anyone touching code. That's the compounding advantage.
