import type { Metadata } from "next";

import { CtaBand } from "@/components/sections/cta-band";
import { Container } from "@/components/sections/container";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: "{{PLACEHOLDER: meta description for /about, 150-160 characters}}",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <section className="py-20">
        <Container className="max-w-3xl">
          <p className="text-nilltech-purple text-sm font-medium tracking-[0.12em] uppercase">
            About
          </p>
          <h1 className="mt-4 text-4xl font-semibold">NillTech Solutions</h1>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed">
            {"{{PLACEHOLDER: company story / positioning narrative}}"}
          </p>

          <h2 className="mt-14 text-2xl font-semibold">Founders</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            {[
              "{{PLACEHOLDER: founder 1 name/role/credentials}}",
              "{{PLACEHOLDER: founder 2 name/role/credentials}}",
            ].map((f) => (
              <p key={f} className="text-muted-foreground text-sm">
                {f}
              </p>
            ))}
          </div>

          <p className="text-muted-foreground mt-14 text-xs">
            Last updated: {"{{PLACEHOLDER: date}}"}
          </p>
        </Container>
      </section>

      <CtaBand
        heading="{{PLACEHOLDER: closing CTA heading}}"
        body="{{PLACEHOLDER: closing CTA body}}"
        cta="discovery-call"
      />
    </>
  );
}
