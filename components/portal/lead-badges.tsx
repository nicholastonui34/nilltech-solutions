import {
  STATUS_LABELS,
  TIER_LABELS,
  type LeadStatus,
  type LeadTier,
} from "@/lib/leads/labels";
import { cn } from "@/lib/utils";

const tierStyles: Record<LeadTier, string> = {
  hot: "bg-red-100 text-red-800",
  warm: "bg-amber-100 text-amber-900",
  cold: "bg-sky-100 text-sky-900",
};

const statusStyles: Record<LeadStatus, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-secondary text-secondary-foreground",
  qualified: "bg-emerald-100 text-emerald-800",
  disqualified: "bg-muted text-muted-foreground",
};

const base = "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function TierBadge({ tier }: { tier: LeadTier }) {
  return <span className={cn(base, tierStyles[tier])}>{TIER_LABELS[tier]}</span>;
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={cn(base, statusStyles[status])}>{STATUS_LABELS[status]}</span>;
}
