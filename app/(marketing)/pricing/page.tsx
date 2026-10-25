import type { Metadata } from "next";

import { CtaBand } from "@/components/sections/cta-band";
import { Container } from "@/components/sections/container";
import { Faq } from "@/components/sections/faq";
import { PricingTiers } from "@/components/sections/pricing-tiers";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Pricing",
  description:
    "NillTech pricing: websites from KES 45,000, AI solutions from KES 40,000 and developers from KES 180,000 a month. USD pricing for international clients.",
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
            Every project includes free bug fixes after launch. Estimates are indicative,
            with a final quote after a discovery call.
          </p>
        </Container>
      </section>

      <Faq
        items={[
          {
            question: "Why is the USD price different from the KES price?",
            answer:
              "KES prices are for clients in East Africa. USD prices are for clients in the US, UK and Canada and reflect international project requirements, so they aren't a straight currency conversion.",
          },
          {
            question: "How do payments work?",
            answer:
              "Each proposal sets out a payment schedule. You can pay by M-Pesa Paybill or bank transfer, in KES or USD, and every payment gets a receipt.",
          },
          {
            question: "What's included in the price?",
            answer:
              "Design, build, testing, launch and free bug fixes for the period in your proposal. Hosting, domains and other third-party services are billed at cost, and new features after launch are quoted separately.",
          },
          {
            question: "Is the estimate my final price?",
            answer:
              "No. The estimator gives an indicative range. After a short discovery call we confirm a fixed quote in writing before any work starts.",
          },
        ]}
      />

      <CtaBand
        heading="Get a range for your project."
        body="The estimator takes about two minutes and shows an indicative price and timeline on screen."
        cta="quote"
      />
    </>
  );
}
