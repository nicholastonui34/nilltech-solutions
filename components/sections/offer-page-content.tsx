import { CtaBand } from "@/components/sections/cta-band";
import { Container } from "@/components/sections/container";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { OfferIntro } from "@/components/sections/offer-intro";
import { ProcessSteps } from "@/components/sections/process-steps";
import {
  accentAt,
  ServiceCard,
  type CardPhoto,
} from "@/components/sections/service-card";
import type { CtaIntent } from "@/config/cta";

// `photo` is optional: cards show text only until a real photo exists.
type Deliverable = {
  title: string;
  description: string;
  href: string;
  photo?: CardPhoto;
};
// Link text follows where the card goes (CLAUDE.md §5: no generic "Learn more").
function deliverableLinkLabel(href: string) {
  if (href.startsWith("/estimate")) return "Get an estimate";
  if (href.startsWith("/academy")) return "Browse free courses";
  return "Talk to us";
}

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
  priceLabel?: string;
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
        priceLabel={data.priceLabel}
      />

      <section className="py-4">
        <Container>
          <h2 className="mb-10 text-2xl font-semibold">What&rsquo;s included</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.deliverables.map((d, i) => (
              <ServiceCard
                key={d.title}
                photo={d.photo}
                accent={accentAt(i)}
                title={d.title}
                description={d.description}
                href={d.href}
                linkLabel={deliverableLinkLabel(d.href)}
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
