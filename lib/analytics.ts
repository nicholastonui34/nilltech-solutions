import { readAttribution } from "@/lib/attribution";

/**
 * Conversion event tracking (CLAUDE.md §5). Every CTA, form and contact tap
 * fires through here. In production each event is sent in the background
 * to /api/events and stored in `conversion_events` for the Marketing and
 * Analytics dashboards: no cookie, no visitor id, no form contents.
 */

export const ANALYTICS_EVENTS = [
  "cta_click",
  "form_start",
  "form_submit",
  "booking_complete",
  "whatsapp_click",
  "call_click",
  "quote_generated",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/** How this browser session arrived: campaign source, else referring site, else direct. */
function sessionSource(): string {
  const attribution = readAttribution();
  if (attribution?.utmSource) return attribution.utmSource;
  if (attribution?.referrer) {
    try {
      return new URL(attribution.referrer).hostname.replace(/^www\./, "");
    } catch {
      return "direct";
    }
  }
  return "direct";
}

export function trackEvent(event: AnalyticsEvent, props?: Record<string, string>) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[analytics]", event, props);
    return;
  }
  if (typeof window === "undefined") return;
  // The portal is staff-only; only the public site is measured.
  if (window.location.pathname.startsWith("/portal")) return;

  try {
    const body = JSON.stringify({
      event,
      path: window.location.pathname,
      props: props ?? {},
      source: sessionSource(),
    });
    const blob = new Blob([body], { type: "application/json" });
    // sendBeacon survives the page unloading (e.g. a click that navigates
    // away); fetch keepalive is the fallback.
    if (!navigator.sendBeacon?.("/api/events", blob)) {
      void fetch("/api/events", { method: "POST", body, keepalive: true });
    }
  } catch {
    // Tracking must never break the page.
  }
}
