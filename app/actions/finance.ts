"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getEtimsProvider } from "@/lib/etims/provider";
import { getUserWithRole } from "@/lib/auth/dal";
import { CURRENCIES, parseAmountToMinor, type Currency } from "@/lib/finance/money";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type ExpenseCategory,
  type PaymentMethod,
} from "@/lib/finance/labels";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Every action re-checks the role; RLS and the SECURITY DEFINER RPCs in
// the finance migration enforce the same rules in the database.

export type FinanceFormState = { error?: string; success?: string };

const FINANCE_ROLES = ["finance", "super_admin"] as const;

async function financeContext() {
  const user = await getUserWithRole(FINANCE_ROLES);
  if (!user) throw new Error("Not authorized.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase isn't configured.");
  return { user, supabase };
}

/** Postgres RAISE messages from the RPCs are written for people; pass them through. */
function dbMessage(error: { message: string }) {
  return error.message.charAt(0).toUpperCase() + error.message.slice(1) + ".";
}

const optionalText = z
  .string()
  .trim()
  .max(500)
  .transform((value) => value || null);

const currencySchema = z.enum(CURRENCIES as [Currency, ...Currency[]]);
const uuid = z.string().uuid();

// --- Clients ---------------------------------------------------------------

const clientSchema = z.object({
  name: z.string().trim().min(1, "Enter the client's name.").max(200),
  company: optionalText,
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email.")
    .transform((v) => v || null),
  phone: optionalText,
  address: optionalText,
});

function clientFields(formData: FormData) {
  return {
    name: formData.get("name") ?? "",
    company: formData.get("company") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
  };
}

export async function createClientRecord(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { user, supabase } = await financeContext();
  const parsed = clientSchema.safeParse(clientFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...parsed.data, created_by: user.id })
    .select("id")
    .single();
  if (error) return { error: dbMessage(error) };

  redirect(`/portal/finance/clients/${data.id}`);
}

export async function updateClientRecord(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const id = uuid.safeParse(formData.get("clientId"));
  const parsed = clientSchema.safeParse(clientFields(formData));
  if (!id.success) return { error: "Unknown client." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  // Optional portal login: link an existing account that has the `client`
  // role, looked up by email (auth emails aren't readable through RLS).
  const portalEmail = String(formData.get("portalEmail") ?? "")
    .trim()
    .toLowerCase();
  let userId: string | null = null;
  if (portalEmail) {
    const admin = getSupabaseAdmin();
    if (!admin)
      return { error: "SUPABASE_SERVICE_ROLE_KEY isn't set, so logins can't be linked." };
    const { data: list, error: listError } = await admin.auth.admin.listUsers({
      perPage: 1000,
    });
    if (listError) return { error: listError.message };
    const match = list.users.find((u) => u.email?.toLowerCase() === portalEmail);
    if (!match)
      return {
        error: `No portal account uses ${portalEmail}. Create it in Main Admin first.`,
      };
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", match.id)
      .eq("role", "client");
    if (!roles?.length)
      return { error: `${portalEmail} needs the Client role before it can be linked.` };
    userId = match.id;
  }

  const { error } = await supabase
    .from("clients")
    .update({ ...parsed.data, user_id: userId })
    .eq("id", id.data);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That login is already linked to another client."
          : dbMessage(error),
    };
  }

  refresh();
  return { success: "Client saved." };
}

// --- Invoices --------------------------------------------------------------

export async function createInvoiceDraft(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { user, supabase } = await financeContext();
  const clientId = uuid.safeParse(formData.get("clientId"));
  const currency = currencySchema.safeParse(formData.get("currency"));
  if (!clientId.success) return { error: "Choose a client." };
  if (!currency.success) return { error: "Choose a currency." };

  const { data, error } = await supabase
    .from("invoices")
    .insert({ client_id: clientId.data, currency: currency.data, created_by: user.id })
    .select("id")
    .single();
  if (error) return { error: dbMessage(error) };

  redirect(`/portal/finance/invoices/${data.id}`);
}

const draftItemSchema = z.object({
  description: z.string().trim().min(1, "Every line needs a description.").max(500),
  quantity: z.coerce
    .number()
    .positive("Quantities must be more than zero.")
    .max(99_999_999)
    .refine((q) => Number.isInteger(q * 100), "Quantities can have at most 2 decimals."),
  unitPrice: z.string(),
});

type DraftLine = {
  position: number;
  description: string;
  quantity: number;
  unit_price_minor: number;
};

/** Line items and notes posted by the draft editor (invoices and quotes). */
function parseDraftForm(
  formData: FormData,
): { error: string } | { lines: DraftLine[]; notes: string | null } {
  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Couldn't read the line items." };
  }
  const items = z.array(draftItemSchema).max(100).safeParse(rawItems);
  if (!items.success)
    return { error: items.error.issues[0]?.message ?? "Check the lines." };

  const lines: DraftLine[] = [];
  for (const [position, item] of items.data.entries()) {
    const unitPriceMinor = parseAmountToMinor(item.unitPrice);
    if (unitPriceMinor === null)
      return { error: `Line ${position + 1}: enter a valid price.` };
    lines.push({
      position,
      description: item.description,
      quantity: item.quantity,
      unit_price_minor: unitPriceMinor,
    });
  }

  const notes =
    String(formData.get("notes") ?? "")
      .trim()
      .slice(0, 2000) || null;
  return { lines, notes };
}

export async function saveInvoiceDraft(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const invoiceId = uuid.safeParse(formData.get("documentId"));
  const clientId = uuid.safeParse(formData.get("clientId"));
  const currency = currencySchema.safeParse(formData.get("currency"));
  if (!invoiceId.success || !clientId.success || !currency.success) {
    return { error: "Choose a client and currency." };
  }
  const draft = parseDraftForm(formData);
  if ("error" in draft) return { error: draft.error };

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ client_id: clientId.data, currency: currency.data, notes: draft.notes })
    .eq("id", invoiceId.data)
    .eq("status", "draft");
  if (updateError) return { error: dbMessage(updateError) };

  // Replace the draft's lines wholesale; RLS only allows this on drafts.
  const { error: deleteError } = await supabase
    .from("invoice_items")
    .delete()
    .eq("invoice_id", invoiceId.data);
  if (deleteError) return { error: dbMessage(deleteError) };

  if (draft.lines.length) {
    const { error: insertError } = await supabase
      .from("invoice_items")
      .insert(draft.lines.map((line) => ({ ...line, invoice_id: invoiceId.data })));
    if (insertError) return { error: dbMessage(insertError) };
  }

  refresh();
  return { success: "Draft saved." };
}

export async function deleteInvoiceDraft(formData: FormData) {
  const { supabase } = await financeContext();
  const invoiceId = uuid.parse(formData.get("invoiceId"));
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("status", "draft");
  if (error) throw new Error(error.message);
  redirect("/portal/finance/invoices");
}

export async function issueInvoice(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const invoiceId = uuid.safeParse(formData.get("invoiceId"));
  const dueDate = z.iso.date().safeParse(formData.get("dueDate"));
  if (!invoiceId.success) return { error: "Unknown invoice." };
  if (!dueDate.success) return { error: "Choose a due date." };

  const { data: number, error } = await supabase.rpc("issue_invoice", {
    _invoice_id: invoiceId.data,
    _due_date: dueDate.data,
  });
  if (error) return { error: dbMessage(error) };

  await submitToEtims(invoiceId.data);

  refresh();
  return { success: `Issued as ${number}.` };
}

/**
 * Hands the issued invoice to the eTIMS provider (a stub until an
 * integrator is chosen) and records the outcome. Never blocks issuing.
 */
async function submitToEtims(invoiceId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  const { data: invoice } = await admin
    .from("invoices")
    .select(
      "id, number, issue_date, currency, total_minor, seller_snapshot, client_snapshot, invoice_items(description, quantity, unit_price_minor, line_total_minor)",
    )
    .eq("id", invoiceId)
    .single();
  if (!invoice?.number || !invoice.issue_date) return;

  const seller = invoice.seller_snapshot as { kra_pin?: string | null } | null;
  const client = invoice.client_snapshot as { name?: string } | null;

  const result = await getEtimsProvider().submitInvoice({
    invoiceId: invoice.id,
    number: invoice.number,
    issueDate: invoice.issue_date,
    currency: invoice.currency,
    totalMinor: invoice.total_minor,
    sellerPin: seller?.kra_pin ?? null,
    buyerName: client?.name ?? "",
    items: invoice.invoice_items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceMinor: item.unit_price_minor,
      lineTotalMinor: item.line_total_minor ?? 0,
    })),
  });

  const status =
    result.status === "submitted"
      ? "submitted"
      : result.status === "failed"
        ? "failed"
        : "not_configured";

  await admin
    .from("invoices")
    .update({
      etims_status: status,
      etims_reference: result.status === "submitted" ? result.reference : null,
    })
    .eq("id", invoiceId);

  await admin.from("automation_runs").insert({
    type: "etims_submission",
    status:
      result.status === "submitted"
        ? "success"
        : result.status === "failed"
          ? "failed"
          : "skipped_not_configured",
    related_entity_type: "invoices",
    related_entity_id: invoiceId,
    error: result.status === "failed" ? result.error : null,
  });
}

export async function voidInvoice(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const invoiceId = uuid.safeParse(formData.get("invoiceId"));
  if (!invoiceId.success) return { error: "Unknown invoice." };

  const { error } = await supabase.rpc("void_invoice", {
    _invoice_id: invoiceId.data,
    _reason: String(formData.get("reason") ?? ""),
  });
  if (error) return { error: dbMessage(error) };

  refresh();
  return { success: "Invoice voided." };
}

export async function recordPayment(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const invoiceId = uuid.safeParse(formData.get("invoiceId"));
  const method = z
    .enum(PAYMENT_METHODS as [PaymentMethod, ...PaymentMethod[]])
    .safeParse(formData.get("method"));
  const paidOn = z.iso.date().safeParse(formData.get("paidOn"));
  const amountMinor = parseAmountToMinor(String(formData.get("amount") ?? ""));
  if (!invoiceId.success) return { error: "Unknown invoice." };
  if (amountMinor === null || amountMinor <= 0)
    return { error: "Enter the amount received." };
  if (!method.success) return { error: "Choose how it was paid." };
  if (!paidOn.success) return { error: "Choose the date it was paid." };

  const { error } = await supabase.rpc("record_payment", {
    _invoice_id: invoiceId.data,
    _amount_minor: amountMinor,
    _method: method.data,
    _reference: String(formData.get("reference") ?? ""),
    _paid_on: paidOn.data,
    _notes: String(formData.get("notes") ?? ""),
  });
  if (error) return { error: dbMessage(error) };

  refresh();
  return { success: "Payment recorded and receipt issued." };
}

// --- Credit notes and refunds ----------------------------------------------
// The issue_credit_note and record_refund RPCs check the role, the limits
// (credits never exceed the invoice; refunds never exceed the client's
// credit), number the document and write the audit log.

export async function issueCreditNote(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const invoiceId = uuid.safeParse(formData.get("invoiceId"));
  const amountMinor = parseAmountToMinor(String(formData.get("amount") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!invoiceId.success) return { error: "Unknown invoice." };
  if (amountMinor === null || amountMinor <= 0)
    return { error: "Enter the amount to credit." };
  if (reason.length < 3) return { error: "Give a reason for the credit note." };

  const { error } = await supabase.rpc("issue_credit_note", {
    _invoice_id: invoiceId.data,
    _amount_minor: amountMinor,
    _reason: reason,
  });
  if (error) return { error: dbMessage(error) };

  refresh();
  return { success: "Credit note issued." };
}

export async function recordRefund(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const invoiceId = uuid.safeParse(formData.get("invoiceId"));
  const method = z
    .enum(PAYMENT_METHODS as [PaymentMethod, ...PaymentMethod[]])
    .safeParse(formData.get("method"));
  const refundedOn = z.iso.date().safeParse(formData.get("refundedOn"));
  const amountMinor = parseAmountToMinor(String(formData.get("amount") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!invoiceId.success) return { error: "Unknown invoice." };
  if (amountMinor === null || amountMinor <= 0)
    return { error: "Enter the amount refunded." };
  if (!method.success) return { error: "Choose how it was refunded." };
  if (!refundedOn.success) return { error: "Choose the date of the refund." };
  if (reason.length < 3) return { error: "Give a reason for the refund." };

  const { error } = await supabase.rpc("record_refund", {
    _invoice_id: invoiceId.data,
    _amount_minor: amountMinor,
    _method: method.data,
    _reference: String(formData.get("reference") ?? ""),
    _refunded_on: refundedOn.data,
    _reason: reason,
  });
  if (error) return { error: dbMessage(error) };

  refresh();
  return { success: "Refund recorded." };
}

// --- Settings --------------------------------------------------------------

const settingsSchema = z.object({
  legal_name: z.string().trim().min(2, "Enter the legal name."),
  kra_pin: optionalText,
  address_lines: z.string().transform((v) =>
    v
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 6),
  ),
  email: optionalText,
  phone: optionalText,
  bank_name: optionalText,
  bank_branch: optionalText,
  bank_account_name: optionalText,
  bank_account_number: optionalText,
  bank_swift: optionalText,
  bank_account_currency: z
    .union([currencySchema, z.literal("")])
    .transform((v) => v || null),
  mpesa_paybill: optionalText,
  mpesa_account: optionalText,
  invoice_footer: optionalText,
  default_payment_terms_days: z.coerce.number().int().min(0).max(365),
});

export async function updateFinanceSettings(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { user, supabase } = await financeContext();
  const fields = Object.fromEntries(
    Object.keys(settingsSchema.shape).map((key) => [key, formData.get(key) ?? ""]),
  );
  const parsed = settingsSchema.safeParse(fields);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await supabase
    .from("finance_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", true);
  if (error) return { error: dbMessage(error) };

  refresh();
  return {
    success: "Saved. New invoices will use these details; issued ones keep theirs.",
  };
}

// --- Expenses --------------------------------------------------------------

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");

const expenseSchema = z.object({
  spent_on: isoDate,
  description: z.string().trim().min(1, "Describe the expense.").max(300),
  category: z.enum(EXPENSE_CATEGORIES as [ExpenseCategory, ...ExpenseCategory[]], {
    error: "Choose a category.",
  }),
  amount: z.string(),
  currency: currencySchema,
  vendor: optionalText,
  method: z
    .enum(["", ...PAYMENT_METHODS] as [string, ...string[]])
    .transform((v) => (v ? (v as PaymentMethod) : null)),
  reference: optionalText,
  project_id: z
    .string()
    .transform((v) => v || null)
    .refine((v) => v === null || uuid.safeParse(v).success, "Unknown project."),
  notes: z
    .string()
    .trim()
    .max(2000)
    .transform((v) => v || null),
});

function parseExpense(formData: FormData) {
  const parsed = expenseSchema.safeParse({
    spent_on: formData.get("spent_on") ?? "",
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "",
    amount: formData.get("amount") ?? "",
    currency: formData.get("currency") ?? "",
    vendor: formData.get("vendor") ?? "",
    method: formData.get("method") ?? "",
    reference: formData.get("reference") ?? "",
    project_id: formData.get("project_id") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message } as const;
  const { amount, ...rest } = parsed.data;
  const amountMinor = parseAmountToMinor(amount);
  if (!amountMinor) return { error: "Enter an amount above zero." } as const;
  return { values: { ...rest, amount_minor: amountMinor } } as const;
}

export async function createExpense(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { user, supabase } = await financeContext();
  const result = parseExpense(formData);
  if ("error" in result) return { error: result.error };

  const { error } = await supabase
    .from("expenses")
    .insert({ ...result.values, created_by: user.id });
  if (error) return { error: dbMessage(error) };

  refresh();
  return { success: `Added: ${result.values.description}.` };
}

export async function updateExpense(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const id = uuid.safeParse(formData.get("expenseId"));
  if (!id.success) return { error: "Unknown expense." };
  const result = parseExpense(formData);
  if ("error" in result) return { error: result.error };

  const { error } = await supabase
    .from("expenses")
    .update(result.values)
    .eq("id", id.data);
  if (error) return { error: dbMessage(error) };

  refresh();
  return { success: "Expense saved." };
}

export async function deleteExpense(formData: FormData) {
  const { supabase } = await financeContext();
  const id = uuid.safeParse(formData.get("expenseId"));
  if (!id.success) throw new Error("Unknown expense.");
  const { error } = await supabase.from("expenses").delete().eq("id", id.data);
  if (error) throw new Error(dbMessage(error));
  redirect("/portal/finance/expenses");
}

// --- Quotes ----------------------------------------------------------------
// Drafts are edited through RLS like invoice drafts; send_quote,
// decide_quote and convert_quote_to_invoice do the rest in the database.

export async function createQuoteDraft(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { user, supabase } = await financeContext();
  const clientId = uuid.safeParse(formData.get("clientId"));
  const currency = currencySchema.safeParse(formData.get("currency"));
  if (!clientId.success) return { error: "Choose a client." };
  if (!currency.success) return { error: "Choose a currency." };

  const { data, error } = await supabase
    .from("quotes")
    .insert({ client_id: clientId.data, currency: currency.data, created_by: user.id })
    .select("id")
    .single();
  if (error) return { error: dbMessage(error) };

  redirect(`/portal/finance/quotes/${data.id}`);
}

export async function saveQuoteDraft(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const quoteId = uuid.safeParse(formData.get("documentId"));
  const clientId = uuid.safeParse(formData.get("clientId"));
  const currency = currencySchema.safeParse(formData.get("currency"));
  if (!quoteId.success || !clientId.success || !currency.success) {
    return { error: "Choose a client and currency." };
  }
  const title =
    String(formData.get("title") ?? "")
      .trim()
      .slice(0, 200) || null;
  const draft = parseDraftForm(formData);
  if ("error" in draft) return { error: draft.error };

  const { error: updateError } = await supabase
    .from("quotes")
    .update({
      client_id: clientId.data,
      currency: currency.data,
      title,
      notes: draft.notes,
    })
    .eq("id", quoteId.data)
    .eq("status", "draft");
  if (updateError) return { error: dbMessage(updateError) };

  const { error: deleteError } = await supabase
    .from("quote_items")
    .delete()
    .eq("quote_id", quoteId.data);
  if (deleteError) return { error: dbMessage(deleteError) };

  if (draft.lines.length) {
    const { error: insertError } = await supabase
      .from("quote_items")
      .insert(draft.lines.map((line) => ({ ...line, quote_id: quoteId.data })));
    if (insertError) return { error: dbMessage(insertError) };
  }

  refresh();
  return { success: "Draft saved." };
}

export async function deleteQuoteDraft(formData: FormData) {
  const { supabase } = await financeContext();
  const quoteId = uuid.parse(formData.get("quoteId"));
  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", quoteId)
    .eq("status", "draft");
  if (error) throw new Error(error.message);
  redirect("/portal/finance/quotes");
}

export async function sendQuote(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const quoteId = uuid.safeParse(formData.get("quoteId"));
  const validUntil = z.iso.date().safeParse(formData.get("validUntil"));
  if (!quoteId.success) return { error: "Unknown quote." };
  if (!validUntil.success) return { error: "Choose how long the quote is valid." };

  const { data: number, error } = await supabase.rpc("send_quote", {
    _quote_id: quoteId.data,
    _valid_until: validUntil.data,
  });
  if (error) return { error: dbMessage(error) };

  // Emailing the quote waits on Resend (CLAUDE.md §8); finance sends the PDF.
  refresh();
  return { success: `Numbered ${number}. Download the PDF and send it to the client.` };
}

export async function decideQuote(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const quoteId = uuid.safeParse(formData.get("quoteId"));
  const outcome = z.enum(["accepted", "declined"]).safeParse(formData.get("outcome"));
  if (!quoteId.success) return { error: "Unknown quote." };
  if (!outcome.success) return { error: "Choose accepted or declined." };

  const { error } = await supabase.rpc("decide_quote", {
    _quote_id: quoteId.data,
    _outcome: outcome.data,
    _note: String(formData.get("note") ?? "").slice(0, 500),
  });
  if (error) return { error: dbMessage(error) };

  refresh();
  return {
    success: outcome.data === "accepted" ? "Marked as accepted." : "Marked as declined.",
  };
}

export async function convertQuoteToInvoice(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const quoteId = uuid.safeParse(formData.get("quoteId"));
  if (!quoteId.success) return { error: "Unknown quote." };

  const { data: invoiceId, error } = await supabase.rpc("convert_quote_to_invoice", {
    _quote_id: quoteId.data,
  });
  if (error) return { error: dbMessage(error) };

  redirect(`/portal/finance/invoices/${invoiceId}`);
}

// --- Freelancer payments -----------------------------------------------------
// record_freelancer_payment also creates the matching "talent" expense, so
// margins stay right; voiding removes that expense again.

export async function recordFreelancerPayment(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const talentId = uuid.safeParse(formData.get("talentId"));
  const currency = currencySchema.safeParse(formData.get("currency"));
  const method = z
    .enum(PAYMENT_METHODS as [PaymentMethod, ...PaymentMethod[]])
    .safeParse(formData.get("method"));
  const paidOn = z.iso.date().safeParse(formData.get("paidOn"));
  const projectId = String(formData.get("projectId") ?? "");
  const amountMinor = parseAmountToMinor(String(formData.get("amount") ?? ""));
  if (!talentId.success) return { error: "Choose who was paid." };
  if (amountMinor === null || amountMinor <= 0)
    return { error: "Enter the amount paid." };
  if (!currency.success) return { error: "Choose a currency." };
  if (!method.success) return { error: "Choose how it was paid." };
  if (!paidOn.success) return { error: "Choose the date it was paid." };
  if (projectId && !uuid.safeParse(projectId).success)
    return { error: "Unknown project." };

  const { error } = await supabase.rpc("record_freelancer_payment", {
    _talent_id: talentId.data,
    _amount_minor: amountMinor,
    _currency: currency.data,
    _method: method.data,
    _reference: String(formData.get("reference") ?? ""),
    _paid_on: paidOn.data,
    _description: String(formData.get("description") ?? ""),
    // The RPC treats null as "no project"; the generated type is non-null.
    _project_id: (projectId || null) as string,
  });
  if (error) return { error: dbMessage(error) };

  refresh();
  return {
    success: "Payment recorded, added to expenses, and visible to the freelancer.",
  };
}

export async function voidFreelancerPayment(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const { supabase } = await financeContext();
  const paymentId = uuid.safeParse(formData.get("paymentId"));
  if (!paymentId.success) return { error: "Unknown payment." };

  const { error } = await supabase.rpc("void_freelancer_payment", {
    _payment_id: paymentId.data,
    _reason: String(formData.get("reason") ?? ""),
  });
  if (error) return { error: dbMessage(error) };

  refresh();
  return { success: "Payment voided and its expense removed." };
}
