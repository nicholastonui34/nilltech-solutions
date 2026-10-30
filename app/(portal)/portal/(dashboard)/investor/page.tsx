import Link from "next/link";

import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel, StatCard } from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { CURRENCIES, formatMoney } from "@/lib/finance/money";
import { getShareholderOverview, type CurrencyTotals } from "@/lib/shareholders";

// USD figures only appear once the company has any USD activity.
const hasActivity = (t: CurrencyTotals) =>
  t.collectedAll !== 0 || t.spentAll !== 0 || t.receivables !== 0;

/**
 * Investor dashboard (owner, 2026-10-29): deliberately short. Net worth
 * and profit or loss (own shares are on My shareholding), from
 * company-level totals only; no invoices, clients or expenses are exposed.
 */
export default async function InvestorPage() {
  const user = await getUserWithRole(["investor", "super_admin"]);
  if (!user) return <NoAccess />;
  const overview = await getShareholderOverview();
  if (!overview) return <NoAccess />;

  const { currencies } = overview;
  const shown = CURRENCIES.filter(
    (currency, i) => i === 0 || hasActivity(currencies[currency]),
  );

  return (
    <>
      <PageHeader
        title="Investor"
        description="NillTech Solutions Ltd at a glance. Figures update as invoices are paid and expenses are recorded."
      />

      <Panel title="Your shareholding">
        <p className="text-sm">
          Your shares, ownership and their value are on{" "}
          <Link
            href="/portal/shares"
            className="text-primary underline underline-offset-2"
          >
            My shareholding
          </Link>
          .
        </p>
      </Panel>

      {shown.map((currency) => {
        const t = currencies[currency];
        return (
          <section key={currency} className="mt-6">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
              {currency} figures
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Company net worth"
                value={formatMoney(t.netWorth, currency)}
                hint="Cash collected minus expenses, plus unpaid invoices"
              />
              <StatCard
                label="Profit or loss this year"
                value={formatMoney(t.profitYear, currency)}
                hint={`Collected ${formatMoney(t.collectedYear, currency)} · spent ${formatMoney(t.spentYear, currency)}`}
              />
              <StatCard
                label="Profit or loss to date"
                value={formatMoney(t.profitAll, currency)}
                hint="Since the company started trading"
              />
            </div>
          </section>
        );
      })}

      <p className="text-muted-foreground mt-6 text-xs">
        Net worth is a book figure on a cash basis, not a market valuation. KES and USD
        are shown separately and never converted. Figures are as recorded by the finance
        team.
      </p>
    </>
  );
}
