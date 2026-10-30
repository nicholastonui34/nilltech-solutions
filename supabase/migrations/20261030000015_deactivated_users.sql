-- Deactivating portal logins (Main Admin → Users). A deactivated account:
--   1. is banned in Supabase Auth, so it can't sign in again;
--   2. has its sessions ended (end_user_sessions), so an open session can't
--      be refreshed;
--   3. is listed here, and has_role / is_any_role return false for it, so
--      every role-based RLS policy denies it at once, even while an
--      already-issued access token is still valid (up to an hour).
-- Roles, profile and records are untouched; reactivating removes the row
-- and lifts the ban.
--
-- Its own table, not a profiles column: people can edit their own profile,
-- and must never be able to undo their own deactivation.

create table public.deactivated_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  deactivated_at timestamptz not null default now(),
  deactivated_by uuid references auth.users (id)
);

alter table public.deactivated_users enable row level security;
revoke all on public.deactivated_users from anon, authenticated;
grant select on public.deactivated_users to authenticated;

create policy "deactivated_users: super_admin select"
  on public.deactivated_users for select
  using (public.has_role(auth.uid(), 'super_admin'));

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
  and not exists (select 1 from public.deactivated_users where user_id = _user_id);
$$;

create or replace function public.is_any_role(_user_id uuid, variadic _roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = any(_roles)
  )
  and not exists (select 1 from public.deactivated_users where user_id = _user_id);
$$;

-- Ends every session for a user (refresh tokens go with them). Server only.
create function public.end_user_sessions(_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.sessions where user_id = _user_id;
$$;

revoke all on function public.end_user_sessions(uuid) from public, anon, authenticated;
