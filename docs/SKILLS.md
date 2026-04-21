# ARTO Skills for Claude Code

Two skills live in this repo and can be installed into any Claude Code session:

| Skill | Status | Auth | What it does |
|---|---|---|---|
| `arto-brand-roast` | Public | None | Brutally honest brand evaluation across Strategy / Creativity / Narrative / Digital. 10 calls/hour per IP. |
| `arto-brand-positioning` | Gated | `ARTO_API_KEY` | Full positioning methodology: ARTO-spine statement (ES/EN), metaphor, NOT table, 4-criteria scorecard, competitor wedges, Brief skeleton. |

Both call `https://arto-studio-ai.vercel.app` under the hood. The methodology runs on the server; your machine just orchestrates the call and presents the result.

## How to install

### Option A — Project-scoped (no install needed inside this repo)

Already done. Any Claude Code session started inside this repo (`cd ~/Projects/arto-studio-ai && claude`) automatically loads both skills from `.claude/skills/`.

Good for: local development, testing the skills yourself.

### Option B — User-scoped (available in every Claude session on your machine)

Copy the two skill directories into your user-level `~/.claude/skills/`:

```bash
# From a fresh clone or directly from GitHub:
git clone https://github.com/vhcelaya/arto-studio-ai.git /tmp/arto
mkdir -p ~/.claude/skills
cp -r /tmp/arto/.claude/skills/arto-brand-roast ~/.claude/skills/
cp -r /tmp/arto/.claude/skills/arto-brand-positioning ~/.claude/skills/
```

After this, any Claude Code session anywhere on your machine can invoke these skills when the user's prompt matches their description.

Good for: day-to-day use across multiple repos or unrelated folders.

### Option C — Future: plugin install

The repo includes a `.claude-plugin/plugin.json` manifest. When Anthropic publishes a Claude Code plugin marketplace for third-party plugins, we'll register `arto-studio-ai` there and the install will become:

```bash
claude plugin install arto-studio-ai
```

Until then, Option A or B is the path.

## Setting up your API key (required for `arto-brand-positioning`)

1. Sign up at **https://arto-studio-ai.vercel.app** — click "Start free trial" on the Starter card.
2. Check your email for the API key (starts with `arto_live_...`). You get 5 free calls.
3. Export it in your shell:
   ```bash
   export ARTO_API_KEY=arto_live_...
   ```
   To persist across sessions, add the line to `~/.zshrc` or `~/.bashrc`.

4. (Optional) Verify:
   ```bash
   curl -sS -X POST https://arto-studio-ai.vercel.app/api/skills/brand-positioning \
     -H "Content-Type: application/json" \
     -H "x-arto-api-key: $ARTO_API_KEY" \
     -d '{"brandName":"Smoke","industry":"test","targetAudience":"me","competitors":["a","b"]}' \
     | head -c 200
   ```

When your trial is used up, the API returns a 429 with an `upgrade_url`. Click it to upgrade to Starter ($99/mo, unlimited).

## How Claude picks up the skills

Claude Code reads `SKILL.md` frontmatter (`name` + `description`) when the session starts. The `description` is what it uses to decide whether the skill applies to a user prompt. For example:

- User says: "roast my brand Acme in SaaS"
- Claude matches against `arto-brand-roast`'s description: "...when the user asks Claude to roast, critique, evaluate, or audit a brand..."
- Match → Claude reads the SKILL.md body and follows its instructions (call the ARTO API, format the response).

You can test this explicitly by asking Claude "which skills do you have available?" or "show me the arto-brand-roast SKILL.md".

## Updating the skills

The skills evolve with the ARTO API. To update:

```bash
# If you installed user-level (Option B):
cd /tmp/arto && git pull
rsync -a --delete ~/.claude/skills/arto-brand-roast/ /tmp/arto/.claude/skills/arto-brand-roast/
rsync -a --delete ~/.claude/skills/arto-brand-positioning/ /tmp/arto/.claude/skills/arto-brand-positioning/
```

Or re-run the Option B install commands — they overwrite.

## Why do these exist?

ARTO Studio AI is built as an **agent-skill-native platform**. The thesis (from Battery Ventures' "Agent Skills Are the New SDK"): in the AI coding era, the best way to distribute a tool isn't a web app — it's a package that teaches AI agents how to use it, so they can use it autonomously on behalf of their users.

Brand Roast is the free funnel. Brand Positioning is the paid product. Skills are the distribution layer.

## Support

- Questions: hello@artogroup.com
- Issues with the skill: https://github.com/vhcelaya/arto-studio-ai/issues
- ARTO Studio AI status / pricing: https://arto-studio-ai.vercel.app
