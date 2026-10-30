-- Credit notes and refunds (Phase 5 follow-up, CLAUDE.md §17).
--
-- * A credit note reduces what an issued invoice is owed (part or all of
--   it). Numbered NTS-CN-YYYY-NNNN, with its own seller/client snapshot and
--   PDF. Total credits can never exceed the invoice total.
-- * A refund records money paid back to the client. It's only allowed up to
--   the client's credit on that invoice (paid, less refunds, more than the
--   credited total), so a refund always follows a credit note or an
--   overpayment, and the books balance. Numbered NTS-RFD-YYYY-NNNN.
-- * invoices.balance_minor (generated) is the one "still owed" figure:
--   total - credited - (paid - refunded). Every screen reads it.
-- * New status 'credited': settled by credit notes with nothing kept as
--   payment.
--
-- As before, writes only happen through SECURITY DEFINER functions that
-- check the role, lock the invoice, number the document and audit-log it.

alter type public.invoice_status add value if not exists 'credited';

alter table public.invoices
  add column credited_minor bigint not null default 0 check (credited_minor >= 0),
  add column refunded_minor bigint not null default 0 check (refunded_minor >= 0),
  add column balance_minor bigint generated always as
    (total_minor - credited_minor - (paid_minor - refunded_minor)) stored;

-- ---------------------------------------------------------------------------
create table public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete restrict,
  number text not null unique,
  invoice_number text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency public.currency_code not null,
  reason text not null check (length(reason) between 3 and 500),
  issue_date date not null,
  seller_snapshot jsonb not null,
  client_snapshot jsonb,
  issued_at timestamptz not null default now(),
  issued_by uuid references auth.users (id)
);

create index credit_notes_invoice_id_idx on public.credit_notes (invoice_id);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete restrict,
  number text not null unique,
  amount_minor bigint not null check (amount_minor > 0),
  currency public.currency_code not null,
  method public.payment_method not null,
  reference text,
  refunded_on date not null,
  reason text not null check (length(reason) between 3 and 500),
  recorded_at timestamptz not null default now(),
  recorded_by uuid references auth.users (id)
);

create index refunds_invoice_id_idx on public.refunds (invoice_id);

alter table public.credit_notes enable row level security;
alter table public.refunds enable row level security;

-- Same readers as payments: finance, super_admin, director, and the client
-- for their own invoices. No write policies: only the functions below write.
create policy "credit_notes: finance/director select"
  on public.credit_notes for select
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin', 'director'));

create policy "credit_notes: client select own"
  on public.credit_notes for select
  using (
    exists (
      select 1 from public.invoices i
      join public.clients c on c.id = i.client_id
      where i.id = invoice_id and c.user_id = auth.uid()
    )
  );

create policy "refunds: finance/director select"
  on public.refunds for select
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin', 'director'));

create policy "refunds: client select own"
  on public.refunds for select
  using (
    exists (
      select 1 from public.invoices i
      join public.clients c on c.id = i.client_id
      where i.id = invoice_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Numbering: adds credit notes and refunds to the gapless counters.
create or replace function public.next_document_number(_doc_type text)
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
    when 'credit_note' then 'NTS-CN-'
    when 'refund' then 'NTS-RFD-'
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

-- The status an issued invoice should have for its money position.
-- plpgsql, not sql: its body is only checked when it runs, so it can use
-- the 'credited' value added earlier in this same migration.
create function public.invoice_money_status(
  _total bigint, _paid bigint, _credited bigint, _refunded bigint
)
returns public.invoice_status
language plpgsql
immutable
set search_path = ''
as $$
begin
  if _total - _credited - (_paid - _refunded) > 0 then
    if _paid - _refunded > 0 then return 'partially_paid'; end if;
    return 'issued';
  end if;
  if _paid - _refunded > 0 then return 'paid'; end if;
  return 'credited';
end;
$$;

-- ---------------------------------------------------------------------------
create function public.issue_credit_note(_invoice_id uuid, _amount_minor bigint, _reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _invoice public.invoices;
  _settings public.finance_settings;
  _number text;
  _id uuid;
  _credited bigint;
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if coalesce(length(trim(_reason)), 0) < 3 then
    raise exception 'give a reason for the credit note';
  end if;

  select * into _invoice from public.invoices where id = _invoice_id for update;
  if not found then raise exception 'invoice not found'; end if;
  if _invoice.status not in ('issued', 'partially_paid', 'paid') then
    raise exception 'credit notes can only be issued against issued invoices';
  end if;
  if _amount_minor is null or _amount_minor <= 0 then
    raise exception 'amount must be more than zero';
  end if;
  if _amount_minor > _invoice.total_minor - _invoice.credited_minor then
    raise exception 'amount is more than the invoice total not yet credited';
  end if;

  select * into _settings from public.finance_settings where id;
  if not found then raise exception 'finance settings are missing'; end if;

  _number := public.next_document_number('credit_note');
  _credited := _invoice.credited_minor + _amount_minor;

  insert into public.credit_notes
    (invoice_id, number, invoice_number, amount_minor, currency, reason, issue_date,
     seller_snapshot, client_snapshot, issued_by)
  values
    (_invoice_id, _number, _invoice.number, _amount_minor, _invoice.currency, trim(_reason),
     public.nairobi_today(),
     to_jsonb(_settings) - 'id' - 'updated_at' - 'updated_by',
     _invoice.client_snapshot, auth.uid())
  returning id into _id;

  update public.invoices set
    credited_minor = _credited,
    status = public.invoice_money_status(
      _invoice.total_minor, _invoice.paid_minor, _credited, _invoice.refunded_minor)
  where id = _invoice_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'credit_note_issued', 'invoices', _invoice_id::text,
    jsonb_build_object('number', _number, 'invoice', _invoice.number,
      'amount_minor', _amount_minor, 'currency', _invoice.currency, 'reason', trim(_reason)));

  return _id;
end;
$$;

create function public.record_refund(
  _invoice_id uuid,
  _amount_minor bigint,
  _method public.payment_method,
  _reference text,
  _refunded_on date,
  _reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _invoice public.invoices;
  _number text;
  _id uuid;
  _refunded bigint;
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if coalesce(length(trim(_reason)), 0) < 3 then
    raise exception 'give a reason for the refund';
  end if;

  select * into _invoice from public.invoices where id = _invoice_id for update;
  if not found then raise exception 'invoice not found'; end if;
  if _invoice.status in ('draft', 'void') then
    raise exception 'refunds can only be recorded against issued invoices';
  end if;
  if _amount_minor is null or _amount_minor <= 0 then
    raise exception 'amount must be more than zero';
  end if;
  -- A negative balance is money the client has paid beyond what they owe.
  if _amount_minor > -_invoice.balance_minor then
    raise exception 'amount is more than the client''s credit on this invoice (issue a credit note first)';
  end if;
  if _refunded_on is null or _refunded_on > public.nairobi_today() then
    raise exception 'refund date can''t be in the future';
  end if;

  _number := public.next_document_number('refund');
  _refunded := _invoice.refunded_minor + _amount_minor;

  insert into public.refunds
    (invoice_id, number, amount_minor, currency, method, reference, refunded_on, reason, recorded_by)
  values
    (_invoice_id, _number, _amount_minor, _invoice.currency, _method,
     nullif(trim(_reference), ''), _refunded_on, trim(_reason), auth.uid())
  returning id into _id;

  update public.invoices set
    refunded_minor = _refunded,
    status = public.invoice_money_status(
      _invoice.total_minor, _invoice.paid_minor, _invoice.credited_minor, _refunded)
  where id = _invoice_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'refund_recorded', 'invoices', _invoice_id::text,
    jsonb_build_object('number', _number, 'invoice', _invoice.number,
      'amount_minor', _amount_minor, 'currency', _invoice.currency, 'method', _method));

  return _id;
end;
$$;

-- Payments now settle against the balance after credit notes and refunds.
create or replace function public.record_payment(
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
  if _amount_minor > _invoice.balance_minor then
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
    status = public.invoice_money_status(
      _invoice.total_minor, _new_paid, _invoice.credited_minor, _invoice.refunded_minor)
  where id = _invoice_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'payment_recorded', 'invoices', _invoice_id::text,
    jsonb_build_object('receipt', _receipt, 'amount_minor', _amount_minor,
      'currency', _invoice.currency, 'method', _method));

  return _payment_id;
end;
$$;

-- Voiding stays for invoices with no money movement at all; once a credit
-- note exists, further corrections are credit notes too.
create or replace function public.void_invoice(_invoice_id uuid, _reason text)
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
  if _invoice.status <> 'issued' or _invoice.paid_minor <> 0 or _invoice.credited_minor <> 0 then
    raise exception 'only issued invoices with no payments or credit notes can be voided';
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

revoke all on function public.issue_credit_note(uuid, bigint, text) from public, anon;
revoke all on function public.record_refund(uuid, bigint, public.payment_method, text, date, text) from public, anon;
grant execute on function public.issue_credit_note(uuid, bigint, text) to authenticated;
grant execute on function public.record_refund(uuid, bigint, public.payment_method, text, date, text) to authenticated;

-- Shareholder totals: cash collected is net of refunds; receivables are
-- the balance due after credit notes.
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

  select jsonb_build_object('name', s.name, 'shares', s.shares, 'holder_type', s.holder_type,
      'ownership_percent', s.ownership_percent)
    into _holding
    from public.shareholders s
    where s.user_id = auth.uid();

  select jsonb_object_agg(c.code, jsonb_build_object(
      'collected_all',
        coalesce((select sum(p.amount_minor) from public.payments p where p.currency = c.code), 0)
        - coalesce((select sum(r.amount_minor) from public.refunds r where r.currency = c.code), 0),
      'collected_year',
        coalesce((select sum(p.amount_minor) from public.payments p
                  where p.currency = c.code and p.paid_on >= _year_start), 0)
        - coalesce((select sum(r.amount_minor) from public.refunds r
                    where r.currency = c.code and r.refunded_on >= _year_start), 0),
      'spent_all', coalesce((select sum(e.amount_minor) from public.expenses e where e.currency = c.code), 0),
      'spent_year', coalesce((select sum(e.amount_minor) from public.expenses e where e.currency = c.code and e.spent_on >= _year_start), 0),
      'receivables', coalesce((select sum(greatest(i.balance_minor, 0)) from public.invoices i
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
