-- Expenses (CLAUDE.md §10 Finance: "expenses"), so the Director dashboard
-- can show margins instead of cash collected only. Same conventions as the
-- finance migration: integer minor units, KES or USD, never converted.
--
-- Finance and super_admin manage expenses; directors read them. Every
-- insert, update and delete is written to audit_log by trigger.

create type public.expense_category as enum (
  'talent',
  'software',
  'hosting',
  'marketing',
  'office',
  'travel',
  'equipment',
  'fees_taxes',
  'other'
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null,
  description text not null check (length(description) between 1 and 300),
  category public.expense_category not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency public.currency_code not null,
  vendor text check (vendor is null or length(vendor) <= 200),
  method public.payment_method,
  reference text check (reference is null or length(reference) <= 200),
  -- Optional link to a delivery project (Quality), for per-project costs.
  project_id uuid references public.projects (id) on delete set null,
  notes text check (notes is null or length(notes) <= 2000),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) default auth.uid(),
  updated_at timestamptz not null default now()
);

create index expenses_spent_on_idx on public.expenses (spent_on desc);
create index expenses_project_idx on public.expenses (project_id);

alter table public.expenses enable row level security;

create policy "expenses: finance/director select"
  on public.expenses for select
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin', 'director'));

create policy "expenses: finance insert"
  on public.expenses for insert
  with check (public.is_any_role(auth.uid(), 'finance', 'super_admin'));

create policy "expenses: finance update"
  on public.expenses for update
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin'))
  with check (public.is_any_role(auth.uid(), 'finance', 'super_admin'));

create policy "expenses: finance delete"
  on public.expenses for delete
  using (public.is_any_role(auth.uid(), 'finance', 'super_admin'));

create function public.touch_expense()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger expenses_touch
  before update on public.expenses
  for each row execute function public.touch_expense();

-- Audit every expense change (CLAUDE.md §10: every financial action).
create function public.log_expense_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _row public.expenses;
begin
  _row := case when tg_op = 'DELETE' then old else new end;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'expense_' || lower(tg_op),
    'expenses',
    _row.id::text,
    jsonb_build_object(
      'amount_minor', _row.amount_minor,
      'currency', _row.currency,
      'category', _row.category,
      'spent_on', _row.spent_on
    )
  );
  return _row;
end;
$$;

create trigger expenses_audit
  after insert or update or delete on public.expenses
  for each row execute function public.log_expense_change();
