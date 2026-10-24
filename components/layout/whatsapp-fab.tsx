"use client";

import { MessageCircle } from "lucide-react";

import { ctaConfig } from "@/config/cta";
import { trackEvent } from "@/lib/analytics";

/** Sticky mobile secondary CTA — CLAUDE.md §5. Hidden on desktop, where the header CTA covers it. */
export function WhatsappFab() {
  const cta = ctaConfig.whatsapp;

  return (
    <a
      href={cta.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent(cta.event, { placement: "fab" })}
      aria-label={cta.label}
      className="bg-nilltech-blue fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 lg:hidden"
    >
      <MessageCircle className="size-6" aria-hidden />
    </a>
  );
}
