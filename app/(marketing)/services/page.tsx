import type { Metadata } from "next";

import {
  OfferPageContent,
  type OfferPageData,
} from "@/components/sections/offer-page-content";
import { JsonLd } from "@/components/seo/json-ld";
import { serviceSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { faqs } from "@/lib/content/faqs";

const title = "AI-Powered Software Development";

export const metadata: Metadata = buildMetadata({
  title,
  description:
    "Website, e-commerce and custom software development in Kenya. Websites from KES 45,000, live in 1 to 7 days, tested and supported by one accountable team.",
  path: "/services",
});

const data: OfferPageData = {
  eyebrow: "AI-Powered Software Development",
  headline: "Websites, stores and systems, built properly and delivered fast.",
  subheadline:
    "One accountable team designs, builds, tests and launches your software, using AI to move faster without cutting corners.",
  primaryCta: "quote",
  summary:
    "NillTech builds websites, online stores, business systems and custom software for businesses and organisations in Kenya and East Africa. A business website starts from KES 45,000 and is live in 1 to 7 days; online stores take 1 to 2 weeks and custom systems 2 to 4 weeks. Every project is code reviewed, tested and signed off by you before launch, and bug fixes after launch are free.",
  audience: [
    "SMEs that need a credible website or online store",
    "Schools, churches and organisations running on spreadsheets",
    "Businesses that need a custom system or web app",
  ],
  startingFrom: "KES 45,000 · USD 500 (international)",
  deliverables: [
    {
      title: "Websites",
      description:
        "Fast, mobile-first business websites that rank on Google and turn visitors into enquiries. From KES 45,000, live in 1 to 7 days.",
      href: "/estimate",
    },
    {
      title: "E-commerce",
      description:
        "Online stores with M-Pesa and card checkout built in, product management and order tracking. From KES 95,000, in 1 to 2 weeks.",
      href: "/estimate",
    },
    {
      title: "Business Systems",
      description:
        "School management, inventory, bookings, HR and other internal tools that replace spreadsheets and paperwork. From KES 180,000.",
      href: "/estimate",
    },
    {
      title: "Custom Software",
      description:
        "Web apps and platforms built around how your business actually works, with integrations to M-Pesa, CRMs and accounting tools. From KES 250,000.",
      href: "/estimate",
    },
  ],
  process: [
    {
      title: "Discovery",
      description:
        "A short call to understand your goals, users and budget. You get a fixed quote and timeline in writing.",
    },
    {
      title: "Design",
      description:
        "We agree the pages, features and look before any build work starts, so there are no surprises.",
    },
    {
      title: "Build and test",
      description:
        "Our team builds with AI-assisted tooling, then every release is code reviewed and tested against the agreed scope.",
    },
    {
      title: "Launch and support",
      description:
        "You sign off, we launch, and we fix any bugs free of charge for the period in your proposal. The code is yours on full payment.",
    },
  ],
  faq: faqs.services,
  ctaHeading: "Know what you need? Get a price in two minutes.",
  ctaBody:
    "Answer a few questions and the estimator gives you an indicative range and timeline. A fixed quote follows a short discovery call.",
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: title,
          description: data.summary,
          path: "/services",
        })}
      />
      <OfferPageContent data={data} />
    </>
  );
}
