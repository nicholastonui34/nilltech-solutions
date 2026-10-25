import type { Metadata } from "next";

import { LegalDocumentView } from "@/components/legal/legal-document";
import { Container } from "@/components/sections/container";
import { privacyNotice, termsOfService } from "@/lib/content/legal";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Legal",
  description:
    "NillTech Solutions' privacy notice under the Kenya Data Protection Act, 2019, and the terms that apply to our website and services.",
  path: "/legal",
});

// Content lives in lib/content/legal.ts — the same source as the PDFs at
// /legal/privacy-notice.pdf and /legal/terms-of-service.pdf.
export default function LegalPage() {
  return (
    <section className="py-20">
      <Container className="max-w-2xl">
        <h1 className="text-4xl font-semibold">Legal</h1>
        <nav aria-label="On this page" className="mt-4 flex flex-wrap gap-4 text-sm">
          {[privacyNotice, termsOfService].map((doc) => (
            <a
              key={doc.slug}
              href={`#${doc.anchor}`}
              className="text-primary hover:underline"
            >
              {doc.title}
            </a>
          ))}
        </nav>
        <LegalDocumentView doc={privacyNotice} />
        <LegalDocumentView doc={termsOfService} />
      </Container>
    </section>
  );
}
