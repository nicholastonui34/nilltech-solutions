import type { Metadata } from "next";

import { Container } from "@/components/sections/container";
import { EmptyState } from "@/components/sections/empty-state";
import { siteConfig } from "@/config/site.config";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Careers",
  description: "{{PLACEHOLDER: meta description for /careers, 150-160 characters}}",
  path: "/careers",
});

// Deliberately low prominence (footer-only, not primary nav) per CLAUDE.md
// §13. The freelancer onboarding flow (§9) is Phase 6 — until it exists,
// "Join as Freelancer" points at a real, working email rather than a flow
// that isn't built yet.
export default function CareersPage() {
  return (
    <section className="py-20">
      <Container className="max-w-2xl">
        <h1 className="text-4xl font-semibold">Careers</h1>

        <div className="mt-10">
          <h2 className="text-lg font-semibold">Open roles</h2>
          <div className="mt-4">
            <EmptyState message="No open roles right now — check back soon." />
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold">Join as a freelancer</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {"{{PLACEHOLDER: one sentence on the freelancer talent pool}}"} Our full
            application flow is coming soon — in the meantime, email{" "}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="text-primary hover:underline"
            >
              {siteConfig.contact.email}
            </a>
            .
          </p>
        </div>
      </Container>
    </section>
  );
}
