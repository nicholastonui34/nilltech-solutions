-- Rolled-back test for migration …20: recruitment's internal notes are
-- hidden from applicants. Passed on the live project 2026-10-30.
-- Expected: rec_reads=internal note rec_update=test_review
--   applicant_column=blocked applicant_rpc=blocked applicant_profile=Notes Test
do $$
declare
  rec uuid := gen_random_uuid(); fl uuid := gen_random_uuid();
  r text := ''; app uuid; st text;
begin
  insert into auth.users (id, email, aud, role) values
    (rec, 'n-rec@example.test', 'authenticated', 'authenticated'),
    (fl, 'n-fl@example.test', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values (rec, 'recruitment'), (fl, 'freelancer');
  insert into public.talent_applications (full_name, email, country, primary_role,
    years_experience, engagement_preference, consent_at, stage, user_id)
  values ('Notes Test', 'n-fl@example.test', 'KE', 'qa', 1, 'freelance', now(), 'test_task', fl)
  returning id into app;
  set local role authenticated;

  perform set_config('request.jwt.claims', json_build_object('sub', rec, 'role', 'authenticated')::text, true);
  update public.talent_applications set screening_notes = 'internal note', stage = 'test_review' where id = app;
  select screening_notes into st from public.get_talent_internal_notes(app);
  r := r || 'rec_reads=' || coalesce(st, 'null');
  select stage::text into st from public.talent_applications where id = app;
  r := r || ' rec_update=' || st;

  perform set_config('request.jwt.claims', json_build_object('sub', fl, 'role', 'authenticated')::text, true);
  begin
    execute 'select screening_notes from public.talent_applications where id = $1' into st using app;
    r := r || ' applicant_column=READABLE';
  exception when insufficient_privilege then r := r || ' applicant_column=blocked'; end;
  begin
    perform * from public.get_talent_internal_notes(app);
    r := r || ' applicant_rpc=ALLOWED';
  exception when others then r := r || ' applicant_rpc=blocked'; end;
  select full_name into st from public.talent_applications where id = app;
  r := r || ' applicant_profile=' || coalesce(st, 'null');

  raise exception 'ROLLBACK-RESULT %', r;
end $$;
