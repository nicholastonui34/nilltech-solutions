import type { Metadata } from "next";

import { Container } from "@/components/sections/container";
import { EmptyState } from "@/components/sections/empty-state";
import { caseStudies } from "@/lib/content/case-studies";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Case Studies",
  description:
    "Case studies from NillTech Solutions: software, AI and managed team projects delivered for clients in Kenya, East Africa and internationally.",
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
