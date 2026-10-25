/**
 * Single source of truth for company identity, contact details and brand
 * tokens — CLAUDE.md §1. Every component that needs this data imports it
 * from here instead of hardcoding it.
 */

export const siteConfig = {
  name: "NillTech Solutions",
  legalName: "NillTech Solutions Ltd",
  tagline: "We Build the Team. You Own the Outcome.",
  description:
    "Managed technology delivery — AI-powered software development, AI solutions for SMEs, and managed delivery teams. Nairobi, Kenya.",
  url: "https://nilltechsolutions.com",

  contact: {
    email: "info@nilltechsolutions.com",
    phone: "+254725830334",
    phoneDisplay: "+254 725 830 334",
    whatsapp: "https://wa.me/254725830334",
  },

  markets: {
    primary: ["Kenya", "Uganda", "Tanzania", "Rwanda"],
    secondary: ["United States", "United Kingdom", "Canada"],
  },

  address: {
    locality: "Nairobi",
    country: "Kenya",
  },
} as const;

export const brandTokens = {
  color: {
    navy: "#060B1F",
    blue: "#38BDF8",
    purple: "#5B2D8E",
    gold: "#F4C430",
  },
  font: {
    sans: "Poppins",
  },
} as const;

export type SiteConfig = typeof siteConfig;
