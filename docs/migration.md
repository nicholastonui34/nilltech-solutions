# Domain move: nilltechsolutions.com to this site

Plan for pointing nilltechsolutions.com at this Vercel project (CLAUDE.md §3, §14, §18). The owner decided the domain moves last. Written 2026-10-30.

## What the old site is

The current nilltechsolutions.com is a separate Nuxt app (not in this repository). Besides its public pages it has a full freelance job-board app: client and freelancer registration, job posts and applications, chat, wallets, M-Pesa setup and an admin area. When the domain moves, **that whole app stops being reachable at nilltechsolutions.com**.

## Before the cutover (owner)

1. **Check the old app for live users and money.** Find out from whoever runs the old site whether anyone still uses it: open jobs, client or freelancer accounts, and especially **wallet balances**. Settle or export anything that matters (balances, contracts, contact lists) before switching. The new portal does not import old accounts.
2. **Tell active users**, if there are any, that the old app is closing and where to go instead: clients to `/contact` or `/book`, freelancers to `/careers/apply`.
3. **Note the old hosting and DNS.** Write down the current registrar, DNS provider and records (A, CNAME, MX, TXT). **Keep the MX and email TXT records (SPF, DKIM, DMARC) exactly as they are**, or info@nilltechsolutions.com email will stop working.
4. **Google Search Console.** If the old site is verified there, keep that property. If not, verify the domain now (DNS TXT method), so you can watch the move.

## Redirects (done, in this repository)

`next.config.ts` sends every old public URL to its new home with a 301. Tested locally on 2026-10-30:

| Old URL                                         | New URL                  |
| ----------------------------------------------- | ------------------------ |
| `/about-us`                                     | `/about`                 |
| `/contact-us`                                   | `/contact`               |
| `/frequently-asked-questions`                   | `/pricing` (FAQ section) |
| `/privacy-policy`                               | `/legal#privacy`         |
| `/terms`                                        | `/legal#terms`           |
| `/services/ai-training-evaluation`              | `/ai-data-services`      |
| `/services/data-annotation`                     | `/ai-data-services`      |
| `/services/managed-ai-delivery`                 | `/ai-solutions`          |
| `/services/managed-software-teams`              | `/managed-teams`         |
| `/services/team-augmentation`                   | `/managed-teams`         |
| `/services/delivery-rescue` (dropped offer)     | `/managed-teams`         |
| `/auth/register`                                | `/careers/apply`         |
| `/auth/*` (login, password reset)               | `/portal/login`          |
| `/admin/*`                                      | `/portal`                |
| `/client/*`                                     | `/portal/invoices`       |
| `/freelancer/browse-jobs`, `/freelancer/jobs/*` | `/careers`               |
| `/freelancer/*` (other)                         | `/portal/talent`         |

`/` and `/careers` keep the same address. The old site had no sitemap; these URLs come from its route table. If Search Console later shows other old URLs getting 404s, add them to `OLD_SITE_REDIRECTS`.

## Cutover (owner, about 30 minutes)

1. **Vercel → this project → Settings → Domains:** add `nilltechsolutions.com` and `www.nilltechsolutions.com`. Set **www to redirect to nilltechsolutions.com** (the site's canonical address has no www).
2. **At the DNS provider,** change only the records Vercel asks for (usually an A record for the apex and a CNAME for www). Leave MX and email TXT records alone.
3. Wait for Vercel to show both domains as valid and the certificate as issued (usually minutes, up to a few hours).
4. **Check:** open `https://nilltechsolutions.com`, `https://www.nilltechsolutions.com` (should land on the apex), and a few old URLs from the table above. Send a test email to info@nilltechsolutions.com.

## After the cutover

1. **Search Console:** submit `https://nilltechsolutions.com/sitemap.xml` and watch the Pages and Crawl reports for 404s over the next weeks.
2. **IndexNow** starts working on its own: the workflow skipped while the domain pointed elsewhere.
3. **Share previews** (Open Graph image) and canonical URLs, which already point at nilltechsolutions.com, now resolve correctly.
4. Keep the old hosting for a week or two in case something needs recovering, then cancel it.

## Rollback

If something breaks, point the DNS records back to the old host's values (noted in step 3 above). The new site keeps running at nilltech-solutions.vercel.app either way.
