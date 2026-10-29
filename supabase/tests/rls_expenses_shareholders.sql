-- Rolled-back access test for expenses and shareholders. Safe to run on
-- the live project: it creates temporary test users, checks what each role
-- can see and do, then raises an exception so EVERYTHING is undone.
-- Run it in the Supabase SQL editor. The "error" it shows starting with
-- ROLLBACK-RESULT is the result, not a failure.
--
-- Expected:
--   fin_update=1 zero=blocked fin_sees_register=0 dir_sel=1 dir_upd=0
--   dir_ins=blocked dir_register=4 dir_edit_shares=0 sales_exp=0
--   sales_register=0 sales_overview=blocked inv_register_rows=1 inv_exp=0
--   inv_pay=0 inv_invoices=0 inv_clients=0
--   inv_holding=Angela Matthes:144/1200@12.00% kes_spent_year=<n>
--   fin_del=1 audit=expense_insert,expense_update,expense_delete
do $$
declare
  fin uuid := gen_random_uuid(); dir uuid := gen_random_uuid(); sal uuid := gen_random_uuid(); inv uuid := gen_random_uuid();
  r text := ''; n int; eid uuid; ov jsonb; acts text;
begin
  insert into auth.users (id, email, aud, role) values
    (fin, 'rls-fin@example.test', 'authenticated', 'authenticated'),
    (dir, 'rls-dir@example.test', 'authenticated', 'authenticated'),
    (sal, 'rls-sal@example.test', 'authenticated', 'authenticated'),
    (inv, 'rls-inv@example.test', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values (fin, 'finance'), (dir, 'director'), (sal, 'sales'), (inv, 'investor');
  update public.shareholders set user_id = inv where name = 'Angela Matthes';

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.expenses (spent_on, description, category, amount_minor, currency)
    values ('2026-10-29', 'RLS test', 'software', 250000, 'KES') returning id into eid;
  update public.expenses set amount_minor = 300000 where id = eid;
  get diagnostics n = row_count; r := r || 'fin_update=' || n;
  begin
    insert into public.expenses (spent_on, description, category, amount_minor, currency) values ('2026-10-29', 'zero', 'other', 0, 'KES');
    r := r || ' zero=ALLOWED';
  exception when check_violation then r := r || ' zero=blocked'; end;
  select count(*) into n from public.shareholders; r := r || ' fin_sees_register=' || n;

  perform set_config('request.jwt.claims', json_build_object('sub', dir, 'role', 'authenticated')::text, true);
  select count(*) into n from public.expenses where id = eid; r := r || ' dir_sel=' || n;
  update public.expenses set amount_minor = 1 where id = eid;
  get diagnostics n = row_count; r := r || ' dir_upd=' || n;
  begin
    insert into public.expenses (spent_on, description, category, amount_minor, currency) values ('2026-10-29', 'd', 'other', 100, 'KES');
    r := r || ' dir_ins=ALLOWED';
  exception when insufficient_privilege then r := r || ' dir_ins=blocked'; end;
  select count(*) into n from public.shareholders; r := r || ' dir_register=' || n;
  update public.shareholders set shares = 1;
  get diagnostics n = row_count; r := r || ' dir_edit_shares=' || n;

  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  select count(*) into n from public.expenses where id = eid; r := r || ' sales_exp=' || n;
  select count(*) into n from public.shareholders; r := r || ' sales_register=' || n;
  begin ov := public.shareholder_overview(); r := r || ' sales_overview=ALLOWED';
  exception when others then r := r || ' sales_overview=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', inv, 'role', 'authenticated')::text, true);
  select count(*) into n from public.shareholders; r := r || ' inv_register_rows=' || n;
  select count(*) into n from public.expenses; r := r || ' inv_exp=' || n;
  select count(*) into n from public.payments; r := r || ' inv_pay=' || n;
  select count(*) into n from public.invoices; r := r || ' inv_invoices=' || n;
  select count(*) into n from public.clients; r := r || ' inv_clients=' || n;
  ov := public.shareholder_overview();
  r := r || ' inv_holding=' || (ov->'holding'->>'name') || ':' || (ov->'holding'->>'shares') || '/' || (ov->>'total_shares')
         || '@' || (ov->'holding'->>'ownership_percent') || '% kes_spent_year=' || (ov->'currencies'->'KES'->>'spent_year');

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  delete from public.expenses where id = eid;
  get diagnostics n = row_count; r := r || ' fin_del=' || n;

  reset role;
  select string_agg(action, ',' order by id) into acts from public.audit_log where entity_id = eid::text;
  r := r || ' audit=' || coalesce(acts, 'none');
  raise exception 'ROLLBACK-RESULT: %', r;
end $$;
