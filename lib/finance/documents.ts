import "server-only";

import { getCurrentUser } from "@/lib/auth/dal";
import { buildCreditNotePdf, buildInvoicePdf, buildReceiptPdf } from "@/lib/finance/pdf";
import { parseClientSnapshot, parseSellerSnapshot } from "@/lib/finance/snapshots";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pdfResponse(bytes: Uint8Array, filename: string) {
  return new Response(new Blob([bytes as BlobPart], { type: "application/pdf" }), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

const notFound = () => new Response("Not found", { status: 404 });

/**
 * Reads through the signed-in user's own Supabase session, so RLS decides
 * who can download what: finance/director/super_admin see every issued
 * document, a client only their own. Drafts never render.
 */
export async function invoicePdfResponse(id: string) {
  if (!UUID_PATTERN.test(id)) return notFound();
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in required", { status: 401 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return notFound();

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "number, status, currency, issue_date, due_date, total_minor, paid_minor, credited_minor, refunded_minor, notes, seller_snapshot, client_snapshot, invoice_items(position, description, quantity, unit_price_minor, line_total_minor)",
    )
    .eq("id", id)
    .maybeSingle();

  const seller = parseSellerSnapshot(invoice?.seller_snapshot ?? null);
  const client = parseClientSnapshot(invoice?.client_snapshot ?? null);
  if (
    !invoice ||
    invoice.status === "draft" ||
    !invoice.number ||
    !invoice.issue_date ||
    !invoice.due_date ||
    !seller ||
    !client
  ) {
    return notFound();
  }

  const bytes = await buildInvoicePdf({
    number: invoice.number,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    status: invoice.status,
    currency: invoice.currency,
    seller,
    client,
    items: [...invoice.invoice_items]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPriceMinor: item.unit_price_minor,
        lineTotalMinor: item.line_total_minor ?? 0,
      })),
    totalMinor: invoice.total_minor,
    paidMinor: invoice.paid_minor,
    creditedMinor: invoice.credited_minor,
    refundedMinor: invoice.refunded_minor,
    notes: invoice.notes,
  });

  return pdfResponse(bytes, `${invoice.number}.pdf`);
}

export async function receiptPdfResponse(id: string) {
  if (!UUID_PATTERN.test(id)) return notFound();
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in required", { status: 401 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return notFound();

  const { data: payment } = await supabase
    .from("payments")
    .select(
      "receipt_number, amount_minor, currency, method, reference, paid_on, recorded_at, invoice_id, invoices(number, total_minor, seller_snapshot, client_snapshot)",
    )
    .eq("id", id)
    .maybeSingle();
  const invoice = payment?.invoices;
  const seller = parseSellerSnapshot(invoice?.seller_snapshot ?? null);
  const client = parseClientSnapshot(invoice?.client_snapshot ?? null);
  if (!payment || !invoice?.number || !seller || !client) return notFound();

  // "Paid to date" as of this receipt, so reprinting an old receipt shows
  // the balance it originally showed.
  const { data: earlier } = await supabase
    .from("payments")
    .select("amount_minor, recorded_at")
    .eq("invoice_id", payment.invoice_id)
    .lte("recorded_at", payment.recorded_at);
  const paidToDate = (earlier ?? []).reduce((sum, p) => sum + p.amount_minor, 0);
  const { data: credits } = await supabase
    .from("credit_notes")
    .select("amount_minor")
    .eq("invoice_id", payment.invoice_id)
    .lte("issued_at", payment.recorded_at);
  const creditedToDate = (credits ?? []).reduce((sum, c) => sum + c.amount_minor, 0);

  const bytes = await buildReceiptPdf({
    receiptNumber: payment.receipt_number,
    paidOn: payment.paid_on,
    amountMinor: payment.amount_minor,
    currency: payment.currency,
    method: payment.method,
    reference: payment.reference,
    invoiceNumber: invoice.number,
    invoiceTotalMinor: invoice.total_minor,
    paidToDateMinor: paidToDate,
    creditedToDateMinor: creditedToDate,
    seller,
    client,
  });

  return pdfResponse(bytes, `${payment.receipt_number}.pdf`);
}

export async function creditNotePdfResponse(id: string) {
  if (!UUID_PATTERN.test(id)) return notFound();
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in required", { status: 401 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return notFound();

  const { data: note } = await supabase
    .from("credit_notes")
    .select(
      "number, invoice_number, amount_minor, currency, reason, issue_date, seller_snapshot, client_snapshot, invoices(total_minor)",
    )
    .eq("id", id)
    .maybeSingle();
  const seller = parseSellerSnapshot(note?.seller_snapshot ?? null);
  const client = parseClientSnapshot(note?.client_snapshot ?? null);
  if (!note || !note.invoices || !seller || !client) return notFound();

  const bytes = await buildCreditNotePdf({
    number: note.number,
    issueDate: note.issue_date,
    invoiceNumber: note.invoice_number,
    invoiceTotalMinor: note.invoices.total_minor,
    amountMinor: note.amount_minor,
    currency: note.currency,
    reason: note.reason,
    seller,
    client,
  });

  return pdfResponse(bytes, `${note.number}.pdf`);
}
