import { z } from "zod";

import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Short labels only (which button, which form). Anything longer or more
// numerous is rejected, so free text and personal data can't be stored.
const label = z.string().max(60);
const eventSchema = z.object({
  event: z.enum(ANALYTICS_EVENTS),
  path: z.string().startsWith("/").max(200),
  props: z
    .record(z.string().max(30), label)
    .refine((p) => Object.keys(p).length <= 6)
    .default({}),
  source: z.string().max(100).optional(),
});

// A real visitor fires a handful of events per page; this only stops floods.
const EVENT_LIMITS = { maxPerWindow: 60, windowSeconds: 10 * 60, maxPerDay: 300 };

const noContent = () => new Response(null, { status: 204 });

/**
 * Receives conversion events from lib/analytics.ts (sendBeacon). Always
 * answers 204 so a tracking problem never shows up for the visitor; bad,
 * cross-site or rate-limited events are simply dropped.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return noContent();

  let payload: unknown;
  try {
    payload = JSON.parse(await request.text());
  } catch {
    return noContent();
  }
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) return noContent();

  const admin = getSupabaseAdmin();
  if (!admin) return noContent();
  if (!(await checkRateLimit("events", EVENT_LIMITS))) return noContent();

  await admin.from("conversion_events").insert({
    event: parsed.data.event,
    path: parsed.data.path,
    props: parsed.data.props,
    source: parsed.data.source ?? null,
  });

  // Retention (13 months), checked on roughly one request in a hundred.
  if (Math.random() < 0.01) await admin.rpc("delete_old_conversion_events");

  return noContent();
}
