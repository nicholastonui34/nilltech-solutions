import { offers } from "@/config/offers";
import { TIMELINE_URGENCY_OPTIONS } from "@/lib/leads/schema";
import type { Database } from "@/lib/supabase/types";

export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type LeadTier = Database["public"]["Enums"]["lead_tier"];

export const LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "disqualified",
];
export const LEAD_TIERS: readonly LeadTier[] = ["hot", "warm", "cold"];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  disqualified: "Disqualified",
};

export const TIER_LABELS: Record<LeadTier, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};

const SOURCE_LABELS: Record<string, string> = {
  contact_form: "Contact form",
  estimator_project: "Project estimator",
  estimator_tokens: "AI token estimator",
};

// Display labels for values stored in `leads`. Budget and region labels
// mirror components/sections/project-estimator-form.tsx.
const BUDGET_LABELS: Record<string, string> = {
  "under-500k": "Under KES 500,000",
  "500k-2m": "KES 500,000 to 2,000,000",
  "2m-plus": "KES 2,000,000+",
  unsure: "Not sure yet",
};

const REGION_LABELS: Record<string, string> = {
  "primary-market": "East Africa",
  "secondary-market": "US, UK or Canada",
  other: "Elsewhere",
};

const SERVICE_LABELS: Record<string, string> = {
  ...Object.fromEntries(offers.map((offer) => [offer.slug, offer.title])),
  "not-sure": "Not sure yet",
};

const TIMELINE_LABELS: Record<string, string> = Object.fromEntries(
  TIMELINE_URGENCY_OPTIONS.map((opt) => [opt.value, opt.label]),
);

const label = (map: Record<string, string>) => (value: string | null) =>
  value ? (map[value] ?? value) : "n/a";

export const sourceLabel = label(SOURCE_LABELS);
export const budgetLabel = label(BUDGET_LABELS);
export const regionLabel = label(REGION_LABELS);
export const serviceLabel = label(SERVICE_LABELS);
export const timelineLabel = label(TIMELINE_LABELS);
