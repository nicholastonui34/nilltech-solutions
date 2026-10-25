# Content placeholders and owner inputs

Required by CLAUDE.md §2: every `{{PLACEHOLDER}}` on the site is logged here.
As of 2026-10-25 the public site has **no visible placeholders**. The site
copy was written from known facts only (offers, published prices,
timelines, process, terms). Sections that need real content the team
hasn't supplied yet render nothing instead of fake proof.

## Hidden until real content exists

| Where                       | What's needed                                                  | File                                                |
| --------------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| `/about` Founders           | Names, roles and a short bio for each founder (photo optional) | `app/(marketing)/about/page.tsx` (`founders` array) |
| `/work` case studies        | Real client projects with permission to publish                | `lib/content/case-studies.ts`                       |
| Testimonials, logo wall     | Real quotes and logos with permission                          | not built yet                                       |
| `/podcast` episodes, Shorts | YouTube channel URL and episode list                           | `lib/content/podcast-episodes.ts`                   |
| `/academy` free courses     | Course list, lessons, optional videos                          | `lib/content/courses.ts`                            |
| `/blog` posts               | Real posts                                                     | `lib/content/blog-posts.ts`                         |

## Statements written as policy: owner to confirm

These describe how NillTech works. They aren't stats or claims about
clients, but they are commitments, so confirm or change them:

- `/contact`: "We reply to every enquiry, usually within one working day."
- `/managed-teams`: clients can meet matched engineers before they start; regular progress updates; teams can scale up or down "without long notice periods".
- `/partnerships`: white-label delivery under the partner's brand; willingness to sign a partner's NDA; fixed-price or monthly-rate commercial models.
- `/academy`: paid courses and company team training are described as "coming soon" / on request.
- `/ai-solutions`: assistants hand over to a person when unsure.

## Comment-only markers (not visible)

`{{INPUT NEEDED}}` notes in code comments: eTIMS integration route
(`lib/etims/provider.ts`), podcast episodes (`lib/content/podcast-episodes.ts`),
course list (`lib/content/courses.ts`).
