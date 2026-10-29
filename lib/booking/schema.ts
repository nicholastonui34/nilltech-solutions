import { z } from "zod";

import { CALL_TYPE_VALUES, MEETING_PREFERENCE_VALUES } from "@/config/booking";
import { SERVICE_INTEREST_VALUES, honeypotSchema } from "@/lib/leads/schema";

export const SLOT_TAKEN_MESSAGE =
  "Sorry, someone has just booked that time. Please pick another slot.";

export const bookingSchema = honeypotSchema
  .extend({
    callType: z.enum(CALL_TYPE_VALUES, { error: "Choose the kind of call." }),
    startsAt: z.iso.datetime({ error: "Choose a time." }),
    meetingPreference: z.enum(MEETING_PREFERENCE_VALUES, {
      error: "Choose how you'd like to meet.",
    }),
    serviceInterest: z.enum(SERVICE_INTEREST_VALUES, {
      error: "Choose what the call is about.",
    }),
    name: z.string().trim().min(2, "Enter your name."),
    email: z.string().trim().email("Enter a valid email."),
    phone: z.string().trim().max(40).optional(),
    company: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(1000, "Keep this under 1,000 characters.").optional(),
  })
  .refine((v) => v.meetingPreference !== "phone" || (v.phone && v.phone.length >= 7), {
    path: ["phone"],
    error: "Enter the number we should call.",
  });

export type BookingValues = z.infer<typeof bookingSchema>;

/** What the confirmation screen needs back from the server. */
export type ConfirmedBooking = {
  startsAt: string;
  endsAt: string;
  callType: BookingValues["callType"];
  meetingPreference: BookingValues["meetingPreference"];
};
