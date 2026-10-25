import type { Metadata } from "next";

import { siteConfig } from "@/config/site.config";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
};

/** Per-route metadata — CLAUDE.md §14: unique title/description/canonical/OG/Twitter per page. */
export function buildMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const url = `${siteConfig.url}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
