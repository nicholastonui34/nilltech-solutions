import type { OfferArtKey } from "@/components/brand/offer-art";
import type { CardPhoto } from "@/components/sections/service-card";
import type { CtaIntent } from "@/config/cta";

export type Offer = {
  slug: string;
  href: string;
  /** Brand illustration, shown until `photo` is set. */
  art: OfferArtKey;
  /** Real photo for the home-page card, e.g. { src: "/photos/academy.jpg", alt: "..." }. */
  photo?: CardPhoto;
  title: string;
  shortDescription: string;
  cardLinkLabel: string;
  primaryCta: CtaIntent;
};

/** The five offers from CLAUDE.md §4 — single source for home-page grid + nav-adjacent references. */
export const offers: Offer[] = [
  {
    slug: "services",
    cardLinkLabel: "See services and prices",
    href: "/services",
    art: "services",
    title: "AI-Powered Software Development",
    shortDescription:
      "Websites, online stores, business systems and custom software, built and tested by one accountable team.",
    primaryCta: "quote",
  },
  {
    slug: "ai-solutions",
    cardLinkLabel: "See AI solutions",
    href: "/ai-solutions",
    art: "ai-solutions",
    title: "AI Solutions for SMEs",
    shortDescription:
      "WhatsApp and website assistants, automations and AI integrations that save your team hours every week.",
    primaryCta: "demo",
  },
  {
    slug: "managed-teams",
    cardLinkLabel: "See how our teams work",
    href: "/managed-teams",
    art: "managed-teams",
    title: "Managed Tech Delivery Teams",
    shortDescription:
      "Dedicated engineers from East Africa, screened and managed by us, so you get a team without the overhead.",
    primaryCta: "discovery-call",
  },
  {
    slug: "academy",
    cardLinkLabel: "Browse the Academy",
    href: "/academy",
    art: "academy",
    title: "NillTech Academy",
    shortDescription:
      "Free, practical AI and software courses, with team training for companies on request.",
    primaryCta: "contact-sales",
  },
  {
    slug: "partnerships",
    cardLinkLabel: "Explore partnerships",
    href: "/partnerships",
    art: "partnerships",
    title: "Partnerships",
    shortDescription:
      "Delivery capacity for agencies and enterprises that need a reliable East African partner.",
    primaryCta: "contact-sales",
  },
];
