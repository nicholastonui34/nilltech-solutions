import { siteConfig } from "@/config/site.config";
import type { AnalyticsEvent } from "@/lib/analytics";

/**
 * CTA system — CLAUDE.md §5. Every intent maps to a label, a real
 * destination, and the event it fires. "Book a Discovery Call" and "Book
 * a Demo" point at /contact (which now has a real lead-capture form and
 * Cal.com facade, Phase 3) until a dedicated booking flow exists. "Get a
 * Free Quote" now points at /estimate, Phase 3's AI quote estimator.
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
  quote: { label: "Get a Free Quote", href: "/estimate", event: "cta_click" },
  "contact-sales": { label: "Contact Sales", href: "/contact", event: "cta_click" },
  whatsapp: {
    label: "Talk on WhatsApp",
    href: siteConfig.contact.whatsapp,
    event: "whatsapp_click",
    external: true,
  },
};
