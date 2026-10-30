import Link from "next/link";

import { InvoiceStatusBadge } from "@/components/portal/finance/invoice-status-badge";
import { formatDate } from "@/lib/format";
import { isOverdue, type InvoiceStatus } from "@/lib/finance/labels";
import { formatMoney, type Currency } from "@/lib/finance/money";

export type InvoiceRow = {
  id: string;
  number: string | null;
  status: InvoiceStatus;
  currency: Currency;
  total_minor: number;
  paid_minor: number;
  /** Generated column: total less credit notes, payments kept and refunds. */
  balance_minor: number | null;
  due_date: string | null;
  created_at: string;
  clients: { name: string; company: string | null } | null;
};

export function InvoiceTable({
  invoices,
  today,
}: {
  invoices: InvoiceRow[];
  today: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground text-xs">
          <tr>
            <th className="py-2 pr-4 font-medium">Invoice</th>
            <th className="py-2 pr-4 font-medium">Client</th>
            <th className="py-2 pr-4 font-medium">Due</th>
            <th className="py-2 pr-4 text-right font-medium">Total</th>
            <th className="py-2 pr-4 text-right font-medium">Balance</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="py-3 pr-4 whitespace-nowrap">
                <Link
                  href={`/portal/finance/invoices/${invoice.id}`}
                  className="text-primary font-medium hover:underline"
                >
                  {invoice.number ?? `Draft · ${formatDate(invoice.created_at)}`}
                </Link>
              </td>
              <td className="py-3 pr-4">
                {invoice.clients?.company ?? invoice.clients?.name ?? "n/a"}
              </td>
              <td className="py-3 pr-4 whitespace-nowrap">{invoice.due_date ?? "n/a"}</td>
              <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums">
                {formatMoney(invoice.total_minor, invoice.currency)}
              </td>
              <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums">
                {invoice.status === "void" || invoice.status === "draft"
                  ? "n/a"
                  : formatMoney(
                      invoice.balance_minor ?? invoice.total_minor - invoice.paid_minor,
                      invoice.currency,
                    )}
              </td>
              <td className="py-3">
                <InvoiceStatusBadge
                  status={invoice.status}
                  overdue={isOverdue(invoice, today)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
