# ADR 0004 — Invoicing: database-enforced rules, on-demand PDFs, eTIMS behind an interface

- **Status:** Accepted (pending owner sign-off with Phase 5)
- **Date:** 2026-10-25

## Context

Phase 5 (CLAUDE.md §10) adds invoices, receipts, payments and document
generation. Owner inputs (2026-10-25):

- NillTech is **not VAT-registered**, so there's no VAT line.
- Invoices go out in **KES or USD**.
- Clients pay by **bank transfer** (I&M Bank, USD account) or **M-Pesa
  Paybill 542542** (account = the bank account number).
- Numbering uses the **NTS** prefix.

## Decision

- **Money** is stored as integer minor units (`*_minor bigint`) in the
  invoice's own currency. Nothing is converted between currencies, and
  dashboard totals are always shown per currency.
- **Lifecycle and immutability are enforced in Postgres:**
  - Drafts can be edited through RLS (finance, super_admin).
  - Issuing, voiding and recording payments only happen through SECURITY
    DEFINER RPCs (`issue_invoice`, `void_invoice`, `record_payment`). Each
    one checks the role, locks the row, validates the change and writes
    `audit_log`.
  - Issued invoices can't be edited. Mistakes are fixed by voiding (only
    while there are no payments) and issuing a new invoice.
- **Numbering** is gapless, per year, Nairobi date: `NTS-YYYY-NNNN` for
  invoices and `NTS-RCT-YYYY-NNNN` for receipts. A number is assigned at
  issue, never to drafts, so deleting a draft never leaves a gap.
- **Snapshots:** at issue, the seller details (`finance_settings`) and
  client details are copied onto the invoice. Later edits to bank details
  or client addresses never change an issued invoice or its receipts.
- **Seller and bank details live in the database**, not the repository.
  The `finance_settings` row was seeded with SQL, can be edited at
  /portal/finance/settings, is readable only by finance and super_admin,
  and every change is audit-logged.
- **PDFs are generated on demand** with `pdf-lib`, server-only, from the
  immutable snapshot data. CLAUDE.md §10 suggested storing them in
  Supabase Storage, but since issued data can't change, regenerating gives
  the same document without spending the 1 GB free storage quota.
  Downloads go through the user's own session, so RLS decides access
  (clients see only their own issued documents).
- **eTIMS:** `lib/etims/provider.ts` defines the `EtimsProvider` interface,
  with a stub that returns `not_configured`. Issuing calls it, records the
  outcome on the invoice and logs an `automation_runs` row. The stub never
  claims a submission happened.

## Consequences

- **Emailing invoices waits for Resend** (deferred, §8). For now finance
  downloads the PDF and sends it.
- **Client KRA PINs aren't collected yet.** They only matter for eTIMS
  buyer details, and §11 requires encrypting them at rest. Add them, with
  app-level encryption, when the eTIMS integrator is chosen.
- **Partial payments are supported, but refunds and credit notes aren't.**
  Add a credit-note document type if one is needed.
- **The bank account is denominated in USD.** KES paid by M-Pesa or KES
  bank transfer gets converted by the bank; confirm whether a KES account
  should also be listed on KES invoices.
