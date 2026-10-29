-- Online call booking (owner, 2026-10-29: "build our own", replacing the
-- Cal.com facade and making WhatsApp secondary). Visitors book a slot on
-- /book; every booking is also a lead (source 'booking').
--
-- Public reads and writes go through the service role in server actions
-- (lib/booking), so anon has no access to any of these tables. Sales and
-- super_admin manage hours, blocks and bookings in the portal.
--
-- Times: booking_hours are wall-clock times in Africa/Nairobi (EAT, UTC+3,
-- no daylight saving); bookings store timestamptz.

create type public.booking_status as enum ('confirmed', 'cancelled', 'completed', 'no_show');

-- Weekly opening hours. Several rows per weekday allowed (e.g. a lunch break).
create table public.booking_hours (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

-- One-off unavailability: holidays, travel, busy afternoons.
create table public.booking_blocks (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text check (char_length(reason) <= 200),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lead_id uuid references public.leads (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  call_type text not null check (call_type in ('discovery-call', 'demo', 'contact-sales')),
  meeting_preference text not null check (meeting_preference in ('video', 'phone')),
  name text not null,
  email text not null,
  phone text,
  company text,
  notes text,
  status public.booking_status not null default 'confirmed',
  check (ends_at > starts_at),
  -- Two confirmed calls can never overlap, even if two visitors submit the
  -- same slot at the same moment: the second insert fails.
  constraint bookings_no_overlap exclude using gist (
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed')
);

create index bookings_starts_at_idx on public.bookings (starts_at);
create index bookings_lead_id_idx on public.bookings (lead_id);
create index booking_blocks_range_idx on public.booking_blocks (starts_at, ends_at);

alter table public.booking_hours enable row level security;
alter table public.booking_blocks enable row level security;
alter table public.bookings enable row level security;
revoke all on public.booking_hours, public.booking_blocks, public.bookings from anon;

create policy "booking_hours: sales/admin all"
  on public.booking_hours for all
  using (public.is_any_role(auth.uid(), 'sales', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'sales', 'super_admin'));

create policy "booking_blocks: sales/admin all"
  on public.booking_blocks for all
  using (public.is_any_role(auth.uid(), 'sales', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'sales', 'super_admin'));

-- Same readers as leads; only sales and super_admin change a booking.
create policy "bookings: sales/marketing/admin select"
  on public.bookings for select
  using (public.is_any_role(auth.uid(), 'sales', 'marketing', 'director', 'super_admin'));

create policy "bookings: sales/admin update"
  on public.bookings for update
  using (public.is_any_role(auth.uid(), 'sales', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'sales', 'super_admin'));

create function public.touch_booking()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bookings_touch
  before update on public.bookings
  for each row execute function public.touch_booking();

-- Audit status changes made in the portal (who cancelled or closed a call).
create function public.log_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'booking_' || new.status::text,
      'bookings',
      new.id::text,
      jsonb_build_object('from', old.status, 'to', new.status, 'starts_at', new.starts_at)
    );
  end if;
  return new;
end;
$$;

create trigger bookings_audit
  after update on public.bookings
  for each row execute function public.log_booking_status_change();
