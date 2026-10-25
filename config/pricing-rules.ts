/**
 * Deterministic pricing-rules engine (CLAUDE.md §7A). Numbers set from
 * the owner's brief (2026-10-25: "agency quality product at a freelancer
 * price") and a market comparison of Kenyan freelancer and agency pricing
 * — see docs/decisions/0006-pricing.md for sources and reasoning. The
 * owner approves them by merging; change them here, nowhere else.
 */

export const PRICING_FINALIZED = true;

/**
 * Display-only conversion for showing USD alongside KES. Not a live rate —
 * review it when the shilling moves materially. Last reviewed 2026-10-25.
 */
export const USD_KES_RATE = 130;

export type ProjectType =
  "website" | "custom-software" | "ecommerce" | "business-systems";
export type TimelineUrgency = "asap" | "1-3-months" | "3-6-months" | "exploring";
export type Region = "primary-market" | "secondary-market" | "other";

type PriceRange = { minKes: number; maxKes: number };
type TimelineRange = { minDays: number; maxDays: number };

export const projectTypeBase: Record<
  ProjectType,
  { price: PriceRange; timeline: TimelineRange }
> = {
  website: {
    price: { minKes: 45_000, maxKes: 90_000 },
    timeline: { minDays: 1, maxDays: 7 },
  },
  ecommerce: {
    price: { minKes: 95_000, maxKes: 180_000 },
    timeline: { minDays: 7, maxDays: 14 },
  },
  "business-systems": {
    price: { minKes: 180_000, maxKes: 400_000 },
    timeline: { minDays: 14, maxDays: 28 },
  },
  "custom-software": {
    price: { minKes: 250_000, maxKes: 600_000 },
    timeline: { minDays: 14, maxDays: 28 },
  },
};

export const featureAddons: Record<string, { label: string; priceDeltaKes: number }> = {
  auth: { label: "User accounts / authentication", priceDeltaKes: 15_000 },
  payments: { label: "Payments", priceDeltaKes: 20_000 },
  "multi-language": { label: "Multi-language", priceDeltaKes: 15_000 },
  "admin-dashboard": { label: "Admin dashboard", priceDeltaKes: 35_000 },
};

export const integrationAddons: Record<string, { label: string; priceDeltaKes: number }> =
  {
    crm: { label: "CRM integration", priceDeltaKes: 25_000 },
    "payment-gateway": { label: "Payment gateway (M-Pesa, card)", priceDeltaKes: 20_000 },
    "sms-email": { label: "SMS/Email provider", priceDeltaKes: 12_000 },
    "erp-accounting": { label: "ERP/Accounting system", priceDeltaKes: 45_000 },
  };

/** Add-ons already covered by a project type's base price — never charged twice. */
export const includedAddons: Partial<Record<ProjectType, readonly string[]>> = {
  // Online stores are quoted with M-Pesa/card checkout built in.
  ecommerce: ["payments", "payment-gateway"],
};

// Rush work costs more and compresses timeline; exploratory work is
// cheaper but takes longer to schedule.
export const timelineUrgencyMultiplier: Record<
  TimelineUrgency,
  { priceMultiplier: number; timelineMultiplier: number }
> = {
  asap: { priceMultiplier: 1.25, timelineMultiplier: 0.75 },
  "1-3-months": { priceMultiplier: 1, timelineMultiplier: 1 },
  "3-6-months": { priceMultiplier: 0.95, timelineMultiplier: 1.15 },
  exploring: { priceMultiplier: 0.9, timelineMultiplier: 1.3 },
};

// East Africa pays the base (KES) price. US/UK/Canada clients pay 1.5x —
// still roughly a third of a typical US freelancer quote (ADR 0006).
export const regionMultiplier: Record<Region, number> = {
  "primary-market": 1,
  "secondary-market": 1.5,
  other: 1,
};

/** Rounds a KES amount to the nearest 5,000 for display. */
export function roundKes(value: number) {
  return Math.round(value / 5_000) * 5_000;
}

/** "1–7 days", or whole weeks ("1–2 weeks") once the range reaches two weeks. */
export function formatTimeline({ minDays, maxDays }: TimelineRange) {
  if (maxDays < 14) return `${minDays}–${maxDays} days`;
  const minWeeks = Math.max(1, Math.round(minDays / 7));
  const maxWeeks = Math.max(minWeeks, Math.round(maxDays / 7));
  return minWeeks === maxWeeks ? `${maxWeeks} weeks` : `${minWeeks}–${maxWeeks} weeks`;
}

/** KES → USD for display, rounded to the nearest 50. */
export function kesToUsd(value: number) {
  return Math.round(value / USD_KES_RATE / 50) * 50;
}

export type ProjectEstimateInput = {
  projectType: ProjectType;
  features: string[];
  integrations: string[];
  timelineUrgency: TimelineUrgency;
  region: Region;
};

export type ProjectEstimate = { price: PriceRange; timeline: TimelineRange };

export function computeProjectEstimate(input: ProjectEstimateInput): ProjectEstimate {
  const base = projectTypeBase[input.projectType];
  const included = includedAddons[input.projectType] ?? [];
  const charged = (key: string) => !included.includes(key);
  const featureDelta = input.features
    .filter(charged)
    .reduce((sum, key) => sum + (featureAddons[key]?.priceDeltaKes ?? 0), 0);
  const integrationDelta = input.integrations
    .filter(charged)
    .reduce((sum, key) => sum + (integrationAddons[key]?.priceDeltaKes ?? 0), 0);
  const { priceMultiplier, timelineMultiplier } =
    timelineUrgencyMultiplier[input.timelineUrgency];
  const region = regionMultiplier[input.region];

  const priceFactor = priceMultiplier * region;

  return {
    price: {
      minKes: Math.round(
        (base.price.minKes + featureDelta + integrationDelta) * priceFactor,
      ),
      maxKes: Math.round(
        (base.price.maxKes + featureDelta + integrationDelta) * priceFactor,
      ),
    },
    timeline: {
      minDays: Math.max(1, Math.round(base.timeline.minDays * timelineMultiplier)),
      maxDays: Math.max(1, Math.round(base.timeline.maxDays * timelineMultiplier)),
    },
  };
}
