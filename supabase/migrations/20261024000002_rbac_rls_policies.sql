-- RLS: Row Level Security on every table, per CLAUDE.md §10.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- profiles: a user can read and update their own profile.
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- profiles: super_admin and director can read every profile (needed for
-- the Main Admin and Director dashboards).
create policy "profiles: admins select all"
  on public.profiles for select
  using (public.is_any_role(auth.uid(), 'super_admin', 'director'));

-- profiles: super_admin can update any profile (user management).
create policy "profiles: super_admin update all"
  on public.profiles for update
  using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

-- user_roles: a user can see their own role assignments.
create policy "user_roles: select own"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- user_roles: super_admin can see, grant and revoke any role assignment.
-- This is the only way roles change — CLAUDE.md §10's "Role Assignment"
-- admin view reads/writes exclusively through this policy.
create policy "user_roles: super_admin select all"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'super_admin'));

create policy "user_roles: super_admin insert"
  on public.user_roles for insert
  with check (public.has_role(auth.uid(), 'super_admin'));

create policy "user_roles: super_admin delete"
  on public.user_roles for delete
  using (public.has_role(auth.uid(), 'super_admin'));
