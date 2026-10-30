-- Rolled-back test for freelancer payout details (migration …21). Safe on
-- the live project: temporary users and records, undone by the final
-- exception (document counters too). The "error" starting with
-- ROLLBACK-RESULT is the result. Passed on the live project 2026-10-30.
--
-- Expected:
--   no_details_pay=blocked bad_phone=blocked bank_no_name=blocked
--   saved=mpesa:254712345678 other_method=blocked bank_missing=blocked
--   both_saved=bank_transfer:KCB pay_mpesa=mpesa:254712345678
--   pay_bank=bank_transfer:01234567890 pay_other=blocked
--   finance_reads=1 recruitment_reads=0 other_freelancer_reads=0
--   direct_write=blocked audit=2
do $$
declare
  fin uuid := gen_random_uuid(); rec uuid := gen_random_uuid();
  fl uuid := gen_random_uuid(); other uuid := gen_random_uuid();
  r text := ''; app uuid; pay uuid; n bigint; st text;
begin
  insert into auth.users (id, email, aud, role) values
    (fin, 'po-fin@example.test', 'authenticated', 'authenticated'),
    (rec, 'po-rec@example.test', 'authenticated', 'authenticated'),
    (fl, 'po-fl@example.test', 'authenticated', 'authenticated'),
    (other, 'po-other@example.test', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values
    (fin, 'finance'), (rec, 'recruitment'), (fl, 'freelancer'), (other, 'freelancer');
  insert into public.talent_applications (full_name, email, country, primary_role,
    years_experience, engagement_preference, consent_at, stage, engagement_type, user_id)
  values ('Payout Test', 'po-fl@example.test', 'KE', 'frontend', 3, 'freelance', now(), 'approved', 'freelance', fl)
  returning id into app;
  insert into public.talent_applications (full_name, email, country, primary_role,
    years_experience, engagement_preference, consent_at, stage, engagement_type, user_id)
  values ('Other Payout', 'po-other@example.test', 'KE', 'backend', 2, 'freelance', now(), 'approved', 'freelance', other);

  set local role authenticated;

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  begin
    perform public.record_freelancer_payment(app, 1000, 'KES', 'mpesa', null, public.nairobi_today(), 'No details yet', null);
    r := r || 'no_details_pay=ALLOWED';
  exception when others then r := r || 'no_details_pay=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', fl, 'role', 'authenticated')::text, true);
  begin
    perform public.set_own_payout_details('mpesa', '0812 000 000', 'Payout Test', null, null, null, null);
    r := r || ' bad_phone=ALLOWED';
  exception when others then r := r || ' bad_phone=blocked'; end;
  begin
    perform public.set_own_payout_details('bank_transfer', null, null, 'KCB', null, '0123456789', '');
    r := r || ' bank_no_name=ALLOWED';
  exception when others then r := r || ' bank_no_name=blocked'; end;

  perform public.set_own_payout_details('mpesa', '0712 345 678', 'Payout Test', null, null, null, null);
  select preferred_method::text || ':' || mpesa_number into st from public.talent_payout_details where talent_id = app;
  r := r || ' saved=' || st;
  begin
    perform public.set_own_payout_details('other', '0712345678', 'Payout Test', null, null, null, null);
    r := r || ' other_method=ALLOWED';
  exception when others then r := r || ' other_method=blocked'; end;
  begin
    perform public.set_own_payout_details('bank_transfer', '0712345678', 'Payout Test', null, null, null, null);
    r := r || ' bank_missing=ALLOWED';
  exception when others then r := r || ' bank_missing=blocked'; end;
  perform public.set_own_payout_details('bank_transfer', '+254712345678', 'Payout Test', 'KCB', 'Moi Avenue', '0123-4567-890', 'Payout Test');
  select preferred_method::text || ':' || bank_name into st from public.talent_payout_details where talent_id = app;
  r := r || ' both_saved=' || st;

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  pay := public.record_freelancer_payment(app, 1000, 'KES', 'mpesa', 'REF1', public.nairobi_today(), 'Work A', null);
  select method::text || ':' || (payout_snapshot->>'mpesa_number') into st from public.freelancer_payments where id = pay;
  r := r || ' pay_mpesa=' || st;
  pay := public.record_freelancer_payment(app, 2000, 'KES', 'bank_transfer', 'REF2', public.nairobi_today(), 'Work B', null);
  select method::text || ':' || (payout_snapshot->>'bank_account_number') into st from public.freelancer_payments where id = pay;
  r := r || ' pay_bank=' || st;
  begin
    perform public.record_freelancer_payment(app, 1000, 'KES', 'other', null, public.nairobi_today(), 'Cash', null);
    r := r || ' pay_other=ALLOWED';
  exception when others then r := r || ' pay_other=blocked'; end;

  select count(*) into n from public.talent_payout_details where talent_id = app; r := r || ' finance_reads=' || n;
  perform set_config('request.jwt.claims', json_build_object('sub', rec, 'role', 'authenticated')::text, true);
  select count(*) into n from public.talent_payout_details where talent_id = app; r := r || ' recruitment_reads=' || n;
  perform set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated')::text, true);
  select count(*) into n from public.talent_payout_details where talent_id = app; r := r || ' other_freelancer_reads=' || n;

  perform set_config('request.jwt.claims', json_build_object('sub', fl, 'role', 'authenticated')::text, true);
  begin
    update public.talent_payout_details set mpesa_number = '254700000000' where talent_id = app;
    get diagnostics n = row_count;
    r := r || case when n = 0 then ' direct_write=blocked' else ' direct_write=ALLOWED' end;
  exception when others then r := r || ' direct_write=blocked'; end;

  reset role;
  select count(*) into n from public.audit_log where action = 'payout_details_updated' and actor_id = fl;
  r := r || ' audit=' || n;

  raise exception 'ROLLBACK-RESULT %', r;
end $$;
