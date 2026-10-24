import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container } from "@/components/sections/container";
import { JsonLd } from "@/components/seo/json-ld";
import { faqSchema } from "@/lib/jsonld";

type FaqItem = { question: string; answer: string };

export function Faq({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="py-20">
      <JsonLd data={faqSchema(items)} />
      <Container className="max-w-3xl">
        <h2 className="mb-8 text-2xl font-semibold">Frequently asked questions</h2>
        <Accordion type="single" collapsible>
          {items.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  );
}
