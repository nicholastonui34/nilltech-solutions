import "server-only";

import {
  availabilityWindow,
  computeAvailability,
  type AvailableDay,
} from "@/lib/booking/slots";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type AvailabilityResult =
  { ok: true; days: AvailableDay[] } | { ok: false; reason: "not_configured" | "error" };

/**
 * Reads opening hours, blocked periods and confirmed bookings with the
 * service role (anon can't read these tables) and returns free slots.
 * Only start and end times leave the server, never who booked.
 */
export async function loadAvailability(now = new Date()): Promise<AvailabilityResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, reason: "not_configured" };

  const { from, to } = availabilityWindow(now);
  const [hours, blocks, bookings] = await Promise.all([
    admin.from("booking_hours").select("weekday, start_time, end_time"),
    admin
      .from("booking_blocks")
      .select("starts_at, ends_at")
      .lt("starts_at", to)
      .gt("ends_at", from),
    admin
      .from("bookings")
      .select("starts_at, ends_at")
      .eq("status", "confirmed")
      .lt("starts_at", to)
      .gt("ends_at", from),
  ]);

  if (hours.error || blocks.error || bookings.error)
    return { ok: false, reason: "error" };

  return {
    ok: true,
    days: computeAvailability(hours.data, [...blocks.data, ...bookings.data], now),
  };
}
