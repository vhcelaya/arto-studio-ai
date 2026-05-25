-- 0002_outreach_dashboard.sql
--
-- Adds two pieces needed by /admin/outreach:
--
--   1. outreach_targets.include_in_send — operator-controlled boolean.
--      Defaults to true so the Atlas backfill flows in by default; the
--      operator unchecks targets to exclude them before drafting.
--
--   2. outreach_drafts table — persists generated drafts so they
--      survive between cron runs, and lets the operator edit subject
--      and body in the admin UI before approving for send. One current
--      draft per target.

alter table public.outreach_targets
  add column if not exists include_in_send boolean not null default true;

create table if not exists public.outreach_drafts (
  id          uuid primary key default gen_random_uuid(),
  target_id   uuid not null references public.outreach_targets(id) on delete cascade,
  subject     text not null,
  body        text not null,
  language    text not null check (language in ('en', 'es')),
  status      text not null default 'draft'
                check (status in ('draft','approved','sent','skipped')),
  edited_by_human boolean not null default false,
  cost_usd    numeric(10,6),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- only one live draft per target. When the runner regenerates we
  -- update the row in place.
  unique (target_id)
);

create index if not exists idx_outreach_drafts_status on public.outreach_drafts(status);
create index if not exists idx_outreach_drafts_updated on public.outreach_drafts(updated_at desc);

alter table public.outreach_drafts enable row level security;
-- Service-role only (the admin API uses createAdminClient).
