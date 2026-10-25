import type { Metadata } from "next";

import { Container } from "@/components/sections/container";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Legal",
  description: "{{PLACEHOLDER: meta description for /legal, 150-160 characters}}",
  path: "/legal",
});

export default function LegalPage() {
  return (
    <section className="py-20">
      <Container className="max-w-2xl">
        <h1 className="text-4xl font-semibold">Legal</h1>

        <div className="mt-10">
          <h2 className="text-lg font-semibold">Privacy Policy</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {
              "{{PLACEHOLDER: Kenya Data Protection Act 2019-compliant privacy notice — real legal text, not drafted by Claude}}"
            }
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold">Terms of Service</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {"{{PLACEHOLDER: terms of service — real legal text, not drafted by Claude}}"}
          </p>
        </div>

        <p className="text-muted-foreground mt-10 text-xs">
          Last updated: {"{{PLACEHOLDER: date}}"}
        </p>
      </Container>
    </section>
  );
}
