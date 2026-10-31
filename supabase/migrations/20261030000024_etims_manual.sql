-- KRA eTIMS, recorded by hand (owner, 2026-10-30: option 1). Finance issues
-- each invoice (and credit note) in KRA's own eTIMS (eTIMS Lite on the KRA
-- portal or app), then records the KRA invoice number here. It prints on our
-- PDF, shows in exports, and Finance sees which documents still need it.
-- An automatic connection (integrator or KRA OSCU) can fill the same fields
-- later through lib/etims/provider.ts.
--
-- invoices.etims_reference (existing) holds the KRA invoice number;
-- etims_status becomes 'recorded' once it's entered.

alter table public.invoices
  add column etims_date date,
  add column etims_verify_url text,
  add column etims_recorded_at timestamptz,
  add column etims_recorded_by uuid references auth.users (id) on delete set null;

alter table public.credit_notes
  add column etims_reference text,
  add column etims_date date,
  add column etims_verify_url text,
  add column etims_recorded_at timestamptz,
  add column etims_recorded_by uuid references auth.users (id) on delete set null;

-- Shared checks for what Finance types in.
create function public.check_etims_details(_reference text, _date date, _verify_url text)
returns void
language plpgsql
immutable
set search_path = public
as $$
begin
  if _reference is null or trim(_reference) !~ '^[A-Za-z0-9/ -]{3,60}$' then
    raise exception 'enter the KRA invoice number (3 to 60 letters, numbers, / or -)';
  end if;
  if _date is null then
    raise exception 'enter the date on the eTIMS invoice';
  end if;
  if _verify_url is not null and trim(_verify_url) <> '' and (
    length(_verify_url) > 500
    or trim(_verify_url) !~* '^https://([a-z0-9-]+\.)*kra\.go\.ke(/|$)'
  ) then
    raise exception 'the verification link must be a KRA link (https://...kra.go.ke)';
  end if;
end;
$$;

-- Record or correct the eTIMS details of an issued invoice.
create function public.record_invoice_etims(
  _invoice_id uuid, _reference text, _date date, _verify_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _inv public.invoices;
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  perform public.check_etims_details(_reference, _date, _verify_url);

  select * into _inv from public.invoices where id = _invoice_id for update;
  if not found then raise exception 'invoice not found'; end if;
  if _inv.status in ('draft', 'void') then
    raise exception 'only issued invoices go on eTIMS';
  end if;
  if _date > (now() at time zone 'Africa/Nairobi')::date then
    raise exception 'the eTIMS date can''t be in the future';
  end if;
  if _date < _inv.issue_date then
    raise exception 'the eTIMS date can''t be before the invoice date';
  end if;

  update public.invoices set
    etims_status = 'recorded',
    etims_reference = trim(_reference),
    etims_date = _date,
    etims_verify_url = nullif(trim(_verify_url), ''),
    etims_recorded_at = now(),
    etims_recorded_by = auth.uid()
  where id = _invoice_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'invoice_etims_recorded', 'invoices', _invoice_id::text,
    jsonb_build_object('number', _inv.number, 'etims_reference', trim(_reference),
      'previous', _inv.etims_reference));
end;
$$;

-- Same for a credit note (KRA expects a matching eTIMS credit note).
create function public.record_credit_note_etims(
  _credit_note_id uuid, _reference text, _date date, _verify_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _cn public.credit_notes;
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  perform public.check_etims_details(_reference, _date, _verify_url);

  select * into _cn from public.credit_notes where id = _credit_note_id for update;
  if not found then raise exception 'credit note not found'; end if;
  if _date > (now() at time zone 'Africa/Nairobi')::date then
    raise exception 'the eTIMS date can''t be in the future';
  end if;
  if _date < _cn.issue_date then
    raise exception 'the eTIMS date can''t be before the credit note date';
  end if;

  update public.credit_notes set
    etims_reference = trim(_reference),
    etims_date = _date,
    etims_verify_url = nullif(trim(_verify_url), ''),
    etims_recorded_at = now(),
    etims_recorded_by = auth.uid()
  where id = _credit_note_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'credit_note_etims_recorded', 'credit_notes', _credit_note_id::text,
    jsonb_build_object('number', _cn.number, 'etims_reference', trim(_reference),
      'previous', _cn.etims_reference));
end;
$$;

revoke all on function public.check_etims_details(text, date, text) from public, anon;
revoke all on function public.record_invoice_etims(uuid, text, date, text) from public, anon;
revoke all on function public.record_credit_note_etims(uuid, text, date, text) from public, anon;
grant execute on function public.check_etims_details(text, date, text) to authenticated;
grant execute on function public.record_invoice_etims(uuid, text, date, text) to authenticated;
grant execute on function public.record_credit_note_etims(uuid, text, date, text) to authenticated;
