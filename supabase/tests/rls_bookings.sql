-- Rolled-back test for online booking (migration …13). Safe on the live
-- project: it creates temporary users and rows, checks access and the
-- no-double-booking rule, then raises an exception so EVERYTHING is undone.
-- The "error" starting with ROLLBACK-RESULT is the result, not a failure.
--
-- Expected:
--   overlap=blocked cancelled_overlap=allowed sales_sees=2 sales_update=1
--   sales_hours=1 sales_block=1 mkt_sees=2 mkt_update=0 mkt_hours_rows=0
--   mkt_hours_insert=blocked norole_sees=0 audit=booking_completed anon=denied
do $$
declare
  sal uuid := gen_random_uuid(); mkt uuid := gen_random_uuid(); nor uuid := gen_random_uuid();
  r text := ''; n int; bid uuid; acts text;
begin
  insert into auth.users (id, email, aud, role) values
    (sal, 'rls-sal@example.test', 'authenticated', 'authenticated'),
    (mkt, 'rls-mkt@example.test', 'authenticated', 'authenticated'),
    (nor, 'rls-none@example.test', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values (sal, 'sales'), (mkt, 'marketing');

  -- As the server (service role): one confirmed call, then a clash.
  insert into public.bookings (starts_at, ends_at, call_type, meeting_preference, name, email)
    values ('2030-01-07T07:00:00Z', '2030-01-07T07:30:00Z', 'demo', 'video', 'Test A', 'a@example.test')
    returning id into bid;
  begin
    insert into public.bookings (starts_at, ends_at, call_type, meeting_preference, name, email)
      values ('2030-01-07T07:15:00Z', '2030-01-07T07:45:00Z', 'demo', 'video', 'Test B', 'b@example.test');
    r := r || 'overlap=ALLOWED';
  exception when exclusion_violation then r := r || 'overlap=blocked'; end;
  begin
    insert into public.bookings (starts_at, ends_at, call_type, meeting_preference, name, email, status)
      values ('2030-01-07T07:00:00Z', '2030-01-07T07:30:00Z', 'demo', 'phone', 'Test C', 'c@example.test', 'cancelled');
    r := r || ' cancelled_overlap=allowed';
  exception when exclusion_violation then r := r || ' cancelled_overlap=BLOCKED'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.bookings where email like '%@example.test'; r := r || ' sales_sees=' || n;
  update public.bookings set status = 'completed' where id = bid;
  get diagnostics n = row_count; r := r || ' sales_update=' || n;
  insert into public.booking_hours (weekday, start_time, end_time) values (1, '09:00', '17:00');
  get diagnostics n = row_count; r := r || ' sales_hours=' || n;
  insert into public.booking_blocks (starts_at, ends_at) values ('2030-02-01T00:00:00Z', '2030-02-02T00:00:00Z');
  get diagnostics n = row_count; r := r || ' sales_block=' || n;

  perform set_config('request.jwt.claims', json_build_object('sub', mkt, 'role', 'authenticated')::text, true);
  select count(*) into n from public.bookings where email like '%@example.test'; r := r || ' mkt_sees=' || n;
  update public.bookings set status = 'cancelled' where id = bid;
  get diagnostics n = row_count; r := r || ' mkt_update=' || n;
  select count(*) into n from public.booking_hours; r := r || ' mkt_hours_rows=' || n;
  begin
    insert into public.booking_hours (weekday, start_time, end_time) values (2, '09:00', '10:00');
    r := r || ' mkt_hours_insert=ALLOWED';
  exception when insufficient_privilege then r := r || ' mkt_hours_insert=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', nor, 'role', 'authenticated')::text, true);
  select count(*) into n from public.bookings; r := r || ' norole_sees=' || n;

  reset role;
  -- Audit log is super_admin-only to read, so check it as the owner.
  select string_agg(action, ',') into acts from public.audit_log where entity_id = bid::text;
  r := r || ' audit=' || coalesce(acts, 'none');
  set local role anon;
  begin
    select count(*) into n from public.bookings; r := r || ' anon=READ ' || n;
  exception when insufficient_privilege then r := r || ' anon=denied'; end;

  raise exception 'ROLLBACK-RESULT %', r;
end $$;
