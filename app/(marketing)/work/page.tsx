import type { Metadata } from "next";

import { Container } from "@/components/sections/container";
import { EmptyState } from "@/components/sections/empty-state";
import { caseStudies } from "@/lib/content/case-studies";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Case Studies",
  description: "{{PLACEHOLDER: meta description for /work, 150-160 characters}}",
  path: "/work",
});

export default function WorkPage() {
  return (
    <section className="py-20">
      <Container>
        <h1 className="mb-10 text-4xl font-semibold">Case Studies</h1>
        {caseStudies.length === 0 ? (
          <EmptyState message="No case studies published yet. Check back soon." />
        ) : null}
      </Container>
    </section>
  );
}
