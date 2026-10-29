import type { Metadata } from "next";

import { siteConfig } from "@/config/site.config";

// Site-wide share image (app/opengraph-image.jpg). Listed explicitly
// because each page's own openGraph/twitter object replaces the inherited
// one, which would otherwise drop the file-based image.
const shareImage = {
  url: `${siteConfig.url}/opengraph-image.jpg`,
  width: 1200,
  height: 630,
  alt: "NillTech Solutions: We Build the Team. You Own the Outcome.",
};

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
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}
