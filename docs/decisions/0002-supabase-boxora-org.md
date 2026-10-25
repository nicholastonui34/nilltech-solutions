# ADR 0002 — Supabase project lives in the owner's Boxora org

- **Status:** Accepted (owner-approved)
- **Date:** 2026-10-24

## Context

The only Supabase account connected to this session belongs to org
`corbpkehvooygucolexs` ("BOXORA CONTAINERS LLC"), which also holds other,
unrelated projects (`barber-queen`, `deposa-demo`, `guidlyy`, and a paused
"boxora web development Project"). The org's free tier caps a member at 2
active projects, and that cap was already reached.

Two options were considered:

1. **Reuse the paused "boxora web development Project"** instead of
   creating a new one, to stay within the free-tier project count. This
   was tried first (after pausing `barber-queen` to free a slot), but
   `list_tables` on the restored project showed it already holds a real,
   substantial e-commerce/marketplace schema (`users`, `products`,
   `orders`, `payments`, `seller_listings`, etc. — 0 rows, but clearly a
   built application, not empty scaffolding). Repurposing it would have
   mixed NillTech's RBAC schema into an unrelated app's database.
2. **Create a fresh, empty project** named `nilltech-solutions` in the
   same org, pausing `barber-queen` to stay under the 2-project cap.

## Decision

Option 2. `barber-queen` is paused; a new project `nilltech-solutions`
(ref `uwzttixqpwqmuuguchyw`, region `eu-central-1`) was created empty and
now holds only NillTech's schema (`profiles`, `user_roles`, `audit_log`
and the RLS policies in `supabase/migrations/`).

The "boxora web development Project" was restored, inspected, found
unsuitable, and paused again — it was not modified.

## Consequences

- `barber-queen` is unreachable until resumed. Whoever owns that project
  needs to know it's paused and why, and either resume it or upgrade the
  org to lift the 2-project cap if both need to run simultaneously.
- NillTech's Supabase project lives inside a shared multi-tenant org
  rather than a dedicated one. If NillTech is ever spun out to its own
  Supabase org/billing, this project transfers — note that as a future
  migration step, not an immediate concern.
- **Unrelated finding, flagged but not acted on:** while inspecting the
  "boxora web development Project," 10 of its tables were found with RLS
  disabled (`notifications`, `push_subscriptions`, `seller_profiles`,
  `seller_verification_events`, `seller_listings`, `seller_listing_images`,
  `seller_upgrade_requests`, `seller_fee_entries`, `seller_boost_packages`,
  `seller_boost_purchases`), exposing that data to the anon/authenticated
  keys. This is that project's issue, not NillTech's, and wasn't touched —
  surfaced here only because it was discovered during this session.
