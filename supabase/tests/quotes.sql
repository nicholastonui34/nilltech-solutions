-- Rolled-back test for quotes (migration …17). Safe on the live project:
-- temporary users, client and quotes, and the final exception undoes
-- everything, including the document counters. The "error" starting with
-- ROLLBACK-RESULT is the result.
--
-- Expected:
--   total=15000 empty_send=blocked sent=NTS-Q-...:sent locked=0
--   convert_sent=blocked declined=declined accepted=accepted invoice=draft:15000:2
--   again=blocked decide_after=blocked client_sees=1 client_sees_draft=0
--   sales_send=blocked sales_reads=0 director_reads=2 audit=4
-- Passed on the live project 2026-10-30.
do $$
declare
  fin uuid := gen_random_uuid(); dir uuid := gen_random_uuid(); sal uuid := gen_random_uuid();
  cli_user uuid := gen_random_uuid();
  r text := ''; cid uuid; q uuid; q_draft uuid; inv uuid; n bigint; st text; num text;
begin
  insert into auth.users (id, email, aud, role) values
    (fin, 'rls-fin@example.test', 'authenticated', 'authenticated'),
    (dir, 'rls-dir@example.test', 'authenticated', 'authenticated'),
    (sal, 'rls-sal@example.test', 'authenticated', 'authenticated'),
    (cli_user, 'rls-cli@example.test', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values
    (fin, 'finance'), (dir, 'director'), (sal, 'sales'), (cli_user, 'client');
  insert into public.clients (name, user_id) values ('RLS Test Client', cli_user) returning id into cid;

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- An empty draft can't be sent.
  insert into public.quotes (client_id, currency) values (cid, 'KES') returning id into q_draft;
  begin
    perform public.send_quote(q_draft, public.nairobi_today() + 30);
    r := r || 'empty_send=ALLOWED';
  exception when others then r := r || 'empty_send=blocked'; end;

  insert into public.quotes (client_id, currency, title) values (cid, 'KES', 'RLS test') returning id into q;
  insert into public.quote_items (quote_id, position, description, quantity, unit_price_minor)
    values (q, 0, 'Build', 1, 10000), (q, 1, 'Hosting', 2, 2500);
  select total_minor into n from public.quotes where id = q;
  r := 'total=' || n || ' ' || r;

  num := public.send_quote(q, public.nairobi_today() + 30);
  select status into st from public.quotes where id = q;
  r := r || ' sent=' || left(num, 6) || '...:' || st;

  -- Sent quotes are locked: lines and fields can't change.
  update public.quotes set total_minor = 1 where id = q;
  delete from public.quote_items where quote_id = q;
  select count(*) into n from public.quotes where id = q and total_minor = 1;
  r := r || ' locked=' || n;

  begin
    perform public.convert_quote_to_invoice(q);
    r := r || ' convert_sent=ALLOWED';
  exception when others then r := r || ' convert_sent=blocked'; end;

  perform public.decide_quote(q, 'declined', 'too expensive');
  select status into st from public.quotes where id = q; r := r || ' declined=' || st;
  perform public.decide_quote(q, 'accepted', 'came back');
  select status into st from public.quotes where id = q; r := r || ' accepted=' || st;

  inv := public.convert_quote_to_invoice(q);
  select i.status || ':' || i.total_minor || ':' || (select count(*) from public.invoice_items where invoice_id = inv)
    into st from public.invoices i where i.id = inv;
  r := r || ' invoice=' || st;

  begin
    perform public.convert_quote_to_invoice(q);
    r := r || ' again=ALLOWED';
  exception when others then r := r || ' again=blocked'; end;
  begin
    perform public.decide_quote(q, 'declined', null);
    r := r || ' decide_after=ALLOWED';
  exception when others then r := r || ' decide_after=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', cli_user, 'role', 'authenticated')::text, true);
  select count(*) into n from public.quotes where id = q; r := r || ' client_sees=' || n;
  select count(*) into n from public.quotes where id = q_draft; r := r || ' client_sees_draft=' || n;

  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  begin
    perform public.send_quote(q_draft, public.nairobi_today() + 30);
    r := r || ' sales_send=ALLOWED';
  exception when others then r := r || ' sales_send=blocked'; end;
  select count(*) into n from public.quotes where client_id = cid; r := r || ' sales_reads=' || n;

  perform set_config('request.jwt.claims', json_build_object('sub', dir, 'role', 'authenticated')::text, true);
  select count(*) into n from public.quotes where client_id = cid; r := r || ' director_reads=' || n;

  reset role;
  select count(*) into n from public.audit_log where entity_type = 'quotes' and entity_id = q::text;
  r := r || ' audit=' || n;

  raise exception 'ROLLBACK-RESULT %', r;
end $$;
