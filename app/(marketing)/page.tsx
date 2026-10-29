import type { Metadata } from "next";

import { CtaBand } from "@/components/sections/cta-band";
import { Container } from "@/components/sections/container";
import { Hero } from "@/components/sections/hero";
import { accentAt, ServiceCard } from "@/components/sections/service-card";
import { offers } from "@/config/offers";
import { siteConfig } from "@/config/site.config";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Software Development and AI Company in Kenya",
  description:
    "NillTech builds websites, custom software and AI solutions, and runs managed delivery teams, for businesses in Kenya, East Africa, the US, UK and Canada.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Hero
        eyebrow="Managed Tech Delivery in Nairobi, Kenya"
        headline={siteConfig.tagline}
        subheadline="NillTech builds software and AI for businesses in Kenya, East Africa and beyond, with one accountable team that designs, builds, tests and supports it, so you get the result without managing the work."
        primaryCta="quote"
        secondaryCta="discovery-call"
      />

      <section className="py-20">
        <Container>
          <h2 className="mb-10 text-2xl font-semibold">What we deliver</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer, i) => (
              <ServiceCard
                key={offer.slug}
                art={offer.art}
                photo={offer.photo}
                accent={accentAt(i)}
                title={offer.title}
                description={offer.shortDescription}
                href={offer.href}
                linkLabel={offer.cardLinkLabel}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* Proof layer (testimonials, logo wall, case studies) intentionally omitted —
          CLAUDE.md §2: renders nothing when empty, never fake placeholder proof. */}

      <CtaBand
        heading="Have a project in mind? Let's talk it through."
        body="A short discovery call is free. You'll leave with a clear plan, a timeline and a price."
        cta="discovery-call"
      />
    </>
  );
}
