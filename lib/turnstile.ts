import "server-only";

import { headers } from "next/headers";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Server-side Cloudflare Turnstile check (CLAUDE.md §7, §15). Returns true
 * when the token is valid — or when TURNSTILE_SECRET_KEY isn't configured
 * (e.g. Preview deployments), so forms keep working on the honeypot alone
 * instead of breaking. Tokens are single-use and expire after 5 minutes.
 */
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const forwardedFor = (await headers()).get("x-forwarded-for");
  const body = new URLSearchParams({ secret, response: token });
  const ip = forwardedFor?.split(",")[0]?.trim();
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch(VERIFY_URL, { method: "POST", body, cache: "no-store" });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    // Cloudflare unreachable: fail closed — the visitor can retry, and the
    // form shows the direct email/WhatsApp fallback.
    return false;
  }
}

export const TURNSTILE_FAILED_MESSAGE =
  "We couldn't confirm you're human. Please try again, or email or WhatsApp us instead.";
