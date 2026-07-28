# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**NillTech Solutions** — production marketing/agency site, rebuilt from scratch in this repo (`nicholastonui34/nilltech-solutions`). This is a **greenfield rebuild**: there is no legacy code to migrate, and nothing here should ever touch or deploy over the current live site at **nilltechsolutions.com** until the owner explicitly cuts over.

NillTech is a **3-founder team with no dedicated content editor** — that constraint drives real architecture decisions in this repo (e.g. content-authoring approach), not just a footnote. See the architecture proposal history for the reasoning; don't silently introduce a CMS or editorial workflow that assumes staffing this repo doesn't have.

Site verticals/sections: `/development` `/ai` `/qa` `/academy` (service lines), `/work` + `/work/[slug]` (case studies), `/about`, `/contact`, `/careers`, `/talent`.

## Working agreement

- **Staged delivery, approval gates.** Work proceeds in ordered phases (architecture proposal → project init → design system → route skeleton → SEO/analytics/error-state foundation), each reviewed and approved before the next starts. Don't skip ahead or bundle phases unless explicitly told to.
- **No marketing copy from Claude.** The owner supplies real copy. Ship routes/components with obvious, unmistakable placeholder text (e.g. `"[CASE STUDY TITLE]"`, not a plausible-sounding fake sentence) — nothing that could accidentally ship as real content.
- **Accessibility and SEO are foundational, not retrofitted.** WCAG 2.1 AA and per-route metadata/OpenGraph/JSON-LD are built in from the route skeleton onward, not added in a later pass.

## Tech stack (standards for this repo)

- **Next.js App Router**, TypeScript in **strict mode**.
- **Tailwind CSS** + **shadcn/ui** as the component base — every page composes from the design system's primitives; no one-off bespoke components that bypass it.
- **Framer Motion** for motion, driven off shared motion primitives/tokens rather than ad-hoc per-component animation values.
- **ESLint + Prettier**, enforced via **Husky** pre-commit hooks.
- **Absolute imports** (no deep relative `../../../` chains).
- Keep the scaffold free of unused boilerplate from `create-next-app` or shadcn's CLI defaults — delete what isn't used rather than leaving it dormant.

## Commands

_To be filled in once the project is initialized (Phase 2) — `dev`/`build`/`lint`/`typecheck` scripts and any test runner will be documented here as soon as `package.json` exists._

## Architecture

_To be filled in as the architecture proposal is approved and implemented — directory structure, routing strategy, content-authoring model (MDX vs. CMS vs. typed constants) and why, component layering, data-fetching strategy per route, and the case-study data model._
