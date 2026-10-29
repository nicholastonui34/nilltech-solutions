import { Panel } from "@/components/portal/panel";
import { formatMoney } from "@/lib/finance/money";
import { formatPercent, holdingValue, ownershipPercent } from "@/lib/shareholders";

type Holder = {
  id: string;
  name: string;
  shares: number;
  holder_type: string;
  user_id: string | null;
};

const shareCount = new Intl.NumberFormat("en-KE");
const HOLDER_TYPE_LABELS: Record<string, string> = {
  director: "Director shareholder",
  investor: "Investor",
};

/**
 * Share register for the Director dashboard: every holder, their shares,
 * ownership % (derived from share counts) and the book value of their
 * holding in KES. The signed-in director's own row is highlighted.
 */
export function ShareRegister({
  holders,
  netWorthKes,
  currentUserId,
}: {
  holders: Holder[];
  netWorthKes: number;
  currentUserId: string;
}) {
  const total = holders.reduce((sum, h) => sum + h.shares, 0);
  const mine = holders.find((h) => h.user_id === currentUserId);

  return (
    <Panel
      title="Shareholding"
      description={`${shareCount.format(total)} shares in issue. Value is each holder's share of the company's book net worth (KES, cash basis), not a market valuation.`}
    >
      {mine ? (
        <p className="bg-muted/60 mb-4 rounded-lg p-3 text-sm">
          You hold{" "}
          <span className="font-semibold">{shareCount.format(mine.shares)} shares</span> (
          {formatPercent(ownershipPercent(mine.shares, total))}), worth{" "}
          <span className="font-semibold">
            {formatMoney(holdingValue(netWorthKes, mine.shares, total), "KES")}
          </span>{" "}
          at book value.
        </p>
      ) : null}
      {holders.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left text-xs">
              <tr>
                <th className="py-2 pr-4 font-medium">Holder</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 text-right font-medium">Shares</th>
                <th className="py-2 pr-4 text-right font-medium">Ownership</th>
                <th className="py-2 text-right font-medium">Book value (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {holders.map((h) => (
                <tr
                  key={h.id}
                  className={h.user_id === currentUserId ? "font-semibold" : undefined}
                >
                  <td className="py-2 pr-4">{h.name}</td>
                  <td className="py-2 pr-4">
                    {HOLDER_TYPE_LABELS[h.holder_type] ?? h.holder_type}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {shareCount.format(h.shares)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {formatPercent(ownershipPercent(h.shares, total))}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatMoney(holdingValue(netWorthKes, h.shares, total), "KES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No shareholders recorded yet.</p>
      )}
    </Panel>
  );
}
