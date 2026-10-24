import type { Metadata } from "next";
import { Bot, MessageSquare, Puzzle, Zap } from "lucide-react";

import {
  OfferPageContent,
  type OfferPageData,
} from "@/components/sections/offer-page-content";
import { JsonLd } from "@/components/seo/json-ld";
import { serviceSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const title = "AI Solutions for SMEs";

export const metadata: Metadata = buildMetadata({
  title,
  description: "{{PLACEHOLDER: meta description for /ai-solutions, 150-160 characters}}",
  path: "/ai-solutions",
});

const data: OfferPageData = {
  eyebrow: "AI Solutions for SMEs",
  headline: "{{PLACEHOLDER: /ai-solutions hero headline}}",
  subheadline: "{{PLACEHOLDER: /ai-solutions hero subheadline}}",
  primaryCta: "demo",
  summary: "{{PLACEHOLDER: answer-first summary of this offer — 2-3 sentences}}",
  audience: [
    "{{PLACEHOLDER: audience 1}}",
    "{{PLACEHOLDER: audience 2}}",
    "{{PLACEHOLDER: audience 3}}",
  ],
  startingFrom: "{{PRICE}}",
  deliverables: [
    {
      icon: Zap,
      title: "Automation",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: MessageSquare,
      title: "Chatbots",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: Puzzle,
      title: "AI Integrations",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: Bot,
      title: "Custom AI Models",
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

export default function AiSolutionsPage() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: title,
          description: data.summary,
          path: "/ai-solutions",
        })}
      />
      <OfferPageContent data={data} />
    </>
  );
}
