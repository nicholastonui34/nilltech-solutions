import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/sections/container";
import { EmptyState } from "@/components/sections/empty-state";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Careers",
  description: "{{PLACEHOLDER: meta description for /careers, 150-160 characters}}",
  path: "/careers",
});

// Deliberately low prominence (footer-only, not primary nav) per CLAUDE.md
// §13. "Join as a freelancer" routes into the onboarding flow (§9).
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
            {"{{PLACEHOLDER: one sentence on the freelancer talent pool}}"} We hire within
            East Africa, and every application is reviewed by our recruitment team.
          </p>
          <Button asChild className="mt-4">
            <Link href="/careers/apply">Apply to join our delivery teams</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
