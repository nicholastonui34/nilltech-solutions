import { CtaBand } from "@/components/sections/cta-band";
import { Container } from "@/components/sections/container";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { OfferIntro } from "@/components/sections/offer-intro";
import { ProcessSteps } from "@/components/sections/process-steps";
import { ServiceCard } from "@/components/sections/service-card";
import type { CtaIntent } from "@/config/cta";
import type { LucideIcon } from "lucide-react";

type Deliverable = { icon: LucideIcon; title: string; description: string; href: string };
type Step = { title: string; description: string };
type FaqItem = { question: string; answer: string };

export type OfferPageData = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: CtaIntent;
  summary: string;
  audience: string[];
  startingFrom: string;
  deliverables: Deliverable[];
  process: Step[];
  faq: FaqItem[];
  ctaHeading: string;
  ctaBody: string;
};

/**
 * Standard offer-page composition (CLAUDE.md §4): answer-first intro, who
 * it's for, deliverables, process, starting price, FAQ, proof, one CTA
 * repeated hero/mid/end. Used by /services, /ai-solutions, /managed-teams,
 * /academy — each supplies its own data, so pages differ in content while
 * sharing structure, not copy-pasted siblings.
 */
export function OfferPageContent({ data }: { data: OfferPageData }) {
  return (
    <>
      <Hero
        eyebrow={data.eyebrow}
        headline={data.headline}
        subheadline={data.subheadline}
        primaryCta={data.primaryCta}
        secondaryCta="whatsapp"
      />

      <OfferIntro
        summary={data.summary}
        audience={data.audience}
        startingFrom={data.startingFrom}
      />

      <section className="py-4">
        <Container>
          <h2 className="mb-10 text-2xl font-semibold">What&rsquo;s included</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.deliverables.map((d) => (
              <ServiceCard
                key={d.title}
                icon={d.icon}
                title={d.title}
                description={d.description}
                href={d.href}
              />
            ))}
          </div>
        </Container>
      </section>

      <div className="mt-20">
        <ProcessSteps steps={data.process} />
      </div>

      {/* Proof layer intentionally omitted — renders nothing until real
          testimonials/case studies exist (CLAUDE.md §2). */}

      <Faq items={data.faq} />

      <CtaBand heading={data.ctaHeading} body={data.ctaBody} cta={data.primaryCta} />
    </>
  );
}
