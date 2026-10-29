import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ExpenseForm } from "@/components/portal/finance/expense-form";
import { FinanceTabs } from "@/components/portal/finance/finance-tabs";
import { PageHeader } from "@/components/portal/page-header";
import { BarList, NoAccess, Panel, StatCard } from "@/components/portal/panel";
import { Button } from "@/components/ui/button";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDate, nairobiDateIso } from "@/lib/format";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/finance/labels";
import { CURRENCIES, formatMoney } from "@/lib/finance/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const monthLabel = new Intl.DateTimeFormat("en-KE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "YYYY-MM" shifted by `delta` months. */
function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await getUserWithRole(["finance", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const today = nairobiDateIso();
  const { month: monthParam } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(monthParam ?? "") ? monthParam! : today.slice(0, 7);
  const from = `${month}-01`;
  const to = `${shiftMonth(month, 1)}-01`;

  const [{ data: expenses }, { data: projects }] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        "id, spent_on, description, category, amount_minor, currency, vendor, projects(name)",
      )
      .gte("spent_on", from)
      .lt("spent_on", to)
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").order("name"),
  ]);
  const rows = expenses ?? [];

  return (
    <>
      <PageHeader
        title="Finance"
        description="Money going out: talent, tools, hosting and running costs. Amounts are never converted between currencies."
        actions={
          <Button asChild variant="outline">
            <a href={`/portal/finance/export/expenses?month=${month}`}>Download CSV</a>
          </Button>
        }
      />
      <FinanceTabs current="/portal/finance/expenses" />

      <div className="mb-4 flex items-center gap-2">
        <Button asChild variant="outline" size="icon" aria-label="Previous month">
          <Link href={`/portal/finance/expenses?month=${shiftMonth(month, -1)}`}>
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <p className="min-w-40 text-center font-medium">
          {monthLabel.format(new Date(`${from}T00:00:00Z`))}
        </p>
        <Button asChild variant="outline" size="icon" aria-label="Next month">
          <Link href={`/portal/finance/expenses?month=${shiftMonth(month, 1)}`}>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {CURRENCIES.map((currency) => (
          <StatCard
            key={currency}
            label={`Spent this month (${currency})`}
            value={formatMoney(
              rows
                .filter((r) => r.currency === currency)
                .reduce((sum, r) => sum + r.amount_minor, 0),
              currency,
            )}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Panel title="Expenses">
            {rows.length ? (
              <ul className="divide-border divide-y">
                {rows.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div>
                      <Link
                        href={`/portal/finance/expenses/${expense.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {expense.description}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {[
                          formatDate(expense.spent_on),
                          EXPENSE_CATEGORY_LABELS[expense.category],
                          expense.vendor,
                          expense.projects?.name,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <p className="font-medium whitespace-nowrap tabular-nums">
                      {formatMoney(expense.amount_minor, expense.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                No expenses recorded this month.
              </p>
            )}
          </Panel>
          {CURRENCIES.map((currency) => {
            const inCurrency = rows.filter((r) => r.currency === currency);
            if (!inCurrency.length) return null;
            const byCategory = new Map<string, number>();
            for (const r of inCurrency) {
              const label = EXPENSE_CATEGORY_LABELS[r.category];
              byCategory.set(label, (byCategory.get(label) ?? 0) + r.amount_minor);
            }
            return (
              <Panel key={currency} title={`By category (${currency})`}>
                <BarList
                  rows={[...byCategory.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([label, value]) => ({
                      label,
                      value,
                      display: formatMoney(value, currency),
                    }))}
                />
              </Panel>
            );
          })}
        </div>
        <Panel title="Add an expense">
          <ExpenseForm projects={projects ?? []} today={today} />
        </Panel>
      </div>
    </>
  );
}
