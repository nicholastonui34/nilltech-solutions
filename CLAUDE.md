# CLAUDE.md

This file is the single source of truth for Claude Code when working in this repository. It supersedes the v1 `CLAUDE.md` (greenfield-rebuild framing) and the original `docs/MASTER_PROMPT.md` 5-phase process — see **Conflicts & resolutions** in the PR/session notes for why. If anything here contradicts an older doc in `/docs`, this file wins.

## 1. Project identity

- **Company:** NillTech Solutions Ltd — managed technology delivery company. Nairobi, Kenya. Registered 18 Dec 2024.
- **Positioning line:** "We Build the Team. You Own the Outcome." Never use "Your Outsourcing Partner for Scale."
- **Not a freelancer marketplace. Not an agency.** Every UI/copy decision must reinforce that, not undercut it.
- **Markets:** Kenya, Uganda, Tanzania, Rwanda (primary growth) + US, UK, Canada.
- **Contact — single source of truth in `config/site.config.ts`:** info@nilltechsolutions.com · +254 725 830 334 (call + WhatsApp).
- **Brand tokens:**
  | Token  | Value                                                  |
  | ------ | ------------------------------------------------------ |
  | Navy   | `#060B1F`                                              |
  | Blue   | `#38BDF8`                                              |
  | Purple | `#5B2D8E`                                              |
  | Gold   | `#F4C430`                                              |
  | Font   | Poppins via `next/font` (subset, `display: swap`)      |
  | Mark   | Gradient purple→blue "N" mark                          |
  | Tone   | Aspirational, craft-led, excellence — never fear-based |
- **Objective:** modern, cost-effective site that clearly communicates offers, ranks on Google/Bing, gets cited by AI search, and converts.

## 2. Non-negotiable rules

- Never invent prices, stats, client names, reviews, testimonials, case-study results, certifications or team members. Use `{{PLACEHOLDER: description}}` and log every one in `docs/content-placeholders.md`.
- Strict TypeScript (no `any`), ESLint clean, Server Components by default, client JS only where interaction requires it.
- Mobile-first, WCAG 2.2 AA, one `<h1>` per page.
- Iterative refinement over rebuilds. Validate each milestone (build, lint, typecheck, Lighthouse) before moving on.
- Push back in writing when a request hurts speed, rankings, accessibility, cost targets or conversions.
- **Staged delivery, approval gates** (unchanged from v1): work proceeds in the ordered phases in §17; each phase is reviewed and approved before the next starts. Don't skip ahead or bundle phases unless explicitly told to.
- Every PR states: what changed, why, what to test, bundle size delta.
- Flag refactor opportunities, don't silently perform them.
- Proof-layer components (testimonials, logo wall, case studies) render nothing when empty — never fake placeholder proof.
- Never ship a link to nothing.

## 3. Cost ceiling — infrastructure ≤ KES 30,000/year

Verify every price on the vendor's live pricing page before committing, and record the check date here. **This session's network policy blocked direct fetches to vendor pricing pages** (withpersona.com, africastalking.com, and others resolved `ENOTFOUND`); the figures below come from web search aggregators dated 2026, not a vendor's own page. Treat "verified" below as "corroborated by multiple third-party sources," not "confirmed on the vendor's site" — a human still needs to open each pricing page directly before this budget is final.

> ℹ️ **Owner decision (2026-10-24): Persona and Africa's Talking are deferred — "coming soon," not building against them yet.**
>
> 1. **ID verification (Persona):** no free tier found — cheapest confirmed plan is $250/month on a 12-month minimum (~KES 390,000/year, ~13x the whole infra budget). Not a current blocker: freelancer ID verification ships as a "coming soon" placeholder (§11) until a vendor decision is made. Don't wire a real Persona integration yet.
> 2. **SMS (Africa's Talking):** likely has a one-off sender ID registration fee (~KES 5,000–15,000) on top of ~KES 0.80/SMS usage, not currently budgeted. Not a current blocker: SMS automation ships as "coming soon" (§9) until confirmed. Don't wire a real Africa's Talking integration yet.
> 3. **Email (Resend):** no account/domain yet — the owner will provide credentials once ready. Build the sending abstraction (`lib/resend.ts`) so templates aren't blocked, but there's no live sending until the account exists.

| Service                                 | Choice                                                            | Plan                                                                                       | Est. annual cost                      | Price last verified                                                                                                                                           |
| --------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosting                                 | Vercel                                                            | Hobby (temporary)                                                                          | KES 0 now; Pro $20/seat/mo on upgrade | 2026-10-24 (third-party aggregators; confirms free/non-commercial terms, ~100GB/mo transfer, no overage — see ADR 0001)                                       |
| Database/Auth/Storage                   | Supabase                                                          | Free tier                                                                                  | KES 0                                 | 2026-10-24 (aggregators: 2 projects, 500MB DB, 1GB storage, 5GB egress, 50k MAU — **free projects auto-pause after 7 days' inactivity**, relevant pre-launch) |
| Transactional + marketing email         | Resend                                                            | Free: 3,000/mo, 100/day, 1 domain, 1,000 marketing contacts — **deferred, no account yet** | KES 0                                 | 2026-10-24 (confirmed by Resend's own 2023 free-tier announcement + 2026 aggregators)                                                                         |
| Inbound mailboxes                       | Cloudflare Email Routing → existing inbox, or Zoho Mail free tier | Free                                                                                       | KES 0                                 | `{{VERIFY}}` — not searched this pass                                                                                                                         |
| DNS, CDN, WAF, Turnstile, Web Analytics | Cloudflare                                                        | Free                                                                                       | KES 0                                 | 2026-10-24 (CDN/DNS/WAF managed rules/Web Analytics corroborated free; **Turnstile free-tier terms not found in search results — unverified**)                |
| Cron/background jobs                    | Supabase `pg_cron` + Edge Functions                               | Included                                                                                   | KES 0                                 | —                                                                                                                                                             |
| SMS                                     | Africa's Talking (prepaid) — **deferred, coming soon**            | Usage                                                                                      | KES 0 (not active)                    | 2026-10-24 (no official rate card found; aggregators estimate ~KES 0.80/SMS, sender ID KES 5,000–15,000 one-off — confirm before activating)                  |
| ID verification                         | Persona — **deferred, coming soon**                               | Usage-based                                                                                | KES 0 (not active)                    | 2026-10-24 (no free tier found; Essential plan $250/mo, 12-month minimum — confirm vendor before activating)                                                  |
| AI APIs (quote estimator)               | Cheapest capable model + hard monthly spend cap                   | Usage                                                                                      | `{{BUDGET: KES ~6,000 cap}}`          | `{{VERIFY}}` — not searched this pass                                                                                                                         |
| Domain                                  | Existing registrar                                                | Renewal                                                                                    | ~KES 2,000                            | `{{VERIFY}}` — depends on current registrar                                                                                                                   |

**Rules:**

- **Hosting decision (owner-approved, temporary):** Vercel Hobby for now. Known risk: Hobby's terms restrict it to non-commercial use, and it caps usage with no overage (site pauses at the limit). Record this in `docs/decisions/` as an ADR before Phase 1 ships.
- **Upgrade triggers → Vercel Pro:** first paid client transaction through the site, approaching any Hobby usage limit, needing team seats, or any notice from Vercel. Admin dashboard shows a warning before limits are hit.
- Keep the app host-portable: no Vercel-only APIs in core logic (avoid Vercel KV/Blob/Edge Config lock-in) — storage and jobs live in Supabase so a move to Pro or another host needs no rewrite.
- Use `next/image` within the Hobby image-optimization allowance; pre-optimize hero/brand images (AVIF/WebP, correct sizes).
- **Resend:** Free tier for now. Upgrade trigger → Pro when daily sends regularly exceed ~80.
- Other triggers: Supabase DB >400 MB or need for PITR → Pro. Each trigger alerts the admin dashboard before it's hit.
- Supabase Free has no managed backups: nightly GitHub Action `pg_dump` → private storage (Cloudflare R2 free tier or encrypted GitHub artifact).
- Dynamic-import dashboard/chart libraries; no heavy libraries on public pages.
- If the deployed host ever differs from this table, write a migration plan (DNS cutover, redirects, env vars, zero downtime) in `docs/migration.md`.

## 4. Information architecture & offers

Primary nav (max 6): **Services · AI Solutions · Managed Teams · Academy · Pricing · Podcast** + primary CTA button. Secondary/footer: About, Partnerships, Case Studies, Blog/Insights, Careers, Contact, Legal.

| Offer                                                                            | Route              | Primary CTA                | Audience                                           |
| -------------------------------------------------------------------------------- | ------------------ | -------------------------- | -------------------------------------------------- |
| AI-Powered Software Development (websites, custom software, e-commerce, systems) | `/services/*`      | Get a Quote (AI estimator) | SMEs, schools, churches, e-commerce, organisations |
| AI Solutions for SMEs (automation, chatbots, AI integrations)                    | `/ai-solutions/*`  | Book a Demo                | SME owners/ops leads                               |
| Managed Tech Delivery Teams                                                      | `/managed-teams/*` | Book a Discovery Call      | B2B companies outsourcing work                     |
| NillTech Academy — free + paid AI & software courses                             | `/academy/*`       | Start Free / Enrol         | Learners, career-switchers, teams                  |
| Partnerships — B2B outsourcing & vetted teams                                    | `/partnerships`    | Contact Sales              | Agencies, enterprises, international firms         |

- Position NillTech as a **leading East African provider of localised managed software and AI delivery teams** — defensible language only, no unverifiable "first/only" claims.
- **Out of scope for now:** LLM training, data annotation, RLHF, AI data operations. Do not mention these anywhere on the site, schema, or `llms.txt`. Keep the IA flexible enough to add an offer page later without restructuring.
- Each service page: answer-first intro, who it's for, deliverables, process, "Starting from" price, FAQ, proof, one primary CTA repeated (hero, mid, end).
- **Open gap, needs a decision before routing is built:** this spec doesn't name a route pattern for case studies beyond a footer "Case Studies" link. Default to `/work/[slug]` (matches the proof/case-study data model already implied elsewhere) unless told otherwise — flagged in Conflicts below.

## 5. CTA system

Action-specific CTAs mapped by intent — never generic "Submit" or "Learn more":

| CTA                   | Used for                                            |
| --------------------- | --------------------------------------------------- |
| Book a Discovery Call | Managed teams, custom software                      |
| Book a Demo           | AI solutions, products with live demos              |
| Get a Free Quote      | Services (feeds AI quote estimator)                 |
| Contact Sales         | Partnerships, enterprise                            |
| Talk on WhatsApp      | Sticky mobile secondary CTA (`wa.me` click-to-chat) |

- Booking: embed Cal.com (free tier) behind a click-to-load facade so it never blocks LCP.
- Every CTA fires a tracked conversion event: `cta_click`, `form_start`, `form_submit`, `booking_complete`, `whatsapp_click`, `call_click`, `quote_generated`.

## 6. Pricing page (`/pricing`)

- "Starting from KES/USD `{{PRICE}}`" per service tier; currency toggle (KES/USD) with no layout shift.
- Show what drives price up/down, typical timelines, payment-terms placeholders.
- Link each tier to the AI quote estimator. FAQ + guarantee placeholder near CTAs.

## 7. AI Quote & Cost Estimators (`/estimate`)

- **A. Project Quote Estimator:** multi-step form (project type, features, integrations, timeline urgency, region) → deterministic rules engine produces price range + timeline range from a typed `config/pricing-rules.ts` I control. LLM is optional, used only to summarise scope in plain language — it never sets the price.
- **B. AI Token Cost Estimator:** pick models + task (chatbot, document processing, classification, RAG) + volume → monthly token cost + estimated timeline. Model prices live in `config/ai-model-pricing.ts` with a `lastVerified` date shown on the page.
- Output: on-screen estimate + "Email me this estimate" (Resend) + CTA to book a call. Store as a lead with score.
- Rate-limit (Turnstile + per-IP limit), hard monthly AI spend cap, graceful fallback if AI is unavailable.
- Clear disclaimer: estimates are indicative, final quote after discovery.

## 8. Email (Resend) — deferred, coming soon

**No Resend account exists yet; the owner will provide it once ready.** Build templates and the `lib/resend.ts` sending abstraction against this spec so nothing is blocked, but there is no live sending — and no Phase ships depending on real email delivery — until credentials land in `.env.local`.

React Email templates in `emails/`. Verified sending domain with SPF, DKIM, DMARC.

**Templates:** enquiry auto-reply, internal lead alert, quote estimate, demo/discovery booking confirmation + reminder, contact-sales ack, freelancer application received/status updates, verification requested/approved/rejected, password reset/magic link, invoice & receipt delivery, newsletter (Resend Broadcasts), Academy enrolment.

- Plain-text fallback, unsubscribe on marketing mail, idempotency keys, webhook handling for bounces/complaints.
- Queue sends to respect the 100/day free cap; alert admin at 80%.

## 9. Automation (in-app, no paid automation platform)

- **Lead capture → qualification:** forms write to `leads`; rules-based scoring (budget, timeline, company size, service, region) → tier Hot/Warm/Cold; Hot leads trigger instant email + SMS to sales.
- **Nurture:** scheduled email sequences per service (Supabase `pg_cron` → Edge Function → Resend), throttled to the free-tier daily cap.
- **SMS — deferred, coming soon:** Africa's Talking for booking reminders and hot-lead alerts; opt-in recorded. No vendor wired yet (see §3/§18) — build behind an `SmsProvider` interface so the real integration slots in later without a rewrite.
- **Newsletter:** double opt-in, Resend audiences, segment by interest (services / AI / Academy / podcast). Blocked on the Resend account (§8).
- **Freelancer onboarding & hiring:** apply → skills form → automated screening → ID verification (**deferred, coming soon** — see §11) → tax info → test task → approval → added to talent pool. Status emails at each step.
- All automations logged in `automation_runs` with retry + failure alerts on the admin dashboard.

## 10. Portals & dashboards (`/portal`, auth-gated, `noindex`)

Single Next.js app, route group `(portal)`, Supabase Auth + **Row Level Security on every table**. RBAC roles: `super_admin`, `director`, `finance`, `marketing`, `sales`, `quality`, `freelancer`, `client`.

| Dashboard            | Role(s)                          | Core views                                                                                                      |
| -------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Director/Shareholder | director, super_admin            | Revenue, pipeline value, margins, growth KPIs, read-only                                                        |
| Main Admin           | super_admin                      | Users, Role Assignment (invite, assign/revoke roles, audit log), settings, system health, budget/usage triggers |
| Finance              | finance                          | Invoices, receipts, payments, KRA eTIMS invoice automation, expenses, exports                                   |
| Marketing            | marketing                        | Traffic, sources, conversions, newsletter, podcast performance, campaign UTM                                    |
| Sales                | sales                            | Leads, scoring, pipeline stages, bookings, follow-ups, quotes                                                   |
| Quality              | quality                          | Project QA checklists, delivery reviews, freelancer performance                                                 |
| Analytics            | director, super_admin, marketing | Funnel, CWV field data, conversion events                                                                       |
| Freelancer           | freelancer                       | Profile, verification status, tax info, assignments                                                             |
| Client               | client                           | Projects, invoices, receipts, documents, optional tax info                                                      |

- **Document automation:** server-generated PDFs (invoices, receipts, quotes, contracts, onboarding letters) with numbering, stored in Supabase Storage, emailed via Resend.
- **eTIMS:** KRA eTIMS (OSCU/VSCU) typically needs KRA approval or a certified integrator. Build an `EtimsProvider` interface with a stub adapter now; plug in the certified integrator later. `{{INPUT NEEDED: eTIMS integration route}}`.
- Audit log for every role change, financial action and verification decision.
- Charts lazy-loaded; dashboards never affect public-site bundle.

## 11. Identity verification & tax info

- **Freelancers — ID verification deferred, coming soon.** No vendor decided yet: Persona's cheapest confirmed plan (~KES 390,000/year) is far outside the infra budget (§3). Ship the freelancer flow with verification shown as "Coming soon" in the UI and `verification_status` defaulting to `pending_setup` — don't block the rest of onboarding on it, and don't wire Persona (or any vendor) until the owner picks one. Design `lib/verification.ts` as a swappable `IdVerificationProvider` interface, same pattern as the eTIMS stub in §10, so a real vendor drops in later without a rewrite.
- Collect tax info (KRA PIN or country equivalent) independent of ID verification status. Store only verification-provider inquiry IDs + status once a vendor exists — never raw ID images on our side.
- **Clients:** no ID verification. Optional tax info (KRA PIN/VAT number) for eTIMS-compliant invoices.
- Encrypt tax identifiers at rest; restrict reads to finance + super_admin via RLS. Kenya Data Protection Act 2019-compliant privacy notice and consent capture.

## 12. Podcast — "Workshift by NillTech" (`/podcast`)

- Episode pages: answer-first summary, key takeaways, crawlable HTML transcript, chapters, guest info.
- Shorts grid (vertical embeds) + "Watch full episode on YouTube" + share buttons (LinkedIn, X, Facebook, WhatsApp, copy link) via native URLs — no heavy share SDKs.
- YouTube embeds via click-to-load facade (lite embed) to protect LCP/INP.
- Topics: services, remote work, managed remote teams, remote work evolution with AI, insights.
- Schema: `PodcastSeries`, `PodcastEpisode`, `VideoObject`. Subscribe CTA + newsletter capture.
- `{{INPUT NEEDED: YouTube channel URL, episode list}}`.

## 13. Careers (`/careers`) — deliberately low prominence

Footer link only, not in primary nav. Keep "Join as Freelancer" entry point, routed through the freelancer onboarding flow (§9). `JobPosting` schema only for real, open roles.

## 14. SEO & AI search (every page)

- Keyword + search-intent map per page in `docs/seo-map.md` before building/updating that page (Kenya + East Africa + international terms).
- Metadata API: unique title, description, canonical, Open Graph, Twitter per page.
- `sitemap.ts`, `robots.ts` (allow Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-SearchBot, Google-Extended; disallow `/portal`, `/api`).
- JSON-LD matching visible content: Organization + LocalBusiness (Nairobi NAP), WebSite, BreadcrumbList, Service, Course (Academy), FAQPage, Article, PodcastEpisode, VideoObject, JobPosting.
- Answer-first sections, question-based H2s, tables, lists, FAQs; consistent NAP; About page with founders, credentials, last-updated dates.
- `public/llms.txt` summarising offers, pricing approach, contacts and key URLs.
- 301 redirects for any changed URLs (`next.config` redirects); proper 404/410.
- IndexNow ping on publish (Bing/Yandex).

## 15. Performance & quality gates (mobile)

LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1 · Lighthouse Performance ≥ 90, SEO 100, Accessibility ≥ 95, Best Practices ≥ 95.

- Framer Motion only on transform/opacity, respects `prefers-reduced-motion`, never on the LCP element.
- Third-party scripts lazy (Cal.com, YouTube, Persona, analytics).
- Forms: short, inline validation (Zod + React Hook Form), Turnstile spam protection, clear confirmation state.

## 16. Architecture conventions

```
app/(marketing)/...   public pages (SSG/ISR)
app/(portal)/...      auth-gated dashboards (dynamic, noindex)
app/api/...           route handlers (webhooks: resend, persona, africastalking, cal)
components/ui         shadcn/ui primitives
components/sections   reusable marketing sections
features/<domain>     leads, estimator, academy, podcast, invoicing, verification, rbac
lib/                  clients (supabase, resend, sms, persona, etims), utils
config/               site.config.ts, pricing-rules.ts, ai-model-pricing.ts, nav.ts
emails/               React Email templates
supabase/migrations   SQL + RLS policies
docs/                 seo-map, content-placeholders, migration, decisions (ADRs)
```

- All secrets via env vars; maintain `.env.example`. Server-only modules marked `import "server-only"`.
- Write an ADR in `docs/decisions/` for each significant choice.

## 17. Delivery phases

Staged, gated — each phase ends with typecheck, lint, tests, Lighthouse report, and a summary for approval before the next starts.

- [x] **Phase 0 — Scope audit & CLAUDE.md rewrite.** Done.
- [~] **Phase 1 — Foundation.** _(current — partially done, see below)_
  - [x] Project init: Next.js App Router, TS strict, Tailwind v4, shadcn/ui (manually scaffolded — `ui.shadcn.com` is blocked by this session's network policy, so `components.json` + primitives are hand-written, not CLI-generated), Framer Motion, ESLint + Prettier + Husky/lint-staged. Builds, lints and typechecks clean.
  - [x] `config/site.config.ts`, `config/nav.ts`, `.env.example`.
  - [x] Vercel Hobby ADR (`docs/decisions/0001-vercel-hobby-hosting.md`).
  - [x] Cost table verified against third-party sources (§3) — surfaced two budget conflicts needing owner decisions (Persona, Africa's Talking sender ID).
  - [x] Supabase RBAC schema + RLS policies written (`supabase/migrations/`) — code ready, see below for live-apply status.
  - [~] **Live Supabase project — in progress.** Using the owner's existing Boxora org (`corbpkehvooygucolexs`): the org's free-tier limit is 2 active projects, so `barber-queen` was paused to free a slot, and the paused "boxora web development Project" (`grkdajxwymmxqvsewmtd`) is being restored for reuse rather than creating a new project. Restore was still `COMING_UP` as of this commit — migrations get applied and the project renamed once it reports healthy. Resume `barber-queen` later if it's needed again, or upgrade the org.
  - [~] **Resend domain verification — deferred, coming soon.** Owner will provide a Resend account when ready; not a Phase 1 blocker (see §8).
- [ ] **Phase 2 — Public site v2.** New IA, offer pages, pricing, CTAs, SEO/AI-search layer, `llms.txt`. Design system sourced from the brand tokens in §1 (Figma pull pending — see Open Inputs).
- [ ] **Phase 3 — Lead engine.** Forms, quote + token estimators, scoring, email/SMS automation, booking.
- [ ] **Phase 4 — Admin core.** Main Admin + Role Assignment, Sales, Marketing, Analytics dashboards.
- [ ] **Phase 5 — Finance & docs.** Invoicing, receipts, PDF generation, eTIMS adapter.
- [ ] **Phase 6 — Talent.** Freelancer onboarding, Persona, tax info, Quality dashboard.
- [ ] **Phase 7 — Content.** Podcast, Academy (free courses first; paid later), Careers.

## 18. Open Inputs (keep updated)

- **ID verification vendor — deferred, coming soon (owner decision 2026-10-24).** Persona's cheapest confirmed plan ($250/mo, 12-month minimum) is ~13x the entire infra budget, so freelancer verification ships as a placeholder until a vendor is picked (iDenfy/Didit mentioned as having free tiers, both unverified). Not blocking current phases.
- **SMS vendor — deferred, coming soon (owner decision 2026-10-24).** Africa's Talking likely has a one-off sender ID fee (~KES 5,000–15,000) not yet budgeted. SMS automation ships behind a swappable interface, not wired to a real vendor, until confirmed. Not blocking current phases.
- **Resend account — deferred, coming soon (owner decision 2026-10-24).** Owner will provide credentials when ready; email sending is stubbed until then. Not blocking current phases.
- "Where to Play" strategy doc — not found in this repo; needed before finalizing IA/keyword targets.
- Figma file link — none provided yet. Needed to pull real tokens/components via Figma MCP for Phase 2; until then, the design system starts from the brand tokens in §1 and is built directly in code/Figma from scratch rather than imported.
- Logo master file — current `public/brand/nilltech-logo.jpg` is a flat JPEG with a baked-in white background (no transparency). Needs an SVG or transparent PNG before it goes into a real header/dark-mode nav.
- Starting prices per service.
- Testimonials/case studies.
- YouTube channel + episode list.
- Academy course list & pricing.
- eTIMS integration route.
- Current hosting provider & cost breakdown (if the live nilltechsolutions.com site is ever folded into this repo's scope — currently out of scope, see Conflicts).
