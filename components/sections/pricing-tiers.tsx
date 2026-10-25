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

// Starting prices from config/pricing-rules.ts and ADR 0006. KES is the
// East Africa price; USD is the international (US/UK/Canada) price at the
// 1.5x region multiplier, not a straight currency conversion.
const tiers: Tier[] = [
  {
    name: "AI-Powered Software Development",
    priceKes: "KES 45,000",
    priceUsd: "USD 500",
    timeline: "Websites in 1–7 days · online stores 1–2 weeks · custom systems 2–4 weeks",
    driversUp: [
      "More pages, features and custom integrations",
      "Online payments, user accounts and admin dashboards",
      "Rush timelines",
    ],
    driversDown: [
      "Clear scope and content ready at kickoff",
      "Flexible timelines (3+ months)",
    ],
  },
  {
    name: "AI Solutions for SMEs",
    priceKes: "KES 40,000",
    priceUsd: "USD 450",
    timeline: "Live in 4–10 days · running costs from KES 5,000 / USD 60 a month",
    driversUp: [
      "Connecting to M-Pesa, your CRM or internal systems",
      "Multiple channels (WhatsApp, web, email)",
      "High message volumes (WhatsApp and AI usage billed at cost)",
    ],
    driversDown: ["Starting with one channel and a focused set of questions"],
  },
  {
    name: "Managed Tech Delivery Teams",
    priceKes: "KES 180,000",
    priceUsd: "USD 1,800",
    timeline: "Per developer, per month · team in place in 1–2 weeks",
    driversUp: ["Senior specialists (AI/ML, DevOps)", "Larger teams and extended hours"],
    driversDown: [
      "Longer engagements",
      "Blended teams of mid-level and senior engineers",
    ],
  },
];

export function PricingTiers() {
  const [currency, setCurrency] = useState<"KES" | "USD">("KES");

  return (
    <div>
      <p className="text-muted-foreground mb-3 text-center text-xs">
        KES pricing for East Africa · USD pricing for international clients
      </p>
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
