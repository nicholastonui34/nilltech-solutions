import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site.config";
import { caseStudies } from "@/lib/content/case-studies";

const staticRoutes = [
  "",
  "/services",
  "/ai-solutions",
  "/managed-teams",
  "/academy",
  "/pricing",
  "/podcast",
  "/partnerships",
  "/about",
  "/work",
  "/contact",
  "/careers",
  "/legal",
  "/blog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
  }));

  const caseStudyEntries: MetadataRoute.Sitemap = caseStudies.map((c) => ({
    url: `${base}/work/${c.slug}`,
    changeFrequency: "monthly",
  }));

  return [...staticEntries, ...caseStudyEntries];
}
