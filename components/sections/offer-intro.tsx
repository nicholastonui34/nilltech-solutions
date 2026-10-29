import { Container } from "@/components/sections/container";

type OfferIntroProps = {
  summary: string;
  audience: string[];
  startingFrom: string;
  /** Label above the price, for offers quoted per project instead of from a published price. */
  priceLabel?: string;
};

/** "Who it's for" + "Starting from" — the answer-first block every offer page needs (CLAUDE.md §4). */
export function OfferIntro({
  summary,
  audience,
  startingFrom,
  priceLabel = "Starting from",
}: OfferIntroProps) {
  return (
    <section className="py-16">
      <Container className="grid gap-10 lg:grid-cols-3">
        <p className="text-lg leading-relaxed lg:col-span-2">{summary}</p>
        <div className="border-border flex flex-col gap-6 border-l pl-8">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Who it&rsquo;s for
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {audience.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {priceLabel}
            </p>
            <p className="mt-1 text-xl font-semibold">{startingFrom}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
