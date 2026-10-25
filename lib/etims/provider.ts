import "server-only";

/**
 * KRA eTIMS integration point (CLAUDE.md §10). Transmitting invoices to
 * KRA needs either KRA approval (OSCU/VSCU) or a certified third-party
 * integrator — not chosen yet ({{INPUT NEEDED: eTIMS integration route}}).
 * The rest of the app only talks to this interface, so a real adapter can
 * replace the stub without touching invoicing code.
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
