# ADR 0007: Expenses, margins and finance exports

- **Status:** Accepted
- **Date:** 2026-10-29
- **Owner request:** "Expense tracking first, then [CSV exports], [IndexNow] and [Vercel limit warnings]".

## Context

The Director dashboard showed cash collected but no margin, because the
system had no record of money going out (CLAUDE.md §10 lists expenses and
exports under Finance). The accountant also needs the finance data outside
the portal.

## Decision

- **`expenses` table** (migration `20261029000009_expenses.sql`): date paid,
  description, category (talent, software, hosting, marketing, office,
  travel, equipment, fees and taxes, other), amount in integer minor units,
  KES or USD, optional vendor, payment method, reference, project link and
  notes. Finance and super_admin create, edit and delete; directors read.
  RLS enforces this, and a trigger writes every insert, update and delete
  to `audit_log`.
- **Edits and deletes are allowed**, unlike issued invoices: an expense is
  an internal record, not a document sent to a client, and mistakes need
  correcting. The audit log keeps the history.
- **Margin = cash collected minus expenses paid, per currency, per period.**
  No currency conversion, and no accruals: this is a cash view, which
  matches how a small company reads its numbers. Invoices outstanding are
  shown separately.
- **CSV exports** (`/portal/finance/export/{invoices|payments|expenses}`,
  optional `?month=YYYY-MM` or `?year=YYYY`): finance, director and
  super_admin, read through the user's own session so RLS applies. UTF-8
  with a byte order mark for Excel, plain decimal amounts with a separate
  currency column, drafts excluded, and formula-looking text cells
  prefixed with an apostrophe (CSV injection).

## Consequences

- The Director dashboard's net and margin figures are only as complete as
  the expenses Finance records. Record talent payouts and subscriptions as
  they're paid.
- Per-project profitability is possible later: expenses can already link
  to a project; invoices would need the same link.
