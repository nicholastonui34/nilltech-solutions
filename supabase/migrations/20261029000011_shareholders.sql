-- Shareholders and the shareholder summary (owner, 2026-10-29): directors
-- see the full share register on the Director dashboard; investors see
-- only their own holding and company-level totals, never individual
-- invoices, clients or expenses.
--
-- Ownership % is always shares / total shares, never stored, so it can't
-- drift. The register itself (names, share counts) is seeded via SQL, not
-- committed to the repo.

create table public.shareholders (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  shares integer not null check (shares > 0),
  -- e.g. "Director shareholder", "Investor".
  holder_type text not null check (holder_type in ('director', 'investor')),
  -- Portal login, for "your shares" on the dashboards.
  user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shareholders enable row level security;

create policy "shareholders: register for directors"
  on public.shareholders for select
  using (public.is_any_role(auth.uid(), 'director', 'super_admin'));

create policy "shareholders: own holding"
  on public.shareholders for select
  using (user_id = auth.uid());

create policy "shareholders: super_admin insert"
  on public.shareholders for insert
  with check (public.is_any_role(auth.uid(), 'super_admin'));

create policy "shareholders: super_admin update"
  on public.shareholders for update
  using (public.is_any_role(auth.uid(), 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'super_admin'));

create policy "shareholders: super_admin delete"
  on public.shareholders for delete
  using (public.is_any_role(auth.uid(), 'super_admin'));

create function public.log_shareholder_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _row public.shareholders;
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  _row := case when tg_op = 'DELETE' then old else new end;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'shareholder_' || lower(tg_op),
    'shareholders',
    _row.id::text,
    jsonb_build_object('name', _row.name, 'shares', _row.shares)
      || case when tg_op = 'UPDATE' then jsonb_build_object('previous_shares', old.shares) else '{}'::jsonb end
  );
  return _row;
end;
$$;

create trigger shareholders_audit_before
  before update on public.shareholders
  for each row execute function public.log_shareholder_change();

create trigger shareholders_audit_after
  after insert or delete on public.shareholders
  for each row execute function public.log_shareholder_change();

-- Company totals for shareholders, per currency (never converted), plus
-- the caller's own holding. SECURITY DEFINER so investors get aggregates
-- without read access to invoices, payments or expenses themselves.
-- "Year" is the calendar year in Nairobi time.
create function public.shareholder_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  _year_start date := date_trunc('year', (now() at time zone 'Africa/Nairobi'))::date;
  _currencies jsonb;
  _holding jsonb;
  _total_shares bigint;
begin
  if not public.is_any_role(auth.uid(), 'investor', 'director', 'super_admin') then
    raise exception 'Not authorized';
  end if;

  select coalesce(sum(shares), 0) into _total_shares from public.shareholders;

  select jsonb_build_object('name', s.name, 'shares', s.shares, 'holder_type', s.holder_type)
    into _holding
    from public.shareholders s
    where s.user_id = auth.uid();

  select jsonb_object_agg(c.code, jsonb_build_object(
      'collected_all', coalesce((select sum(p.amount_minor) from public.payments p where p.currency = c.code), 0),
      'collected_year', coalesce((select sum(p.amount_minor) from public.payments p where p.currency = c.code and p.paid_on >= _year_start), 0),
      'spent_all', coalesce((select sum(e.amount_minor) from public.expenses e where e.currency = c.code), 0),
      'spent_year', coalesce((select sum(e.amount_minor) from public.expenses e where e.currency = c.code and e.spent_on >= _year_start), 0),
      'receivables', coalesce((select sum(i.total_minor - i.paid_minor) from public.invoices i
                               where i.currency = c.code and i.status in ('issued', 'partially_paid')), 0)
    ))
    into _currencies
    from (select unnest(enum_range(null::public.currency_code)) as code) c;

  return jsonb_build_object(
    'total_shares', _total_shares,
    'holding', _holding,
    'currencies', _currencies,
    'year_start', _year_start
  );
end;
$$;

revoke all on function public.shareholder_overview() from public, anon;
grant execute on function public.shareholder_overview() to authenticated;
