import Link from "next/link";

import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel, StatCard } from "@/components/portal/panel";
import { BookingStatusForm } from "@/components/portal/sales/booking-status-form";
import { SalesTabs } from "@/components/portal/sales/sales-tabs";
import { CALL_TYPES, MEETING_PREFERENCES, type CallType } from "@/config/booking";
import { getUserWithRole } from "@/lib/auth/dal";
import { BOOKING_STATUS_LABELS } from "@/lib/booking/labels";
import { daysAgoIso, formatDateTime, nairobiDateIso } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type BookingRow = {
  id: string;
  starts_at: string;
  call_type: string;
  meeting_preference: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  notes: string | null;
  status: keyof typeof BOOKING_STATUS_LABELS;
  lead_id: string | null;
};

const COLUMNS =
  "id, starts_at, call_type, meeting_preference, name, email, phone, company, notes, status, lead_id";

const callLabel = (type: string) => CALL_TYPES[type as CallType]?.label ?? type;
const meetingLabel = (pref: string) =>
  MEETING_PREFERENCES[pref as keyof typeof MEETING_PREFERENCES] ?? pref;

export default async function BookingsPage() {
  const user = await getUserWithRole(["sales", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  // "Today" starts at midnight in Nairobi, so calls earlier today stay in
  // Upcoming until the day is over and can still be marked done.
  const todayStart = new Date(`${nairobiDateIso()}T00:00:00+03:00`).toISOString();

  const [{ data: upcoming }, { data: past }, { count: hoursCount }] = await Promise.all([
    supabase
      .from("bookings")
      .select(COLUMNS)
      .gte("starts_at", todayStart)
      .order("starts_at", { ascending: true })
      .limit(200),
    supabase
      .from("bookings")
      .select(COLUMNS)
      .lt("starts_at", todayStart)
      .gte("starts_at", daysAgoIso(30))
      .order("starts_at", { ascending: false })
      .limit(200),
    supabase.from("booking_hours").select("id", { count: "exact", head: true }),
  ]);

  const confirmedUpcoming = (upcoming ?? []).filter((b) => b.status === "confirmed");

  return (
    <>
      <PageHeader
        title="Sales"
        description="Calls booked on the website. Times are Nairobi time (EAT)."
      />
      <SalesTabs current="/portal/sales/bookings" />

      {hoursCount === 0 ? (
        <Panel className="mb-6 border-amber-300 bg-amber-50">
          <p className="text-sm">
            <strong>Online booking is off:</strong> no opening hours are set, so the
            booking page shows no times.{" "}
            <Link href="/portal/sales/availability" className="text-primary underline">
              Set your hours
            </Link>
            .
          </p>
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming calls" value={confirmedUpcoming.length} />
        <StatCard
          label="Video calls"
          value={confirmedUpcoming.filter((b) => b.meeting_preference === "video").length}
          hint="Send the link before the call"
        />
        <StatCard
          label="Done in the last 30 days"
          value={(past ?? []).filter((b) => b.status === "completed").length}
        />
      </div>

      <BookingTable title="Upcoming" rows={upcoming ?? []} empty="No upcoming calls." />
      <BookingTable
        title="Last 30 days"
        rows={past ?? []}
        empty="No calls in the last 30 days."
      />
    </>
  );
}

function BookingTable({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: BookingRow[];
  empty: string;
}) {
  return (
    <Panel className="mt-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground text-xs">
              <tr>
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">Who</th>
                <th className="py-2 pr-4 font-medium">Call</th>
                <th className="py-2 pr-4 font-medium">Contact</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((b) => {
                const whatsapp = b.phone?.replace(/[^\d]/g, "");
                return (
                  <tr
                    key={b.id}
                    className={cn("align-top", b.status === "cancelled" && "opacity-60")}
                  >
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatDateTime(b.starts_at)}
                    </td>
                    <td className="py-3 pr-4">
                      {b.lead_id ? (
                        <Link
                          href={`/portal/sales/${b.lead_id}`}
                          className="text-primary font-medium hover:underline"
                        >
                          {b.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{b.name}</span>
                      )}
                      {b.company ? (
                        <p className="text-muted-foreground text-xs">{b.company}</p>
                      ) : null}
                      {b.notes ? (
                        <p className="text-muted-foreground mt-1 max-w-xs text-xs">
                          {b.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      {callLabel(b.call_type)}
                      <p className="text-muted-foreground text-xs">
                        {meetingLabel(b.meeting_preference)}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <a
                        href={`mailto:${b.email}`}
                        className="text-primary block hover:underline"
                      >
                        {b.email}
                      </a>
                      {b.phone ? (
                        <span className="text-xs">
                          <a href={`tel:${b.phone}`} className="hover:underline">
                            {b.phone}
                          </a>
                          {whatsapp ? (
                            <>
                              {" · "}
                              <a
                                href={`https://wa.me/${whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                WhatsApp
                              </a>
                            </>
                          ) : null}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3">
                      <BookingStatusForm bookingId={b.id} status={b.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{empty}</p>
      )}
    </Panel>
  );
}
