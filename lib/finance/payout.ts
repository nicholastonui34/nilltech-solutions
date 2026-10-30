import type { Json } from "@/lib/supabase/types";

/**
 * Freelancer payouts (owner, 2026-10-30): M-Pesa or bank transfer to a
 * Kenyan bank only. The database enforces the same two methods.
 */
export const PAYOUT_METHODS = ["mpesa", "bank_transfer"] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  mpesa: "M-Pesa",
  bank_transfer: "Bank transfer (Kenyan bank)",
};

export type PayoutDetails = {
  preferredMethod: PayoutMethod;
  mpesaNumber: string | null;
  mpesaName: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
};

/** 254712345678 → 0712 345 678, the way Kenyans write it. */
export function formatMpesaNumber(number: string) {
  const local = number.replace(/^254/, "0");
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** Keeps only the last 4 characters visible, for documents and lists. */
export function maskTail(value: string, visible = 4) {
  return value.length <= visible
    ? value
    : `${"•".repeat(Math.min(value.length - visible, 6))}${value.slice(-visible)}`;
}

/** One line describing where a payout went, with the account masked. */
export function describePayout(snapshot: Json | null, mask = true): string | null {
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) {
    return null;
  }
  const s = snapshot as Record<string, Json | undefined>;
  const str = (key: string) => (typeof s[key] === "string" ? (s[key] as string) : "");
  if (s.method === "mpesa") {
    const number = str("mpesa_number");
    const shown = mask ? maskTail(number) : formatMpesaNumber(number);
    return `M-Pesa ${shown} (${str("mpesa_name")})`;
  }
  if (s.method === "bank_transfer") {
    const account = str("bank_account_number");
    const shown = mask ? maskTail(account) : account;
    const branch = str("bank_branch") ? `, ${str("bank_branch")}` : "";
    return `${str("bank_name")}${branch}, account ${shown} (${str("bank_account_name")})`;
  }
  return null;
}
