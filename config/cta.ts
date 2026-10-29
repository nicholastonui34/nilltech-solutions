import { siteConfig } from "@/config/site.config";
import type { AnalyticsEvent } from "@/lib/analytics";

/**
 * CTA system — CLAUDE.md §5. Every intent maps to a label, a real
 * destination, and the event it fires. The three call intents open the
 * online booking page (/book, owner 2026-10-29) with the call type
 * preselected. "Get a Free Quote" goes to /estimate. WhatsApp is a
 * secondary channel now: it stays as a link on /contact and in the footer,
 * not as a button on pages.
 */

export type CtaIntent =
  "discovery-call" | "demo" | "quote" | "contact-sales" | "message" | "whatsapp";

export const ctaConfig: Record<
  CtaIntent,
  { label: string; href: string; event: AnalyticsEvent; external?: boolean }
> = {
  "discovery-call": {
    label: "Book a Discovery Call",
    href: "/book?type=discovery-call",
    event: "cta_click",
  },
  demo: { label: "Book a Demo", href: "/book?type=demo", event: "cta_click" },
  quote: { label: "Get a Free Quote", href: "/estimate", event: "cta_click" },
  "contact-sales": {
    label: "Contact Sales",
    href: "/book?type=contact-sales",
    event: "cta_click",
  },
  message: { label: "Send us a message", href: "/contact", event: "cta_click" },
  whatsapp: {
    label: "Talk on WhatsApp",
    href: siteConfig.contact.whatsapp,
    event: "whatsapp_click",
    external: true,
  },
};
