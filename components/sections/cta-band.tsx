import { CtaButton } from "@/components/cta/cta-button";
import { Container } from "@/components/sections/container";
import type { CtaIntent } from "@/config/cta";

type CtaBandProps = {
  heading: string;
  body: string;
  cta: CtaIntent;
};

/** Closing-of-page CTA — the "end" repeat in CLAUDE.md §4's hero/mid/end pattern. */
export function CtaBand({ heading, body, cta }: CtaBandProps) {
  return (
    <section className="bg-nilltech-navy">
      <Container className="flex flex-col items-center gap-6 py-20 text-center">
        <h2 className="max-w-xl text-3xl font-semibold text-white">{heading}</h2>
        <p className="max-w-lg text-white/60">{body}</p>
        <CtaButton intent={cta} size="lg" />
      </Container>
    </section>
  );
}
