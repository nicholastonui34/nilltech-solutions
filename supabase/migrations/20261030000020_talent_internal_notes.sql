-- Recruitment's internal notes (screening notes, test-task notes and the
-- rejection reason) were readable by the applicant through the API, because
-- column privileges apply to every logged-in user and RLS lets applicants
-- read their own row. Applicants now get logins from the test-task stage,
-- so these columns are no longer selectable by app roles; recruitment and
-- super admins read them through get_talent_internal_notes(). Writes are
-- unchanged (column UPDATE grant + the recruitment RLS policy).

revoke select (screening_notes, test_task_notes, rejection_reason)
  on public.talent_applications from authenticated;

create function public.get_talent_internal_notes(_application_id uuid)
returns table (screening_notes text, test_task_notes text, rejection_reason text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_any_role(auth.uid(), 'recruitment', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
    select t.screening_notes, t.test_task_notes, t.rejection_reason
    from public.talent_applications t
    where t.id = _application_id;
end;
$$;

revoke all on function public.get_talent_internal_notes(uuid) from public, anon;
grant execute on function public.get_talent_internal_notes(uuid) to authenticated;
