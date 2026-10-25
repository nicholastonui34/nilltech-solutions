"use client";

import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ctaConfig } from "@/config/cta";
import { trackEvent } from "@/lib/analytics";

/**
 * Click-to-load Cal.com entry point (CLAUDE.md §5) — nothing loads until
 * clicked, so it never costs LCP. No NEXT_PUBLIC_CAL_COM_LINK is set yet
 * (open input), so this falls back to WhatsApp/contact rather than
 * linking to a booking flow that doesn't exist.
 */
export function BookingFacade() {
  const calLink = process.env.NEXT_PUBLIC_CAL_COM_LINK;

  if (!calLink) {
    return (
      <div className="border-border bg-muted/40 rounded-lg border p-6 text-center">
        <p className="font-medium">Prefer to talk it through?</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Online booking is coming soon. Message us on WhatsApp in the meantime.
        </p>
        <a
          href={ctaConfig.whatsapp.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("whatsapp_click", { placement: "booking_facade" })}
        >
          <Button variant="outline" className="mt-4">
            <MessageCircle className="size-4" aria-hidden />
            {ctaConfig.whatsapp.label}
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="border-border bg-muted/40 rounded-lg border p-6 text-center">
      <p className="font-medium">Pick a time that works for you</p>
      <Button
        className="mt-4"
        onClick={() => {
          // Only a click, not a real booking — booking_complete needs a
          // Cal.com webhook/embed callback we don't have without a real link.
          trackEvent("cta_click", { placement: "booking_facade" });
          window.open(calLink, "_blank", "noopener,noreferrer");
        }}
      >
        Book a call
      </Button>
    </div>
  );
}
