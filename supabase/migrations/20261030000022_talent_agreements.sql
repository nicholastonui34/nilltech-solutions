-- Generated freelancer documents (owner, 2026-10-30): the portal drafts the
-- NDA (NTS-NDA-YYYY-NNNN), freelance services agreement (NTS-FSA-YYYY-NNNN)
-- and onboarding letter (NTS-OL-YYYY-NNNN) from recruitment's inputs, saves
-- the PDF in the private talent-documents bucket and lists it in the
-- freelancer's Documents tab like an uploaded file.
--
-- The text is a draft by Claude, not legal advice: the owner's advocate
-- should review it (config/talent-agreements.ts records whether that's done).

alter table public.talent_documents
  add column reference text unique,
  add column generated_from jsonb;

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
    when 'talent_nda' then 'NTS-NDA-'
    when 'talent_contract' then 'NTS-FSA-'
    when 'talent_letter' then 'NTS-OL-'
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

-- Recruitment reserves a number just before generating the PDF.
create function public.next_talent_document_number(_kind text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_any_role(auth.uid(), 'recruitment', 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if _kind not in ('nda', 'contract', 'onboarding_letter') then
    raise exception 'unknown document kind %', _kind;
  end if;
  return public.next_document_number(case _kind
    when 'nda' then 'talent_nda'
    when 'contract' then 'talent_contract'
    else 'talent_letter'
  end);
end;
$$;

revoke all on function public.next_talent_document_number(text) from public, anon;
grant execute on function public.next_talent_document_number(text) to authenticated;
