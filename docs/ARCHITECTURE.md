# Architecture proposal — NillTech Solutions site

**Status:** Phase 1 — proposal, awaiting approval. No code written yet.
**Scope:** Greenfield marketing site in this repo. Nothing here touches nilltechsolutions.com until a separate cutover decision.

Every decision below has a justification. Items marked **[DECISION NEEDED]** are the open questions in §13. Items marked **[FLAG]** are risks or trade-offs you should know about but that don't block anything.

---

## 1. Guiding constraints (how they shape everything below)

| Constraint | Architectural consequence |
|---|---|
| 3 founders, no content editor | Content lives in the repo as typed, validated data. A bad edit fails the build with a readable error; it never ships broken. No CMS to run, pay for or secure (§4). |
| Owner supplies all copy | Placeholders are a first-class type (`placeholder("CASE STUDY TITLE")` gives `"[CASE STUDY TITLE]"`), and a script lists every placeholder still left. It can be switched on to fail production builds at cutover (§4.4). |
| Proof renders nothing when empty | Proof blocks take arrays and return `null` when the array is empty. Pricing and lead magnets follow the same rule: no fake numbers, no link to a missing PDF. |
| Never link to nothing | Internal links only accept a typed `RouteId` or a published case-study slug. A card without a destination renders without a link (§7.4). |
| SEO and AI search are first-class | One **route registry** feeds nav, metadata, breadcrumbs, JSON-LD, sitemap, `llms.txt` and internal links. Nothing about SEO is hand-maintained per page (§6). |
| Buyer journey ≠ talent journey | `/talent` lives in its own route group with its own layout. It is linked only from the footer and never appears in primary nav (§3.2). |
| CWV green | A budget is set before any component is built. Server Components by default; client JS only in named islands; Lighthouse CI checks it (§9). |

Accessibility target: **WCAG 2.2 AA**. It is a superset of the 2.1 AA in `CLAUDE.md`, so meeting it also meets 2.1. It adds target size, focus-not-obscured and accessible-authentication criteria, which matter for the contact form and mobile nav.

---

## 2. Stack and versions

The latest stable versions get pinned exactly at Phase 2 (project init) and checked then.

- **Next.js (App Router, current major), React 19, TypeScript strict.** Also `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Content arrays are often empty, and these flags catch the "assumed there's a first testimonial" class of bug.
- **Tailwind CSS v4.** CSS-first config. Design tokens live in `@theme` in one CSS file, so the tokens are the source of truth, not a JS config.
- **shadcn/ui.** Components are copied into the repo and owned by us, not imported from a package. That's what lets them be restyled to the design system without fighting a library.
- **Framer Motion** (the `motion` package), loaded only through `LazyMotion` + `domAnimation` with `m.*` components. That costs about 5 KB instead of about 34 KB (§9.3).
- **pnpm**, **Node LTS** pinned with `.nvmrc` and `engines`.
- **ESLint (flat config) + Prettier + Husky + lint-staged.** Pre-commit runs lint, format and typecheck on staged files.
- **Typed routes** (`typedRoutes: true`) so a broken internal `href` is a compile error.
- **Zod** to validate all content at build time.
- **schema-dts** to type-check JSON-LD against schema.org.

Testing is not listed in Phase 2. I propose adding it in Phase 5 (§10). **[FLAG]**

---

## 3. Routing

### 3.1 Route map and rendering strategy

Every route is statically generated (SSG). No route needs per-request rendering, and the content ships with the code, so a deploy is the publish step.

| Route | Rendering | Notes |
|---|---|---|
| `/` | SSG | Hub page. Links to every division and to featured case studies. |
| `/development`, `/ai`, `/qa`, `/academy` | SSG | One page per division with its own composition (§5.3). `Service` JSON-LD on each. |
| `/work` | SSG | Case-study index, grouped by division and rendered on the server. No client-side filtering, so crawlers see every link. |
| `/work/[slug]` | SSG | `generateStaticParams` comes from the published case studies. `dynamicParams = false`, so an unknown slug is a real 404, not a soft 404. |
| `/about`, `/careers` | SSG | `/about` carries the trust signals: company facts, registration date, team. |
| `/contact` | SSG page + Server Action | The page is static. Only the form submission runs on the server. The form's destination is open (§13). |
| `/talent` | SSG | Separate route group and layout (§3.2). |
| `/styleguide` | SSG, `noindex`, excluded from sitemap and robots | Phase 3 review surface. Disabled in production. |
| `sitemap.xml`, `robots.txt`, `llms.txt`, OG images | Generated at build | From the route registry and case-study data (§6). |

**Why not ISR?** ISR exists to refresh content that changes outside a deploy. Here content only changes through a deploy, so ISR would add cache behaviour with no benefit. If a CMS is adopted later (§4.3), tag-based ISR with on-demand revalidation can be added without changing any URL.

### 3.2 Route groups

```
app/
  (site)/            buyer-facing shell: primary nav + buyer CTA
    page.tsx         /
    development/  ai/  qa/  academy/
    work/  work/[slug]/
    about/  contact/  careers/
  (talent)/          supply-side shell: same brand, different header CTA, no buyer nav
    talent/
  (internal)/        styleguide; noindex; 404 in production
```

Route groups don't change URLs. They give `/talent` its own layout, so recruitment CTAs never show up in the buyer header, and buyer CTAs don't clutter the talent page. This is how "isolated from the buyer journey" gets enforced by structure rather than by remembering to.

### 3.3 URL taxonomy and keywords **[FLAG]**

The brief fixes the division slugs (`/ai`, `/development`, `/qa`, `/academy`). These are short and brand-like, which is good for memorability and weak for keyword targeting on their own.

The architecture lets topical depth be added later without changing any parent URL. A future `/ai/[service]` level, such as `/ai/rag-systems`, would slot under its division, inherit breadcrumbs, and be added to the registry and sitemap automatically. I am **not** building that level now: it isn't in the brief, and the keywords come from chat-side research. The registry entries have an empty `keywordTarget` field ready to receive them (§6.2).

---

## 4. Content model: where content lives

### 4.1 Options

| Option | For | Against, for a 3-founder team with no editor |
|---|---|---|
| **Headless CMS** (Sanity, Payload, Contentful) | Non-developers can edit; preview; scheduling | A second system to run, pay for, secure and model. Draft/preview plumbing adds real complexity. Content can break pages at runtime instead of at build. Nobody on the team is a dedicated editor, which is the CMS's main payoff. |
| **MDX for everything** | Good for long-form writing; version-controlled | Structured data (pricing tiers, offer stacks, FAQs) becomes freeform prose. You can't enforce "every offer has an outcome" or feed JSON-LD reliably from frontmatter sprawl. |
| **Typed TS constants** | Type-checked, refactor-safe, Zod-validated, feeds JSON-LD directly | Long-form narrative in TS strings is awkward to write. |

### 4.2 Recommendation: hybrid, repo-native

- **Structured content as typed TS modules** in `src/content/`: divisions, offers, pricing, FAQs, testimonials, team, nav labels, site config. Each one is validated by a Zod schema at build. A founder can edit these in the GitHub web editor. A mistake produces a build error that names the field ("`ai.pricing.tiers[1].price` is required"), not a broken page.
- **Case studies as MDX files** in `src/content/work/*.mdx`. Each file exports a typed `meta` object (validated by Zod) next to a long-form body. This uses `@next/mdx`, the official package, with no extra content-compilation layer, and slugs are read from the filesystem at build. Velite is a reasonable alternative if MDX needs grow (cross-file references, computed fields), but it's one more dependency we don't need yet.
- **One content-access layer** (`src/lib/content/`): pages call `getDivision("ai")`, `getPublishedCaseStudies({ division })` and never import content files directly. That is the seam where a CMS could be swapped in later.

### 4.3 Migrating to a CMS later

If you hire a content person later, only `src/lib/content/` changes. It would fetch from the CMS and validate against the same Zod schemas. Pages, components and the SEO layer stay untouched. Adopting a CMS later is cheap, so starting without one carries no lock-in.

### 4.4 Placeholders

- `placeholder("LABEL")` returns `"[LABEL]"` and is the only allowed way to write placeholder copy.
- `pnpm content:check` lists every remaining placeholder by file and field.
- With `ENFORCE_CONTENT=1` (set it in production at cutover), the build **fails** if any placeholder remains. Placeholder copy then cannot reach the live domain, even by accident.
- Proof, pricing and lead-magnet fields are **never** placeholders. They are either real or empty, and empty renders nothing.

---

## 5. Component layering

### 5.1 Layers

Imports go one way only: lower layers never import from higher ones. ESLint (`import/no-restricted-paths`) enforces it.

```
app/ (pages)            compose blocks + call the content layer; no styling, no raw HTML layout
  ↓
components/blocks/      page sections: Hero, OfferStack, Pricing, LeadMagnet, CaseStudyGrid,
                        Testimonials, LogoWall, Faq, CtaBand, ProcessSteps, StatRow…
  ↓
components/layout/      SiteHeader, SiteFooter, Breadcrumbs, SkipLink, PageShell
  ↓
components/primitives/  Container, Section, Stack, Grid, Heading, Text, Prose, SmartLink, Icon
  ↓
components/ui/          shadcn/ui (Button, Sheet, Accordion, Input, Label…), restyled to tokens
  ↓
styles/tokens.css       design tokens (@theme)
```

### 5.2 Server vs client

Everything is a Server Component by default. These are the only client islands, each kept small:

| Island | Why it must be client-side |
|---|---|
| Mobile nav (`Sheet`) | Open/close state, focus trap |
| `TrackedCta` / `TrackedLink` | Fires the analytics event on click. Wraps a server-rendered link, so the link works without JS. |
| Contact form | Inline validation and the confirmation state. Submits through a Server Action, with a no-JS fallback. |
| `Reveal` (motion) | Only for below-the-fold sections, never the LCP element (§9.3) |
| `Faq` accordion | Uses shadcn/Radix. All answer text is in the server HTML, so crawlers and AI parsers can read it. |

### 5.3 Divisions: shared blocks, distinct compositions

The brief says division pages are **not** copy-paste siblings. So there is **no** generic `DivisionTemplate`. Each `app/(site)/<division>/page.tsx` explicitly composes its own block order from the shared library. `/qa` can lead with a process diagram and `/academy` with a curriculum without hacks.

What they do share is a typed `Division` content shape. That keeps metadata, `Service` JSON-LD, breadcrumbs and analytics consistent:

```ts
Division {
  id: "development" | "ai" | "qa" | "academy"
  route: RouteId
  name: string
  seo: SeoFields                 // title, description, keywordTarget (null until supplied), ogImage
  serviceLines: ServiceLineId[]  // → Service JSON-LD (mapping is §13 Q1)
  hero: { heading; subheading; primaryCta: Cta }
  offers: Offer[]                // offer stack
  pricing: Pricing | null        // null → block not rendered
  leadMagnet: LeadMagnet | null  // null → block not rendered; asset must exist
  faqs: Faq[]                    // [] → block + FAQPage JSON-LD omitted
  testimonialIds: TestimonialId[]// [] → renders nothing
  relatedDivisions: DivisionId[] // internal cross-links (§7)
}
```

### 5.4 One H1 per page, correct heading order

React context doesn't work in Server Components, so automatic heading-level nesting isn't available. Enforcement is by **types plus a test**:

- `Heading` accepts only `level: 2 | 3 | 4`. Passing `1` is a type error.
- The `<h1>` comes **only** from `PageHero` / `PageHeader`, and every page renders exactly one.
- Blocks state their heading level in their props (`Section` takes `headingLevel`), defaulting to 2.
- A Playwright test (Phase 5) crawls every registry route. It fails if a page has anything other than one `h1` or skips a heading level.

### 5.5 Visual direction (owner input, feeds Phase 3)

**Direction from the owner:**
- **Light theme with generous white space**, carrying over the feel of the current nilltechsolutions.com.
- **Typography** inspired by Moringa School's course pages (the Certified Data Protection Officer course page was the reference).
- **Explicitly not** the dark-purple, gradient-heavy look that reads as AI-generated.

**What that means for the design system:**
- **Background:** white or near-white surfaces as the base. Dark sections are used sparingly, if at all. No purple-to-blue gradients, glows or glassmorphism.
- **Colour:** brand colours come from the current site's palette, extracted from its CSS, not guessed. Every text and background pair must meet WCAG AA contrast, and every token is checked for contrast in the styleguide.
- **White space as a token, not a habit:** a spacing scale with large section rhythm (e.g. 96–128 px vertical between sections on desktop, scaling down on mobile) and a constrained reading width (about 65–75 characters). Pages get their air from the tokens, not from ad-hoc margins.
- **Type:** the heading and body families are identified from the Moringa reference and self-hosted through `next/font`, capped at 2 font files (§9.1). If its fonts are commercial or licensed, I'll propose the closest open-licence match instead of copying a paid font.
- **Light mode only at launch.** A dark mode doubles the design-QA surface, and the brief doesn't ask for one. The token structure would allow it later.

**Status:** the exact fonts and colours are **pending**. This environment's network policy blocks `moringaschool.com` and `nilltechsolutions.com`, so I couldn't inspect either site (§13 Q3).

---

## 6. SEO and AI-search infrastructure

### 6.1 The route registry: one source of truth

`src/config/routes.ts` defines every indexable route once:

```ts
RouteEntry {
  id: RouteId; path: string; parent: RouteId | null   // → breadcrumbs, BreadcrumbList
  navLabel; linkLabel                                   // descriptive anchor text, never "Learn more"
  seo: SeoFields
  sitemap: { include: boolean; priority?: number }
  placement: { primaryNav?: boolean; footer?: "buyer" | "company" | "talent" }
  schema: "WebPage" | "Service" | "AboutPage" | "ContactPage" | "CollectionPage"
}
```

Everything else is derived from it:

| Output | Derived from |
|---|---|
| `generateMetadata` per page | `buildMetadata(routeId)`: title template `%s · NillTech Solutions`, description, absolute canonical, OpenGraph, Twitter card |
| Primary nav, footer | `placement` |
| Breadcrumbs + `BreadcrumbList` JSON-LD | the `parent` chain |
| `sitemap.ts` | entries with `sitemap.include` + published case studies |
| `robots.ts` | environment (§6.5) |
| `llms.txt` | registry + division summaries + case-study index |
| Internal-link checks | the registry graph (§7.3) |

### 6.2 Keyword scaffolding

`SeoFields.keywordTarget` is `{ primary: string; secondary: string[]; intent: "commercial" | "informational" | "navigational" } | null`. It stays `null` until your research arrives. When it's set, a Phase 5 test checks that the primary term appears in the `<title>` and the H1. Nothing guesses keywords.

### 6.3 Structured data, modelled as data

Typed builders in `src/lib/seo/schema/` produce JSON-LD from content objects. A single `<JsonLd data={…} />` server component renders it. No page hand-writes JSON-LD.

| Where | Schema | Source |
|---|---|---|
| Root layout | `Organization` + `WebSite` | `siteConfig`: legal name, URL, logo, email, `foundingDate` 2024-12-18, Nairobi address, `areaServed` (US, GB, CA, KE, UG, TZ, RW), `sameAs` social links |
| Division routes | `Service` (one per service line, `provider` → the Organization `@id`) | `Division.serviceLines` |
| `/work/[slug]` | `Article` (author and publisher = Organization, `about` = the `Service`) | case-study `meta` |
| Nested routes | `BreadcrumbList` | registry `parent` chain |
| Pages with a visible FAQ | `FAQPage` | the same `faqs` array the FAQ block renders, so markup always matches visible content |
| `/about`, `/contact` | `AboutPage`, `ContactPage` | registry `schema` |

Decisions in this table:

- **`Organization`, not `LocalBusiness`.** NillTech sells internationally and remotely. `LocalBusiness` implies a walk-in location, needs a full street address, and pushes toward local-pack intent that doesn't match a US/UK CTO buyer.
- **No `Review` / `AggregateRating` markup on our own testimonials.** Google treats self-serving reviews on an Organization as ineligible and can treat them as spam. Testimonials stay visible proof only.
- **No `telephone`** in the markup until a real number is supplied. Only email is known today.
- **FAQ rich results** are limited by Google to a few site types. `FAQPage` is still emitted where an FAQ is visible, because AI search engines parse it. Treat it as an AI-citation signal, not a rich-result bet.

### 6.4 OpenGraph images

`opengraph-image.tsx` files, using `next/og`, are generated **at build time** per division and per case study. They render the page title over a branded template with a locally bundled font. Every social share gets a specific card at zero runtime cost. Twitter cards reuse them.

### 6.5 Environment-aware indexing (important before cutover)

`NEXT_PUBLIC_SITE_URL` sets the canonical origin. Any environment that isn't production gets `robots.txt: Disallow: /` plus `<meta name="robots" content="noindex">`.

This matters because the live site keeps running on nilltechsolutions.com until cutover. An indexable staging build would compete with it as duplicate content and could leak placeholder copy into search results.

`robots.ts` in production explicitly allows search and AI-search crawlers: Googlebot, Bingbot, OAI-SearchBot, GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Applebot. That follows your default of allowing AI search unless told otherwise. It disallows `/styleguide` and `/api`.

### 6.6 Redirects and cutover **[FLAG]**

`src/config/redirects.ts` is a typed list consumed by `next.config` `redirects()`, all permanent 301s. Before cutover we need an inventory of the URLs on the live site (crawl plus Search Console export) so every ranked URL gets mapped. Otherwise the rebuild throws away the equity the current site has. This isn't a Phase 1–5 task. It's a cutover-checklist item, noted here so the structure exists from day one.

### 6.7 AI-search readiness, built into the components

- `PageHero` includes an `answer` slot: the direct 1–2 sentence answer to "what is this and who is it for". Content goes there first.
- `Section` supports question-style headings, and the FAQ, `StatRow` and comparison-table blocks render as semantic lists and tables, which are easy to quote.
- Entity facts (legal name, location, founding date, contact) come from `siteConfig` everywhere: footer, About, JSON-LD and `llms.txt`. They can never drift apart.
- Case-study `meta` and division content carry `updatedAt`. It is shown on the page as a "last updated" date and used as the sitemap `lastModified`. It is deliberately **not** the build time: a lastmod that changes on every deploy is noise and search engines learn to ignore it.

---

## 7. Internal linking (a ranking lever, so it's designed)

### 7.1 Model: hub → spokes → proof, with links flowing back up

```
                       /  (hub)
        ┌──────────┬───────┼────────┬──────────┐
  /development    /ai     /qa    /academy    /work
        │ ↔ related divisions ↔ │                │
        └──────→ /work/[slug] ←──────────────────┘
                 (proof, links back to its division(s))
```

### 7.2 Rules (enforced by components and data, not by habit)

1. **`/` → every division**, with descriptive anchors from `RouteEntry.linkLabel` (e.g. a label naming the service, never "Learn more"). It also links to featured case studies, but only if published ones exist.
2. **Division → its case studies.** `CaseStudyGrid` filters by `caseStudy.divisions`. This is the strongest topical link: proof attached to the offer it proves.
3. **Division ↔ related divisions** via `relatedDivisions`, for buyers who need more than one service. Spreads authority between the money pages.
4. **Case study → its division(s)** (contextual link + breadcrumb) **and → up to 2 related case studies** (same division or industry). Every case study links back up to a commercial page.
5. **`/work` → every published case study**, grouped by division, all in server-rendered HTML. No "load more" hidden behind JS.
6. **Footer** links every indexable route, as a crawl safety net. `/talent` and `/careers` sit only under a "Company" column.
7. **`/talent` gets no inbound links from buyer pages except the footer**, and doesn't push buyer CTAs.

### 7.3 Automated checks (Phase 5)

A test builds the link graph from the registry plus content. It fails on **orphans** (an indexable route with no inbound internal link), on **dead ends** (a division with no outbound link to proof or to a related division, once proof exists), and on any link to an unpublished case study.

### 7.4 "Never link to nothing", made structural

`SmartLink` accepts `href: RouteId | CaseStudySlug | ExternalUrl`. Case-study slugs are validated against **published** content at build. `Card` and `Cta` take an optional `href`. Without one they render as non-interactive elements, so nobody can write `href="#"` or point at a page that doesn't exist yet.

---

## 8. Case studies

```ts
CaseStudyMeta {
  slug: string                       // URL; immutable once published (changing it needs a redirect entry)
  status: "draft" | "published"      // drafts excluded from production builds, sitemap, links
  title; summary                     // summary = answer-first excerpt, also meta description fallback
  client: { name: string; logo?: Image } | { anonymised: true; descriptor: string }  // NDA-safe
  divisions: DivisionId[]            // ≥1, drives grids, related links, Article.about
  serviceLines: ServiceLineId[]
  industry; region                   // region uses the ICP list, for filtering and related links
  challenge; approach                // short structured fields; long form lives in the MDX body
  outcomes: { label: string; value: string }[]   // real results only; [] allowed, never placeholder
  testimonialId?: TestimonialId
  heroImage: { src; alt; width; height }         // alt required by schema
  publishedAt; updatedAt
  seo?: Partial<SeoFields>           // override; defaults derive from title/summary
}
```

- `client` is a union because client confidentiality is normal in delivery work. An anonymised case study ("Series B logistics platform, UK") is still real proof. A made-up client name is fake proof.
- With **no** published case studies, `/work` renders an honest, non-proof state (the owner supplies that copy), every `CaseStudyGrid` renders nothing, and `/work/[slug]` produces no pages. Nothing fake appears.

---

## 9. Performance: Core Web Vitals budget (set before building)

### 9.1 Targets

Measured on mobile with Lighthouse's Moto G Power / slow-4G profile:

| Metric | Must pass | Design target |
|---|---|---|
| LCP | ≤ 2.5 s | ≤ 1.8 s |
| CLS | ≤ 0.1 | ≤ 0.05 |
| INP | ≤ 200 ms | ≤ 100 ms |
| Lighthouse | Perf ≥ 90 · SEO 100 · A11y ≥ 95 · Best Practices ≥ 95 | — |
| Client JS added by a page | ≤ 25 KB gzip on top of the framework baseline | — |
| Web fonts | ≤ 2 files (one variable family, Latin subset) | — |

### 9.2 How the design meets them

- **LCP:** the hero's LCP element is the H1 text: server-rendered, no JS, font pre-loaded through `next/font`. If a hero image is used, it gets `priority` / `fetchPriority="high"` with correct `sizes`, and never animates in.
- **CLS:** `next/font` with fallback-metric adjustment, explicit `width`/`height` on every `next/image`, no content injected above existing content, and no banners pushing layout (a consent UI, if needed, overlays instead).
- **INP:** minimal hydration (§5.2), no heavy click handlers, and analytics calls deferred off the main interaction path (`requestIdleCallback` / `sendBeacon`).

### 9.3 Motion rules

- Only `transform` and `opacity` are animated, so animations run on the compositor and never trigger layout.
- `LazyMotion` + `domAnimation` + `m.*`, and the motion code is only loaded on routes that use it.
- Never animate the LCP element or anything above the fold on first paint.
- `prefers-reduced-motion` turns every animation into an instant state change.
- CSS transitions are preferred for hover and focus states, so Framer Motion only appears where it earns its weight.

### 9.4 Third parties

The analytics script loads with `next/script` `afterInteractive` (or `lazyOnload`). No chat widgets, no tag manager, and no embeds above the fold. Every new third party needs a budget justification in its PR.

### 9.5 Bundle-size delta in every PR

A CI job builds the PR and the base branch and posts the first-load JS difference per route (the HashiCorp `nextjs-bundle-analysis` approach). That meets the "every PR states bundle size delta" rule mechanically instead of by hand.

---

## 10. Analytics, errors, quality gates

### 10.1 Analytics (provider-agnostic)

- `src/lib/analytics/events.ts` holds a **typed union** of events, for example `cta_click { ctaId, location, route }`, `lead_magnet_download`, `contact_submit { status }`, `outbound_click`. An event that isn't in the union can't be fired.
- `track()` dispatches to an adapter picked by env: `noop` (default/tests), `console` (dev), `ga4`, `plausible`. Adding a provider is one file.
- Every `Cta` requires a `ctaId`, so no CTA can ship untracked.
- **[FLAG] Consent:** GA4 sets cookies. UK/EU visitors require consent (UK GDPR / PECR), and Kenya's Data Protection Act 2019 applies too. Plausible-style cookieless analytics may avoid a consent banner, and a banner is a CLS and conversion cost. This is your call (§13 Q4). The adapter design supports either option.

### 10.2 Error and empty states

`not-found.tsx` (a real 404 status, with links to the hub and divisions), `error.tsx` (route-level), `global-error.tsx` (root fallback for 500-class failures), and `loading.tsx` only where something is actually streamed. With SSG that's almost nowhere, and a needless loading state only adds flicker.

### 10.3 Quality gates (proposed for Phase 5)

- **Vitest:** content schemas, SEO builders, JSON-LD output snapshots.
- **Playwright + axe:** WCAG 2.2 AA checks on every registry route, the one-H1 and heading-order checks, the link-graph checks (§7.3), and a 404 status check.
- **Lighthouse CI:** asserts the §9.1 budgets on PR preview builds.
- **CI:** lint, typecheck, `content:check`, test, build, bundle diff.

---

## 11. Directory structure

```
.
├─ src/
│  ├─ app/
│  │  ├─ (site)/                 buyer shell (layout: SiteHeader buyer nav + SiteFooter)
│  │  │  ├─ page.tsx             /
│  │  │  ├─ development/ ai/ qa/ academy/   page.tsx + opengraph-image.tsx each
│  │  │  ├─ work/page.tsx
│  │  │  ├─ work/[slug]/page.tsx + opengraph-image.tsx
│  │  │  ├─ about/ contact/ careers/
│  │  │  └─ contact/actions.ts   Server Action
│  │  ├─ (talent)/talent/        isolated shell
│  │  ├─ (internal)/styleguide/  noindex, 404 in production
│  │  ├─ layout.tsx              <html>, fonts, Organization + WebSite JSON-LD, analytics provider
│  │  ├─ not-found.tsx  error.tsx  global-error.tsx
│  │  ├─ sitemap.ts  robots.ts  llms.txt/route.ts
│  │  └─ opengraph-image.tsx     default OG
│  ├─ components/
│  │  ├─ ui/                     shadcn/ui (owned)
│  │  ├─ primitives/             Container, Section, Heading, Text, Prose, SmartLink…
│  │  ├─ layout/                 SiteHeader, SiteFooter, Breadcrumbs, SkipLink
│  │  └─ blocks/                 Hero, OfferStack, Pricing, Testimonials, CaseStudyGrid, Faq, CtaBand…
│  ├─ content/
│  │  ├─ site.ts                 siteConfig (entity facts: one source)
│  │  ├─ divisions/{development,ai,qa,academy}.ts
│  │  ├─ testimonials.ts  team.ts  service-lines.ts
│  │  └─ work/*.mdx              case studies
│  ├─ config/
│  │  ├─ routes.ts               route registry (§6.1)
│  │  └─ redirects.ts            301 map (§6.6)
│  ├─ lib/
│  │  ├─ content/                access layer + Zod schemas (CMS seam, §4.3)
│  │  ├─ seo/                    buildMetadata, schema builders, JsonLd
│  │  ├─ analytics/              events union, track(), adapters
│  │  └─ env.ts                  validated env (Zod); fails fast on a missing SITE_URL
│  └─ styles/
│     ├─ globals.css
│     └─ tokens.css              @theme design tokens
├─ scripts/content-check.ts      placeholder report / enforcement
├─ tests/{unit,e2e}/
├─ public/                       static assets (favicons, brand marks)
└─ docs/
```

`src/` keeps app code apart from root config files. All imports use the `@/` alias.

---

## 12. Delivery plan (unchanged from the brief; approval after each phase)

1. **Architecture proposal**: this document. ⏸ awaiting approval
2. **Project init**: stack and tooling from §2, empty but runnable, no boilerplate cruft. Fills in the `CLAUDE.md` Commands section.
3. **Design system**: tokens, type scale, colour, spacing, elevation, motion primitives, restyled shadcn base, and the `/styleguide` review route.
4. **Route skeleton**: every route from §3.1 with placeholder content, shared layouts, nav and footer, accessible from the start.
5. **Foundation**: the SEO infrastructure from §6, analytics from §10.1, error states from §10.2, and the quality gates from §10.3.

Once this proposal is approved, its decisions are summarised into the `CLAUDE.md` Architecture section, so later sessions follow them.

---

## 13. Open questions

**Blocking a later phase** (each is marked with the phase it blocks; nothing blocks Phase 2):

1. **Mapping service lines to divisions** (blocks Phase 4 content and the `Service` JSON-LD). `CLAUDE.md` lists 6 service lines but the site has 4 division routes. My *guess*, for you to correct and not to be built until confirmed:
   - `/ai`: Managed AI Delivery; AI Training & Evaluation Ops; Data Annotation & Validation
   - `/development`: Managed Software Teams; Team Augmentation with Delivery Oversight; Delivery Rescue & Scale-Up
   - `/qa`: ? (Model evaluation could also belong here.)
   - `/academy`: ?
2. **What is `/academy`, and who is it for?** (blocks Phase 4 nav placement). Corporate training sold to the buyer (primary nav), or courses for individual learners (a supply-side audience, which should be isolated like `/talent`)? Putting a learner offer in the buyer nav would repeat the job-board-reading mistake.
3. **Brand assets** (blocks Phase 3). Direction is now set (§5.5): light theme, lots of white space, Moringa-inspired type, the current site's colours. Still needed: the logo file (SVG preferably), plus either network access to the two reference sites or the font names and brand hex codes directly.

**Not blocking; needed before launch:**

4. **Analytics provider and consent approach** (GA4 vs a cookieless option, §10.1).
5. **Hosting target.** The architecture runs on Vercel or any Node host and uses no host-specific features. Preview deploys and Lighthouse CI are easiest on Vercel.
6. **Where contact-form submissions go** (email via a transactional provider, a CRM such as HubSpot, or both). It's not in Phases 1–5, but launch needs it.
7. **Phone / WhatsApp number**, if you want click-to-call and WhatsApp CTAs (common for the East Africa segment). Neither is shown or marked up until real numbers are supplied.
8. **Placement of `/careers`.** I'll default to the footer "Company" column, not primary nav, to keep the buyer header focused.

---

## 14. Refactor and risk flags (raised, not acted on)

- `CLAUDE.md` says WCAG 2.1 AA. This proposal targets 2.2 AA (a superset). Worth updating `CLAUDE.md` to match, with your OK.
- `docs/MASTER_PROMPT.md` lists testing nowhere. §10.3 proposes adding it in Phase 5. Say if you'd rather it went in Phase 2.
- The brand-like division slugs are fine, but they put keyword-ranking weight on future child pages (§3.3). Worth revisiting once keyword research lands.
