import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const RATE_LIMITED_MESSAGE =
  "You've sent several requests in a short time. Please wait a few minutes and try again, or message us on WhatsApp.";

// Per visitor, per form: enough for real people who retry or correct a
// mistake, low enough to make scripted spam pointless.
const MAX_PER_WINDOW = 5;
const WINDOW_SECONDS = 10 * 60;
const MAX_PER_DAY = 20;

/**
 * Per-IP rate limit for public form submissions (CLAUDE.md §7), backed by
 * the check_rate_limit RPC in Supabase so it works on any host. The IP is
 * hashed with the form name and today's UTC date, so no raw IP is stored
 * and buckets can't be linked across days; rows are deleted after a day.
 *
 * Fails open (allows the submission) when Supabase isn't configured or the
 * check errors: Turnstile and the honeypot still apply, and a broken limiter
 * shouldn't cost a real lead.
 */
export async function checkRateLimit(form: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return true;

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim();
  if (!ip) return true;

  const day = new Date().toISOString().slice(0, 10);
  const hash = createHash("sha256").update(`${ip}|${form}|${day}`).digest("hex");

  const { data, error } = await admin.rpc("check_rate_limit", {
    p_bucket: `${form}:${hash}`,
    p_max_per_window: MAX_PER_WINDOW,
    p_window_seconds: WINDOW_SECONDS,
    p_max_per_day: MAX_PER_DAY,
  });
  if (error) return true;
  return data !== false;
}
