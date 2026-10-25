"use server";

import {
  PRICING_FINALIZED,
  computeProjectEstimate,
  formatTimeline,
} from "@/config/pricing-rules";
import { createLead } from "@/lib/leads/create-lead";
import { RATE_LIMITED_MESSAGE, checkRateLimit } from "@/lib/rate-limit";
import { TURNSTILE_FAILED_MESSAGE, verifyTurnstile } from "@/lib/turnstile";
import {
  SUBMIT_ERROR_MESSAGE,
  type Attribution,
  contactFormSchema,
  projectEstimatorSchema,
  tokenEstimatorSchema,
} from "@/lib/leads/schema";

export type SubmitResult =
  { ok: true; tier: "hot" | "warm" | "cold" } | { ok: false; error: string };

const genericError = SUBMIT_ERROR_MESSAGE;

// Where the visitor came from (UTM tags, referrer, landing page), stored on
// the lead so Sales and Marketing can see which campaigns bring enquiries.
function attributionMetadata(attribution: Attribution | undefined) {
  return attribution && Object.keys(attribution).length ? { attribution } : {};
}

export async function submitContactForm(input: unknown): Promise<SubmitResult> {
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Please check the form and try again." };
  if (parsed.data.website) return { ok: false, error: genericError }; // honeypot tripped
  if (!(await verifyTurnstile(parsed.data.turnstileToken))) {
    return { ok: false, error: TURNSTILE_FAILED_MESSAGE };
  }
  if (!(await checkRateLimit("contact_form"))) {
    return { ok: false, error: RATE_LIMITED_MESSAGE };
  }

  const result = await createLead({
    source: "contact_form",
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    company: parsed.data.company,
    message: parsed.data.message,
    serviceInterest: parsed.data.serviceInterest,
    timelineUrgency: parsed.data.timelineUrgency,
    metadata: attributionMetadata(parsed.data.attribution),
  });

  if (!result.ok) return { ok: false, error: genericError };
  return { ok: true, tier: result.tier };
}

export async function submitProjectEstimator(input: unknown): Promise<SubmitResult> {
  const parsed = projectEstimatorSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Please check the form and try again." };
  if (parsed.data.website) return { ok: false, error: genericError };
  if (!(await verifyTurnstile(parsed.data.turnstileToken))) {
    return { ok: false, error: TURNSTILE_FAILED_MESSAGE };
  }
  if (!(await checkRateLimit("estimator_project"))) {
    return { ok: false, error: RATE_LIMITED_MESSAGE };
  }

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
      ...attributionMetadata(parsed.data.attribution),
      projectType: parsed.data.projectType,
      features: parsed.data.features,
      integrations: parsed.data.integrations,
      // What the visitor was shown, recomputed server-side so Sales sees it.
      ...(PRICING_FINALIZED
        ? (() => {
            const estimate = computeProjectEstimate(parsed.data);
            return {
              estimateKes: `${estimate.price.minKes} to ${estimate.price.maxKes}`,
              estimateTimeline: formatTimeline(estimate.timeline),
            };
          })()
        : {}),
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
  if (!(await verifyTurnstile(parsed.data.turnstileToken))) {
    return { ok: false, error: TURNSTILE_FAILED_MESSAGE };
  }
  if (!(await checkRateLimit("estimator_tokens"))) {
    return { ok: false, error: RATE_LIMITED_MESSAGE };
  }

  const result = await createLead({
    source: "estimator_tokens",
    name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company,
    serviceInterest: "ai-solutions",
    metadata: {
      ...attributionMetadata(parsed.data.attribution),
      task: parsed.data.task,
      monthlyVolume: parsed.data.monthlyVolume,
    },
  });

  if (!result.ok) return { ok: false, error: genericError };
  return { ok: true, tier: result.tier };
}
