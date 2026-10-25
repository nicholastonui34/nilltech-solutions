import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/sections/container";
import { EmptyState } from "@/components/sections/empty-state";
import { Button } from "@/components/ui/button";
import { jobs } from "@/lib/content/jobs";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Careers",
  description:
    "Careers at NillTech Solutions in Nairobi: open roles and how to join our managed software and AI delivery teams as an engineer from East Africa.",
  path: "/careers",
});

// Deliberately low prominence (footer-only, not primary nav) per CLAUDE.md
// §13. Open roles come from lib/content/jobs.ts; "Join as a freelancer"
// routes into the onboarding flow (§9).
export default function CareersPage() {
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl font-semibold">Careers</h1>

        <div className="mt-10">
          <h2 className="text-lg font-semibold">Open roles</h2>
          {jobs.length ? (
            <>
              <p className="text-muted-foreground mt-2 text-sm">
                We&rsquo;re hiring our founding team in Nairobi, Kenya.
              </p>
              <ul className="mt-4 grid gap-4">
                {jobs.map((job) => (
                  <li key={job.slug}>
                    <Link
                      href={`/careers/${job.slug}`}
                      className="border-border bg-card hover:border-primary group block rounded-xl border p-5 transition-colors"
                    >
                      <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                        Founding team · {job.sequence}
                      </p>
                      <h3 className="mt-1 flex items-center justify-between gap-2 text-lg font-semibold">
                        {job.title}
                        <ArrowRight className="text-muted-foreground group-hover:text-primary size-5 shrink-0 transition-colors" />
                      </h3>
                      <p className="text-muted-foreground mt-1 text-sm">{job.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="mt-4">
              <EmptyState message="No open roles right now. Check back soon." />
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold">Join as a freelancer</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Our talent pool supplies the engineers, designers and specialists behind every
            client team. We hire within East Africa, and every application is reviewed by
            our recruitment team.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/careers/apply">Apply to join our delivery teams</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
