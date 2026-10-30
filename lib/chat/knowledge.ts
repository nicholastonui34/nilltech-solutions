import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { MIN_NOTICE_HOURS, SLOT_MINUTES, BOOKING_HORIZON_DAYS } from "@/config/booking";
import { siteConfig } from "@/config/site.config";
import { faqs, type FaqItem } from "@/lib/content/faqs";
import { jobs } from "@/lib/content/jobs";

/**
 * Everything the chat assistant may say comes from here: the public site's
 * own content (llms.txt summary, FAQs, booking rules, open roles). Nothing
 * else is invented. Keep it stable between requests so prompt caching works.
 */

const site = siteConfig.url;

export const allFaqs: FaqItem[] = Object.values(faqs).flat();

/** Built-in answers for common questions, also used when the AI is off. */
export const coreFaqs: FaqItem[] = [
  {
    question: "How do I book a call or a meeting?",
    answer: `Book a free ${SLOT_MINUTES}-minute call online at ${site}/book. Choose a discovery call, an AI demo or a sales call, then a time that suits you (times are shown in your time zone and in Nairobi time). Calls can be booked from ${MIN_NOTICE_HOURS} hours ahead and up to ${BOOKING_HORIZON_DAYS} days ahead.`,
  },
  {
    question: "How can I contact you? What is your phone number?",
    answer: `Email ${siteConfig.contact.email}, book a call at ${site}/book, or send a message through the contact form at ${site}/contact. In this chat you can also ask to talk to a person or continue on WhatsApp.`,
  },
  {
    question: "How much does it cost? What are your prices?",
    answer: `Starting prices are on ${site}/pricing, and the estimator at ${site}/estimate gives an indicative range for your project in about two minutes. A fixed quote follows a short discovery call.`,
  },
  {
    question: "Are you hiring? How do I join as a freelancer or apply for a job?",
    answer: `Open roles are listed at ${site}/careers${jobs.length ? ` (currently: ${jobs.map((j) => j.title).join(", ")})` : ""}. Developers, designers and other specialists in East Africa can apply to join the talent pool at ${site}/careers/apply.`,
  },
  {
    question: "Where are you based?",
    answer: `${siteConfig.legalName} is based in ${siteConfig.address.locality}, ${siteConfig.address.country}, and works with clients in ${siteConfig.markets.primary.join(", ")}, and in ${siteConfig.markets.secondary.join(", ")}.`,
  },
];

let cached: string | null = null;

/** The knowledge block for the system prompt (read once per server instance). */
export async function getKnowledge(): Promise<string> {
  if (cached) return cached;
  let summary = "";
  try {
    summary = await readFile(path.join(process.cwd(), "public/llms.txt"), "utf8");
  } catch {
    summary = "";
  }
  const faqText = [...coreFaqs, ...allFaqs]
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");
  const pages = [
    ["Services (websites, stores, systems, custom software)", "/services"],
    ["AI Solutions for SMEs", "/ai-solutions"],
    ["AI training and data annotation", "/ai-data-services"],
    ["Managed delivery teams", "/managed-teams"],
    ["Academy (free courses)", "/academy"],
    ["Pricing", "/pricing"],
    ["Project and AI cost estimator", "/estimate"],
    ["Book a call", "/book"],
    ["Contact form", "/contact"],
    ["Partnerships", "/partnerships"],
    ["About", "/about"],
    ["Careers", "/careers"],
    ["Privacy notice and terms", "/legal"],
  ]
    .map(([label, href]) => `- ${label}: ${site}${href}`)
    .join("\n");
  cached = `<company_summary>\n${summary.trim()}\n</company_summary>\n\n<faqs>\n${faqText}\n</faqs>\n\n<pages>\n${pages}\n</pages>`;
  return cached;
}
