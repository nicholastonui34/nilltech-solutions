import { siteConfig } from "@/config/site.config";

/**
 * Where the site is actually being served in production. Vercel sets
 * VERCEL_PROJECT_PRODUCTION_URL to the project's production domain (today
 * nilltech-solutions.vercel.app; it follows automatically once
 * nilltechsolutions.com is attached). Used for absolute asset URLs such as
 * the share image, so link previews never point at a domain that isn't
 * serving this site yet. Other hosts fall back to siteConfig.url.
 */
export const siteOrigin = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : siteConfig.url;
