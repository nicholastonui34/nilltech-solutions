import "server-only";

import { getUserWithRole } from "@/lib/auth/dal";
import { csvAmount, toCsv, type CsvCell } from "@/lib/finance/csv";
import {
  EXPENSE_CATEGORY_LABELS,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/finance/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const EXPORT_KINDS = [
  "invoices",
  "payments",
  "credit-notes",
  "refunds",
  "expenses",
] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

/** Date range from ?month=YYYY-MM or ?year=YYYY; neither means all time. */
export function exportPeriod(params: URLSearchParams) {
  const month = params.get("month");
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
    return { from: `${month}-01`, to: next, label: month };
  }
  const year = params.get("year");
  if (year && /^\d{4}$/.test(year)) {
    return { from: `${year}-01-01`, to: `${Number(year) + 1}-01-01`, label: year };
  }
  return { from: null, to: null, label: "all" };
}

function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

const clientName = (client: { name: string; company: string | null } | null) =>
  client ? (client.company ?? client.name) : null;

/**
 * Finance CSV exports for the accountant (CLAUDE.md §10 Finance:
 * "exports"). Reads through the signed-in user's session, so RLS applies
 * on top of the role check. Drafts aren't exported: they aren't invoices
 * yet. Amounts stay in their own currency; nothing is converted.
 */
export async function financeExportResponse(kind: string, params: URLSearchParams) {
  const user = await getUserWithRole(["finance", "director", "super_admin"]);
  if (!user) return new Response("Not authorized", { status: 403 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return new Response("Not configured", { status: 503 });
  if (!(EXPORT_KINDS as readonly string[]).includes(kind)) {
    return new Response("Not found", { status: 404 });
  }

  const period = exportPeriod(params);
  const filename = `nilltech-${kind}-${period.label}.csv`;
  let header: string[];
  let rows: CsvCell[][];

  if (kind === "invoices") {
    let query = supabase
      .from("invoices")
      .select(
        "number, status, currency, issue_date, due_date, total_minor, paid_minor, credited_minor, refunded_minor, balance_minor, clients(name, company)",
      )
      .neq("status", "draft")
      .order("issue_date", { ascending: true })
      .order("number", { ascending: true });
    if (period.from && period.to) {
      query = query.gte("issue_date", period.from).lt("issue_date", period.to);
    }
    const { data } = await query;
    header = [
      "Invoice number",
      "Status",
      "Client",
      "Issue date",
      "Due date",
      "Currency",
      "Total",
      "Credited",
      "Paid",
      "Refunded",
      "Balance",
    ];
    rows = (data ?? []).map((i) => [
      i.number,
      INVOICE_STATUS_LABELS[i.status],
      clientName(i.clients),
      i.issue_date,
      i.due_date,
      i.currency,
      csvAmount(i.total_minor),
      csvAmount(i.credited_minor),
      csvAmount(i.paid_minor),
      csvAmount(i.refunded_minor),
      csvAmount(i.status === "void" ? 0 : (i.balance_minor ?? 0)),
    ]);
  } else if (kind === "payments") {
    let query = supabase
      .from("payments")
      .select(
        "receipt_number, paid_on, currency, amount_minor, method, reference, invoices(number, clients(name, company))",
      )
      .order("paid_on", { ascending: true })
      .order("receipt_number", { ascending: true });
    if (period.from && period.to) {
      query = query.gte("paid_on", period.from).lt("paid_on", period.to);
    }
    const { data } = await query;
    header = [
      "Receipt number",
      "Date paid",
      "Invoice number",
      "Client",
      "Currency",
      "Amount",
      "Method",
      "Reference",
    ];
    rows = (data ?? []).map((p) => [
      p.receipt_number,
      p.paid_on,
      p.invoices?.number,
      clientName(p.invoices?.clients ?? null),
      p.currency,
      csvAmount(p.amount_minor),
      PAYMENT_METHOD_LABELS[p.method],
      p.reference,
    ]);
  } else if (kind === "credit-notes") {
    let query = supabase
      .from("credit_notes")
      .select(
        "number, issue_date, invoice_number, currency, amount_minor, reason, invoices(clients(name, company))",
      )
      .order("issue_date", { ascending: true })
      .order("number", { ascending: true });
    if (period.from && period.to) {
      query = query.gte("issue_date", period.from).lt("issue_date", period.to);
    }
    const { data } = await query;
    header = [
      "Credit note number",
      "Date",
      "Invoice number",
      "Client",
      "Currency",
      "Amount",
      "Reason",
    ];
    rows = (data ?? []).map((c) => [
      c.number,
      c.issue_date,
      c.invoice_number,
      clientName(c.invoices?.clients ?? null),
      c.currency,
      csvAmount(c.amount_minor),
      c.reason,
    ]);
  } else if (kind === "refunds") {
    let query = supabase
      .from("refunds")
      .select(
        "number, refunded_on, currency, amount_minor, method, reference, reason, invoices(number, clients(name, company))",
      )
      .order("refunded_on", { ascending: true })
      .order("number", { ascending: true });
    if (period.from && period.to) {
      query = query.gte("refunded_on", period.from).lt("refunded_on", period.to);
    }
    const { data } = await query;
    header = [
      "Refund number",
      "Date refunded",
      "Invoice number",
      "Client",
      "Currency",
      "Amount",
      "Method",
      "Reference",
      "Reason",
    ];
    rows = (data ?? []).map((r) => [
      r.number,
      r.refunded_on,
      r.invoices?.number,
      clientName(r.invoices?.clients ?? null),
      r.currency,
      csvAmount(r.amount_minor),
      PAYMENT_METHOD_LABELS[r.method],
      r.reference,
      r.reason,
    ]);
  } else {
    let query = supabase
      .from("expenses")
      .select(
        "spent_on, description, category, vendor, currency, amount_minor, method, reference, notes, projects(name)",
      )
      .order("spent_on", { ascending: true })
      .order("created_at", { ascending: true });
    if (period.from && period.to) {
      query = query.gte("spent_on", period.from).lt("spent_on", period.to);
    }
    const { data } = await query;
    header = [
      "Date paid",
      "Description",
      "Category",
      "Paid to",
      "Project",
      "Currency",
      "Amount",
      "Method",
      "Reference",
      "Notes",
    ];
    rows = (data ?? []).map((e) => [
      e.spent_on,
      e.description,
      EXPENSE_CATEGORY_LABELS[e.category],
      e.vendor,
      e.projects?.name,
      e.currency,
      csvAmount(e.amount_minor),
      e.method ? PAYMENT_METHOD_LABELS[e.method] : null,
      e.reference,
      e.notes,
    ]);
  }

  return csvResponse(toCsv(header, rows), filename);
}
