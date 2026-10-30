import "server-only";

import { ctaConfig, type CtaIntent } from "@/config/cta";
import type { AnalyticsEvent } from "@/lib/analytics";
import { daysAgoIso } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConversionRow = {
  event: AnalyticsEvent;
  path: string;
  props: Record<string, string>;
  source: string | null;
};

export const EVENT_LABELS: Record<AnalyticsEvent, string> = {
  cta_click: "Button clicks",
  form_start: "Forms started",
  form_submit: "Forms sent",
  booking_complete: "Calls booked",
  whatsapp_click: "WhatsApp taps",
  call_click: "Phone taps",
  quote_generated: "Estimates shown",
};

const INTENT_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    (Object.keys(ctaConfig) as CtaIntent[]).map((intent) => [
      intent,
      ctaConfig[intent].label,
    ]),
  ),
  book: "Book a call (mobile button)",
};

/** Which button a cta_click came from, in the words the visitor saw. */
export function buttonLabel(row: ConversionRow): string {
  const intent = row.props.intent;
  if (!intent) return "Other button";
  return INTENT_LABELS[intent] ?? intent;
}

const FORM_LABELS: Record<string, string> = {
  project_estimator: "Project estimator",
  token_estimator: "AI token estimator",
  talent_application: "Join as freelancer",
  booking: "Book a call",
};

/** Contact form events carry no `form` label; every other form names itself. */
export function formLabel(row: ConversionRow): string {
  const form = row.props.form;
  if (row.event === "booking_complete") return FORM_LABELS.booking;
  return form ? (FORM_LABELS[form] ?? form) : "Contact form";
}

/**
 * Last-N-days events for the dashboards. RLS limits reads to marketing,
 * director and super_admin. Volumes are small, so rows are aggregated here
 * rather than in SQL.
 */
export async function getConversionRows(days = 30): Promise<ConversionRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("conversion_events")
    .select("event, path, props, source")
    .gte("created_at", daysAgoIso(days))
    .order("created_at", { ascending: false })
    .limit(20000);
  return (data ?? []) as ConversionRow[];
}
