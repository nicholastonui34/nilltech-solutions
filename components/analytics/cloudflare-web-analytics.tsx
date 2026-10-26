import Script from "next/script";

/**
 * Cloudflare Web Analytics beacon (CLAUDE.md §3: free, cookieless): page
 * views, referrers and real-visitor Core Web Vitals. Loads after the page is
 * idle so it never affects LCP/INP, and only when the site token is set.
 * Public pages only; the portal doesn't render it.
 */
export function CloudflareWebAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN;
  if (!token) return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
      strategy="lazyOnload"
    />
  );
}
