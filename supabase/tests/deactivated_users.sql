-- Rolled-back test for deactivated logins (migration …15). Safe on the live
-- project: the final exception undoes everything. The "error" starting
-- with ROLLBACK-RESULT is the result, not a failure.
--
-- Expected:
--   before=1 after=0 role_fn=false sessions_left=0 self_read=0
--   self_end_sessions=blocked admin_reads=1 reactivated=1
do $$
declare
  sal uuid := gen_random_uuid(); adm uuid := gen_random_uuid();
  r text := ''; n int; lid uuid; ok boolean;
begin
  insert into auth.users (id, email, aud, role) values
    (sal, 'rls-sal@example.test', 'authenticated', 'authenticated'),
    (adm, 'rls-adm@example.test', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values (sal, 'sales'), (adm, 'super_admin');
  insert into public.leads (source, name, email) values ('rls_test', 'RLS', 'rls@example.test')
    returning id into lid;
  insert into auth.sessions (id, user_id, created_at, updated_at)
    values (gen_random_uuid(), sal, now(), now());

  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.leads where id = lid; r := r || 'before=' || n;

  -- What the deactivate action does (as the server).
  reset role;
  insert into public.deactivated_users (user_id, deactivated_by) values (sal, adm);
  perform public.end_user_sessions(sal);
  select count(*) into n from auth.sessions where user_id = sal;

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  declare m int; begin
    select count(*) into m from public.leads where id = lid; r := r || ' after=' || m;
  end;
  select public.has_role(sal, 'sales') into ok; r := r || ' role_fn=' || ok;
  r := r || ' sessions_left=' || n;
  select count(*) into n from public.deactivated_users; r := r || ' self_read=' || n;
  begin
    perform public.end_user_sessions(adm);
    r := r || ' self_end_sessions=ALLOWED';
  exception when insufficient_privilege then r := r || ' self_end_sessions=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  select count(*) into n from public.deactivated_users where user_id = sal; r := r || ' admin_reads=' || n;

  reset role;
  delete from public.deactivated_users where user_id = sal;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  select count(*) into n from public.leads where id = lid; r := r || ' reactivated=' || n;

  raise exception 'ROLLBACK-RESULT %', r;
end $$;
