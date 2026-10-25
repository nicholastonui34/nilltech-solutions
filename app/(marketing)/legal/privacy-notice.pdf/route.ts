import { privacyNotice } from "@/lib/content/legal";
import { buildLegalPdf, legalPdfResponse } from "@/lib/legal/pdf";

// Generated from lib/content/legal.ts — the same source as /legal.
export async function GET() {
  return legalPdfResponse(await buildLegalPdf(privacyNotice), privacyNotice.slug);
}
