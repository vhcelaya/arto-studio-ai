-- 0003_content_items.sql
--
-- Unified content pipeline for Module 3 (Content Factory).
--
-- Same shape as outreach_drafts: items live in 'draft' status, the
-- operator reviews/edits/approves in /admin/content, and a separate
-- publish step (per type) ships them to their destination channel.
--
-- type:
--   prompt        → published into the public `prompts` catalog
--   blog_post     → published as a /learn vertical page (Phase 3c wiring)
--   social_post   → consumed by Module 1 (Phase 3c)
--   newsletter    → consumed by /api/cron/digest (Phase 3c)
--
-- For Phase 3a only 'prompt' has a publisher implemented; the others
-- can be drafted + approved but stay in approved state.

create table if not exists public.content_items (
  id              uuid primary key default gen_random_uuid(),
  type            text not null
                    check (type in ('prompt','blog_post','social_post','newsletter')),
  channel         text,
  status          text not null default 'draft'
                    check (status in ('draft','approved','published','skipped')),
  language        text not null check (language in ('en','es')),
  -- Free-form storage for type-specific shape. Examples:
  --   type='prompt':     { title_en, title_es, body_en, body_es, category, subcategory, ai_model, difficulty, tier, tags }
  --   type='blog_post':  { slug, title_en, title_es, hero_en, hero_es, intro_en, intro_es, use_cases_en, use_cases_es, category }
  --   type='social_post':{ network, copy, link, image_url }
  --   type='newsletter': { subject, intro, sections }
  payload         jsonb not null,
  -- Source signal that triggered the creation (engine_signals row), if any.
  source_signal_id uuid,
  -- Where it was published to once status='published'. e.g. prompts.id, learn slug.
  published_ref   text,
  edited_by_human boolean not null default false,
  cost_usd        numeric(10,6),
  scheduled_for   timestamptz,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_content_items_status on public.content_items(status);
create index if not exists idx_content_items_type on public.content_items(type);
create index if not exists idx_content_items_updated on public.content_items(updated_at desc);

alter table public.content_items enable row level security;
-- Service-role only (the admin API uses createAdminClient).
