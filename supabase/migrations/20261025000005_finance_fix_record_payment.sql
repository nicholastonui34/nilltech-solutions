-- Fix: record_payment's status CASE yields text; cast it to invoice_status.
-- Caught by the rollback test before any real payment was recorded.

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
    status = (case when _new_paid >= _invoice.total_minor then 'paid' else 'partially_paid' end)::public.invoice_status
  where id = _invoice_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'payment_recorded', 'invoices', _invoice_id::text,
    jsonb_build_object('receipt', _receipt, 'amount_minor', _amount_minor,
      'currency', _invoice.currency, 'method', _method));

  return _payment_id;
end;
$$;
