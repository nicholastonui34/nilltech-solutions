import { FileDown } from "lucide-react";

import { InvoiceStatusBadge } from "@/components/portal/finance/invoice-status-badge";
import { QuoteStatusBadge } from "@/components/portal/finance/quote-status-badge";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { nairobiDateIso } from "@/lib/format";
import { isOverdue, isQuoteExpired } from "@/lib/finance/labels";
import { formatMoney } from "@/lib/finance/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Client portal (CLAUDE.md §10): a client's own quotes, issued invoices and receipts. RLS scopes the rows. */
export default async function ClientInvoicesPage() {
  const user = await getUserWithRole(["client"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const [{ data: invoices }, { data: quotes }] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "id, number, status, currency, total_minor, paid_minor, balance_minor, issue_date, due_date, payments(id, receipt_number, amount_minor, paid_on), credit_notes(id, number, amount_minor)",
      )
      .neq("status", "draft")
      .order("issue_date", { ascending: false }),
    supabase
      .from("quotes")
      .select("id, number, title, status, currency, total_minor, issue_date, valid_until")
      .neq("status", "draft")
      .order("issue_date", { ascending: false }),
  ]);

  const today = nairobiDateIso();

  return (
    <>
      <PageHeader
        title="Your quotes and invoices"
        description="Download quotes, invoices, receipts and credit notes as PDFs."
      />
      {quotes?.length ? (
        <Panel title="Quotes" className="mb-6">
          <ul className="divide-border divide-y">
            {quotes.map((quote) => (
              <li
                key={quote.id}
                className="flex flex-wrap items-start justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium">{quote.number}</p>
                  {quote.title ? <p className="text-sm">{quote.title}</p> : null}
                  <p className="text-muted-foreground text-xs">
                    Dated {quote.issue_date} · valid until {quote.valid_until}
                  </p>
                  <p className="mt-1 text-sm tabular-nums">
                    {formatMoney(quote.total_minor, quote.currency)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <QuoteStatusBadge
                    status={quote.status}
                    expired={isQuoteExpired(quote, today)}
                  />
                  <a
                    href={`/portal/documents/quotes/${quote.id}`}
                    target="_blank"
                    rel="noopener"
                    className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                  >
                    <FileDown className="size-4" /> Quote
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <Panel title="Invoices">
        {invoices?.length ? (
          <ul className="divide-border divide-y">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{invoice.number}</p>
                    <p className="text-muted-foreground text-xs">
                      Issued {invoice.issue_date} · due {invoice.due_date}
                    </p>
                    <p className="mt-1 text-sm tabular-nums">
                      {formatMoney(invoice.total_minor, invoice.currency)}
                      {invoice.status !== "void" && (invoice.balance_minor ?? 0) > 0
                        ? ` · ${formatMoney(invoice.balance_minor ?? 0, invoice.currency)} due`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <InvoiceStatusBadge
                      status={invoice.status}
                      overdue={isOverdue(invoice, today)}
                    />
                    <a
                      href={`/portal/documents/invoices/${invoice.id}`}
                      target="_blank"
                      rel="noopener"
                      className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                    >
                      <FileDown className="size-4" /> Invoice
                    </a>
                  </div>
                </div>
                {invoice.credit_notes.length ? (
                  <ul className="mt-2 flex flex-wrap gap-3">
                    {invoice.credit_notes.map((note) => (
                      <li key={note.id}>
                        <a
                          href={`/portal/documents/credit-notes/${note.id}`}
                          target="_blank"
                          rel="noopener"
                          className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          <FileDown className="size-3.5" /> Credit note {note.number} (
                          {formatMoney(note.amount_minor, invoice.currency)})
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {invoice.payments.length ? (
                  <ul className="mt-2 flex flex-wrap gap-3">
                    {invoice.payments.map((payment) => (
                      <li key={payment.id}>
                        <a
                          href={`/portal/documents/receipts/${payment.id}`}
                          target="_blank"
                          rel="noopener"
                          className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          <FileDown className="size-3.5" /> Receipt{" "}
                          {payment.receipt_number} (
                          {formatMoney(payment.amount_minor, invoice.currency)})
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No invoices yet.</p>
        )}
      </Panel>
    </>
  );
}
