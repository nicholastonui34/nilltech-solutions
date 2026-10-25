import { CtaButton } from "@/components/cta/cta-button";
import { Container } from "@/components/sections/container";
import type { CtaIntent } from "@/config/cta";

type HeroProps = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: CtaIntent;
  secondaryCta?: CtaIntent;
};

/**
 * Signature dark hero — navy surface with the purple→blue gradient glow
 * from the NillTech design system (Figma: "Hero Section"), echoing the
 * gradient "N" mark. Headline is the LCP element: no motion on it, no
 * client JS required to render it.
 */
export function Hero({
  eyebrow,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
}: HeroProps) {
  return (
    <section className="bg-nilltech-navy relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-64 right-0 h-[700px] w-[700px] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(91,45,142,0.55) 0%, rgba(56,189,248,0.22) 55%, rgba(6,11,31,0) 100%)",
        }}
      />
      <Container className="relative py-24 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-nilltech-blue mb-6 text-sm font-medium tracking-[0.12em] uppercase">
            {eyebrow}
          </p>
          <h1 className="text-4xl leading-[1.1] font-semibold text-white sm:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mt-7 text-lg leading-relaxed text-white/60">{subheadline}</p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <CtaButton intent={primaryCta} size="lg" />
            {secondaryCta ? (
              <CtaButton
                intent={secondaryCta}
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/10 hover:text-white"
              />
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
