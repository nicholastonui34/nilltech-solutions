export type CaseStudy = {
  slug: string;
  title: string;
  summary: string;
  client: string;
};

/**
 * No real case studies exist yet. CLAUDE.md §2: proof-layer components
 * render nothing when empty — never fake placeholder proof. Populate this
 * once the owner supplies real work to publish.
 */
export const caseStudies: CaseStudy[] = [];

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug);
}
