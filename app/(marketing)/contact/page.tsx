import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Mail, MessageCircle, Phone } from "lucide-react";

import { ContactForm } from "@/components/sections/contact-form";
import { Container } from "@/components/sections/container";
import { TrackedLink } from "@/components/sections/tracked-link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site.config";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Contact NillTech Solutions in Nairobi: book a free call online, send us your project details, email info@nilltechsolutions.com or call +254 725 830 334.",
  path: "/contact",
});

// The lead-capture form writes to `leads` (CLAUDE.md §9, Phase 3) via a
// server action. It degrades gracefully — on-screen success/error either
// way — if SUPABASE_SERVICE_ROLE_KEY isn't configured yet. Direct contact
// methods stay alongside it as a redundant, always-working fallback.
// Booking a call is the main route (owner, 2026-10-29); WhatsApp stays here
// as a secondary channel for visitors who'd rather message.
const methods = [
  {
    icon: Mail,
    label: "Email",
    value: siteConfig.contact.email,
    href: `mailto:${siteConfig.contact.email}`,
    event: "cta_click" as const,
  },
  {
    icon: Phone,
    label: "Call",
    value: siteConfig.contact.phoneDisplay,
    href: `tel:${siteConfig.contact.phone}`,
    event: "call_click" as const,
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Message us on WhatsApp",
    href: siteConfig.contact.whatsapp,
    event: "whatsapp_click" as const,
  },
];

export default function ContactPage() {
  return (
    <section className="py-20">
      <Container className="max-w-5xl">
        <h1 className="text-4xl font-semibold">Contact</h1>
        <p className="text-muted-foreground mt-4 max-w-xl">
          Tell us what you&rsquo;re working on. We reply to every enquiry, usually within
          one working day.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ContactForm />
          </div>

          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="border-primary bg-primary/5 rounded-lg border-2 p-6">
              <CalendarClock className="text-nilltech-purple size-7" aria-hidden />
              <p className="mt-3 font-semibold">Prefer to talk it through?</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Book a free 30-minute call at a time that suits you.
              </p>
              <Button asChild className="mt-4">
                <Link href="/book">Book a call</Link>
              </Button>
            </div>

            {methods.map((m) => (
              <TrackedLink
                key={m.label}
                href={m.href}
                event={m.event}
                className="border-border bg-card flex items-center gap-4 rounded-lg border p-5 transition-shadow hover:shadow-md"
              >
                <span className="bg-nilltech-purple/10 flex size-11 items-center justify-center rounded-full">
                  <m.icon className="text-nilltech-purple size-5" aria-hidden />
                </span>
                <span>
                  <span className="text-muted-foreground block text-xs">{m.label}</span>
                  <span className="font-medium">{m.value}</span>
                </span>
              </TrackedLink>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
