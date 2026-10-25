const dateTimeFormat = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Nairobi",
});

const dateFormat = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeZone: "Africa/Nairobi",
});

/** Portal timestamps are shown in Nairobi time (EAT), the team's time zone. */
export function formatDateTime(value: string | null | undefined) {
  return value ? dateTimeFormat.format(new Date(value)) : "n/a";
}

export function formatDate(value: string | null | undefined) {
  return value ? dateFormat.format(new Date(value)) : "n/a";
}

export function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO timestamp `days` days before now — for "last N days" queries. */
export function daysAgoIso(days: number) {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

const isoDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Nairobi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date in Nairobi as YYYY-MM-DD, optionally offset by `days`. */
export function nairobiDateIso(days = 0) {
  return isoDateFormat.format(new Date(Date.now() + days * DAY_MS));
}
