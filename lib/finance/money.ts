import type { Database } from "@/lib/supabase/types";

export type Currency = Database["public"]["Enums"]["currency_code"];

export const CURRENCIES: readonly Currency[] = ["KES", "USD"];

const formatters: Record<Currency, Intl.NumberFormat> = {
  KES: new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
};

/** Amounts are stored as integer minor units (cents) — see the finance migration. */
export function formatMoney(minor: number, currency: Currency) {
  return formatters[currency].format(minor / 100);
}

/** Plain "1,234.50" without a currency symbol, for PDFs and inputs. */
export function formatAmount(minor: number) {
  return (minor / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parses a user-typed amount ("1,500", "1500.5") into minor units without
 * going through floating-point multiplication. Returns null if invalid.
 */
export function parseAmountToMinor(input: string): number | null {
  const cleaned = input.replace(/,/g, "").trim();
  const match = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  return whole * 100 + fraction;
}

/** Same rounding as the database's generated line_total_minor column. */
export function lineTotalMinor(quantity: number, unitPriceMinor: number) {
  return Math.round(quantity * unitPriceMinor);
}
