-- Automation run log (CLAUDE.md §9): "All automations logged in
-- automation_runs with retry + failure alerts on the admin dashboard."
-- Written server-side via the service role client, same pattern as
-- audit_log — no insert policy for anon/authenticated roles.

create table public.automation_runs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type text not null, -- e.g. 'lead_notification_email', 'lead_notification_sms'
  status text not null, -- 'success' | 'failed' | 'skipped_not_configured'
  related_entity_type text,
  related_entity_id text,
  payload jsonb not null default '{}'::jsonb,
  error text
);

create index automation_runs_created_at_idx on public.automation_runs (created_at desc);
create index automation_runs_status_idx on public.automation_runs (status);

alter table public.automation_runs enable row level security;

create policy "automation_runs: admins select"
  on public.automation_runs for select
  using (public.is_any_role(auth.uid(), 'super_admin', 'director'));
