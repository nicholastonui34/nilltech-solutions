"use client";

import { useState } from "react";

import { CtaButton } from "@/components/cta/cta-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tier = {
  name: string;
  priceKes: string;
  priceUsd: string;
  timeline: string;
  driversUp: string[];
  driversDown: string[];
};

const tiers: Tier[] = [
  {
    name: "AI-Powered Software Development",
    priceKes: "KES {{PRICE}}",
    priceUsd: "USD {{PRICE}}",
    timeline: "{{PLACEHOLDER: typical timeline}}",
    driversUp: ["{{PLACEHOLDER: driver}}", "{{PLACEHOLDER: driver}}"],
    driversDown: ["{{PLACEHOLDER: driver}}"],
  },
  {
    name: "AI Solutions for SMEs",
    priceKes: "KES {{PRICE}}",
    priceUsd: "USD {{PRICE}}",
    timeline: "{{PLACEHOLDER: typical timeline}}",
    driversUp: ["{{PLACEHOLDER: driver}}", "{{PLACEHOLDER: driver}}"],
    driversDown: ["{{PLACEHOLDER: driver}}"],
  },
  {
    name: "Managed Tech Delivery Teams",
    priceKes: "KES {{PRICE}}",
    priceUsd: "USD {{PRICE}}",
    timeline: "{{PLACEHOLDER: typical timeline}}",
    driversUp: ["{{PLACEHOLDER: driver}}", "{{PLACEHOLDER: driver}}"],
    driversDown: ["{{PLACEHOLDER: driver}}"],
  },
];

export function PricingTiers() {
  const [currency, setCurrency] = useState<"KES" | "USD">("KES");

  return (
    <div>
      <div className="mb-10 flex items-center justify-center gap-2">
        <Button
          type="button"
          variant={currency === "KES" ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrency("KES")}
          aria-pressed={currency === "KES"}
        >
          KES
        </Button>
        <Button
          type="button"
          variant={currency === "USD" ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrency("USD")}
          aria-pressed={currency === "USD"}
        >
          USD
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className="border-border bg-card flex flex-col gap-5 rounded-lg border p-6"
          >
            <h3 className="text-lg font-semibold">{tier.name}</h3>
            <p className="text-2xl font-semibold">
              <span className="text-muted-foreground text-sm font-normal">
                Starting from{" "}
              </span>
              {currency === "KES" ? tier.priceKes : tier.priceUsd}
            </p>
            <p className="text-muted-foreground text-sm">{tier.timeline}</p>

            <div className="text-sm">
              <p className="font-medium">What drives price up</p>
              <ul className={cn("text-muted-foreground mt-1 list-inside list-disc")}>
                {tier.driversUp.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
            <div className="text-sm">
              <p className="font-medium">What drives price down</p>
              <ul className="text-muted-foreground mt-1 list-inside list-disc">
                {tier.driversDown.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <CtaButton intent="quote" className="mt-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
