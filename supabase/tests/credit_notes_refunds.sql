-- Rolled-back test for credit notes and refunds (migration …16). Safe on
-- the live project: it uses temporary users, a temporary client and
-- invoices, and the final exception undoes everything, including the
-- document counters. The "error" starting with ROLLBACK-RESULT is the result.
--
-- Expected:
--   paid=paid over_credit=blocked cn=NTS-CN-...:issued(paid) bal=-3000
--   over_refund=blocked refund=NTS-RFD-...:paid bal=0 void_credited=blocked
--   overpay_after_credit=blocked full_credit=credited collected_delta=7000
--   receivable_delta=0 sales_cn=blocked client_sees=1
-- Passed on the live project 2026-10-30.
do $$
declare
  fin uuid := gen_random_uuid(); dir uuid := gen_random_uuid(); sal uuid := gen_random_uuid();
  cli_user uuid := gen_random_uuid();
  r text := ''; cid uuid; inv uuid; inv2 uuid; inv3 uuid; n bigint; st text; num text;
  ov_before jsonb; ov_after jsonb;
begin
  insert into auth.users (id, email, aud, role) values
    (fin, 'rls-fin@example.test', 'authenticated', 'authenticated'),
    (dir, 'rls-dir@example.test', 'authenticated', 'authenticated'),
    (sal, 'rls-sal@example.test', 'authenticated', 'authenticated'),
    (cli_user, 'rls-cli@example.test', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values
    (fin, 'finance'), (dir, 'director'), (sal, 'sales'), (cli_user, 'client');
  insert into public.clients (name, user_id) values ('RLS Test Client', cli_user) returning id into cid;

  perform set_config('request.jwt.claims', json_build_object('sub', dir, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ov_before := public.shareholder_overview();

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  -- Invoice A: KES 100.00, paid in full, then 30.00 credited and refunded.
  insert into public.invoices (client_id, currency) values (cid, 'KES') returning id into inv;
  insert into public.invoice_items (invoice_id, description, quantity, unit_price_minor)
    values (inv, 'RLS test item', 1, 10000);
  perform public.issue_invoice(inv, public.nairobi_today());
  perform public.record_payment(inv, 10000, 'mpesa', 'RLSTEST', public.nairobi_today(), null);
  select status into st from public.invoices where id = inv; r := r || 'paid=' || st;

  begin
    perform public.issue_credit_note(inv, 10001, 'too much');
    r := r || ' over_credit=ALLOWED';
  exception when others then r := r || ' over_credit=blocked'; end;

  perform public.issue_credit_note(inv, 3000, 'Reduced scope');
  select number into num from public.credit_notes where invoice_id = inv;
  select status, balance_minor into st, n from public.invoices where id = inv;
  r := r || ' cn=' || left(num, 7) || '...:issued(' || st || ') bal=' || n;

  begin
    perform public.record_refund(inv, 3001, 'mpesa', null, public.nairobi_today(), 'too much');
    r := r || ' over_refund=ALLOWED';
  exception when others then r := r || ' over_refund=blocked'; end;

  perform public.record_refund(inv, 3000, 'mpesa', 'RLSREF', public.nairobi_today(), 'Refund of reduced scope');
  select number into num from public.refunds where invoice_id = inv;
  select status, balance_minor into st, n from public.invoices where id = inv;
  r := r || ' refund=' || left(num, 8) || '...:' || st || ' bal=' || n;

  -- Invoice B: credited in part, then void must be refused.
  insert into public.invoices (client_id, currency) values (cid, 'KES') returning id into inv2;
  insert into public.invoice_items (invoice_id, description, quantity, unit_price_minor)
    values (inv2, 'RLS test item', 1, 5000);
  perform public.issue_invoice(inv2, public.nairobi_today());
  perform public.issue_credit_note(inv2, 1000, 'Discount');
  begin
    perform public.void_invoice(inv2, 'test void');
    r := r || ' void_credited=ALLOWED';
  exception when others then r := r || ' void_credited=blocked'; end;
  begin
    perform public.record_payment(inv2, 4001, 'mpesa', null, public.nairobi_today(), null);
    r := r || ' overpay_after_credit=ALLOWED';
  exception when others then r := r || ' overpay_after_credit=blocked'; end;
  perform public.issue_credit_note(inv2, 4000, 'Cancelled');
  select status into st from public.invoices where id = inv2; r := r || ' full_credit=' || st;

  perform set_config('request.jwt.claims', json_build_object('sub', dir, 'role', 'authenticated')::text, true);
  ov_after := public.shareholder_overview();
  r := r || ' collected_delta=' ||
    ((ov_after->'currencies'->'KES'->>'collected_all')::bigint - (ov_before->'currencies'->'KES'->>'collected_all')::bigint);
  r := r || ' receivable_delta=' ||
    ((ov_after->'currencies'->'KES'->>'receivables')::bigint - (ov_before->'currencies'->'KES'->>'receivables')::bigint);

  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  begin
    perform public.issue_credit_note(inv, 1, 'sales try');
    r := r || ' sales_cn=ALLOWED';
  exception when others then r := r || ' sales_cn=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', cli_user, 'role', 'authenticated')::text, true);
  select count(*) into n from public.credit_notes where invoice_id = inv; r := r || ' client_sees=' || n;

  raise exception 'ROLLBACK-RESULT %', r;
end $$;
