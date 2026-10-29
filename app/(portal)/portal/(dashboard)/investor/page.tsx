import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel, StatCard } from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { CURRENCIES, formatMoney } from "@/lib/finance/money";
import {
  formatPercent,
  getShareholderOverview,
  holdingValue,
  ownershipPercent,
  type CurrencyTotals,
} from "@/lib/shareholders";

const shareCount = new Intl.NumberFormat("en-KE");

// USD figures only appear once the company has any USD activity.
const hasActivity = (t: CurrencyTotals) =>
  t.collectedAll !== 0 || t.spentAll !== 0 || t.receivables !== 0;

/**
 * Investor dashboard (owner, 2026-10-29): deliberately short. Net worth,
 * profit or loss, and the value of the investor's own shares, from
 * company-level totals only; no invoices, clients or expenses are exposed.
 */
export default async function InvestorPage() {
  const user = await getUserWithRole(["investor", "super_admin"]);
  if (!user) return <NoAccess />;
  const overview = await getShareholderOverview();
  if (!overview) return <NoAccess />;

  const { holding, totalShares, currencies } = overview;
  const percent = holding ? ownershipPercent(holding, totalShares) : 0;
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
        {holding ? (
          <p className="text-lg">
            <span className="font-semibold">{holding.name}</span> holds{" "}
            <span className="font-semibold">
              {shareCount.format(holding.shares)} shares
            </span>{" "}
            of {shareCount.format(totalShares)}, which is{" "}
            <span className="font-semibold">{formatPercent(percent)}</span> of the
            company.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Your portal login isn&rsquo;t linked to a shareholding yet. Ask a super admin
            to link it under Main Admin, Shareholders.
          </p>
        )}
      </Panel>

      {shown.map((currency) => {
        const t = currencies[currency];
        return (
          <section key={currency} className="mt-6">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
              {currency} figures
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <StatCard
                label="Your shares are worth"
                value={
                  holding
                    ? formatMoney(holdingValue(t.netWorth, percent), currency)
                    : "n/a"
                }
                hint={
                  holding ? `${formatPercent(percent)} of net worth` : "No linked holding"
                }
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
