import {
  BOOKING_HORIZON_DAYS,
  MIN_NOTICE_HOURS,
  NAIROBI_UTC_OFFSET,
  SLOT_MINUTES,
} from "@/config/booking";

export type OpeningHours = { weekday: number; start_time: string; end_time: string };
export type TimeRange = { starts_at: string; ends_at: string };

export type AvailableDay = {
  /** Nairobi calendar date, YYYY-MM-DD. */
  date: string;
  /** Slot start times as ISO strings (UTC). */
  slots: string[];
};

const MINUTE = 60_000;

/** Today's calendar date in Nairobi (UTC+3), as YYYY-MM-DD. */
export function nairobiDate(at: Date): string {
  return new Date(at.getTime() + 3 * 60 * MINUTE).toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function nairobiInstant(date: string, time: string): number {
  // `time` comes from Postgres as HH:MM:SS.
  return Date.parse(`${date}T${time.slice(0, 5)}:00${NAIROBI_UTC_OFFSET}`);
}

/**
 * Free slots for the booking page: opening hours, minus blocked periods,
 * minus confirmed bookings, from MIN_NOTICE_HOURS ahead up to
 * BOOKING_HORIZON_DAYS. Pure, so the server action and the submit check
 * use exactly the same rules.
 */
export function computeAvailability(
  hours: OpeningHours[],
  busy: TimeRange[],
  now: Date,
): AvailableDay[] {
  const earliest = now.getTime() + MIN_NOTICE_HOURS * 60 * MINUTE;
  const busyRanges = busy.map((b) => [Date.parse(b.starts_at), Date.parse(b.ends_at)]);
  const overlapsBusy = (start: number, end: number) =>
    busyRanges.some(([s, e]) => start < e && end > s);

  const today = nairobiDate(now);
  const days: AvailableDay[] = [];

  for (let i = 0; i <= BOOKING_HORIZON_DAYS; i++) {
    const date = addDays(today, i);
    const weekday = weekdayOf(date);
    const starts = new Set<number>();

    for (const row of hours.filter((h) => h.weekday === weekday)) {
      const open = nairobiInstant(date, row.start_time);
      const close = nairobiInstant(date, row.end_time);
      for (let t = open; t + SLOT_MINUTES * MINUTE <= close; t += SLOT_MINUTES * MINUTE) {
        if (t < earliest) continue;
        if (overlapsBusy(t, t + SLOT_MINUTES * MINUTE)) continue;
        starts.add(t);
      }
    }

    if (starts.size) {
      days.push({
        date,
        slots: [...starts].sort((a, b) => a - b).map((t) => new Date(t).toISOString()),
      });
    }
  }

  return days;
}

/** The window the booking page needs busy periods for. */
export function availabilityWindow(now: Date): { from: string; to: string } {
  return {
    from: now.toISOString(),
    to: new Date(
      now.getTime() + (BOOKING_HORIZON_DAYS + 2) * 24 * 60 * MINUTE,
    ).toISOString(),
  };
}
