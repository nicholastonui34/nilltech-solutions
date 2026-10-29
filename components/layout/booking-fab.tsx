"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock } from "lucide-react";

import { trackEvent } from "@/lib/analytics";

/**
 * Sticky mobile CTA (CLAUDE.md §5): books a call. Replaced the WhatsApp
 * bubble on 2026-10-29 (owner: booking first, WhatsApp secondary). Hidden on
 * desktop, where the header CTA covers it, and on /book itself.
 */
export function BookingFab() {
  const pathname = usePathname();
  if (pathname === "/book") return null;

  return (
    <Link
      href="/book"
      onClick={() => trackEvent("cta_click", { placement: "fab", intent: "book" })}
      className="bg-nilltech-purple fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 lg:hidden"
    >
      <CalendarClock className="size-5" aria-hidden />
      Book a call
    </Link>
  );
}
