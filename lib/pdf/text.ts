import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { rgb, type PDFDocument, type PDFFont } from "pdf-lib";

// Shared by the invoice/receipt PDFs (lib/finance/pdf.ts) and the legal
// document PDFs (lib/legal/pdf.ts).

// Brand tokens (CLAUDE.md §1).
export const NAVY = rgb(6 / 255, 11 / 255, 31 / 255);
export const PURPLE = rgb(91 / 255, 45 / 255, 142 / 255);
export const MUTED = rgb(0.42, 0.45, 0.5);
export const RULE = rgb(0.88, 0.89, 0.92);

export const PAGE_W = 595.28; // A4
export const PAGE_H = 841.89;
export const MARGIN = 48;

/** Standard PDF fonts only cover WinAnsi; replace anything else so drawing never throws. */
export function sanitize(font: PDFFont, text: string) {
  let out = "";
  for (const char of text.normalize("NFC")) {
    try {
      font.encodeText(char);
      out += char;
    } catch {
      out += "?";
    }
  }
  return out;
}

export function wrap(font: PDFFont, text: string, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of sanitize(font, text).split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function loadLogo(doc: PDFDocument) {
  try {
    const bytes = await readFile(
      path.join(process.cwd(), "public/brand/nilltech-logo.jpg"),
    );
    return await doc.embedJpg(bytes);
  } catch {
    return null; // Documents still render without the logo.
  }
}
