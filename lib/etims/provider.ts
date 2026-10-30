import "server-only";

/**
 * KRA eTIMS integration point (CLAUDE.md §10). For now Finance issues each
 * invoice in KRA's own eTIMS and records the KRA number in the portal
 * (owner, 2026-10-30; `record_invoice_etims`, migration …24). Sending
 * invoices automatically needs KRA approval (OSCU/VSCU) or a certified
 * integrator. A real adapter replaces the stub here and fills the same
 * fields, without touching invoicing code.
 */
export type EtimsInvoice = {
  invoiceId: string;
  number: string;
  issueDate: string;
  currency: "KES" | "USD";
  totalMinor: number;
  sellerPin: string | null;
  buyerName: string;
  items: {
    description: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
  }[];
};

export type EtimsResult =
  | { status: "submitted"; reference: string }
  | { status: "not_configured" }
  | { status: "failed"; error: string };

export interface EtimsProvider {
  submitInvoice(invoice: EtimsInvoice): Promise<EtimsResult>;
}

/** Records that nothing was sent. Never pretends a submission happened. */
class StubEtimsProvider implements EtimsProvider {
  async submitInvoice(): Promise<EtimsResult> {
    return { status: "not_configured" };
  }
}

export function getEtimsProvider(): EtimsProvider {
  return new StubEtimsProvider();
}
