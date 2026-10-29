"use server";

import { CALL_TYPES, MEETING_PREFERENCES, SLOT_MINUTES } from "@/config/booking";
import { loadAvailability, type AvailabilityResult } from "@/lib/booking/availability";
import {
  SLOT_TAKEN_MESSAGE,
  bookingSchema,
  type ConfirmedBooking,
} from "@/lib/booking/schema";
import { formatDateTime } from "@/lib/format";
import { createLead } from "@/lib/leads/create-lead";
import { SUBMIT_ERROR_MESSAGE } from "@/lib/leads/schema";
import { RATE_LIMITED_MESSAGE, checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { TURNSTILE_FAILED_MESSAGE, verifyTurnstile } from "@/lib/turnstile";

export type BookingResult =
  | { ok: true; booking: ConfirmedBooking }
  | { ok: false; error: string; slotTaken?: boolean };

/** Free slots for /book. Read-only and anonymous, like the page itself. */
export async function getBookingAvailability(): Promise<AvailabilityResult> {
  return loadAvailability();
}

// Postgres exclusion_violation: bookings_no_overlap rejected a double booking.
const EXCLUSION_VIOLATION = "23P01";

export async function submitBooking(input: unknown): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Please check the form and try again." };
  const values = parsed.data;
  if (values.website) return { ok: false, error: SUBMIT_ERROR_MESSAGE }; // honeypot
  if (!(await verifyTurnstile(values.turnstileToken))) {
    return { ok: false, error: TURNSTILE_FAILED_MESSAGE };
  }
  if (!(await checkRateLimit("booking"))) {
    return { ok: false, error: RATE_LIMITED_MESSAGE };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: SUBMIT_ERROR_MESSAGE };

  // Only accept a time the booking page would actually offer right now:
  // inside opening hours, outside blocks, with enough notice.
  const availability = await loadAvailability();
  if (!availability.ok) return { ok: false, error: SUBMIT_ERROR_MESSAGE };
  const startsAt = new Date(values.startsAt).toISOString();
  const offered = availability.days.some((day) => day.slots.includes(startsAt));
  if (!offered) return { ok: false, error: SLOT_TAKEN_MESSAGE, slotTaken: true };

  const endsAt = new Date(Date.parse(startsAt) + SLOT_MINUTES * 60_000).toISOString();

  // Book the slot first, so a lost race never leaves an orphan lead behind.
  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .insert({
      starts_at: startsAt,
      ends_at: endsAt,
      call_type: values.callType,
      meeting_preference: values.meetingPreference,
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      company: values.company || null,
      notes: values.notes || null,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    if (bookingError?.code === EXCLUSION_VIOLATION) {
      return { ok: false, error: SLOT_TAKEN_MESSAGE, slotTaken: true };
    }
    await admin.from("automation_runs").insert({
      type: "booking_insert",
      status: "failed",
      payload: { startsAt },
      error: bookingError?.message,
    });
    return { ok: false, error: SUBMIT_ERROR_MESSAGE };
  }

  const lead = await createLead({
    source: "booking",
    name: values.name,
    email: values.email,
    phone: values.phone,
    company: values.company,
    message: values.notes,
    serviceInterest: values.serviceInterest,
    bookedCall: true,
    metadata: {
      ...(values.attribution && Object.keys(values.attribution).length
        ? { attribution: values.attribution }
        : {}),
      // Shown as label/value rows on the lead page, so keep them readable.
      call: CALL_TYPES[values.callType].label,
      callTime: `${formatDateTime(startsAt)} (Nairobi)`,
      meeting: MEETING_PREFERENCES[values.meetingPreference],
    },
  });
  if (lead.ok) {
    await admin.from("bookings").update({ lead_id: lead.id }).eq("id", booking.id);
  }

  // Confirmation and reminder emails wait on the Resend account (CLAUDE.md §8).
  await admin.from("automation_runs").insert({
    type: "booking_confirmation_email",
    status: "skipped_not_configured",
    related_entity_type: "bookings",
    related_entity_id: booking.id,
    payload: { reason: "Resend is deferred, see CLAUDE.md §3/§18" },
  });

  return {
    ok: true,
    booking: {
      startsAt,
      endsAt,
      callType: values.callType,
      meetingPreference: values.meetingPreference,
    },
  };
}
