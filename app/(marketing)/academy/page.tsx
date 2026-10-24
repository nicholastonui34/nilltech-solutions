import type { Metadata } from "next";
import { BookOpen, Briefcase, GraduationCap, Users } from "lucide-react";

import {
  OfferPageContent,
  type OfferPageData,
} from "@/components/sections/offer-page-content";
import { JsonLd } from "@/components/seo/json-ld";
import { courseSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const title = "NillTech Academy";

export const metadata: Metadata = buildMetadata({
  title,
  description: "{{PLACEHOLDER: meta description for /academy, 150-160 characters}}",
  path: "/academy",
});

// "Start Free / Enrol" (CLAUDE.md §4) isn't one of the five standard CTA
// intents in §5 — Academy has no enrollment flow yet (that's Phase 7), so
// this reuses "contact-sales" with a label override until then.
const data: OfferPageData = {
  eyebrow: "NillTech Academy",
  headline: "{{PLACEHOLDER: /academy hero headline}}",
  subheadline: "{{PLACEHOLDER: /academy hero subheadline}}",
  primaryCta: "contact-sales",
  summary: "{{PLACEHOLDER: answer-first summary of this offer — 2-3 sentences}}",
  audience: [
    "{{PLACEHOLDER: audience 1}}",
    "{{PLACEHOLDER: audience 2}}",
    "{{PLACEHOLDER: audience 3}}",
  ],
  startingFrom: "Free",
  deliverables: [
    {
      icon: BookOpen,
      title: "Free Courses",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: GraduationCap,
      title: "Paid Tracks",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: Users,
      title: "Live Cohorts",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
    {
      icon: Briefcase,
      title: "Career Support",
      description: "{{PLACEHOLDER: deliverable description}}",
      href: "/contact",
    },
  ],
  process: [
    { title: "{{PLACEHOLDER: step 1}}", description: "{{PLACEHOLDER: step 1 detail}}" },
    { title: "{{PLACEHOLDER: step 2}}", description: "{{PLACEHOLDER: step 2 detail}}" },
    { title: "{{PLACEHOLDER: step 3}}", description: "{{PLACEHOLDER: step 3 detail}}" },
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

export default function AcademyPage() {
  return (
    <>
      <JsonLd
        data={courseSchema({ name: title, description: data.summary, path: "/academy" })}
      />
      <OfferPageContent data={data} />
    </>
  );
}
