import Link from "next/link";

import { QuoteStatusBadge } from "@/components/portal/finance/quote-status-badge";
import { formatDate } from "@/lib/format";
import { isQuoteExpired, type QuoteStatus } from "@/lib/finance/labels";
import { formatMoney, type Currency } from "@/lib/finance/money";

export type QuoteRow = {
  id: string;
  number: string | null;
  title: string | null;
  status: QuoteStatus;
  currency: Currency;
  total_minor: number;
  valid_until: string | null;
  invoice_id: string | null;
  created_at: string;
  clients: { name: string; company: string | null } | null;
};

export function QuoteTable({ quotes, today }: { quotes: QuoteRow[]; today: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground text-xs">
          <tr>
            <th className="py-2 pr-4 font-medium">Quote</th>
            <th className="py-2 pr-4 font-medium">Client</th>
            <th className="py-2 pr-4 font-medium">Valid until</th>
            <th className="py-2 pr-4 text-right font-medium">Total</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {quotes.map((quote) => (
            <tr key={quote.id}>
              <td className="py-3 pr-4">
                <Link
                  href={`/portal/finance/quotes/${quote.id}`}
                  className="text-primary font-medium whitespace-nowrap hover:underline"
                >
                  {quote.number ?? `Draft · ${formatDate(quote.created_at)}`}
                </Link>
                {quote.title ? (
                  <p className="text-muted-foreground text-xs">{quote.title}</p>
                ) : null}
              </td>
              <td className="py-3 pr-4">
                {quote.clients?.company ?? quote.clients?.name ?? "n/a"}
              </td>
              <td className="py-3 pr-4 whitespace-nowrap">
                {quote.valid_until ?? "n/a"}
              </td>
              <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums">
                {formatMoney(quote.total_minor, quote.currency)}
              </td>
              <td className="py-3">
                <span className="inline-flex flex-wrap gap-1">
                  <QuoteStatusBadge
                    status={quote.status}
                    expired={isQuoteExpired(quote, today)}
                  />
                  {quote.invoice_id ? (
                    <span className="bg-muted text-muted-foreground inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                      Invoiced
                    </span>
                  ) : null}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
