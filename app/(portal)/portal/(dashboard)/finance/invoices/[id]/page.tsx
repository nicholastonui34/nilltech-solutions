import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";

import { deleteInvoiceDraft } from "@/app/actions/finance";
import { InvoiceDraftEditor } from "@/components/portal/finance/invoice-draft-editor";
import {
  IssueCreditNoteForm,
  IssueInvoiceForm,
  RecordPaymentForm,
  RecordRefundForm,
  VoidInvoiceForm,
} from "@/components/portal/finance/invoice-actions";
import { InvoiceStatusBadge } from "@/components/portal/finance/invoice-status-badge";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { Button } from "@/components/ui/button";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime, nairobiDateIso } from "@/lib/format";
import { isOverdue, PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import { formatMoney } from "@/lib/finance/money";
import { getClientOptions } from "@/lib/finance/queries";
import { parseClientSnapshot } from "@/lib/finance/snapshots";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ETIMS_LABELS: Record<string, string> = {
  not_submitted: "Not submitted",
  not_configured: "Not sent: no eTIMS integrator connected yet",
  submitted: "Submitted",
  failed: "Submission failed",
};

export default async function InvoiceDetailPage({
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

  const [{ data: invoice }, { data: settings }] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "*, clients(id, name, company, email), invoice_items(id, position, description, quantity, unit_price_minor, line_total_minor), payments(id, receipt_number, amount_minor, method, reference, paid_on, recorded_at), credit_notes(id, number, amount_minor, reason, issue_date, issued_at), refunds(id, number, amount_minor, method, reference, refunded_on, reason, recorded_at)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("finance_settings").select("default_payment_terms_days").maybeSingle(),
  ]);
  if (!invoice) notFound();

  const items = [...invoice.invoice_items].sort((a, b) => a.position - b.position);
  const payments = [...invoice.payments].sort((a, b) =>
    a.paid_on.localeCompare(b.paid_on),
  );
  const creditNotes = [...invoice.credit_notes].sort((a, b) =>
    a.issued_at.localeCompare(b.issued_at),
  );
  const refunds = [...invoice.refunds].sort((a, b) =>
    a.recorded_at.localeCompare(b.recorded_at),
  );
  const today = nairobiDateIso();
  // Total, less credit notes, less payments kept (paid minus refunded).
  // Negative means the client has credit to be refunded.
  const balance =
    invoice.balance_minor ??
    invoice.total_minor -
      invoice.credited_minor -
      (invoice.paid_minor - invoice.refunded_minor);
  const creditable = invoice.total_minor - invoice.credited_minor;
  const canCredit =
    (invoice.status === "issued" ||
      invoice.status === "partially_paid" ||
      invoice.status === "paid") &&
    creditable > 0;
  const clientName = invoice.clients?.company ?? invoice.clients?.name ?? "n/a";

  const back = (
    <Link
      href="/portal/finance/invoices"
      className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
    >
      <ArrowLeft className="size-4" /> All invoices
    </Link>
  );

  if (invoice.status === "draft") {
    const clients = await getClientOptions();
    return (
      <>
        {back}
        <PageHeader
          title="Draft invoice"
          description={`For ${clientName}. Drafts have no number until they're issued.`}
          actions={<InvoiceStatusBadge status="draft" />}
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <Panel>
            <InvoiceDraftEditor
              documentId={invoice.id}
              clients={clients}
              initial={{
                clientId: invoice.client_id,
                currency: invoice.currency,
                notes: invoice.notes ?? "",
                items: items.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPriceMinor: item.unit_price_minor,
                })),
              }}
            />
          </Panel>
          <div className="flex flex-col gap-6">
            <Panel title="Issue">
              <IssueInvoiceForm
                invoiceId={invoice.id}
                minDate={today}
                defaultDueDate={nairobiDateIso(
                  settings?.default_payment_terms_days ?? 14,
                )}
              />
            </Panel>
            <Panel title="Delete draft">
              <form action={deleteInvoiceDraft}>
                <input type="hidden" name="invoiceId" value={invoice.id} />
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

  const client = parseClientSnapshot(invoice.client_snapshot);

  return (
    <>
      {back}
      <PageHeader
        title={invoice.number ?? "Invoice"}
        description={`${client?.company ?? client?.name ?? clientName} · issued ${invoice.issue_date} · due ${invoice.due_date}`}
        actions={
          <div className="flex items-center gap-3">
            <InvoiceStatusBadge
              status={invoice.status}
              overdue={isOverdue(invoice, today)}
            />
            <Button asChild variant="outline" size="sm">
              <a
                href={`/portal/documents/invoices/${invoice.id}`}
                target="_blank"
                rel="noopener"
              >
                <FileDown /> PDF
              </a>
            </Button>
          </div>
        }
      />

      {invoice.status === "void" ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Voided {formatDateTime(invoice.voided_at)}: {invoice.void_reason}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Panel title="Line items">
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
                        {formatMoney(item.unit_price_minor, invoice.currency)}
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        {formatMoney(item.line_total_minor ?? 0, invoice.currency)}
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
                      {formatMoney(invoice.total_minor, invoice.currency)}
                    </td>
                  </tr>
                  {invoice.credited_minor > 0 ? (
                    <tr>
                      <td colSpan={3} className="text-muted-foreground text-right">
                        Less credit notes
                      </td>
                      <td className="text-muted-foreground text-right whitespace-nowrap">
                        {formatMoney(invoice.credited_minor, invoice.currency)}
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td colSpan={3} className="text-muted-foreground text-right">
                      Paid
                    </td>
                    <td className="text-muted-foreground text-right whitespace-nowrap">
                      {formatMoney(invoice.paid_minor, invoice.currency)}
                    </td>
                  </tr>
                  {invoice.refunded_minor > 0 ? (
                    <tr>
                      <td colSpan={3} className="text-muted-foreground text-right">
                        Refunded
                      </td>
                      <td className="text-muted-foreground text-right whitespace-nowrap">
                        {formatMoney(invoice.refunded_minor, invoice.currency)}
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td colSpan={3} className="text-right font-semibold">
                      {balance < 0 ? "Credit owed to client" : "Balance due"}
                    </td>
                    <td className="text-right font-semibold whitespace-nowrap">
                      {invoice.status === "void"
                        ? "n/a"
                        : formatMoney(Math.abs(balance), invoice.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {invoice.notes ? (
              <p className="text-muted-foreground mt-4 text-sm whitespace-pre-wrap">
                {invoice.notes}
              </p>
            ) : null}
          </Panel>

          <Panel title="Payments & receipts">
            {payments.length ? (
              <ul className="divide-border divide-y">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium tabular-nums">
                        {formatMoney(payment.amount_minor, invoice.currency)} ·{" "}
                        {PAYMENT_METHOD_LABELS[payment.method]}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {payment.receipt_number} · paid {payment.paid_on}
                        {payment.reference ? ` · ref ${payment.reference}` : ""}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`/portal/documents/receipts/${payment.id}`}
                        target="_blank"
                        rel="noopener"
                      >
                        <FileDown /> Receipt
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No payments recorded.</p>
            )}
          </Panel>

          {creditNotes.length ? (
            <Panel title="Credit notes">
              <ul className="divide-border divide-y">
                {creditNotes.map((note) => (
                  <li
                    key={note.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium tabular-nums">
                        {formatMoney(note.amount_minor, invoice.currency)} credited
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {note.number} · {note.issue_date} · {note.reason}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`/portal/documents/credit-notes/${note.id}`}
                        target="_blank"
                        rel="noopener"
                      >
                        <FileDown /> Credit note
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {refunds.length ? (
            <Panel title="Refunds">
              <ul className="divide-border divide-y">
                {refunds.map((refund) => (
                  <li key={refund.id} className="py-3 text-sm">
                    <p className="font-medium tabular-nums">
                      {formatMoney(refund.amount_minor, invoice.currency)} refunded ·{" "}
                      {PAYMENT_METHOD_LABELS[refund.method]}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {refund.number} · {refund.refunded_on}
                      {refund.reference ? ` · ref ${refund.reference}` : ""} ·{" "}
                      {refund.reason}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          {(invoice.status === "issued" || invoice.status === "partially_paid") &&
          balance > 0 ? (
            <Panel title="Record a payment">
              <RecordPaymentForm
                invoiceId={invoice.id}
                currency={invoice.currency}
                balance={(balance / 100).toFixed(2)}
                today={today}
              />
            </Panel>
          ) : null}
          {balance < 0 ? (
            <Panel
              title="Record a refund"
              description="The client has paid more than they now owe on this invoice."
            >
              <RecordRefundForm
                invoiceId={invoice.id}
                currency={invoice.currency}
                maxAmount={(-balance / 100).toFixed(2)}
                today={today}
              />
            </Panel>
          ) : null}
          {canCredit ? (
            <Panel
              title="Issue a credit note"
              description="Reduce or cancel what this invoice is owed. If the client has already paid, record a refund afterwards."
            >
              <IssueCreditNoteForm
                invoiceId={invoice.id}
                currency={invoice.currency}
                maxAmount={(creditable / 100).toFixed(2)}
              />
            </Panel>
          ) : null}
          {invoice.status === "issued" &&
          invoice.paid_minor === 0 &&
          invoice.credited_minor === 0 ? (
            <Panel title="Void">
              <VoidInvoiceForm invoiceId={invoice.id} />
            </Panel>
          ) : null}
          <Panel title="KRA eTIMS">
            <p className="text-sm">
              {ETIMS_LABELS[invoice.etims_status] ?? invoice.etims_status}
            </p>
            {invoice.etims_reference ? (
              <p className="text-muted-foreground mt-1 text-xs">
                Ref {invoice.etims_reference}
              </p>
            ) : null}
          </Panel>
        </div>
      </div>
    </>
  );
}
