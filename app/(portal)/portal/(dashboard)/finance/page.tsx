import Link from "next/link";

import { FinanceTabs } from "@/components/portal/finance/finance-tabs";
import { InvoiceTable, needsEtims } from "@/components/portal/finance/invoice-table";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel, StatCard } from "@/components/portal/panel";
import { Button } from "@/components/ui/button";
import { getUserWithRole } from "@/lib/auth/dal";
import { nairobiDateIso } from "@/lib/format";
import { isOverdue } from "@/lib/finance/labels";
import { CURRENCIES, formatMoney, type Currency } from "@/lib/finance/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FinanceOverviewPage() {
  const user = await getUserWithRole(["finance", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const today = nairobiDateIso();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [{ data: invoices }, { data: payments }, { data: refunds }] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "id, number, status, currency, total_minor, paid_minor, balance_minor, due_date, created_at, etims_status, client_snapshot, clients(name, company)",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("payments").select("amount_minor, currency").gte("paid_on", monthStart),
    supabase
      .from("refunds")
      .select("amount_minor, currency")
      .gte("refunded_on", monthStart),
  ]);

  const open = (invoices ?? []).filter(
    (i) => i.status === "issued" || i.status === "partially_paid",
  );
  const byCurrency = (currency: Currency) => ({
    outstanding: open
      .filter((i) => i.currency === currency)
      .reduce((sum, i) => sum + Math.max(i.balance_minor ?? 0, 0), 0),
    // Cash kept this month: payments received less refunds paid out.
    collected:
      (payments ?? [])
        .filter((p) => p.currency === currency)
        .reduce((sum, p) => sum + p.amount_minor, 0) -
      (refunds ?? [])
        .filter((r) => r.currency === currency)
        .reduce((sum, r) => sum + r.amount_minor, 0),
  });
  const overdue = open.filter((i) => isOverdue(i, today));
  const drafts = (invoices ?? []).filter((i) => i.status === "draft").length;
  const missingEtims = (invoices ?? []).filter(needsEtims).length;

  return (
    <>
      <PageHeader
        title="Finance"
        description="Invoices, receipts and payments. Amounts are never converted between currencies."
        actions={
          <Button asChild>
            <Link href="/portal/finance/invoices/new">New invoice</Link>
          </Button>
        }
      />
      <FinanceTabs current="/portal/finance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CURRENCIES.map((currency) => {
          const totals = byCurrency(currency);
          return [
            <StatCard
              key={`${currency}-out`}
              label={`Outstanding (${currency})`}
              value={formatMoney(totals.outstanding, currency)}
            />,
            <StatCard
              key={`${currency}-in`}
              label={`Collected this month (${currency})`}
              value={formatMoney(totals.collected, currency)}
            />,
          ];
        })}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Overdue invoices"
          value={overdue.length}
          hint="Past due date, not fully paid"
        />
        <StatCard label="Drafts" value={drafts} hint="Not yet issued" />
        <StatCard
          label="Needs eTIMS"
          value={missingEtims}
          hint="Issued, KRA eTIMS number not recorded yet"
        />
      </div>

      <Panel title="Recent invoices" className="mt-6">
        {invoices?.length ? (
          <InvoiceTable invoices={invoices.slice(0, 10)} today={today} />
        ) : (
          <p className="text-muted-foreground text-sm">
            No invoices yet.{" "}
            <Link
              href="/portal/finance/clients"
              className="text-primary underline underline-offset-2"
            >
              Add a client
            </Link>{" "}
            first, then create an invoice.
          </p>
        )}
      </Panel>

      <Panel
        title="Exports for your accountant"
        description="CSV files that open in Excel or Google Sheets. Amounts stay in their own currency; draft invoices aren't included."
        className="mt-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left text-xs">
              <tr>
                <th className="py-2 pr-4 font-medium">Data</th>
                <th className="py-2 pr-4 font-medium">This month</th>
                <th className="py-2 pr-4 font-medium">This year</th>
                <th className="py-2 font-medium">All time</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {(
                [
                  ["invoices", "Invoices"],
                  ["payments", "Payments and receipts"],
                  ["credit-notes", "Credit notes"],
                  ["refunds", "Refunds"],
                  ["expenses", "Expenses"],
                ] as const
              ).map(([kind, label]) => (
                <tr key={kind}>
                  <td className="py-2 pr-4 font-medium">{label}</td>
                  {[
                    [`?month=${today.slice(0, 7)}`, today.slice(0, 7)],
                    [`?year=${today.slice(0, 4)}`, today.slice(0, 4)],
                    ["", "Everything"],
                  ].map(([query, text]) => (
                    <td key={text} className="py-2 pr-4">
                      <a
                        href={`/portal/finance/export/${kind}${query}`}
                        className="text-primary underline underline-offset-2"
                      >
                        {text}
                      </a>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
