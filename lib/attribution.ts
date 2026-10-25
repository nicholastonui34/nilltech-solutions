import type { Attribution } from "@/lib/leads/schema";

const STORAGE_KEY = "nt_attribution";

const UTM_PARAMS = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_term: "utmTerm",
  utm_content: "utmContent",
} as const;

const clip = (value: string) => value.slice(0, 200);

/**
 * Records first-touch attribution for this browser session: UTM tags, the
 * referring site (origin only, external referrers only) and the landing
 * page. Session storage only, no cookies; nothing leaves the browser until
 * the visitor submits a form. Runs once per session, so a later internal
 * page view doesn't overwrite how they first arrived.
 */
export function captureAttribution() {
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const url = new URL(window.location.href);
    const attribution: Attribution = { landingPage: clip(url.pathname) };
    for (const [param, key] of Object.entries(UTM_PARAMS)) {
      const value = url.searchParams.get(param);
      if (value) attribution[key] = clip(value);
    }
    if (document.referrer) {
      const referrer = new URL(document.referrer);
      if (referrer.origin !== url.origin) attribution.referrer = clip(referrer.origin);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Storage blocked (private mode, strict settings): attribution is optional.
  }
}

export function readAttribution(): Attribution | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : undefined;
  } catch {
    return undefined;
  }
}
