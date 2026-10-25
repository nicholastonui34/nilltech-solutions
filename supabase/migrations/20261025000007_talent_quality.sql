-- Phase 6 — Talent & Quality (CLAUDE.md §9, §10, §11).
--
-- Owner rules (2026-10-25):
--   * Hire within East Africa only — enforced here with the EAC member
--     states, not just in the form.
--   * The recruitment department screens every applicant by hand; test
--     tasks are sent manually and only tracked here.
--   * Freelancers file their own taxes. A KRA PIN is collected only for
--     Kenyans hired full-time.
--   * ID verification is deferred (no vendor): verification_status stays
--     'pending_setup' and nothing blocks on it.
--
-- KRA PINs are encrypted with pgcrypto using a key held in Supabase
-- Vault. They can only be written and read through SECURITY DEFINER
-- functions, reads are limited to finance/super_admin and audit-logged,
-- and the ciphertext column isn't selectable by app roles at all.

create type public.talent_stage as enum (
  'applied', 'screening', 'test_task', 'test_review', 'approved', 'rejected'
);
create type public.engagement_type as enum ('freelance', 'full_time');
create type public.project_status as enum ('active', 'in_review', 'delivered', 'on_hold');

-- ---------------------------------------------------------------------------
create table public.talent_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (length(full_name) between 2 and 200),
  email text not null check (length(email) between 3 and 200),
  phone text,
  -- EAC member states: Kenya, Uganda, Tanzania, Rwanda, Burundi,
  -- South Sudan, DR Congo, Somalia.
  country text not null check (country in ('KE', 'UG', 'TZ', 'RW', 'BI', 'SS', 'CD', 'SO')),
  primary_role text not null check (primary_role in (
    'frontend', 'backend', 'mobile', 'ui_ux', 'qa', 'devops', 'ai_ml', 'project_manager'
  )),
  skills text[] not null default '{}',
  years_experience smallint not null check (years_experience between 0 and 60),
  engagement_preference text not null check (engagement_preference in ('freelance', 'full_time', 'either')),
  portfolio_url text,
  profile_url text,
  availability text,
  message text,
  consent_at timestamptz not null,
  stage public.talent_stage not null default 'applied',
  stage_changed_at timestamptz not null default now(),
  screening_notes text,
  test_task_notes text,
  rejection_reason text,
  engagement_type public.engagement_type,
  verification_status text not null default 'pending_setup',
  tax_pin_encrypted bytea,
  tax_pin_recorded_at timestamptz,
  user_id uuid unique references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id),
  constraint talent_approved_needs_engagement
    check (stage <> 'approved' or engagement_type is not null),
  constraint talent_rejected_needs_reason
    check (stage <> 'rejected' or coalesce(length(trim(rejection_reason)), 0) > 0)
);

create index talent_applications_stage_idx on public.talent_applications (stage);
create index talent_applications_created_at_idx on public.talent_applications (created_at desc);

alter table public.talent_applications enable row level security;

create policy "talent: recruitment select"
  on public.talent_applications for select
  using (public.is_any_role(auth.uid(), 'recruitment', 'super_admin'));

-- Quality assigns approved talent to projects and reviews their work.
create policy "talent: quality select approved"
  on public.talent_applications for select
  using (stage = 'approved' and public.is_any_role(auth.uid(), 'quality', 'director'));

create policy "talent: freelancer select own"
  on public.talent_applications for select
  using (user_id = auth.uid());

create policy "talent: recruitment update"
  on public.talent_applications for update
  using (public.is_any_role(auth.uid(), 'recruitment', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'recruitment', 'super_admin'));

-- Inserts come from the public form via the service role only. Column
-- privileges narrow what app roles can read and change on top of RLS.
revoke all on public.talent_applications from anon, authenticated;
grant select (
  id, created_at, full_name, email, phone, country, primary_role, skills, years_experience,
  engagement_preference, portfolio_url, profile_url, availability, message, consent_at,
  stage, stage_changed_at, screening_notes, test_task_notes, rejection_reason,
  engagement_type, verification_status, tax_pin_recorded_at, user_id, updated_by
) on public.talent_applications to authenticated;
grant update (
  stage, screening_notes, test_task_notes, rejection_reason, engagement_type, updated_by
) on public.talent_applications to authenticated;

create function public.talent_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger talent_applications_before_update
  before update on public.talent_applications
  for each row execute function public.talent_before_update();

-- Every screening decision is audit-logged (CLAUDE.md §10).
create function public.log_talent_stage_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage is distinct from old.stage then
    insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'talent_stage_changed', 'talent_applications', new.id::text,
      jsonb_build_object('from', old.stage, 'to', new.stage, 'name', new.full_name));
  end if;
  return new;
end;
$$;

create trigger talent_applications_audit
  after update on public.talent_applications
  for each row execute function public.log_talent_stage_change();

-- ---------------------------------------------------------------------------
-- Encryption key for tax identifiers, generated inside the database and
-- held in Vault. Never in the repo or app env.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'tax_id_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'base64'),
      'tax_id_key',
      'Encrypts tax identifiers at rest (CLAUDE.md §11)'
    );
  end if;
end $$;

create function public.set_talent_tax_pin(_application_id uuid, _pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _app public.talent_applications;
  _key text;
  _clean text := upper(trim(coalesce(_pin, '')));
begin
  if not public.is_any_role(auth.uid(), 'recruitment', 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into _app from public.talent_applications where id = _application_id for update;
  if not found then raise exception 'application not found'; end if;
  if _app.stage <> 'approved' or _app.engagement_type is distinct from 'full_time' or _app.country <> 'KE' then
    raise exception 'a KRA PIN is only recorded for approved, full-time hires in Kenya';
  end if;
  if _clean !~ '^[AP][0-9]{9}[A-Z]$' then
    raise exception 'that doesn''t look like a KRA PIN (e.g. A123456789B)';
  end if;

  select decrypted_secret into _key from vault.decrypted_secrets where name = 'tax_id_key';
  if _key is null then raise exception 'encryption key is missing'; end if;

  update public.talent_applications
  set tax_pin_encrypted = extensions.pgp_sym_encrypt(_clean, _key),
      tax_pin_recorded_at = now()
  where id = _application_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'tax_pin_recorded', 'talent_applications', _application_id::text, '{}'::jsonb);
end;
$$;

create function public.get_talent_tax_pin(_application_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _cipher bytea;
  _key text;
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select tax_pin_encrypted into _cipher from public.talent_applications where id = _application_id;
  if _cipher is null then return null; end if;

  select decrypted_secret into _key from vault.decrypted_secrets where name = 'tax_id_key';

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'tax_pin_viewed', 'talent_applications', _application_id::text, '{}'::jsonb);

  return extensions.pgp_sym_decrypt(_cipher, _key);
end;
$$;

revoke all on function public.set_talent_tax_pin(uuid, text) from public, anon;
revoke all on function public.get_talent_tax_pin(uuid) from public, anon;
grant execute on function public.set_talent_tax_pin(uuid, text) to authenticated;
grant execute on function public.get_talent_tax_pin(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Quality: projects, assignments, QA checklists, delivery reviews.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  client_id uuid references public.clients (id) on delete set null,
  description text,
  status public.project_status not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  delivered_at timestamptz
);

create table public.project_assignments (
  project_id uuid not null references public.projects (id) on delete cascade,
  talent_id uuid not null references public.talent_applications (id) on delete restrict,
  role_on_project text,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users (id),
  primary key (project_id, talent_id)
);

create table public.qa_checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  position integer not null default 0,
  label text not null check (length(label) between 1 and 200),
  done boolean not null default false,
  done_at timestamptz,
  done_by uuid references auth.users (id),
  notes text
);

create table public.delivery_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  talent_id uuid not null references public.talent_applications (id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  notes text,
  reviewed_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (project_id, talent_id)
);

create index project_assignments_talent_idx on public.project_assignments (talent_id);
create index qa_checklist_items_project_idx on public.qa_checklist_items (project_id, position);
create index delivery_reviews_talent_idx on public.delivery_reviews (talent_id);

alter table public.projects enable row level security;
alter table public.project_assignments enable row level security;
alter table public.qa_checklist_items enable row level security;
alter table public.delivery_reviews enable row level security;

create policy "projects: quality select"
  on public.projects for select
  using (public.is_any_role(auth.uid(), 'quality', 'super_admin', 'director'));

create policy "projects: freelancer select assigned"
  on public.projects for select
  using (exists (
    select 1 from public.project_assignments pa
    join public.talent_applications t on t.id = pa.talent_id
    where pa.project_id = projects.id and t.user_id = auth.uid()
  ));

create policy "projects: quality write"
  on public.projects for all
  using (public.is_any_role(auth.uid(), 'quality', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'quality', 'super_admin'));

create policy "assignments: quality select"
  on public.project_assignments for select
  using (public.is_any_role(auth.uid(), 'quality', 'super_admin', 'director'));

create policy "assignments: freelancer select own"
  on public.project_assignments for select
  using (exists (
    select 1 from public.talent_applications t
    where t.id = talent_id and t.user_id = auth.uid()
  ));

create policy "assignments: quality insert approved talent"
  on public.project_assignments for insert
  with check (
    public.is_any_role(auth.uid(), 'quality', 'super_admin')
    and exists (select 1 from public.talent_applications t where t.id = talent_id and t.stage = 'approved')
  );

create policy "assignments: quality delete"
  on public.project_assignments for delete
  using (public.is_any_role(auth.uid(), 'quality', 'super_admin'));

create policy "qa items: quality select"
  on public.qa_checklist_items for select
  using (public.is_any_role(auth.uid(), 'quality', 'super_admin', 'director'));

create policy "qa items: quality write"
  on public.qa_checklist_items for all
  using (public.is_any_role(auth.uid(), 'quality', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'quality', 'super_admin'));

create policy "reviews: quality select"
  on public.delivery_reviews for select
  using (public.is_any_role(auth.uid(), 'quality', 'super_admin', 'director'));

create policy "reviews: quality write"
  on public.delivery_reviews for all
  using (public.is_any_role(auth.uid(), 'quality', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'quality', 'super_admin'));

-- Default QA checklist for every new project (owner, 2026-10-25).
create function public.seed_project_checklist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.qa_checklist_items (project_id, position, label)
  values
    (new.id, 0, 'Code review completed'),
    (new.id, 1, 'Testing passed (functional and regression)'),
    (new.id, 2, 'Client sign-off received');
  return new;
end;
$$;

create trigger projects_seed_checklist
  after insert on public.projects
  for each row execute function public.seed_project_checklist();

create function public.project_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'delivered' and old.status <> 'delivered' then
    new.delivered_at := now();
  elsif new.status <> 'delivered' then
    new.delivered_at := null;
  end if;
  return new;
end;
$$;

create trigger projects_before_update
  before update on public.projects
  for each row execute function public.project_before_update();
