import type { Metadata } from "next";

import { PRIVACY_NOTICE_UPDATED, PrivacyNotice } from "@/components/legal/privacy-notice";
import { Container } from "@/components/sections/container";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Legal",
  description:
    "How NillTech Solutions collects, uses and protects personal data under the Kenya Data Protection Act, 2019, and your rights over it.",
  path: "/legal",
});

export default function LegalPage() {
  return (
    <section className="py-20">
      <Container className="max-w-2xl">
        <h1 className="text-4xl font-semibold">Legal</h1>

        <div id="privacy" className="mt-10 scroll-mt-24">
          <h2 className="text-2xl font-semibold">Privacy notice</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Last updated {PRIVACY_NOTICE_UPDATED}
          </p>
          <div className="mt-6">
            <PrivacyNotice />
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold">Terms of service</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {"{{PLACEHOLDER: terms of service — real legal text, not drafted by Claude}}"}
          </p>
        </div>
      </Container>
    </section>
  );
}
