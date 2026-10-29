# Content placeholders and owner inputs

Required by CLAUDE.md §2: every `{{PLACEHOLDER}}` on the site is logged here.
As of 2026-10-25 the public site has **no visible placeholders**. The site
copy was written from known facts only (offers, published prices,
timelines, process, terms). Sections that need real content the team
hasn't supplied yet render nothing instead of fake proof.

## Hidden until real content exists

| Where                         | What's needed                                                                                               | File                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `/about` founder bios, photos | Short bio and a photo for Nicholas Tonui, Wendy Achieng and Fumbwe Hamisi (initials badge shows until then) | `app/(marketing)/about/page.tsx` (`founders` array) |
| `/work` case studies          | Real client projects with permission to publish                                                             | `lib/content/case-studies.ts`                       |
| Testimonials, logo wall       | Real quotes and logos with permission                                                                       | not built yet                                       |
| `/podcast` episodes, Shorts   | YouTube channel URL and episode list                                                                        | `lib/content/podcast-episodes.ts`                   |
| `/academy` free courses       | Course list, lessons, optional videos                                                                       | `lib/content/courses.ts`                            |
| `/blog` posts                 | Real posts                                                                                                  | `lib/content/blog-posts.ts`                         |

## Photos to replace brand graphics (owner, 2026-10-29)

**Stock photos in use (2026-10-29, supplied by the owner from free stock libraries):** `public/photos/managed-teams.jpg`, `academy.jpg` and `partnerships.jpg`, cropped to 5:3 at 1200x720. They are generic illustrations, not NillTech's people or clients; replace them with real photos when available. Owner to confirm each came from a free licence (Pexels or Unsplash free, not Unsplash+). An Unsplash+ image was rejected because Unsplash+ is a paid licence. Software Development and AI Solutions still use brand illustrations.

The five home-page offer cards show brand illustrations (`public/art/*.svg`) until real photos exist. To swap one in, put the photo in `public/photos/` (landscape, roughly 5:3, at least 1200 px wide) and set `photo: { src, alt }` on that offer in `config/offers.ts`. The "What's included" cards on the offer pages take an optional `photo` the same way (each page's `deliverables`).

| Card                            | Suggested shot                                           |
| ------------------------------- | -------------------------------------------------------- |
| AI-Powered Software Development | The team building or reviewing a website or app          |
| AI Solutions for SMEs           | A WhatsApp or website assistant in use, or a demo        |
| Managed Tech Delivery Teams     | The team at work, a stand-up or planning session         |
| NillTech Academy                | A training session or a learner working through a course |
| Partnerships                    | A meeting with a partner (with their permission)         |

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
