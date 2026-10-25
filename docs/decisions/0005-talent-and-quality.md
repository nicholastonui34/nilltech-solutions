# ADR 0005 — Talent onboarding and Quality: manual screening, Vault-encrypted KRA PINs

- **Status:** Accepted (pending owner sign-off with Phase 6)
- **Date:** 2026-10-25

## Context

Phase 6 (CLAUDE.md §9, §10, §11) adds freelancer onboarding and the
Quality dashboard. Owner inputs (2026-10-25):

1. **Roles hired:** frontend, backend, mobile, UI/UX, QA, DevOps, AI/ML,
   project manager.
2. **Screening:** mandatory, done by the **recruitment department**. Hiring
   is **within East Africa only**.
3. **Test tasks:** sent manually by the team for now.
4. **Tax:** Kenyans hired **full-time** need a KRA PIN. Freelancers file
   and pay their own tax.
5. **QA checks:** code review, testing, client sign-off.

## Decision

- **New `recruitment` role.** The §10 role list had no home for the
  recruitment department. Giving recruiters their own role keeps them out
  of finance and admin data.
- **Public form at `/careers/apply`**, linked from /careers (§13 keeps
  careers low-prominence):
  - It writes through the service role. There's no anon insert policy.
  - It records privacy consent with a timestamp.
  - The applicant acknowledgement email is logged as skipped while Resend
    is deferred (§8).
- **East Africa only, enforced in the database.** The country column has a
  CHECK for the EAC member states (Kenya, Uganda, Tanzania, Rwanda,
  Burundi, South Sudan, DR Congo, Somalia). The form only offers those
  countries.
- **The pipeline is manual and every move is audited:**
  `applied → screening → test_task → test_review → approved | rejected`.
  - The stage changes only on a recruiter's action.
  - Test-task details are tracked as notes.
  - Approval needs an engagement type (freelance or full-time). Rejection
    needs an internal reason.
  - Every stage change is written to `audit_log` by a trigger.
- **KRA PINs:**
  - Only for approved, full-time hires in Kenya.
  - Encrypted with `pgcrypto` using a key generated inside the database and
    held in Supabase Vault (`tax_id_key`). The key never touches the repo
    or the app's environment.
  - Written through `set_talent_tax_pin` (recruitment, finance,
    super_admin). Read only through `get_talent_tax_pin` (finance,
    super_admin), and every read is audit-logged.
  - Column privileges make the ciphertext unselectable for app roles.
  - This meets §11: encrypted at rest, reads restricted to finance and
    super_admin.
- **ID verification:** the `IdVerificationProvider` interface
  (`lib/verification.ts`) has a "coming soon" implementation.
  `verification_status` defaults to `pending_setup` and blocks nothing.
- **Quality:**
  - `projects`, optionally linked to a Finance client.
  - Assignments, which only accept approved talent (enforced by RLS).
  - A QA checklist seeded with the three owner checks on every new project.
  - One delivery review per person per project, rated 1–5. Freelancer
    performance is the average of those ratings.
  - Freelancers see their own profile and assignments, never their reviews.
- **Portal accounts for freelancers** are created by recruitment from an
  approved application, with a one-time password as in ADR 0003. Role
  grants go through the service role, and recruiters can't grant roles
  through RLS. The action writes its own audit entry with the recruiter as
  actor.

## Consequences

- **The privacy notice at /legal is still a placeholder**, and the consent
  checkbox links to it. Real Kenya Data Protection Act text is needed
  before the form takes real applications.
- **The EAC list and the role list live in two places:** the DB CHECK and
  `lib/talent/options.ts`. Change both together.
- **Status emails to applicants** (§9) wait for Resend.
