import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";

import { deleteQuoteDraft } from "@/app/actions/finance";
import { InvoiceDraftEditor } from "@/components/portal/finance/invoice-draft-editor";
import {
  ConvertQuoteForm,
  DecideQuoteForm,
  SendQuoteForm,
} from "@/components/portal/finance/quote-actions";
import { QuoteStatusBadge } from "@/components/portal/finance/quote-status-badge";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { Button } from "@/components/ui/button";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime, nairobiDateIso } from "@/lib/format";
import { isQuoteExpired, QUOTE_STATUS_LABELS } from "@/lib/finance/labels";
import { formatMoney } from "@/lib/finance/money";
import { getClientOptions } from "@/lib/finance/queries";
import { parseClientSnapshot } from "@/lib/finance/snapshots";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Default validity for a new quote. Change it per quote when sending. */
const DEFAULT_VALID_DAYS = 30;

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserWithRole(["finance", "super_admin"]);
  if (!user) return <NoAccess />;

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "*, clients(id, name, company), quote_items(id, position, description, quantity, unit_price_minor, line_total_minor), invoices(id, number, status)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!quote) notFound();

  const items = [...quote.quote_items].sort((a, b) => a.position - b.position);
  const today = nairobiDateIso();
  const clientName = quote.clients?.company ?? quote.clients?.name ?? "n/a";

  const back = (
    <Link
      href="/portal/finance/quotes"
      className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
    >
      <ArrowLeft className="size-4" /> All quotes
    </Link>
  );

  if (quote.status === "draft") {
    const clients = await getClientOptions();
    return (
      <>
        {back}
        <PageHeader
          title="Draft quote"
          description={`For ${clientName}. Drafts have no number until they're finalised.`}
          actions={<QuoteStatusBadge status="draft" />}
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <Panel>
            <InvoiceDraftEditor
              kind="quote"
              documentId={quote.id}
              clients={clients}
              initial={{
                clientId: quote.client_id,
                currency: quote.currency,
                title: quote.title ?? "",
                notes: quote.notes ?? "",
                items: items.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPriceMinor: item.unit_price_minor,
                })),
              }}
            />
          </Panel>
          <div className="flex flex-col gap-6">
            <Panel title="Finalise">
              <SendQuoteForm
                quoteId={quote.id}
                minDate={today}
                defaultValidUntil={nairobiDateIso(DEFAULT_VALID_DAYS)}
              />
            </Panel>
            <Panel title="Delete draft">
              <form action={deleteQuoteDraft}>
                <input type="hidden" name="quoteId" value={quote.id} />
                <Button type="submit" variant="outline" size="sm">
                  Delete this draft
                </Button>
              </form>
            </Panel>
          </div>
        </div>
      </>
    );
  }

  const client = parseClientSnapshot(quote.client_snapshot);
  const expired = isQuoteExpired(quote, today);

  return (
    <>
      {back}
      <PageHeader
        title={quote.number ?? "Quote"}
        description={`${client?.company ?? client?.name ?? clientName} · dated ${quote.issue_date} · valid until ${quote.valid_until}`}
        actions={
          <div className="flex items-center gap-3">
            <QuoteStatusBadge status={quote.status} expired={expired} />
            <Button asChild variant="outline" size="sm">
              <a
                href={`/portal/documents/quotes/${quote.id}`}
                target="_blank"
                rel="noopener"
              >
                <FileDown /> PDF
              </a>
            </Button>
          </div>
        }
      />

      {quote.decided_at ? (
        <p className="border-border bg-muted/40 mb-6 rounded-lg border p-4 text-sm">
          {QUOTE_STATUS_LABELS[quote.status]} {formatDateTime(quote.decided_at)}
          {quote.decision_note ? `: ${quote.decision_note}` : "."}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel title={quote.title ?? "Line items"}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground text-xs">
                <tr>
                  <th className="py-2 pr-4 font-medium">Description</th>
                  <th className="py-2 pr-4 text-right font-medium">Qty</th>
                  <th className="py-2 pr-4 text-right font-medium">Unit price</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y tabular-nums">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-4">{item.description}</td>
                    <td className="py-2 pr-4 text-right">{item.quantity}</td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap">
                      {formatMoney(item.unit_price_minor, quote.currency)}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {formatMoney(item.line_total_minor ?? 0, quote.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="tabular-nums">
                <tr>
                  <td colSpan={3} className="pt-3 text-right font-semibold">
                    Total
                  </td>
                  <td className="pt-3 text-right font-semibold whitespace-nowrap">
                    {formatMoney(quote.total_minor, quote.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {quote.notes ? (
            <p className="text-muted-foreground mt-4 text-sm whitespace-pre-wrap">
              {quote.notes}
            </p>
          ) : null}
        </Panel>

        <div className="flex flex-col gap-6">
          {quote.invoices ? (
            <Panel title="Invoice">
              <p className="text-sm">
                Turned into{" "}
                <Link
                  href={`/portal/finance/invoices/${quote.invoices.id}`}
                  className="text-primary underline underline-offset-2"
                >
                  {quote.invoices.number ?? "a draft invoice"}
                </Link>
                .
              </p>
            </Panel>
          ) : (
            <>
              {quote.status === "accepted" ? (
                <Panel title="Invoice the client">
                  <ConvertQuoteForm quoteId={quote.id} />
                </Panel>
              ) : null}
              <Panel
                title="Client's answer"
                description={
                  quote.status === "sent"
                    ? "Record it when the client replies."
                    : "Change it if the client changes their mind."
                }
              >
                <DecideQuoteForm quoteId={quote.id} current={quote.status} />
              </Panel>
            </>
          )}
        </div>
      </div>
    </>
  );
}
