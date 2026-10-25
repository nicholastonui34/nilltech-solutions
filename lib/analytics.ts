/**
 * Provider-agnostic event tracking (CLAUDE.md §5). Every CTA fires through
 * this so GA4/Plausible/etc. can be wired in later without touching call
 * sites — for now it just logs in development.
 */

export type AnalyticsEvent =
  | "cta_click"
  | "form_start"
  | "form_submit"
  | "booking_complete"
  | "whatsapp_click"
  | "call_click"
  | "quote_generated";

export function trackEvent(event: AnalyticsEvent, props?: Record<string, string>) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[analytics]", event, props);
  }
  // TODO(Phase 3+): forward to GA4/Plausible once a provider is chosen.
}
