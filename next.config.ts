import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // The invoice/receipt and legal PDF routes read the logo from disk; make
  // sure it's bundled with those serverless functions.
  outputFileTracingIncludes: {
    "/portal/documents/**": ["./public/brand/nilltech-logo.jpg"],
    "/legal/**": ["./public/brand/nilltech-logo.jpg"],
  },
  partialPrefetching: true,
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
