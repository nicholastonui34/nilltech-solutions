-- Lead capture (CLAUDE.md §9). Writes happen server-side via the service
-- role client (lib/supabase/admin.ts), bypassing RLS — there is
-- deliberately no insert policy for anon/authenticated roles, since this
-- table holds contact PII submitted from public forms.

create type public.lead_tier as enum ('hot', 'warm', 'cold');

create type public.lead_status as enum ('new', 'contacted', 'qualified', 'disqualified');

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null, -- 'contact_form' | 'estimator_project' | 'estimator_tokens'
  name text not null,
  email text not null,
  phone text,
  company text,
  service_interest text, -- offer slug: services | ai-solutions | managed-teams | academy | partnerships | other
  budget_band text,
  timeline_urgency text,
  region text,
  message text,
  score integer not null default 0,
  tier public.lead_tier not null default 'cold',
  status public.lead_status not null default 'new',
  metadata jsonb not null default '{}'::jsonb
);

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_tier_idx on public.leads (tier);
create index leads_status_idx on public.leads (status);

alter table public.leads enable row level security;

-- Sales, marketing, director and super_admin can read leads (Phase 4 dashboards).
create policy "leads: sales/marketing/admin select"
  on public.leads for select
  using (public.is_any_role(auth.uid(), 'sales', 'marketing', 'director', 'super_admin'));

-- Sales and super_admin can update lead status/tier (pipeline management).
create policy "leads: sales/admin update"
  on public.leads for update
  using (public.is_any_role(auth.uid(), 'sales', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'sales', 'super_admin'));
