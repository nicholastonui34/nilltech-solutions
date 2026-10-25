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
  description:
    "AI chatbots, WhatsApp assistants and business automation for SMEs in Kenya and East Africa. Setup from KES 40,000, live in 4 to 10 days.",
  path: "/ai-solutions",
});

const data: OfferPageData = {
  eyebrow: "AI Solutions for SMEs",
  headline: "Put AI to work in your business, starting this month.",
  subheadline:
    "WhatsApp and website assistants, automated workflows and AI built into the tools you already use, set up and run by our team.",
  primaryCta: "demo",
  summary:
    "NillTech sets up practical AI for small and growing businesses: assistants that answer customers on WhatsApp or your website, automations that take repetitive admin off your team, and AI connected to your existing systems. Setup starts from KES 40,000 and most solutions are live in 4 to 10 days, with running costs from KES 5,000 a month for hosting, WhatsApp and AI usage.",
  audience: [
    "SME owners answering the same customer questions every day",
    "Operations leads buried in manual admin and data entry",
    "Teams that want AI in their existing tools, not another app",
  ],
  startingFrom: "KES 40,000 setup · USD 450 (international)",
  deliverables: [
    {
      icon: MessageSquare,
      title: "Customer assistants",
      description:
        "AI assistants on WhatsApp and your website that answer questions, take bookings and hand over to a person when needed.",
      href: "/estimate",
    },
    {
      icon: Zap,
      title: "Workflow automation",
      description:
        "Automate follow-ups, reminders, reports and data entry between the tools you already use.",
      href: "/estimate",
    },
    {
      icon: Bot,
      title: "Knowledge assistants",
      description:
        "Let your team ask questions of your own documents, policies and price lists, with answers that point to the source.",
      href: "/estimate",
    },
    {
      icon: Puzzle,
      title: "AI integrations",
      description:
        "Add AI to your CRM, M-Pesa flows, email or internal systems to read documents, sort requests and draft replies.",
      href: "/estimate",
    },
  ],
  process: [
    {
      title: "Demo and scoping",
      description:
        "We show you what is possible with your own use case and agree on one focused problem to solve first.",
    },
    {
      title: "Set up",
      description:
        "We connect the channels and systems, write the assistant's knowledge and rules, and choose the most cost-effective AI model.",
    },
    {
      title: "Test with you",
      description:
        "You try it with real questions and real data before customers see it. We tune it until it answers the way you would.",
    },
    {
      title: "Launch and monitor",
      description:
        "We go live, watch the conversations and costs, and fix any bugs free of charge for the period in your proposal.",
    },
  ],
  faq: [
    {
      question: "What can AI do for a small business?",
      answer:
        "The quickest wins are answering repeat customer questions on WhatsApp or your website, automating follow-ups and reminders, and pulling information out of documents and forms. We start with the one task that saves your team the most time.",
    },
    {
      question: "How much does an AI chatbot cost in Kenya?",
      answer:
        "Setup starts from KES 40,000. Running costs start from about KES 5,000 a month and cover hosting, WhatsApp messaging and AI usage, which we bill at cost. The AI token estimator shows usage costs for different models.",
    },
    {
      question: "Will the AI give customers wrong answers?",
      answer:
        "We limit each assistant to the information you approve, test it with you before launch, and set it to hand over to a person when it isn't sure.",
    },
    {
      question: "Is my customer data safe?",
      answer:
        "We only connect the data the solution needs, restrict access by role, and use providers with strong data protection. Our privacy notice explains how data is handled.",
    },
  ],
  ctaHeading: "See it working on your own business.",
  ctaBody:
    "Book a short demo and we'll show you what an AI assistant or automation would look like for your customers and team.",
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
