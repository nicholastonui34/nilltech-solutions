import type { Database } from "@/lib/supabase/types";

export type BookingStatus = Database["public"]["Enums"]["booking_status"];

export const BOOKING_STATUSES: readonly BookingStatus[] = [
  "confirmed",
  "completed",
  "no_show",
  "cancelled",
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  completed: "Done",
  no_show: "No-show",
  cancelled: "Cancelled",
};
