import { siteConfig } from "@/config/site.config";

/** JSON-LD builders — CLAUDE.md §14. Modelled as data, not hand-written per page. */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.legalName,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/nilltech-logo.jpg`,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.legalName,
    url: siteConfig.url,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.address.locality,
      addressCountry: siteConfig.address.country,
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
  };
}

export function serviceSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${siteConfig.url}${path}`,
    provider: { "@type": "Organization", name: siteConfig.legalName },
    areaServed: [...siteConfig.markets.primary, ...siteConfig.markets.secondary],
  };
}

export function courseSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url: `${siteConfig.url}${path}`,
    provider: {
      "@type": "Organization",
      name: siteConfig.legalName,
      sameAs: siteConfig.url,
    },
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  };
}
