-- Quotes (CLAUDE.md §10 document automation: "invoices, receipts, quotes").
--
-- A quote is a priced offer to a client. Drafts are editable like invoice
-- drafts; sending one gives it a gapless number (NTS-Q-YYYY-NNNN), freezes
-- seller and client details and locks it. The client's answer is recorded
-- as accepted or declined, and an accepted quote can be turned into a
-- draft invoice once (same client, currency, lines and notes).
--
-- "Expired" isn't stored: a sent quote past valid_until shows as expired.
-- As with invoices, every write after the draft stage goes through a
-- SECURITY DEFINER function that checks the role, locks the row and
-- writes the audit log.

create type public.quote_status as enum ('draft', 'sent', 'accepted', 'declined');

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  number text unique,
  client_id uuid not null references public.clients (id) on delete restrict,
  currency public.currency_code not null,
  status public.quote_status not null default 'draft',
  title text check (length(title) <= 200),
  issue_date date,
  valid_until date,
  notes text,
  total_minor bigint not null default 0,
  seller_snapshot jsonb,
  client_snapshot jsonb,
  decision_note text check (length(decision_note) <= 500),
  decided_at timestamptz,
  decided_by uuid references auth.users (id),
  invoice_id uuid unique references public.invoices (id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  sent_at timestamptz,
  sent_by uuid references auth.users (id)
);

create index quotes_client_id_idx on public.quotes (client_id);
create index quotes_status_idx on public.quotes (status);
create index quotes_created_at_idx on public.quotes (created_at desc);

alter table public.quotes enable row level security;

create policy "quotes: finance/director select"
  on public.quotes for select
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin', 'director'));

-- Clients see their own quotes once sent, never drafts.
create policy "quotes: client select own"
  on public.quotes for select
  using (
    status <> 'draft'
    and client_id in (select id from public.clients where user_id = auth.uid())
  );

create policy "quotes: finance insert draft"
  on public.quotes for insert
  with check (
    public.is_any_role(auth.uid(), 'finance', 'super_admin')
    and status = 'draft'
    and number is null
    and invoice_id is null
  );

create policy "quotes: finance update draft"
  on public.quotes for update
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin') and status = 'draft')
  with check (
    public.is_any_role(auth.uid(), 'finance', 'super_admin')
    and status = 'draft'
    and number is null
    and invoice_id is null
  );

create policy "quotes: finance delete draft"
  on public.quotes for delete
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin') and status = 'draft');

-- ---------------------------------------------------------------------------
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  position integer not null default 0,
  description text not null check (length(description) between 1 and 500),
  quantity numeric(10, 2) not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  line_total_minor bigint generated always as (round(quantity * unit_price_minor)::bigint) stored
);

create index quote_items_quote_id_idx on public.quote_items (quote_id, position);

alter table public.quote_items enable row level security;

create policy "quote_items: select with quote"
  on public.quote_items for select
  using (exists (select 1 from public.quotes q where q.id = quote_id));

create policy "quote_items: finance write on drafts"
  on public.quote_items for all
  using (
    public.is_any_role(auth.uid(), 'finance', 'super_admin')
    and exists (select 1 from public.quotes q where q.id = quote_id and q.status = 'draft')
  )
  with check (
    public.is_any_role(auth.uid(), 'finance', 'super_admin')
    and exists (select 1 from public.quotes q where q.id = quote_id and q.status = 'draft')
  );

create function public.recalculate_quote_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _quote_id uuid := coalesce(new.quote_id, old.quote_id);
begin
  update public.quotes
  set total_minor = coalesce(
    (select sum(line_total_minor) from public.quote_items where quote_id = _quote_id), 0)
  where id = _quote_id and status = 'draft';
  return null;
end;
$$;

create trigger quote_items_recalculate_total
  after insert or update or delete on public.quote_items
  for each row execute function public.recalculate_quote_total();

-- ---------------------------------------------------------------------------
-- Numbering: adds quotes to the gapless counters.
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
    when 'quote' then 'NTS-Q-'
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

-- ---------------------------------------------------------------------------
create function public.send_quote(_quote_id uuid, _valid_until date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _quote public.quotes;
  _client public.clients;
  _settings public.finance_settings;
  _total bigint;
  _number text;
  _today date := public.nairobi_today();
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into _quote from public.quotes where id = _quote_id for update;
  if not found then raise exception 'quote not found'; end if;
  if _quote.status <> 'draft' then raise exception 'only drafts can be sent'; end if;
  if _valid_until is null or _valid_until < _today then
    raise exception 'valid until must be today or later';
  end if;

  select coalesce(sum(line_total_minor), 0) into _total
  from public.quote_items where quote_id = _quote_id;
  if _total <= 0 then raise exception 'add at least one line item with a price'; end if;

  select * into _settings from public.finance_settings where id;
  if not found then raise exception 'finance settings are missing'; end if;

  select * into _client from public.clients where id = _quote.client_id;

  _number := public.next_document_number('quote');

  update public.quotes set
    number = _number,
    status = 'sent',
    issue_date = _today,
    valid_until = _valid_until,
    total_minor = _total,
    seller_snapshot = to_jsonb(_settings) - 'id' - 'updated_at' - 'updated_by',
    client_snapshot = jsonb_build_object(
      'name', _client.name,
      'company', _client.company,
      'email', _client.email,
      'phone', _client.phone,
      'address', _client.address
    ),
    sent_at = now(),
    sent_by = auth.uid()
  where id = _quote_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'quote_sent', 'quotes', _quote_id::text,
    jsonb_build_object('number', _number, 'total_minor', _total, 'currency', _quote.currency));

  return _number;
end;
$$;

-- Records the client's answer. A decision can be changed (a client may
-- come back after declining) until the quote has become an invoice.
create function public.decide_quote(_quote_id uuid, _outcome public.quote_status, _note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _quote public.quotes;
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if _outcome not in ('accepted', 'declined') then
    raise exception 'outcome must be accepted or declined';
  end if;

  select * into _quote from public.quotes where id = _quote_id for update;
  if not found then raise exception 'quote not found'; end if;
  if _quote.status = 'draft' then raise exception 'send the quote first'; end if;
  if _quote.invoice_id is not null then
    raise exception 'this quote has already been invoiced';
  end if;

  update public.quotes set
    status = _outcome,
    decision_note = nullif(trim(_note), ''),
    decided_at = now(),
    decided_by = auth.uid()
  where id = _quote_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'quote_' || _outcome::text, 'quotes', _quote_id::text,
    jsonb_build_object('number', _quote.number, 'from', _quote.status, 'note', nullif(trim(_note), '')));
end;
$$;

-- Copies an accepted quote into a new draft invoice, once.
create function public.convert_quote_to_invoice(_quote_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _quote public.quotes;
  _invoice_id uuid;
  _notes text;
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into _quote from public.quotes where id = _quote_id for update;
  if not found then raise exception 'quote not found'; end if;
  if _quote.status <> 'accepted' then
    raise exception 'only accepted quotes can be invoiced';
  end if;
  if _quote.invoice_id is not null then
    raise exception 'this quote has already been invoiced';
  end if;

  _notes := concat_ws(E'\n', 'As per quote ' || _quote.number || '.', _quote.notes);

  insert into public.invoices (client_id, currency, notes, created_by)
  values (_quote.client_id, _quote.currency, left(_notes, 2000), auth.uid())
  returning id into _invoice_id;

  insert into public.invoice_items (invoice_id, position, description, quantity, unit_price_minor)
  select _invoice_id, position, description, quantity, unit_price_minor
  from public.quote_items where quote_id = _quote_id;

  update public.quotes set invoice_id = _invoice_id where id = _quote_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'quote_invoiced', 'quotes', _quote_id::text,
    jsonb_build_object('number', _quote.number, 'invoice_id', _invoice_id));

  return _invoice_id;
end;
$$;

revoke all on function public.send_quote(uuid, date) from public, anon;
revoke all on function public.decide_quote(uuid, public.quote_status, text) from public, anon;
revoke all on function public.convert_quote_to_invoice(uuid) from public, anon;
grant execute on function public.send_quote(uuid, date) to authenticated;
grant execute on function public.decide_quote(uuid, public.quote_status, text) to authenticated;
grant execute on function public.convert_quote_to_invoice(uuid) to authenticated;
