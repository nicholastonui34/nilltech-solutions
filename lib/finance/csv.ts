/**
 * Minimal RFC 4180 CSV writer for the finance exports. Text cells that
 * start with = + - @ (or a tab/CR) are prefixed with an apostrophe so a
 * spreadsheet never runs them as formulas (CSV injection). Numbers are
 * written as-is.
 */
export type CsvCell = string | number | null | undefined;

function escapeCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "number") return String(cell);
  let text = cell;
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: CsvCell[][]) {
  // Byte order mark so Excel opens UTF-8 (names with accents) correctly.
  return (
    "﻿" +
    [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n") +
    "\r\n"
  );
}

/** Minor units to a plain decimal string ("1234.50"), no separators. */
export function csvAmount(minor: number) {
  return (minor / 100).toFixed(2);
}
