"use server";

import { createLead } from "@/lib/leads/create-lead";
import {
  SUBMIT_ERROR_MESSAGE,
  contactFormSchema,
  projectEstimatorSchema,
  tokenEstimatorSchema,
} from "@/lib/leads/schema";

export type SubmitResult =
  { ok: true; tier: "hot" | "warm" | "cold" } | { ok: false; error: string };

const genericError = SUBMIT_ERROR_MESSAGE;

export async function submitContactForm(input: unknown): Promise<SubmitResult> {
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Please check the form and try again." };
  if (parsed.data.website) return { ok: false, error: genericError }; // honeypot tripped

  const result = await createLead({
    source: "contact_form",
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    company: parsed.data.company,
    message: parsed.data.message,
    serviceInterest: parsed.data.serviceInterest,
  });

  if (!result.ok) return { ok: false, error: genericError };
  return { ok: true, tier: result.tier };
}

export async function submitProjectEstimator(input: unknown): Promise<SubmitResult> {
  const parsed = projectEstimatorSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Please check the form and try again." };
  if (parsed.data.website) return { ok: false, error: genericError };

  const result = await createLead({
    source: "estimator_project",
    name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company,
    serviceInterest: "services",
    budgetBand: parsed.data.budgetBand,
    timelineUrgency: parsed.data.timelineUrgency,
    region: parsed.data.region,
    metadata: {
      projectType: parsed.data.projectType,
      features: parsed.data.features,
      integrations: parsed.data.integrations,
    },
  });

  if (!result.ok) return { ok: false, error: genericError };
  return { ok: true, tier: result.tier };
}

export async function submitTokenEstimator(input: unknown): Promise<SubmitResult> {
  const parsed = tokenEstimatorSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Please check the form and try again." };
  if (parsed.data.website) return { ok: false, error: genericError };

  const result = await createLead({
    source: "estimator_tokens",
    name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company,
    serviceInterest: "ai-solutions",
    metadata: { task: parsed.data.task, monthlyVolume: parsed.data.monthlyVolume },
  });

  if (!result.ok) return { ok: false, error: genericError };
  return { ok: true, tier: result.tier };
}
