# ADR 0003 — Portal authentication: Supabase Auth, password sign-in, admin-created accounts

- **Status:** Accepted (pending owner sign-off with Phase 4)
- **Date:** 2026-10-25

## Context

Phase 4 puts the internal dashboards (CLAUDE.md §10) behind a login. The
pieces already in place: Supabase Auth in the live project, an RBAC schema
(`user_roles`, `has_role`/`is_any_role`) and RLS on every table. Two
constraints shape how people sign in:

- **No email provider.** Resend is deferred (§8). Supabase's built-in mailer
  only delivers to the project's own team members and is heavily
  rate-limited, so magic links and invite emails aren't dependable.
- **Internal users only.** Accounts belong to NillTech staff, and later to
  freelancers and clients. Nobody should be able to sign themselves up.

## Decision

- **Email + password sign-in** through `@supabase/ssr`, with cookie sessions.
  `proxy.ts` refreshes the session and redirects signed-out visitors on
  `/portal/*`.
- **Accounts are created by a super admin** in Main Admin → Users & roles.
  The admin is shown a one-time temporary password once and shares it
  privately; the user replaces it under "Your account". Account creation
  goes into `audit_log`.
- **Authorization in three layers:**
  1. `proxy.ts` handles the signed-in/out redirect only.
  2. `lib/auth/dal.ts` is the single session and role lookup. Every page and
     server action re-checks roles there, and never relies on the page that
     rendered a form having checked.
  3. RLS in Postgres is the real gate, so a bug in either layer above can't
     leak data.
- **Role changes go through the user's own session**, not the service role,
  so RLS applies and the `user_roles` audit trigger records the actor. A
  super admin can't revoke their own `super_admin` role (lock-out guard).
- **The service role is used only** for listing auth users' emails and for
  creating accounts, both after an explicit super_admin check.

## Consequences

- **Public sign-up must be disabled** in the Supabase dashboard (Authentication
  → Sign In / Providers → "Allow new users to sign up" off). Someone who
  signs up anyway gets no roles, and RLS shows them nothing beyond their own
  profile row, but the account shouldn't exist at all.
- **The first super admin is bootstrapped by hand:** the owner creates their
  user in the Supabase dashboard, then `super_admin` is granted with one SQL
  insert into `user_roles`.
- **Revisit when Resend lands:** switch account creation to invite emails, and
  add password reset by email. Until then, a forgotten password is reset by
  a super admin from the Supabase dashboard.
