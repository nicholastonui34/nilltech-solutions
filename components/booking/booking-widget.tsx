"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck, Download } from "lucide-react";

import { getBookingAvailability, submitBooking } from "@/app/actions/booking";
import { TURNSTILE_SITE_KEY, TurnstileWidget } from "@/components/forms/turnstile-widget";
import { PrivacyLine } from "@/components/legal/privacy-line";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  BOOKING_TIME_ZONE,
  CALL_TYPES,
  CALL_TYPE_VALUES,
  MEETING_PREFERENCES,
  MEETING_PREFERENCE_VALUES,
  type CallType,
} from "@/config/booking";
import { offers } from "@/config/offers";
import { siteConfig } from "@/config/site.config";
import { trackEvent } from "@/lib/analytics";
import { readAttribution } from "@/lib/attribution";
import { buildIcs, googleCalendarUrl } from "@/lib/booking/calendar";
import {
  bookingSchema,
  type BookingValues,
  type ConfirmedBooking,
} from "@/lib/booking/schema";
import type { AvailableDay } from "@/lib/booking/slots";
import { SUBMIT_ERROR_MESSAGE } from "@/lib/leads/schema";
import { cn } from "@/lib/utils";

type Availability =
  { state: "loading" } | { state: "ready"; slots: string[] } | { state: "unavailable" };

const DEFAULT_SERVICE: Record<CallType, BookingValues["serviceInterest"]> = {
  "discovery-call": "not-sure",
  demo: "ai-solutions",
  "contact-sales": "partnerships",
};

const localDayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));

const formatDay = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));

const formatLongDay = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));

const formatTime = (iso: string, timeZone?: string) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));

function visitorTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || BOOKING_TIME_ZONE;
  } catch {
    return BOOKING_TIME_ZONE;
  }
}

export function BookingWidget() {
  const searchParams = useSearchParams();
  const initialType = CALL_TYPE_VALUES.find((t) => t === searchParams.get("type"));

  const [callType, setCallType] = useState<CallType>(initialType ?? "discovery-call");
  const [availability, setAvailability] = useState<Availability>({ state: "loading" });
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const [formError, setFormError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const timeZone = useMemo(() => visitorTimeZone(), []);
  const sameZoneAsNairobi = useMemo(() => {
    const probe = "2026-01-15T09:00:00Z";
    return formatTime(probe, timeZone) === formatTime(probe, BOOKING_TIME_ZONE);
  }, [timeZone]);

  // Bumped to refetch, e.g. after someone else takes the chosen slot.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getBookingAvailability()
      .then((result) => {
        if (!active) return;
        setAvailability(
          result.ok
            ? { state: "ready", slots: result.days.flatMap((d: AvailableDay) => d.slots) }
            : { state: "unavailable" },
        );
      })
      .catch(() => {
        if (active) setAvailability({ state: "unavailable" });
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const reloadSlots = () => {
    setAvailability({ state: "loading" });
    setReloadKey((k) => k + 1);
  };

  // Group by the visitor's own calendar day, so someone in London or
  // Toronto sees the right date for each time.
  const days = useMemo(() => {
    if (availability.state !== "ready") return [];
    const groups = new Map<string, string[]>();
    for (const s of availability.slots) {
      const key = localDayKey(s);
      groups.set(key, [...(groups.get(key) ?? []), s]);
    }
    return [...groups.entries()].map(([key, slots]) => ({ key, slots }));
  }, [availability]);

  const activeDay = days.find((d) => d.key === day) ?? days[0];

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      callType,
      startsAt: "",
      meetingPreference: "video",
      serviceInterest: DEFAULT_SERVICE[callType],
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
      website: "",
    },
  });
  const meetingPreference = useWatch({ control, name: "meetingPreference" });

  const chooseCallType = (type: CallType) => {
    setCallType(type);
    setValue("callType", type);
    setValue("serviceInterest", DEFAULT_SERVICE[type]);
  };

  const chooseSlot = (iso: string) => {
    if (!slot) trackEvent("form_start", { form: "booking" });
    setSlot(iso);
    setValue("startsAt", iso, { shouldValidate: true });
  };

  const resetTurnstile = () => {
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);
  };

  const onSubmit = async (values: BookingValues) => {
    setFormError("");
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setFormError(
        "Please wait a moment for the security check to finish, then try again.",
      );
      return;
    }
    let result: Awaited<ReturnType<typeof submitBooking>>;
    try {
      result = await submitBooking({
        ...values,
        turnstileToken: turnstileToken ?? undefined,
        attribution: readAttribution(),
      });
    } catch {
      setFormError(SUBMIT_ERROR_MESSAGE);
      resetTurnstile();
      return;
    }
    if (result.ok) {
      trackEvent("booking_complete", { callType: values.callType });
      setConfirmed(result.booking);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFormError(result.error);
    resetTurnstile();
    if (result.slotTaken) {
      setSlot(null);
      setValue("startsAt", "");
      reloadSlots();
    }
  };

  // Never let the button fail silently: say what's missing next to it, and
  // bring the time picker into view when that's the problem (the other
  // fields get focus from React Hook Form).
  const onInvalid = (invalid: FieldErrors<BookingValues>) => {
    if (invalid.startsAt) {
      setFormError("Choose a time above before confirming.");
      document
        .getElementById("pick-a-time")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setFormError("Please check the highlighted details above.");
    }
  };

  const hasTimes = availability.state === "ready" && days.length > 0;

  if (confirmed) return <Confirmation booking={confirmed} timeZone={timeZone} />;

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      // Keep the loaded form's height while times load (no jump), but let the
      // page close up when there are no times to show.
      className={cn(
        "flex flex-col gap-10",
        availability.state === "loading" && "min-h-[1550px] sm:min-h-[1000px]",
      )}
      noValidate
    >
      {/* Honeypot: visually hidden, real visitors never fill it in. */}
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <Input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <fieldset className="min-w-0">
        <legend className="text-lg font-semibold">1. What kind of call?</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {CALL_TYPE_VALUES.map((type) => (
            <label
              key={type}
              className={cn(
                "bg-card flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition-colors",
                callType === type
                  ? "border-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              <input
                type="radio"
                name="callTypeChoice"
                value={type}
                checked={callType === type}
                onChange={() => chooseCallType(type)}
                className="sr-only"
              />
              <span className="font-medium">{CALL_TYPES[type].label}</span>
              <span className="text-muted-foreground text-sm">
                {CALL_TYPES[type].description}
              </span>
            </label>
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-sm">
          All calls are 30 minutes and free.
        </p>
      </fieldset>

      {/* Min height matches the loaded picker, so the details below don't
          jump down when the times arrive (CLS). */}
      <fieldset
        id="pick-a-time"
        className={cn(
          "min-w-0 scroll-mt-24",
          (availability.state === "loading" || hasTimes) &&
            "min-h-[26.5rem] sm:min-h-[20.5rem]",
        )}
      >
        <legend className="text-lg font-semibold">2. Pick a time</legend>
        <p className="text-muted-foreground mt-1 text-sm">
          Times are shown in your time zone ({timeZone}).
        </p>

        {availability.state === "loading" ? (
          <p className="text-muted-foreground mt-4 text-sm" role="status">
            Loading available times…
          </p>
        ) : availability.state === "unavailable" || days.length === 0 ? (
          <NoTimes />
        ) : (
          <>
            <div
              className="mt-4 flex gap-2 overflow-x-auto pb-2"
              role="group"
              aria-label="Available days"
            >
              {days.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDay(d.key)}
                  aria-pressed={activeDay?.key === d.key}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors",
                    activeDay?.key === d.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary",
                  )}
                >
                  {formatDay(d.slots[0])}
                </button>
              ))}
            </div>
            {activeDay ? (
              <div
                className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5"
                role="group"
                aria-label={`Times on ${formatLongDay(activeDay.slots[0])}`}
              >
                {activeDay.slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => chooseSlot(s)}
                    aria-pressed={slot === s}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm font-medium tabular-nums transition-colors",
                      slot === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary",
                    )}
                  >
                    {formatTime(s)}
                  </button>
                ))}
              </div>
            ) : null}
            {slot ? (
              <p className="mt-4 text-sm" role="status">
                Selected: <strong>{formatLongDay(slot)}</strong> at{" "}
                <strong>{formatTime(slot)}</strong>
                {sameZoneAsNairobi
                  ? " (Nairobi time)"
                  : ` (${formatTime(slot, BOOKING_TIME_ZONE)} in Nairobi)`}
              </p>
            ) : null}
            {errors.startsAt ? (
              <p className="text-destructive mt-2 text-sm">Choose a time.</p>
            ) : null}
          </>
        )}
      </fieldset>

      {/* No times to book: the picker above offers a message instead, so the
          details and the button would only lead nowhere. */}
      {availability.state === "loading" || hasTimes ? (
        <fieldset className="flex min-w-0 flex-col gap-4">
          <legend className="text-lg font-semibold">3. Your details</legend>

          <div>
            <Label htmlFor="serviceInterest">What would you like to talk about?</Label>
            <NativeSelect
              id="serviceInterest"
              className="mt-1.5"
              {...register("serviceInterest")}
              aria-invalid={!!errors.serviceInterest}
            >
              {offers.map((offer) => (
                <option key={offer.slug} value={offer.slug}>
                  {offer.title}
                </option>
              ))}
              <option value="not-sure">Not sure yet</option>
            </NativeSelect>
          </div>

          <div role="radiogroup" aria-labelledby="meeting-label">
            <p id="meeting-label" className="text-sm font-medium">
              How should we meet?
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              {MEETING_PREFERENCE_VALUES.map((pref) => (
                <label key={pref} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    value={pref}
                    {...register("meetingPreference")}
                    className="accent-primary size-4"
                  />
                  {MEETING_PREFERENCES[pref]}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name?.message}>
              <Input
                id="name"
                autoComplete="name"
                className="mt-1.5"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1.5"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
            </Field>
            <Field
              label={meetingPreference === "phone" ? "Phone" : "Phone (optional)"}
              id="phone"
              error={errors.phone?.message}
            >
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                className="mt-1.5"
                {...register("phone")}
                aria-invalid={!!errors.phone}
              />
            </Field>
            <Field label="Company (optional)" id="company">
              <Input
                id="company"
                autoComplete="organization"
                className="mt-1.5"
                {...register("company")}
              />
            </Field>
          </div>

          <Field
            label="Anything we should know before the call? (optional)"
            id="notes"
            error={errors.notes?.message}
          >
            <Textarea id="notes" rows={3} className="mt-1.5" {...register("notes")} />
          </Field>

          <TurnstileWidget key={turnstileKey} onToken={setTurnstileToken} />
          <PrivacyLine purpose="to arrange and hold your call, and to follow up about your enquiry" />

          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !hasTimes}
            className="sm:self-start"
          >
            {isSubmitting ? "Booking…" : "Confirm booking"}
          </Button>
        </fieldset>
      ) : null}
    </form>
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const htmlFor = id ?? label.toLowerCase();
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-destructive mt-1 text-sm">{error}</p> : null}
    </div>
  );
}

function NoTimes() {
  return (
    <div className="border-border bg-muted/40 mt-4 rounded-lg border p-6">
      <p className="font-medium">No open times to show right now.</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Send us a message and we&rsquo;ll find a time with you, or email{" "}
        <a
          href={`mailto:${siteConfig.contact.email}`}
          className="text-primary underline underline-offset-2"
        >
          {siteConfig.contact.email}
        </a>
        .
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/contact">Send us a message</Link>
      </Button>
    </div>
  );
}

function Confirmation({
  booking,
  timeZone,
}: {
  booking: ConfirmedBooking;
  timeZone: string;
}) {
  const callLabel = CALL_TYPES[booking.callType].label;
  const event = {
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    title: `${callLabel} with ${siteConfig.name}`,
    description:
      booking.meetingPreference === "video"
        ? `${callLabel} with ${siteConfig.name}. We will email you a video link before the call. Questions: ${siteConfig.contact.email}`
        : `${callLabel} with ${siteConfig.name}. We will call you on the number you gave. Questions: ${siteConfig.contact.email}`,
  };

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nilltech-call.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="border-border bg-card rounded-2xl border p-6 shadow-sm sm:p-8"
      role="status"
    >
      <CalendarCheck className="text-nilltech-purple size-10" aria-hidden />
      <h2 className="mt-4 text-2xl font-semibold">You&rsquo;re booked in.</h2>
      <p className="mt-2 text-lg">
        {callLabel}, <strong>{formatLongDay(booking.startsAt)}</strong> at{" "}
        <strong>{formatTime(booking.startsAt)}</strong>{" "}
        <span className="text-muted-foreground">({timeZone})</span>
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        That&rsquo;s {formatTime(booking.startsAt, BOOKING_TIME_ZONE)} in Nairobi.{" "}
        {MEETING_PREFERENCES[booking.meetingPreference]}.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
            Add to Google Calendar
          </a>
        </Button>
        <Button type="button" variant="outline" onClick={downloadIcs}>
          <Download className="size-4" aria-hidden />
          Download calendar file
        </Button>
      </div>

      <div className="text-muted-foreground mt-6 text-sm">
        <p className="text-foreground font-medium">What happens next</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            We&rsquo;ll confirm by email before the call
            {booking.meetingPreference === "video" ? ", with your video link" : ""}.
          </li>
          <li>
            Need to change the time? Email{" "}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="text-primary underline underline-offset-2"
            >
              {siteConfig.contact.email}
            </a>
            .
          </li>
        </ul>
      </div>
    </div>
  );
}
