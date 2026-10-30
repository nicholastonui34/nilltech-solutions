-- Freelancer payout details (owner, 2026-10-30): freelancers are paid by
-- M-Pesa or bank transfer to a Kenyan bank only. Each freelancer gives their
-- M-Pesa number and registered name, and/or bank, branch, account number and
-- beneficiary name, in their own portal.
--
-- Readable by the freelancer and by finance/super_admin only (recruitment,
-- quality and directors can't see account numbers). Written only through
-- set_own_payout_details(); every change is audit-logged without the values.
-- A payment can only be recorded by a method the freelancer has set up, and
-- the details used are frozen onto the payment.

create table public.talent_payout_details (
  talent_id uuid primary key references public.talent_applications (id) on delete cascade,
  preferred_method public.payment_method not null
    check (preferred_method in ('mpesa', 'bank_transfer')),
  mpesa_number text check (mpesa_number is null or mpesa_number ~ '^2547[0-9]{8}$|^2541[0-9]{8}$'),
  mpesa_name text check (mpesa_name is null or length(mpesa_name) between 2 and 100),
  bank_name text check (bank_name is null or length(bank_name) between 2 and 100),
  bank_branch text check (bank_branch is null or length(bank_branch) between 2 and 100),
  bank_account_number text check (bank_account_number is null or bank_account_number ~ '^[0-9A-Za-z]{6,20}$'),
  bank_account_name text check (bank_account_name is null or length(bank_account_name) between 2 and 100),
  updated_at timestamptz not null default now(),
  constraint payout_mpesa_complete check (
    (mpesa_number is null) = (mpesa_name is null)
  ),
  constraint payout_bank_complete check (
    (bank_name is null) = (bank_account_number is null)
    and (bank_name is null) = (bank_account_name is null)
  ),
  constraint payout_preferred_set_up check (
    (preferred_method = 'mpesa' and mpesa_number is not null)
    or (preferred_method = 'bank_transfer' and bank_account_number is not null)
  )
);

alter table public.talent_payout_details enable row level security;

create policy "payout details: own select"
  on public.talent_payout_details for select
  using (exists (
    select 1 from public.talent_applications t
    where t.id = talent_id and t.user_id = auth.uid()
  ));

create policy "payout details: finance select"
  on public.talent_payout_details for select
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin'));

-- No write policies: only set_own_payout_details() writes.

create function public.set_own_payout_details(
  _preferred_method public.payment_method,
  _mpesa_number text,
  _mpesa_name text,
  _bank_name text,
  _bank_branch text,
  _bank_account_number text,
  _bank_account_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _app public.talent_applications;
  _phone text := regexp_replace(coalesce(_mpesa_number, ''), '[\s\-()]', '', 'g');
  _account text := regexp_replace(coalesce(_bank_account_number, ''), '[\s\-]', '', 'g');
begin
  select * into _app from public.talent_applications where user_id = auth.uid();
  if not found then raise exception 'no profile is linked to this login'; end if;
  if _preferred_method not in ('mpesa', 'bank_transfer') then
    raise exception 'payouts are by M-Pesa or bank transfer only';
  end if;

  -- 07XXXXXXXX, 01XXXXXXXX, +2547..., 2547... all become 2547XXXXXXXX / 2541XXXXXXXX.
  if _phone <> '' then
    _phone := regexp_replace(_phone, '^\+', '');
    if _phone ~ '^0[17][0-9]{8}$' then _phone := '254' || substr(_phone, 2); end if;
    if _phone !~ '^254[17][0-9]{8}$' then
      raise exception 'enter a Kenyan M-Pesa number, like 0712 345 678';
    end if;
    if length(trim(coalesce(_mpesa_name, ''))) < 2 then
      raise exception 'enter the name the M-Pesa number is registered to';
    end if;
  end if;

  if _account <> '' or length(trim(coalesce(_bank_name, ''))) > 0 then
    if length(trim(coalesce(_bank_name, ''))) < 2 then raise exception 'choose your bank'; end if;
    if _account !~ '^[0-9A-Za-z]{6,20}$' then
      raise exception 'enter your bank account number (6 to 20 letters or digits)';
    end if;
    if length(trim(coalesce(_bank_account_name, ''))) < 2 then
      raise exception 'enter the beneficiary name exactly as it appears on the bank account';
    end if;
  end if;

  if _preferred_method = 'mpesa' and _phone = '' then
    raise exception 'add your M-Pesa details, or choose bank transfer';
  end if;
  if _preferred_method = 'bank_transfer' and _account = '' then
    raise exception 'add your bank details, or choose M-Pesa';
  end if;

  insert into public.talent_payout_details as d (talent_id, preferred_method, mpesa_number,
    mpesa_name, bank_name, bank_branch, bank_account_number, bank_account_name, updated_at)
  values (
    _app.id,
    _preferred_method,
    nullif(_phone, ''),
    case when _phone <> '' then left(trim(_mpesa_name), 100) end,
    case when _account <> '' then left(trim(_bank_name), 100) end,
    case when _account <> '' then nullif(left(trim(coalesce(_bank_branch, '')), 100), '') end,
    nullif(upper(_account), ''),
    case when _account <> '' then left(trim(_bank_account_name), 100) end,
    now()
  )
  on conflict (talent_id) do update set
    preferred_method = excluded.preferred_method,
    mpesa_number = excluded.mpesa_number,
    mpesa_name = excluded.mpesa_name,
    bank_name = excluded.bank_name,
    bank_branch = excluded.bank_branch,
    bank_account_number = excluded.bank_account_number,
    bank_account_name = excluded.bank_account_name,
    updated_at = now();

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'payout_details_updated', 'talent_applications', _app.id::text,
    jsonb_build_object('preferred_method', _preferred_method,
      'has_mpesa', _phone <> '', 'has_bank', _account <> ''));
end;
$$;

revoke all on function public.set_own_payout_details(public.payment_method, text, text, text, text, text, text) from public, anon;
grant execute on function public.set_own_payout_details(public.payment_method, text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Payments: M-Pesa or bank transfer only, to the freelancer's own details.
alter table public.freelancer_payments
  add constraint freelancer_payments_method_check check (method in ('mpesa', 'bank_transfer')),
  add column payout_snapshot jsonb;

create or replace function public.record_freelancer_payment(
  _talent_id uuid,
  _amount_minor bigint,
  _currency public.currency_code,
  _method public.payment_method,
  _reference text,
  _paid_on date,
  _description text,
  _project_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _talent public.talent_applications;
  _payout public.talent_payout_details;
  _settings public.finance_settings;
  _payout_snapshot jsonb;
  _number text;
  _expense_id uuid;
  _id uuid;
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into _talent from public.talent_applications where id = _talent_id;
  if not found or _talent.stage <> 'approved' then
    raise exception 'payments can only be recorded for approved talent';
  end if;
  if _method not in ('mpesa', 'bank_transfer') then
    raise exception 'freelancers are paid by M-Pesa or bank transfer only';
  end if;
  select * into _payout from public.talent_payout_details where talent_id = _talent_id;
  if _method = 'mpesa' then
    if _payout.mpesa_number is null then
      raise exception 'this freelancer hasn''t added M-Pesa details yet';
    end if;
    _payout_snapshot := jsonb_build_object('method', 'mpesa',
      'mpesa_number', _payout.mpesa_number, 'mpesa_name', _payout.mpesa_name);
  else
    if _payout.bank_account_number is null then
      raise exception 'this freelancer hasn''t added bank details yet';
    end if;
    _payout_snapshot := jsonb_build_object('method', 'bank_transfer',
      'bank_name', _payout.bank_name, 'bank_branch', _payout.bank_branch,
      'bank_account_number', _payout.bank_account_number,
      'bank_account_name', _payout.bank_account_name);
  end if;
  if _amount_minor is null or _amount_minor <= 0 then raise exception 'enter the amount paid'; end if;
  if _paid_on is null or _paid_on > public.nairobi_today() then
    raise exception 'the payment date can''t be in the future';
  end if;
  if length(trim(coalesce(_description, ''))) < 3 then
    raise exception 'say what the payment is for';
  end if;

  select * into _settings from public.finance_settings where id;
  if not found then raise exception 'finance settings are missing'; end if;

  _number := public.next_document_number('freelancer_payment');

  insert into public.expenses (spent_on, description, category, amount_minor, currency,
    vendor, method, reference, project_id, created_by)
  values (_paid_on, left(_number || ': ' || trim(_description), 300), 'talent', _amount_minor,
    _currency, _talent.full_name, _method, nullif(trim(_reference), ''), _project_id, auth.uid())
  returning id into _expense_id;

  insert into public.freelancer_payments (number, talent_id, project_id, description,
    amount_minor, currency, method, reference, paid_on, payee_name, seller_snapshot,
    payout_snapshot, expense_id, recorded_by)
  values (_number, _talent_id, _project_id, trim(_description), _amount_minor, _currency,
    _method, nullif(trim(_reference), ''), _paid_on, _talent.full_name,
    to_jsonb(_settings) - 'id' - 'updated_at' - 'updated_by', _payout_snapshot,
    _expense_id, auth.uid())
  returning id into _id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'freelancer_payment_recorded', 'freelancer_payments', _id::text,
    jsonb_build_object('number', _number, 'amount_minor', _amount_minor, 'currency', _currency,
      'talent_id', _talent_id, 'method', _method));

  return _id;
end;
$$;
