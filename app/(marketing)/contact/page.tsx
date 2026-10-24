import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";

import { Container } from "@/components/sections/container";
import { TrackedLink } from "@/components/sections/tracked-link";
import { siteConfig } from "@/config/site.config";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "{{PLACEHOLDER: meta description for /contact, 150-160 characters}}",
  path: "/contact",
});

// A validated lead-capture form lands with the lead engine (CLAUDE.md §9,
// Phase 3) once there's a `leads` table and Resend to notify sales.
// Shipping a form now that doesn't actually go anywhere would be worse
// than no form — these are real, working contact methods instead.
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
    value: siteConfig.contact.phoneDisplay,
    href: siteConfig.contact.whatsapp,
    event: "whatsapp_click" as const,
  },
];

export default function ContactPage() {
  return (
    <section className="py-20">
      <Container className="max-w-2xl">
        <h1 className="text-4xl font-semibold">Contact</h1>
        <p className="text-muted-foreground mt-4">
          {"{{PLACEHOLDER: one sentence inviting the visitor to reach out}}"}
        </p>

        <div className="mt-12 flex flex-col gap-4">
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
      </Container>
    </section>
  );
}
