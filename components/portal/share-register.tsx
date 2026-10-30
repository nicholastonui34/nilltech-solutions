import { Panel } from "@/components/portal/panel";
import { formatMoney } from "@/lib/finance/money";
import { formatPercent, holdingValue, ownershipPercent } from "@/lib/shareholders";

type Holder = {
  id: string;
  name: string;
  shares: number;
  holder_type: string;
  user_id: string | null;
  ownership_percent: number | null;
};

const shareCount = new Intl.NumberFormat("en-KE");
const HOLDER_TYPE_LABELS: Record<string, string> = {
  director: "Director shareholder",
  investor: "Investor shareholder",
};

/**
 * Share register: every holder, their shares, ownership % and the book
 * value of their holding in KES. The signed-in holder's own row is bold;
 * their personal view is My shareholding (/portal/shares).
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
  const pct = (h: Holder) =>
    ownershipPercent({ shares: h.shares, ownershipPercent: h.ownership_percent }, total);

  return (
    <Panel
      title="Shareholding"
      description={`${shareCount.format(total)} shares in issue. Value is each holder's share of the company's book net worth (KES, cash basis), not a market valuation.`}
    >
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
                    {formatPercent(pct(h))}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatMoney(holdingValue(netWorthKes, pct(h)), "KES")}
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
