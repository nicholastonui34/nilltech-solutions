-- Audit log for role changes, financial actions and verification decisions
-- (CLAUDE.md §10). Append-only: rows are written via the service role from
-- server code (service role bypasses RLS), never directly by a client, so
-- there is deliberately no insert policy for authenticated/anon users.

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_log: admins select"
  on public.audit_log for select
  using (public.is_any_role(auth.uid(), 'super_admin', 'director'));

-- Auto-log every role grant/revoke so §10's "audit log for every role
-- change" holds even if application code forgets to log it explicitly.
create function public.log_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'role_granted', 'user_roles', new.user_id::text, jsonb_build_object('role', new.role));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'role_revoked', 'user_roles', old.user_id::text, jsonb_build_object('role', old.role));
    return old;
  end if;
  return null;
end;
$$;

create trigger user_roles_audit
  after insert or delete on public.user_roles
  for each row
  execute function public.log_role_change();
