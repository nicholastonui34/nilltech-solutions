import type { Metadata } from "next";

import { CtaBand } from "@/components/sections/cta-band";
import { Container } from "@/components/sections/container";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Partnerships",
  description:
    "Outsource software and AI delivery to a managed East African team. NillTech partners with agencies and enterprises in Kenya, the US, UK and Canada.",
  path: "/partnerships",
});

export default function PartnershipsPage() {
  return (
    <>
      <Hero
        eyebrow="Partnerships"
        headline="Extra delivery capacity, without the hiring."
        subheadline="We work behind agencies and alongside enterprise teams, delivering software and AI projects to your standards."
        primaryCta="contact-sales"
      />
      <section className="py-16">
        <Container className="max-w-3xl">
          <p className="text-lg leading-relaxed">
            NillTech partners with agencies, software firms and enterprises that need
            reliable delivery capacity in East Africa. We take on whole projects or work
            inside your team, under your brand if you prefer, with our own recruitment,
            code review and QA behind every delivery. International partners get East
            African rates, with working hours that overlap the UK and Europe and North
            American mornings.
          </p>
        </Container>
      </section>
      <Faq
        items={[
          {
            question: "Can you deliver under our brand?",
            answer:
              "Yes. We can work as your white-label delivery team, so your clients deal with you and we stay behind the scenes.",
          },
          {
            question: "How do partnerships work commercially?",
            answer:
              "Either a fixed price per project or a monthly rate per engineer, invoiced in KES or USD. Contact sales and we'll agree the model that fits your pipeline.",
          },
          {
            question: "How do you protect quality and confidentiality?",
            answer:
              "Every engineer is screened and completes a test task before joining a team, every delivery goes through code review and a QA checklist, and we're happy to sign your NDA.",
          },
        ]}
      />
      <CtaBand
        heading="Let's talk about your pipeline."
        body="Tell us about your clients and projects, and we'll propose how we can help you deliver more."
        cta="contact-sales"
      />
    </>
  );
}
