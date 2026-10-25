# ADR 0001 — Host on Vercel Hobby (temporary)

- **Status:** Accepted (owner-approved)
- **Date:** 2026-10-24

## Context

CLAUDE.md §3 sets an infrastructure cost ceiling of ≤ KES 30,000/year, down
from the >KES 100,000/year baseline. Vercel is the natural fit for a Next.js
App Router site and is free on the Hobby plan, which gets us to KES 0/year
for hosting while the site has no paying traffic yet.

Vercel's Hobby plan terms restrict it to **non-commercial** use, and it has
**no paid overage** — the deployment pauses when a usage limit is hit rather
than billing for the excess. This is a real risk for a company marketing
site that exists specifically to generate paid leads, so this decision is
explicitly temporary and owner-approved with that risk understood, not a
long-term architecture choice.

## Decision

Deploy to Vercel Hobby for Phase 1–2 (foundation + public site v2). Keep the
app host-portable so the eventual move to Vercel Pro — or another host
entirely — needs no rewrite:

- No Vercel-only platform APIs in core application logic (no Vercel KV,
  Blob, or Edge Config as load-bearing dependencies).
- Durable storage and background jobs live in Supabase (`pg_cron` +
  Storage), not in anything Vercel-proprietary.
- `next/image` optimization is used within Hobby's allowance; hero/brand
  imagery is pre-optimized (AVIF/WebP, correct `sizes`) to stay inside it
  rather than relying on headroom we don't have.
- Functions run in **Frankfurt (`fra1`)**, set in `vercel.json` rather than
  the dashboard so it survives project re-creation. The Supabase project is
  in eu-central-1 (Frankfurt), so every server action that writes a lead
  stays in-region instead of crossing the Atlantic; Frankfurt is also the
  closest Vercel region to the East African primary market. The first
  deploy defaulted to `iad1` (Washington DC) before this was set.

## Upgrade triggers → Vercel Pro

Any one of these is a trigger, not just all of them together:

- First paid client transaction flows through the site (Academy payment,
  online-paid invoice).
- Usage approaches any Hobby plan limit (bandwidth, build minutes, image
  optimization, serverless function execution).
- The team needs multiple Vercel seats.
- Vercel sends any notice about the account (ToS, usage, or otherwise).

The admin dashboard (Phase 4) surfaces a warning before any of these limits
is actually hit, not after.

## Consequences

- If a trigger fires before Pro is provisioned, the site can pause without
  warning — acceptable risk for pre-revenue traffic, not acceptable once
  real leads/payments depend on uptime.
- Revisit this ADR the moment any upgrade trigger fires; don't wait for a
  scheduled review.
