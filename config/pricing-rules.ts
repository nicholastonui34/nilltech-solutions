/**
 * Deterministic pricing-rules engine (CLAUDE.md §7A). Fully typed and
 * functional, but every base number below is a placeholder `0` — the
 * owner hasn't set real prices yet (§18 Open Inputs: "Starting prices per
 * service"). `PRICING_FINALIZED` gates whether the UI shows a computed
 * range at all: while it's `false`, /estimate shows an honest "pricing is
 * being finalized" state instead of a range built from zeros, per §2's
 * never-invent-prices rule. Flip it to `true` once real numbers are in.
 */

export const PRICING_FINALIZED = false;

export type ProjectType =
  "website" | "custom-software" | "ecommerce" | "business-systems";
export type TimelineUrgency = "asap" | "1-3-months" | "3-6-months" | "exploring";
export type Region = "primary-market" | "secondary-market" | "other";

type PriceRange = { minKes: number; maxKes: number };
type TimelineRange = { minWeeks: number; maxWeeks: number };

export const projectTypeBase: Record<
  ProjectType,
  { price: PriceRange; timeline: TimelineRange }
> = {
  website: { price: { minKes: 0, maxKes: 0 }, timeline: { minWeeks: 0, maxWeeks: 0 } },
  "custom-software": {
    price: { minKes: 0, maxKes: 0 },
    timeline: { minWeeks: 0, maxWeeks: 0 },
  },
  ecommerce: { price: { minKes: 0, maxKes: 0 }, timeline: { minWeeks: 0, maxWeeks: 0 } },
  "business-systems": {
    price: { minKes: 0, maxKes: 0 },
    timeline: { minWeeks: 0, maxWeeks: 0 },
  },
};

export const featureAddons: Record<string, { label: string; priceDeltaKes: number }> = {
  auth: { label: "User accounts / authentication", priceDeltaKes: 0 },
  payments: { label: "Payments", priceDeltaKes: 0 },
  "multi-language": { label: "Multi-language", priceDeltaKes: 0 },
  "admin-dashboard": { label: "Admin dashboard", priceDeltaKes: 0 },
};

export const integrationAddons: Record<string, { label: string; priceDeltaKes: number }> =
  {
    crm: { label: "CRM integration", priceDeltaKes: 0 },
    "payment-gateway": { label: "Payment gateway", priceDeltaKes: 0 },
    "sms-email": { label: "SMS/Email provider", priceDeltaKes: 0 },
    "erp-accounting": { label: "ERP/Accounting system", priceDeltaKes: 0 },
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

export const regionMultiplier: Record<Region, number> = {
  "primary-market": 1,
  "secondary-market": 1,
  other: 1,
};

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
  const featureDelta = input.features.reduce(
    (sum, key) => sum + (featureAddons[key]?.priceDeltaKes ?? 0),
    0,
  );
  const integrationDelta = input.integrations.reduce(
    (sum, key) => sum + (integrationAddons[key]?.priceDeltaKes ?? 0),
    0,
  );
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
      minWeeks: Math.round(base.timeline.minWeeks * timelineMultiplier),
      maxWeeks: Math.round(base.timeline.maxWeeks * timelineMultiplier),
    },
  };
}
