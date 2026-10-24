/**
 * Primary and footer navigation — CLAUDE.md §4. Max 6 primary items plus the
 * CTA button.
 */

export type NavItem = {
  label: string;
  href: string;
};

export const primaryNav: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "AI Solutions", href: "/ai-solutions" },
  { label: "Managed Teams", href: "/managed-teams" },
  { label: "Academy", href: "/academy" },
  { label: "Pricing", href: "/pricing" },
  { label: "Podcast", href: "/podcast" },
];

export const footerNav: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Partnerships", href: "/partnerships" },
  { label: "Case Studies", href: "/work" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
  { label: "Legal", href: "/legal" },
];
