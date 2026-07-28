# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**NillTech Solutions Ltd** — Nairobi, Kenya. Registered 18 Dec 2024.

**Positioning:** Managed tech delivery company. **NOT a freelancer marketplace. NOT an agency.** Every UI/copy decision in this repo must reinforce that distinction, not undercut it.

**Core promise:** "One partner. Full accountability."

**This repo (`nilltech-solutions`) is a greenfield rebuild** of the marketing site, started fresh rather than as an incremental patch of the current production codebase. It does not read from or deploy over the live site at **nilltechsolutions.com** — that stays untouched until an explicit, separate cutover decision.

## Service lines

1. Managed AI Delivery — production AI systems, copilots, RAG, automation
2. Managed Software Teams — web, mobile, internal systems, enterprise software
3. AI Training & Evaluation Ops — RLHF, preference ranking, model eval, moderation
4. Data Annotation & Validation
5. Team Augmentation with Delivery Oversight
6. Delivery Rescue & Scale-Up

## Buyer

**ICP:** CTO / Head of Engineering / Ops Director at a funded startup or mid-market company in the US, UK, Canada, or East Africa (Kenya, Uganda, Tanzania, Rwanda). Also schools, churches, e-commerce operators, and organisations needing business systems.

**Explicitly NOT the buyer:** freelancers looking for work. All supply-side recruitment content is demoted to the footer or isolated at `/talent` — it never competes with or contaminates the buyer journey (a lesson from the current live site, whose hero currently reads as a job board — do not repeat that mistake here).

## Site structure

```
/                      Sells services, not talent
/development           NillTech Development
/ai                    NillTech AI
/qa                    NillTech QA
/academy               NillTech Academy
/work, /work/[slug]    Case studies
/about /contact /careers
/talent                Freelancer recruitment, isolated from buyer journey
```

Each division route needs: independent messaging, offer stack, pricing, lead magnet, portfolio/proof, testimonials, per-route SEO, conversion CTA, analytics events. None of these are copy-paste siblings of `/` — they're distinct offers to a shared but not identical buyer.

## Tech stack (non-negotiable)

Next.js App Router, React, TypeScript strict, Tailwind CSS, shadcn/ui, Framer Motion.

## Standards

ESLint clean, modular/component-driven architecture, mobile-first, WCAG 2.1 AA, SSR/SSG where appropriate, semantic HTML, optimised assets, Core Web Vitals green.

## Contact

info@nilltechsolutions.com | nilltechsolutions.com

## Working agreement — rules for every session

- **Plan before coding.** Explain architectural trade-offs before implementing.
- **Never invent requirements** not in the brief.
- **Ask for clarification only when a missing detail actually blocks implementation** — don't stall on things that don't matter yet.
- **Every PR states:** what changed, why, what to test, bundle size delta.
- **Flag refactor opportunities, don't silently perform them.**
- **Target:** deployable to production with minimal modification.
- **Staged delivery, approval gates.** Work proceeds in ordered phases (e.g. architecture proposal → project init → design system → route skeleton → SEO/analytics/error-state foundation); each phase is reviewed and approved before the next starts. Don't skip ahead or bundle phases unless explicitly told to.
- **No marketing copy from Claude.** The owner supplies real copy. Ship routes/components with obvious, unmistakable placeholder text (e.g. `"[CASE STUDY TITLE]"`, not a plausible-sounding fake sentence) — nothing that could accidentally ship as real content.
- Proof-layer components (testimonials, logo wall, case studies) must **render nothing when empty** — never placeholder-fake proof.
- Never ship a link to nothing — if a card/CTA doesn't have a real destination yet, don't link it.

## Relationship to other NillTech workstreams (context, not this repo's job)

- A separate Claude Code prompt pack targets the **existing live-site codebase** in its own repo: full audit → P0 positioning fixes (remove the job-board-reading hero widget, kill marketplace language like "access a global pool of experts," demote "Join as Freelancer" out of primary nav) → proof layer → conversion plumbing (working service-card links, pricing anchors, discovery form, analytics, technical SEO) → competitor research → only then a full rebuild. That incremental work, if it happens, happens in that other repo — **not here**. This repo starts the rebuild from a blank slate instead of walking that path.
- Strategic/financial/GTM/legal/company-ops work (positioning analysis, go-to-market strategy, financial modelling, KPI dashboard spec, hiring framework, corporate legal docs) happens in chat with reasoning models, not as repo work — this repo is code only. Don't generate business-strategy documents here; if asked, point back to chat.
- Later, unrelated repos/workstreams referenced alongside this one: role-scoped executive dashboards (auth-gated, RBAC) and a Markdown-to-branded-PDF corporate document pipeline. Out of scope for this repo unless explicitly requested.

## Commands

_To be filled in once the project is initialized — `dev`/`build`/`lint`/`typecheck` scripts and any test runner will be documented here as soon as `package.json` exists._

## Architecture

_To be filled in as the architecture proposal is approved and implemented — directory structure, routing strategy, content-authoring model (MDX vs. CMS vs. typed constants) and why, component layering, data-fetching strategy per route, and the case-study data model._
