import "server-only";

import {
  PDFDocument,
  StandardFonts,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";

import { siteConfig } from "@/config/site.config";
import { parseInline, type LegalBlock, type LegalDocument } from "@/lib/content/legal";
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

const BODY = 9.5;
const LEADING = 13.5;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_SPACE = 40;
const siteHost = siteConfig.url.replace(/^https?:\/\//, "");

/** Flattens [label](href) for print: external and site links show their address. */
function printable(text: string) {
  return parseInline(text)
    .map((part) => {
      if (!("href" in part)) return part.text;
      if (part.href.startsWith("mailto:")) return part.text;
      if (part.href.startsWith("/")) return `${part.text} (${siteHost}${part.href})`;
      return `${part.text} (${part.href.replace(/^https?:\/\//, "")})`;
    })
    .join("");
}

class Flow {
  pages: PDFPage[] = [];
  page!: PDFPage;
  y = 0;

  constructor(
    readonly doc: PDFDocument,
    readonly fonts: { regular: PDFFont; bold: PDFFont },
    readonly runningTitle: string,
  ) {}

  addPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pages.push(this.page);
    this.y = PAGE_H - MARGIN;
    if (this.pages.length > 1) {
      this.text(`${siteConfig.legalName} · ${this.runningTitle}`, MARGIN, {
        size: 8,
        color: MUTED,
      });
      this.y -= 10;
      this.rule();
      this.y -= 18;
    }
  }

  ensure(height: number) {
    if (this.y - height < MARGIN + FOOTER_SPACE) this.addPage();
  }

  text(
    value: string,
    x: number,
    opts: { size?: number; bold?: boolean; color?: RGB; y?: number } = {},
  ) {
    const font = opts.bold ? this.fonts.bold : this.fonts.regular;
    this.page.drawText(sanitize(font, value), {
      x,
      y: opts.y ?? this.y,
      size: opts.size ?? BODY,
      font,
      color: opts.color ?? NAVY,
    });
  }

  rule() {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 0.75,
      color: RULE,
    });
  }

  /** Wrapped paragraph; keeps at least two lines together across page breaks. */
  paragraph(
    value: string,
    opts: { x?: number; width?: number; bold?: boolean; color?: RGB; size?: number } = {},
  ) {
    const x = opts.x ?? MARGIN;
    const size = opts.size ?? BODY;
    const font = opts.bold ? this.fonts.bold : this.fonts.regular;
    const lines = wrap(font, value, size, opts.width ?? CONTENT_W - (x - MARGIN));
    this.ensure(Math.min(lines.length, 2) * LEADING);
    for (const line of lines) {
      this.ensure(LEADING);
      this.text(line, x, { size, bold: opts.bold, color: opts.color });
      this.y -= LEADING;
    }
  }

  gap(points: number) {
    this.y -= points;
  }
}

function drawBlock(flow: Flow, block: LegalBlock) {
  if (block.type === "p") {
    flow.paragraph(printable(block.text), { color: NAVY });
    flow.gap(6);
    return;
  }
  if (block.type === "list") {
    for (const item of block.items) {
      flow.ensure(LEADING);
      flow.text("•", MARGIN + 4);
      flow.paragraph(printable(item), { x: MARGIN + 16 });
      flow.gap(2);
    }
    flow.gap(4);
    return;
  }
  // Tables print as labelled blocks — readable at A4 width without tiny columns.
  for (const row of block.rows) {
    flow.ensure(LEADING * 3);
    flow.paragraph(row[0], { bold: true });
    for (let i = 1; i < row.length; i++) {
      flow.paragraph(`${block.head[i]}: ${row[i]}`, { x: MARGIN + 10, color: MUTED });
    }
    flow.gap(6);
  }
}

export async function buildLegalPdf(doc: LegalDocument) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${doc.title} — ${siteConfig.legalName}`);
  pdf.setAuthor(siteConfig.legalName);
  pdf.setSubject(doc.title);
  pdf.setProducer(siteHost);

  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const flow = new Flow(pdf, fonts, doc.title);
  flow.addPage();

  // First-page header: logo, company, title, date.
  const logo = await loadLogo(pdf);
  const top = flow.y;
  let textX = MARGIN;
  if (logo) {
    flow.page.drawImage(logo, { x: MARGIN, y: top - 40, width: 40, height: 40 });
    textX = MARGIN + 52;
  }
  flow.text(siteConfig.legalName, textX, { bold: true, size: 11, y: top - 14 });
  flow.text(`${siteHost} · ${siteConfig.contact.email}`, textX, {
    size: 8.5,
    color: MUTED,
    y: top - 28,
  });
  flow.y = top - 72;
  flow.text(doc.title, MARGIN, { bold: true, size: 22, color: PURPLE });
  flow.y -= 18;
  flow.text(`Last updated ${doc.updated}`, MARGIN, { size: 8.5, color: MUTED });
  flow.y -= 14;
  flow.rule();
  flow.y -= 20;

  flow.paragraph(printable(doc.intro));
  flow.gap(8);

  for (const section of doc.sections) {
    flow.ensure(LEADING * 4);
    flow.gap(6);
    flow.text(section.title, MARGIN, { bold: true, size: 12 });
    flow.y -= LEADING + 4;
    for (const block of section.blocks) drawBlock(flow, block);
  }

  // Footer with page numbers, once the page count is known.
  flow.pages.forEach((page, index) => {
    const label = sanitize(
      fonts.regular,
      `${siteHost}/legal · Page ${index + 1} of ${flow.pages.length}`,
    );
    const width = fonts.regular.widthOfTextAtSize(label, 8);
    page.drawText(label, {
      x: (PAGE_W - width) / 2,
      y: MARGIN - 12,
      size: 8,
      font: fonts.regular,
      color: MUTED,
    });
  });

  return pdf.save();
}

export function legalPdfResponse(bytes: Uint8Array, slug: string) {
  return new Response(new Blob([bytes as BlobPart], { type: "application/pdf" }), {
    headers: {
      "Content-Type": "application/pdf",
      // Open in the browser's PDF viewer; saving uses this filename.
      "Content-Disposition": `inline; filename="nilltech-${slug}.pdf"`,
    },
  });
}
