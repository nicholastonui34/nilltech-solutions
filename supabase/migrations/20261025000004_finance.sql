-- Phase 5 — Finance & documents (CLAUDE.md §10).
--
-- Money is stored as integer minor units (cents) in the invoice's own
-- currency — no floats, no cross-currency arithmetic. NillTech is not
-- VAT-registered (owner, 2026-10-25), so there is no tax line.
--
-- Write rules are enforced here, not only in the app:
--   * Drafts are editable by finance/super_admin through RLS.
--   * Issuing, voiding and recording payments only happen through the
--     SECURITY DEFINER functions below, which check the role, lock the
--     row, assign gapless numbers and write the audit log.
--   * Issued invoices are immutable: RLS only permits updates to drafts,
--     and line items can only change while their invoice is a draft.

create type public.currency_code as enum ('KES', 'USD');
create type public.invoice_status as enum ('draft', 'issued', 'partially_paid', 'paid', 'void');
create type public.payment_method as enum ('mpesa', 'bank_transfer', 'other');

-- ---------------------------------------------------------------------------
-- Seller details printed on documents. Single row. Kept in the database
-- (seeded outside version control) rather than in the repo, because it
-- holds bank details; editable from the Finance dashboard.
create table public.finance_settings (
  id boolean primary key default true check (id),
  legal_name text not null,
  kra_pin text,
  address_lines text[] not null default '{}',
  email text,
  phone text,
  bank_name text,
  bank_branch text,
  bank_account_name text,
  bank_account_number text,
  bank_swift text,
  bank_account_currency public.currency_code,
  mpesa_paybill text,
  mpesa_account text,
  invoice_footer text,
  default_payment_terms_days integer not null default 14
    check (default_payment_terms_days between 0 and 365),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

alter table public.finance_settings enable row level security;

create policy "finance_settings: finance select"
  on public.finance_settings for select
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin'));

create policy "finance_settings: finance update"
  on public.finance_settings for update
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'finance', 'super_admin'));

-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  company text,
  email text,
  phone text,
  address text,
  -- Portal login for this client (role `client`), if any.
  user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

alter table public.clients enable row level security;

create policy "clients: finance/director select"
  on public.clients for select
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin', 'director'));

create policy "clients: own record select"
  on public.clients for select
  using (user_id = auth.uid());

create policy "clients: finance insert"
  on public.clients for insert
  with check (public.is_any_role(auth.uid(), 'finance', 'super_admin'));

create policy "clients: finance update"
  on public.clients for update
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'finance', 'super_admin'));

-- ---------------------------------------------------------------------------
-- Gapless per-year counters. No policies: only the SECURITY DEFINER
-- functions below touch it.
create table public.document_sequences (
  doc_type text not null,
  year integer not null,
  last_number integer not null,
  primary key (doc_type, year)
);

alter table public.document_sequences enable row level security;

-- ---------------------------------------------------------------------------
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text unique,
  client_id uuid not null references public.clients (id) on delete restrict,
  currency public.currency_code not null,
  status public.invoice_status not null default 'draft',
  issue_date date,
  due_date date,
  notes text,
  total_minor bigint not null default 0,
  paid_minor bigint not null default 0,
  seller_snapshot jsonb,
  client_snapshot jsonb,
  etims_status text not null default 'not_submitted',
  etims_reference text,
  void_reason text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  issued_at timestamptz,
  issued_by uuid references auth.users (id),
  voided_at timestamptz,
  voided_by uuid references auth.users (id)
);

create index invoices_client_id_idx on public.invoices (client_id);
create index invoices_status_idx on public.invoices (status);
create index invoices_created_at_idx on public.invoices (created_at desc);

alter table public.invoices enable row level security;

create policy "invoices: finance/director select"
  on public.invoices for select
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin', 'director'));

-- Clients see their own invoices once issued — never drafts.
create policy "invoices: client select own"
  on public.invoices for select
  using (
    status <> 'draft'
    and client_id in (select id from public.clients where user_id = auth.uid())
  );

create policy "invoices: finance insert draft"
  on public.invoices for insert
  with check (
    public.is_any_role(auth.uid(), 'finance', 'super_admin')
    and status = 'draft'
    and number is null
    and paid_minor = 0
  );

create policy "invoices: finance update draft"
  on public.invoices for update
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin') and status = 'draft')
  with check (
    public.is_any_role(auth.uid(), 'finance', 'super_admin')
    and status = 'draft'
    and number is null
    and paid_minor = 0
  );

create policy "invoices: finance delete draft"
  on public.invoices for delete
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin') and status = 'draft');

-- ---------------------------------------------------------------------------
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  position integer not null default 0,
  description text not null check (length(description) between 1 and 500),
  quantity numeric(10, 2) not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  line_total_minor bigint generated always as (round(quantity * unit_price_minor)::bigint) stored
);

create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id, position);

alter table public.invoice_items enable row level security;

-- Visible whenever the parent invoice is visible (invoices RLS applies to
-- the subquery).
create policy "invoice_items: select with invoice"
  on public.invoice_items for select
  using (exists (select 1 from public.invoices i where i.id = invoice_id));

create policy "invoice_items: finance write on drafts"
  on public.invoice_items for all
  using (
    public.is_any_role(auth.uid(), 'finance', 'super_admin')
    and exists (select 1 from public.invoices i where i.id = invoice_id and i.status = 'draft')
  )
  with check (
    public.is_any_role(auth.uid(), 'finance', 'super_admin')
    and exists (select 1 from public.invoices i where i.id = invoice_id and i.status = 'draft')
  );

-- Keep invoices.total_minor in step with the line items.
create function public.recalculate_invoice_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _invoice_id uuid := coalesce(new.invoice_id, old.invoice_id);
begin
  update public.invoices
  set total_minor = coalesce(
    (select sum(line_total_minor) from public.invoice_items where invoice_id = _invoice_id), 0)
  where id = _invoice_id and status = 'draft';
  return null;
end;
$$;

create trigger invoice_items_recalculate_total
  after insert or update or delete on public.invoice_items
  for each row execute function public.recalculate_invoice_total();

-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete restrict,
  receipt_number text not null unique,
  amount_minor bigint not null check (amount_minor > 0),
  currency public.currency_code not null,
  method public.payment_method not null,
  reference text,
  paid_on date not null,
  notes text,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references auth.users (id)
);

create index payments_invoice_id_idx on public.payments (invoice_id);

alter table public.payments enable row level security;

create policy "payments: finance/director select"
  on public.payments for select
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin', 'director'));

create policy "payments: client select own"
  on public.payments for select
  using (
    exists (
      select 1 from public.invoices i
      join public.clients c on c.id = i.client_id
      where i.id = invoice_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Functions

create function public.nairobi_today()
returns date
language sql
stable
as $$ select (now() at time zone 'Africa/Nairobi')::date $$;

-- NTS-2026-0001 (invoices), NTS-RCT-2026-0001 (receipts). Internal only.
create function public.next_document_number(_doc_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _year integer := extract(year from public.nairobi_today())::integer;
  _n integer;
  _prefix text;
begin
  _prefix := case _doc_type
    when 'invoice' then 'NTS-'
    when 'receipt' then 'NTS-RCT-'
    else null
  end;
  if _prefix is null then
    raise exception 'unknown document type %', _doc_type;
  end if;

  insert into public.document_sequences (doc_type, year, last_number)
  values (_doc_type, _year, 1)
  on conflict (doc_type, year)
  do update set last_number = public.document_sequences.last_number + 1
  returning last_number into _n;

  return _prefix || _year || '-' || lpad(_n::text, 4, '0');
end;
$$;

revoke all on function public.next_document_number(text) from public, anon, authenticated;

create function public.issue_invoice(_invoice_id uuid, _due_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _invoice public.invoices;
  _client public.clients;
  _settings public.finance_settings;
  _total bigint;
  _number text;
  _today date := public.nairobi_today();
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into _invoice from public.invoices where id = _invoice_id for update;
  if not found then raise exception 'invoice not found'; end if;
  if _invoice.status <> 'draft' then raise exception 'only drafts can be issued'; end if;
  if _due_date is null or _due_date < _today then
    raise exception 'due date must be today or later';
  end if;

  select coalesce(sum(line_total_minor), 0) into _total
  from public.invoice_items where invoice_id = _invoice_id;
  if _total <= 0 then raise exception 'add at least one line item with a price'; end if;

  select * into _settings from public.finance_settings where id;
  if not found then raise exception 'finance settings are missing'; end if;

  select * into _client from public.clients where id = _invoice.client_id;

  _number := public.next_document_number('invoice');

  update public.invoices set
    number = _number,
    status = 'issued',
    issue_date = _today,
    due_date = _due_date,
    total_minor = _total,
    seller_snapshot = to_jsonb(_settings) - 'id' - 'updated_at' - 'updated_by',
    client_snapshot = jsonb_build_object(
      'name', _client.name,
      'company', _client.company,
      'email', _client.email,
      'phone', _client.phone,
      'address', _client.address
    ),
    issued_at = now(),
    issued_by = auth.uid()
  where id = _invoice_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'invoice_issued', 'invoices', _invoice_id::text,
    jsonb_build_object('number', _number, 'total_minor', _total, 'currency', _invoice.currency));

  return _number;
end;
$$;

create function public.void_invoice(_invoice_id uuid, _reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _invoice public.invoices;
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if coalesce(length(trim(_reason)), 0) < 3 then
    raise exception 'give a reason for voiding';
  end if;

  select * into _invoice from public.invoices where id = _invoice_id for update;
  if not found then raise exception 'invoice not found'; end if;
  if _invoice.status <> 'issued' or _invoice.paid_minor <> 0 then
    raise exception 'only issued invoices with no payments can be voided';
  end if;

  update public.invoices set
    status = 'void',
    void_reason = trim(_reason),
    voided_at = now(),
    voided_by = auth.uid()
  where id = _invoice_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'invoice_voided', 'invoices', _invoice_id::text,
    jsonb_build_object('number', _invoice.number, 'reason', trim(_reason)));
end;
$$;

create function public.record_payment(
  _invoice_id uuid,
  _amount_minor bigint,
  _method public.payment_method,
  _reference text,
  _paid_on date,
  _notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _invoice public.invoices;
  _receipt text;
  _payment_id uuid;
  _new_paid bigint;
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into _invoice from public.invoices where id = _invoice_id for update;
  if not found then raise exception 'invoice not found'; end if;
  if _invoice.status not in ('issued', 'partially_paid') then
    raise exception 'payments can only be recorded against issued, unpaid invoices';
  end if;
  if _amount_minor is null or _amount_minor <= 0 then
    raise exception 'amount must be more than zero';
  end if;
  if _amount_minor > _invoice.total_minor - _invoice.paid_minor then
    raise exception 'amount is more than the balance due';
  end if;
  if _paid_on is null or _paid_on > public.nairobi_today() then
    raise exception 'payment date can''t be in the future';
  end if;

  _receipt := public.next_document_number('receipt');
  _new_paid := _invoice.paid_minor + _amount_minor;

  insert into public.payments
    (invoice_id, receipt_number, amount_minor, currency, method, reference, paid_on, notes, recorded_by)
  values
    (_invoice_id, _receipt, _amount_minor, _invoice.currency, _method,
     nullif(trim(_reference), ''), _paid_on, nullif(trim(_notes), ''), auth.uid())
  returning id into _payment_id;

  update public.invoices set
    paid_minor = _new_paid,
    status = case when _new_paid >= _invoice.total_minor then 'paid' else 'partially_paid' end
  where id = _invoice_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'payment_recorded', 'invoices', _invoice_id::text,
    jsonb_build_object('receipt', _receipt, 'amount_minor', _amount_minor,
      'currency', _invoice.currency, 'method', _method));

  return _payment_id;
end;
$$;

revoke all on function public.issue_invoice(uuid, date) from public, anon;
revoke all on function public.void_invoice(uuid, text) from public, anon;
revoke all on function public.record_payment(uuid, bigint, public.payment_method, text, date, text) from public, anon;
grant execute on function public.issue_invoice(uuid, date) to authenticated;
grant execute on function public.void_invoice(uuid, text) to authenticated;
grant execute on function public.record_payment(uuid, bigint, public.payment_method, text, date, text) to authenticated;

-- Audit every change to the seller/bank details printed on invoices.
create function public.log_finance_settings_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'finance_settings_updated', 'finance_settings', null, '{}'::jsonb);
  return new;
end;
$$;

create trigger finance_settings_audit
  after update on public.finance_settings
  for each row execute function public.log_finance_settings_change();
