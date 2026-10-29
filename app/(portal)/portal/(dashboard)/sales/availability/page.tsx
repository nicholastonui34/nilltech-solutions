import { deleteBookingBlock, deleteBookingHours } from "@/app/actions/bookings";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { AddBlockForm, AddHoursForm } from "@/components/portal/sales/availability-forms";
import { SalesTabs } from "@/components/portal/sales/sales-tabs";
import { Button } from "@/components/ui/button";
import {
  BOOKING_HORIZON_DAYS,
  MIN_NOTICE_HOURS,
  SLOT_MINUTES,
  WEEKDAY_LABELS,
} from "@/config/booking";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function AvailabilityPage() {
  const user = await getUserWithRole(["sales", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const [{ data: hours }, { data: blocks }] = await Promise.all([
    supabase
      .from("booking_hours")
      .select("id, weekday, start_time, end_time")
      .order("start_time"),
    supabase
      .from("booking_blocks")
      .select("id, starts_at, ends_at, reason")
      .gte("ends_at", new Date().toISOString())
      .order("starts_at"),
  ]);

  return (
    <>
      <PageHeader
        title="Sales"
        description="When visitors can book a call on the website. All times are Nairobi time (EAT)."
      />
      <SalesTabs current="/portal/sales/availability" />

      <Panel>
        <h2 className="text-lg font-semibold">Weekly hours</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Calls are {SLOT_MINUTES} minutes. Visitors can book from {MIN_NOTICE_HOURS}{" "}
          hours ahead up to {BOOKING_HORIZON_DAYS} days ahead. Add more than one range for
          a day to leave a break.
        </p>

        <ul className="divide-border mt-4 divide-y">
          {WEEK_ORDER.map((day) => {
            const ranges = (hours ?? []).filter((h) => h.weekday === day);
            return (
              <li key={day} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-28 font-medium">{WEEKDAY_LABELS[day]}</span>
                {ranges.length ? (
                  ranges.map((h) => (
                    <form
                      key={h.id}
                      action={deleteBookingHours}
                      className="bg-muted flex items-center gap-2 rounded-full py-1 pr-1 pl-3 text-sm"
                    >
                      <input type="hidden" name="id" value={h.id} />
                      <span className="tabular-nums">
                        {h.start_time.slice(0, 5)} to {h.end_time.slice(0, 5)}
                      </span>
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        aria-label={`Remove ${WEEKDAY_LABELS[day]} ${h.start_time.slice(0, 5)} to ${h.end_time.slice(0, 5)}`}
                      >
                        Remove
                      </Button>
                    </form>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">Closed</span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="border-border mt-6 border-t pt-6">
          <AddHoursForm />
        </div>
      </Panel>

      <Panel className="mt-6">
        <h2 className="text-lg font-semibold">Blocked dates and times</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Holidays, travel or busy afternoons. No calls can be booked in these periods.
        </p>

        {blocks?.length ? (
          <ul className="divide-border mt-4 divide-y">
            {blocks.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="tabular-nums">
                  {formatDateTime(b.starts_at)} to {formatDateTime(b.ends_at)}
                </span>
                {b.reason ? (
                  <span className="text-muted-foreground">{b.reason}</span>
                ) : null}
                <form action={deleteBookingBlock} className="ml-auto">
                  <input type="hidden" name="id" value={b.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground mt-4 text-sm">Nothing blocked.</p>
        )}

        <div className="border-border mt-6 border-t pt-6">
          <AddBlockForm />
        </div>
      </Panel>
    </>
  );
}
