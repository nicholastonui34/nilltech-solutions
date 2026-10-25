import type { Metadata } from "next";

import { CtaBand } from "@/components/sections/cta-band";
import { Container } from "@/components/sections/container";
import { Faq } from "@/components/sections/faq";
import { PricingTiers } from "@/components/sections/pricing-tiers";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Pricing",
  description: "{{PLACEHOLDER: meta description for /pricing, 150-160 characters}}",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <section className="py-20">
        <Container>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h1 className="text-4xl font-semibold">Pricing</h1>
            <p className="text-muted-foreground mt-4">
              Every price below is a starting point. Use the estimator for a range based
              on your project, then we confirm a fixed quote after a short discovery call.
            </p>
          </div>
          <PricingTiers />
          <p className="text-muted-foreground mt-10 text-center text-xs">
            Estimates are indicative. Final quote after a discovery call.{" "}
            {"{{PLACEHOLDER: guarantee statement}}"}
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
        cta="quote"
      />
    </>
  );
}
