import type { Database } from "@/lib/supabase/types";

export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export const INVOICE_STATUSES: readonly InvoiceStatus[] = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "credited",
  "void",
];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  partially_paid: "Partly paid",
  paid: "Paid",
  credited: "Credited",
  void: "Void",
};

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  "mpesa",
  "bank_transfer",
  "other",
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mpesa: "M-Pesa",
  bank_transfer: "Bank transfer",
  other: "Other",
};

/** Overdue = still owed and past its due date (dates are YYYY-MM-DD, Nairobi). */
export function isOverdue(
  invoice: { status: InvoiceStatus; due_date: string | null },
  today: string,
) {
  return (
    (invoice.status === "issued" || invoice.status === "partially_paid") &&
    invoice.due_date !== null &&
    invoice.due_date < today
  );
}

export type ExpenseCategory = Database["public"]["Enums"]["expense_category"];

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  "talent",
  "software",
  "hosting",
  "marketing",
  "office",
  "travel",
  "equipment",
  "fees_taxes",
  "other",
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  talent: "Talent and contractors",
  software: "Software and subscriptions",
  hosting: "Hosting and infrastructure",
  marketing: "Marketing and ads",
  office: "Office and admin",
  travel: "Travel and transport",
  equipment: "Equipment",
  fees_taxes: "Fees, charges and taxes",
  other: "Other",
};
