import type { Currency } from "@/lib/finance/money";
import type { Json } from "@/lib/supabase/types";

/** Seller details frozen onto an invoice when it's issued (finance_settings at that moment). */
export type SellerSnapshot = {
  legal_name: string;
  kra_pin: string | null;
  address_lines: string[];
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_swift: string | null;
  bank_account_currency: Currency | null;
  mpesa_paybill: string | null;
  mpesa_account: string | null;
  invoice_footer: string | null;
};

export type ClientSnapshot = {
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

function isObject(value: Json | null): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const str = (value: Json | undefined) => (typeof value === "string" ? value : null);

export function parseSellerSnapshot(value: Json | null): SellerSnapshot | null {
  if (!isObject(value) || typeof value.legal_name !== "string") return null;
  const currency = str(value.bank_account_currency);
  return {
    legal_name: value.legal_name,
    kra_pin: str(value.kra_pin),
    address_lines: Array.isArray(value.address_lines)
      ? value.address_lines.filter((line): line is string => typeof line === "string")
      : [],
    email: str(value.email),
    phone: str(value.phone),
    bank_name: str(value.bank_name),
    bank_branch: str(value.bank_branch),
    bank_account_name: str(value.bank_account_name),
    bank_account_number: str(value.bank_account_number),
    bank_swift: str(value.bank_swift),
    bank_account_currency: currency === "KES" || currency === "USD" ? currency : null,
    mpesa_paybill: str(value.mpesa_paybill),
    mpesa_account: str(value.mpesa_account),
    invoice_footer: str(value.invoice_footer),
  };
}

export function parseClientSnapshot(value: Json | null): ClientSnapshot | null {
  if (!isObject(value) || typeof value.name !== "string") return null;
  return {
    name: value.name,
    company: str(value.company),
    email: str(value.email),
    phone: str(value.phone),
    address: str(value.address),
  };
}
