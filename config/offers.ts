import { Bot, Code2, GraduationCap, Handshake, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CtaIntent } from "@/config/cta";

export type Offer = {
  slug: string;
  href: string;
  icon: LucideIcon;
  title: string;
  shortDescription: string;
  primaryCta: CtaIntent;
};

/** The five offers from CLAUDE.md §4 — single source for home-page grid + nav-adjacent references. */
export const offers: Offer[] = [
  {
    slug: "services",
    href: "/services",
    icon: Code2,
    title: "AI-Powered Software Development",
    shortDescription: "{{PLACEHOLDER: one-sentence description of this offer}}",
    primaryCta: "quote",
  },
  {
    slug: "ai-solutions",
    href: "/ai-solutions",
    icon: Bot,
    title: "AI Solutions for SMEs",
    shortDescription: "{{PLACEHOLDER: one-sentence description of this offer}}",
    primaryCta: "demo",
  },
  {
    slug: "managed-teams",
    href: "/managed-teams",
    icon: Users,
    title: "Managed Tech Delivery Teams",
    shortDescription: "{{PLACEHOLDER: one-sentence description of this offer}}",
    primaryCta: "discovery-call",
  },
  {
    slug: "academy",
    href: "/academy",
    icon: GraduationCap,
    title: "NillTech Academy",
    shortDescription: "{{PLACEHOLDER: one-sentence description of this offer}}",
    primaryCta: "contact-sales",
  },
  {
    slug: "partnerships",
    href: "/partnerships",
    icon: Handshake,
    title: "Partnerships",
    shortDescription: "{{PLACEHOLDER: one-sentence description of this offer}}",
    primaryCta: "contact-sales",
  },
];
