import type { Database } from "@/lib/supabase/types";

export type LeadTier = Database["public"]["Enums"]["lead_tier"];

export type LeadScoringInput = {
  budgetBand?: "under-500k" | "500k-2m" | "2m-plus" | "unsure";
  timelineUrgency?: "asap" | "1-3-months" | "3-6-months" | "exploring";
  companySize?: "solo" | "small" | "medium" | "enterprise";
  serviceInterest?: string;
  region?: "primary-market" | "secondary-market" | "other";
};

const budgetPoints: Record<NonNullable<LeadScoringInput["budgetBand"]>, number> = {
  "2m-plus": 3,
  "500k-2m": 2,
  "under-500k": 1,
  unsure: 0,
};

const timelinePoints: Record<NonNullable<LeadScoringInput["timelineUrgency"]>, number> = {
  asap: 3,
  "1-3-months": 2,
  "3-6-months": 1,
  exploring: 0,
};

const companySizePoints: Record<NonNullable<LeadScoringInput["companySize"]>, number> = {
  enterprise: 3,
  medium: 2,
  small: 1,
  solo: 0,
};

const highPriorityServices = new Set([
  "services",
  "ai-solutions",
  "ai-data-services",
  "managed-teams",
]);

const regionPoints: Record<NonNullable<LeadScoringInput["region"]>, number> = {
  "secondary-market": 2,
  "primary-market": 1,
  other: 0,
};

/** Rules-based lead scoring (CLAUDE.md §9) — budget, timeline, company size, service, region. */
export function scoreLead(input: LeadScoringInput): { score: number; tier: LeadTier } {
  let score = 0;

  if (input.budgetBand) score += budgetPoints[input.budgetBand];
  if (input.timelineUrgency) score += timelinePoints[input.timelineUrgency];
  if (input.companySize) score += companySizePoints[input.companySize];
  if (input.region) score += regionPoints[input.region];
  if (input.serviceInterest && highPriorityServices.has(input.serviceInterest))
    score += 2;
  else if (input.serviceInterest === "partnerships") score += 1;

  const tier: LeadTier = score >= 9 ? "hot" : score >= 5 ? "warm" : "cold";

  return { score, tier };
}
