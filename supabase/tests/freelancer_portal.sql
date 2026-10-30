-- Rolled-back test for the freelancer portal (migrations …18, …19). Safe on
-- the live project: temporary users, applications, project and records;
-- the final exception undoes everything, including document counters.
-- The "error" starting with ROLLBACK-RESULT is the result. Passed on the
-- live project 2026-10-30.
--
-- Expected:
--   profile=ok bad_url=blocked other_profile=untouched task_seen=1
--   bad_submit=blocked other_submit=blocked submitted=test_review
--   resubmit_after_review=blocked pay=NTS-FP-...:expense=talent
--   free_sees_pay=1 other_sees_pay=0 sales_pay=blocked future_pay=blocked
--   voided=expense_gone doc_seen=1 wrong_name=blocked accepted=yes
--   delete_accepted=0 checklist=3 review_seen=1 other_checklist=0
--   finance_projects=1 audit=5
do $$
declare
  rec uuid := gen_random_uuid(); fin uuid := gen_random_uuid(); sal uuid := gen_random_uuid();
  fl uuid := gen_random_uuid(); other uuid := gen_random_uuid();
  r text := ''; app uuid; app2 uuid; task uuid; pay uuid; doc uuid; proj uuid;
  n bigint; st text; num text; exp_id uuid;
begin
  insert into auth.users (id, email, aud, role) values
    (rec, 'fp-rec@example.test', 'authenticated', 'authenticated'),
    (fin, 'fp-fin@example.test', 'authenticated', 'authenticated'),
    (sal, 'fp-sal@example.test', 'authenticated', 'authenticated'),
    (fl, 'fp-fl@example.test', 'authenticated', 'authenticated'),
    (other, 'fp-other@example.test', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values
    (rec, 'recruitment'), (fin, 'finance'), (sal, 'sales'),
    (fl, 'freelancer'), (other, 'freelancer');
  insert into public.talent_applications (full_name, email, country, primary_role,
    years_experience, engagement_preference, consent_at, stage, user_id)
  values ('Test Freelancer', 'fp-fl@example.test', 'KE', 'frontend', 3, 'freelance', now(), 'test_task', fl)
  returning id into app;
  insert into public.talent_applications (full_name, email, country, primary_role,
    years_experience, engagement_preference, consent_at, stage, engagement_type, user_id)
  values ('Other Person', 'fp-other@example.test', 'UG', 'backend', 2, 'freelance', now(), 'approved', 'freelance', other)
  returning id into app2;

  set local role authenticated;

  -- 1. Profile edits (own row only).
  perform set_config('request.jwt.claims', json_build_object('sub', fl, 'role', 'authenticated')::text, true);
  perform public.update_own_talent_profile('+254700000000', array['React', ' Node ', 'React', ''], 'https://example.test', null, '20h/week');
  select case when skills = array['Node','React'] or skills = array['React','Node'] then 'ok' else skills::text end
    into st from public.talent_applications where id = app;
  r := r || 'profile=' || st;
  begin
    perform public.update_own_talent_profile(null, null, 'javascript:alert(1)', null, null);
    r := r || ' bad_url=ALLOWED';
  exception when others then r := r || ' bad_url=blocked'; end;
  reset role;
  select case when phone is null then 'untouched' else 'CHANGED' end into st from public.talent_applications where id = app2;
  r := r || ' other_profile=' || st;
  set local role authenticated;

  -- 2. Test tasks.
  perform set_config('request.jwt.claims', json_build_object('sub', rec, 'role', 'authenticated')::text, true);
  insert into public.talent_test_tasks (application_id, title, brief, due_on)
  values (app, 'Build a form', 'Build a small booking form and share the repo.', public.nairobi_today() + 5)
  returning id into task;

  perform set_config('request.jwt.claims', json_build_object('sub', fl, 'role', 'authenticated')::text, true);
  select count(*) into n from public.talent_test_tasks where id = task; r := r || ' task_seen=' || n;
  begin
    perform public.submit_test_task(task, 'ftp://nope', null);
    r := r || ' bad_submit=ALLOWED';
  exception when others then r := r || ' bad_submit=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated')::text, true);
  begin
    perform public.submit_test_task(task, 'https://example.test/x', null);
    r := r || ' other_submit=ALLOWED';
  exception when others then r := r || ' other_submit=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', fl, 'role', 'authenticated')::text, true);
  perform public.submit_test_task(task, 'https://example.test/repo', 'Done');
  select stage into st from public.talent_applications where id = app; r := r || ' submitted=' || st;

  perform set_config('request.jwt.claims', json_build_object('sub', rec, 'role', 'authenticated')::text, true);
  update public.talent_test_tasks set reviewed_at = now(), reviewed_by = rec where id = task;
  update public.talent_applications set stage = 'approved', engagement_type = 'freelance' where id = app;

  perform set_config('request.jwt.claims', json_build_object('sub', fl, 'role', 'authenticated')::text, true);
  begin
    perform public.submit_test_task(task, 'https://example.test/v2', null);
    r := r || ' resubmit_after_review=ALLOWED';
  exception when others then r := r || ' resubmit_after_review=blocked'; end;

  -- 3. Payments.
  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  pay := public.record_freelancer_payment(app, 350000, 'KES', 'mpesa', 'TESTREF', public.nairobi_today(), 'Test work', null);
  select p.number, e.category::text, p.expense_id into num, st, exp_id
  from public.freelancer_payments p join public.expenses e on e.id = p.expense_id where p.id = pay;
  r := r || ' pay=' || left(num, 7) || '...:expense=' || st;

  perform set_config('request.jwt.claims', json_build_object('sub', fl, 'role', 'authenticated')::text, true);
  select count(*) into n from public.freelancer_payments; r := r || ' free_sees_pay=' || n;
  perform set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated')::text, true);
  select count(*) into n from public.freelancer_payments; r := r || ' other_sees_pay=' || n;

  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  begin
    perform public.record_freelancer_payment(app, 100, 'KES', 'mpesa', null, public.nairobi_today(), 'Sales try', null);
    r := r || ' sales_pay=ALLOWED';
  exception when others then r := r || ' sales_pay=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  begin
    perform public.record_freelancer_payment(app, 100, 'KES', 'mpesa', null, public.nairobi_today() + 1, 'Future', null);
    r := r || ' future_pay=ALLOWED';
  exception when others then r := r || ' future_pay=blocked'; end;

  perform public.void_freelancer_payment(pay, 'Recorded twice');
  select case when exists (select 1 from public.expenses where id = exp_id) then 'EXPENSE_LEFT' else 'expense_gone' end into st;
  r := r || ' voided=' || st;

  -- 4. Documents (row only; files live in storage and aren't part of this test).
  perform set_config('request.jwt.claims', json_build_object('sub', rec, 'role', 'authenticated')::text, true);
  insert into public.talent_documents (talent_id, kind, title, storage_path, file_name, size_bytes, requires_acceptance)
  values (app, 'contract', 'Test agreement', app::text || '/test.pdf', 'test.pdf', 1000, true)
  returning id into doc;

  perform set_config('request.jwt.claims', json_build_object('sub', fl, 'role', 'authenticated')::text, true);
  select count(*) into n from public.talent_documents where id = doc; r := r || ' doc_seen=' || n;
  begin
    perform public.accept_talent_document(doc, 'Someone Else');
    r := r || ' wrong_name=ALLOWED';
  exception when others then r := r || ' wrong_name=blocked'; end;
  perform public.accept_talent_document(doc, '  test   freelancer ');
  select case when accepted_at is not null then 'yes' else 'no' end into st from public.talent_documents where id = doc;
  r := r || ' accepted=' || st;

  perform set_config('request.jwt.claims', json_build_object('sub', rec, 'role', 'authenticated')::text, true);
  with d as (delete from public.talent_documents where id = doc returning 1) select count(*) into n from d;
  r := r || ' delete_accepted=' || n;

  -- 5. Assignment detail.
  reset role;
  insert into public.projects (name, due_on) values ('FP test project', public.nairobi_today() + 30) returning id into proj;
  insert into public.project_assignments (project_id, talent_id) values (proj, app);
  insert into public.delivery_reviews (project_id, talent_id, rating, notes) values (proj, app, 5, 'Great');
  set local role authenticated;

  perform set_config('request.jwt.claims', json_build_object('sub', fl, 'role', 'authenticated')::text, true);
  select count(*) into n from public.qa_checklist_items where project_id = proj; r := r || ' checklist=' || n;
  select count(*) into n from public.delivery_reviews where project_id = proj; r := r || ' review_seen=' || n;
  perform set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated')::text, true);
  select count(*) into n from public.qa_checklist_items where project_id = proj; r := r || ' other_checklist=' || n;

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  select count(*) into n from public.projects where id = proj; r := r || ' finance_projects=' || n;

  reset role;
  select count(*) into n from public.audit_log
  where action in ('talent_profile_updated', 'test_task_submitted', 'freelancer_payment_recorded',
    'freelancer_payment_voided', 'talent_document_accepted')
    and actor_id in (fl, fin);
  r := r || ' audit=' || n;

  raise exception 'ROLLBACK-RESULT %', r;
end $$;
