import { siteConfig } from "@/config/site.config";

type CalendarEvent = {
  startsAt: string;
  endsAt: string;
  title: string;
  description: string;
};

// 2026-11-02T07:00:00.000Z → 20261102T070000Z
const icsTime = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const icsEscape = (text: string) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/[,;]/g, (c) => `\\${c}`);

/** An .ics file the visitor can add to any calendar app. */
export function buildIcs(event: CalendarEvent): string {
  const uid = `${icsTime(event.startsAt)}-${Math.random().toString(36).slice(2)}@${new URL(siteConfig.url).hostname}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${siteConfig.legalName}//Booking//EN`,
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsTime(new Date().toISOString())}`,
    `DTSTART:${icsTime(event.startsAt)}`,
    `DTEND:${icsTime(event.endsAt)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.description)}`,
    `ORGANIZER;CN=${icsEscape(siteConfig.name)}:mailto:${siteConfig.contact.email}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Pre-filled "add event" link for Google Calendar; no API or sign-in on our side. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${icsTime(event.startsAt)}/${icsTime(event.endsAt)}`,
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
