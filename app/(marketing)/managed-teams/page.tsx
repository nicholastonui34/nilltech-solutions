import type { Metadata } from "next";
import { FileBarChart, ShieldCheck, TrendingUp, Users } from "lucide-react";

import {
  OfferPageContent,
  type OfferPageData,
} from "@/components/sections/offer-page-content";
import { JsonLd } from "@/components/seo/json-ld";
import { serviceSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const title = "Managed Tech Delivery Teams";

export const metadata: Metadata = buildMetadata({
  title,
  description: "{{PLACEHOLDER: meta description for /managed-teams, 150-160 characters}}",
  path: "/managed-teams",
});

const data: OfferPageData = {
  eyebrow: "Managed Tech Delivery Teams",
  headline: "{{PLACEHOLDER: /managed-teams hero headline}}",
  subheadline: "{{PLACEHOLDER: /managed-teams hero subheadline}}",
  primaryCta: "discovery-call",
  summary: "{{PLACEHOLDER: answer-first summary of this offer, 2 to 3 sentences}}",
  audience: [
    "{{PLACEHOLDER: audience 1}}",
    "{{PLACEHOLDER: audience 2}}",
    "{{PLACEHOLDER: audience 3}}",
  ],
  startingFrom: "KES 180,000 · USD 1,800 per developer / month",
  deliverables: [
    {
      icon: Users,
      title: "Dedicated Team",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: ShieldCheck,
      title: "Delivery Oversight",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: TrendingUp,
      title: "Flexible Scaling",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: FileBarChart,
      title: "Transparent Reporting",
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

export default function ManagedTeamsPage() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: title,
          description: data.summary,
          path: "/managed-teams",
        })}
      />
      <OfferPageContent data={data} />
    </>
  );
}
