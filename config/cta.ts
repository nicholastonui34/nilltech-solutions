import { siteConfig } from "@/config/site.config";
import type { AnalyticsEvent } from "@/lib/analytics";

/**
 * CTA system — CLAUDE.md §5. Every intent maps to a label, a real
 * destination, and the event it fires. "Book a Discovery Call", "Book a
 * Demo" and "Get a Free Quote" point at /contact until Phase 3 ships
 * Cal.com and the AI estimator (/estimate) — that's a one-line change here
 * when those routes exist, not a rewrite of every call site.
 */

export type CtaIntent =
  "discovery-call" | "demo" | "quote" | "contact-sales" | "whatsapp";

export const ctaConfig: Record<
  CtaIntent,
  { label: string; href: string; event: AnalyticsEvent; external?: boolean }
> = {
  "discovery-call": {
    label: "Book a Discovery Call",
    href: "/contact",
    event: "cta_click",
  },
  demo: { label: "Book a Demo", href: "/contact", event: "cta_click" },
  quote: { label: "Get a Free Quote", href: "/contact", event: "cta_click" },
  "contact-sales": { label: "Contact Sales", href: "/contact", event: "cta_click" },
  whatsapp: {
    label: "Talk on WhatsApp",
    href: siteConfig.contact.whatsapp,
    event: "whatsapp_click",
    external: true,
  },
};
