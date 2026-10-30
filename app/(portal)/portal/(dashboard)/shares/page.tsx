import Link from "next/link";

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
const HOLDER_TYPE_LABELS: Record<string, string> = {
  director: "Director shareholder",
  investor: "Investor",
};

// USD figures only appear once the company has any USD activity.
const hasActivity = (t: CurrencyTotals) =>
  t.collectedAll !== 0 || t.spentAll !== 0 || t.receivables !== 0;

/**
 * My shareholding (owner, 2026-10-30): each shareholder's own holding on
 * their own login. The shareholder_overview RPC returns only the caller's
 * row plus company totals, so nobody sees another holder here.
 */
export default async function MySharesPage() {
  const user = await getUserWithRole(["director", "investor", "super_admin"]);
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
        title="My shareholding"
        description="Your shares in NillTech Solutions Ltd and what they're worth at book value."
      />

      {holding ? (
        <>
          <Panel>
            <p className="text-lg">
              <span className="font-semibold">{holding.name}</span> holds{" "}
              <span className="font-semibold">
                {shareCount.format(holding.shares)} shares
              </span>{" "}
              of {shareCount.format(totalShares)} in issue, which is{" "}
              <span className="font-semibold">{formatPercent(percent)}</span> of the
              company.
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {HOLDER_TYPE_LABELS[holding.holderType] ?? holding.holderType}
            </p>
          </Panel>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((currency) => (
              <StatCard
                key={currency}
                label={`Your shares are worth (${currency})`}
                value={formatMoney(
                  holdingValue(currencies[currency].netWorth, percent),
                  currency,
                )}
                hint={`${formatPercent(percent)} of company net worth, ${formatMoney(currencies[currency].netWorth, currency)}`}
              />
            ))}
          </div>

          <p className="text-muted-foreground mt-6 text-xs">
            Book value on a cash basis (cash collected minus expenses, plus unpaid
            invoices), not a market valuation. KES and USD are shown separately and never
            converted. If your holding looks wrong, ask an admin to check the share
            register.
          </p>
        </>
      ) : (
        <Panel>
          <p className="text-muted-foreground text-sm">
            Your login isn&rsquo;t linked to a shareholding.{" "}
            {user.roles.includes("super_admin") ? (
              <>
                Link it in the{" "}
                <Link
                  href="/portal/director/shareholders"
                  className="text-primary underline underline-offset-2"
                >
                  share register
                </Link>
                .
              </>
            ) : (
              "Ask an admin to link it in the share register."
            )}
          </p>
        </Panel>
      )}
    </>
  );
}
