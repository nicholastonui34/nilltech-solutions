import type { Metadata } from "next";
import { Code2, Globe, Layers, ShoppingCart } from "lucide-react";

import {
  OfferPageContent,
  type OfferPageData,
} from "@/components/sections/offer-page-content";
import { JsonLd } from "@/components/seo/json-ld";
import { serviceSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const title = "AI-Powered Software Development";

export const metadata: Metadata = buildMetadata({
  title,
  description: "{{PLACEHOLDER: meta description for /services, 150-160 characters}}",
  path: "/services",
});

const data: OfferPageData = {
  eyebrow: "AI-Powered Software Development",
  headline: "{{PLACEHOLDER: /services hero headline}}",
  subheadline: "{{PLACEHOLDER: /services hero subheadline}}",
  primaryCta: "quote",
  summary: "{{PLACEHOLDER: answer-first summary of this offer — 2-3 sentences}}",
  audience: [
    "{{PLACEHOLDER: audience 1}}",
    "{{PLACEHOLDER: audience 2}}",
    "{{PLACEHOLDER: audience 3}}",
  ],
  startingFrom: "{{PRICE}}",
  deliverables: [
    {
      icon: Globe,
      title: "Websites",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: Code2,
      title: "Custom Software",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: ShoppingCart,
      title: "E-commerce",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: Layers,
      title: "Business Systems",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
  ],
  process: [
    { title: "{{PLACEHOLDER: step 1}}", description: "{{PLACEHOLDER: step 1 detail}}" },
    { title: "{{PLACEHOLDER: step 2}}", description: "{{PLACEHOLDER: step 2 detail}}" },
    { title: "{{PLACEHOLDER: step 3}}", description: "{{PLACEHOLDER: step 3 detail}}" },
    { title: "{{PLACEHOLDER: step 4}}", description: "{{PLACEHOLDER: step 4 detail}}" },
  ],
  faq: [
    {
      question: "{{PLACEHOLDER: FAQ question 1}}",
      answer: "{{PLACEHOLDER: FAQ answer 1}}",
    },
    {
      question: "{{PLACEHOLDER: FAQ question 2}}",
      answer: "{{PLACEHOLDER: FAQ answer 2}}",
    },
  ],
  ctaHeading: "{{PLACEHOLDER: closing CTA heading}}",
  ctaBody: "{{PLACEHOLDER: closing CTA body}}",
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
