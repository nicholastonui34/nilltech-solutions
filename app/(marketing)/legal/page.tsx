import type { Metadata } from "next";

import { PRIVACY_NOTICE_UPDATED, PrivacyNotice } from "@/components/legal/privacy-notice";
import { TERMS_UPDATED, TermsOfService } from "@/components/legal/terms-of-service";
import { Container } from "@/components/sections/container";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Legal",
  description:
    "NillTech Solutions' privacy notice under the Kenya Data Protection Act, 2019, and the terms that apply to our website and services.",
  path: "/legal",
});

export default function LegalPage() {
  return (
    <section className="py-20">
      <Container className="max-w-2xl">
        <h1 className="text-4xl font-semibold">Legal</h1>
        <nav aria-label="On this page" className="mt-4 flex gap-4 text-sm">
          <a href="#privacy" className="text-primary hover:underline">
            Privacy notice
          </a>
          <a href="#terms" className="text-primary hover:underline">
            Terms of service
          </a>
        </nav>

        <div id="privacy" className="mt-10 scroll-mt-24">
          <h2 className="text-2xl font-semibold">Privacy notice</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Last updated {PRIVACY_NOTICE_UPDATED}
          </p>
          <div className="mt-6">
            <PrivacyNotice />
          </div>
        </div>

        <div id="terms" className="mt-16 scroll-mt-24">
          <h2 className="text-2xl font-semibold">Terms of service</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Last updated {TERMS_UPDATED}
          </p>
          <div className="mt-6">
            <TermsOfService />
          </div>
        </div>
      </Container>
    </section>
  );
}
