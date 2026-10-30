-- Freelancer portal, part two (owner, 2026-10-30: "all").
--
-- 1. Freelancers edit their own contact details, skills and links.
-- 2. Test tasks: recruitment sets a brief and due date; the applicant
--    reads it and submits a link in the portal. Applicants can now get a
--    portal login from the test-task stage, not only once approved.
-- 3. Freelancer payments: finance records each payment once; it creates
--    the matching 'talent' expense (so margins stay right) and a numbered
--    payment advice (NTS-FP-YYYY-NNNN) the freelancer can download.
-- 4. Documents: recruitment uploads contracts, NDAs and letters (PDF, in
--    a private storage bucket); the freelancer downloads them and accepts
--    the ones that need it by typing their name. We don't generate legal
--    text: the owner's own templates are uploaded.
-- 5. Assignment detail: project due dates, the QA checklist and the
--    freelancer's own delivery reviews become visible to them.
--
-- As elsewhere, changes made by the freelancer go through SECURITY
-- DEFINER functions that check ownership and write the audit log.

-- ---------------------------------------------------------------------------
-- 1. Self-service profile edits.
create function public.update_own_talent_profile(
  _phone text,
  _skills text[],
  _portfolio_url text,
  _profile_url text,
  _availability text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _app public.talent_applications;
  _skills_clean text[];
begin
  select * into _app from public.talent_applications where user_id = auth.uid() for update;
  if not found then raise exception 'no profile is linked to this login'; end if;

  if coalesce(length(_phone), 0) > 40 then raise exception 'phone number is too long'; end if;
  if coalesce(length(_availability), 0) > 200 then raise exception 'availability is too long'; end if;
  if _portfolio_url is not null and _portfolio_url <> ''
     and (_portfolio_url !~* '^https?://' or length(_portfolio_url) > 300) then
    raise exception 'portfolio link must start with https://';
  end if;
  if _profile_url is not null and _profile_url <> ''
     and (_profile_url !~* '^https?://' or length(_profile_url) > 300) then
    raise exception 'profile link must start with https://';
  end if;

  select coalesce(array_agg(distinct s), '{}') into _skills_clean
  from (
    select left(trim(s), 50) as s from unnest(coalesce(_skills, '{}')) s
  ) x where s <> '';
  if cardinality(_skills_clean) > 30 then raise exception 'list at most 30 skills'; end if;

  update public.talent_applications set
    phone = nullif(trim(_phone), ''),
    skills = _skills_clean,
    portfolio_url = nullif(trim(_portfolio_url), ''),
    profile_url = nullif(trim(_profile_url), ''),
    availability = nullif(trim(_availability), '')
  where id = _app.id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'talent_profile_updated', 'talent_applications', _app.id::text, '{}'::jsonb);
end;
$$;

revoke all on function public.update_own_talent_profile(text, text[], text, text, text) from public, anon;
grant execute on function public.update_own_talent_profile(text, text[], text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Test tasks.
create table public.talent_test_tasks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.talent_applications (id) on delete cascade,
  title text not null check (length(title) between 3 and 200),
  brief text not null check (length(brief) between 10 and 8000),
  due_on date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) default auth.uid(),
  submission_url text check (submission_url is null or length(submission_url) <= 500),
  submission_note text check (submission_note is null or length(submission_note) <= 2000),
  submitted_at timestamptz,
  -- Internal review notes stay on talent_applications.test_task_notes; this
  -- only records that recruitment has looked at the submission.
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id)
);

create index talent_test_tasks_application_idx on public.talent_test_tasks (application_id);

alter table public.talent_test_tasks enable row level security;

create policy "test tasks: recruitment all"
  on public.talent_test_tasks for all
  using (public.is_any_role(auth.uid(), 'recruitment', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'recruitment', 'super_admin'));

create policy "test tasks: applicant select own"
  on public.talent_test_tasks for select
  using (exists (
    select 1 from public.talent_applications t
    where t.id = application_id and t.user_id = auth.uid()
  ));

-- Applicants submit (or resubmit, until it's reviewed) through this function.
create function public.submit_test_task(_task_id uuid, _url text, _note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _task public.talent_test_tasks;
  _app public.talent_applications;
begin
  select * into _task from public.talent_test_tasks where id = _task_id for update;
  if not found then raise exception 'test task not found'; end if;
  select * into _app from public.talent_applications where id = _task.application_id;
  if _app.user_id is distinct from auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if _task.reviewed_at is not null then
    raise exception 'this task has already been reviewed';
  end if;
  if _url is null or _url !~* '^https?://' or length(_url) > 500 then
    raise exception 'add a link to your work that starts with https://';
  end if;

  update public.talent_test_tasks set
    submission_url = trim(_url),
    submission_note = nullif(left(trim(coalesce(_note, '')), 2000), ''),
    submitted_at = now()
  where id = _task_id;

  -- Moves the application along so recruitment sees it in "Test review".
  if _app.stage = 'test_task' then
    update public.talent_applications set stage = 'test_review' where id = _app.id;
  end if;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'test_task_submitted', 'talent_test_tasks', _task_id::text,
    jsonb_build_object('application_id', _app.id));
end;
$$;

revoke all on function public.submit_test_task(uuid, text, text) from public, anon;
grant execute on function public.submit_test_task(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Freelancer payments.
create table public.freelancer_payments (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  talent_id uuid not null references public.talent_applications (id) on delete restrict,
  project_id uuid references public.projects (id) on delete set null,
  description text not null check (length(description) between 3 and 300),
  amount_minor bigint not null check (amount_minor > 0),
  currency public.currency_code not null,
  method public.payment_method not null,
  reference text check (reference is null or length(reference) <= 200),
  paid_on date not null,
  payee_name text not null,
  seller_snapshot jsonb not null,
  expense_id uuid references public.expenses (id) on delete set null,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references auth.users (id),
  voided_at timestamptz,
  voided_by uuid references auth.users (id),
  void_reason text check (void_reason is null or length(void_reason) <= 500)
);

create index freelancer_payments_talent_idx on public.freelancer_payments (talent_id);
create index freelancer_payments_paid_on_idx on public.freelancer_payments (paid_on desc);

alter table public.freelancer_payments enable row level security;

create policy "freelancer payments: finance/director select"
  on public.freelancer_payments for select
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin', 'director'));

create policy "freelancer payments: freelancer select own"
  on public.freelancer_payments for select
  using (exists (
    select 1 from public.talent_applications t
    where t.id = talent_id and t.user_id = auth.uid()
  ));

-- No write policies: only the functions below write.

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
    when 'freelancer_payment' then 'NTS-FP-'
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

create function public.record_freelancer_payment(
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
  _settings public.finance_settings;
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
    expense_id, recorded_by)
  values (_number, _talent_id, _project_id, trim(_description), _amount_minor, _currency,
    _method, nullif(trim(_reference), ''), _paid_on, _talent.full_name,
    to_jsonb(_settings) - 'id' - 'updated_at' - 'updated_by', _expense_id, auth.uid())
  returning id into _id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'freelancer_payment_recorded', 'freelancer_payments', _id::text,
    jsonb_build_object('number', _number, 'amount_minor', _amount_minor, 'currency', _currency,
      'talent_id', _talent_id));

  return _id;
end;
$$;

-- A mistaken payment is voided, not deleted: the number stays used, the
-- matching expense is removed so margins are right again.
create function public.void_freelancer_payment(_payment_id uuid, _reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _payment public.freelancer_payments;
begin
  if not public.is_any_role(auth.uid(), 'finance', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into _payment from public.freelancer_payments where id = _payment_id for update;
  if not found then raise exception 'payment not found'; end if;
  if _payment.voided_at is not null then raise exception 'this payment is already void'; end if;
  if length(trim(coalesce(_reason, ''))) < 3 then raise exception 'give a reason for voiding'; end if;

  if _payment.expense_id is not null then
    delete from public.expenses where id = _payment.expense_id;
  end if;

  update public.freelancer_payments set
    voided_at = now(),
    voided_by = auth.uid(),
    void_reason = trim(_reason),
    expense_id = null
  where id = _payment_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'freelancer_payment_voided', 'freelancer_payments', _payment_id::text,
    jsonb_build_object('number', _payment.number, 'reason', trim(_reason)));
end;
$$;

revoke all on function public.record_freelancer_payment(uuid, bigint, public.currency_code, public.payment_method, text, date, text, uuid) from public, anon;
revoke all on function public.void_freelancer_payment(uuid, text) from public, anon;
grant execute on function public.record_freelancer_payment(uuid, bigint, public.currency_code, public.payment_method, text, date, text, uuid) to authenticated;
grant execute on function public.void_freelancer_payment(uuid, text) to authenticated;

-- Finance needs to pick approved talent when recording a payment.
create policy "talent: finance select approved"
  on public.talent_applications for select
  using (stage = 'approved' and public.is_any_role(auth.uid(), 'finance'));

-- ---------------------------------------------------------------------------
-- 4. Documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('talent-documents', 'talent-documents', false, 4194304, array['application/pdf'])
on conflict (id) do nothing;
-- No storage.objects policies: only the server (service role) reads and
-- writes files, after checking the talent_documents row through RLS.

create table public.talent_documents (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talent_applications (id) on delete cascade,
  kind text not null check (kind in ('contract', 'nda', 'onboarding_letter', 'other')),
  title text not null check (length(title) between 3 and 200),
  storage_path text not null unique,
  file_name text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 4194304),
  requires_acceptance boolean not null default false,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users (id) default auth.uid(),
  accepted_at timestamptz,
  accepted_name text check (accepted_name is null or length(accepted_name) <= 200)
);

create index talent_documents_talent_idx on public.talent_documents (talent_id);

alter table public.talent_documents enable row level security;

create policy "talent documents: recruitment select"
  on public.talent_documents for select
  using (public.is_any_role(auth.uid(), 'recruitment', 'super_admin'));

create policy "talent documents: recruitment insert"
  on public.talent_documents for insert
  with check (public.is_any_role(auth.uid(), 'recruitment', 'super_admin'));

-- Once accepted, a document can't be deleted (the record of acceptance stays).
create policy "talent documents: recruitment delete unaccepted"
  on public.talent_documents for delete
  using (public.is_any_role(auth.uid(), 'recruitment', 'super_admin') and accepted_at is null);

create policy "talent documents: freelancer select own"
  on public.talent_documents for select
  using (exists (
    select 1 from public.talent_applications t
    where t.id = talent_id and t.user_id = auth.uid()
  ));

create function public.accept_talent_document(_document_id uuid, _typed_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _doc public.talent_documents;
  _app public.talent_applications;
begin
  select * into _doc from public.talent_documents where id = _document_id for update;
  if not found then raise exception 'document not found'; end if;
  select * into _app from public.talent_applications where id = _doc.talent_id;
  if _app.user_id is distinct from auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not _doc.requires_acceptance then raise exception 'this document doesn''t need accepting'; end if;
  if _doc.accepted_at is not null then raise exception 'already accepted'; end if;
  if lower(regexp_replace(trim(coalesce(_typed_name, '')), '\s+', ' ', 'g'))
     <> lower(regexp_replace(trim(_app.full_name), '\s+', ' ', 'g')) then
    raise exception 'type your full name exactly as it appears on your profile (%)', _app.full_name;
  end if;

  update public.talent_documents set
    accepted_at = now(),
    accepted_name = trim(_typed_name)
  where id = _document_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'talent_document_accepted', 'talent_documents', _document_id::text,
    jsonb_build_object('title', _doc.title, 'kind', _doc.kind));
end;
$$;

revoke all on function public.accept_talent_document(uuid, text) from public, anon;
grant execute on function public.accept_talent_document(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Assignment detail for freelancers.
alter table public.projects add column due_on date;

create policy "qa items: freelancer select assigned"
  on public.qa_checklist_items for select
  using (exists (
    select 1 from public.project_assignments pa
    join public.talent_applications t on t.id = pa.talent_id
    where pa.project_id = qa_checklist_items.project_id and t.user_id = auth.uid()
  ));

create policy "reviews: freelancer select own"
  on public.delivery_reviews for select
  using (exists (
    select 1 from public.talent_applications t
    where t.id = talent_id and t.user_id = auth.uid()
  ));
