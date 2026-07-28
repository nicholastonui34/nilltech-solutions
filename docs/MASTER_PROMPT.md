# Master prompt — NillTech Solutions site build

Paste this as the first message in a new Claude Code session, opened in the
`nicholastonui34/nilltech-solutions` repo. `CLAUDE.md` is already committed
at the repo root and will load automatically — this prompt kicks off the
build on top of it; it doesn't repeat what's already there.

---

Build the NillTech Solutions marketing site in this repo (`nicholastonui34/nilltech-solutions`) from scratch. Read `CLAUDE.md` first — it has full company context (positioning, service lines, ICP, tech stack, standards, session rules). Follow it for every decision below; don't restate it back to me, just apply it.

This is a **greenfield rebuild**. There is no existing code in this repo to migrate. The current live site at nilltechsolutions.com is a separate, untouched codebase — nothing here reads from or deploys over it.

**SEO is a first-class requirement, not a checklist item bolted on at the end.** Every phase below must be designed with technical SEO and Core Web Vitals in mind from the first decision, not retrofitted in Foundation. Specifically:

- Rendering strategy per route must default to SSG/ISR wherever content allows it — no unnecessary client-side rendering of primary content that search engines need to see on first paint.
- Structured data: `Organization` schema site-wide, `Service` schema on each division route, `Article`/case-study-appropriate schema on `/work/[slug]`, `BreadcrumbList` where nesting exists. Model this as data, not hand-written JSON-LD per page.
- Semantic HTML and a correct heading hierarchy (single H1 per route) enforced by the component layer, not left to page authors to get right by convention.
- `next/image` everywhere with real `alt` text placeholders, responsive `sizes`, modern formats.
- Per-route canonical URLs, OpenGraph + Twitter Card metadata, dynamic OG images.
- `sitemap.xml` and `robots.txt` generated from the route/case-study data, not hand-maintained.
- Internal linking strategy between `/`, division routes, and `/work/[slug]` case studies — argue this explicitly in the architecture proposal, it's a ranking lever, not decoration.
- Core Web Vitals budget stated and designed against (LCP/CLS/INP targets) before any component is built, not measured after the fact.
- URL structure and route taxonomy chosen for keyword/topical clarity (real keyword targets will come from chat-side research and get slotted in later — build the scaffolding to receive them, don't guess keywords yourself).

**Deliver in this order, pausing after each for my approval — do not proceed to the next phase without an explicit go-ahead:**

1. **ARCHITECTURE PROPOSAL** (written, no code). Directory structure, routing strategy, where content lives (MDX vs. CMS vs. typed constants — argue the trade-off for a 3-founder team with no dedicated content editor), component layering, data-fetching strategy per route, how case studies are modelled, and the SEO/rendering-strategy decisions above. Justify every decision.

2. **PROJECT INIT.** Next.js App Router, TypeScript strict mode, Tailwind, shadcn/ui, Framer Motion, ESLint + Prettier, Husky pre-commit hooks. Absolute imports. No boilerplate cruft left in.

3. **DESIGN SYSTEM.** Design tokens, typography scale, colour system, spacing scale, elevation, motion primitives. Base components on shadcn/ui. Every page must compose from this — no one-off components later. Render a `/styleguide` route so I can review it visually.

4. **ROUTE SKELETON** — structure only, placeholder content:
   `/  /development  /ai  /qa  /academy`
   `/work  /work/[slug]  /about  /contact  /careers  /talent`
   Shared layout, nav, footer. Semantic HTML. WCAG 2.1 AA from the start, not retrofitted.

5. **FOUNDATION.** Full SEO infrastructure per the requirements above (per-route metadata, OpenGraph, JSON-LD Organization + Service schema, sitemap, robots.txt, canonicals), analytics scaffolding (event tracking hooks on every CTA, provider-agnostic so GA4/Plausible can be wired in later), error and loading states, 404 and 500.

**Rules, restated because they matter here:**

- Do not write marketing copy — I'm supplying it. Use obvious placeholders that would never accidentally ship (e.g. `"[CASE STUDY TITLE]"`, not a plausible sentence).
- Proof-layer components (testimonials, logo wall, case studies) render nothing when empty — never fake placeholder proof.
- Never ship a link to nothing.
- Every PR states: what changed, why, what to test, bundle size delta.
- Flag refactor opportunities, don't silently perform them.
- Plan before coding; ask only when something actually blocks implementation.

Stop after the architecture proposal and wait for my approval.
