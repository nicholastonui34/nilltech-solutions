import { Container } from "@/components/sections/container";

type Step = { title: string; description: string };

export function ProcessSteps({ steps }: { steps: Step[] }) {
  return (
    <section className="bg-muted/40 py-20">
      <Container>
        <h2 className="mb-10 text-2xl font-semibold">How it works</h2>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-2">
              <span className="text-nilltech-purple text-sm font-semibold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="font-semibold">{step.title}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
