/**
 * Real open roles, supplied by the owner on 2026-10-25 (the "Founding team"
 * posters also shared on LinkedIn). Copy is taken verbatim from the
 * posters. Remove a role from this list when it closes — the page, its
 * JobPosting schema and its sitemap entry all disappear with it
 * (CLAUDE.md §13: JobPosting only for real, open roles).
 */
export type Job = {
  slug: string;
  title: string;
  /** "Founding team · 01" label from the poster. */
  sequence: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  /** YYYY-MM-DD — the date the role was listed on this site. */
  datePosted: string;
};

export const jobs: Job[] = [
  {
    slug: "finance-lead",
    title: "Finance Lead",
    sequence: "01",
    summary:
      "Build NillTech's financial foundations. Own budgeting, reporting and cash management as we grow.",
    responsibilities: [
      "Budgeting and financial planning",
      "Monthly reporting and visibility",
      "Cash flow and payment tracking",
      "Financial systems and processes",
    ],
    requirements: [
      "Experienced in finance or accounting",
      "Builds structure where none exists",
      "Detail-driven and honest with numbers",
      "Excited by early-stage work",
    ],
    datePosted: "2026-10-25",
  },
  {
    slug: "marketing-lead",
    title: "Marketing Lead",
    sequence: "02",
    summary:
      "Shape how NillTech is seen and found. Own our brand, outreach and digital marketing from day one.",
    responsibilities: [
      "Brand positioning and messaging",
      "Social, search and email marketing",
      "Outreach campaigns that bring in leads",
      "Content that shows our work",
    ],
    requirements: [
      "Proven brand or digital marketer",
      "Strong writer with an eye for design",
      "Data-minded: tracks what works",
      "Self-starter who builds from scratch",
    ],
    datePosted: "2026-10-25",
  },
  {
    slug: "sales-lead",
    title: "Sales Lead",
    sequence: "03",
    summary:
      "Win paying clients and turn them into long-term, recurring relationships. Build our sales function from day one.",
    responsibilities: [
      "Building and managing the sales pipeline",
      "Discovery calls and closing deals",
      "Growing accounts into repeat business",
      "Shaping our sales process and playbook",
    ],
    requirements: [
      "Track record closing B2B deals",
      "Communicator who builds trust fast",
      "Persistent, organised, target-driven",
      "Ready to build, not just join",
    ],
    datePosted: "2026-10-25",
  },
];

export function getJobBySlug(slug: string): Job | undefined {
  return jobs.find((job) => job.slug === slug);
}

/** Applications are by email, as on the posters: CV plus a short note. */
export function jobApplicationHref(job: Job, email: string) {
  return `mailto:${email}?subject=${encodeURIComponent(`Application: ${job.title}`)}`;
}
