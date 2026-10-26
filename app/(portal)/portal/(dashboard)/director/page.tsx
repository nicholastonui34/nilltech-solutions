import { PageHeader } from "@/components/portal/page-header";
import {
  BarList,
  NoAccess,
  NotConnected,
  Panel,
  StatCard,
} from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { nairobiDateIso } from "@/lib/format";
import { CURRENCIES, formatMoney, type Currency } from "@/lib/finance/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MONTHS = 6;
const monthLabel = new Intl.DateTimeFormat("en-KE", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** The last `count` months as "YYYY-MM" keys, oldest first, in Nairobi time. */
function recentMonths(count: number) {
  const [year, month] = nairobiDateIso().split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - (count - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

const kes = new Intl.NumberFormat("en-KE");

/**
 * Indicative range saved on estimator leads as "min to max" (older leads
 * used a dash). Returns null for leads without an estimate.
 */
function parseEstimate(value: unknown): [number, number] | null {
  if (typeof value !== "string") return null;
  const numbers = value.match(/\d+/g)?.map(Number);
  return numbers && numbers.length >= 2 ? [numbers[0], numbers[1]] : null;
}

/**
 * Director / shareholder view (CLAUDE.md §10): read-only headline numbers
 * from finance and leads. RLS already gives directors read access to
 * invoices, payments and leads, and no write access. Amounts are never
 * converted between currencies.
 */
export default async function DirectorPage() {
  const user = await getUserWithRole(["director", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const months = recentMonths(MONTHS);
  const today = nairobiDateIso();
  const monthStart = `${today.slice(0, 7)}-01`;
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const since = `${months[0]}-01`;

  const [{ data: payments }, { data: invoices }, { data: leads }] = await Promise.all([
    supabase
      .from("payments")
      .select("amount_minor, currency, paid_on")
      .gte("paid_on", since < yearStart ? since : yearStart),
    supabase
      .from("invoices")
      .select("currency, total_minor, paid_minor, status")
      .in("status", ["issued", "partially_paid"]),
    supabase
      .from("leads")
      .select("created_at, status, tier, estimate:metadata->estimateKes")
      .gte("created_at", since),
  ]);

  const paid = payments ?? [];
  const sumPaid = (currency: Currency, from: string) =>
    paid
      .filter((p) => p.currency === currency && p.paid_on >= from)
      .reduce((sum, p) => sum + p.amount_minor, 0);
  const outstanding = (currency: Currency) =>
    (invoices ?? [])
      .filter((i) => i.currency === currency)
      .reduce((sum, i) => sum + i.total_minor - i.paid_minor, 0);

  const allLeads = leads ?? [];
  const openLeads = allLeads.filter((l) => l.status !== "disqualified");
  const estimates = openLeads
    .map((l) => parseEstimate(l.estimate))
    .filter((e): e is [number, number] => e !== null);
  const pipelineMin = estimates.reduce((sum, [min]) => sum + min, 0);
  const pipelineMax = estimates.reduce((sum, [, max]) => sum + max, 0);

  const revenueByMonth = (currency: Currency) =>
    months.map((month) => {
      const value = paid
        .filter((p) => p.currency === currency && p.paid_on.startsWith(month))
        .reduce((sum, p) => sum + p.amount_minor, 0);
      return {
        label: monthLabel.format(new Date(`${month}-01T00:00:00Z`)),
        value,
        display: formatMoney(value, currency),
      };
    });

  return (
    <>
      <PageHeader
        title="Director"
        description="Headline numbers across finance and sales. Read-only; amounts are never converted between currencies."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CURRENCIES.map((currency) => [
          <StatCard
            key={`${currency}-month`}
            label={`Collected this month (${currency})`}
            value={formatMoney(sumPaid(currency, monthStart), currency)}
          />,
          <StatCard
            key={`${currency}-year`}
            label={`Collected this year (${currency})`}
            value={formatMoney(sumPaid(currency, yearStart), currency)}
          />,
          <StatCard
            key={`${currency}-out`}
            label={`Outstanding invoices (${currency})`}
            value={formatMoney(outstanding(currency), currency)}
          />,
        ])}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label={`Open leads, last ${MONTHS} months`} value={openLeads.length} />
        <StatCard
          label="Hot open leads"
          value={openLeads.filter((l) => l.tier === "hot").length}
        />
        <StatCard
          label="Indicative pipeline (KES)"
          value={
            estimates.length
              ? `${kes.format(pipelineMin)} to ${kes.format(pipelineMax)}`
              : "n/a"
          }
          hint={
            estimates.length
              ? `From ${estimates.length} open estimator lead${estimates.length === 1 ? "" : "s"}; estimates are indicative.`
              : "No open leads with an estimate yet."
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {CURRENCIES.map((currency) => (
          <Panel
            key={currency}
            title={`Revenue collected (${currency})`}
            description={`Payments received per month, last ${MONTHS} months.`}
          >
            <BarList rows={revenueByMonth(currency)} emptyLabel="No payments yet." />
          </Panel>
        ))}
        <Panel title="New leads" description={`Per month, last ${MONTHS} months.`}>
          <BarList
            rows={months.map((month) => ({
              label: monthLabel.format(new Date(`${month}-01T00:00:00Z`)),
              value: allLeads.filter((l) => l.created_at.startsWith(month)).length,
            }))}
          />
        </Panel>
        <NotConnected
          title="Margins"
          reason="Needs project costs (talent pay, hosting and other expenses), which aren't tracked yet. Revenue above is cash collected, not profit."
        />
      </div>
    </>
  );
}
