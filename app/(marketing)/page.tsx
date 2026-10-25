import type { Metadata } from "next";

import { CtaBand } from "@/components/sections/cta-band";
import { Container } from "@/components/sections/container";
import { Hero } from "@/components/sections/hero";
import { ServiceCard } from "@/components/sections/service-card";
import { offers } from "@/config/offers";
import { siteConfig } from "@/config/site.config";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Hero
        eyebrow="Managed Tech Delivery in Nairobi, Kenya"
        headline={siteConfig.tagline}
        subheadline="{{PLACEHOLDER: one-sentence summary of the company's core promise for a buyer who lands here cold.}}"
        primaryCta="quote"
        secondaryCta="whatsapp"
      />

      <section className="py-20">
        <Container>
          <h2 className="mb-10 text-2xl font-semibold">What we deliver</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <ServiceCard
                key={offer.slug}
                icon={offer.icon}
                title={offer.title}
                description={offer.shortDescription}
                href={offer.href}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* Proof layer (testimonials, logo wall, case studies) intentionally omitted —
          CLAUDE.md §2: renders nothing when empty, never fake placeholder proof. */}

      <CtaBand
        heading="{{PLACEHOLDER: closing CTA heading}}"
        body="{{PLACEHOLDER: one sentence reinforcing why to act now.}}"
        cta="discovery-call"
      />
    </>
  );
}
