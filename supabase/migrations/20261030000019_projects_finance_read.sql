-- Finance links expenses and freelancer payments to projects, but couldn't
-- read the project list (only quality, super_admin and director could), so
-- the project picker was empty for finance users. Read-only.
create policy "projects: finance select"
  on public.projects for select
  using (public.is_any_role(auth.uid(), 'finance'));
