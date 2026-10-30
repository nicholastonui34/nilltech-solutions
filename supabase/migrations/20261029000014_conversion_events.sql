-- Conversion events (CLAUDE.md §5): CTA clicks, form starts and sends,
-- bookings, WhatsApp and call taps, estimates shown. Sent from the browser
-- to /api/events and written with the service role, so anon and
-- authenticated users can't write here directly.
--
-- Anonymous by design: no cookie, no visitor id, no IP address, no form
-- contents. Only the event name, the page path, a few short labels (which
-- button, which form) and how the session arrived (campaign source or
-- referring site). Kept 13 months; older rows are removed by
-- delete_old_conversion_events(), called from the API route.

create table public.conversion_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event text not null check (
    event in (
      'cta_click', 'form_start', 'form_submit', 'booking_complete',
      'whatsapp_click', 'call_click', 'quote_generated'
    )
  ),
  path text not null check (char_length(path) <= 200),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) <= 1024),
  source text check (char_length(source) <= 100)
);

create index conversion_events_created_idx on public.conversion_events (created_at desc);
create index conversion_events_event_idx on public.conversion_events (event, created_at desc);

alter table public.conversion_events enable row level security;
revoke all on public.conversion_events from anon;

-- Same readers as the Marketing and Analytics dashboards.
create policy "conversion_events: marketing/director/admin select"
  on public.conversion_events for select
  using (public.is_any_role(auth.uid(), 'marketing', 'director', 'super_admin'));

-- Retention: 13 months.
create function public.delete_old_conversion_events()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.conversion_events where created_at < now() - interval '13 months';
$$;

revoke all on function public.delete_old_conversion_events() from public, anon, authenticated;
