-- Rolled-back test for recording KRA eTIMS details (migration …24). Safe on
-- the live project: temporary users, client and invoice, and the final
-- exception undoes everything, including the document counters. The
-- "error" starting with ROLLBACK-RESULT is the result.
--
-- Expected:
--   draft=blocked bad_number=blocked future=blocked bad_link=blocked
--   recorded=recorded:KRA/TEST/0001 corrected=KRA/TEST/0002 audit=2
--   direct_edit=0 sales=blocked cn=KRA/CN/0001 client_sees=KRA/TEST/0002
-- Passed on the live project 2026-10-30.
do $$
declare
  fin uuid := gen_random_uuid(); sal uuid := gen_random_uuid(); cli_user uuid := gen_random_uuid();
  r text := ''; cid uuid; inv uuid; cn uuid; n int; s text; today date := public.nairobi_today();
begin
  insert into auth.users (id, email, aud, role) values
    (fin, 'etims-fin@example.test', 'authenticated', 'authenticated'),
    (sal, 'etims-sal@example.test', 'authenticated', 'authenticated'),
    (cli_user, 'etims-cli@example.test', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values
    (fin, 'finance'), (sal, 'sales'), (cli_user, 'client');
  insert into public.clients (name, user_id) values ('eTIMS Test Client', cli_user) returning id into cid;

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.invoices (client_id, currency) values (cid, 'KES') returning id into inv;
  insert into public.invoice_items (invoice_id, description, quantity, unit_price_minor)
    values (inv, 'eTIMS test item', 1, 10000);

  begin
    perform public.record_invoice_etims(inv, 'KRA/TEST/0001', today, null);
    r := r || 'draft=ALLOWED';
  exception when others then r := r || 'draft=blocked'; end;

  perform public.issue_invoice(inv, today);

  begin
    perform public.record_invoice_etims(inv, 'x', today, null);
    r := r || ' bad_number=ALLOWED';
  exception when others then r := r || ' bad_number=blocked'; end;
  begin
    perform public.record_invoice_etims(inv, 'KRA/TEST/0001', today + 1, null);
    r := r || ' future=ALLOWED';
  exception when others then r := r || ' future=blocked'; end;
  begin
    perform public.record_invoice_etims(inv, 'KRA/TEST/0001', today, 'https://evil.example/kra.go.ke');
    r := r || ' bad_link=ALLOWED';
  exception when others then r := r || ' bad_link=blocked'; end;

  perform public.record_invoice_etims(inv, 'KRA/TEST/0001', today, 'https://itax.kra.go.ke/check');
  select etims_status || ':' || etims_reference into s from public.invoices where id = inv;
  r := r || ' recorded=' || s;
  perform public.record_invoice_etims(inv, ' KRA/TEST/0002 ', today, '');
  select etims_reference into s from public.invoices where id = inv;
  r := r || ' corrected=' || s;

  reset role;
  select count(*) into n from public.audit_log
    where entity_id = inv::text and action = 'invoice_etims_recorded';
  r := r || ' audit=' || n;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);

  -- Issued invoices are locked: a direct edit changes nothing.
  update public.invoices set etims_reference = 'HACKED' where id = inv;
  get diagnostics n = row_count;
  r := r || ' direct_edit=' || n;

  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  begin
    perform public.record_invoice_etims(inv, 'KRA/TEST/0003', today, null);
    r := r || ' sales=ALLOWED';
  exception when insufficient_privilege then r := r || ' sales=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  cn := public.issue_credit_note(inv, 2000, 'eTIMS test credit');
  perform public.record_credit_note_etims(cn, 'KRA/CN/0001', today, null);
  select etims_reference into s from public.credit_notes where id = cn;
  r := r || ' cn=' || s;

  perform set_config('request.jwt.claims', json_build_object('sub', cli_user, 'role', 'authenticated')::text, true);
  select etims_reference into s from public.invoices where id = inv;
  r := r || ' client_sees=' || coalesce(s, 'nothing');

  raise exception 'ROLLBACK-RESULT %', r;
end $$;
