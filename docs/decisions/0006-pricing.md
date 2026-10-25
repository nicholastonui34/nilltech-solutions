# ADR 0006 — Starting prices: "agency quality at a freelancer price"

- **Status:** Proposed by Claude from market research. Takes effect when the owner merges.
- **Date:** 2026-10-25

## Context

The owner asked for real prices, researched online, positioned as
**"agency quality product at a freelancer price."** CLAUDE.md §2 forbids
inventing prices. Here the owner explicitly asked for market-based numbers
and approves them by merging. Every number below lives in
`config/pricing-rules.ts`, the pricing page, and the three offer pages.

**Research method:** web search, 2026-10-25. The sources are mostly Kenyan
agency and vendor blogs, which have a commercial interest and often
disagree 2–3x, so these are market _bands_, not quotes.

## Market bands found (Kenya, 2026)

| Service                          | Freelancers                                                                                                                                                                                                                   | Agencies                                                                                                                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Business website                 | KES 15k–80k ([Codestream](https://codestream.co.ke/website-design-prices-in-kenya-how-much-does-it-cost-to-get-a-website-designed-in-kenya/), [Webpinn](https://webpinn.com/state-of-web-development-kenya-2026/))            | Templated KES 100k–300k; custom KES 450k–1.2M ([TheNodeNest](https://www.thenodenest.com/website-cost-kenya)); bespoke small sites KES 400k–500k vs freelancers KES 50k–125k ([NextConsulting](https://nextconsulting.co.ke/website-cost-kenya/))                   |
| E-commerce + M-Pesa              | KES 10k–80k, template ([Webpinn](https://webpinn.com/state-of-web-development-kenya-2026/))                                                                                                                                   | Small agencies KES 40k–300k; most SME stores KES 150k–400k ([Mocky](https://mocky.co.ke/blog/e-commerce-developers-in-nairobi-how-to-choose-what-to-pay-and-questions-to-ask-in-2026)); M-Pesa integration alone +KES 10k–50k                                       |
| Business systems / ERP           | —                                                                                                                                                                                                                             | ERPNext implementations from KES 260k; realistic SME range KES 300k–600k ([ITKenya](https://itkenya.com/erp-software-cost-kenya-2026/))                                                                                                                             |
| AI chatbot / WhatsApp automation | Basic bots KES 10k–60k setup + KES 2k–15k/month ([Pulse Digital](https://pulse-digital.agency/blog/complete-guide-to-business-automation-in-kenya), [KenZobe](https://www.kenzobe.com/blog/ai-chatbot-kenya))                 | Business-grade with M-Pesa KES 150k–300k ([Quest Designers](https://www.questdesigners.com/services/ai-solutions)); packaged tiers KES 50k / 100k / 200k+ ([SmartBiz](https://www.smartbizsystems.co.ke/seo-pages/whatsapp-automation))                             |
| Dedicated developer              | Employer cost of a senior Nairobi engineer ≈ USD 1,900/month ([Career Buddy](https://blog.thecareerbuddy.com/article/software-engineer-salary-kenya))                                                                         | Vendor rates USD 20–38/hour ≈ USD 3,200–6,100/month ([Qubit Labs](https://qubit-labs.com/average-hourly-rates-offshore-development-services-software-development-costs-guide/), [Tateeda](https://tateeda.com/blog/offshore-software-development-rates-by-country)) |
| International comparison         | US freelancers USD 1,500–7,000 for a small-business site; agencies USD 5k–25k+ ([WPZoom](https://www.wpzoom.com/blog/business-website-cost/), [Dribbble](https://content-hub.dribbble.com/tips/web-development-agency-costs)) |                                                                                                                                                                                                                                                                     |

## Decision

- **Positioning in numbers:** price at the **top of the freelancer band and
  well below agencies**. That's roughly 40–60% of a typical small-agency
  quote and about 1.5–2× a template freelancer. Clients pay a little more
  than a freelancer for team continuity, QA (the Phase 6 checklist) and
  accountability.

| NillTech                                            | Range (KES)                          | Timeline           |
| --------------------------------------------------- | ------------------------------------ | ------------------ |
| Business website                                    | 45,000–90,000                        | 2–4 weeks          |
| Online store (M-Pesa/card checkout included)        | 95,000–180,000                       | 4–8 weeks          |
| Business system (school, ERP-style, internal tools) | 180,000–400,000                      | 6–12 weeks         |
| Custom software / web app                           | 250,000–600,000                      | 8–16 weeks         |
| AI assistant / automation                           | from 40,000 setup + from 5,000/month | 1–3 weeks          |
| Dedicated developer                                 | from 180,000 per developer-month     | 2–4 weeks to start |

**Add-ons (KES):** user accounts 15k · payments 20k · multi-language 15k ·
admin dashboard 35k · CRM integration 25k · payment gateway 20k · SMS/email
provider 12k · ERP/accounting integration 45k. Payments and payment gateway
are already included for online stores, so they're never charged twice.

**Existing multipliers, unchanged:** rush ×1.25 (and timeline ×0.75);
3–6 months ×0.95; exploratory ×0.9.

**International (US/UK/Canada): ×1.5, shown in USD.** For example, a website
from USD 500, a store from USD 1,100, and a developer at USD 1,800/month.
That's still about a third of a typical US freelancer quote and 40–70%
below offshore vendor rates. The USD conversion uses a display-only
`USD_KES_RATE = 130`, last reviewed 2026-10-25.

## Consequences

- **The estimator now shows an indicative range on screen.** The old copy
  promised an email that couldn't be sent while Resend is deferred. The
  range is also saved on the lead (`estimateKes`, `estimateWeeks`) so Sales
  sees what the visitor saw.
- **Free bug fixes after launch** are included with every project (owner,
  2026-10-25: "bug fixes only"). New features and changes are quoted
  separately. The AI tier's monthly fee covers running costs (hosting,
  WhatsApp and AI usage), not support.
- **Review prices at least every 6 months,** or whenever the shilling moves
  materially (`USD_KES_RATE`).
- **Positioning copy:** "agency quality at a freelancer price" works as a
  pricing principle. As site copy, it would cut against CLAUDE.md §1 ("Not
  a freelancer marketplace. Not an agency."). Prefer wording like
  "agency-grade delivery, priced for East African businesses". The owner
  decides.
