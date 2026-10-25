import type { Metadata } from "next";

import { Container } from "@/components/sections/container";
import { TalentApplicationForm } from "@/components/sections/talent-application-form";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Apply to join our delivery teams",
  description:
    "Apply to join NillTech's managed delivery teams. Engineers, designers and specialists from Kenya, Uganda, Tanzania and Rwanda, screened by our team.",
  path: "/careers/apply",
});

// Freelancer onboarding entry point (CLAUDE.md §9, §13). Every application
// is screened by NillTech's recruitment team; there's no self-serve
// marketplace listing — positioning in §1.
export default function CareersApplyPage() {
  return (
    <section className="py-20">
      <Container className="max-w-2xl">
        <h1 className="text-4xl font-semibold">Apply to join our delivery teams</h1>
        <p className="text-muted-foreground mt-4">
          At NillTech you work on real client projects inside a managed team, with code
          review, clear scope and one person accountable for delivery. We match approved
          applicants to projects that fit their skills, whether full-time or freelance.
        </p>
        <ol className="text-muted-foreground mt-6 list-decimal space-y-1 pl-5 text-sm">
          <li>Send your application below.</li>
          <li>Our recruitment team screens it.</li>
          <li>Shortlisted applicants receive a short test task.</li>
          <li>Approved applicants join our talent pool and are matched to projects.</li>
        </ol>
        <div className="mt-10">
          <TalentApplicationForm />
        </div>
      </Container>
    </section>
  );
}
