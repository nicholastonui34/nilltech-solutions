import "server-only";

import { PDFDocument, StandardFonts } from "pdf-lib";

import { siteConfig } from "@/config/site.config";
import { CONTENT_W, Flow, LEADING, drawBlock } from "@/lib/legal/pdf";
import {
  MARGIN,
  MUTED,
  NAVY,
  PAGE_W,
  PURPLE,
  loadLogo,
  sanitize,
  wrap,
} from "@/lib/pdf/text";
import type { AgreementDocument } from "@/lib/talent/agreements";

const host = siteConfig.url.replace(/^https?:\/\//, "");

/**
 * Freelancer NDA, services agreement and onboarding letter, laid out like
 * NillTech's existing client NDA: company block left, title, reference and
 * date right, the parties side by side, numbered clauses, signature blocks
 * and a reference footer on every page.
 */
export async function buildAgreementPdf(doc: AgreementDocument) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${doc.shortTitle} ${doc.reference} | ${siteConfig.legalName}`);
  pdf.setAuthor(siteConfig.legalName);
  pdf.setSubject(doc.shortTitle);
  pdf.setProducer(host);

  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const flow = new Flow(pdf, fonts, `${doc.shortTitle} · ${doc.reference}`);
  flow.addPage();

  // --- Header ---------------------------------------------------------------
  const top = flow.y;
  const logo = await loadLogo(pdf);
  let textX = MARGIN;
  if (logo) {
    flow.page.drawImage(logo, { x: MARGIN, y: top - 44, width: 44, height: 44 });
    textX = MARGIN + 56;
  }
  flow.text(siteConfig.legalName, textX, { bold: true, size: 12, y: top - 12 });
  flow.text(`${host} | ${siteConfig.contact.email}`, textX, {
    size: 8.5,
    color: MUTED,
    y: top - 26,
  });
  flow.text("Nairobi, Kenya", textX, { size: 8.5, color: MUTED, y: top - 37 });

  const right = PAGE_W - MARGIN;
  const titleLines = wrap(fonts.bold, doc.title, 16, 220);
  let ty = top - 14;
  for (const line of titleLines) {
    const width = fonts.bold.widthOfTextAtSize(line, 16);
    flow.text(line, right - width, { bold: true, size: 16, color: PURPLE, y: ty });
    ty -= 19;
  }
  for (const meta of [`Ref: ${doc.reference}`, `Date: ${doc.date}`]) {
    const safe = sanitize(fonts.regular, meta);
    const width = fonts.regular.widthOfTextAtSize(safe, 8.5);
    flow.text(safe, right - width, { size: 8.5, color: MUTED, y: ty });
    ty -= 12;
  }
  flow.y = Math.min(top - 52, ty) - 10;
  flow.rule();
  flow.gap(22);

  // --- Parties --------------------------------------------------------------
  if (doc.parties) {
    flow.text("PARTIES TO THIS AGREEMENT", MARGIN, { bold: true, size: 10 });
    flow.gap(LEADING + 2);
    const colW = (CONTENT_W - 24) / 2;
    const startY = flow.y;
    let lowest = startY;
    doc.parties.forEach((party, i) => {
      const x = MARGIN + i * (colW + 24);
      let y = startY;
      flow.text(party.heading, x, { bold: true, size: 8, color: MUTED, y });
      y -= 14;
      party.lines.forEach((line, li) => {
        for (const wrapped of wrap(
          li === 0 ? fonts.bold : fonts.regular,
          line,
          9,
          colW,
        )) {
          flow.text(wrapped, x, { size: 9, bold: li === 0, y });
          y -= 12;
        }
      });
      lowest = Math.min(lowest, y);
    });
    flow.y = lowest - 12;
  }

  // --- Body -----------------------------------------------------------------
  for (const paragraph of doc.intro) {
    flow.paragraph(paragraph, { color: NAVY });
    flow.gap(6);
  }
  flow.gap(4);

  for (const section of doc.sections) {
    flow.ensure(LEADING * 4);
    flow.gap(4);
    flow.text(section.title, MARGIN, { bold: true, size: 10.5 });
    flow.y -= LEADING + 2;
    for (const block of section.blocks) drawBlock(flow, block);
  }

  // --- Signatures -----------------------------------------------------------
  flow.gap(8);
  if (doc.signatures.kind === "agreement") {
    flow.ensure(150);
    flow.text("SIGNATURES", MARGIN, { bold: true, size: 10.5 });
    flow.y -= LEADING + 2;
    flow.paragraph(
      "By signing or accepting below, both Parties confirm they have read, understood and agree to be bound by this Agreement.",
    );
    flow.gap(14);
    const colW = (CONTENT_W - 24) / 2;
    const cols = [
      {
        heading: doc.signatures.left.heading,
        name: doc.signatures.left.name,
        sub: doc.signatures.left.title,
      },
      {
        heading: doc.signatures.right.heading,
        name: doc.signatures.right.name,
        sub: "Contractor",
      },
    ];
    const startY = flow.y;
    cols.forEach((col, i) => {
      const x = MARGIN + i * (colW + 24);
      flow.text(col.heading, x, { bold: true, size: 8, color: MUTED, y: startY });
      flow.page.drawLine({
        start: { x, y: startY - 44 },
        end: { x: x + colW - 10, y: startY - 44 },
        thickness: 0.75,
        color: NAVY,
      });
      flow.text(col.name, x, { bold: true, size: 9.5, y: startY - 58 });
      flow.text(`${col.sub} · Signature / Date`, x, {
        size: 8,
        color: MUTED,
        y: startY - 70,
      });
    });
    flow.y = startY - 90;
  } else {
    flow.ensure(90);
    flow.paragraph("Welcome aboard. We look forward to building great things together.");
    flow.gap(10);
    flow.paragraph("Yours sincerely,");
    flow.gap(30);
    flow.text(doc.signatures.name, MARGIN, { bold: true, size: 9.5 });
    flow.y -= 12;
    flow.text(`${doc.signatures.title}, ${siteConfig.legalName}`, MARGIN, {
      size: 8.5,
      color: MUTED,
    });
    flow.y -= 18;
  }

  if (doc.acceptanceNote) {
    flow.paragraph(doc.acceptanceNote, { color: MUTED, size: 8 });
  }

  // --- Footer on every page ------------------------------------------------
  flow.pages.forEach((page, index) => {
    const lines = [
      ...wrap(fonts.regular, doc.footer, 7, CONTENT_W),
      `Page ${index + 1} of ${flow.pages.length}`,
    ];
    lines.forEach((line, li) => {
      const safe = sanitize(fonts.regular, line);
      const width = fonts.regular.widthOfTextAtSize(safe, 7);
      page.drawText(safe, {
        x: (PAGE_W - width) / 2,
        y: MARGIN - 8 - li * 9,
        size: 7,
        font: fonts.regular,
        color: MUTED,
      });
    });
  });

  return pdf.save();
}
