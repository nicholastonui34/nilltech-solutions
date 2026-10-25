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
  description:
    "Dedicated, managed software and AI delivery teams from East Africa. Screened engineers from KES 180,000 or USD 1,800 a month, in place in 1 to 2 weeks.",
  path: "/managed-teams",
});

const data: OfferPageData = {
  eyebrow: "Managed Tech Delivery Teams",
  headline: "A delivery team in East Africa, managed for you.",
  subheadline:
    "We recruit, screen and manage the engineers. You set the priorities and own the outcome.",
  primaryCta: "discovery-call",
  summary:
    "NillTech provides dedicated software and AI delivery teams from East Africa, managed by us end to end. We screen every engineer with a test task, run delivery with code review and QA checklists, and report progress openly, so you get a team that works like your own without the hiring and management overhead. Developers start from KES 180,000 (USD 1,800 for international clients) per month, with a team in place in 1 to 2 weeks.",
  audience: [
    "Companies that need extra engineering capacity without hiring",
    "International firms building a team in East Africa",
    "Founders who need a reliable product team, not individual freelancers",
  ],
  startingFrom: "KES 180,000 · USD 1,800 per developer / month",
  deliverables: [
    {
      icon: Users,
      title: "Dedicated team",
      description:
        "Engineers who work on your product only, matched to your stack and time zone, screened by our recruitment team.",
      href: "/contact",
    },
    {
      icon: ShieldCheck,
      title: "Delivery oversight",
      description:
        "We manage the day to day: code review, testing and a QA checklist on every delivery, so quality doesn't depend on you checking.",
      href: "/contact",
    },
    {
      icon: TrendingUp,
      title: "Flexible scaling",
      description:
        "Add or reduce engineers as your roadmap changes, without recruitment cycles or long notice periods.",
      href: "/contact",
    },
    {
      icon: FileBarChart,
      title: "Transparent reporting",
      description:
        "Regular progress updates on what shipped, what's next and what's blocked, with one accountable contact at NillTech.",
      href: "/contact",
    },
  ],
  process: [
    {
      title: "Discovery call",
      description:
        "We learn your product, stack, goals and working hours, and recommend the team size and mix.",
    },
    {
      title: "Team matching",
      description:
        "We match screened engineers from our talent pool to your needs. You meet them before they start.",
    },
    {
      title: "Onboarding",
      description:
        "The team is in place in 1 to 2 weeks, set up on your tools and processes with clear goals for the first sprint.",
    },
    {
      title: "Managed delivery",
      description:
        "We run reviews, QA and reporting, and adjust the team as your priorities change.",
    },
  ],
  faq: [
    {
      question: "How is this different from hiring freelancers?",
      answer:
        "Freelancers leave you to manage, review and replace them. NillTech recruits and screens the engineers, manages delivery and quality, and stays accountable for the result. You get one contract and one point of contact.",
    },
    {
      question: "How much does a dedicated developer cost?",
      answer:
        "From KES 180,000 per developer per month for East African clients, and from USD 1,800 for clients in the US, UK and Canada. Senior specialists and larger teams cost more; longer engagements cost less.",
    },
    {
      question: "How quickly can a team start?",
      answer: "Usually within 1 to 2 weeks of agreeing the team size and skills.",
    },
    {
      question: "Where are your engineers based?",
      answer:
        "Across East Africa: Kenya, Uganda, Tanzania and Rwanda. Every engineer is screened by our recruitment team and completes a test task before joining a client team.",
    },
    {
      question: "Who owns the work?",
      answer:
        "You do. Ownership of everything the team builds for you passes to you on payment, as set out in our terms.",
    },
  ],
  ctaHeading: "Tell us what you're building.",
  ctaBody:
    "Book a discovery call and we'll recommend the right team size, skills and monthly cost for your roadmap.",
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
