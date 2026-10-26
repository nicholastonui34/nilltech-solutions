import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeadStatus, LeadTier } from "@/lib/leads/labels";

export type LeadStatRow = {
  created_at: string;
  source: string;
  service_interest: string | null;
  tier: LeadTier;
  status: LeadStatus;
  /** "utm source / medium", referring site, "Direct" or "Not recorded". */
  channel: string;
  campaign: string | null;
};

type StoredAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
};

// Leads created before attribution capture (Phase 8) have none stored.
function channelOf(attribution: StoredAttribution | null) {
  if (!attribution) return "Not recorded";
  if (attribution.utmSource) {
    return attribution.utmMedium
      ? `${attribution.utmSource} / ${attribution.utmMedium}`
      : attribution.utmSource;
  }
  if (attribution.referrer) {
    try {
      return new URL(attribution.referrer).hostname.replace(/^www\./, "");
    } catch {
      return attribution.referrer;
    }
  }
  return "Direct";
}

/**
 * Lead rows for the Marketing/Analytics dashboards — only the columns the
 * charts need, no contact details. RLS limits reads to sales, marketing,
 * director and super_admin. Fine at today's volume; move the grouping into
 * SQL once leads reach the thousands.
 */
export async function getLeadStatRows(): Promise<LeadStatRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("leads")
    .select(
      "created_at, source, service_interest, tier, status, attribution:metadata->attribution",
    )
    .order("created_at", { ascending: false })
    .limit(5000);
  return (data ?? []).map(({ attribution, ...row }) => {
    const stored =
      attribution && typeof attribution === "object" && !Array.isArray(attribution)
        ? (attribution as StoredAttribution)
        : null;
    return { ...row, channel: channelOf(stored), campaign: stored?.utmCampaign ?? null };
  });
}

export function countBy<T>(rows: T[], key: (row: T) => string) {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/** Leads per week for the last `weeks` weeks, weeks starting Monday (UTC). */
export function weeklyCounts(rows: LeadStatRow[], weeks: number, now = new Date()) {
  const startOfWeek = (date: Date) => {
    const d = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d;
  };
  const current = startOfWeek(now);
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(current);
    start.setUTCDate(start.getUTCDate() - 7 * (weeks - 1 - i));
    return { start, value: 0 };
  });
  for (const row of rows) {
    const week = startOfWeek(new Date(row.created_at)).getTime();
    const bucket = buckets.find((b) => b.start.getTime() === week);
    if (bucket) bucket.value += 1;
  }
  return buckets;
}
