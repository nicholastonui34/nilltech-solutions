-- Website chat (owner, 2026-10-30): an AI assistant answers visitors from the
-- site's own content; when it can't, the visitor can talk to a person (live
-- chat, answered by sales in the portal during booking hours while someone
-- is online), open WhatsApp, or leave a message that becomes a lead.
--
-- Privacy: conversations with the assistant alone are not stored. A
-- conversation is stored only once the visitor asks for a person or leaves
-- a message; the recent assistant exchange is saved with it so the agent
-- has context. Stored chats are deleted after 12 months.
--
-- Visitors never touch these tables directly: the website's server routes
-- use the service role and check a per-conversation secret token (only its
-- SHA-256 is stored). Sales and super admins read and answer in the portal.

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  status text not null default 'waiting'
    check (status in ('waiting', 'live', 'closed', 'offline_message')),
  visitor_token_hash text not null,
  visitor_name text not null check (length(visitor_name) between 1 and 100),
  visitor_email text check (visitor_email is null or length(visitor_email) <= 200),
  page_path text check (page_path is null or length(page_path) <= 300),
  assigned_to uuid references auth.users (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  closed_at timestamptz,
  closed_by uuid references auth.users (id) on delete set null
);

create index chat_conversations_status_idx on public.chat_conversations (status, last_message_at desc);

create table public.chat_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  created_at timestamptz not null default now(),
  sender text not null check (sender in ('visitor', 'bot', 'agent', 'system')),
  body text not null check (length(body) between 1 and 4000),
  agent_id uuid references auth.users (id) on delete set null
);

create index chat_messages_conversation_idx on public.chat_messages (conversation_id, id);

-- Agents who have the Live chat page open (heartbeat every ~30 seconds).
create table public.chat_agent_presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

-- Monthly AI spend, so the assistant can stop at the owner's cap.
create table public.chat_ai_usage (
  month text primary key check (month ~ '^\d{4}-\d{2}$'),
  requests integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cache_read_tokens bigint not null default 0,
  cache_write_tokens bigint not null default 0,
  cost_usd_micros bigint not null default 0
);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_agent_presence enable row level security;
alter table public.chat_ai_usage enable row level security;
revoke all on public.chat_conversations, public.chat_messages,
  public.chat_agent_presence, public.chat_ai_usage from anon;

create policy "chat conversations: sales/admin select"
  on public.chat_conversations for select
  using (public.is_any_role(auth.uid(), 'sales', 'super_admin'));

create policy "chat conversations: sales/admin update"
  on public.chat_conversations for update
  using (public.is_any_role(auth.uid(), 'sales', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'sales', 'super_admin'));

create policy "chat messages: sales/admin select"
  on public.chat_messages for select
  using (public.is_any_role(auth.uid(), 'sales', 'super_admin'));

create policy "chat messages: agent insert"
  on public.chat_messages for insert
  with check (
    public.is_any_role(auth.uid(), 'sales', 'super_admin')
    and sender = 'agent'
    and agent_id = auth.uid()
  );

create policy "chat presence: own row"
  on public.chat_agent_presence for all
  using (user_id = auth.uid() and public.is_any_role(auth.uid(), 'sales', 'super_admin'))
  with check (user_id = auth.uid() and public.is_any_role(auth.uid(), 'sales', 'super_admin'));

create policy "chat ai usage: admin/marketing read"
  on public.chat_ai_usage for select
  using (public.is_any_role(auth.uid(), 'super_admin', 'marketing', 'director'));

-- Visitor token hashes stay server-side: app roles read every column but that one.
revoke select on public.chat_conversations from authenticated;
grant select (id, created_at, last_message_at, status, visitor_name, visitor_email,
  page_path, assigned_to, lead_id, closed_at, closed_by)
  on public.chat_conversations to authenticated;

-- Keep last_message_at in step so the portal list sorts by activity.
create function public.touch_chat_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_conversations
  set last_message_at = new.created_at,
      status = case
        when new.sender = 'agent' and status = 'waiting' then 'live'
        else status
      end,
      assigned_to = case
        when new.sender = 'agent' and assigned_to is null then new.agent_id
        else assigned_to
      end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger chat_messages_touch
  after insert on public.chat_messages
  for each row execute function public.touch_chat_conversation();

-- Is a person available right now? Someone with sales or super_admin has
-- the Live chat page open (seen in the last 90 seconds), it's within the
-- weekly booking hours (Nairobi time) and not inside a blocked period.
create function public.chat_live_available()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_agent_presence p
    where p.last_seen_at > now() - interval '90 seconds'
      and public.is_any_role(p.user_id, 'sales', 'super_admin')
  )
  and exists (
    select 1 from public.booking_hours h
    where h.weekday = extract(dow from (now() at time zone 'Africa/Nairobi'))::int
      and (now() at time zone 'Africa/Nairobi')::time >= h.start_time
      and (now() at time zone 'Africa/Nairobi')::time < h.end_time
  )
  and not exists (
    select 1 from public.booking_blocks b
    where now() >= b.starts_at and now() < b.ends_at
  );
$$;

create function public.record_chat_ai_usage(
  _month text, _input bigint, _output bigint, _cache_read bigint, _cache_write bigint, _cost_micros bigint
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.chat_ai_usage as u (month, requests, input_tokens, output_tokens,
    cache_read_tokens, cache_write_tokens, cost_usd_micros)
  values (_month, 1, _input, _output, _cache_read, _cache_write, _cost_micros)
  on conflict (month) do update set
    requests = u.requests + 1,
    input_tokens = u.input_tokens + excluded.input_tokens,
    output_tokens = u.output_tokens + excluded.output_tokens,
    cache_read_tokens = u.cache_read_tokens + excluded.cache_read_tokens,
    cache_write_tokens = u.cache_write_tokens + excluded.cache_write_tokens,
    cost_usd_micros = u.cost_usd_micros + excluded.cost_usd_micros;
$$;

create function public.delete_old_chats()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.chat_conversations where last_message_at < now() - interval '12 months';
$$;

-- Server-only helpers (service role); app roles can't call them.
revoke all on function public.chat_live_available() from public, anon, authenticated;
revoke all on function public.record_chat_ai_usage(text, bigint, bigint, bigint, bigint, bigint) from public, anon, authenticated;
revoke all on function public.delete_old_chats() from public, anon, authenticated;
grant execute on function public.chat_live_available() to service_role;
grant execute on function public.record_chat_ai_usage(text, bigint, bigint, bigint, bigint, bigint) to service_role;
grant execute on function public.delete_old_chats() to service_role;
