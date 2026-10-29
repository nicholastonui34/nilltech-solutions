import "server-only";

import { CURRENCIES, type Currency } from "@/lib/finance/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrencyTotals = {
  collectedAll: number;
  collectedYear: number;
  spentAll: number;
  spentYear: number;
  receivables: number;
  /** Book net worth, cash basis: collected minus spent, plus money owed to us. */
  netWorth: number;
  profitYear: number;
  profitAll: number;
};

export type ShareholderOverview = {
  totalShares: number;
  holding: { name: string; shares: number; holderType: string } | null;
  currencies: Record<Currency, CurrencyTotals>;
};

const num = (value: unknown) => (typeof value === "number" ? value : Number(value ?? 0));

/**
 * Company totals for shareholders from the shareholder_overview RPC
 * (SECURITY DEFINER, aggregates only), per currency and never converted.
 * Net worth here is a cash-basis book figure, not a market valuation.
 */
export async function getShareholderOverview(): Promise<ShareholderOverview | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("shareholder_overview");
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return null;

  const raw = data as Record<string, unknown>;
  const rawCurrencies = (raw.currencies ?? {}) as Record<string, Record<string, unknown>>;
  const currencies = Object.fromEntries(
    CURRENCIES.map((currency) => {
      const c = rawCurrencies[currency] ?? {};
      const collectedAll = num(c.collected_all);
      const collectedYear = num(c.collected_year);
      const spentAll = num(c.spent_all);
      const spentYear = num(c.spent_year);
      const receivables = num(c.receivables);
      return [
        currency,
        {
          collectedAll,
          collectedYear,
          spentAll,
          spentYear,
          receivables,
          netWorth: collectedAll - spentAll + receivables,
          profitYear: collectedYear - spentYear,
          profitAll: collectedAll - spentAll,
        },
      ];
    }),
  ) as Record<Currency, CurrencyTotals>;

  const holding = raw.holding as Record<string, unknown> | null;
  return {
    totalShares: num(raw.total_shares),
    holding: holding
      ? {
          name: String(holding.name),
          shares: num(holding.shares),
          holderType: String(holding.holder_type),
        }
      : null,
    currencies,
  };
}

/** Ownership as a percentage with two decimals, from share counts only. */
export function ownershipPercent(shares: number, totalShares: number) {
  return totalShares > 0 ? (shares / totalShares) * 100 : 0;
}

/** Value of a holding: its share of a company-level amount (minor units). */
export function holdingValue(amountMinor: number, shares: number, totalShares: number) {
  return totalShares > 0 ? Math.round((amountMinor * shares) / totalShares) : 0;
}

export const formatPercent = (value: number) => `${value.toFixed(2)}%`;
