import type { Metadata } from "next";

import { CtaBand } from "@/components/sections/cta-band";
import { Container } from "@/components/sections/container";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Partnerships",
  description: "{{PLACEHOLDER: meta description for /partnerships, 150-160 characters}}",
  path: "/partnerships",
});

export default function PartnershipsPage() {
  return (
    <>
      <Hero
        eyebrow="Partnerships"
        headline="{{PLACEHOLDER: /partnerships hero headline}}"
        subheadline="{{PLACEHOLDER: /partnerships hero subheadline}}"
        primaryCta="contact-sales"
      />
      <section className="py-16">
        <Container className="max-w-3xl">
          <p className="text-lg leading-relaxed">
            {
              "{{PLACEHOLDER: answer-first summary of the partnerships offer for agencies/enterprises, 2 to 3 sentences}}"
            }
          </p>
        </Container>
      </section>
      <Faq
        items={[
          {
            question: "{{PLACEHOLDER: FAQ question 1}}",
            answer: "{{PLACEHOLDER: FAQ answer 1}}",
          },
          {
            question: "{{PLACEHOLDER: FAQ question 2}}",
            answer: "{{PLACEHOLDER: FAQ answer 2}}",
          },
        ]}
      />
      <CtaBand
        heading="{{PLACEHOLDER: closing CTA heading}}"
        body="{{PLACEHOLDER: closing CTA body}}"
        cta="contact-sales"
      />
    </>
  );
}
