"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { NAIROBI_UTC_OFFSET } from "@/config/booking";
import { getUserWithRole } from "@/lib/auth/dal";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/booking/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BookingFormState = { error?: string; success?: string };

/** Portal booking management. RLS limits every write to sales + super_admin. */
async function salesContext() {
  const user = await getUserWithRole(["sales", "super_admin"]);
  if (!user) throw new Error("Not authorized.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase isn't configured.");
  return { user, supabase };
}

const uuid = z.string().uuid();
const time = z.string().regex(/^\d{2}:\d{2}$/, "Enter a time like 09:00.");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");

export async function updateBookingStatus(formData: FormData) {
  const { supabase } = await salesContext();
  const parsed = z
    .object({
      bookingId: uuid,
      status: z.enum(BOOKING_STATUSES as [BookingStatus, ...BookingStatus[]]),
    })
    .parse({ bookingId: formData.get("bookingId"), status: formData.get("status") });

  // Re-confirming a cancelled call can clash with a newer booking; the
  // database's no-overlap rule refuses that, and the error says so.
  const { error } = await supabase
    .from("bookings")
    .update({ status: parsed.status })
    .eq("id", parsed.bookingId);
  if (error) {
    throw new Error(
      error.code === "23P01"
        ? "Another confirmed call already uses that time."
        : error.message,
    );
  }
  refresh();
}

export async function addBookingHours(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const { supabase } = await salesContext();
  const parsed = z
    .object({ weekday: z.coerce.number().int().min(0).max(6), start: time, end: time })
    .safeParse({
      weekday: formData.get("weekday"),
      start: formData.get("start"),
      end: formData.get("end"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (parsed.data.end <= parsed.data.start) {
    return { error: "The end time must be after the start time." };
  }

  const { error } = await supabase.from("booking_hours").insert({
    weekday: parsed.data.weekday,
    start_time: parsed.data.start,
    end_time: parsed.data.end,
  });
  if (error) return { error: error.message };
  refresh();
  return { success: "Hours added." };
}

export async function deleteBookingHours(formData: FormData) {
  const { supabase } = await salesContext();
  const id = uuid.parse(formData.get("id"));
  const { error } = await supabase.from("booking_hours").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function addBookingBlock(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const { user, supabase } = await salesContext();
  const parsed = z
    .object({
      fromDate: date,
      fromTime: time.or(z.literal("")),
      toDate: date,
      toTime: time.or(z.literal("")),
      reason: z.string().trim().max(200).optional(),
    })
    .safeParse({
      fromDate: formData.get("fromDate"),
      fromTime: formData.get("fromTime") ?? "",
      toDate: formData.get("toDate"),
      toTime: formData.get("toTime") ?? "",
      reason: formData.get("reason") ?? "",
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  // Blank times mean whole days: from the start of the first day to the end
  // of the last, in Nairobi time.
  const { fromDate, toDate, reason } = parsed.data;
  const startsAt = `${fromDate}T${parsed.data.fromTime || "00:00"}:00${NAIROBI_UTC_OFFSET}`;
  const endsAt = parsed.data.toTime
    ? `${toDate}T${parsed.data.toTime}:00${NAIROBI_UTC_OFFSET}`
    : new Date(
        Date.parse(`${toDate}T00:00:00${NAIROBI_UTC_OFFSET}`) + 86_400_000,
      ).toISOString();
  if (Date.parse(endsAt) <= Date.parse(startsAt)) {
    return { error: "The end must be after the start." };
  }

  const { error } = await supabase.from("booking_blocks").insert({
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    reason: reason || null,
    created_by: user.id,
  });
  if (error) return { error: error.message };
  refresh();
  return { success: "Blocked." };
}

export async function deleteBookingBlock(formData: FormData) {
  const { supabase } = await salesContext();
  const id = uuid.parse(formData.get("id"));
  const { error } = await supabase.from("booking_blocks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}
