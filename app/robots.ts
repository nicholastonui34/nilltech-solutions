import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site.config";

// CLAUDE.md §14: allow standard search + AI-search crawlers, disallow /portal and /api.
const aiSearchBots = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow: ["/portal", "/api"] },
      { userAgent: "Bingbot", allow: "/", disallow: ["/portal", "/api"] },
      ...aiSearchBots.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/portal", "/api"],
      })),
      { userAgent: "*", allow: "/", disallow: ["/portal", "/api"] },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
