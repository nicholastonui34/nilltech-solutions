import "server-only";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";

import { formatAmount, type Currency } from "@/lib/finance/money";
import {
  MARGIN,
  MUTED,
  NAVY,
  PAGE_H,
  PAGE_W,
  PURPLE,
  RULE,
  loadLogo,
  sanitize,
  wrap,
} from "@/lib/pdf/text";
import type { ClientSnapshot, SellerSnapshot } from "@/lib/finance/snapshots";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/finance/labels";

export type InvoicePdfData = {
  number: string;
  issueDate: string;
  dueDate: string;
  status: "issued" | "partially_paid" | "paid" | "void" | "credited";
  currency: Currency;
  seller: SellerSnapshot;
  client: ClientSnapshot;
  items: {
    description: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
  }[];
  totalMinor: number;
  paidMinor: number;
  creditedMinor: number;
  refundedMinor: number;
  notes: string | null;
};

export type QuotePdfData = {
  number: string;
  issueDate: string;
  validUntil: string;
  title: string | null;
  currency: Currency;
  seller: SellerSnapshot;
  client: ClientSnapshot;
  items: PdfItem[];
  totalMinor: number;
  notes: string | null;
};

export type CreditNotePdfData = {
  number: string;
  issueDate: string;
  invoiceNumber: string;
  invoiceTotalMinor: number;
  amountMinor: number;
  currency: Currency;
  reason: string;
  seller: SellerSnapshot;
  client: ClientSnapshot;
};

export type ReceiptPdfData = {
  receiptNumber: string;
  paidOn: string;
  amountMinor: number;
  currency: Currency;
  method: PaymentMethod;
  reference: string | null;
  invoiceNumber: string;
  invoiceTotalMinor: number;
  paidToDateMinor: number;
  /** Credit notes issued up to this receipt. */
  creditedToDateMinor: number;
  seller: SellerSnapshot;
  client: ClientSnapshot;
};

type Fonts = { regular: PDFFont; bold: PDFFont };

class Writer {
  y = PAGE_H - MARGIN;
  constructor(
    readonly page: PDFPage,
    readonly fonts: Fonts,
  ) {}

  text(
    value: string,
    x: number,
    opts: {
      size?: number;
      bold?: boolean;
      color?: RGB;
      align?: "left" | "right";
      y?: number;
    } = {},
  ) {
    const font = opts.bold ? this.fonts.bold : this.fonts.regular;
    const size = opts.size ?? 9.5;
    const safe = sanitize(font, value);
    const width = font.widthOfTextAtSize(safe, size);
    this.page.drawText(safe, {
      x: opts.align === "right" ? x - width : x,
      y: opts.y ?? this.y,
      size,
      font,
      color: opts.color ?? NAVY,
    });
  }

  rule(y = this.y) {
    this.page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.75,
      color: RULE,
    });
  }
}

async function newDocument(title: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setProducer("NillTech portal");
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  return { doc, w: new Writer(page, fonts) };
}

/** Logo + seller block on the left, document title + meta rows on the right. */
async function drawHeader(
  doc: PDFDocument,
  w: Writer,
  seller: SellerSnapshot,
  title: string,
  meta: [string, string][],
) {
  const top = w.y;
  const logo = await loadLogo(doc);
  let textX = MARGIN;
  if (logo) {
    w.page.drawImage(logo, { x: MARGIN, y: top - 44, width: 44, height: 44 });
    textX = MARGIN + 56;
  }

  w.text(seller.legal_name, textX, { bold: true, size: 12, y: top - 12 });
  let y = top - 26;
  const sellerLines = [
    ...seller.address_lines,
    seller.kra_pin ? `KRA PIN: ${seller.kra_pin}` : null,
    [seller.email, seller.phone].filter(Boolean).join(" · ") || null,
  ].filter((line): line is string => Boolean(line));
  for (const line of sellerLines) {
    w.text(line, textX, { size: 8.5, color: MUTED, y });
    y -= 11;
  }

  const right = PAGE_W - MARGIN;
  w.text(title, right, {
    bold: true,
    size: 22,
    color: PURPLE,
    align: "right",
    y: top - 18,
  });
  let metaY = top - 38;
  for (const [label, value] of meta) {
    const valueWidth = w.fonts.bold.widthOfTextAtSize(sanitize(w.fonts.bold, value), 9);
    w.text(label, right - valueWidth - 10, {
      size: 8.5,
      color: MUTED,
      align: "right",
      y: metaY,
    });
    w.text(value, right, { size: 9, bold: true, align: "right", y: metaY });
    metaY -= 13;
  }

  w.y = Math.min(y, metaY) - 14;
  w.rule();
  w.y -= 22;
}

function drawParty(w: Writer, heading: string, client: ClientSnapshot) {
  w.text(heading, MARGIN, { size: 8, bold: true, color: MUTED });
  w.y -= 14;
  w.text(client.company ?? client.name, MARGIN, { bold: true, size: 10.5 });
  w.y -= 13;
  const lines = [
    client.company ? client.name : null,
    client.address,
    client.email,
    client.phone,
  ].filter((line): line is string => Boolean(line));
  for (const line of lines) {
    for (const wrapped of wrap(w.fonts.regular, line, 9, 260)) {
      w.text(wrapped, MARGIN, { size: 9, color: MUTED });
      w.y -= 12;
    }
  }
  w.y -= 12;
}

/** PAID / VOID marker, drawn beside the bill-to block where it can't cover figures. */
function drawStamp(w: Writer, label: string, color: RGB) {
  const size = 40;
  const width = w.fonts.bold.widthOfTextAtSize(label, size);
  w.page.drawText(label, {
    x: PAGE_W - MARGIN - width,
    y: w.y - 40,
    size,
    font: w.fonts.bold,
    color,
    opacity: 0.25,
  });
}

function drawPaymentDetails(w: Writer, seller: SellerSnapshot, currency: Currency) {
  const mpesa: [string, string][] = seller.mpesa_paybill
    ? [
        ["Paybill", seller.mpesa_paybill],
        ["Account number", seller.mpesa_account ?? "n/a"],
        // The name M-Pesa shows the payer before they confirm.
        ["Account name", seller.legal_name],
      ]
    : [];
  const bank: [string, string][] = seller.bank_account_number
    ? [
        ["Account name", seller.bank_account_name],
        ["Account number", seller.bank_account_number],
        ["Bank", seller.bank_name],
        ["Branch", seller.bank_branch],
        ["SWIFT", seller.bank_swift],
        ["Account currency", seller.bank_account_currency],
      ].filter((row): row is [string, string] => Boolean(row[1]))
    : [];

  // M-Pesa first for KES invoices, bank transfer first for USD.
  const blocks: [string, [string, string][]][] = (
    currency === "KES"
      ? [
          ["Pay by M-Pesa", mpesa],
          ["Pay by bank transfer", bank],
        ]
      : [
          ["Pay by bank transfer", bank],
          ["Pay by M-Pesa", mpesa],
        ]
  ).filter((block): block is [string, [string, string][]] => block[1].length > 0);

  if (!blocks.length) return;

  w.text("PAYMENT DETAILS", MARGIN, { size: 8, bold: true, color: MUTED });
  w.y -= 16;
  const colWidth = (PAGE_W - MARGIN * 2) / 2;
  const startY = w.y;
  let lowest = startY;
  blocks.forEach(([heading, rows], index) => {
    const x = MARGIN + index * colWidth;
    let y = startY;
    w.text(heading, x, { bold: true, size: 9.5, y });
    y -= 14;
    for (const [label, value] of rows) {
      w.text(label, x, { size: 8.5, color: MUTED, y });
      for (const line of wrap(w.fonts.regular, value, 8.5, colWidth - 100)) {
        w.text(line, x + 90, { size: 8.5, y });
        y -= 12;
      }
    }
    lowest = Math.min(lowest, y);
  });
  w.y = lowest - 10;
}

function drawFooter(w: Writer, seller: SellerSnapshot) {
  if (!seller.invoice_footer) return;
  const text = sanitize(w.fonts.regular, seller.invoice_footer);
  const width = w.fonts.regular.widthOfTextAtSize(text, 8.5);
  w.text(text, (PAGE_W - width) / 2, { size: 8.5, color: MUTED, y: MARGIN - 8 });
}

type PdfItem = {
  description: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

/** Line items table (invoices and quotes). Returns the column positions for totals. */
function drawItems(w: Writer, items: PdfItem[], currency: Currency) {
  const right = PAGE_W - MARGIN;
  const cols = { qty: right - 200, unit: right - 90, amount: right };
  w.page.drawRectangle({
    x: MARGIN,
    y: w.y - 6,
    width: PAGE_W - MARGIN * 2,
    height: 20,
    color: rgb(0.96, 0.95, 0.98),
  });
  w.text("Description", MARGIN + 8, { size: 8.5, bold: true });
  w.text("Qty", cols.qty, { size: 8.5, bold: true, align: "right" });
  w.text("Unit price", cols.unit, { size: 8.5, bold: true, align: "right" });
  w.text(`Amount (${currency})`, cols.amount - 8, {
    size: 8.5,
    bold: true,
    align: "right",
  });
  w.y -= 24;

  for (const item of items) {
    const lines = wrap(w.fonts.regular, item.description, 9.5, cols.qty - MARGIN - 60);
    w.text(lines[0], MARGIN + 8);
    w.text(String(item.quantity), cols.qty, { align: "right" });
    w.text(formatAmount(item.unitPriceMinor), cols.unit, { align: "right" });
    w.text(formatAmount(item.lineTotalMinor), cols.amount - 8, { align: "right" });
    for (const extra of lines.slice(1)) {
      w.y -= 12;
      w.text(extra, MARGIN + 8);
    }
    w.y -= 10;
    w.rule(w.y + 4);
    w.y -= 10;
  }

  return cols;
}

function drawNotes(w: Writer, notes: string | null, heading = "NOTES") {
  if (!notes) return;
  w.text(heading, MARGIN, { size: 8, bold: true, color: MUTED });
  w.y -= 14;
  for (const paragraph of notes.split("\n")) {
    for (const line of wrap(w.fonts.regular, paragraph, 9, PAGE_W - MARGIN * 2)) {
      w.text(line, MARGIN, { size: 9 });
      w.y -= 12;
    }
  }
  w.y -= 12;
}

export async function buildInvoicePdf(data: InvoicePdfData) {
  const { doc, w } = await newDocument(`Invoice ${data.number}`);
  const balance =
    data.totalMinor - data.creditedMinor - (data.paidMinor - data.refundedMinor);

  await drawHeader(doc, w, data.seller, "INVOICE", [
    ["Invoice no.", data.number],
    ["Issue date", data.issueDate],
    ["Due date", data.dueDate],
    ["Currency", data.currency],
  ]);

  if (data.status === "paid") drawStamp(w, "PAID", rgb(0.05, 0.55, 0.3));
  if (data.status === "void") drawStamp(w, "VOID", rgb(0.75, 0.1, 0.1));
  if (data.status === "credited") drawStamp(w, "CREDITED", rgb(0.1, 0.4, 0.65));

  drawParty(w, "BILL TO", data.client);

  const cols = drawItems(w, data.items, data.currency);

  // Totals
  w.y -= 4;
  const totals: [string, string, boolean][] = [
    ["Total", `${data.currency} ${formatAmount(data.totalMinor)}`, true],
  ];
  const money = (minor: number) => `${data.currency} ${formatAmount(minor)}`;
  if (data.creditedMinor > 0) {
    totals.push(["Less credit notes", money(data.creditedMinor), false]);
  }
  if (data.paidMinor > 0) totals.push(["Paid", money(data.paidMinor), false]);
  if (data.refundedMinor > 0) totals.push(["Refunded", money(data.refundedMinor), false]);
  if (data.creditedMinor > 0 || data.paidMinor > 0) {
    totals.push([
      balance < 0 ? "Credit due to you" : "Balance due",
      money(Math.abs(balance)),
      true,
    ]);
  }
  for (const [label, value, bold] of totals) {
    w.text(label, cols.unit - 40, { bold, size: bold ? 10.5 : 9.5, align: "right" });
    w.text(value, cols.amount - 8, { bold, size: bold ? 10.5 : 9.5, align: "right" });
    w.y -= 16;
  }
  w.y -= 14;

  drawNotes(w, data.notes);

  if (data.status !== "void" && balance > 0) {
    w.rule();
    w.y -= 20;
    drawPaymentDetails(w, data.seller, data.currency);
    const confirmTo = data.seller.email ? ` to ${data.seller.email}` : "";
    w.text(
      `After paying, please send the M-Pesa or bank confirmation${confirmTo}, quoting ${data.number}.`,
      MARGIN,
      { size: 8.5, color: MUTED },
    );
  }

  drawFooter(w, data.seller);
  return doc.save();
}

export async function buildReceiptPdf(data: ReceiptPdfData) {
  const { doc, w } = await newDocument(`Receipt ${data.receiptNumber}`);
  const balance =
    data.invoiceTotalMinor - data.creditedToDateMinor - data.paidToDateMinor;

  await drawHeader(doc, w, data.seller, "RECEIPT", [
    ["Receipt no.", data.receiptNumber],
    ["Date paid", data.paidOn],
    ["For invoice", data.invoiceNumber],
  ]);

  drawParty(w, "RECEIVED FROM", data.client);

  w.y -= 8;
  w.page.drawRectangle({
    x: MARGIN,
    y: w.y - 44,
    width: PAGE_W - MARGIN * 2,
    height: 52,
    color: rgb(0.96, 0.95, 0.98),
  });
  w.text("Amount received", MARGIN + 14, { size: 9, color: MUTED, y: w.y - 12 });
  w.text(`${data.currency} ${formatAmount(data.amountMinor)}`, MARGIN + 14, {
    size: 18,
    bold: true,
    y: w.y - 34,
  });
  w.y -= 74;

  const rows: [string, string][] = [
    ["Payment method", PAYMENT_METHOD_LABELS[data.method]],
    ["Reference", data.reference ?? "n/a"],
    ["Invoice total", `${data.currency} ${formatAmount(data.invoiceTotalMinor)}`],
    ...(data.creditedToDateMinor > 0
      ? ([
          [
            "Credit notes to date",
            `${data.currency} ${formatAmount(data.creditedToDateMinor)}`,
          ],
        ] as [string, string][])
      : []),
    ["Paid to date", `${data.currency} ${formatAmount(data.paidToDateMinor)}`],
    ["Balance remaining", `${data.currency} ${formatAmount(Math.max(balance, 0))}`],
  ];
  for (const [label, value] of rows) {
    w.text(label, MARGIN, { size: 9.5, color: MUTED });
    w.text(value, MARGIN + 140, { size: 9.5, bold: label === "Balance remaining" });
    w.y -= 16;
  }

  w.y -= 10;
  w.text("Thank you. This receipt confirms the payment above.", MARGIN, {
    size: 9,
    color: MUTED,
  });

  drawFooter(w, data.seller);
  return doc.save();
}

export async function buildCreditNotePdf(data: CreditNotePdfData) {
  const { doc, w } = await newDocument(`Credit note ${data.number}`);

  await drawHeader(doc, w, data.seller, "CREDIT NOTE", [
    ["Credit note no.", data.number],
    ["Date", data.issueDate],
    ["Against invoice", data.invoiceNumber],
    ["Currency", data.currency],
  ]);

  drawParty(w, "ISSUED TO", data.client);

  w.y -= 8;
  w.page.drawRectangle({
    x: MARGIN,
    y: w.y - 44,
    width: PAGE_W - MARGIN * 2,
    height: 52,
    color: rgb(0.96, 0.95, 0.98),
  });
  w.text("Amount credited", MARGIN + 14, { size: 9, color: MUTED, y: w.y - 12 });
  w.text(`${data.currency} ${formatAmount(data.amountMinor)}`, MARGIN + 14, {
    size: 18,
    bold: true,
    y: w.y - 34,
  });
  w.y -= 74;

  const rows: [string, string][] = [
    ["Invoice", data.invoiceNumber],
    ["Invoice total", `${data.currency} ${formatAmount(data.invoiceTotalMinor)}`],
  ];
  for (const [label, value] of rows) {
    w.text(label, MARGIN, { size: 9.5, color: MUTED });
    w.text(value, MARGIN + 140, { size: 9.5 });
    w.y -= 16;
  }

  w.y -= 8;
  w.text("REASON", MARGIN, { size: 8, bold: true, color: MUTED });
  w.y -= 14;
  for (const line of wrap(w.fonts.regular, data.reason, 9.5, PAGE_W - MARGIN * 2)) {
    w.text(line, MARGIN, { size: 9.5 });
    w.y -= 13;
  }

  w.y -= 12;
  w.text(
    `This credit note reduces the amount due on invoice ${data.invoiceNumber} by the amount above.`,
    MARGIN,
    { size: 9, color: MUTED },
  );

  drawFooter(w, data.seller);
  return doc.save();
}

export async function buildQuotePdf(data: QuotePdfData) {
  const { doc, w } = await newDocument(`Quote ${data.number}`);

  await drawHeader(doc, w, data.seller, "QUOTE", [
    ["Quote no.", data.number],
    ["Date", data.issueDate],
    ["Valid until", data.validUntil],
    ["Currency", data.currency],
  ]);

  drawParty(w, "PREPARED FOR", data.client);

  if (data.title) {
    w.text(data.title, MARGIN, { bold: true, size: 12 });
    w.y -= 22;
  }

  const cols = drawItems(w, data.items, data.currency);

  w.y -= 4;
  w.text("Total", cols.unit - 40, { bold: true, size: 10.5, align: "right" });
  w.text(`${data.currency} ${formatAmount(data.totalMinor)}`, cols.amount - 8, {
    bold: true,
    size: 10.5,
    align: "right",
  });
  w.y -= 30;

  drawNotes(w, data.notes, "SCOPE AND NOTES");

  w.rule();
  w.y -= 18;
  const replyTo = data.seller.email ? ` Reply to ${data.seller.email}` : " Reply";
  for (const line of wrap(
    w.fonts.regular,
    `This quote is valid until ${data.validUntil}.${replyTo} quoting ${data.number} to accept it, and we will send an invoice. Prices are in ${data.currency}. We are not VAT-registered, so no VAT is added.`,
    8.5,
    PAGE_W - MARGIN * 2,
  )) {
    w.text(line, MARGIN, { size: 8.5, color: MUTED });
    w.y -= 11;
  }

  drawFooter(w, data.seller);
  return doc.save();
}
