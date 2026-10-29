import type { Metadata } from "next";

import {
  OfferPageContent,
  type OfferPageData,
} from "@/components/sections/offer-page-content";
import { JsonLd } from "@/components/seo/json-ld";
import { serviceSchema } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const title = "AI Training and Data Annotation";

export const metadata: Metadata = buildMetadata({
  title: "AI Training, RLHF and Data Annotation Services in Kenya",
  description:
    "Managed human-in-the-loop teams in East Africa for AI companies: RLHF, preference ranking, model evaluation, content review and data annotation for image, text, audio and video.",
  path: "/ai-data-services",
});

// Workshop "AI Startup Support" (docs/strategy/where-to-play.md): chatbot
// training and data annotation, pursued now. Content comes from the services
// on the previous nilltechsolutions.com site. No price is published yet, so
// the price panel says how quotes work instead of inventing a number.
const data: OfferPageData = {
  eyebrow: "AI Training and Data Annotation",
  headline: "The human layer behind better AI models.",
  subheadline:
    "Managed teams in East Africa for RLHF, model evaluation and data annotation, with review and quality checks built into every batch.",
  primaryCta: "discovery-call",
  summary:
    "NillTech runs managed human-in-the-loop teams for AI startups and companies building AI products. We handle the training and evaluation work behind modern models (RLHF, preference ranking, response scoring and content review) and the annotation and validation of image, text, audio, video and document data. You agree the guidelines with us; we recruit, train and manage the team and review the work before it reaches you, so you get consistent data without managing a crowd of contractors.",
  audience: [
    "AI startups that need training and evaluation data at production pace",
    "Companies building chatbots and AI assistants that need human review",
    "Teams that need image, text, audio or video data labelled and checked",
  ],
  priceLabel: "Pricing",
  startingFrom: "Quoted per project",
  deliverables: [
    {
      title: "RLHF and preference ranking",
      description:
        "People compare and rank model responses against your guidelines, producing the preference data used to train and fine-tune models.",
      href: "/contact",
    },
    {
      title: "Model and chatbot evaluation",
      description:
        "Response scoring, accuracy and safety checks, and side by side comparisons that show how your model or chatbot performs before and after each change.",
      href: "/contact",
    },
    {
      title: "Content review and moderation",
      description:
        "Supervised review of AI outputs and user content against your policies, with clear escalation for edge cases.",
      href: "/contact",
    },
    {
      title: "Image and video annotation",
      description:
        "Bounding boxes, segmentation, classification and tagging for computer vision datasets.",
      href: "/contact",
    },
    {
      title: "Text, audio and document annotation",
      description:
        "Classification, entity tagging, transcription and data extraction from documents, structured for consistency at scale.",
      href: "/contact",
    },
    {
      title: "Validation and quality review",
      description:
        "A second layer of review on annotated data, ours or from another source, to find errors and inconsistencies before they reach your model.",
      href: "/contact",
    },
  ],
  process: [
    {
      title: "Scope and guidelines",
      description:
        "We agree the task, data types, volumes, quality bar and turnaround, and turn your instructions into clear guidelines for the team.",
    },
    {
      title: "Pilot batch",
      description:
        "The team works a small batch first. You review it, we refine the guidelines, and we agree the quality measures before scaling up.",
    },
    {
      title: "Managed production",
      description:
        "We run the team day to day, with reviewers checking the work, so you deal with one accountable contact instead of individual annotators.",
    },
    {
      title: "Report and improve",
      description:
        "You get regular reports on volume, quality and open questions, and we adjust the team and guidelines as your model changes.",
    },
  ],
  faq: [
    {
      question: "What is RLHF?",
      answer:
        "RLHF (reinforcement learning from human feedback) trains an AI model using human judgements of its answers. People rank or score responses, and the model learns to prefer the answers people rate higher. NillTech provides the trained, managed teams that produce those judgements.",
    },
    {
      question: "What kinds of data do you annotate?",
      answer:
        "Image, text, audio, video and document data: for example bounding boxes and tags for images, entity tagging and classification for text, transcription for audio, and data extraction from documents.",
    },
    {
      question: "How do you keep quality consistent?",
      answer:
        "Every project starts with written guidelines and a pilot batch you review. In production, reviewers check the team's work against the guidelines, and edge cases are escalated instead of guessed.",
    },
    {
      question: "Where is the team based?",
      answer:
        "In East Africa: Kenya, Uganda, Tanzania and Rwanda. NillTech recruits, trains and manages the team, so you work with one company, not individual contractors.",
    },
    {
      question: "How is our data protected?",
      answer:
        "Access is limited to the people working on your project, and we follow your data handling rules. Our privacy notice explains how we handle data, and we can sign an NDA before you share anything.",
    },
    {
      question: "How much does annotation or RLHF work cost?",
      answer:
        "It depends on the task, data type, volume, quality bar and turnaround, so we quote per project after scoping. A pilot batch shows the real cost per item before you commit to volume.",
    },
  ],
  ctaHeading: "Tell us what your model needs.",
  ctaBody:
    "Book a discovery call and we'll scope the task, agree the guidelines and plan a pilot batch.",
};

export default function AiDataServicesPage() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: title,
          description: data.summary,
          path: "/ai-data-services",
        })}
      />
      <OfferPageContent data={data} />
    </>
  );
}
