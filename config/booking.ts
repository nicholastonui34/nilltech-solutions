import type { CtaIntent } from "@/config/cta";

/**
 * Online call booking (owner, 2026-10-29). Opening hours and blocked dates
 * are edited in the portal (Sales → Availability); these are the fixed
 * rules around them. Change them here, not in the database.
 */

/** Every call is one slot long. */
export const SLOT_MINUTES = 30;

/** Earliest bookable slot is this far from now, so nobody books a call starting in 5 minutes. */
export const MIN_NOTICE_HOURS = 4;

/** How far ahead visitors can book. */
export const BOOKING_HORIZON_DAYS = 21;

/**
 * Opening hours are wall-clock times in Nairobi. Kenya has no daylight
 * saving, so a fixed UTC+3 offset is exact all year.
 */
export const BOOKING_TIME_ZONE = "Africa/Nairobi";
export const NAIROBI_UTC_OFFSET = "+03:00";

export type CallType = Extract<CtaIntent, "discovery-call" | "demo" | "contact-sales">;

export const CALL_TYPES: Record<CallType, { label: string; description: string }> = {
  "discovery-call": {
    label: "Discovery call",
    description:
      "Talk through your project, team or idea. You leave with a clear next step.",
  },
  demo: {
    label: "AI demo",
    description: "See an AI assistant or automation working on a use case like yours.",
  },
  "contact-sales": {
    label: "Sales and partnerships",
    description: "Partnerships, larger teams and enterprise work.",
  },
};

export const CALL_TYPE_VALUES = Object.keys(CALL_TYPES) as [CallType, ...CallType[]];

export const MEETING_PREFERENCES = {
  video: "Video call (we send a link)",
  phone: "Phone call",
} as const;

export type MeetingPreference = keyof typeof MEETING_PREFERENCES;

export const MEETING_PREFERENCE_VALUES = Object.keys(MEETING_PREFERENCES) as [
  MeetingPreference,
  ...MeetingPreference[],
];

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
