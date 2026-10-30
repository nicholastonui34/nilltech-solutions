import type { NextConfig } from "next";

/**
 * 301 redirects from the previous nilltechsolutions.com (a Nuxt app), so
 * links and search rankings carry over when the domain moves here
 * (CLAUDE.md §14, docs/migration.md). Old URLs were collected on
 * 2026-10-30 from the old site's route table: it had no sitemap. Old app
 * areas (login, dashboards, job board) have no equivalent, so they go to
 * the nearest new page rather than a 404.
 */
const OLD_SITE_REDIRECTS: { source: string; destination: string }[] = [
  // Public pages
  { source: "/about-us", destination: "/about" },
  { source: "/contact-us", destination: "/contact" },
  { source: "/frequently-asked-questions", destination: "/pricing" },
  { source: "/privacy-policy", destination: "/legal#privacy" },
  { source: "/terms", destination: "/legal#terms" },
  // Service pages
  { source: "/services/ai-training-evaluation", destination: "/ai-data-services" },
  { source: "/services/data-annotation", destination: "/ai-data-services" },
  { source: "/services/managed-ai-delivery", destination: "/ai-solutions" },
  { source: "/services/managed-software-teams", destination: "/managed-teams" },
  { source: "/services/team-augmentation", destination: "/managed-teams" },
  // Dropped offer (Where to Play workshop): closest current service.
  { source: "/services/delivery-rescue", destination: "/managed-teams" },
  // Old app: sign-in and accounts
  { source: "/auth/register", destination: "/careers/apply" },
  { source: "/auth/:path*", destination: "/portal/login" },
  { source: "/admin/:path*", destination: "/portal" },
  { source: "/client/:path*", destination: "/portal/invoices" },
  // Old job board: freelancers now apply through Careers.
  { source: "/freelancer/browse-jobs", destination: "/careers" },
  { source: "/freelancer/jobs/:path*", destination: "/careers" },
  { source: "/freelancer/:path*", destination: "/portal/talent" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return OLD_SITE_REDIRECTS.map((r) => ({ ...r, statusCode: 301 as const }));
  },
  cacheComponents: true,
  // The invoice/receipt and legal PDF routes read the circular logo from disk; make
  // sure it's bundled with those serverless functions.
  outputFileTracingIncludes: {
    "/portal/documents/**": ["./public/brand/nilltech-mark-circle.png"],
    "/legal/**": ["./public/brand/nilltech-mark-circle.png"],
  },
  // 75 is the default; 60 is for below-the-fold card photos (ServiceCard).
  images: {
    qualities: [60, 75],
    formats: ["image/avif", "image/webp"],
  },
  partialPrefetching: true,
  // Talent documents (PDF, 4 MB max) are uploaded through a server action.
  // Vercel caps request bodies at 4.5 MB, so this is the practical ceiling.
  experimental: {
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
