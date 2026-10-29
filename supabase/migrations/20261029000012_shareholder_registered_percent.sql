-- Registered ownership percentage (owner, 2026-10-29): the company's
-- register states Nicholas Tonui 29.34%, Fumbwe Hamisi and Wendy Achieng
-- 29.33% each, Angela Matthes 12.00%, while each director holds 352 of
-- 1,200 shares (29.33% by arithmetic). When set, this figure is what the
-- dashboards show and value holdings by; when null, ownership is derived
-- from share counts.
alter table public.shareholders
  add column ownership_percent numeric(5, 2)
    check (ownership_percent is null or (ownership_percent > 0 and ownership_percent <= 100));

create or replace function public.shareholder_overview()
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

  select jsonb_build_object(
      'name', s.name,
      'shares', s.shares,
      'holder_type', s.holder_type,
      'ownership_percent', s.ownership_percent
    )
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
