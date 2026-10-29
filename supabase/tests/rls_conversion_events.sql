-- Rolled-back test for conversion events (migration …14). Safe on the live
-- project: everything is undone by the final exception. The "error"
-- starting with ROLLBACK-RESULT is the result, not a failure.
--
-- Expected:
--   bad_event=blocked big_props=blocked mkt_sees=1 dir_sees=1 sales_sees=0
--   mkt_insert=blocked mkt_cleanup=blocked anon=denied old_removed=1
do $$
declare
  mkt uuid := gen_random_uuid(); dir uuid := gen_random_uuid(); sal uuid := gen_random_uuid();
  r text := ''; n int;
begin
  insert into auth.users (id, email, aud, role) values
    (mkt, 'rls-mkt@example.test', 'authenticated', 'authenticated'),
    (dir, 'rls-dir@example.test', 'authenticated', 'authenticated'),
    (sal, 'rls-sal@example.test', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values (mkt, 'marketing'), (dir, 'director'), (sal, 'sales');

  -- As the server (service role).
  insert into public.conversion_events (event, path, props, source)
    values ('cta_click', '/rls-test', '{"intent":"quote"}', 'rls-test');
  begin
    insert into public.conversion_events (event, path) values ('page_view', '/x');
    r := r || 'bad_event=ALLOWED';
  exception when check_violation then r := r || 'bad_event=blocked'; end;
  begin
    insert into public.conversion_events (event, path, props)
      values ('cta_click', '/x', jsonb_build_object('note', repeat('x', 2000)));
    r := r || ' big_props=ALLOWED';
  exception when check_violation then r := r || ' big_props=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', mkt, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.conversion_events where source = 'rls-test'; r := r || ' mkt_sees=' || n;
  perform set_config('request.jwt.claims', json_build_object('sub', dir, 'role', 'authenticated')::text, true);
  select count(*) into n from public.conversion_events where source = 'rls-test'; r := r || ' dir_sees=' || n;
  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  select count(*) into n from public.conversion_events where source = 'rls-test'; r := r || ' sales_sees=' || n;

  perform set_config('request.jwt.claims', json_build_object('sub', mkt, 'role', 'authenticated')::text, true);
  begin
    insert into public.conversion_events (event, path) values ('cta_click', '/x');
    r := r || ' mkt_insert=ALLOWED';
  exception when insufficient_privilege then r := r || ' mkt_insert=blocked'; end;
  begin
    perform public.delete_old_conversion_events();
    r := r || ' mkt_cleanup=ALLOWED';
  exception when insufficient_privilege then r := r || ' mkt_cleanup=blocked'; end;

  reset role;
  set local role anon;
  begin
    select count(*) into n from public.conversion_events; r := r || ' anon=READ ' || n;
  exception when insufficient_privilege then r := r || ' anon=denied'; end;

  reset role;
  insert into public.conversion_events (created_at, event, path, source)
    values (now() - interval '14 months', 'cta_click', '/old', 'rls-test-old');
  perform public.delete_old_conversion_events();
  select 1 - count(*) into n from public.conversion_events where source = 'rls-test-old';
  r := r || ' old_removed=' || n;

  raise exception 'ROLLBACK-RESULT %', r;
end $$;
