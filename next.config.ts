import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
