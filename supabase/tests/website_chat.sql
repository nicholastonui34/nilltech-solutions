-- Rolled-back test for the website chat (migration …23). Safe on the live
-- project: the final exception undoes everything. The "error" starting
-- with ROLLBACK-RESULT is the result, not a failure.
--
-- Expected:
--   sales_reads=1 msgs=2 hash=blocked agent_msg=ok status=live assigned=yes
--   fake_visitor=blocked fake_agent_id=blocked mkt_reads=0 mkt_usage=1
--   sales_usage=0 avail_fn=blocked usage_fn=blocked presence_other=blocked
--   available=false closed=ok
do $$
declare
  sal uuid := gen_random_uuid(); sal2 uuid := gen_random_uuid(); mkt uuid := gen_random_uuid();
  r text := ''; n int; cid uuid; s text; a uuid; ok boolean;
begin
  insert into auth.users (id, email, aud, role) values
    (sal, 'chat-sal@example.test', 'authenticated', 'authenticated'),
    (sal2, 'chat-sal2@example.test', 'authenticated', 'authenticated'),
    (mkt, 'chat-mkt@example.test', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values
    (sal, 'sales'), (sal2, 'sales'), (mkt, 'marketing');

  -- What the website server does (service role): start a chat.
  insert into public.chat_conversations (visitor_token_hash, visitor_name, page_path)
    values (encode(sha256('secret'::bytea), 'hex'), 'Test Visitor', '/services')
    returning id into cid;
  insert into public.chat_messages (conversation_id, sender, body) values
    (cid, 'visitor', 'Hello'), (cid, 'system', 'Asked for a person');
  perform public.record_chat_ai_usage('2099-01', 100, 50, 0, 0, 35);

  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.chat_conversations where id = cid; r := r || 'sales_reads=' || n;
  select count(*) into n from public.chat_messages where conversation_id = cid; r := r || ' msgs=' || n;
  begin
    perform visitor_token_hash from public.chat_conversations where id = cid;
    r := r || ' hash=READABLE';
  exception when insufficient_privilege then r := r || ' hash=blocked'; end;

  insert into public.chat_messages (conversation_id, sender, body, agent_id)
    values (cid, 'agent', 'Hi, how can I help?', sal);
  r := r || ' agent_msg=ok';
  select status, assigned_to into s, a from public.chat_conversations where id = cid;
  r := r || ' status=' || s || ' assigned=' || case when a = sal then 'yes' else 'no' end;

  begin
    insert into public.chat_messages (conversation_id, sender, body) values (cid, 'visitor', 'Fake');
    r := r || ' fake_visitor=ALLOWED';
  exception when insufficient_privilege then r := r || ' fake_visitor=blocked'; end;
  begin
    insert into public.chat_messages (conversation_id, sender, body, agent_id)
      values (cid, 'agent', 'As someone else', sal2);
    r := r || ' fake_agent_id=ALLOWED';
  exception when insufficient_privilege then r := r || ' fake_agent_id=blocked'; end;

  perform set_config('request.jwt.claims', json_build_object('sub', mkt, 'role', 'authenticated')::text, true);
  select count(*) into n from public.chat_conversations; r := r || ' mkt_reads=' || n;
  select count(*) into n from public.chat_ai_usage where month = '2099-01'; r := r || ' mkt_usage=' || n;

  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  select count(*) into n from public.chat_ai_usage where month = '2099-01'; r := r || ' sales_usage=' || n;
  begin
    perform public.chat_live_available();
    r := r || ' avail_fn=ALLOWED';
  exception when insufficient_privilege then r := r || ' avail_fn=blocked'; end;
  begin
    perform public.record_chat_ai_usage('2099-01', 1, 1, 0, 0, 1);
    r := r || ' usage_fn=ALLOWED';
  exception when insufficient_privilege then r := r || ' usage_fn=blocked'; end;
  begin
    insert into public.chat_agent_presence (user_id) values (sal2);
    r := r || ' presence_other=ALLOWED';
  exception when insufficient_privilege then r := r || ' presence_other=blocked'; end;
  insert into public.chat_agent_presence (user_id) values (sal)
    on conflict (user_id) do update set last_seen_at = now();

  -- An agent is online, but with no booking hours (removed here, and
  -- restored by the rollback) nobody should be offered to visitors.
  reset role;
  delete from public.booking_hours;
  select public.chat_live_available() into ok; r := r || ' available=' || ok;

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', sal, 'role', 'authenticated')::text, true);
  update public.chat_conversations set status = 'closed', closed_at = now(), closed_by = sal where id = cid;
  select status into s from public.chat_conversations where id = cid;
  r := r || ' closed=' || case when s = 'closed' then 'ok' else s end;

  raise exception 'ROLLBACK-RESULT %', r;
end $$;
